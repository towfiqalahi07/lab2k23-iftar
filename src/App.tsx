import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';
import { Calendar, MapPin, Users, Info, CheckCircle2, Heart, Sparkles, Shield, Lock, Loader2, ArrowDown } from 'lucide-react';
import { Countdown } from './components/Countdown';
import { ProgressBar } from './components/ProgressBar';
import { RegistrationForm } from './components/RegistrationForm';
import { ConfirmationPage } from './components/ConfirmationPage';
import { AdminDashboard } from './components/AdminDashboard';
import { EventDetails } from './components/EventDetails';
import { StatusChecker } from './components/StatusChecker';

const socket = io();

type View = 'home' | 'confirmation' | 'admin-login' | 'admin-dashboard';

export default function App() {
  const [stats, setStats] = useState({ totalSponsored: 0, totalRegistrations: 0, goal: 50 });
  const [view, setView] = useState<View>('home');
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  
  const targetDate = new Date('2026-03-06T17:00:00');

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data));

    socket.on('stats_update', (newStats) => {
      setStats(newStats);
    });

    const token = localStorage.getItem('admin_token');
    if (token) setView('admin-dashboard');

    return () => {
      socket.off('stats_update');
    };
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword })
      });
      if (res.ok) {
        const { token } = await res.json();
        localStorage.setItem('admin_token', token);
        setView('admin-dashboard');
      } else {
        alert("Invalid password");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAdminLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setView('home');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] selection:bg-primary/30">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
        <div 
          className="text-xl font-display font-black text-white cursor-pointer flex items-center gap-2"
          onClick={() => setView('home')}
        >
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <Heart className="h-5 w-5 text-white" />
          </div>
          LAB2K23
        </div>
        <button
          onClick={() => setView(view === 'admin-dashboard' ? 'admin-dashboard' : 'admin-login')}
          className="text-zinc-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
        >
          <Shield className="h-5 w-5" />
        </button>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-20">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-20"
            >
              {/* Hero Section */}
              <section className="text-center space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-white/10 text-xs font-mono text-primary uppercase tracking-widest"
                >
                  <Sparkles className="h-3 w-3" />
                  Batch Lab2k23 Exclusive
                </motion.div>

                <motion.h1
                  className="text-5xl md:text-8xl font-display font-black tracking-tighter text-white"
                >
                  IFTAR <span className="text-primary">PARTY</span>
                </motion.h1>

                <Countdown targetDate={targetDate} />

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ y: 5 }}
                  onClick={() => document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-primary/10 hover:bg-primary/20 text-primary p-4 rounded-full transition-all border border-primary/20 group mx-auto"
                >
                  <ArrowDown className="h-6 w-6 group-hover:scale-110 transition-transform" />
                </motion.button>

                <div className="pt-8">
                  <ProgressBar current={stats.totalSponsored} goal={stats.goal} />
                </div>
              </section>

              {/* Event Details Grid */}
              <section className="grid md:grid-cols-3 gap-6">
                <DetailCard
                  icon={<Calendar className="h-6 w-6 text-primary" />}
                  title="Date & Time"
                  content="6th March, 5:00 PM"
                  subContent="Friday, Ramadan Special"
                />
                <DetailCard
                  icon={<MapPin className="h-6 w-6 text-primary" />}
                  title="Location"
                  content="RGLHS Playground 7"
                  subContent="Main Event Area"
                />
                <DetailCard
                  icon={<Users className="h-6 w-6 text-primary" />}
                  title="Capacity"
                  content="Limited Seats"
                  subContent={`${stats.totalRegistrations} registered so far`}
                />
              </section>

              {/* Registration Section */}
              <section id="register" className="scroll-mt-20">
                <RegistrationForm onSuccess={(data) => {
                  setRegistrationData(data);
                  setView('confirmation');
                }} />
              </section>

              {/* Status Checker Section */}
              <StatusChecker />

              {/* Dedicated Event Details Section */}
              <EventDetails />

              {/* Info / Transparency Section */}
              <section className="glass-panel p-8 rounded-3xl space-y-8">
                <div className="flex items-center gap-3">
                  <Info className="h-6 w-6 text-amber-500" />
                  <h2 className="text-2xl font-display font-bold text-white">Event Information & Transparency</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                      <Heart className="h-5 w-5 text-primary" />
                      The Fundraising Goal
                    </h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      The primary goal of this event is to provide a nutritious Iftar meal to at least 50 street children. 
                      Your basic registration fee (150 BDT) covers the event costs and your meal. 
                      The sponsorship add-on (50 BDT per child) goes 100% towards the children's meals.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-zinc-200">Notes for Batchmates</h3>
                    <ul className="space-y-2 text-sm text-zinc-400">
                      <li className="flex gap-2">
                        <span className="text-primary">•</span>
                        Please arrive by 4:45 PM for smooth seating.
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary">•</span>
                        Payment is non-refundable as it goes directly into catering and charity.
                      </li>
                      <li className="flex gap-2">
                        <span className="text-primary">•</span>
                        Real-time progress bar shows our collective impact.
                      </li>
                    </ul>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {view === 'confirmation' && registrationData && (
            <ConfirmationPage 
              registration={registrationData} 
              onBack={() => setView('home')} 
            />
          )}

          {view === 'admin-login' && (
            <motion.div
              key="admin-login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto"
            >
              <form onSubmit={handleAdminLogin} className="glass-panel p-8 rounded-3xl space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white">Admin Access</h2>
                  <p className="text-zinc-500 text-sm">Enter password to manage registrations.</p>
                </div>
                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="Admin Password"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    required
                  />
                  <button
                    disabled={isAdminLoading}
                    type="submit"
                    className="w-full bg-primary hover:bg-secondary text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    {isAdminLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Login"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {view === 'admin-dashboard' && (
            <motion.div
              key="admin-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AdminDashboard onLogout={logout} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="text-center pt-20 border-t border-white/5 space-y-4">
          <p className="text-zinc-500 text-xs font-mono uppercase tracking-[0.2em]">
            Crafted with ❤️ for Lab2k23 Batch
          </p>
          <div className="flex justify-center gap-6">
            <a href="#" className="text-zinc-600 hover:text-primary transition-colors">Facebook</a>
            <a href="#" className="text-zinc-600 hover:text-primary transition-colors">Instagram</a>
            <a href="#" className="text-zinc-600 hover:text-primary transition-colors">WhatsApp</a>
          </div>
        </footer>
      </main>
    </div>
  );
}

const DetailCard = ({ icon, title, content, subContent }: { icon: React.ReactNode; title: string; content: string; subContent: string }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="glass-panel p-6 rounded-2xl space-y-3"
  >
    <div className="p-3 rounded-xl bg-primary/10 w-fit">
      {icon}
    </div>
    <div>
      <h4 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">{title}</h4>
      <p className="text-xl font-display font-bold text-white">{content}</p>
      <p className="text-xs text-zinc-500">{subContent}</p>
    </div>
  </motion.div>
);
