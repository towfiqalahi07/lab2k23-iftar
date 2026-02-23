import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Phone, Hash, Heart, CreditCard, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';

interface RegistrationFormProps {
  onSuccess: (registration: any) => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSuccess }) => {
  const [isSponsoring, setIsSponsoring] = useState(false);
  const [sponsorCount, setSponsorCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    batchId: 'Lab2k23',
  });

  const basePrice = 150;
  const sponsorPrice = 50;
  const totalPrice = basePrice + (isSponsoring ? sponsorCount * sponsorPrice : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate payment gateway delay
    // To integrate a real gateway (e.g., SSLCommerz):
    // 1. Call your backend to create a payment session
    // 2. Redirect the user to the gateway's payment page
    // 3. Handle the callback in your backend to confirm payment and save registration
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sponsoredCount: isSponsoring ? sponsorCount : 0,
          totalPaid: totalPrice
        }),
      });

      if (response.ok) {
        const data = await response.json();
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#059669', '#f59e0b']
        });
        onSuccess(data.registration);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown server error" }));
        alert(errorData.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration fetch error:", error);
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}. If you are on Vercel, ensure your backend is correctly configured.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 md:p-8 rounded-3xl space-y-6 max-w-xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold text-white">Join the Iftar</h2>
        <p className="text-zinc-400 text-sm">Fill in your details to secure your spot.</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <User className="absolute left-3 top-3.5 h-5 w-5 text-zinc-500" />
          <input
            required
            type="text"
            placeholder="Full Name"
            className="w-full bg-zinc-800/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="relative">
          <Phone className="absolute left-3 top-3.5 h-5 w-5 text-zinc-500" />
          <input
            required
            type="tel"
            placeholder="Phone Number"
            className="w-full bg-zinc-800/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className="relative">
          <Hash className="absolute left-3 top-3.5 h-5 w-5 text-zinc-500" />
          <input
            required
            readOnly
            type="text"
            placeholder="Batch ID"
            className="w-full bg-zinc-800/30 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-zinc-500 cursor-not-allowed"
            value={formData.batchId}
          />
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={isSponsoring}
              onChange={e => setIsSponsoring(e.target.checked)}
            />
            <div className="h-6 w-6 rounded-md border-2 border-zinc-600 peer-checked:border-primary peer-checked:bg-primary transition-all flex items-center justify-center">
              <Heart className={cn("h-4 w-4 text-white scale-0 transition-transform", isSponsoring && "scale-100")} />
            </div>
          </div>
          <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
            Sponsor Iftar for street children? <span className="text-primary font-bold">(+50 BDT/child)</span>
          </span>
        </label>

        <AnimatePresence>
          {isSponsoring && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-3"
            >
              <div className="flex justify-between text-xs font-mono text-zinc-400">
                <span>1 Child</span>
                <span>20 Children</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={sponsorCount}
                onChange={e => setSponsorCount(parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="text-center">
                <span className="text-lg font-display font-bold text-primary">
                  Sponsoring {sponsorCount} {sponsorCount === 1 ? 'child' : 'children'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pt-4 border-t border-white/10">
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-zinc-400">Total Amount</div>
          <div className="text-3xl font-display font-black text-white">
            {totalPrice} <span className="text-sm font-normal text-zinc-500">BDT</span>
          </div>
        </div>

        <button
          disabled={isSubmitting}
          type="submit"
          className="w-full bg-primary hover:bg-secondary disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5" />
              Pay & Register Now
            </>
          )}
        </button>
        
        <p className="text-[10px] text-zinc-500 text-center mt-4 uppercase tracking-widest">
          Secure payment via SSLCommerz / bKash Gateway
        </p>
      </div>
    </form>
  );
};
