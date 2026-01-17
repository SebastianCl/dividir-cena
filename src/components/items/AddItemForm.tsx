'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, X } from 'lucide-react'
import { parseCOP } from '@/lib/currency'

interface AddItemFormProps {
  onAdd: (name: string, price: number, quantity: number) => void
}

export function AddItemForm({ onAdd }: AddItemFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('1')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !price) return

    onAdd(name.trim(), parseCOP(price), parseInt(quantity) || 1)
    setName('')
    setPrice('')
    setQuantity('1')
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        className="w-full border-dashed"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Agregar producto
      </Button>
    )
  }

  return (
    <Card>
      <CardContent className="p-3">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Nuevo producto</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del producto"
            autoFocus
          />
          
          <div className="flex gap-2">
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Cant."
              className="w-20"
              min={1}
            />
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Precio unitario"
              className="flex-1"
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={!name || !price}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
