import { useEffect, useRef } from 'react'

const SPEED = 40 // pixels per second, change to go faster or slower

const SHOTS = [
  { img: '/assets/fade_b&w.png', title: 'Haircuts & Fades' },
  { img: '/assets/shave_b&w.png', title: 'Shave & Beard Trims' },
  { img: '/assets/treatment_b&w.png', title: 'Hair Treatments' },
  { img: '/assets/kid_b&w.png', title: 'Kids & Seniors' },
]

export default function Gallery() {
  const trackRef = useRef(null)

  useEffect(() => {
    const track = trackRef.current
    const shots = track.querySelectorAll('.shot')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let isDown = false
    let startX = 0
    let startScroll = 0
    let pos = 0
    let last = null
    let raf

    // Width of one full set of images (including the gaps)
    const loopWidth = () => shots[shots.length / 2].offsetLeft - shots[0].offsetLeft

    const tick = (time) => {
      if (last !== null && !isDown && !reduceMotion) {
        pos += (SPEED * (time - last)) / 1000
      } else {
        pos = track.scrollLeft // stay in sync while dragging
      }
      last = time

      const width = loopWidth()
      if (pos >= width) pos -= width // wrap forward
      if (pos < 0) pos += width // wrap backward (when dragging right)

      track.scrollLeft = pos
      raf = requestAnimationFrame(tick)
    }

    const onDown = (e) => {
      isDown = true
      startX = e.pageX
      startScroll = track.scrollLeft
      track.classList.add('dragging')
    }
    const onUp = () => {
      isDown = false
      track.classList.remove('dragging')
    }
    const onMove = (e) => {
      if (!isDown) return
      track.scrollLeft = startScroll - (e.pageX - startX)
    }

    track.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      track.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  // Images are rendered twice so the loop has no visible jump
  const loop = [...SHOTS, ...SHOTS]

  return (
    <div className="track" ref={trackRef}>
      {loop.map((s, i) => (
        <div className="shot" key={i} aria-hidden={i >= SHOTS.length ? 'true' : undefined}>
          <div className="ph ph-fill">
            <img src={s.img} alt="" />
            <div className="shot-title">{s.title}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
