export type MinimalLead = {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono: string
}

export type DuplicatePair = {
  key: string       // "id_a|id_b" (sorted)
  id_a: string
  id_b: string
  reason: string    // "Mismo teléfono" | "Mismo correo" | "Mismo nombre"
}

export function canonicalPairKey(id1: string, id2: string): string {
  return [id1, id2].sort().join('|')
}

export function findDuplicatePairs(
  leads: MinimalLead[],
  dismissedSet: Set<string>
): DuplicatePair[] {
  const phoneMap = new Map<string, string[]>()
  const emailMap = new Map<string, string[]>()
  const nameMap  = new Map<string, string[]>()

  for (const lead of leads) {
    const phone = (lead.telefono ?? '').replace(/\D/g, '')
    if (phone.length >= 7) {
      if (!phoneMap.has(phone)) phoneMap.set(phone, [])
      phoneMap.get(phone)!.push(lead.id)
    }

    const email = (lead.email ?? '').toLowerCase().trim()
    if (email.includes('@')) {
      if (!emailMap.has(email)) emailMap.set(email, [])
      emailMap.get(email)!.push(lead.id)
    }

    const name = `${(lead.nombre ?? '').trim()} ${(lead.apellido ?? '').trim()}`
      .toLowerCase().trim()
    if (name.replace(/\s/g, '').length > 3) {
      if (!nameMap.has(name)) nameMap.set(name, [])
      nameMap.get(name)!.push(lead.id)
    }
  }

  const result = new Map<string, DuplicatePair>()

  const addPairs = (map: Map<string, string[]>, reason: string) => {
    map.forEach((ids) => {
      if (ids.length < 2) return
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const sorted = [ids[i], ids[j]].sort()
          const a = sorted[0], b = sorted[1]
          const key = `${a}|${b}`
          if (!dismissedSet.has(key) && !result.has(key)) {
            result.set(key, { key, id_a: a, id_b: b, reason })
          }
        }
      }
    })
  }

  addPairs(phoneMap, 'Mismo teléfono')
  addPairs(emailMap, 'Mismo correo')
  addPairs(nameMap,  'Mismo nombre')

  const out: DuplicatePair[] = []
  result.forEach((v) => out.push(v))
  return out
}
