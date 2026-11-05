import { useRef, useState } from 'react';
import WorldMap from './WorldMap';
import PlayerProfileMenu from './PlayerProfileMenu';
import RegionModal from './RegionModal';
import TransferModal from './TransferModal';
import GameSettings from './GameSettings';
import LiveComments from './LiveComments';

function getLogTone(type) {
  if (type === 'COMBAT') return 'text-amber-200';
  if (type === 'NPC_JUSTIFICATION') return 'text-cyan-100';
  return 'text-slate-200';
}

export default function FullMapDashboard({
  board,
  campaignRegion,
  sessionId,
  currentTurn,
  currentRound,
  playerOwnerName,
  logs,
  onAdvanceTurn,
  fastForward,
  setFastForward,
  attackerCountry,
  setAttackerCountry,
  defenderCountry,
  setDefenderCountry,
  setActiveCombat,
  onTransferSoldiers,
  conquestAnimation,
  isGuest,
  accountLabel,
  user,
  onOpenProfile,
  onSignOut,
  onLeaveGuest,
  musicEnabled,
  soundEnabled,
  hapticsEnabled,
  onToggleMusic,
  onToggleSound,
  onToggleHaptics,
  themeMode,
  musicVolume,
  onMusicVolumeChange,
  sfxVolume,
  onSfxVolumeChange
}) {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryActionsOpen, setCountryActionsOpen] = useState(false);
  const [transferSource, setTransferSource] = useState(null);
  const [activeNavigation, setActiveNavigation] = useState('map');
  const hapticsAvailable = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  const mapRef = useRef(null);
  const logsRef = useRef(null);
  const intelRef = useRef(null);
  const statsRef = useRef(null);
  const playerCountries = board.filter(country => country.owner === playerOwnerName);
  const campaignStats = {
    territories: playerCountries.length,
    troops: playerCountries.reduce((total, country) => total + country.soldiers, 0),
    round: currentRound
  };
  const ownerStats = Object.values(board.reduce((stats, country) => {
    const owner = country.owner;
    if (!stats[owner]) stats[owner] = { owner, territories: 0, troops: 0 };
    stats[owner].territories += 1;
    stats[owner].troops += country.soldiers;
    return stats;
  }, {})).sort((first, second) => {
    if (first.owner === playerOwnerName) return -1;
    if (second.owner === playerOwnerName) return 1;
    return first.owner.localeCompare(second.owner);
  });
  const intelLogs = logs.filter(log => log.type === 'NPC_JUSTIFICATION' || log.type === 'COMBAT');

  const navigateTo = (name, ref) => {
    setActiveNavigation(name);
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleStartCampaign = (actionType, country) => {
    if (actionType === 'SELECT_ATTACKER') {
      setAttackerCountry(country);
      setDefenderCountry(null);
    } else if (actionType === 'LAUNCH_CAMPAIGN') {
      if (
        currentTurn !== playerOwnerName
        || !attackerCountry
        || attackerCountry.owner !== playerOwnerName
        || attackerCountry.soldiers < 2
        || country.owner === playerOwnerName
      ) return;
      setDefenderCountry(country);
      setActiveCombat(true);
    }
    setSelectedCountry(null);
    setCountryActionsOpen(false);
  };
  const selectCountry = country => {
    if (!country) {
      setSelectedCountry(null);
      setCountryActionsOpen(false);
      return;
    }

    if (country.owner !== playerOwnerName && currentTurn === playerOwnerName) {
      if (playerCountries.length === 1 && playerCountries[0].soldiers >= 2) {
        setAttackerCountry(playerCountries[0]);
        setDefenderCountry(country);
        setActiveCombat(true);
        setSelectedCountry(null);
        setCountryActionsOpen(false);
        return;
      }

      setAttackerCountry(null);
    }

    setSelectedCountry(country);
    setCountryActionsOpen(true);
  };

  return (
    <div data-theme={themeMode} className="campaign-dashboard battlefield-scene relative flex min-h-svh flex-col font-sans text-white lg:h-svh lg:min-h-0 lg:overflow-hidden">
      <header className="relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-slate-950/75 px-3 py-2.5 backdrop-blur-xl sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <img src="/favicon.jpg" alt="" aria-hidden="true" className="h-9 w-9 shrink-0 rounded-xl border border-amber-200/30 object-cover shadow-lg shadow-amber-500/20" />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-black tracking-[.12em] text-amber-100 sm:text-base">GeoPoly</h1>
            <p className="truncate text-[9px] uppercase tracking-[.16em] text-slate-400">{campaignRegion} theater</p>
          </div>
        </div>

        <div className="order-3 flex w-full flex-wrap items-center justify-center gap-1.5 sm:order-none sm:w-auto">
          <button type="button" aria-pressed={musicEnabled} onClick={onToggleMusic} className="rounded-lg border border-white/10 bg-slate-950/60 px-2.5 py-1.5 text-[10px] font-semibold text-slate-200 transition hover:border-amber-300/40 hover:text-amber-100">Music <span className={musicEnabled ? 'text-emerald-300' : 'text-slate-500'}>{musicEnabled ? 'On' : 'Off'}</span></button>
          <button type="button" aria-pressed={soundEnabled} onClick={onToggleSound} className="rounded-lg border border-white/10 bg-slate-950/60 px-2.5 py-1.5 text-[10px] font-semibold text-slate-200 transition hover:border-amber-300/40 hover:text-amber-100">Effects <span className={soundEnabled ? 'text-emerald-300' : 'text-slate-500'}>{soundEnabled ? 'On' : 'Off'}</span></button>
          <button type="button" aria-pressed={hapticsEnabled} onClick={onToggleHaptics} disabled={!hapticsAvailable} className="rounded-lg border border-white/10 bg-slate-950/60 px-2.5 py-1.5 text-[10px] font-semibold text-slate-200 transition hover:border-amber-300/40 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-50">Haptics <span className={hapticsEnabled ? 'text-emerald-300' : 'text-slate-500'}>{hapticsAvailable ? (hapticsEnabled ? 'On' : 'Off') : 'N/A'}</span></button>
          <GameSettings musicVolume={musicVolume} onMusicVolumeChange={onMusicVolumeChange} sfxVolume={sfxVolume} onSfxVolumeChange={onSfxVolumeChange} />
        </div>

        <div className="ml-auto flex items-center justify-end gap-2">
          <div className="hidden text-right sm:block">
            <span className="block text-[8px] font-bold uppercase tracking-[.16em] text-slate-500">Round</span>
            <strong className="font-mono text-sm text-white">{currentRound}</strong>
          </div>
          <span className={`max-w-40 truncate rounded-lg border px-2.5 py-1.5 text-[10px] font-bold ${
            currentTurn === playerOwnerName
              ? 'border-emerald-400/40 bg-emerald-950/55 text-emerald-200'
              : 'border-white/10 bg-slate-950/60 text-slate-200'
          }`}>{currentTurn === playerOwnerName ? 'YOUR TURN' : 'ACTIVE'}: {currentTurn}</span>
          <PlayerProfileMenu
            user={user}
            isGuest={isGuest}
            accountLabel={accountLabel}
            campaignStats={campaignStats}
            onOpenProfile={onOpenProfile}
            onSignOut={onSignOut}
            onLeaveGuest={onLeaveGuest}
          />
        </div>
      </header>

      <main className="campaign-dashboard-grid relative z-10 grid flex-1 gap-2.5 p-2.5 lg:min-h-0 lg:grid-cols-[minmax(225px,0.82fr)_minmax(390px,1.8fr)_minmax(220px,0.82fr)] lg:overflow-hidden">
        <aside ref={logsRef} className="flex min-h-64 flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950/70 p-3 shadow-2xl backdrop-blur-xl lg:min-h-0">
          <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
            <h2 className="text-[11px] font-black uppercase tracking-[.14em] text-amber-100">Battle logs</h2>
            <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-1 font-mono text-[9px] text-slate-400">{logs.length} EVENTS</span>
          </div>
          <div aria-live="polite" className="campaign-log-list min-h-32 flex-1 space-y-1.5 overflow-y-auto pr-1">
            {[...logs].reverse().map((log, index) => (
              <article key={`${log.time}-${index}`} className="rounded-lg border border-white/[.07] bg-slate-950/55 p-2">
                <time className="mb-0.5 block font-mono text-[8px] text-slate-500">{log.time}</time>
                <p className={`text-[10px] leading-relaxed ${getLogTone(log.type)}`}>{log.text}</p>
              </article>
            ))}
            {!logs.length && <p className="rounded-lg bg-white/5 p-3 text-[10px] text-slate-400">Campaign events will appear here.</p>}
          </div>
          <div className="mt-2 shrink-0 border-t border-white/10 pt-2">
            <LiveComments sessionId={sessionId} watcherName={accountLabel} canComment={Boolean(accountLabel)} />
          </div>
        </aside>

        <section ref={mapRef} className="flex min-w-0 flex-col gap-2 lg:min-h-0">
          <WorldMap
            board={board}
            regionFilter={campaignRegion}
            attackerCountry={attackerCountry}
            defenderCountry={defenderCountry}
            onCountryClick={selectCountry}
            selectedCountryId={selectedCountry?.id}
            onCountryAction={selectCountry}
            playerOwnerName={playerOwnerName}
            conquestAnimation={conquestAnimation}
            interactive
            large
          />
          <div aria-label="Campaign countries" className="campaign-country-list grid max-h-36 grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3 lg:max-h-[7.1rem] lg:grid-cols-5">
            {board.map(country => {
              const isAttacker = attackerCountry?.id === country.id;
              const isDefender = defenderCountry?.id === country.id;
              const isPlayer = country.owner === playerOwnerName;
              return (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => selectCountry(country)}
                  aria-label={`${country.name}, ${country.owner}, ${country.soldiers} troops`}
                  className={`min-w-0 rounded-lg border px-2 py-1.5 text-left transition hover:bg-white/10 ${
                    isAttacker
                      ? 'border-amber-300/70 bg-amber-400/15'
                      : isDefender
                        ? 'border-rose-300/70 bg-rose-400/15'
                        : isPlayer
                          ? 'border-emerald-300/40 bg-emerald-950/45'
                          : 'border-white/10 bg-slate-950/65'
                  }`}
                >
                  <span className="flex items-center justify-between gap-1">
                    <span className="truncate text-[9px] font-bold text-slate-100"><span className="mr-1">{country.flag}</span>{country.name}</span>
                    <span className="shrink-0 font-mono text-[8px] text-amber-200">{country.soldiers} 🪖</span>
                  </span>
                  <span className={`mt-0.5 block truncate text-[8px] ${isPlayer ? 'text-emerald-300' : 'text-slate-500'}`}>{isPlayer ? 'YOUR NATION' : country.owner}</span>
                </button>
              );
            })}
          </div>
        </section>

        <aside ref={intelRef} className="flex min-h-48 flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950/70 p-3 shadow-2xl backdrop-blur-xl lg:min-h-0">
          <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
            <h2 className="text-[11px] font-black uppercase tracking-[.14em] text-amber-100">AI commentary</h2>
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-emerald-200"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />Live intel</span>
          </div>
          <div aria-live="polite" className="min-h-28 flex-1 space-y-2 overflow-y-auto pr-1">
            {intelLogs.map((log, index) => (
              <article key={`${log.time}-${index}`} className="rounded-xl border border-white/10 bg-slate-950/60 p-2.5">
                <span className="mb-1 block text-[8px] font-black uppercase tracking-[.14em] text-amber-300">{log.type === 'COMBAT' ? 'Conflict alert' : 'Strategic shift'}</span>
                <p className="text-[10px] leading-relaxed text-slate-200">{log.text}</p>
                <time className="mt-1 block font-mono text-[8px] text-slate-500">{log.time}</time>
              </article>
            ))}
            {!intelLogs.length && <p className="rounded-xl border border-white/10 bg-slate-950/50 p-3 text-[10px] leading-relaxed text-slate-400">Command decisions and battle reports will appear here as the campaign unfolds.</p>}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-white/10 pt-2">
            <div className="rounded-lg bg-white/[.04] p-2">
              <span className="block text-[8px] uppercase tracking-wider text-slate-500">Campaign</span>
              <strong className="mt-0.5 block truncate text-[10px] text-slate-200">{campaignRegion}</strong>
            </div>
            <div className="rounded-lg bg-white/[.04] p-2">
              <span className="block text-[8px] uppercase tracking-wider text-slate-500">Opponents</span>
              <strong className="mt-0.5 block text-[10px] text-slate-200">{Math.max(0, board.length - 1)} AI nations</strong>
            </div>
          </div>
        </aside>
      </main>

      <footer className="relative z-20 shrink-0 border-t border-white/10 bg-slate-950/85 px-2.5 py-2 backdrop-blur-xl sm:px-4">
        <div ref={statsRef} aria-label="Campaign standings" className="mx-auto mb-2 flex max-w-[1800px] gap-1.5 overflow-x-auto pb-1">
          {ownerStats.map(({ owner, territories, troops }) => (
            <div
              key={owner}
              className={`flex min-w-[92px] items-center justify-between gap-2 rounded-lg border px-2 py-1.5 ${
                owner === playerOwnerName ? 'border-emerald-300/45 bg-emerald-950/60' : 'border-white/10 bg-slate-900/80'
              }`}
            >
              <span className="min-w-0">
                <span className={`block truncate text-[8px] font-black uppercase tracking-wider ${owner === playerOwnerName ? 'text-emerald-200' : 'text-slate-300'}`}>{owner === playerOwnerName ? 'You' : owner}</span>
                <span className="block text-[8px] text-slate-500">{territories} territories</span>
              </span>
              <strong className="shrink-0 font-mono text-[9px] text-amber-200">{troops} 🪖</strong>
            </div>
          ))}
        </div>
        <nav aria-label="Campaign navigation" className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'map', label: 'Command map', ref: mapRef, icon: '⌖' },
              { id: 'logs', label: 'Battle log', ref: logsRef, icon: '▤' },
              { id: 'intel', label: 'AI intel', ref: intelRef, icon: '◉' },
              { id: 'stats', label: 'Stats', ref: statsRef, icon: '▥' }
            ].map(item => (
              <button
                key={item.id}
                type="button"
                aria-pressed={activeNavigation === item.id}
                onClick={() => navigateTo(item.id, item.ref)}
                className={`rounded-lg border px-2.5 py-1.5 text-[9px] font-bold transition sm:text-[10px] ${
                  activeNavigation === item.id
                    ? 'border-amber-300/35 bg-amber-400/15 text-amber-100'
                    : 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white'
                }`}
              ><span aria-hidden="true" className="mr-1">{item.icon}</span>{item.label}</button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button type="button" aria-pressed={fastForward} onClick={() => setFastForward(!fastForward)} className={`rounded-lg border px-2.5 py-1.5 text-[9px] font-bold transition sm:text-[10px] ${fastForward ? 'border-amber-300 bg-amber-400 text-slate-950' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>{fastForward ? '⏩ Fast-forward on' : '⏩ Fast-forward'}</button>
            {currentTurn === playerOwnerName && (
              <button type="button" onClick={onAdvanceTurn} className="rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1.5 text-[9px] font-extrabold text-slate-950 transition hover:from-emerald-400 hover:to-emerald-500 sm:text-[10px]">End turn</button>
            )}
          </div>
        </nav>
      </footer>

      {countryActionsOpen && selectedCountry && (
        <RegionModal
          country={selectedCountry}
          isPlayerTurn={currentTurn === playerOwnerName}
          playerOwnerName={playerOwnerName}
          attackerCountry={attackerCountry}
          playerCountries={playerCountries}
          onSelectAttacker={setAttackerCountry}
          onStartCampaign={handleStartCampaign}
          onStartTransfer={country => {
            setTransferSource(country);
            setCountryActionsOpen(false);
          }}
          onClose={() => setCountryActionsOpen(false)}
        />
      )}
      {transferSource && (
        <TransferModal
          source={transferSource}
          board={board}
          playerOwnerName={playerOwnerName}
          onConfirm={(sourceId, destinationId, amount) => {
            onTransferSoldiers(sourceId, destinationId, amount);
            setTransferSource(null);
            setSelectedCountry(null);
          }}
          onClose={() => setTransferSource(null)}
        />
      )}
    </div>
  );
}
