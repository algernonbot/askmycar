'use client'

import { useState } from 'react'
import { Car } from '@/types/car'
import { saveCar } from '@/lib/storage'
import { nanoid } from 'nanoid'

interface Props {
  onClose: () => void
  onAdd: (car: Car) => void
}

type Step = 'method' | 'vin' | 'manual' | 'confirm'
type Method = 'vin' | 'manual'

const COMMON_MAKES = [
  'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler',
  'Dodge', 'Ford', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Jeep', 'Kia',
  'Lexus', 'Lincoln', 'Mazda', 'Mercedes-Benz', 'Mitsubishi', 'Nissan',
  'Porsche', 'Ram', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo',
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1999 }, (_, i) => CURRENT_YEAR - i)

export default function AddCarModal({ onClose, onAdd }: Props) {
  const [step, setStep] = useState<Step>('method')
  const [method, setMethod] = useState<Method>('vin')
  const [vin, setVin] = useState('')
  const [year, setYear] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [trim, setTrim] = useState('')
  const [nickname, setNickname] = useState('')
  const [decodedCar, setDecodedCar] = useState<Partial<Car> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleVinSubmit = async () => {
    if (vin.length !== 17) {
      setError('VIN must be exactly 17 characters')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/vin?vin=${vin.toUpperCase()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to decode VIN')
      setDecodedCar({
        year: data.year,
        make: data.make,
        model: data.model,
        trim: data.trim,
        engine: data.engine,
        vin: vin.toUpperCase(),
      })
      setStep('confirm')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = () => {
    if (!year || !make || !model) {
      setError('Please fill in year, make, and model')
      return
    }
    setDecodedCar({ year: parseInt(year), make, model, trim })
    setStep('confirm')
  }

  const handleConfirm = () => {
    if (!decodedCar) return
    const car: Car = {
      id: nanoid(),
      ...decodedCar,
      year: decodedCar.year!,
      make: decodedCar.make!,
      model: decodedCar.model!,
      nickname: nickname.trim() || undefined,
      addedAt: new Date().toISOString(),
    }
    saveCar(car)
    onAdd(car)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} />
      <div
        className="relative w-full max-w-md rounded-t-3xl p-6 pb-10 safe-bottom"
        style={{ background: 'var(--bg)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ background: 'var(--border)' }} />

        {/* Method Selection */}
        {step === 'method' && (
          <div className="fade-in">
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Add your car</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              How would you like to add it?
            </p>
            <div className="space-y-3">
              <button
                className="w-full rounded-2xl p-4 text-left active:scale-98"
                style={{ background: 'var(--bg-secondary)', border: '2px solid transparent' }}
                onClick={() => { setMethod('vin'); setStep('vin') }}
              >
                <div className="font-semibold" style={{ color: 'var(--text)' }}>🔍 Enter VIN</div>
                <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Most accurate — automatically fetches your exact trim
                </div>
              </button>
              <button
                className="w-full rounded-2xl p-4 text-left active:scale-98"
                style={{ background: 'var(--bg-secondary)', border: '2px solid transparent' }}
                onClick={() => { setMethod('manual'); setStep('manual') }}
              >
                <div className="font-semibold" style={{ color: 'var(--text)' }}>📋 Year / Make / Model</div>
                <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Quick entry if you don't have your VIN handy
                </div>
              </button>
            </div>
          </div>
        )}

        {/* VIN Entry */}
        {step === 'vin' && (
          <div className="fade-in">
            <button
              className="text-sm mb-4 font-medium"
              style={{ color: 'var(--accent)' }}
              onClick={() => { setStep('method'); setError('') }}
            >
              ← Back
            </button>
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Enter your VIN</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Found on your dashboard or driver's door jamb
            </p>
            <input
              type="text"
              value={vin}
              onChange={e => {
                setVin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                setError('')
              }}
              maxLength={17}
              placeholder="1HGBH41JXMN109186"
              className="w-full rounded-xl px-4 py-3 text-lg font-mono outline-none mb-1"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text)',
                border: error ? '2px solid #ef4444' : '2px solid transparent',
              }}
              autoFocus
            />
            <div className="flex justify-between mb-6">
              <div className="text-sm" style={{ color: error ? '#ef4444' : 'var(--text-tertiary)' }}>
                {error || `${vin.length}/17 characters`}
              </div>
            </div>
            <button
              className="w-full py-3.5 rounded-full font-semibold text-white active:scale-98 disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
              onClick={handleVinSubmit}
              disabled={loading || vin.length !== 17}
            >
              {loading ? 'Looking up...' : 'Continue'}
            </button>
          </div>
        )}

        {/* Manual Entry */}
        {step === 'manual' && (
          <div className="fade-in">
            <button
              className="text-sm mb-4 font-medium"
              style={{ color: 'var(--accent)' }}
              onClick={() => { setStep('method'); setError('') }}
            >
              ← Back
            </button>
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Your car</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>Fill in what you know</p>

            <div className="space-y-3 mb-6">
              <select
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full rounded-xl px-4 py-3 outline-none"
                style={{ background: 'var(--bg-secondary)', color: year ? 'var(--text)' : 'var(--text-tertiary)' }}
              >
                <option value="">Year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>

              <select
                value={make}
                onChange={e => setMake(e.target.value)}
                className="w-full rounded-xl px-4 py-3 outline-none"
                style={{ background: 'var(--bg-secondary)', color: make ? 'var(--text)' : 'var(--text-tertiary)' }}
              >
                <option value="">Make</option>
                {COMMON_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>

              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="Model (e.g. Camry, F-150)"
                className="w-full rounded-xl px-4 py-3 outline-none"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}
              />

              <input
                type="text"
                value={trim}
                onChange={e => setTrim(e.target.value)}
                placeholder="Trim (optional, e.g. XSE, Limited)"
                className="w-full rounded-xl px-4 py-3 outline-none"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}
              />
            </div>

            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

            <button
              className="w-full py-3.5 rounded-full font-semibold text-white active:scale-98"
              style={{ background: 'var(--accent)' }}
              onClick={handleManualSubmit}
            >
              Continue
            </button>
          </div>
        )}

        {/* Confirm */}
        {step === 'confirm' && decodedCar && (
          <div className="fade-in">
            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Looking good 👍</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
              Give it a nickname (optional)
            </p>

            {/* Car summary */}
            <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--bg-secondary)' }}>
              <div className="text-4xl text-center mb-3">🚗</div>
              <div className="text-center">
                <div className="font-bold text-lg" style={{ color: 'var(--text)' }}>
                  {decodedCar.year} {decodedCar.make} {decodedCar.model}
                </div>
                {decodedCar.trim && (
                  <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {decodedCar.trim}
                  </div>
                )}
                {decodedCar.engine && (
                  <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    {decodedCar.engine}
                  </div>
                )}
                {decodedCar.vin && (
                  <div className="text-xs mt-1 font-mono" style={{ color: 'var(--text-tertiary)' }}>
                    VIN: {decodedCar.vin}
                  </div>
                )}
              </div>
            </div>

            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="Nickname (e.g. Daily Driver, Blue Beast)"
              className="w-full rounded-xl px-4 py-3 mb-5 outline-none"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}
              maxLength={40}
            />

            <button
              className="w-full py-3.5 rounded-full font-semibold text-white active:scale-98"
              style={{ background: 'var(--accent)' }}
              onClick={handleConfirm}
            >
              Add to Garage
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
