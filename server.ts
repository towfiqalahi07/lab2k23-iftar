import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import axios from 'axios';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = process.env.VERCEL === '1';
const dbPath = isVercel ? path.join("/tmp", "registrations.db") : "registrations.db";
const db = new Database(dbPath);

// Initialize database with schema check
const tableInfo = db.prepare("PRAGMA table_info(registrations)").all() as any[];
if (tableInfo.length > 0) {
  const hasAccessCode = tableInfo.some(col => col.name === 'access_code');
  if (!hasAccessCode) {
    console.log("Migrating database: adding access_code column");
    try {
      db.exec("ALTER TABLE registrations ADD COLUMN access_code TEXT UNIQUE");
      // Update existing rows with a random code
      const rows = db.prepare("SELECT id FROM registrations").all() as { id: number }[];
      const updateStmt = db.prepare("UPDATE registrations SET access_code = ? WHERE id = ?");
      for (const row of rows) {
        updateStmt.run(generateAccessCode(), row.id);
      }
      // Now make it NOT NULL (SQLite doesn't support ALTER COLUMN NOT NULL easily, 
      // but we'll just leave it as is for now since it's a dev environment)
    } catch (e) {
      console.error("Migration failed, dropping table for fresh start", e);
      db.exec("DROP TABLE registrations");
    }
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    batch_id TEXT NOT NULL,
    sponsored_count INTEGER DEFAULT 0,
    total_paid INTEGER NOT NULL,
    access_code TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    invoice_id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    data TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

function generateAccessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/stats", (req, res) => {
    const stats = db.prepare("SELECT SUM(sponsored_count) as total_sponsored, COUNT(*) as total_registrations, SUM(total_paid) as total_raised FROM registrations").get() as { total_sponsored: number, total_registrations: number, total_raised: number };
    res.json({
      totalSponsored: stats.total_sponsored || 0,
      totalRegistrations: stats.total_registrations || 0,
      totalRaised: stats.total_raised || 0,
      goal: 50
    });
  });

  app.post("/api/register", async (req, res) => {
    const { name, phone, batchId, sponsoredCount, totalPaid } = req.body;
    
    try {
      const baseURL = process.env.UDDOKTAPAY_BASE_URL || "https://sandbox.uddoktapay.com";
      const apiKey = process.env.UDDOKTAPAY_API_KEY;

      if (!apiKey) {
        throw new Error("UDDOKTAPAY_API_KEY is not configured");
      }

      const response = await axios.post(`${baseURL}/api/checkout-v2`, {
        full_name: name,
        email: "customer@example.com", // Placeholder as email is not collected
        amount: totalPaid,
        metadata: {
          type: 'registration',
          name,
          phone,
          batchId,
          sponsoredCount
        },
        redirect_url: `${req.headers.origin}/?payment=success`,
        cancel_url: `${req.headers.origin}/?payment=cancel`,
        webhook_url: `${req.headers.origin}/api/payment/webhook`
      }, {
        headers: {
          'RT-UDDOKTAPAY-API-KEY': apiKey,
          'accept': 'application/json',
          'content-type': 'application/json'
        }
      });

      if (response.data && response.data.payment_url) {
        // Store pending payment
        db.prepare("INSERT INTO payments (invoice_id, type, data) VALUES (?, ?, ?)")
          .run(response.data.invoice_id, 'registration', JSON.stringify({ name, phone, batchId, sponsoredCount, totalPaid }));
        
        res.json({ success: true, payment_url: response.data.payment_url });
      } else {
        res.status(500).json({ error: "Failed to create payment session" });
      }
    } catch (error: any) {
      console.error("Payment creation error:", error.response?.data || error.message);
      res.status(500).json({ error: "Payment gateway error" });
    }
  });

  app.post("/api/sponsor-more", async (req, res) => {
    const { code, count, amount } = req.body;
    
    try {
      const registration = db.prepare("SELECT name FROM registrations WHERE access_code = ?").get(code.toUpperCase()) as any;
      if (!registration) return res.status(404).json({ error: "Registration not found" });

      const baseURL = process.env.UDDOKTAPAY_BASE_URL || "https://sandbox.uddoktapay.com";
      const apiKey = process.env.UDDOKTAPAY_API_KEY;

      const response = await axios.post(`${baseURL}/api/checkout-v2`, {
        full_name: registration.name,
        email: "customer@example.com",
        amount: amount,
        metadata: {
          type: 'sponsorship',
          code: code.toUpperCase(),
          count,
          amount
        },
        redirect_url: `${req.headers.origin}/?payment=success`,
        cancel_url: `${req.headers.origin}/?payment=cancel`,
        webhook_url: `${req.headers.origin}/api/payment/webhook`
      }, {
        headers: {
          'RT-UDDOKTAPAY-API-KEY': apiKey,
          'accept': 'application/json',
          'content-type': 'application/json'
        }
      });

      if (response.data && response.data.payment_url) {
        db.prepare("INSERT INTO payments (invoice_id, type, data) VALUES (?, ?, ?)")
          .run(response.data.invoice_id, 'sponsorship', JSON.stringify({ code: code.toUpperCase(), count, amount }));
        
        res.json({ success: true, payment_url: response.data.payment_url });
      } else {
        res.status(500).json({ error: "Failed to create payment session" });
      }
    } catch (error: any) {
      console.error("Sponsorship payment error:", error.response?.data || error.message);
      res.status(500).json({ error: "Payment gateway error" });
    }
  });

  app.post("/api/payment/verify", async (req, res) => {
    const { invoice_id } = req.body;
    
    try {
      const baseURL = process.env.UDDOKTAPAY_BASE_URL || "https://sandbox.uddoktapay.com";
      const apiKey = process.env.UDDOKTAPAY_API_KEY;

      const response = await axios.post(`${baseURL}/api/verify-payment`, {
        invoice_id
      }, {
        headers: {
          'RT-UDDOKTAPAY-API-KEY': apiKey,
          'accept': 'application/json',
          'content-type': 'application/json'
        }
      });

      if (response.data && response.data.status === 'COMPLETED') {
        const payment = db.prepare("SELECT * FROM payments WHERE invoice_id = ?").get(invoice_id) as any;
        
        if (!payment || payment.status === 'COMPLETED') {
          // Already processed or not found
          const regData = payment ? JSON.parse(payment.data) : null;
          if (payment.type === 'registration') {
             const reg = db.prepare("SELECT * FROM registrations WHERE phone = ? AND name = ?").get(regData.phone, regData.name);
             return res.json({ success: true, registration: reg });
          }
          return res.json({ success: true });
        }

        const data = JSON.parse(payment.data);
        let resultRegistration = null;

        if (payment.type === 'registration') {
          const accessCode = generateAccessCode();
          const stmt = db.prepare("INSERT INTO registrations (name, phone, batch_id, sponsored_count, total_paid, access_code) VALUES (?, ?, ?, ?, ?, ?)");
          const result = stmt.run(data.name, data.phone, data.batchId, data.sponsoredCount, data.totalPaid, accessCode);
          resultRegistration = db.prepare("SELECT * FROM registrations WHERE id = ?").get(result.lastInsertRowid);
        } else if (payment.type === 'sponsorship') {
          const reg = db.prepare("SELECT id, sponsored_count, total_paid FROM registrations WHERE access_code = ?").get(data.code) as any;
          if (reg) {
            db.prepare("UPDATE registrations SET sponsored_count = ?, total_paid = ? WHERE id = ?")
              .run(reg.sponsored_count + data.count, reg.total_paid + data.amount, reg.id);
            resultRegistration = db.prepare("SELECT * FROM registrations WHERE id = ?").get(reg.id);
          }
        }

        db.prepare("UPDATE payments SET status = 'COMPLETED' WHERE invoice_id = ?").run(invoice_id);

        // Broadcast update
        const stats = db.prepare("SELECT SUM(sponsored_count) as total_sponsored, COUNT(*) as total_registrations FROM registrations").get() as { total_sponsored: number, total_registrations: number };
        io.emit("stats_update", {
          totalSponsored: stats.total_sponsored || 0,
          totalRegistrations: stats.total_registrations || 0,
          goal: 50
        });

        res.json({ success: true, registration: resultRegistration });
      } else {
        res.status(400).json({ error: "Payment not completed" });
      }
    } catch (error: any) {
      console.error("Payment verification error:", error.response?.data || error.message);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  app.get("/api/check-status/:code", (req, res) => {
    const { code } = req.params;
    const registration = db.prepare("SELECT * FROM registrations WHERE access_code = ?").get(code.toUpperCase());
    
    if (registration) {
      res.json(registration);
    } else {
      res.status(404).json({ error: "Invalid access code" });
    }
  });

  // Admin Routes
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    const adminPass = process.env.ADMIN_PASSWORD || "lab2k23admin";
    if (password && password.trim() === adminPass) { 
      res.json({ success: true, token: "secret-admin-token" });
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  });

  app.get("/api/admin/registrations", (req, res) => {
    const token = req.headers.authorization;
    if (token !== "secret-admin-token") return res.status(401).json({ error: "Unauthorized" });

    const registrations = db.prepare("SELECT * FROM registrations ORDER BY created_at DESC").all();
    res.json(registrations);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  if (!isVercel) {
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

const appPromise = startServer();

export default async (req: any, res: any) => {
  const app = await appPromise;
  return app(req, res);
};
