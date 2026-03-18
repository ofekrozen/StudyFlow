import { type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, id, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        id={id}
        {...props}
        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2
          ${error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'}
          dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 ${className}`}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
