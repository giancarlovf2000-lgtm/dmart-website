'use client'

import { useEffect, useState } from 'react'
import { Plus, Check, X } from 'lucide-react'

interface CommType { id: string; name: string }

interface CommTypeSelectProps {
  value: string
  onChange: (value: string) => void
  /** Muestra una opción vacía inicial (ej. "Seleccionar tipo…"). */
  placeholder?: string
  className?: string
}

/**
 * Dropdown de "tipos de seguimiento" (comunicación) cargado desde la BD.
 * Cualquier empleado puede agregar nuevos tipos (no editar ni borrar).
 */
export default function CommTypeSelect({ value, onChange, placeholder, className }: CommTypeSelectProps) {
  const [types, setTypes] = useState<CommType[]>([])
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadTypes(selectName?: string) {
    const res = await fetch('/api/portal/communication-types')
    if (res.ok) {
      const data = await res.json()
      setTypes(data.types ?? [])
      if (selectName) onChange(selectName)
    }
  }

  useEffect(() => { loadTypes() }, [])

  async function handleAdd() {
    const name = newName.trim()
    if (name.length < 2) return
    setSaving(true)
    const res = await fetch('/api/portal/communication-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      const data = await res.json()
      await loadTypes(data.type?.name ?? name)
      setNewName('')
      setAdding(false)
    } else {
      alert('No se pudo agregar el tipo.')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className ?? 'w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-accent-ring'}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {types.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
      </select>

      {adding ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
            placeholder="Nuevo tipo de seguimiento…"
            maxLength={50}
            autoFocus
            className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-accent-ring"
          />
          <button type="button" onClick={handleAdd} disabled={saving || newName.trim().length < 2}
            className="p-1.5 rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-40" title="Agregar">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => { setAdding(false); setNewName('') }}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100" title="Cancelar">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs text-accent font-semibold hover:underline">
          <Plus className="h-3 w-3" /> Agregar tipo
        </button>
      )}
    </div>
  )
}
