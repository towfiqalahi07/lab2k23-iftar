import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, Heart, Camera, Music, Star, Info } from 'lucide-react';

export const EventDetails: React.FC = () => {
  return (
    <section className="space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-5xl font-display font-black text-white tracking-tight">
          Event <span className="text-primary">Details</span>
        </h2>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Everything you need to know about our batch reunion and charity drive.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Main Info */}
        <div className="glass-panel p-8 rounded-3xl space-y-6 border-primary/20">
          <div className="space-y-4">
            <h3 className="text-2xl font-display font-bold text-white flex items-center gap-2">
              <Info className="text-primary" /> The Purpose
            </h3>
            <p className="text-zinc-400 leading-relaxed">
              The Lab2k23 Iftar Party is more than just a meal. It's a moment for our batch to reconnect, 
              share stories, and most importantly, give back to the community during the holy month of Ramadan. 
              Our goal is to foster brotherhood while making a tangible impact on the lives of those less fortunate.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailItem icon={<Calendar />} label="Date" value="March 6th, 2026" />
            <DetailItem icon={<Clock />} label="Time" value="5:00 PM Onwards" />
            <DetailItem icon={<MapPin />} label="Venue" value="RGLHS Playground" />
            <DetailItem icon={<Star />} label="Dress Code" value="Traditional / Modest" />
          </div>
        </div>

        {/* Activities & Sponsorship */}
        <div className="space-y-6">
          <div className="glass-panel p-8 rounded-3xl space-y-4">
            <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Camera className="text-amber-500" /> Special Activities
            </h3>
            <ul className="space-y-3 text-zinc-400 text-sm">
              <li className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-amber-500/10 flex items-center justify-center mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                </div>
                <span><strong>Batch Photo Session:</strong> A professional photographer will capture our collective memories.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-amber-500/10 flex items-center justify-center mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                </div>
                <span><strong>Collective Dua:</strong> A special prayer session before Iftar for our batch and the community.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-5 w-5 rounded-full bg-amber-500/10 flex items-center justify-center mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                </div>
                <span><strong>Charity Distribution:</strong> Live update on the total meals sponsored and distribution plan.</span>
              </li>
            </ul>
          </div>

          <div className="bg-primary/5 p-8 rounded-3xl border border-primary/20 space-y-4">
            <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Heart className="text-primary" /> Sponsorship Impact
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Every 50 BDT you contribute as a sponsor goes directly towards providing a full Iftar box 
              (including dates, fruits, juice, and a main meal) to street children and underprivileged individuals 
              near our campus. Our volunteer team will handle the distribution on the night of March 7th.
            </p>
            <div className="pt-2">
              <div className="text-xs font-mono text-primary uppercase tracking-widest">Target: 50 Meals</div>
              <div className="mt-1 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[70%] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase tracking-widest font-mono">
      {React.cloneElement(icon as React.ReactElement, { className: "h-3 w-3" })} {label}
    </div>
    <div className="text-white text-sm font-bold">{value}</div>
  </div>
);
