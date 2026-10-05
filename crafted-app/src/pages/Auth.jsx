import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth, homeFor } from '../context/AuthContext'

const BG = '/assets/banner_b&w.png' // sign in / sign up background

const Icon = {
  user: <svg width="16" height="18" viewBox="0 0 22 28" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="6" r="3.5" /><rect x="3" y="14" width="16" height="11" rx="5.5" /></svg>,
  mail: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg>,
  lock: <svg width="16" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="5" y="11" width="14" height="10" rx="3" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>,
}

const Eye = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
const EyeOff = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l18 18M10.6 5.1A9.7 9.7 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6A17 17 0 0 0 2 12s3.5 7 10 7c1.7 0 3.2-.4 4.5-1M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>

// Text field with an optional icon. Password fields get a show/hide eye button.
export function Field({ label, icon, type, ...props }) {
  const [show, setShow] = useState(false)
  const isPw = type === 'password'
  return (
    <label className="auth-field">
      <span>{label}</span>
      <div>
        {icon && Icon[icon]}
        <input type={isPw && show ? 'text' : type} {...props} />
        {isPw && <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? EyeOff : Eye}</button>}
      </div>
    </label>
  )
}

function Shell({ title, side, children }) {
  return (
    <div className={`auth-page ${side}`} style={{ '--auth-bg': `url("${BG}")` }}>
      <Link to="/" className="auth-home">&larr; Back to site</Link>
      <motion.div className={`auth-wrap ${side}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
        <h1>{title}</h1>
        {children}
      </motion.div>
    </div>
  )
}

export function SignIn() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ id: '', pw: '' })
  const [error, setError] = useState('')
  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setError('') }

  const submit = (e) => {
    e.preventDefault()
    if (!form.id.trim() || !form.pw) return setError('Enter your username or email and password.')
    const res = login(form.id, form.pw)
    if (!res.ok) return setError(res.error)
    navigate(location.state?.from || homeFor(res.user.role), { replace: true })
  }

  return (
    <Shell title="Sign In" side="right">
      <form className="auth-card auth-form" onSubmit={submit} noValidate>
        <Field label="Enter your username or email" icon="user" placeholder="@juandelacruz" value={form.id} onChange={set('id')} autoComplete="username" />
        <Field label="Password" icon="lock" type="password" placeholder="*****" value={form.pw} onChange={set('pw')} autoComplete="current-password" />
        <p className="auth-error" role="alert">{error}</p>
        <button className="btn btn-light" type="submit">Sign In</button>
        <Link className="btn btn-outline" to="/signup">Create an account</Link>
      </form>
      <p className="demo-hint">Demo logins: <b>angelaken / angel123</b> (customer) · <b>nel / barber123</b> (barber) · <b>admin / admin123</b></p>
    </Shell>
  )
}

export function SignUp() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [f, setF] = useState({ name: '', username: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setError('') }

  const submit = (e) => {
    e.preventDefault()
    if (Object.values(f).some((v) => !v.trim())) return setError('Please fill in every field.')
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setError('Enter a valid email address.')
    if (f.password.length < 6) return setError('Password must be at least 6 characters.')
    if (f.password !== f.confirm) return setError('Passwords do not match.')
    const res = signup(f)
    if (!res.ok) return setError(res.error)
    navigate('/', { replace: true })
  }

  return (
    <Shell title="Create Account" side="center">
      <form className="auth-card auth-form" onSubmit={submit} noValidate>
        <Field label="Name" placeholder="ex. Juan Dela Cruz" value={f.name} onChange={set('name')} />
        <Field label="Username" icon="user" placeholder="@juandelacruz" value={f.username} onChange={set('username')} autoComplete="username" />
        <Field label="Email" icon="mail" type="email" placeholder="juandelacruz@gmail.com" value={f.email} onChange={set('email')} autoComplete="email" />
        <Field label="Password" icon="lock" type="password" placeholder="*****" value={f.password} onChange={set('password')} autoComplete="new-password" />
        <Field label="Confirm Password" icon="lock" type="password" placeholder="*****" value={f.confirm} onChange={set('confirm')} autoComplete="new-password" />
        <p className="auth-error" role="alert">{error}</p>
        <button className="btn btn-light" type="submit">Create Account</button>
        <Link className="btn btn-outline" to="/signin">Sign In</Link>
      </form>
    </Shell>
  )
}
