import { createContext, useContext, useState } from 'react'
import { appointments as seedAppts, appointmentLogs as seedLogs } from '../data/db'

const DataContext = createContext(null)
const load = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb } catch { return fb } }
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ } }
const stamp = () => new Date().toISOString().slice(0, 16).replace('T', ' ')

// Appointments + status-change logs. Later stages (my appointments, barber, admin) use the same functions.
export function DataProvider({ children }) {
  const [appointments, setAppts] = useState(() => load('crafted_appts', seedAppts))
  const [logs, setLogs] = useState(() => load('crafted_logs', seedLogs))

  const writeLog = (appointment_id, old_status, new_status, changed_by, current) => {
    const next = [...current, { log_id: Math.max(0, ...current.map((l) => l.log_id)) + 1, appointment_id, old_status, new_status, changed_by, changed_at: stamp() }]
    setLogs(next); save('crafted_logs', next)
  }

  const addAppointment = (a, userId) => {
    const created = { ...a, appointment_id: Math.max(0, ...appointments.map((x) => x.appointment_id)) + 1, user_id: userId, status: 'Pending', created_at: stamp() }
    const next = [...appointments, created]
    setAppts(next); save('crafted_appts', next)
    writeLog(created.appointment_id, null, 'Pending', userId, logs)
    return created
  }

  const setStatus = (id, status, userId) => {
    const old = appointments.find((x) => x.appointment_id === id)
    if (!old || old.status === status) return
    const next = appointments.map((x) => (x.appointment_id === id ? { ...x, status } : x))
    setAppts(next); save('crafted_appts', next)
    writeLog(id, old.status, status, userId, logs)
  }

  // Move an appointment to a new date/time. It goes back to Pending so the barber re-confirms.
  const reschedule = (id, date, start, end, userId) => {
    const old = appointments.find((x) => x.appointment_id === id)
    if (!old) return
    const next = appointments.map((x) => (x.appointment_id === id ? { ...x, appointment_date: date, start_time: start, end_time: end, status: 'Pending' } : x))
    setAppts(next); save('crafted_appts', next)
    if (old.status !== 'Pending') writeLog(id, old.status, 'Pending', userId, logs)
  }

  // Used when a customer deletes their account: cancels every Pending/Confirmed booking in one go.
  const cancelActiveFor = (userId, byId) => {
    const hit = appointments.filter((x) => x.user_id === userId && ['Pending', 'Confirmed'].includes(x.status))
    if (!hit.length) return
    const next = appointments.map((x) => (hit.includes(x) ? { ...x, status: 'Cancelled' } : x))
    let id = Math.max(0, ...logs.map((l) => l.log_id))
    const nextLogs = [...logs, ...hit.map((x) => ({ log_id: ++id, appointment_id: x.appointment_id, old_status: x.status, new_status: 'Cancelled', changed_by: byId, changed_at: stamp() }))]
    setAppts(next); save('crafted_appts', next)
    setLogs(nextLogs); save('crafted_logs', nextLogs)
  }

  return <DataContext.Provider value={{ appointments, logs, addAppointment, setStatus, reschedule, cancelActiveFor }}>{children}</DataContext.Provider>
}
export const useData = () => useContext(DataContext)
