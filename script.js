// Contact form: simple validation (no data is sent anywhere yet)
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  let valid = true;

  form.querySelectorAll('.field').forEach((field) => {
    const input = field.querySelector('input, textarea');
    const ok = input.value.trim() !== '' && input.checkValidity();
    field.classList.toggle('invalid', !ok);
    if (!ok) valid = false;
  });

  if (!valid) {
    status.textContent = 'Please fill in all fields with valid details.';
    return;
  }

  // TODO: replace with a real fetch() call to your backend or form service
  status.textContent = 'Thanks! Your message is ready to send.';
  form.reset();
});

// Clear the error state as the person types
form.addEventListener('input', (e) => {
  e.target.closest('.field')?.classList.remove('invalid');
});

// Gallery: auto-moving carousel (drag with the mouse still works)
const track = document.querySelector('.track');
const SPEED = 40; // pixels per second, change to go faster or slower

// Duplicate the images once so the loop has no visible jump
Array.from(track.children).forEach((shot) => {
  const clone = shot.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  track.appendChild(clone);
});

const shots = track.querySelectorAll('.shot');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let isDown = false;
let startX = 0;
let startScroll = 0;
let pos = 0;
let last = null;

// Width of one full set of images (including the gaps)
const loopWidth = () => shots[shots.length / 2].offsetLeft - shots[0].offsetLeft;

function tick(time) {
  if (last !== null && !isDown && !reduceMotion) {
    pos += (SPEED * (time - last)) / 1000;
  } else {
    pos = track.scrollLeft; // stay in sync while dragging
  }
  last = time;

  const width = loopWidth();
  if (pos >= width) pos -= width;   // wrap forward
  if (pos < 0) pos += width;        // wrap backward (when dragging right)

  track.scrollLeft = pos;
  requestAnimationFrame(tick);
}

track.addEventListener('mousedown', (e) => {
  isDown = true;
  startX = e.pageX;
  startScroll = track.scrollLeft;
  track.classList.add('dragging');
});

window.addEventListener('mouseup', () => {
  isDown = false;
  track.classList.remove('dragging');
});

window.addEventListener('mousemove', (e) => {
  if (!isDown) return;
  track.scrollLeft = startScroll - (e.pageX - startX);
});

requestAnimationFrame(tick);