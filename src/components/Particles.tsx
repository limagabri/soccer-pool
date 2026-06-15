import { motion } from 'framer-motion'

type Particle = {
  left: number
  top: number
  size: number
  duration: number
  delay: number
  drift: number
  color: string
}

// Pseudo-aleatório determinístico para as posições não mudarem entre renders
function rand(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return x - Math.floor(x)
}

const PARTICLES: Particle[] = Array.from({ length: 40 }, (_, i) => ({
  left: rand(i, 1) * 100,
  top: rand(i, 2) * 100,
  size: 1.5 + rand(i, 3) * 3,
  duration: 6 + rand(i, 4) * 10,
  delay: rand(i, 5) * 8,
  drift: -20 - rand(i, 6) * 40,
  color:
    rand(i, 7) > 0.65 ? 'rgba(255, 214, 0, 0.7)' : 'rgba(0, 200, 83, 0.6)',
}))

export function Particles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
          animate={{ y: [0, p.drift, 0], opacity: [0, 0.9, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
