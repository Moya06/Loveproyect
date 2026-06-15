import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Heart, Music, Sparkles, Infinity } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const timelineData = [
  { 
    date: 'El Inicio', 
    title: 'Donde todo comenzo', 
    desc: 'El dia en que nuestras vidas se cruzaron y el universo nos regalo la oportunidad de encontrarnos.',
    icon: Heart,
    color: 'from-rose-500 to-pink-600'
  },
  { 
    date: 'Nuestra Cancion', 
    title: 'La banda sonora de nuestro amor', 
    desc: 'Esa cancion que siempre nos recuerda el uno al otro y que nunca dejaremos de bailar.',
    icon: Music,
    color: 'from-violet-500 to-purple-600'
  },
  { 
    date: 'Momentos', 
    title: 'Risas, suenos y complicidad', 
    desc: 'Cada sonrisa, cada mirada, cada abrazo. Todos los pequenos momentos que construyen esta historia.',
    icon: Sparkles,
    color: 'from-amber-500 to-orange-600'
  },
  { 
    date: 'Siempre', 
    title: 'Nuestro futuro juntos', 
    desc: 'Esto es solo el comienzo. Quiero vivir cada capitulo de esta historia a tu lado, porque contigo todo es mejor.',
    icon: Infinity,
    color: 'from-cyan-500 to-blue-600'
  },
]

export default function Timeline() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.timeline-item',
        { opacity: 0, x: -80, rotation: -5 },
        {
          opacity: 1,
          x: 0,
          rotation: 0,
          duration: 1,
          stagger: 0.3,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
          }
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="timeline" className="py-32 px-6 relative" style={{ background: 'linear-gradient(180deg, #120a0a, #0a0a0f)' }}>
      <div className="absolute inset-0 pattern-hearts opacity-10" />
      
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="text-center mb-20">
          <svg className="w-16 h-16 mx-auto text-accent animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <h2 className="font-playfair text-4xl md:text-6xl font-bold mt-6 mb-4 text-gradient-romantic">
            Nuestra Historia
          </h2>
          <p className="font-great text-xl md:text-2xl text-accent/70">Cada momento cuenta</p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="h-[1px] w-20 bg-gradient-to-r from-transparent to-accent/50" />
            <Heart className="w-4 h-4 text-accent/50 fill-accent/50" />
            <div className="h-[1px] w-20 bg-gradient-to-l from-transparent to-accent/50" />
          </div>
        </div>

        <div className="relative pl-8 md:pl-12">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-accent via-rose-500 to-transparent rounded-full shadow-[0_0_20px_rgba(231,76,60,0.3)]" />
          
          {timelineData.map((item, i) => {
            const Icon = item.icon
            return (
              <div
                key={i}
                className="timeline-item opacity-0 relative mb-12 md:mb-16 last:mb-0 group"
              >
                <div className={`absolute -left-[44px] md:-left-[48px] top-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                
                <div className="glass-accent rounded-2xl p-6 md:p-8 ml-4 relative overflow-hidden hover-lift">
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500`} />
                  
                  <div className="text-xs md:text-sm font-semibold tracking-[3px] uppercase text-accent mb-2 flex items-center gap-2">
                    <span>{item.date}</span>
                    <span className="text-accent/30">♦</span>
                  </div>
                  
                  <h3 className="font-playfair text-xl md:text-2xl text-cream mb-3 flex items-center gap-2">
                    <span>{item.title}</span>
                  </h3>
                  
                  <p className="text-cream/60 text-sm md:text-base leading-relaxed">{item.desc}</p>
                  
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent/0 via-accent/50 to-accent/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
