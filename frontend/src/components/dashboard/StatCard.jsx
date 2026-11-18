import React from 'react';

export default function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor = 'text-cyan-400',
  iconBg = 'bg-cyan-500/10 border-cyan-500/20',
  trend,
  className = '',
}) {
  return (
    <div className={`p-6 rounded-2xl bg-[#0d1527]/90 border border-slate-800/80 shadow-xl backdrop-blur-sm hover:border-slate-700 transition duration-200 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${iconBg} ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-white tracking-tight">{value}</span>
        {trend && (
          <span className="text-xs font-semibold text-emerald-400 flex items-center">
            {trend}
          </span>
        )}
      </div>
      {subtext && <p className="text-xs text-slate-400 mt-1.5">{subtext}</p>}
    </div>
  );
}
