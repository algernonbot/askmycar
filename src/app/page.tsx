'use client'

import { useState, useEffect } from 'react'
import { Car } from '@/types/car'
import { getCars, deleteCar } from '@/lib/storage'
import CarCard from '@/components/CarCard'
import AddCarModal from '@/components/AddCarModal'

export default function GaragePage() {
  const [cars, setCars] = useState<Car[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCars(getCars())
  }, [])

  const handleCarAdded = (car: Car) => {
    setCars(getCars())
    setShowAdd(false)
  }

  const handleDelete = (id: string) => {
    deleteCar(id)
    setCars(getCars())
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="px-5 pt-14 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              My Garage
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {cars.length === 0
                ? 'Add your first car to get started'
                : `${cars.length} car${cars.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl font-light shadow-sm active:scale-95 transition-transform"
            style={{ background: 'var(--accent)' }}
            aria-label="Add car"
          >
            +
          </button>
        </div>
      </header>

      {/* Car List */}
      <main className="flex-1 px-4 pb-8">
        {cars.length === 0 ? (
          <EmptyState onAdd={() => setShowAdd(true)} />
        ) : (
          <div className="space-y-3">
            {cars.map((car, i) => (
              <div key={car.id} className="fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <CarCard car={car} onDelete={() => handleDelete(car.id)} />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Car Modal */}
      {showAdd && (
        <AddCarModal
          onClose={() => setShowAdd(false)}
          onAdd={handleCarAdded}
        />
      )}
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center pt-24 px-8 text-center">
      <div className="text-7xl mb-5">🚗</div>
      <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
        Your garage is empty
      </h2>
      <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Add your car and ask it anything — warning lights, maintenance schedules, and more.
      </p>
      <button
        onClick={onAdd}
        className="px-6 py-3 rounded-full text-sm font-semibold text-white shadow-sm active:scale-95 transition-transform"
        style={{ background: 'var(--accent)' }}
      >
        Add My Car
      </button>
    </div>
  )
}
