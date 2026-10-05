import { useState } from 'react'
import { motion } from 'framer-motion'
import Page from '../components/Page'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useCatalog } from '../context/CatalogContext'
import { DAYS, fmt12, peso, longDate, fullName } from '../lib/time'

const STATUSES = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled']
const TABS = ['Overview', 'Appointments', 'Users', 'Barbers', 'Services', 'Schedules', 'Activity']
const WEEK = [...DAYS.slice(1), 'Sunday']
const bind = (form, setForm) => (k) => ({ value: form[k] ?? '', onChange: (e) => setForm({ ...form, [k]: e.target.value }) })

const Switch = ({ on, onClick, label }) => <button className={`switch${on ? ' on' : ''}`} onClick={onClick} aria-label={label} aria-pressed={on}><i /></button>
const Search = (p) => <input className="search" placeholder="Search…" {...p} />

function Overview({ d }) {
  const live = d.appointments.filter((a) => a.status !== 'Cancelled')
  const revenue = d.appointments.filter((a) => a.status === 'Completed').reduce((n, a) => n + (d.svc(a.service_id)?.price || 0), 0)
  const count = (rows, key) => Object.entries(rows.reduce((m, a) => ({ ...m, [a[key]]: (m[a[key]] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const byStatus = STATUSES.map((s) => [s, d.appointments.filter((a) => a.status === s).length])
  const max = Math.max(1, ...byStatus.map((x) => x[1]))
  const cards = [
    ['Total bookings', d.appointments.length], ['Revenue (completed)', peso(revenue)], ['Pending', d.appointments.filter((a) => a.status === 'Pending').length],
    ['Active barbers', d.cat.barbers.filter((b) => b.is_active).length], ['Customers', d.users.filter((u) => u.role === 'Customer').length],
    ['Active services', d.cat.services.filter((s) => s.is_active).length],
  ]
  return <>
    <div className="stat-box six">{cards.map(([l, n], i) => <motion.div key={l} className="stat" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}><h3>{l}</h3><b>{n}</b></motion.div>)}</div>
    <div className="two-col">
      <div className="panel"><header><h2>Bookings by status</h2></header>
        {byStatus.map(([s, n]) => <div className="bar-row" key={s}><span>{s}</span><div><motion.i className={`s-${s.toLowerCase().replace(' ', '-')}`} initial={{ width: 0 }} animate={{ width: `${(n / max) * 100}%` }} transition={{ duration: 0.7 }} /></div><b>{n}</b></div>)}
      </div>
      <div className="panel"><header><h2>Busiest barbers</h2></header>
        {count(live, 'barber_id').map(([id, n]) => <div className="line" key={id}><span>{d.bar(+id) ? fullName(d.bar(+id)) : '—'}</span><b>{n}</b></div>)}
        <header style={{ marginTop: 24 }}><h2>Top services</h2></header>
        {count(live, 'service_id').map(([id, n]) => <div className="line" key={id}><span>{d.svc(+id)?.service_name}</span><b>{n}</b></div>)}
      </div>
    </div>
    <div className="panel"><header><h2>Recent activity</h2></header>
      {[...d.logs].reverse().slice(0, 6).map((l) => <div className="line" key={l.log_id}><span>#{l.appointment_id}: {l.old_status || 'New'} → <b>{l.new_status}</b> by {d.uName(l.changed_by)}</span><small>{l.changed_at}</small></div>)}
    </div>
  </>
}

function Appts({ d }) {
  const [f, setF] = useState('All'); const [q, setQ] = useState('')
  const rows = [...d.appointments].reverse().filter((a) => (f === 'All' || a.status === f) && `${d.uName(a.user_id)} ${d.bar(a.barber_id)?.first_name} ${d.svc(a.service_id)?.service_name}`.toLowerCase().includes(q.toLowerCase()))
  return <div className="panel"><div className="toolbar"><Search value={q} onChange={(e) => setQ(e.target.value)} />
    <select value={f} onChange={(e) => setF(e.target.value)}>{['All', ...STATUSES].map((s) => <option key={s}>{s}</option>)}</select></div>
    <div className="table-wrap"><table className="tbl left"><thead><tr><th>#</th><th>Customer</th><th>Barber</th><th>Service</th><th>When</th><th>Price</th><th>Status</th></tr></thead><tbody>
      {rows.map((a) => <tr key={a.appointment_id}><td>{a.appointment_id}</td><td>{d.uName(a.user_id)}</td><td>{d.bar(a.barber_id) && fullName(d.bar(a.barber_id))}</td><td>{d.svc(a.service_id)?.service_name}</td>
        <td>{longDate(a.appointment_date)}<br /><small>{fmt12(a.start_time)}–{fmt12(a.end_time)}</small></td><td>{peso(d.svc(a.service_id)?.price || 0)}</td>
        <td><select className={`s-${a.status.toLowerCase().replace(' ', '-')}`} value={a.status} onChange={(e) => d.setStatus(a.appointment_id, e.target.value, d.user.users_id)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></td></tr>)}
    </tbody></table></div>{rows.length === 0 && <p className="muted center">No appointments match.</p>}</div>
}

function Users({ d }) {
  const [q, setQ] = useState('')
  const rows = d.users.filter((u) => `${u.first_name} ${u.last_name} ${u.username} ${u.email}`.toLowerCase().includes(q.toLowerCase()))
  return <div className="panel"><div className="toolbar"><Search value={q} onChange={(e) => setQ(e.target.value)} /><span className="muted">{rows.length} users</span></div>
    <div className="table-wrap"><table className="tbl left"><thead><tr><th>ID</th><th>Name</th><th>Username</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Bookings</th></tr></thead><tbody>
      {rows.map((u) => <tr key={u.users_id}><td>{u.users_id}</td><td>{u.first_name} {u.last_name}</td><td>@{u.username}</td><td>{u.email}</td><td>{u.phone || '—'}</td><td><span className={`badge r-${u.role.toLowerCase()}`}>{u.role}</span></td><td>{longDate(u.created_at)}</td><td>{d.appointments.filter((a) => a.user_id === u.users_id).length}</td></tr>)}
    </tbody></table></div></div>
}

function Barbers({ d }) {
  const { barbers, services, barberServices, saveBarber, toggleBarber, setBarberServices } = d.cat
  const [edit, setEdit] = useState(null); const [pick, setPick] = useState(null); const [ids, setIds] = useState([])
  const f = bind(edit || {}, setEdit)
  const openServices = (b) => { setPick(b); setIds(barberServices.filter((x) => x.barber_id === b.barber_id).map((x) => x.service_id)) }
  return <div className="panel"><div className="toolbar"><span className="muted">{barbers.length} barbers</span><button className="btn btn-gold sm" onClick={() => setEdit({ first_name: '', last_name: '', specialty: '', bio: '' })}>+ Add barber</button></div>
    <div className="table-wrap"><table className="tbl left"><thead><tr><th>Barber</th><th>Specialty</th><th>Services</th><th>Active</th><th></th></tr></thead><tbody>
      {barbers.map((b) => { const n = barberServices.filter((x) => x.barber_id === b.barber_id).length
        return <tr key={b.barber_id}><td>{fullName(b)}</td><td>{b.specialty}</td><td className={n ? '' : 'warn'}>{n || 'None assigned'}</td><td><Switch on={b.is_active} onClick={() => toggleBarber(b.barber_id)} label="Toggle active" /></td>
          <td className="acts"><button className="mini" onClick={() => openServices(b)}>Services</button><button className="mini ghost" onClick={() => setEdit({ ...b })}>Edit</button></td></tr> })}
    </tbody></table></div>
    <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.barber_id ? 'Edit barber' : 'Add barber'}>
      {edit && <form className="form-grid" onSubmit={(e) => { e.preventDefault(); if (!edit.first_name.trim()) return; saveBarber(edit); setEdit(null) }}>
        <label>First name<input {...f('first_name')} /></label><label>Last name<input {...f('last_name')} /></label>
        <label className="full">Specialty<input {...f('specialty')} /></label><label className="full">Bio<textarea {...f('bio')} /></label>
        <button className="btn btn-gold full" type="submit">Save</button></form>}
    </Modal>
    <Modal open={!!pick} onClose={() => setPick(null)} title={pick ? `Services · ${pick.first_name}` : ''}>
      <div className="check-list">{services.map((s) => <label key={s.service_id}><input type="checkbox" checked={ids.includes(s.service_id)} onChange={() => setIds((v) => (v.includes(s.service_id) ? v.filter((x) => x !== s.service_id) : [...v, s.service_id]))} />{s.service_name}<small>{peso(s.price)}</small></label>)}</div>
      <button className="btn btn-gold wide" onClick={() => { setBarberServices(pick.barber_id, ids); setPick(null) }}>Save services</button>
    </Modal></div>
}

function Services({ d }) {
  const { services, barberServices, saveService, toggleService, deleteService } = d.cat
  const [edit, setEdit] = useState(null); const f = bind(edit || {}, setEdit)
  const used = (id) => d.appointments.some((a) => a.service_id === id)
  const save = (e) => { e.preventDefault(); const price = +edit.price, mins = +edit.duration_minutes
    if (!edit.service_name.trim() || !(price > 0) || !(mins > 0)) return; saveService({ ...edit, price, duration_minutes: mins }); setEdit(null) }
  return <div className="panel"><div className="toolbar"><span className="muted">{services.length} services</span><button className="btn btn-gold sm" onClick={() => setEdit({ service_name: '', description: '', price: '', duration_minutes: '' })}>+ Add service</button></div>
    <div className="table-wrap"><table className="tbl left"><thead><tr><th>Service</th><th>Price</th><th>Mins</th><th>Barbers</th><th>Active</th><th></th></tr></thead><tbody>
      {services.map((s) => { const n = barberServices.filter((x) => x.service_id === s.service_id).length
        return <tr key={s.service_id}><td>{s.service_name}</td><td>{peso(s.price)}</td><td>{s.duration_minutes}</td><td className={n ? '' : 'warn'}>{n || 'No barber'}</td>
          <td><Switch on={s.is_active} onClick={() => toggleService(s.service_id)} label="Toggle active" /></td>
          <td className="acts"><button className="mini ghost" onClick={() => setEdit({ ...s })}>Edit</button>
            <button className="mini ghost" disabled={used(s.service_id)} title={used(s.service_id) ? 'Has bookings — deactivate instead' : 'Delete'} onClick={() => window.confirm(`Delete ${s.service_name}?`) && deleteService(s.service_id)}>Delete</button></td></tr> })}
    </tbody></table></div>
    <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.service_id ? 'Edit service' : 'Add service'}>
      {edit && <form className="form-grid" onSubmit={save}><label className="full">Name<input {...f('service_name')} /></label><label className="full">Description<textarea {...f('description')} /></label>
        <label>Price (₱)<input type="number" min="1" {...f('price')} /></label><label>Duration (mins)<input type="number" min="5" step="5" {...f('duration_minutes')} /></label>
        <button className="btn btn-gold full" type="submit">Save</button></form>}
    </Modal></div>
}

function Schedules({ d }) {
  const { barbers, schedules, addSchedule, toggleSchedule, deleteSchedule } = d.cat
  const [bid, setBid] = useState(barbers[0]?.barber_id)
  const [form, setForm] = useState({ day_of_week: 'Monday', start_time: '09:00', end_time: '18:00' }); const [err, setErr] = useState('')
  const rows = schedules.filter((s) => s.barber_id === +bid).sort((a, b) => WEEK.indexOf(a.day_of_week) - WEEK.indexOf(b.day_of_week))
  const add = (e) => { e.preventDefault()
    if (form.end_time <= form.start_time) return setErr('End time must be after start time.')
    if (rows.some((s) => s.day_of_week === form.day_of_week)) return setErr('That day already has a schedule — edit or remove it.')
    setErr(''); addSchedule({ ...form, barber_id: +bid }) }
  return <div className="panel"><div className="toolbar"><select value={bid} onChange={(e) => setBid(e.target.value)}>{barbers.map((b) => <option key={b.barber_id} value={b.barber_id}>{fullName(b)}{b.is_active ? '' : ' (inactive)'}</option>)}</select></div>
    <div className="table-wrap"><table className="tbl left"><thead><tr><th>Day</th><th>Start</th><th>End</th><th>Active</th><th></th></tr></thead><tbody>
      {rows.map((s) => <tr key={s.schedule_id}><td>{s.day_of_week}</td><td>{fmt12(s.start_time)}</td><td>{fmt12(s.end_time)}</td><td><Switch on={s.is_active} onClick={() => toggleSchedule(s.schedule_id)} label="Toggle active" /></td>
        <td className="acts"><button className="mini ghost" onClick={() => deleteSchedule(s.schedule_id)}>Remove</button></td></tr>)}
    </tbody></table></div>{rows.length === 0 && <p className="muted center">No working days yet — this barber can't be booked.</p>}
    <form className="add-row" onSubmit={add}><select value={form.day_of_week} onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}>{WEEK.map((x) => <option key={x}>{x}</option>)}</select>
      <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /><input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
      <button className="btn btn-gold sm" type="submit">+ Add day</button></form>{err && <p className="auth-error">{err}</p>}</div>
}

function Activity({ d }) {
  return <div className="panel"><div className="table-wrap"><table className="tbl left"><thead><tr><th>When</th><th>Appt</th><th>Customer</th><th>Change</th><th>By</th></tr></thead><tbody>
    {[...d.logs].reverse().map((l) => { const a = d.appointments.find((x) => x.appointment_id === l.appointment_id); const by = d.users.find((u) => u.users_id === l.changed_by)
      return <tr key={l.log_id}><td>{l.changed_at}</td><td>#{l.appointment_id}</td><td>{a ? d.uName(a.user_id) : '—'}</td><td>{l.old_status ? <StatusBadge status={l.old_status} /> : 'New'} → <StatusBadge status={l.new_status} /></td><td>{by ? `${by.first_name} (${by.role})` : '—'}</td></tr> })}
  </tbody></table></div></div>
}

export default function Admin() {
  const { user, users } = useAuth(); const { appointments, logs, setStatus } = useData(); const cat = useCatalog()
  const [tab, setTab] = useState('Overview')
  const d = { user, users, appointments, logs, setStatus, cat,
    uName: (id) => { const u = users.find((x) => x.users_id === id); return u ? `${u.first_name} ${u.last_name}` : '—' },
    svc: (id) => cat.services.find((s) => s.service_id === id), bar: (id) => cat.barbers.find((b) => b.barber_id === id) }
  const View = { Overview, Appointments: Appts, Users, Barbers, Services, Schedules, Activity }[tab]
  return <Page><div className="page-title"><h1>ADMIN</h1><p className="sub">Everything in the shop, in one place.</p></div>
    <section className="page-body wide">
      <nav className="tabs" aria-label="Admin sections">{TABS.map((t) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}{tab === t && <motion.i layoutId="tab-line" />}</button>)}</nav>
      <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}><View d={d} /></motion.div>
    </section></Page>
}
