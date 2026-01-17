'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/colors'
import { cn } from '@/lib/utils'

interface ParticipantAvatarProps {
  name: string
  color: string
  size?: 'sm' | 'md' | 'lg'
  selected?: boolean
  onClick?: () => void
  showName?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
}

export function ParticipantAvatar({
  name,
  color,
  size = 'md',
  selected = false,
  onClick,
  showName = false,
  className,
}: ParticipantAvatarProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <Avatar
        className={cn(
          sizeClasses[size],
          'ring-2 ring-offset-2 transition-all',
          selected ? 'ring-primary' : 'ring-transparent',
          onClick && 'hover:ring-primary/50'
        )}
        style={{ backgroundColor: color }}
      >
        <AvatarFallback
          style={{ backgroundColor: color }}
          className="text-white font-medium"
        >
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {showName && (
        <span className="text-xs text-muted-foreground truncate max-w-16">
          {name.split(' ')[0]}
        </span>
      )}
    </div>
  )
}
