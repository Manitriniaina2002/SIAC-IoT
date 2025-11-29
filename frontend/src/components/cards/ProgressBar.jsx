import React from 'react'

/**
 * Reusable progress bar component
 * @param {string} label - Progress label
 * @param {number} percentage - Progress percentage (0-100)
 * @param {string} gradient - Gradient style for the progress bar
 */
export default function ProgressBar({ label, percentage, gradient }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground font-semibold">{percentage}%</span>
      </div>
      <div className="h-3 bg-secondary/50 rounded-full overflow-hidden shadow-inner">
        <div 
          className="h-full rounded-full shadow-sm" 
          style={{
            width: `${percentage}%`, 
            background: gradient
          }}
        ></div>
      </div>
    </div>
  )
}
