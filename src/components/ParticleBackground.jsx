import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Heart } from 'lucide-react'

export default function ParticleBackground() {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationId

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const colors = ['#e74c3c', '#f39c12', '#f1c40f', '#e91e63', '#ff6b6b', '#fff']

    class Particle {
      constructor() {
        this.reset()
      }
      reset() {
        this.x = Math.random() * canvas.width
        this.y = canvas.height + 10
        this.size = Math.random() * 3 + 1
        this.speedY = Math.random() * 1 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.5
        this.color = colors[Math.floor(Math.random() * colors.length)]
        this.opacity = Math.random() * 0.5 + 0.3
        this.rotation = Math.random() * 360
        this.rotationSpeed = (Math.random() - 0.5) * 2
        this.isHeart = Math.random() > 0.7
      }
      update() {
        this.y -= this.speedY
        this.x += this.speedX
        this.rotation += this.rotationSpeed
        this.opacity -= 0.002
        if (this.y < -10 || this.opacity <= 0) this.reset()
      }
      draw() {
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate((this.rotation * Math.PI) / 180)
        ctx.globalAlpha = this.opacity
        ctx.fillStyle = this.color
        if (this.isHeart) {
          ctx.font = `${this.size * 4}px Arial`
          ctx.fillText('❤', -this.size * 2, 0)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, this.size, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }
    }

    for (let i = 0; i < 80; i++) {
      const p = new Particle()
      p.y = Math.random() * canvas.height
      particlesRef.current.push(p)
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particlesRef.current.forEach(p => {
        p.update()
        p.draw()
      })
      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-60"
    />
  )
}
