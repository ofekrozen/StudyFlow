import { type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export default function Select({ label, error, id, className = '', children, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <select
        id={id}
        {...props}
        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2
          ${error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'}
          dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white ${className}`}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
