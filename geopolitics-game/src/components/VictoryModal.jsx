export default function VictoryModal({ commanderName, onDismiss }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="victory-confetti" aria-hidden="true">
        {Array.from({ length: 28 }, (_, index) => (
          <span
            key={index}
            style={{
              '--confetti-x': `${(index * 37) % 100}%`,
              '--confetti-delay': `${(index % 9) * -0.37}s`,
              '--confetti-color': ['#ff6f61', '#2dd4bf', '#fbbf24', '#38bdf8'][index % 4]
            }}
          />
        ))}
      </div>
      <section role="dialog" aria-modal="true" aria-labelledby="victory-title" className="relative z-10 w-full max-w-xl rounded-3xl border border-white/30 bg-slate-900/90 p-8 text-center text-white shadow-2xl backdrop-blur-2xl">
        <span className="mb-3 block text-6xl" aria-hidden="true">👑</span>
        <p className="mb-2 text-xs font-black uppercase tracking-[.25em] text-teal-200">World conquest complete</p>
        <h1 id="victory-title" className="mb-3 bg-gradient-to-r from-amber-200 via-rose-200 to-cyan-200 bg-clip-text text-3xl font-black text-transparent sm:text-4xl">
          Congratulations, Commander {commanderName}!
        </h1>
        <p className="text-lg font-semibold text-slate-100">The world is ruled by you.</p>
        <p className="mt-4 text-xs text-slate-300">Every territory in this campaign is under your command.</p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-7 rounded-xl bg-[#ff6f61] px-6 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#f45d51] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200"
        >
          Continue campaign
        </button>
      </section>
    </div>
  );
}
