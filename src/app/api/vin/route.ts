import { NextRequest, NextResponse } from 'next/server'
import { decodeVIN } from '@/lib/nhtsa'

export async function GET(request: NextRequest) {
  const vin = request.nextUrl.searchParams.get('vin')
  if (!vin || vin.length !== 17) {
    return NextResponse.json({ error: 'VIN must be 17 characters' }, { status: 400 })
  }

  try {
    const vehicle = await decodeVIN(vin)
    if (!vehicle.make || !vehicle.model) {
      return NextResponse.json({ error: 'Could not decode VIN — check the number and try again' }, { status: 400 })
    }
    return NextResponse.json(vehicle)
  } catch (e) {
    console.error('VIN decode error:', e)
    return NextResponse.json({ error: 'Failed to decode VIN' }, { status: 500 })
  }
}
