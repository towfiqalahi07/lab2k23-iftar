import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2, CheckCircle2, Heart, Calendar, Clock, MapPin, X } from 'lucide-react';

export const StatusChecker: React.FC = () => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/check-status/${code}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        setError("Invalid access code. Please check and try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-display font-bold text-white">Check Your Status</h2>
        <p className="text-zinc-500 text-sm">Enter your unique access code to view your details.</p>
      </div>

      <form onSubmit={handleCheck} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 h-5 w-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Enter Access Code (e.g. AB12CD)"
            className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={code}
            onChange={e => setCode(e.target.value)}
          />
        </div>
        <button
          disabled={isLoading}
          type="submit"
          className="bg-primary hover:bg-secondary text-white px-6 rounded-xl font-bold transition-all disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Check"}
        </button>
      </form>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center"
          >
            {error}
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-6 rounded-2xl border-primary/30 space-y-6 relative"
          >
            <button 
              onClick={() => setResult(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{result.name}</h3>
                <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">Access Code: {result.access_code}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                <div className="text-[10px] text-zinc-500 uppercase font-mono mb-1">Status</div>
                <div className="text-primary font-bold text-sm">CONFIRMED</div>
              </div>
              <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                <div className="text-[10px] text-zinc-500 uppercase font-mono mb-1">Meals Sponsored</div>
                <div className="text-white font-bold text-sm flex items-center gap-1">
                  <Heart className="h-3 w-3 text-primary" /> {result.sponsored_count}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <Calendar className="h-3 w-3" /> March 6th, 2026
              </div>
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <Clock className="h-3 w-3" /> 5:00 PM
              </div>
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <MapPin className="h-3 w-3" /> RGLHS Playground 7
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
