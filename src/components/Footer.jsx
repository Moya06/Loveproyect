import { Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="relative py-16 px-6 text-center border-t border-white/5 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent" />
      
      <div className="relative z-10">
        <div className="flex justify-center gap-4 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Heart 
              key={i}
              className="w-7 h-7 text-accent fill-accent animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
        
        <h3 className="font-great text-3xl md:text-4xl text-gradient-romantic mb-4">
          Hecho con Amor
        </h3>
        
        <p className="text-cream/40 text-sm tracking-widest uppercase mb-6">
          Para ti, con todo mi corazon
        </p>
        
        <div className="flex items-center justify-center gap-4 text-cream/30 text-sm">
          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-accent/30" />
          <Heart className="w-4 h-4 text-accent fill-accent" />
          <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-accent/30" />
        </div>
        
        <p className="text-cream/20 text-xs mt-8">
          © 2024 Nuestro Amor — Por siempre
        </p>
      </div>
    </footer>
  )
}
