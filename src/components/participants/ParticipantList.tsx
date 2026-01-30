'use client'

import { useState } from 'react'
import { useSessionStore } from '@/store/session-store'
import { ParticipantAvatar } from './ParticipantAvatar'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Users, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Participant } from '@/types/database'

export function ParticipantList() {
  const { participants, currentParticipant, removeParticipant } = useSessionStore()
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteParticipant = async () => {
    if (!participantToDelete) return

    setIsDeleting(true)
    const supabase = createClient()
    const participantId = participantToDelete.id

    try {
      // Primero eliminamos las asignaciones del participante
      const { error: assignmentsError } = await supabase
        .from('assignments')
        .delete()
        .eq('participant_id', participantId)

      if (assignmentsError) {
        console.error('Error deleting assignments:', assignmentsError)
      }

      // Luego eliminamos al participante
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', participantId)

      if (error) throw error

      // Actualizar el estado local inmediatamente
      removeParticipant(participantId)
      
      toast.success('Participante eliminado correctamente')
      setParticipantToDelete(null)
    } catch (error) {
      console.error('Error deleting participant:', error)
      toast.error('Error al eliminar el participante')
    } finally {
      setIsDeleting(false)
    }
  }

  if (participants.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
        <Users className="h-4 w-4" />
        <span>Esperando participantes...</span>
      </div>
    )
  }

  const isOwner = currentParticipant?.is_owner

  return (
    <>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 py-2 px-1">
          {participants.map((participant) => {
            const canDelete = isOwner && participant.id !== currentParticipant?.id
            
            return (
              <div key={participant.id} className="relative group">
                <ParticipantAvatar
                  name={participant.name}
                  color={participant.color}
                  size="lg"
                  showName
                  selected={currentParticipant?.id === participant.id}
                />
                {canDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setParticipantToDelete(participant)
                    }}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                    title="Eliminar participante"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <Dialog open={!!participantToDelete} onOpenChange={(open) => !open && setParticipantToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar participante</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar a <strong>{participantToDelete?.name}</strong>?
              Sus items asignados quedarán liberados para otros participantes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setParticipantToDelete(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteParticipant}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
