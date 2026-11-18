import React from 'react';

export default function Card({
  children,
  className = '',
  hoverEffect = false,
  glow = false,
  ...props
}) {
  return (
    <div
      className={`bg-[#0d1527]/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm transition-all duration-300 ${
        hoverEffect ? 'hover:border-slate-700 hover:shadow-2xl hover:shadow-cyan-950/20 hover:-translate-y-0.5' : ''
      } ${glow ? 'ring-1 ring-cyan-500/20 shadow-cyan-950/30' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between pb-4 mb-4 border-b border-slate-800/80 ${className}`}>
      <div>
        {title && <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>}
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
