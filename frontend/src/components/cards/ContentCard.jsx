import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Reusable content card with gradient header
 * @param {string} title - Card title
 * @param {string} description - Card description
 * @param {React.Component} icon - Lucide icon component
 * @param {string} iconColor - Icon background color (e.g., "violet")
 * @param {string} gradientFrom - Gradient start color (e.g., "violet-50")
 * @param {string} gradientTo - Gradient end color (e.g., "purple-50")
 * @param {React.ReactNode} children - Card content
 * @param {React.ReactNode} headerActions - Optional actions in header
 */
export default function ContentCard({ 
  title, 
  description, 
  icon: Icon, 
  iconColor = "violet", 
  gradientFrom = "violet-50", 
  gradientTo = "purple-50",
  children,
  headerActions
}) {
  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className={`bg-gradient-to-r from-${gradientFrom} to-${gradientTo} border-b`}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <div className={`p-2 bg-${iconColor}-100 rounded-lg`}>
                <Icon className={`h-5 w-5 text-${iconColor}-600`} />
              </div>
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {children}
      </CardContent>
    </Card>
  )
}
