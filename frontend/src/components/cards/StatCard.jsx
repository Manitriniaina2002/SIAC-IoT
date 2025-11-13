import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Reusable gradient stat card component
 * @param {string} title - Card title
 * @param {string|number} value - Main value to display
 * @param {string} description - Description text below value
 * @param {React.Component} icon - Lucide icon component
 * @param {string} gradient - Gradient color classes (e.g., "from-violet-500 via-purple-600 to-indigo-700")
 */
export default function StatCard({ title, value, description, icon: Icon, gradient }) {
  return (
    <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${gradient} text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-white/90">{title}</CardTitle>
        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold mb-2">{value}</div>
        <p className="text-xs text-white/80">{description}</p>
      </CardContent>
    </Card>
  )
}
