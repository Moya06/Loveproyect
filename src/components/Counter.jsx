import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Heart, Sun, Clock, Sparkles } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

export default function Counter() {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const sectionRef = useRef(null)

  useEffect(() => {
    const startDate = new Date()
    startDate.setFullYear(2024, 0, 1)

    const updateTimer = () => {
      const now = new Date()
      const diff = Math.max(0, now - startDate)
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.counter-card', 
        { opacity: 0, y: 50, scale: 0.8 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.8, 
          stagger: 0.15, 
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
          }
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const units = [
    { value: time.days, label: 'Dias', icon: Sun, color: 'from-amber-500 to-orange-600' },
    { value: time.hours, label: 'Horas', icon: Clock, color: 'from-rose-500 to-pink-600' },
    { value: time.minutes, label: 'Minutos', icon: Sparkles, color: 'from-violet-500 to-purple-600' },
    { value: time.seconds, label: 'Segundos', icon: Heart, color: 'from-cyan-500 to-blue-600' },
  ]

  return (
    <section ref={sectionRef} id="counter" className="py-32 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-dark via-[#120a0a]/50 to-dark" />
      <div className="absolute inset-0 pattern-hearts opacity-20" />
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent" />
      
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <div className="mb-4">
          <Heart className="inline-block w-14 h-14 text-accent animate-pulse fill-accent" />
        </div>
        <h2 className="font-playfair text-4xl md:text-6xl font-bold mb-4 text-gradient-romantic">
          Nuestro Tiempo Juntos
        </h2>
        <p className="text-cream/40 text-xs md:text-sm tracking-[4px] uppercase mb-16">
          desde el dia que todo comenzo
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {units.map(({ value, label, icon: Icon, color }) => (
            <div
              key={label}
              className="counter-card opacity-0 glass-accent rounded-3xl p-6 md:p-8 relative overflow-hidden group hover-lift"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              <Icon className="w-8 h-8 md:w-10 md:h-10 text-accent mx-auto mb-3" />
              <div className="font-playfair text-4xl md:text-6xl font-bold text-gradient-romantic mb-2">
                {String(value).padStart(2, '0')}
              </div>
              <div className="text-xs md:text-sm uppercase tracking-[3px] text-cream/50">{label}</div>
              
              <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>

        <div className="mt-16 flex justify-center gap-8 text-cream/30 text-sm">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-accent fill-accent" />
            <span>Amor eterno</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Juntos para siempre</span>
          </div>
        </div>
      </div>
    </section>
  )
}
