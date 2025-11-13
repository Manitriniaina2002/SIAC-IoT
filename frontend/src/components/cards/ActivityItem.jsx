import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'

/**
 * Reusable activity item component
 * @param {string} text - Activity text
 * @param {string} time - Time information
 * @param {string} type - Activity type (success, danger, warning, info)
 * @param {React.Component} icon - Lucide icon component
 * @param {function} getActivityColor - Function to get color based on type
 * @param {function} getBadgeVariant - Function to get badge variant based on type
 */
export default function ActivityItem({ text, time, type, icon: Icon, getActivityColor, getBadgeVariant }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-purple-50/50 transition-all duration-200 border border-transparent hover:border-violet-100 group">
      <div className={`p-2.5 rounded-xl ${getActivityColor(type)} group-hover:scale-110 transition-transform duration-200`}>
        <Icon className="h-4 w-4" style={type === 'success' ? {color: '#07005F'} : {}} />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{text}</p>
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{time}</p>
        </div>
      </div>
      <Badge variant={getBadgeVariant(type)} className="capitalize shadow-sm">
        {type}
      </Badge>
    </div>
  )
}
