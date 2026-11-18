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
      className={`bg-white border border-gray-200 rounded-2xl p-6 shadow-sm transition-all duration-300 text-gray-800 ${
        hoverEffect ? 'hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5' : ''
      } ${glow ? 'ring-2 ring-blue-500/20 shadow-blue-500/10' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between pb-4 mb-4 border-b border-gray-100 ${className}`}>
      <div>
        {title && <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>}
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
