import { createContext, useContext, useState } from 'react'
import * as seed from '../data/db'

// Barbers, services, schedules and barber_services: the tables the admin can edit.
const Ctx = createContext(null)
const init = () => {
  try { const s = JSON.parse(localStorage.getItem('crafted_catalog')); if (s) return s } catch { /* ignore */ }
  return { barbers: seed.barbers, services: seed.services, schedules: seed.schedules, barberServices: seed.barberServices }
}
const nextId = (arr, key) => Math.max(0, ...arr.map((x) => x[key])) + 1

export function CatalogProvider({ children }) {
  const [c, setC] = useState(init)
  const commit = (fn) => setC((prev) => {
    const next = fn(prev)
    try { localStorage.setItem('crafted_catalog', JSON.stringify(next)) } catch { /* ignore */ }
    return next
  })
  // upsert into one list: edits when the id exists, adds when it doesn't
  const upsert = (list, idKey, row, defaults = {}) => commit((p) => ({
    ...p, [list]: row[idKey] ? p[list].map((x) => (x[idKey] === row[idKey] ? { ...x, ...row } : x)) : [...p[list], { ...defaults, ...row, [idKey]: nextId(p[list], idKey) }],
  }))
  const flip = (list, idKey, id) => commit((p) => ({ ...p, [list]: p[list].map((x) => (x[idKey] === id ? { ...x, is_active: !x.is_active } : x)) }))

  const api = {
    ...c,
    saveService: (s) => upsert('services', 'service_id', s, { is_active: true }),
    toggleService: (id) => flip('services', 'service_id', id),
    deleteService: (id) => commit((p) => ({ ...p, services: p.services.filter((x) => x.service_id !== id), barberServices: p.barberServices.filter((x) => x.service_id !== id) })),
    saveBarber: (b) => upsert('barbers', 'barber_id', b, { is_active: true, user_id: null }),
    toggleBarber: (id) => flip('barbers', 'barber_id', id),
    setBarberServices: (barber_id, ids) => commit((p) => ({ ...p, barberServices: [...p.barberServices.filter((x) => x.barber_id !== barber_id), ...ids.map((service_id) => ({ barber_id, service_id }))] })),
    addSchedule: (s) => upsert('schedules', 'schedule_id', s, { is_active: true }),
    toggleSchedule: (id) => flip('schedules', 'schedule_id', id),
    deleteSchedule: (id) => commit((p) => ({ ...p, schedules: p.schedules.filter((x) => x.schedule_id !== id) })),
  }
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
export const useCatalog = () => useContext(Ctx)
