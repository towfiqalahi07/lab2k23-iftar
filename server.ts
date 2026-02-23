import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const db = new Database("registrations.db");

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

  app.post("/api/register", (req, res) => {
    const { name, phone, batchId, sponsoredCount, totalPaid } = req.body;
    const accessCode = generateAccessCode();

    try {
      const stmt = db.prepare("INSERT INTO registrations (name, phone, batch_id, sponsored_count, total_paid, access_code) VALUES (?, ?, ?, ?, ?, ?)");
      const result = stmt.run(name, phone, batchId, sponsoredCount, totalPaid, accessCode);
      
      const registration = db.prepare("SELECT * FROM registrations WHERE id = ?").get(result.lastInsertRowid) as any;

      // Broadcast update to all clients
      const stats = db.prepare("SELECT SUM(sponsored_count) as total_sponsored, COUNT(*) as total_registrations FROM registrations").get() as { total_sponsored: number, total_registrations: number };
      io.emit("stats_update", {
        totalSponsored: stats.total_sponsored || 0,
        totalRegistrations: stats.total_registrations || 0,
        goal: 50
      });

      res.json({ success: true, registration });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to register" });
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
    if (password === "lab2k23admin") { // Simple password for demo
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
