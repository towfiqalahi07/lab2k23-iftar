import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Users, Heart, Banknote, Download, LogOut, Search, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ totalRegistrations: 0, totalSponsored: 0, totalRaised: 0 });

  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [regRes, statsRes] = await Promise.all([
        fetch('/api/admin/registrations', { headers: { 'Authorization': token || '' } }),
        fetch('/api/stats')
      ]);

      if (regRes.ok && statsRes.ok) {
        const regs = await regRes.json();
        const s = await statsRes.json();
        setRegistrations(regs);
        setStats(s);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Access Code', 'Name', 'Phone', 'Batch ID', 'Sponsored Meals', 'Total Paid', 'Date'];
    const rows = registrations.map(r => [
      r.id,
      r.access_code,
      r.name,
      r.phone,
      r.batch_id,
      r.sponsored_count,
      r.total_paid,
      format(new Date(r.created_at), 'yyyy-MM-dd HH:mm')
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `lab2k23_iftar_registrations_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRegistrations = registrations.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-white flex items-center gap-3">
            <LayoutDashboard className="text-primary" /> Admin Dashboard
          </h1>
          <p className="text-zinc-500 text-sm">Managing Lab2k23 Iftar Party Registrations</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-sm font-medium border border-white/5"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            onClick={onLogout}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-sm font-medium border border-red-500/20"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Users className="text-blue-500" />} 
          label="Total Attendees" 
          value={stats.totalRegistrations.toString()} 
        />
        <StatCard 
          icon={<Heart className="text-primary" />} 
          label="Meals Sponsored" 
          value={`${stats.totalSponsored} / 50`} 
        />
        <StatCard 
          icon={<Banknote className="text-amber-500" />} 
          label="Total Raised" 
          value={`${stats.totalRaised} BDT`} 
        />
      </div>

      {/* Registrations Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/10">
        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between gap-4">
          <h2 className="text-xl font-display font-bold text-white">Attendee List</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              className="bg-zinc-900 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full md:w-64"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-900/50 text-zinc-500 text-xs uppercase tracking-widest font-mono">
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Sponsored</th>
                <th className="px-6 py-4">Total Paid</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRegistrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-primary font-bold">{reg.access_code}</td>
                  <td className="px-6 py-4 text-white font-medium">{reg.name}</td>
                  <td className="px-6 py-4 text-zinc-400 font-mono text-sm">{reg.phone}</td>
                  <td className="px-6 py-4">
                    <span className={reg.sponsored_count > 0 ? "text-primary font-bold" : "text-zinc-600"}>
                      {reg.sponsored_count} Meals
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white font-mono">{reg.total_paid} BDT</td>
                  <td className="px-6 py-4 text-zinc-500 text-xs">
                    {format(new Date(reg.created_at), 'MMM d, h:mm a')}
                  </td>
                </tr>
              ))}
              {filteredRegistrations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic">
                    No registrations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-2">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
      <span className="text-zinc-500 text-xs uppercase tracking-widest font-mono">{label}</span>
    </div>
    <div className="text-3xl font-display font-black text-white">{value}</div>
  </div>
);
