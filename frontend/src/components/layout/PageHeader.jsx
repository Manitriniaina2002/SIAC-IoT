import React from 'react'

/**
 * Reusable page header component
 * @param {string} title - Page title
 * @param {string} description - Page description
 * @param {React.Component} icon - Optional icon component
 */
export default function PageHeader({ title, description, icon: Icon }) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3" style={{color: '#000000'}}>
        {Icon && <Icon className="h-8 w-8" />}
        {title}
      </h1>
      {description && <p className="text-gray-600">{description}</p>}
    </div>
  )
}
