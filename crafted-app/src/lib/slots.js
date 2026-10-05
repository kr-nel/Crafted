import { DAYS, toMin, iso } from './time'

// Next `count` days on which this barber has an active schedule
export function openDates(barberId, schedules, count = 28) {
  const days = new Set(schedules.filter((s) => s.barber_id === barberId && s.is_active).map((s) => DAYS.indexOf(s.day_of_week)))
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const out = []
  for (let i = 0; i < count; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i)
    if (days.has(d.getDay())) out.push(iso(d))
  }
  return out
}

// Time slots for one barber on one date. `excludeId` ignores the appointment being rescheduled.
export function getSlots({ barberId, durationMinutes, date, appointments, schedules, excludeId }) {
  const d = new Date(date + 'T00:00:00')
  const now = new Date()
  const nowMin = date === iso(now) ? now.getHours() * 60 + now.getMinutes() : -1
  const taken = appointments.filter((a) => a.barber_id === barberId && a.appointment_date === date && a.status !== 'Cancelled' && a.appointment_id !== excludeId)
  const out = []
  schedules.filter((s) => s.barber_id === barberId && s.is_active && DAYS.indexOf(s.day_of_week) === d.getDay()).forEach((s) => {
    for (let t = toMin(s.start_time); t + durationMinutes <= toMin(s.end_time); t += 30) {
      const end = t + durationMinutes
      out.push({ t, booked: taken.some((a) => t < toMin(a.end_time) && end > toMin(a.start_time)), past: t <= nowMin })
    }
  })
  return out
}
