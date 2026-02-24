import { NHTSADecodeResult } from '@/types/car'

const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles'

export interface DecodedVehicle {
  make: string
  model: string
  year: number
  trim: string
  engine: string
  bodyStyle: string
  driveType: string
  fuelType: string
  manufacturer: string
}

function extract(results: NHTSADecodeResult[], variable: string): string {
  const match = results.find(r => r.Variable === variable)
  return match?.Value?.trim() || ''
}

export async function decodeVIN(vin: string): Promise<DecodedVehicle> {
  const url = `${NHTSA_BASE}/DecodeVin/${vin.toUpperCase()}?format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error('NHTSA API error')
  const data = await res.json()
  const results: NHTSADecodeResult[] = data.Results

  const yearStr = extract(results, 'Model Year')
  const year = parseInt(yearStr) || new Date().getFullYear()

  return {
    make: extract(results, 'Make'),
    model: extract(results, 'Model'),
    year,
    trim: extract(results, 'Trim') || extract(results, 'Series'),
    engine: [
      extract(results, 'Displacement (L)') ? `${extract(results, 'Displacement (L)')}L` : '',
      extract(results, 'Engine Number of Cylinders') ? `${extract(results, 'Engine Number of Cylinders')}-cyl` : '',
    ].filter(Boolean).join(' '),
    bodyStyle: extract(results, 'Body Class'),
    driveType: extract(results, 'Drive Type'),
    fuelType: extract(results, 'Fuel Type - Primary'),
    manufacturer: extract(results, 'Manufacturer Name'),
  }
}

export async function searchVehiclesByYearMakeModel(
  year: string,
  make: string,
  model: string,
): Promise<string[]> {
  const url = `${NHTSA_BASE}/getmodelsformakeyear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()
  return data.Results?.map((r: { Model_Name: string }) => r.Model_Name) || []
}

export async function getMakesForYear(year: string): Promise<string[]> {
  const url = `${NHTSA_BASE}/GetMakesForVehicleType/car?format=json`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json()
  return data.Results?.map((r: { MakeName: string }) => r.MakeName).slice(0, 50) || []
}
