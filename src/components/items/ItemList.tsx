
'use client'

import { useSessionStore } from '@/store/session-store'
import { createClient } from '@/lib/supabase/client'
import { ItemCard } from './ItemCard'
import { AddItemForm } from './AddItemForm'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ShoppingCart } from 'lucide-react'
import type { Item, Assignment } from '@/types/database'

interface ItemListProps {
  sessionId: string
  isOwner?: boolean
}

export function ItemList({ sessionId, isOwner = false }: ItemListProps) {
  const { items, assignments, participants, updateItem, removeItem, addItem, addAssignment, removeAssignment } = useSessionStore()
  const supabase = createClient()

  const handleEdit = async (id: string, updates: Partial<Item>) => {
    updateItem(id, updates)
    await supabase
      .from('items')
      .update(updates as any)
      .eq('id', id)
  }

  const handleDelete = async (id: string) => {
    // Actualización optimista
    removeItem(id)
    // Sincronizar con Supabase
    await supabase.from('items').delete().eq('id', id)
  }

  const handleAdd = async (name: string, price: number, quantity: number) => {
    const newItem: import('@/types/database').Database['public']['Tables']['items']['Insert'] = {
      session_id: sessionId,
      name,
      unit_price: price,
      quantity,
      manually_added: true,
      order_index: items.length,
    }
    await supabase
      .from('items')
      .insert(newItem as any)
  }

  const handleToggleAssignment = async (itemId: string, participantId: string) => {
    const existingAssignment = assignments.find(
      (a) => a.item_id === itemId && a.participant_id === participantId
    )
    if (existingAssignment) {
      removeAssignment(existingAssignment.id)
      await supabase.from('assignments').delete().eq('id', existingAssignment.id)
    } else {
      const newAssignment: import('@/types/database').Database['public']['Tables']['assignments']['Insert'] = {
        item_id: itemId,
        participant_id: participantId,
        share_fraction: 1.0,
      }
      const { data } = await supabase
        .from('assignments')
        .insert(newAssignment as any)
        .select()
        .single()
      if (data) {
        addAssignment(data as Assignment)
      }
    }
    const itemAssignments = assignments.filter((a) => a.item_id === itemId)
    const willBeShared = existingAssignment 
      ? itemAssignments.length > 2 
      : itemAssignments.length >= 1
    await supabase
      .from('items')
      .update({ is_shared: willBeShared } as any)
      .eq('id', itemId)
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          No hay productos todavía
        </p>
        <p className="text-sm text-muted-foreground">
          Captura una factura o agrega productos manualmente
        </p>
        <div className="mt-4 w-full max-w-sm">
          <AddItemForm onAdd={handleAdd} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              assignments={assignments.filter((a) => a.item_id === item.id)}
              participants={participants}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleAssignment={handleToggleAssignment}
              isOwner={isOwner}
            />
          ))}
        </div>
      </ScrollArea>
      <AddItemForm onAdd={handleAdd} />
    </div>
  )
}
