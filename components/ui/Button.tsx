'use client'

import { ReactNode } from 'react'
import clsx from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'text-bga-accent hover:text-bga-accent/80',
  }

  const sizes = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      className={clsx('btn', variants[variant], sizes[size], className)}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center">
          <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  )
}
