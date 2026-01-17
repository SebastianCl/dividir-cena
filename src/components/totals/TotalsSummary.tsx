'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ParticipantAvatar } from '@/components/participants/ParticipantAvatar'

import { useSessionStore } from '@/store/session-store'
import { formatCOP, calculateTotalWithExtras } from '@/lib/currency'
import { createClient } from '@/lib/supabase/client'
import { Copy, Check, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import type { Session } from '@/types/database'

export function TotalsSummary() {
  const { session, participants, items, assignments, getParticipantTotal } = useSessionStore()
  const [tipPercentage, setTipPercentage] = useState(session?.tip_percentage || 0)
  const [taxAmount, setTaxAmount] = useState(session?.tax_amount || 0)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0)
  const { tip, total } = calculateTotalWithExtras(subtotal, tipPercentage, taxAmount)

  // Calcular total por persona incluyendo propina e impuestos proporcionales
  const getParticipantFinalTotal = (participantId: string) => {
    const participantSubtotal = getParticipantTotal(participantId)
    if (subtotal === 0) return 0
    
    const proportion = participantSubtotal / subtotal
    const participantTip = tip * proportion
    const participantTax = taxAmount * proportion
    
    return participantSubtotal + participantTip + participantTax
  }

  const handleTipChange = async (value: number) => {
    setTipPercentage(value)
    if (session) {
      await supabase
        .from('sessions')
        .update({ tip_percentage: value } as any)
        .eq('id', session.id)
    }
  }

  const handleTaxChange = async (value: number) => {
    setTaxAmount(value)
    if (session) {
      await supabase
        .from('sessions')
        .update({ tax_amount: value } as any)
        .eq('id', session.id)
    }
  }

  const generateSummary = () => {
    let summary = `🍽️ *Resumen de la Cena*\n`
    summary += `━━━━━━━━━━━━━━━━━━\n\n`
    
    participants.forEach((p) => {
      const total = getParticipantFinalTotal(p.id)
      summary += `👤 ${p.name}: ${formatCOP(total)}\n`
    })
    
    summary += `\n━━━━━━━━━━━━━━━━━━\n`
    summary += `📊 Subtotal: ${formatCOP(subtotal)}\n`
    if (tipPercentage > 0) {
      summary += `💰 Propina (${tipPercentage}%): ${formatCOP(tip)}\n`
    }
    if (taxAmount > 0) {
      summary += `🧾 Impuestos: ${formatCOP(taxAmount)}\n`
    }
    summary += `💵 *Total: ${formatCOP(total)}*`
    
    return summary
  }

  const handleCopy = async () => {
    const summary = generateSummary()
    await navigator.clipboard.writeText(summary)
    setCopied(true)
    toast.success('Resumen copiado al portapapeles')
    setTimeout(() => setCopied(false), 2000)
  }

  const unassignedTotal = items
    .filter((item) => !assignments.some((a) => a.item_id === item.id))
    .reduce((sum, item) => sum + item.total_price, 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Receipt className="h-5 w-5" />
          Resumen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Totales por persona */}
        <div className="space-y-2">
          {participants.map((p) => {
            const participantTotal = getParticipantFinalTotal(p.id)
            return (
              <div key={p.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ParticipantAvatar
                    name={p.name}
                    color={p.color}
                    size="sm"
                  />
                  <span className="text-sm">{p.name}</span>
                </div>
                <span className="font-semibold">
                  {formatCOP(participantTotal)}
                </span>
              </div>
            )
          })}
        </div>

        {unassignedTotal > 0 && (
          <div className="flex items-center justify-between text-orange-600 text-sm">
            <span>⚠️ Sin asignar</span>
            <span>{formatCOP(unassignedTotal)}</span>
          </div>
        )}

        <Separator />

        {/* Configuración de propina e impuestos */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="tip" className="text-xs">
              Propina (%)
            </Label>
            <Input
              id="tip"
              type="number"
              value={tipPercentage}
              onChange={(e) => handleTipChange(parseFloat(e.target.value) || 0)}
              min={0}
              max={100}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tax" className="text-xs">
              Impuestos ($)
            </Label>
            <Input
              id="tax"
              type="number"
              value={taxAmount}
              onChange={(e) => handleTaxChange(parseFloat(e.target.value) || 0)}
              min={0}
              className="h-8"
            />
          </div>
        </div>

        <Separator />

        {/* Totales */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCOP(subtotal)}</span>
          </div>
          {tipPercentage > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Propina ({tipPercentage}%)</span>
              <span>{formatCOP(tip)}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Impuestos</span>
              <span>{formatCOP(taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2">
            <span>Total</span>
            <span className="text-primary">{formatCOP(total)}</span>
          </div>
        </div>

        {/* Botón copiar */}
        <Button className="w-full" onClick={handleCopy}>
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copiar resumen
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
