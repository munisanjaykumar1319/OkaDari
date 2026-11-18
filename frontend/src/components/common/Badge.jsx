import React from 'react';

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) {
  const base = 'inline-flex items-center font-medium rounded-full';

  const variants = {
    default: 'bg-slate-800 text-slate-300 border border-slate-700/80',
    primary: 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 shadow-sm shadow-cyan-950/40',
    success: 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shadow-sm shadow-emerald-950/40',
    warning: 'bg-amber-950/80 text-amber-400 border border-amber-800/60 shadow-sm shadow-amber-950/40',
    danger: 'bg-rose-950/80 text-rose-400 border border-rose-800/60 shadow-sm shadow-rose-950/40',
    indigo: 'bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 shadow-sm shadow-indigo-950/40',
  };

  const dots = {
    default: 'bg-slate-400',
    primary: 'bg-cyan-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    indigo: 'bg-indigo-400',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span className={`${base} ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dots[variant] || dots.default} animate-pulse`} />
      )}
      {children}
    </span>
  );
}
