'use client'

import { useRouter } from 'next/navigation'
import { Car } from '@/types/car'
import { useState, useEffect } from 'react'
import { getCarById } from '@/lib/storage'

interface CarCardProps {
  car: Car
  onDelete: () => void
}

export default function CarCard({ car: initialCar, onDelete }: CarCardProps) {
  const router = useRouter()
  const [showActions, setShowActions] = useState(false)
  const [car, setCar] = useState(initialCar)

  // Poll for imageUrl while generating
  useEffect(() => {
    if (!car.imageGenerating) return
    const interval = setInterval(() => {
      const updated = getCarById(car.id)
      if (updated && !updated.imageGenerating) {
        setCar(updated)
        clearInterval(interval)
      }
    }, 1500)
    return () => clearInterval(interval)
  }, [car.id, car.imageGenerating])

  // Update when parent re-renders with new car data
  useEffect(() => {
    setCar(initialCar)
  }, [initialCar])

  const displayName = car.nickname || `${car.year} ${car.make} ${car.model}`
  const subtitle = car.nickname ? `${car.year} ${car.make} ${car.model}` : car.trim || car.engine || ''

  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer active:scale-98 select-none"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid transparent',
      }}
      onClick={() => !showActions && router.push(`/car/${car.id}`)}
    >
      {/* Car Image */}
      <CarImage car={car} />

      {/* Info Row */}
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate" style={{ color: 'var(--text)' }}>
            {displayName}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {subtitle && (
              <span className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                {subtitle}
              </span>
            )}
            {car.color && (
              <ColorDot color={car.color} />
            )}
          </div>
          {car.hasOpenRecalls && (
            <div className="text-xs mt-1 font-medium text-red-500">
              ⚠️ Recall
            </div>
          )}
          {car.vin && (
            <div className="text-xs mt-1 font-mono" style={{ color: 'var(--text-tertiary)' }}>
              {car.vin.slice(0, 8)}···
            </div>
          )}
        </div>

        {/* Actions */}
        <button
          onClick={e => {
            e.stopPropagation()
            setShowActions(s => !s)
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ color: 'var(--text-tertiary)' }}
          aria-label="More options"
        >
          ···
        </button>
      </div>

      {/* Dropdown */}
      {showActions && (
        <div
          className="absolute right-8 mt-1 w-40 rounded-xl shadow-lg overflow-hidden z-50"
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

function CarImage({ car }: { car: Car }) {
  const [imgError, setImgError] = useState(false)

  if (car.imageGenerating) {
    return (
      <div
        className="w-full shimmer"
        style={{ height: '180px', background: 'linear-gradient(90deg, var(--bg-secondary) 25%, var(--border) 50%, var(--bg-secondary) 75%)', backgroundSize: '200% 100%' }}
      />
    )
  }

  if (car.imageUrl && !imgError) {
    return (
      <div className="w-full" style={{ height: '180px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
        <img
          src={car.imageUrl}
          alt={`${car.year} ${car.make} ${car.model}`}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  // Fallback: elegant placeholder
  return (
    <div
      className="w-full flex items-center justify-center"
      style={{ height: '180px', background: 'var(--accent-light)' }}
    >
      <span style={{ fontSize: '72px', opacity: 0.6 }}>🚗</span>
    </div>
  )
}

function ColorDot({ color }: { color: string }) {
  const HEX_MAP: Record<string, string> = {
    white: '#FFFFFF', black: '#1a1a1a', silver: '#C0C0C0', gray: '#808080',
    blue: '#2563EB', red: '#DC2626', brown: '#92400E', beige: '#D4B896',
    green: '#16A34A', gold: '#B8860B', orange: '#EA580C', yellow: '#CA8A04',
  }
  const hex = HEX_MAP[color] || '#808080'
  return (
    <span
      className="inline-block w-3 h-3 rounded-full flex-shrink-0"
      style={{
        background: hex,
        border: color === 'white' ? '1px solid var(--border)' : 'none',
      }}
    />
  )
}
