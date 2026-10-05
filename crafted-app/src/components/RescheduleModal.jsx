import { useState } from 'react'
import Modal from './Modal'
import { useCatalog } from '../context/CatalogContext'
import { getSlots, openDates } from '../lib/slots'
import { fmt12, toHHMM, longDate, DAYS } from '../lib/time'

export default function RescheduleModal({ appt, service, appointments, onClose, onSave }) {
  const { schedules } = useCatalog()
  const [date, setDate] = useState(null)
  const [time, setTime] = useState(null)
  if (!appt) return <Modal open={false} onClose={onClose} />
  const dates = openDates(appt.barber_id, schedules)
  const slots = date ? getSlots({ barberId: appt.barber_id, durationMinutes: service.duration_minutes, date, appointments, schedules, excludeId: appt.appointment_id }) : []

  return (
    <Modal open onClose={onClose} title="Reschedule">
      <p className="muted">{service.service_name} · pick a new day and time. It returns to Pending until your barber confirms.</p>
      <div className="date-chips">
        {dates.map((d) => {
          const x = new Date(d + 'T00:00:00')
          return <button key={d} className={date === d ? 'on' : ''} onClick={() => { setDate(d); setTime(null) }}><small>{DAYS[x.getDay()].slice(0, 3)}</small>{x.getDate()}<small>{x.toLocaleString('en-US', { month: 'short' })}</small></button>
        })}
      </div>
      <p className="slot-title">{date ? longDate(date) : 'Choose a date.'}</p>
      <div className="slots">
        {slots.map((s) => <button key={s.t} disabled={s.booked || s.past} className={`slot${time === s.t ? ' on' : ''}${s.booked ? ' booked' : ''}`} onClick={() => setTime(s.t)}>{fmt12(toHHMM(s.t))}{s.booked && <small>BOOKED</small>}</button>)}
      </div>
      <div className="row-btns">
        <button className="btn btn-gold" disabled={!date || time === null} onClick={() => onSave(date, toHHMM(time), toHHMM(time + service.duration_minutes))}>Save new time</button>
        <button className="btn btn-outline" onClick={onClose}>Keep current</button>
      </div>
    </Modal>
  )
}
