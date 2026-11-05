export default function LogPanel({ logs }) {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-xl">
      <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
        <span>📜</span> Game & AI Strategy Log
      </h3>
      <div className="max-h-48 overflow-y-auto space-y-2 pr-2 text-xs text-slate-200 font-mono">
        {logs.map((log, index) => (
          <div
            key={index}
            className={`p-2.5 rounded-xl border backdrop-blur-sm transition-all ${
              log.type === 'NPC_JUSTIFICATION'
                ? 'bg-indigo-950/40 border-indigo-400/30 text-indigo-200'
                : log.type === 'COMBAT'
                ? 'bg-rose-950/40 border-rose-400/30 text-rose-200'
                : 'bg-slate-900/40 border-white/10 text-slate-300'
            }`}
          >
            <span className="font-semibold block text-[10px] text-slate-400 mb-0.5">
              {log.time}
            </span>
            <p>{log.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}