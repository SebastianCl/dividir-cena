import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Tipos para los items detectados
interface DetectedItem {
  name: string
  quantity: number
  unit_price: number
  confidence: number
}

// Simulación de procesamiento OCR para el MVP
// En producción, esto usaría AWS Textract
async function processReceiptWithOCR(imageBuffer: ArrayBuffer): Promise<DetectedItem[]> {
  // Simular delay de procesamiento
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Por ahora, retornamos items de ejemplo
  // En producción, aquí iría la llamada a AWS Textract
  const mockItems: DetectedItem[] = [
    { name: 'Hamburguesa Clásica', quantity: 2, unit_price: 28000, confidence: 0.95 },
    { name: 'Pizza Margarita', quantity: 1, unit_price: 42000, confidence: 0.92 },
    { name: 'Coca Cola', quantity: 3, unit_price: 6000, confidence: 0.98 },
    { name: 'Papas Fritas', quantity: 2, unit_price: 12000, confidence: 0.89 },
    { name: 'Cerveza Artesanal', quantity: 4, unit_price: 15000, confidence: 0.85 },
  ]

  return mockItems
}

import { TextractClient, AnalyzeExpenseCommand } from '@aws-sdk/client-textract'

async function processWithTextract(imageBuffer: ArrayBuffer): Promise<DetectedItem[]> {
  const client = new TextractClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })

  const command = new AnalyzeExpenseCommand({
    Document: {
      Bytes: new Uint8Array(imageBuffer),
    },
  })

  const response = await client.send(command)
  const items: DetectedItem[] = []

  // Procesar respuesta de Textract
  response.ExpenseDocuments?.forEach((doc) => {
    doc.LineItemGroups?.forEach((group) => {
      group.LineItems?.forEach((lineItem) => {
        let name = ''
        let quantity = 1
        let unitPrice = 0
        let confidence = 0

        lineItem.LineItemExpenseFields?.forEach((field) => {
          const fieldType = field.Type?.Text
          const value = field.ValueDetection?.Text || ''
          const fieldConfidence = field.ValueDetection?.Confidence || 0

          if (fieldType === 'ITEM') {
            name = value
            confidence = Math.max(confidence, fieldConfidence / 100)
          } else if (fieldType === 'QUANTITY') {
            quantity = parseInt(value) || 1
          } else if (fieldType === 'PRICE' || fieldType === 'UNIT_PRICE') {
            // Parsear precio colombiano
            unitPrice = parseFloat(value.replace(/[^\d.,]/g, '').replace('.', '').replace(',', '.')) || 0
          }
        })

        if (name && unitPrice > 0) {
          items.push({ name, quantity, unit_price: unitPrice, confidence })
        }
      })
    })
  })

  return items
}


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    const sessionId = formData.get('sessionId') as string

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No se proporcionó imagen' },
        { status: 400 }
      )
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No se proporcionó ID de sesión' },
        { status: 400 }
      )
    }

    // Convertir archivo a buffer
    const imageBuffer = await imageFile.arrayBuffer()

    // Procesar con OCR
    const detectedItems = await processWithTextract(imageBuffer)

    // Guardar items en la base de datos
    const supabase = await createClient()
    
    const itemsToInsert = detectedItems.map((item, index) => ({
      session_id: sessionId,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      ocr_confidence: item.confidence,
      order_index: index,
      manually_added: false,
    }))

    const { data: insertedItems, error } = await supabase
      .from('items')
      .insert(itemsToInsert as any)
      .select()

    if (error) {
      console.error('Error inserting items:', error)
      // Aún así retornar los items detectados
      return NextResponse.json({ 
        items: detectedItems,
        saved: false,
        error: error.message 
      })
    }

    return NextResponse.json({
      items: detectedItems,
      saved: true,
      savedItems: insertedItems,
    })
  } catch (error) {
    console.error('OCR Error:', error)
    return NextResponse.json(
      { error: 'Error procesando la imagen' },
      { status: 500 }
    )
  }
}
