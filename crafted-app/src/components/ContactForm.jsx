import { useRef, useState } from 'react'

const FIELDS = ['name', 'email', 'msg']

export default function ContactForm() {
  const formRef = useRef(null)
  const [values, setValues] = useState({ name: '', email: '', msg: '' })
  const [invalid, setInvalid] = useState({})
  const [status, setStatus] = useState('')

  const handleChange = (e) => {
    const { id, value } = e.target
    setValues((v) => ({ ...v, [id]: value }))
    setInvalid((inv) => ({ ...inv, [id]: false })) // clear error as the person types
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const next = {}
    let valid = true

    FIELDS.forEach((id) => {
      const input = formRef.current.elements[id]
      const ok = input.value.trim() !== '' && input.checkValidity()
      next[id] = !ok
      if (!ok) valid = false
    })
    setInvalid(next)

    if (!valid) {
      setStatus('Please fill in all fields with valid details.')
      return
    }

    // TODO: replace with a real fetch() call to your backend or form service
    setStatus('Thanks! Your message is ready to send.')
    setValues({ name: '', email: '', msg: '' })
  }

  return (
    <form id="contact-form" ref={formRef} onSubmit={handleSubmit} noValidate>
      <div className={`field${invalid.name ? ' invalid' : ''}`}>
        <label htmlFor="name">Name</label>
        <input id="name" type="text" placeholder="Juan Dela Cruz" value={values.name} onChange={handleChange} />
      </div>
      <div className={`field${invalid.email ? ' invalid' : ''}`}>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" placeholder="juandelacruz.gmail.com" value={values.email} onChange={handleChange} />
      </div>
      <div className={`field${invalid.msg ? ' invalid' : ''}`}>
        <label htmlFor="msg">Message</label>
        <textarea
          id="msg"
          placeholder={'We’d love to hear what’s on your mind\n\n\nWrite your message here...'}
          value={values.msg}
          onChange={handleChange}
        />
      </div>
      <div className="send">
        <button className="btn btn-gold" type="submit">Send a message</button>
      </div>
      <p className="form-status" id="form-status" role="status" aria-live="polite">{status}</p>
    </form>
  )
}
