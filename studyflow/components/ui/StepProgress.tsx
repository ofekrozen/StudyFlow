interface StepProgressProps {
  steps: number
  current: number
}

export default function StepProgress({ steps, current }: StepProgressProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: steps }, (_, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div key={step} className="flex items-center gap-2 flex-1 last:flex-none">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors
                ${done ? 'bg-blue-600 text-white' : active ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900' : 'bg-gray-200 text-gray-500 dark:bg-white/10 dark:text-gray-400'}`}
            >
              {done ? '✓' : step}
            </div>
            {step < steps && (
              <div className={`h-0.5 flex-1 rounded-full ${done ? 'bg-blue-600' : 'bg-gray-200 dark:bg-white/10'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
