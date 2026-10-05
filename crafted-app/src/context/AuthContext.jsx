import { createContext, useContext, useState } from 'react'
import { users as seedUsers } from '../data/db'

const AuthContext = createContext(null)

const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
const save = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
}

export function AuthProvider({ children }) {
  const [extra, setExtra] = useState(() => load('crafted_new_users', [])) // accounts created via Sign Up
  const [userId, setUserId] = useState(() => load('crafted_session', null))
  const [changes, setChanges] = useState(() => load('crafted_user_changes', { passwords: {}, deleted: [] })) // password changes + deleted accounts

  const everyone = [...seedUsers, ...extra]
  const users = everyone
    .filter((u) => !changes.deleted.includes(u.users_id))
    .map((u) => (changes.passwords[u.users_id] ? { ...u, password: changes.passwords[u.users_id] } : u))
  const user = users.find((u) => u.users_id === userId) ?? null

  const login = (identity, password) => {
    const key = identity.trim().replace(/^@/, '').toLowerCase()
    const found = users.find((u) => u.username.toLowerCase() === key || u.email.toLowerCase() === key)
    // NOTE: a real backend must compare a HASHED password, never plain text.
    if (!found || found.password !== password) return { ok: false, error: 'Incorrect username/email or password.' }
    setUserId(found.users_id)
    save('crafted_session', found.users_id)
    return { ok: true, user: found }
  }

  const signup = ({ name, username, email, password }) => {
    const u = username.trim().replace(/^@/, '')
    if (users.some((x) => x.username.toLowerCase() === u.toLowerCase())) return { ok: false, error: 'That username is already taken.' }
    if (users.some((x) => x.email.toLowerCase() === email.trim().toLowerCase())) return { ok: false, error: 'That email is already registered.' }
    const parts = name.trim().split(/\s+/)
    const last_name = parts.length > 1 ? parts.pop() : ''
    const created = {
      users_id: Math.max(...everyone.map((x) => x.users_id)) + 1,
      first_name: parts.join(' '), last_name, email: email.trim(), username: u,
      phone: '', password, role: 'Customer', created_at: new Date().toISOString().slice(0, 10),
    }
    const next = [...extra, created]
    setExtra(next)
    save('crafted_new_users', next)
    setUserId(created.users_id)
    save('crafted_session', created.users_id)
    return { ok: true, user: created }
  }

  const logout = () => { setUserId(null); save('crafted_session', null) }

  const changePassword = (current, next) => {
    if (user.password !== current) return { ok: false, error: 'Your current password is incorrect.' }
    if (next.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' }
    if (next === current) return { ok: false, error: 'Choose a password different from your current one.' }
    const updated = { ...changes, passwords: { ...changes.passwords, [user.users_id]: next } }
    setChanges(updated); save('crafted_user_changes', updated)
    return { ok: true }
  }

  // Only customers can delete themselves. Staff accounts are managed by the admin.
  const deleteAccount = (password) => {
    if (user.role !== 'Customer') return { ok: false, error: 'Staff accounts can only be removed by an admin.' }
    if (user.password !== password) return { ok: false, error: 'Incorrect password.' }
    const updated = { ...changes, deleted: [...changes.deleted, user.users_id] }
    setChanges(updated); save('crafted_user_changes', updated)
    logout()
    return { ok: true }
  }

  return <AuthContext.Provider value={{ user, users, login, signup, logout, changePassword, deleteAccount }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
export const homeFor = (role) => (role === 'Admin' ? '/admin' : role === 'Barber' ? '/dashboard' : '/')
