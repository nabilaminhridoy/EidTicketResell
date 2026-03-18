import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET - Load PipraPay configuration
export async function GET() {
  try {
    const gateway = await db.paymentGateway.findUnique({
      where: { name: 'piprapay' }
    })

    if (!gateway) {
      return NextResponse.json({ gateway: null })
    }

    // Parse credentials
    let credentials = {}
    if (gateway.credentials) {
      try {
        credentials = JSON.parse(gateway.credentials)
      } catch (e) {
        credentials = {}
      }
    }

    return NextResponse.json({
      gateway: {
        id: gateway.id,
        name: gateway.name,
        isEnabled: gateway.isEnabled,
        isSandbox: gateway.isSandbox,
        credentials: {
          apiKey: credentials.apiKey || '',
          baseUrl: credentials.baseUrl || '',
          redirectUrl: credentials.redirectUrl || '',
          cancelUrl: credentials.cancelUrl || '',
          webhookUrl: credentials.webhookUrl || '',
          currency: credentials.currency || 'BDT',
          returnType: credentials.returnType || 'POST',
        },
      }
    })
  } catch (error) {
    console.error('Error loading PipraPay config:', error)
    return NextResponse.json({ error: 'Failed to load configuration' }, { status: 500 })
  }
}

// POST - Save PipraPay configuration
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { isEnabled, isSandbox, credentials } = data

    // Save to PaymentGateway table
    const gateway = await db.paymentGateway.upsert({
      where: { name: 'piprapay' },
      update: {
        isEnabled: isEnabled || false,
        isSandbox: isSandbox !== false,
        credentials: JSON.stringify(credentials || {}),
      },
      create: {
        name: 'piprapay',
        isEnabled: isEnabled || false,
        isSandbox: isSandbox !== false,
        credentials: JSON.stringify(credentials || {}),
      },
    })

    return NextResponse.json({
      success: true,
      gateway: {
        id: gateway.id,
        name: gateway.name,
        isEnabled: gateway.isEnabled,
        isSandbox: gateway.isSandbox,
      }
    })
  } catch (error) {
    console.error('Error saving PipraPay config:', error)
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 })
  }
}
