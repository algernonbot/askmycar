import { Car, ChatSession, Message } from '@/types/car'

const CARS_KEY = 'askmycar:cars'
const SESSIONS_KEY = 'askmycar:sessions'

// --- Cars ---

export function getCars(): Car[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(CARS_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveCar(car: Car): void {
  const cars = getCars()
  const existing = cars.findIndex(c => c.id === car.id)
  if (existing >= 0) {
    cars[existing] = car
  } else {
    cars.push(car)
  }
  localStorage.setItem(CARS_KEY, JSON.stringify(cars))
}

export function deleteCar(id: string): void {
  const cars = getCars().filter(c => c.id !== id)
  localStorage.setItem(CARS_KEY, JSON.stringify(cars))
  // also clean up session
  const sessions = getSessions()
  delete sessions[id]
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function getCarById(id: string): Car | null {
  return getCars().find(c => c.id === id) ?? null
}

// --- Sessions ---

export function getSessions(): Record<string, ChatSession> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '{}')
  } catch {
    return {}
  }
}

export function getSession(carId: string): ChatSession {
  const sessions = getSessions()
  return sessions[carId] ?? { carId, messages: [] }
}

export function appendMessage(carId: string, message: Message): void {
  const sessions = getSessions()
  if (!sessions[carId]) {
    sessions[carId] = { carId, messages: [] }
  }
  sessions[carId].messages.push(message)
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function clearSession(carId: string): void {
  const sessions = getSessions()
  sessions[carId] = { carId, messages: [] }
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}
