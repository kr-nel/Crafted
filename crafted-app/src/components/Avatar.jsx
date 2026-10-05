import { useState } from 'react'

// Photo naming:  public/assets/barbers/barber-<barber_id>.png   (also tries .jpg, .jpeg, .webp)
// Example: barber-1.png = Johann, barber-5.png = Nel. If no file is found, initials show instead.
const EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']

export default function Avatar({ barber, size = 104 }) {
  const [tried, setTried] = useState(0)
  const initials = (barber.first_name[0] + (barber.last_name[0] || '')).toUpperCase()
  return (
    <div className="avatar" style={{ width: size, height: size }}>
      {tried >= EXTENSIONS.length
        ? <span>{initials}</span>
        : <img key={tried} src={`/assets/barbers/barber-${barber.barber_id}.${EXTENSIONS[tried]}`} alt={barber.first_name} onError={() => setTried(tried + 1)} />}
    </div>
  )
}
