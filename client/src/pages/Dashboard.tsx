import { StatusCard } from "@/components/StatusCard";
import { RequestList } from "@/components/RequestList";
import { motion } from "framer-motion";
import { Music2 } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-primary to-emerald-600 p-3 rounded-2xl shadow-lg shadow-primary/20">
              <Music2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-display tracking-tight text-white">
                Music Bot <span className="text-primary">Admin</span>
              </h1>
              <p className="text-muted-foreground font-arabic">لوحة التحكم في بوت الموسيقى</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Status & Connection */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-6"
          >
            <StatusCard />
            
            {/* Quick Stats Mini-cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card/30 border border-white/5 p-4 rounded-2xl">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Uptime</p>
                <p className="text-xl font-mono font-bold">24h</p>
              </div>
              <div className="bg-card/30 border border-white/5 p-4 rounded-2xl">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Queue</p>
                <p className="text-xl font-mono font-bold text-primary">Active</p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Recent Requests */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-8"
          >
            <div className="glass-panel rounded-3xl p-6 md:p-8 h-full min-h-[500px]">
              <RequestList />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
