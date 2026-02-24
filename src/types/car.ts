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
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sources?: string[]
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
