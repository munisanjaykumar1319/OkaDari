import React from 'react';

export default function Input({
  label,
  id,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error,
  helperText,
  icon: Icon,
  className = '',
  required = false,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          {label} {required && <span className="text-blue-600">*</span>}
        </label>
      )}
      <div className="relative rounded-xl shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`block w-full rounded-xl bg-white border text-gray-900 placeholder-gray-400 text-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
            Icon ? 'pl-10 pr-4' : 'px-4'
          } py-3 ${
            error
              ? 'border-red-500 focus:border-red-500'
              : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
          }`}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
}
