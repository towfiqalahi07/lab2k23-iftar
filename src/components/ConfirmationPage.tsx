import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Calendar, Clock, User, CreditCard, Heart, ArrowRight, Camera } from 'lucide-react';
import { format } from 'date-fns';

interface ConfirmationPageProps {
  registration: {
    name: string;
    phone: string;
    sponsored_count: number;
    total_paid: number;
    access_code: string;
    created_at: string;
  };
  onBack: () => void;
}

export const ConfirmationPage: React.FC<ConfirmationPageProps> = ({ registration, onBack }) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(registration.access_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-8 md:p-12 rounded-3xl space-y-8 max-w-2xl mx-auto border-primary/30 bg-primary/5"
    >
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto shadow-xl shadow-primary/20">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-black text-white">Registration Confirmed!</h2>
        <p className="text-zinc-400">
          Thank you, <span className="text-white font-bold">{registration.name}</span>. Your seat is booked for the Lab2k23 Iftar Party.
        </p>
      </div>

      <div 
        onClick={copyToClipboard}
        className="bg-zinc-900 border-2 border-dashed border-primary/40 p-6 rounded-2xl text-center space-y-3 relative overflow-hidden cursor-pointer hover:border-primary transition-colors group"
      >
        <div className="absolute top-0 right-0 p-2 opacity-10">
          <CheckCircle2 className="h-20 w-20 text-primary" />
        </div>
        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Your Unique Access Code (Click to Copy)</div>
        <div className="text-5xl font-display font-black text-primary tracking-[0.2em] py-2 group-hover:scale-105 transition-transform">
          {registration.access_code}
        </div>
        <div className="flex items-center justify-center gap-2 text-amber-500 text-xs font-bold bg-amber-500/10 py-2 px-4 rounded-full w-fit mx-auto">
          {copied ? (
            <span className="text-primary flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3" /> COPIED!
            </span>
          ) : (
            <>
              <Camera className="h-3 w-3" /> PLEASE TAKE A SCREENSHOT OF THIS CODE
            </>
          )}
        </div>
        <p className="text-[10px] text-zinc-500 italic">
          This code is required for entry and to check your donation status.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5 space-y-1">
          <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-widest font-mono">
            <Calendar className="h-3 w-3" /> Event Date
          </div>
          <p className="text-white font-bold">March 6th, 2026</p>
        </div>
        <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5 space-y-1">
          <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-widest font-mono">
            <Clock className="h-3 w-3" /> Time
          </div>
          <p className="text-white font-bold">5:00 PM onwards</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-mono uppercase tracking-widest text-zinc-500 border-b border-white/10 pb-2">Payment Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-zinc-300">
              <User className="h-4 w-4 text-zinc-500" /> Basic Registration
            </div>
            <div className="text-white font-mono">150 BDT</div>
          </div>
          
          {registration.sponsored_count > 0 && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-primary">
                <Heart className="h-4 w-4" /> Sponsorship ({registration.sponsored_count} Meals)
              </div>
              <div className="text-primary font-mono">+{registration.sponsored_count * 50} BDT</div>
            </div>
          )}

          <div className="flex justify-between items-center pt-3 border-t border-white/5">
            <div className="flex items-center gap-2 text-white font-bold">
              <CreditCard className="h-4 w-4 text-zinc-400" /> Total Paid
            </div>
            <div className="text-2xl font-display font-black text-white">{registration.total_paid} BDT</div>
          </div>
        </div>
      </div>

      <div className="bg-primary/10 p-6 rounded-2xl border border-primary/20 space-y-3">
        <h4 className="text-primary font-bold flex items-center gap-2">
          <Heart className="h-5 w-5" /> Your Impact
        </h4>
        <p className="text-sm text-zinc-300 leading-relaxed">
          Your contribution is helping us reach our goal of feeding 50 street children. 
          This initiative is more than just a party; it's a collective effort by Lab2k23 to share the blessings of Ramadan.
        </p>
      </div>

      <div className="text-center pt-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-mono uppercase tracking-widest group"
        >
          Return to Home <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
      
      <p className="text-[10px] text-zinc-600 text-center font-mono">
        Registered on: {format(new Date(registration.created_at), 'PPP p')}
      </p>
    </motion.div>
  );
};
