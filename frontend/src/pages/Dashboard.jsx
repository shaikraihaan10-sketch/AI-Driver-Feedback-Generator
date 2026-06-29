import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  FiFileText, FiAward, FiClock, FiAlertTriangle, FiTrendingUp, 
  FiPlus, FiUsers, FiArrowRight, FiActivity
} from 'react-icons/fi';
import { motion } from 'framer-motion';

const Dashboard = ({ setActivePage, setSelectedFeedbackId }) => {
  const { apiBaseUrl } = useAuth();
  const showToast = useToast();
  
  const [stats, setStats] = useState({
    totalGenerated: 0,
    avgCustomerRating: 0.0,
    avgOnTimePercentage: 0,
    totalSafetyViolations: 0,
  });
  const [recentFeedbacks, setRecentFeedbacks] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch analytics
        const analyticsRes = await axios.get(`${apiBaseUrl}/analytics`);
        setStats(analyticsRes.data);

        // Fetch recent feedbacks (Limit 3)
        const historyRes = await axios.get(`${apiBaseUrl}/feedback/history?limit=3`);
        setRecentFeedbacks(historyRes.data.data);

        // Fetch drivers
        const driversRes = await axios.get(`${apiBaseUrl}/drivers`);
        setDrivers(driversRes.data.slice(0, 4)); // Show first 4 drivers
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
        showToast('Error loading dashboard statistics.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [apiBaseUrl, showToast]);

  const cardsContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardItem = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 glass-panel skeleton-loading"></div>
          ))}
        </div>
        {/* Skeleton content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 glass-panel skeleton-loading"></div>
          <div className="h-96 glass-panel skeleton-loading"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-br from-primary to-secondary text-white overflow-hidden shadow-xl shadow-primary/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full filter blur-3xl pointer-events-none translate-x-20 -translate-y-20"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="bg-white/20 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full backdrop-blur-md">
            🚌 Driver Relations Management
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold mt-3 leading-tight">
            Streamline monthly review meetings with instant AI-driven script coaching.
          </h2>
          <p className="text-sm md:text-base text-slate-200 mt-2 font-medium">
            Enter metrics, review KPIs, and output motivational Talking Scripts that cultivate safer and happier drivers.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setActivePage('generate')}
              className="px-5 py-2.5 rounded-xl font-bold bg-white text-primary hover:bg-slate-50 shadow-md shadow-black/10 active:scale-95 transition-all text-sm flex items-center gap-2"
            >
              <FiPlus /> Generate Feedback
            </button>
            <button
              onClick={() => setActivePage('history')}
              className="px-5 py-2.5 rounded-xl font-bold border border-white/40 hover:bg-white/10 active:scale-95 transition-all text-sm"
            >
              View History logs
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <motion.div 
        variants={cardsContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {/* Total Generated */}
        <motion.div variants={cardItem} className="glass-panel p-5 bg-white/70 dark:bg-slate-900/60 hover:translate-y-[-4px] transition-transform cursor-pointer">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-450 dark:text-slate-400 font-semibold tracking-wide uppercase">Feedback Generated</span>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{stats.totalGenerated}</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-primary text-xl">
              <FiFileText />
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-4 flex items-center gap-1">
            <FiTrendingUp className="text-accent" />
            <span className="font-semibold text-accent">+12%</span> vs last month
          </div>
        </motion.div>

        {/* Avg rating */}
        <motion.div variants={cardItem} className="glass-panel p-5 bg-white/70 dark:bg-slate-900/60 hover:translate-y-[-4px] transition-transform cursor-pointer">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-450 dark:text-slate-400 font-semibold tracking-wide uppercase">Avg Customer Rating</span>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{stats.avgCustomerRating.toFixed(1)} <span className="text-lg text-slate-400">/ 5</span></h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-550 dark:text-amber-400 text-xl">
              <FiAward />
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-4 flex items-center gap-1">
            <FiActivity className="text-accent" />
            Satisfies customer standards
          </div>
        </motion.div>

        {/* On Time Performance */}
        <motion.div variants={cardItem} className="glass-panel p-5 bg-white/70 dark:bg-slate-900/60 hover:translate-y-[-4px] transition-transform cursor-pointer">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-450 dark:text-slate-400 font-semibold tracking-wide uppercase">On-Time Percentage</span>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{stats.avgOnTimePercentage}%</h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-accent text-xl">
              <FiClock />
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-4 flex items-center gap-1">
            <span className="text-primary font-bold">95%</span> is company target
          </div>
        </motion.div>

        {/* Safety Violations */}
        <motion.div variants={cardItem} className="glass-panel p-5 bg-white/70 dark:bg-slate-900/60 hover:translate-y-[-4px] transition-transform cursor-pointer">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-450 dark:text-slate-400 font-semibold tracking-wide uppercase">Safety Violations</span>
              <h3 className={`text-3xl font-extrabold mt-1 ${stats.totalSafetyViolations > 3 ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>
                {stats.totalSafetyViolations}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-550 dark:text-rose-450 text-xl">
              <FiAlertTriangle />
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-4 flex items-center gap-1">
            Requires attention immediately
          </div>
        </motion.div>
      </motion.div>

      {/* Main Grid: Recent Activity & Drivers list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Feedback Runs */}
        <div className="lg:col-span-2 glass-panel p-6 bg-white/70 dark:bg-slate-900/60 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <FiFileText className="text-primary" />
                Recent AI Generations
              </h3>
              <button 
                onClick={() => setActivePage('history')}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                View All <FiArrowRight />
              </button>
            </div>

            {recentFeedbacks.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl block mb-3">📄</span>
                <p className="text-sm text-slate-450 dark:text-slate-400 font-medium">No feedback has been generated this month yet.</p>
                <button
                  onClick={() => setActivePage('generate')}
                  className="mt-4 px-4 py-2 bg-primary/10 text-primary font-bold text-xs rounded-xl hover:bg-primary/20 transition-all"
                >
                  Create First Review
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentFeedbacks.map((fb) => (
                  <div 
                    key={fb._id}
                    className="flex flex-col md:flex-row justify-between md:items-center p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-800/35 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800 dark:text-white">{fb.driverName}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">{fb.driverId}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>Review Month: <span className="font-semibold text-slate-500 dark:text-slate-350">{fb.reviewMonth}</span></span>
                        <span>•</span>
                        <span>Route: <span className="truncate max-w-[150px] inline-block align-bottom">{fb.route}</span></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 md:mt-0 justify-between">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">On-Time / Rating</div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                          {fb.onTimePercentage}% • ⭐ {fb.customerRating.toFixed(1)}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFeedbackId(fb._id);
                          setActivePage('history');
                        }}
                        className="px-3.5 py-1.5 rounded-lg border border-slate-250 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        Open Script
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Driver Directory Quick Peek */}
        <div className="glass-panel p-6 bg-white/70 dark:bg-slate-900/60 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <FiUsers className="text-accent" />
                Active Drivers
              </h3>
              <button 
                onClick={() => setActivePage('admin')}
                className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
              >
                Manage <FiArrowRight />
              </button>
            </div>

            {drivers.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p className="text-sm">No drivers registered yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {drivers.map((drv) => (
                  <div key={drv._id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 flex items-center justify-center font-bold text-sm text-primary">
                        {drv.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">{drv.name}</h4>
                        <span className="text-[10px] text-slate-400">{drv.vehicleNumber}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block">
                        ⭐ {drv.rating.toFixed(1)}
                      </div>
                      <span className="text-[9px] text-slate-400 block mt-1">{drv.driverId}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={() => setActivePage('generate')}
            className="w-full mt-6 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-500 hover:text-primary dark:hover:text-white dark:hover:border-slate-500 hover:border-primary transition-all flex items-center justify-center gap-1.5"
          >
            <FiPlus /> Perform Review on Driver
          </button>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
