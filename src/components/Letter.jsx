import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Heart, Mail } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const letterText = `Cada dia que pasa me doy cuenta de lo afortunado que soy de tenerte en mi vida. Eres la luz que ilumina mis mananas, la calma en mis tormentas y la razon de mis sonrisas mas sinceras.

Desde que llegaste, todo tiene mas color, mas sentido. Contigo aprendi que el amor no solo se siente, se vive, se respira, se comparte en cada mirada, en cada abrazo, en cada silencio comice.

Gracias por cada momento, por cada risa, por cada sueno compartido. Esto es solo el comienzo de una historia que quiero escribir a tu lado para siempre. Te amo mas de lo que las palabras pueden expresar.`

export default function Letter() {
  const [displayedText, setDisplayedText] = useState('')
  const [showSignature, setShowSignature] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const ref = useRef(null)
  const hasTypedRef = useRef(false)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.letter-animate',
        { opacity: 0, y: 60, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 1.2, stagger: 0.2, ease: 'power3.out', scrollTrigger: { trigger: ref.current, start: 'top 70%' } }
      )
    }, ref)

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !hasTypedRef.current) {
          hasTypedRef.current = true
          setTimeout(() => {
            setIsTyping(true)
            typeWriter()
          }, 800)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const typeWriter = () => {
    let i = 0
    const interval = setInterval(() => {
      setDisplayedText(letterText.slice(0, i + 1))
      i++
      if (i >= letterText.length) {
        clearInterval(interval)
        setShowSignature(true)
      }
    }, 25)
  }

  return (
    <section ref={ref} id="letter" className="py-32 px-6 relative" style={{ background: 'linear-gradient(180deg, #120a0a, #0a0a0f)' }}>
      <div className="absolute inset-0 pattern-hearts opacity-10" />
      
      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="letter-animate opacity-0 text-center mb-12">
          <Mail className="w-16 h-16 mx-auto text-accent mb-4" />
          <h2 className="font-playfair text-4xl md:text-6xl font-bold mt-6 mb-4 text-gradient-romantic">
            Una Carta para Ti
          </h2>
          <p className="font-great text-xl md:text-2xl text-accent/70">De mi corazon al tuyo</p>
        </div>

        <div className="letter-animate opacity-0 glass-accent rounded-[2rem] p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-accent/20 to-transparent blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-tr from-rose-500/20 to-transparent blur-3xl" />
          
          <div className="font-great text-2xl md:text-3xl text-accent mb-6 relative z-10">
            Mi amor,
          </div>
          
          <div className="text-sm md:text-base leading-[2] text-cream/80 relative z-10 min-h-[200px]">
            <span className="whitespace-pre-wrap">{displayedText}</span>
            {isTyping && (
              <span className="inline-block w-[2px] h-[1.2em] bg-accent align-middle ml-1 animate-blink" />
            )}
          </div>
          
          <div className={`font-great text-2xl md:text-3xl text-accent mt-8 text-right relative z-10 transition-all duration-1000 ${showSignature ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            — Con todo mi amor,<br />Tu persona favorita
          </div>

          <div className="mt-8 flex justify-center gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Heart 
                key={i}
                className="w-6 h-6 text-accent fill-accent animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
