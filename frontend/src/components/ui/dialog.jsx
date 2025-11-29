import React from 'react'
import { X } from 'lucide-react'

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 w-full max-w-lg mx-4">
        {children}
      </div>
    </div>
  )
}

export function DialogContent({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-lg shadow-2xl ${className}`}>
      {children}
    </div>
  )
}

export function DialogHeader({ children, className = '' }) {
  return (
    <div className={`px-6 pt-6 pb-4 border-b ${className}`}>
      {children}
    </div>
  )
}

export function DialogTitle({ children, className = '' }) {
  return (
    <h2 className={`text-xl font-semibold text-gray-900 ${className}`}>
      {children}
    </h2>
  )
}

export function DialogDescription({ children, className = '' }) {
  return (
    <p className={`text-sm text-gray-600 mt-1 ${className}`}>
      {children}
    </p>
  )
}

export function DialogFooter({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-lg ${className}`}>
      {children}
    </div>
  )
}

export function DialogClose({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
    >
      {children || <X size={20} className="text-gray-500" />}
    </button>
  )
}
