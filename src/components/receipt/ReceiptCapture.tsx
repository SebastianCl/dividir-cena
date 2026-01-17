'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, Upload, Loader2, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReceiptCaptureProps {
  onCapture: (file: File) => void
  isProcessing?: boolean
  previewUrl?: string | null
}

export function ReceiptCapture({
  onCapture,
  isProcessing = false,
  previewUrl,
}: ReceiptCaptureProps) {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      onCapture(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0])
    }
  }

  if (previewUrl) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0 relative">
          <img
            src={previewUrl}
            alt="Factura capturada"
            className="w-full h-48 object-cover"
          />
          {isProcessing && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm font-medium">Procesando factura...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'border-2 border-dashed transition-colors',
        dragActive && 'border-primary bg-primary/5'
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setDragActive(true)
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-muted p-4">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          
          <div>
            <p className="font-medium">Captura la factura</p>
            <p className="text-sm text-muted-foreground">
              Toma una foto o sube una imagen
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isProcessing}
            >
              <Camera className="h-4 w-4 mr-2" />
              Cámara
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <Upload className="h-4 w-4 mr-2" />
              Subir
            </Button>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleChange}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
          />
        </div>
      </CardContent>
    </Card>
  )
}
