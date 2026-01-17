'use client'

import { useSessionStore } from '@/store/session-store'
import { ParticipantAvatar } from './ParticipantAvatar'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Users } from 'lucide-react'

export function ParticipantList() {
  const { participants, currentParticipant } = useSessionStore()

  if (participants.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
        <Users className="h-4 w-4" />
        <span>Esperando participantes...</span>
      </div>
    )
  }

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-3 py-2">
        {participants.map((participant) => (
          <ParticipantAvatar
            key={participant.id}
            name={participant.name}
            color={participant.color}
            size="lg"
            showName
            selected={currentParticipant?.id === participant.id}
          />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
