import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PartyPopper, Heart } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

export default function CelebrateSection() {
  const [celebrating, setCelebrating] = useState(false)
  const canvasRef = useRef(null)
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.celebrate-animate',
        { opacity: 0, y: 60, scale: 0.8 },
        { opacity: 1, y: 0, scale: 1, duration: 1, stagger: 0.2, ease: 'back.out(1.7)', scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' } }
      )
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!celebrating) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colors = ['#e74c3c', '#f39c12', '#f1c40f', '#2ecc71', '#9b59b6', '#e91e63', '#ff6b6b', '#fff']
    const pieces = []
    let animationId

    class Piece {
      constructor() {
        this.reset()
      }
      reset() {
        this.x = Math.random() * canvas.width
        this.y = canvas.height + 20
        this.w = 8 + Math.random() * 10
        this.h = 6 + Math.random() * 8
        this.color = colors[Math.floor(Math.random() * colors.length)]
        this.vy = 3 + Math.random() * 4
        this.vx = (Math.random() - 0.5) * 3
        this.rotation = Math.random() * 360
        this.rotSpeed = (Math.random() - 0.5) * 8
        this.opacity = 1
        this.isHeart = Math.random() > 0.6
      }
      update() {
        this.y -= this.vy
        this.x += this.vx
        this.rotation += this.rotSpeed
        this.vy += 0.03
        this.opacity -= 0.003
      }
      draw() {
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate((this.rotation * Math.PI) / 180)
        ctx.globalAlpha = Math.max(0, this.opacity)
        ctx.fillStyle = this.color
        if (this.isHeart) {
          ctx.font = `${this.w * 3}px Arial`
          ctx.fillText('❤', -this.w * 1.5, 0)
        } else {
          ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h)
        }
        ctx.restore()
      }
    }

    for (let i = 0; i < 300; i++) {
      pieces.push(new Piece())
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pieces.forEach(p => {
        p.update()
        p.draw()
      })
      pieces.splice(0, pieces.filter(p => p.y < -20 || p.opacity <= 0).length)
      
      if (pieces.length > 0) {
        animationId = requestAnimationFrame(animate)
      }
    }
    animate()

    return () => cancelAnimationFrame(animationId)
  }, [celebrating])

  const handleCelebrate = () => {
    setCelebrating(true)
    setTimeout(() => setCelebrating(false), 8000)
  }

  return (
    <>
      <section ref={sectionRef} id="celebrate" className="py-32 px-6 relative" style={{ background: 'linear-gradient(180deg, #0a0a0f, #120a0a)' }}>
        <div className="absolute inset-0 pattern-hearts opacity-15" />
        
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="celebrate-animate opacity-0">
            <PartyPopper className="w-20 h-20 mx-auto text-accent mb-4" />
            <h2 className="font-playfair text-5xl md:text-7xl font-bold mt-8 mb-6 text-gradient-romantic">
              Celebremos!
            </h2>
            <p className="text-cream/50 text-lg mb-12">Porque el amor merece ser celebrado</p>
            
            <button
              onClick={handleCelebrate}
              className="group relative px-14 py-6 rounded-full bg-gradient-to-r from-accentDark via-accent via-rose-500 to-amber-500 text-white font-playfair text-xl md:text-2xl font-semibold tracking-wide transition-all duration-500 hover:scale-110 hover:shadow-[0_0_60px_rgba(231,76,60,0.6)] active:scale-95 overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative flex items-center gap-3">
                <Heart className="w-6 h-6 fill-white" />
                <span>Felicidades Amor!</span>
                <Heart className="w-6 h-6 fill-white" />
              </span>
            </button>
          </div>

          <div className="celebrate-animate opacity-0 mt-16 flex justify-center gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Heart 
                key={i}
                className="w-8 h-8 text-accent fill-accent animate-pulse"
                style={{ animationDelay: `${i * 0.15}s`, animationDuration: '2.5s' }}
              />
            ))}
          </div>
        </div>
      </section>

      {celebrating && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-[3000]"
        />
      )}
    </>
  )
}
