import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiActivity, FiUsers, FiClock, FiFileText, FiAward } from 'react-icons/fi';

const Analytics = () => {
  const { apiBaseUrl } = useAuth();
  const showToast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${apiBaseUrl}/analytics`);
        setData(res.data);
      } catch (err) {
        console.error('Error fetching analytics metrics:', err);
        showToast('Error loading analytics metrics.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [apiBaseUrl, showToast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 glass-panel skeleton-loading"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[380px] glass-panel skeleton-loading"></div>
          <div className="h-[380px] glass-panel skeleton-loading"></div>
        </div>
      </div>
    );
  }

  if (!data || data.totalGenerated === 0) {
    return (
      <div className="glass-panel p-12 bg-white/70 dark:bg-slate-900/60 text-center space-y-4 max-w-lg mx-auto mt-12">
        <span className="text-6xl block">📊</span>
        <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">No Analytics Data Yet</h3>
        <p className="text-xs text-slate-400">
          We need monthly feedback records to compute statistics, ratings, and performance trend charts.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-md"
        >
          Refresh Portal
        </button>
      </div>
    );
  }

  // --- SVG CHART RENDERERS ---

  // 1. Donut Chart for Strengths/Issues
  const DonutChart = ({ items, colors = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'] }) => {
    const total = items.reduce((sum, item) => sum + item.value, 0);
    let accumulatedPercent = 0;

    return (
      <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
        {/* SVG Circle */}
        <div className="relative w-44 h-44 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            {/* Background ring */}
            <circle cx="18" cy="18" r="15.915" fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="2.5" />
            
            {items.map((item, idx) => {
              const percent = (item.value / total) * 100;
              const strokeDasharray = `${percent} ${100 - percent}`;
              const strokeDashoffset = 100 - accumulatedPercent + 25; // 25 to adjust offset
              accumulatedPercent += percent;
              
              return (
                <circle
                  key={idx}
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke={colors[idx % colors.length]}
                  strokeWidth="3.2"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-slate-800 dark:text-white">{total}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Entries</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2.5 w-full">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-350">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[idx % colors.length] }}></span>
                <span className="truncate max-w-[160px]">{item.label}</span>
              </div>
              <span className="text-slate-500 dark:text-slate-400 font-bold">
                {item.value} ({Math.round((item.value / total) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 2. Bar Chart for On-Time Performance Trend
  const BarChart = ({ trendData }) => {
    const maxVal = 100;
    const chartHeight = 160;
    const barWidth = 32;
    const gap = 24;
    const chartWidth = trendData.length * (barWidth + gap) + gap;

    return (
      <div className="w-full overflow-x-auto pt-4">
        <svg viewBox={`0 0 ${chartWidth} 200`} className="w-full h-48">
          {/* Grid lines */}
          {[25, 50, 75, 100].map((level) => {
            const y = chartHeight - (level / maxVal) * chartHeight + 20;
            return (
              <g key={level}>
                <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="rgba(148,163,184,0.12)" strokeWidth="1" strokeDasharray="3,3" />
                <text x="5" y={y - 4} fill="rgba(148,163,184,0.4)" fontSize="8" fontWeight="bold">{level}%</text>
              </g>
            );
          })}

          {trendData.map((item, idx) => {
            const h = (item.avgOnTimePercentage / maxVal) * chartHeight;
            const x = idx * (barWidth + gap) + gap;
            const y = chartHeight - h + 20;

            return (
              <g key={idx}>
                {/* Background Track bar */}
                <rect x={x} y="20" width={barWidth} height={chartHeight} rx="6" fill="rgba(148,163,184,0.04)" />
                {/* Active Colored Bar */}
                <motion.rect
                  initial={{ height: 0, y: chartHeight + 20 }}
                  animate={{ height: h, y: y }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  x={x}
                  width={barWidth}
                  rx="6"
                  fill="url(#barGradient)"
                />
                {/* Percentage Text on hover/top */}
                <text x={x + barWidth/2} y={y - 6} textAnchor="middle" fill="#10B981" fontSize="9" fontWeight="bold">
                  {item.avgOnTimePercentage}%
                </text>
                {/* Month label */}
                <text x={x + barWidth/2} y={chartHeight + 35} textAnchor="middle" fill="rgba(148,163,184,0.7)" fontSize="9" fontWeight="bold">
                  {item.month.split(' ')[0]}
                </text>
              </g>
            );
          })}

          {/* Gradients */}
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  // 3. Line Chart for Generation Counts Trend
  const LineChart = ({ trendData }) => {
    const counts = trendData.map(d => d.count);
    const maxVal = Math.max(...counts, 4) + 1;
    const chartHeight = 160;
    const gap = 60;
    const chartWidth = (trendData.length - 1) * gap + 80;

    // Generate path points
    const points = trendData.map((item, idx) => {
      const x = idx * gap + 40;
      const y = chartHeight - (item.count / maxVal) * chartHeight + 20;
      return { x, y };
    });

    const pathD = points.length > 0 
      ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') 
      : '';
      
    const areaD = points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${chartHeight + 20} L ${points[0].x} ${chartHeight + 20} Z`
      : '';

    return (
      <div className="w-full overflow-x-auto pt-4">
        <svg viewBox={`0 0 ${chartWidth} 200`} className="w-full h-48">
          {/* Grid lines */}
          {[1, 2, 3, 5, 8, 12].map((level, idx) => {
            if (level > maxVal) return null;
            const y = chartHeight - (level / maxVal) * chartHeight + 20;
            return (
              <g key={idx}>
                <line x1="20" y1={y} x2={chartWidth - 20} y2={y} stroke="rgba(148,163,184,0.1)" strokeWidth="1" />
                <text x="5" y={y + 3} fill="rgba(148,163,184,0.4)" fontSize="8" fontWeight="bold">{level}</text>
              </g>
            );
          })}

          {/* Area under line */}
          {points.length > 0 && (
            <motion.path
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              transition={{ duration: 1 }}
              d={areaD}
              fill="url(#lineAreaGradient)"
            />
          )}

          {/* Connected Line */}
          {points.length > 0 && (
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, ease: 'easeInOut' }}
              d={pathD}
              fill="none"
              stroke="#2563EB"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          )}

          {/* Circles at coordinates */}
          {points.map((pt, idx) => (
            <g key={idx}>
              <circle cx={pt.x} cy={pt.y} r="5" fill="#2563EB" stroke="#ffffff" strokeWidth="2" className="cursor-pointer" />
              {/* Value tag */}
              <text x={pt.x} y={pt.y - 10} textAnchor="middle" fill="#2563EB" fontSize="9" fontWeight="bold">
                {trendData[idx].count}
              </text>
              {/* Label */}
              <text x={pt.x} y={chartHeight + 35} textAnchor="middle" fill="rgba(148,163,184,0.7)" fontSize="9" fontWeight="bold">
                {trendData[idx].month.split(' ')[0]}
              </text>
            </g>
          ))}

          {/* Gradients */}
          <defs>
            <linearGradient id="lineAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      
      {/* 3 Core Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Total Generated Feedback */}
        <div className="glass-panel p-5 bg-white/70 dark:bg-slate-900/60 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-primary text-2xl flex-shrink-0">
            <FiFileText />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Scripts Drafted</span>
            <h4 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-0.5">{data.totalGenerated}</h4>
          </div>
        </div>

        {/* Avg Driver Rating */}
        <div className="glass-panel p-5 bg-white/70 dark:bg-slate-900/60 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-550 dark:text-amber-400 text-2xl flex-shrink-0">
            <FiAward />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Average Customer Rating</span>
            <h4 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-0.5">{data.avgCustomerRating.toFixed(1)} <span className="text-sm text-slate-400 font-medium">/ 5.0</span></h4>
          </div>
        </div>

        {/* Average On-Time Percentage */}
        <div className="glass-panel p-5 bg-white/70 dark:bg-slate-900/60 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-accent text-2xl flex-shrink-0">
            <FiClock />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg On-Time Percentage</span>
            <h4 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-0.5">{data.avgOnTimePercentage}%</h4>
          </div>
        </div>

      </div>

      {/* Grid: Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Line Chart: Monthly Generation Trends */}
        <div className="glass-panel p-6 bg-white/70 dark:bg-slate-900/60">
          <div className="mb-2">
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-white uppercase tracking-wider">Monthly Feedback Trends</h3>
            <p className="text-[10px] text-slate-400">Monthly counts of generated AI coaching scripts</p>
          </div>
          <LineChart trendData={data.monthlyTrend} />
        </div>

        {/* Bar Chart: On-Time Performance Trend */}
        <div className="glass-panel p-6 bg-white/70 dark:bg-slate-900/60">
          <div className="mb-2">
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-white uppercase tracking-wider">On-Time Percentage Trend</h3>
            <p className="text-[10px] text-slate-400">Average schedule compliance scores grouped by month</p>
          </div>
          <BarChart trendData={data.monthlyTrend} />
        </div>

        {/* Donut Chart: Top Strengths */}
        <div className="glass-panel p-6 bg-white/70 dark:bg-slate-900/60">
          <div className="mb-4">
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-white uppercase tracking-wider">Top Driver Strengths</h3>
            <p className="text-[10px] text-slate-400">Frequency breakdown of qualitative driver highlights</p>
          </div>
          <DonutChart items={data.strengthsBreakdown} colors={['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#06B6D4']} />
        </div>

        {/* Donut Chart: Common Issues */}
        <div className="glass-panel p-6 bg-white/70 dark:bg-slate-900/60">
          <div className="mb-4">
            <h3 className="font-extrabold text-sm text-slate-850 dark:text-white uppercase tracking-wider">Common Operational Concerns</h3>
            <p className="text-[10px] text-slate-400">Frequency breakdown of driver areas for improvements</p>
          </div>
          <DonutChart items={data.issuesBreakdown} colors={['#EF4444', '#F59E0B', '#F43F5E', '#EC4899', '#8B5CF6']} />
        </div>

      </div>

    </div>
  );
};

export default Analytics;
