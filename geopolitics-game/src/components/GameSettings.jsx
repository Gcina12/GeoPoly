import { useState } from 'react';

function VolumeControl({ label, value, onChange }) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="flex items-center justify-between font-semibold">
        <span>{label} volume</span>
        <span className="font-mono text-xs">{Math.round(value * 100)}%</span>
      </span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={event => onChange(Number(event.target.value))}
        aria-label={`${label} volume`}
        className="w-full cursor-pointer accent-cyan-500"
      />
    </label>
  );
}

export default function GameSettings({
  musicVolume,
  onMusicVolumeChange,
  sfxVolume,
  onSfxVolumeChange
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Game settings"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(open => !open)}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-slate-950/60 text-lg transition hover:border-cyan-400/60 hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500"
      >
        ⚙
      </button>
      {isOpen && (
        <section
          aria-label="Game settings"
          className="absolute right-0 top-12 z-50 w-72 space-y-4 rounded-2xl border border-white/20 bg-slate-900 p-4 text-white shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold">Game settings</h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close settings"
              className="cursor-pointer rounded-lg px-2 py-1 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>
          <VolumeControl label="Music" value={musicVolume} onChange={onMusicVolumeChange} />
          <VolumeControl label="Sound effects" value={sfxVolume} onChange={onSfxVolumeChange} />
        </section>
      )}
    </div>
  );
}
