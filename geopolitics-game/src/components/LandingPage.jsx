import { useEffect, useRef, useState } from 'react';
import GameSettings from './GameSettings';

const setupSteps = [
  { number: '01', label: 'Command', active: true },
  { number: '02', label: 'Choose nation', active: false },
  { number: '03', label: 'Deploy', active: false }
];

export default function LandingPage({
  onStartCampaign,
  onWatchLive,
  musicVolume,
  onMusicVolumeChange,
  sfxVolume,
  onSfxVolumeChange
}) {
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const closeBriefingRef = useRef(null);

  useEffect(() => {
    if (!isBriefingOpen) return undefined;
    closeBriefingRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = event => {
      if (event.key === 'Escape') setIsBriefingOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isBriefingOpen]);

  return (
    <main className="battlefield-scene min-h-screen overflow-hidden px-4 pb-12 text-white sm:px-6 lg:px-10">
      <header className="relative z-20 mx-auto flex min-h-20 max-w-[1600px] items-center justify-between gap-4 border-b border-white/10">
        <a href="#top" className="flex shrink-0 items-center gap-3" aria-label="GeoPoly home">
          <img
            src="/favicon.jpg"
            alt=""
            aria-hidden="true"
            className="h-10 w-10 rounded-xl border border-amber-200/30 object-cover shadow-lg shadow-amber-500/20 sm:h-12 sm:w-12"
          />
          <span>
            <span className="block text-lg font-black tracking-[.13em] text-amber-100 sm:text-xl">GeoPoly</span>
            <span className="block text-[9px] font-semibold uppercase tracking-[.2em] text-slate-300">Global command theater</span>
          </span>
        </a>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 rounded-2xl border border-white/15 bg-slate-950/45 p-1.5 shadow-xl backdrop-blur-xl md:flex">
          <a href="#lobbies" className="rounded-xl border border-amber-200/20 bg-white/10 px-4 py-2 text-xs font-bold text-amber-100">Lobbies</a>
          <button type="button" onClick={onWatchLive} className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">Watch live</button>
          <button
            type="button"
            onClick={() => setIsBriefingOpen(true)}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Intel
          </button>
          <a href="#guide" className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">Guide</a>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <GameSettings
              musicVolume={musicVolume}
              onMusicVolumeChange={onMusicVolumeChange}
              sfxVolume={sfxVolume}
              onSfxVolumeChange={onSfxVolumeChange}
            />
          </div>
        </div>
      </header>

      <section id="top" className="mx-auto grid min-h-[calc(100svh-5rem)] max-w-[1500px] items-center gap-10 py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)] lg:gap-16 lg:py-16">
        <div className="max-w-3xl">
          <p className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-[.25em] text-amber-200 sm:text-sm">
            <span className="h-px w-8 bg-amber-300" />
            Dominate the world stage
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-white drop-shadow-[0_3px_18px_rgba(0,0,0,.7)] sm:text-5xl lg:text-7xl">
            Interactive geopolitical
            <span className="mt-2 block text-amber-100">war game &amp; simulations</span>
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-200 drop-shadow sm:text-base">
            Choose a nation on any continent, command your forces, and reshape the world one strategic move at a time.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onStartCampaign}
              className="rounded-xl border border-amber-200/70 bg-amber-500/20 px-7 py-3.5 text-sm font-black uppercase tracking-wide text-amber-100 shadow-[0_0_26px_rgba(245,158,11,.24)] backdrop-blur-lg transition hover:bg-amber-400/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
            >
              Start campaign
            </button>
            <button
              type="button"
              onClick={onWatchLive}
              className="rounded-xl border border-cyan-200/45 bg-cyan-950/45 px-7 py-3.5 text-sm font-black uppercase tracking-wide text-cyan-100 backdrop-blur-lg transition hover:bg-cyan-900/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
            >
              Watch live game
              <span className="ml-2 inline-flex items-center gap-1.5 text-[10px] font-semibold text-cyan-200/80">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> LIVE FEED
              </span>
            </button>
          </div>
          <p className="mt-5 text-xs text-slate-300">Set up a campaign, choose your capital, and lead your forces to victory.</p>
        </div>

        <section id="lobbies" aria-labelledby="setup-title" className="rounded-[1.75rem] border border-white/30 bg-slate-950/55 p-5 shadow-[0_24px_80px_rgba(0,0,0,.45)] backdrop-blur-2xl sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-200">Campaign lobby</span>
              <h2 id="setup-title" className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">Tactical game setup</h2>
            </div>
            <span className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-200">Ready</span>
          </div>

          <ol className="my-6 grid grid-cols-3">
            {setupSteps.map((step, index) => (
              <li key={step.number} className="relative flex flex-col items-center gap-2 text-center">
                {index < setupSteps.length - 1 && <span aria-hidden="true" className="absolute left-[58%] right-[-42%] top-4 h-px bg-white/20" />}
                <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${step.active ? 'border-amber-200 bg-amber-300 text-slate-950 shadow-[0_0_18px_rgba(251,191,36,.4)]' : 'border-white/25 bg-slate-900/80 text-slate-400'}`}>
                  {step.number}
                </span>
                <span className={`text-[10px] font-semibold sm:text-xs ${step.active ? 'text-amber-100' : 'text-slate-400'}`}>{step.label}</span>
              </li>
            ))}
          </ol>

          <div className="rounded-2xl border border-amber-200/35 bg-gradient-to-br from-amber-300/20 to-orange-950/35 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-xl text-amber-200" aria-hidden="true">◉</span>
              <div>
                <h3 className="font-bold text-amber-50">Global campaign</h3>
                <p className="mt-1 text-xs leading-5 text-slate-200">One campaign mode · choose a continent · 9 AI commanders</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Opposition</span>
              <span className="mt-1 block text-sm font-semibold text-white">9 AI commanders</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Objective</span>
              <span className="mt-1 block text-sm font-semibold text-white">Unify the theater</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onStartCampaign}
            className="mt-5 w-full rounded-xl border border-amber-200/70 bg-amber-400/20 py-3.5 text-sm font-black uppercase tracking-wide text-amber-100 shadow-[0_0_24px_rgba(245,158,11,.2)] transition hover:bg-amber-400/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
          >
            Create campaign
          </button>
          <p className="mt-3 text-center text-[10px] leading-5 text-slate-400">No extra game modes to configure. Pick a nation and deploy.</p>
        </section>
      </section>

      <section id="guide" aria-labelledby="guide-title" className="mx-auto max-w-[1500px] scroll-mt-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-amber-200">Field manual</p>
            <h2 id="guide-title" className="mt-1 text-2xl font-black text-white sm:text-3xl">How to play</h2>
          </div>
          <p className="max-w-lg text-xs leading-5 text-slate-300">A quick briefing before you enter the command map.</p>
        </div>
        <ol className="grid gap-3 md:grid-cols-3">
          {[
            ['01', 'Choose your nation', 'Start a campaign, enter a commander name if needed, then select your capital on the map.'],
            ['02', 'Plan and reinforce', 'On later rounds, receive two soldiers per country you control and allocate them across your territories. You may transfer troops between your countries while keeping one behind.'],
            ['03', 'Conquer the theater', 'Resolve battles with the dice combat system, watch the battle log and intel feed, and capture every active rival nation to win.']
          ].map(([number, title, description]) => (
            <li key={number} className="rounded-2xl border border-white/15 bg-slate-950/55 p-5 shadow-xl backdrop-blur-xl">
              <span className="text-xs font-black tracking-widest text-amber-200">{number}</span>
              <h3 className="mt-2 font-bold text-white">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-300">{description}</p>
            </li>
          ))}
        </ol>
      </section>

      {isBriefingOpen && (
        <div
          className="field-briefing-backdrop fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto p-3 sm:p-6"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setIsBriefingOpen(false);
          }}
        >
          <article
            role="dialog"
            aria-modal="true"
            aria-labelledby="field-briefing-title"
            className="field-briefing-paper relative my-auto w-full max-w-3xl overflow-hidden rounded-sm px-6 py-7 text-stone-900 sm:px-12 sm:py-10"
          >
            <div className="field-briefing-watermark" aria-hidden="true">GeoPoly</div>
            <button
              ref={closeBriefingRef}
              type="button"
              onClick={() => setIsBriefingOpen(false)}
              aria-label="Close field briefing"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-stone-800/20 bg-stone-900/5 text-xl text-stone-700 transition hover:bg-stone-900/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800"
            >
              ×
            </button>

            <header className="relative z-[1] mb-7 border-b border-stone-800/25 pb-5 text-center">
              <img src="/favicon.jpg" alt="" aria-hidden="true" className="mx-auto mb-3 h-14 w-14 rounded-full border-2 border-amber-900/30 object-cover shadow-md" />
              <p className="text-[10px] font-bold uppercase tracking-[.28em] text-amber-950/70">GeoPoly · Command field manual</p>
              <h2 id="field-briefing-title" className="mt-2 font-serif text-3xl font-black tracking-wide sm:text-4xl">How to play</h2>
              <p className="mt-2 font-serif text-sm italic text-stone-700">Dispatch No. 01 · Read before deployment</p>
            </header>

            <div className="field-briefing-copy relative z-[1] space-y-5 font-serif text-sm leading-7 sm:text-base">
              <section>
                <h3 className="font-sans text-xs font-black uppercase tracking-[.16em] text-amber-950">01 · Choose your nation</h3>
                <p className="mt-1">Begin a campaign, choose a commander name, then select one of the ten playable African nations. Nine rival commanders will contest the map. Your starting soldiers are determined by your country’s population.</p>
              </section>
              <section>
                <h3 className="font-sans text-xs font-black uppercase tracking-[.16em] text-amber-950">02 · Take your turn</h3>
                <p className="mt-1">The first commander is chosen at random. On your turn, launch one attack or end your turn. In later rounds, receive two soldiers for every country you control and allocate them as you choose. You may also transfer troops between your countries, leaving at least one behind.</p>
              </section>
              <section>
                <h3 className="font-sans text-xs font-black uppercase tracking-[.16em] text-amber-950">03 · Fight and conquer</h3>
                <p className="mt-1">Choose a rival country to attack. You need at least two soldiers and must leave one at home. The smaller fighting force sets how many dice each side rolls. Compare paired rolls: the higher roll defeats one opposing soldier, while ties cause no loss. Continue the attack, or stop and end your turn; the attack also ends if you can no longer continue.</p>
              </section>
              <section className="border-t border-stone-800/20 pt-4">
                <h3 className="font-sans text-xs font-black uppercase tracking-[.16em] text-amber-950">Victory condition</h3>
                <p className="mt-1">Capture all ten countries to win. Watch the battle log and commander intel as the campaign unfolds; fast-forward speeds up NPC turns while keeping their actions visible.</p>
              </section>
            </div>

            <footer className="relative z-[1] mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-stone-800/25 pt-4">
              <span className="font-sans text-[9px] font-bold uppercase tracking-[.2em] text-stone-700/70">GeoPoly · field dispatch</span>
              <button
                type="button"
                onClick={() => setIsBriefingOpen(false)}
                className="rounded-lg border border-amber-950/30 bg-amber-950/10 px-4 py-2 font-sans text-xs font-bold uppercase tracking-wide text-amber-950 transition hover:bg-amber-950/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800"
              >
                Close briefing
              </button>
            </footer>
          </article>
        </div>
      )}
    </main>
  );
}
