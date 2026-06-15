import { X, Play } from 'lucide-react'

export default function AnimationPicker({ animations, selectedId, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-accent rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-playfair text-xl text-cream">Selecciona Animacion</h3>
          <button onClick={onClose} className="text-cream/60 hover:text-cream">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {animations.map(anim => (
            <button
              key={anim.id}
              onClick={() => { onSelect(anim.id); onClose() }}
              className={`p-4 rounded-xl text-left transition-all ${selectedId === anim.id ? 'bg-accent/30 border-2 border-accent' : 'bg-white/5 border border-white/10 hover:border-accent/50'}`}
            >
              <div className="text-cream font-medium text-sm mb-1">{anim.name}</div>
              <div className="text-cream/40 text-xs">{anim.type}</div>
              <div className="text-cream/30 text-xs mt-1">{anim.duration_ms}ms</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
