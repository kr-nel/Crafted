import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// <RequireRole roles={['Barber']}> ...page... </RequireRole>
export default function RequireRole({ roles, children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/signin" state={{ from: location.pathname }} replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}
