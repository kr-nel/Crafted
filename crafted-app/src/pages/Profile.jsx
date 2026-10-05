import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Page from '../components/Page'
import Modal from '../components/Modal'
import { Field } from './Auth'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

const mask = (p) => (p.length > 3 ? p[0] + '*'.repeat(7) + p.slice(-2) : '*'.repeat(7))
const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

export default function Profile() {
  const { user, logout, changePassword, deleteAccount } = useAuth()
  const { cancelActiveFor } = useData()
  const navigate = useNavigate()
  const [modal, setModal] = useState(null) // 'pw' | 'del' | null
  const [f, setF] = useState({ current: '', next: '', confirm: '' })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setError('') }
  const close = () => { setModal(null); setF({ current: '', next: '', confirm: '' }); setError(''); setDone(false) }

  const rows = [
    ['User ID', String(user.users_id).padStart(3, '0')], ['Username', '@' + user.username], ['Email', user.email],
    ['Phone', user.phone || '—'], ['Password', mask(user.password)], ['Role', user.role], ['Created At', fmtDate(user.created_at)],
  ]

  const submitPw = (e) => {
    e.preventDefault()
    if (!f.current || !f.next || !f.confirm) return setError('Please fill in every field.')
    if (f.next !== f.confirm) return setError('New passwords do not match.')
    const res = changePassword(f.current, f.next)
    if (!res.ok) return setError(res.error)
    setDone(true)
  }
  const submitDelete = (e) => {
    e.preventDefault()
    const id = user.users_id
    const res = deleteAccount(f.current)
    if (!res.ok) return setError(res.error)
    cancelActiveFor(id, id) // free up the slots they were holding
    navigate('/', { replace: true })
  }

  return (
    <Page>
      <div className="page-title"><h1>PROFILE</h1></div>
      <section className="page-body">
        <motion.div className="profile-card" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45 }}>
          <svg width="64" height="82" viewBox="0 0 22 28" fill="none" stroke="#8c8c8c" strokeWidth="2.5"><circle cx="11" cy="6" r="3.5" /><rect x="3" y="14" width="16" height="11" rx="5.5" /></svg>
          <h2>{user.first_name} {user.last_name}</h2>
          <dl>
            {rows.map(([k, v], i) => (
              <motion.div className="row" key={k} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
                <dt>{k}</dt><dd>{v}</dd>
              </motion.div>
            ))}
          </dl>
          <div className="profile-actions">
            <button className="btn btn-light" onClick={() => { logout(); navigate('/') }}>Log out</button>
            <button className="btn btn-outline" onClick={() => setModal('pw')}>Change password</button>
            {user.role === 'Customer' && <button className="link-danger" onClick={() => setModal('del')}>Delete my account</button>}
          </div>
        </motion.div>
      </section>

      <Modal open={modal === 'pw'} onClose={close} title="Change password">
        {done ? (
          <><p className="muted">Your password was updated. Use it the next time you sign in.</p><div className="row-btns"><button className="btn btn-gold" onClick={close}>Done</button></div></>
        ) : (
          <form className="stack" onSubmit={submitPw} noValidate>
            <Field label="Current password" icon="lock" type="password" value={f.current} onChange={set('current')} autoComplete="current-password" />
            <Field label="New password" icon="lock" type="password" value={f.next} onChange={set('next')} autoComplete="new-password" />
            <Field label="Confirm new password" icon="lock" type="password" value={f.confirm} onChange={set('confirm')} autoComplete="new-password" />
            <p className="auth-error" role="alert">{error}</p>
            <div className="row-btns"><button className="btn btn-gold" type="submit">Update password</button><button className="btn btn-outline" type="button" onClick={close}>Cancel</button></div>
          </form>
        )}
      </Modal>

      <Modal open={modal === 'del'} onClose={close} title="Delete your account?">
        <form className="stack" onSubmit={submitDelete} noValidate>
          <p className="muted">This permanently removes your account and cancels your upcoming appointments. This can't be undone. Enter your password to confirm.</p>
          <Field label="Password" icon="lock" type="password" value={f.current} onChange={set('current')} autoComplete="current-password" />
          <p className="auth-error" role="alert">{error}</p>
          <div className="row-btns"><button className="btn btn-danger" type="submit">Delete account</button><button className="btn btn-outline" type="button" onClick={close}>Keep my account</button></div>
        </form>
      </Modal>
    </Page>
  )
}
