'use client'

import { useRouter } from 'next/navigation'
import { Car } from '@/types/car'
import { useState } from 'react'

const CAR_EMOJIS: Record<string, string> = {
  'SEDAN': '🚗',
  'SUV': '🚙',
  'TRUCK': '🛻',
  'PICKUP': '🛻',
  'COUPE': '🏎️',
  'SPORTS': '🏎️',
  'VAN': '🚐',
  'MINIVAN': '🚐',
  'CONVERTIBLE': '🏎️',
  'HATCHBACK': '🚗',
  'WAGON': '🚗',
  'DEFAULT': '🚗',
}

function getCarEmoji(car: Car): string {
  const body = (car.model + ' ' + (car.trim || '')).toUpperCase()
  for (const [key, emoji] of Object.entries(CAR_EMOJIS)) {
    if (body.includes(key)) return emoji
  }
  return CAR_EMOJIS.DEFAULT
}

interface CarCardProps {
  car: Car
  onDelete: () => void
}

export default function CarCard({ car, onDelete }: CarCardProps) {
  const router = useRouter()
  const [showActions, setShowActions] = useState(false)

  const displayName = car.nickname || `${car.year} ${car.make} ${car.model}`
  const subtitle = car.nickname ? `${car.year} ${car.make} ${car.model}` : car.trim || car.engine || ''

  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-4 cursor-pointer active:scale-98 select-none"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid transparent',
      }}
      onClick={() => !showActions && router.push(`/car/${car.id}`)}
    >
      {/* Car Icon */}
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
        style={{ background: 'var(--accent-light)' }}
      >
        {getCarEmoji(car)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate" style={{ color: 'var(--text)' }}>
          {displayName}
        </div>
        {subtitle && (
          <div className="text-sm truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {subtitle}
          </div>
        )}
        {car.vin && (
          <div className="text-xs mt-1 font-mono" style={{ color: 'var(--text-tertiary)' }}>
            {car.vin.slice(0, 8)}···
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={e => {
            e.stopPropagation()
            setShowActions(s => !s)
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ color: 'var(--text-tertiary)' }}
          aria-label="More options"
        >
          ···
        </button>
      </div>

      {/* Dropdown */}
      {showActions && (
        <div
          className="absolute right-8 mt-2 w-40 rounded-xl shadow-lg overflow-hidden z-50"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-3 text-left text-sm font-medium text-red-500 hover:bg-red-50"
            onClick={() => { onDelete(); setShowActions(false) }}
          >
            Remove car
          </button>
          <button
            className="w-full px-4 py-3 text-left text-sm"
            style={{ color: 'var(--text)' }}
            onClick={() => setShowActions(false)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
