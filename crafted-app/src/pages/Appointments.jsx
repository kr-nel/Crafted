import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Page from '../components/Page'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import RescheduleModal from '../components/RescheduleModal'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useCatalog } from '../context/CatalogContext'
import { fmt12, iso, peso, longDate, fullName } from '../lib/time'

const ACTIVE = ['Pending', 'Confirmed', 'In Progress']
const rows = (a, s, b) => [['Date', longDate(a.appointment_date)], ['Time', `${fmt12(a.start_time)} – ${fmt12(a.end_time)}`], ['Service', s.service_name], ['Total Price', peso(s.price)], ['Barber', fullName(b)]]

export default function Appointments() {
  const { user } = useAuth()
  const { appointments, setStatus, reschedule } = useData()
  const { barbers, services } = useCatalog()
  const [cancelId, setCancelId] = useState(null)
  const [moveId, setMoveId] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const today = iso(new Date())

  const mine = appointments.filter((a) => a.user_id === user.users_id).sort((a, b) => (a.appointment_date + a.start_time).localeCompare(b.appointment_date + b.start_time))
  const queue = mine.filter((a) => ACTIVE.includes(a.status))
  const history = mine.filter((a) => !ACTIVE.includes(a.status)).reverse()
  const stats = [
    ['Upcoming Appointments', queue.filter((a) => a.status !== 'In Progress' && a.appointment_date >= today).length, 'var(--gold)'],
    ['In Progress', queue.filter((a) => a.status === 'In Progress').length, '#9db4ff'],
    ['Completed', mine.filter((a) => a.status === 'Completed').length, '#4ade80'],
  ]
  const find = (id) => mine.find((a) => a.appointment_id === id)
  const svc = (a) => services.find((s) => s.service_id === a.service_id)
  const bar = (a) => barbers.find((b) => b.barber_id === a.barber_id)
  const moving = find(moveId)

  const Card = ({ a, actions }) => (
    <motion.article layout className="appt-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }}>
      <dl>
        {rows(a, svc(a), bar(a)).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        <div><dt>Status</dt><dd><StatusBadge status={a.status} /></dd></div>
      </dl>
      {actions && <div className="row-btns split">
        <button className="btn btn-light" onClick={() => setMoveId(a.appointment_id)}>Reschedule</button>
        <button className="btn btn-outline" onClick={() => setCancelId(a.appointment_id)}>Cancel appointment</button>
      </div>}
    </motion.article>
  )

  return (
    <Page>
      <div className="page-title"><h1>APPOINTMENTS</h1></div>
      <section className="page-body narrow">
        <div className="stat-box">
          {stats.map(([label, n, color], i) => (
            <motion.div key={label} className="stat" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <h3>{label}</h3><b style={{ color }}>{n}</b>
            </motion.div>
          ))}
        </div>

        <div className="panel">
          <header><div><h2>Appointments Queue</h2></div></header>
          {queue.length === 0 && <div className="empty"><p>No upcoming appointments.</p><Link className="btn btn-gold" to="/book">Book your next cut</Link></div>}
          <AnimatePresence>
            {queue.map((a) => <Card key={a.appointment_id} a={a} actions={a.status !== 'In Progress'} />)}
          </AnimatePresence>
        </div>

        {history.length > 0 && (
          <div className="panel">
            <header onClick={() => setShowHistory((v) => !v)} style={{ cursor: 'pointer' }}><div><h2>History</h2><p>{history.length} past or cancelled</p></div><span>{showHistory ? 'Hide' : 'Show'}</span></header>
            <AnimatePresence>{showHistory && history.map((a) => <Card key={a.appointment_id} a={a} />)}</AnimatePresence>
          </div>
        )}
      </section>

      <Modal open={cancelId !== null} onClose={() => setCancelId(null)} title="Cancel this appointment?">
        <p className="muted">You can book a new time any time. Cancellation is free.</p>
        <div className="row-btns">
          <button className="btn btn-gold" onClick={() => { setStatus(cancelId, 'Cancelled', user.users_id); setCancelId(null) }}>Yes, cancel it</button>
          <button className="btn btn-outline" onClick={() => setCancelId(null)}>Keep it</button>
        </div>
      </Modal>

      {moving && <RescheduleModal key={moving.appointment_id} appt={moving} service={svc(moving)} appointments={appointments} onClose={() => setMoveId(null)}
        onSave={(d, s, e) => { reschedule(moving.appointment_id, d, s, e, user.users_id); setMoveId(null) }} />}
    </Page>
  )
}
