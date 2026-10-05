import { useState } from 'react'
import { motion } from 'framer-motion'
import Page from '../components/Page'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useCatalog } from '../context/CatalogContext'
import { fmt12, iso, peso, longDate, fullName } from '../lib/time'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
// What a barber can do next, by current status
const NEXT = { Pending: [['Confirm', 'Confirmed'], ['Decline', 'Cancelled']], Confirmed: [['Start', 'In Progress'], ['Cancel', 'Cancelled']], 'In Progress': [['Complete', 'Completed']] }

export default function Dashboard() {
  const { user, users } = useAuth()
  const { appointments, logs, setStatus } = useData()
  const { barbers, services, schedules } = useCatalog()
  const today = iso(new Date())
  const [day, setDay] = useState(today)
  const [month, setMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() } })
  const [detail, setDetail] = useState(null)

  const me = barbers.find((b) => b.user_id === user.users_id)
  if (!me) return <Page><div className="page-title"><h1>DASHBOARD</h1></div><p className="page-body muted">No barber profile is linked to this account.</p></Page>

  const mine = appointments.filter((a) => a.barber_id === me.barber_id)
  const cust = (a) => { const u = users.find((x) => x.users_id === a.user_id); return u ? `${u.first_name} ${u.last_name}` : 'Unknown' }
  const svc = (a) => services.find((s) => s.service_id === a.service_id)
  const live = mine.filter((a) => a.status !== 'Cancelled')
  const stats = [
    ["Today's Appointments", live.filter((a) => a.appointment_date === today).length, 'var(--text)'],
    ['Upcoming', live.filter((a) => a.appointment_date > today && a.status !== 'Completed').length, 'var(--gold)'],
    ['In Chair', mine.filter((a) => a.status === 'In Progress').length, '#9db4ff'],
    ['Completed', mine.filter((a) => a.status === 'Completed').length, '#4ade80'],
  ]
  const dayList = mine.filter((a) => a.appointment_date === day).sort((a, b) => a.start_time.localeCompare(b.start_time))
  const earned = mine.filter((a) => a.status === 'Completed').reduce((n, a) => n + svc(a).price, 0)

  const first = new Date(month.y, month.m, 1)
  const cells = [...Array(first.getDay()).fill(null), ...Array(new Date(month.y, month.m + 1, 0).getDate()).fill(0).map((_, i) => i + 1)]
  const shift = (n) => setMonth(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() } })
  const count = (key) => live.filter((a) => a.appointment_date === key).length
  const myHours = schedules.filter((s) => s.barber_id === me.barber_id && s.is_active)
  const history = detail ? logs.filter((l) => l.appointment_id === detail.appointment_id) : []

  return (
    <Page>
      <div className="page-title"><h1>DASHBOARD</h1><p className="sub">{fullName(me)} · {me.specialty}</p></div>
      <section className="page-body narrow">
        <div className="stat-box four">
          {stats.map(([label, n, color], i) => (
            <motion.div key={label} className="stat" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <h3>{label}</h3><b style={{ color }}>{n}</b>
            </motion.div>
          ))}
        </div>
        <p className="muted center" style={{ marginTop: -8, marginBottom: 24 }}>Earned from completed cuts: <b style={{ color: 'var(--gold)' }}>{peso(earned)}</b></p>

        <div className="panel">
          <header><div><h2>{day === today ? "Today's Appointments" : 'Appointments'}</h2><p>{longDate(day)}</p></div><span>{dayList.length} booked</span></header>
          {dayList.length === 0 ? <p className="muted" style={{ textAlign: 'center', padding: '24px 0' }}>Nothing booked for this day.</p> : (
            <div className="table-wrap"><table className="tbl">
              <thead><tr><th>Time</th><th>Customer</th><th>Service</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {dayList.map((a, i) => (
                  <motion.tr key={a.appointment_id} layout initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <td>{fmt12(a.start_time)}</td><td>{cust(a)}</td><td>{svc(a).service_name}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td className="acts">
                      {(NEXT[a.status] || []).map(([label, to], k) => <button key={label} className={`mini${k ? ' ghost' : ''}`} onClick={() => setStatus(a.appointment_id, to, user.users_id)}>{label}</button>)}
                      <button className="mini ghost" onClick={() => setDetail(a)}>Details &rarr;</button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>

        <div className="panel">
          <header><div><h2>Calendar</h2><p>Select a day to see its appointments.</p></div></header>
          <div className="cal-head">
            <button onClick={() => shift(-1)} aria-label="Previous month">&lsaquo;</button><strong>{MONTHS[month.m]} {month.y}</strong><button onClick={() => shift(1)} aria-label="Next month">&rsaquo;</button>
          </div>
          <div className="cal">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <span key={d} className="dow">{d}</span>)}
            {cells.map((d, i) => {
              if (!d) return <span key={i} />
              const key = iso(new Date(month.y, month.m, d)); const n = count(key)
              return <button key={i} className={`day open${day === key ? ' on' : ''}${key === today ? ' today' : ''}`} onClick={() => setDay(key)}>{d}{n > 0 && <i className="dot">{n}</i>}</button>
            })}
          </div>
          <p className="slot-title">My working hours</p>
          <div className="chips">{myHours.map((s) => <span key={s.schedule_id}>{s.day_of_week} · {fmt12(s.start_time)}–{fmt12(s.end_time)}</span>)}</div>
        </div>
      </section>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Appointment details">
        {detail && <>
          <dl className="review">
            {[['Customer', cust(detail)], ['Service', `${svc(detail).service_name} · ${peso(svc(detail).price)}`], ['Date', longDate(detail.appointment_date)], ['Time', `${fmt12(detail.start_time)} – ${fmt12(detail.end_time)}`], ['Notes', detail.notes || '—']].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
          <p className="slot-title">Status history</p>
          <ul className="history">
            {history.length === 0 && <li className="muted">No changes yet.</li>}
            {history.map((l) => <li key={l.log_id}><span>{l.old_status || 'New'} &rarr; <b>{l.new_status}</b></span><small>{l.changed_at} · {(() => { const u = users.find((x) => x.users_id === l.changed_by); return u ? u.first_name : '—' })()}</small></li>)}
          </ul>
        </>}
      </Modal>
    </Page>
  )
}
