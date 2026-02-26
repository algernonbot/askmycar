export interface Car {
  id: string
  vin?: string
  year: number
  make: string
  model: string
  trim?: string
  engine?: string
  color?: string
  nickname?: string
  addedAt: string
  manualUrl?: string
  imageUrl?: string
  imageGenerating?: boolean
  recalls?: RecallItem[]
  hasOpenRecalls?: boolean
  maintenanceLog?: MaintenanceEntry[]
}

export interface RecallItem {
  NHTSAActionNumber: string
  Component: string
  Summary: string
  Consequence: string
  Remedy: string
}

export interface MaintenanceEntry {
  id: string
  type: string
  label: string
  date: string
  mileage?: number
  notes?: string
  cost?: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sources?: string[]
  image?: string
}

export interface ChatSession {
  carId: string
  messages: Message[]
}

export interface NHTSADecodeResult {
  Value: string | null
  ValueId: string | null
  Variable: string
  VariableId: number
}
