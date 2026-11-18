import React from 'react';

export default function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50 border-blue-100',
  trend,
  className = '',
}) {
  return (
    <div className={`p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition duration-200 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${iconBg} ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-gray-900 tracking-tight">{value}</span>
        {trend && (
          <span className="text-xs font-semibold text-emerald-600 flex items-center">
            {trend}
          </span>
        )}
      </div>
      {subtext && <p className="text-xs text-gray-500 mt-1.5">{subtext}</p>}
    </div>
  );
}
