import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Heart, Sparkles } from 'lucide-react'

export default function Hero() {
  const heroRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-fade-1', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1.2, delay: 0.3, ease: 'power3.out' })
      gsap.fromTo('.hero-fade-2', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1.2, delay: 0.6, ease: 'power3.out' })
      gsap.fromTo('.hero-fade-3', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, delay: 0.9, ease: 'power3.out' })
      gsap.fromTo('.hero-fade-4', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, delay: 1.2, ease: 'power3.out' })
      gsap.fromTo('.hero-fade-5', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, delay: 1.5, ease: 'power3.out' })

      gsap.to('.hero-orbit', {
        rotation: 360,
        duration: 30,
        repeat: -1,
        ease: 'none'
      })

      const handleScroll = () => {
        const scrollY = window.scrollY
        const windowHeight = window.innerHeight
        if (scrollY < windowHeight) {
          if (heroRef.current) {
            heroRef.current.style.transform = `translateY(${scrollY * 0.4}px)`
            heroRef.current.style.opacity = 1 - scrollY / windowHeight * 0.7
          }
        }
      }
      window.addEventListener('scroll', handleScroll, { passive: true })

      return () => window.removeEventListener('scroll', handleScroll)
    }, heroRef)

    return () => ctx.revert()
  }, [])

  const createStars = () => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 5,
    }))
  }

  const stars = createStars()

  return (
    <section id="hero" ref={heroRef} className="min-h-screen flex items-center justify-center text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-dark via-[#1a0a0a] to-[#0d0d1a]" />
      
      <div className="absolute inset-0">
        <div className="absolute inset-0 pattern-hearts opacity-30" />
        {stars.map(star => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white animate-star-twinkle"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] hero-orbit">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-accent/40 blur-sm animate-pulse" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-amber-500/40 blur-sm animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-rose-500/40 blur-sm animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-pink-500/40 blur-sm animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div ref={contentRef} className="relative z-10 p-6 max-w-4xl">
        <div className="hero-fade-1 opacity-0 mb-4">
          <Heart className="inline-block w-12 h-12 md:w-16 md:h-16 text-accent animate-pulse fill-accent" />
        </div>
        
        <p className="hero-fade-2 opacity-0 font-great text-2xl md:text-4xl text-accent mb-4">
          Para el amor de mi vida
        </p>
        
        <h1 className="hero-fade-3 opacity-0 font-playfair text-[3.5rem] md:text-[7rem] font-bold leading-tight mb-6 text-gradient-romantic">
          Mi Amor
        </h1>
        
        <div className="hero-fade-4 opacity-0 flex items-center justify-center gap-4 mb-6">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-accent" />
          <Heart className="w-6 h-6 text-accent fill-accent" />
          <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-accent" />
        </div>
        
        <p className="hero-fade-5 opacity-0 text-cream/60 text-sm md:text-base tracking-[4px] uppercase">
          Cada dia a tu lado es un regalo del universo
        </p>

        <div className="hero-fade-5 opacity-0 mt-16 animate-bounce">
          <p className="text-cream/30 text-xs tracking-[3px] uppercase flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Desliza para descubrir
          </p>
          <div className="mt-4 text-2xl text-accent/50">↓</div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark to-transparent" />
    </section>
  )
}
