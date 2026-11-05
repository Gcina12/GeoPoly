import { useCallback, useMemo, useRef, useState } from 'react';
import { executeDiceRoll, calculateConquerBonus, estimateConquestChance } from '../utils/combatEngine';
import Dice3DCanvas from './Dice3DCanvas';
import Battlefield3D from './Battlefield3D';

const BURST_PARTICLES = Array.from({ length: 18 }, (_, index) => {
  const angle = (index / 18) * Math.PI * 2;
  const distance = 55 + (index % 3) * 18;

  return {
    x: `${Math.cos(angle) * distance}px`,
    y: `${Math.sin(angle) * distance}px`,
    delay: `${(index % 5) * 25}ms`
  };
});

export default function CombatModal({ attacker, defender, campaignRegion = 'Global', onBattleComplete }) {
  const [attSoldiers, setAttSoldiers] = useState(attacker.soldiers);
  const [defSoldiers, setDefSoldiers] = useState(defender.soldiers);
  const [lastRoll, setLastRoll] = useState(null);
  const [battleLogs, setBattleLogs] = useState([]);
  const [isConquered, setIsConquered] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [battleRound, setBattleRound] = useState(0);
  const [casualtyEvent, setCasualtyEvent] = useState(null);
  const [conquestGarrison, setConquestGarrison] = useState(1);
  const pendingRollRef = useRef(null);
  const settledDiceRef = useRef(0);
  const estimatedWinChance = useMemo(
    () => estimateConquestChance(attSoldiers, defSoldiers),
    [attSoldiers, defSoldiers]
  );

  const handleDieSettled = useCallback(() => {
    settledDiceRef.current += 1;
    if (settledDiceRef.current < 2) return;

    const pendingRoll = pendingRollRef.current;
    if (!pendingRoll) return;

    pendingRollRef.current = null;
    const newAttCount = attSoldiers - pendingRoll.attackerLosses;
    const newDefCount = defSoldiers - pendingRoll.defenderLosses;
    setCasualtyEvent({
      id: `${Date.now()}-${settledDiceRef.current}`,
      attackerLosses: pendingRoll.attackerLosses,
      defenderLosses: pendingRoll.defenderLosses
    });
    setBattleRound(round => round + 1);
    setAttSoldiers(newAttCount);
    setDefSoldiers(newDefCount);

    const logEntry = `Rolled [${pendingRoll.attackerRolls.join(', ')}] vs [${pendingRoll.defenderRolls.join(', ')}]. Attacker lost ${pendingRoll.attackerLosses}, Defender lost ${pendingRoll.defenderLosses}.`;
    setBattleLogs(previous => [logEntry, ...previous]);

    if (newDefCount <= 0) {
      setIsConquered(true);
      setConquestGarrison(1);
      const bonus = calculateConquerBonus(defender.originalValue);
      setBattleLogs(previous => [
        `🎉 Victory! ${attacker.name} conquered ${defender.name} and gained ${bonus} bonus soldiers!`,
        ...previous
      ]);
    }

    setIsRolling(false);
  }, [attSoldiers, defSoldiers, attacker.name, defender.name, defender.originalValue]);

  const handleRollDice = () => {
    if (isRolling || pendingRollRef.current) return;

    const result = executeDiceRoll(attSoldiers, defSoldiers);
    if (!result) return;

    settledDiceRef.current = 0;
    pendingRollRef.current = result;
    setLastRoll(result);
    setIsRolling(true);
  };

  const handleFinishConquest = () => {
    const bonus = calculateConquerBonus(defender.originalValue);
    const totalAvailableSoldiers = attSoldiers + bonus;
    onBattleComplete({
      conquered: true,
      attackerId: attacker.id,
      defenderId: defender.id,
      finalAttackerSoldiers: totalAvailableSoldiers - conquestGarrison,
      finalDefenderSoldiers: conquestGarrison
    });
  };

  const handleStopAttack = () => {
    onBattleComplete({
      conquered: false,
      attackerId: attacker.id,
      defenderId: defender.id,
      finalAttackerSoldiers: attSoldiers,
      finalDefenderSoldiers: defSoldiers
    });
  };

  const phaseLabel = isConquered
    ? 'TERRITORY SECURED'
    : isRolling
      ? 'DICE RESOLUTION'
      : battleRound === 0
        ? 'ENGAGEMENT READY'
        : 'NEXT ROUND READY';
  const attackerStrength = Math.max(0, Math.min(100, (attSoldiers / attacker.soldiers) * 100));
  const defenderStrength = Math.max(0, Math.min(100, (defSoldiers / defender.soldiers) * 100));
  const conquestBonus = calculateConquerBonus(defender.originalValue);
  const totalConquestSoldiers = attSoldiers + conquestBonus;

  return (
    <div className="combat-arena fixed inset-0 z-[70] overflow-y-auto text-white">
      <div className="combat-arena-shade absolute inset-0" aria-hidden="true" />
      <div className="combat-arena-content relative mx-auto flex min-h-[100svh] w-full max-w-[1800px] flex-col gap-3 p-3 sm:p-5">
        <header className="combat-arena-header flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-white/20 bg-slate-950/65 px-4 py-3 shadow-xl backdrop-blur-xl sm:px-6">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[.24em] text-amber-200 sm:text-[10px]">
              Global conflict · {campaignRegion} theater
            </p>
            <h2 className="mt-0.5 truncate text-lg font-black uppercase tracking-wide text-white drop-shadow sm:text-2xl">
              Tactical clash
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="hidden text-right sm:block">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Engagement round</span>
              <strong className="font-mono text-lg text-amber-100">{String(battleRound + 1).padStart(2, '0')}</strong>
            </div>
            <div
              aria-live="polite"
              className={`rounded-xl border px-3 py-2 text-[9px] font-black uppercase tracking-wider sm:text-[10px] ${
                isConquered
                  ? 'border-emerald-300/40 bg-emerald-950/75 text-emerald-200'
                  : isRolling
                    ? 'border-cyan-300/40 bg-cyan-950/75 text-cyan-100'
                    : 'border-amber-300/35 bg-amber-950/70 text-amber-100'
              }`}
            >
              {phaseLabel}
            </div>
          </div>
        </header>

        <main className="combat-arena-grid grid flex-1 gap-3 lg:min-h-0 lg:grid-cols-[minmax(210px,270px)_minmax(0,1fr)_minmax(210px,270px)]">
          <section aria-label={`${attacker.name} attacking force`} className="combat-force-panel combat-attacker-panel rounded-2xl border border-cyan-300/40 bg-slate-950/70 p-4 shadow-[0_12px_42px_rgba(0,0,0,.4)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-2 border-b border-cyan-200/20 pb-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-200">Attacker battalion</p>
                <h3 className="mt-1 truncate text-sm font-bold text-white">{attacker.name}</h3>
              </div>
              <span className="text-3xl drop-shadow" aria-hidden="true">{attacker.flag}</span>
            </div>
            <div className="combat-force-count py-4 text-center">
              <strong className="block font-mono text-4xl font-black tabular-nums text-cyan-100 sm:text-5xl">{attSoldiers.toLocaleString()}</strong>
              <span className="text-[10px] font-semibold uppercase tracking-[.17em] text-slate-300">troops in the field</span>
              <div className="combat-force-dice mt-2">
                <span className="block text-[8px] font-black uppercase tracking-[.16em] text-orange-200">Attacker dice</span>
                {lastRoll ? (
                  <>
                    <Dice3DCanvas rolls={lastRoll.attackerRolls} isAttacker onSettled={handleDieSettled} />
                    <span className="inline-block rounded-full border border-orange-200/30 bg-slate-950/80 px-2.5 py-1 font-mono text-xs font-black text-orange-100">
                      {lastRoll.attackerRolls.join(' · ')}
                    </span>
                  </>
                ) : (
                  <div className="combat-dice-resting">Roll to reveal</div>
                )}
              </div>
            </div>
            <div className="space-y-2 rounded-xl border border-white/10 bg-black/25 p-3">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold uppercase tracking-wide text-slate-300">Strength remaining</span>
                <span className="font-mono font-bold text-cyan-100">{attackerStrength.toFixed(0)}%</span>
              </div>
              <div
                role="progressbar"
                aria-label={`${attacker.name} troop strength`}
                aria-valuenow={Math.round(attackerStrength)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 overflow-hidden rounded-full bg-slate-900"
              >
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-300 shadow-[0_0_12px_rgba(34,211,238,.5)] transition-[width] duration-500" style={{ width: `${attackerStrength}%` }} />
              </div>
              <p className="text-[9px] leading-4 text-slate-400">Opening force: {attacker.soldiers.toLocaleString()} · On-screen unit models: {Math.min(attSoldiers, 12)}</p>
            </div>
            <div className="mt-3 rounded-xl border border-cyan-200/15 bg-cyan-950/25 p-3">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-cyan-200/80">Estimated chance to win</span>
              <span className="mt-1 block font-mono text-2xl font-black text-cyan-100">{(estimatedWinChance * 100).toFixed(1)}%</span>
              <span className="text-[9px] text-slate-400">Based on current forces</span>
            </div>
          </section>

          <section aria-label="Battlefield and dice" className="combat-stage-panel flex min-h-[440px] min-w-0 flex-col overflow-hidden rounded-2xl border border-white/20 bg-slate-950/45 shadow-2xl backdrop-blur-xl lg:min-h-0">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-slate-950/55 px-3 py-2">
              <span className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-200 sm:text-[10px]">⚔ {attacker.name} advances</span>
              <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-amber-100 sm:text-[10px]">
                {isRolling ? 'Resolving combat' : 'Front line'}
              </span>
              <span className="text-right text-[9px] font-black uppercase tracking-[.16em] text-rose-200 sm:text-[10px]">{defender.name} holds ⚔</span>
            </div>

            <div className="combat-battlefield relative min-h-[260px] flex-1">
              <Battlefield3D
                attacker={attacker}
                defender={defender}
                attackerCount={attSoldiers}
                defenderCount={defSoldiers}
                casualtyEvent={casualtyEvent}
              />
            </div>

            <div className="combat-log shrink-0 border-t border-white/15 bg-slate-950/80 px-3 py-2 sm:px-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-[.18em] text-amber-100">Battle log</span>
                {lastRoll && <span className="text-[9px] text-slate-400">Dice comparisons: {lastRoll.matchResults.length}</span>}
              </div>
              <div aria-live="polite" className="max-h-16 space-y-1 overflow-y-auto font-mono text-[10px] leading-4 text-slate-200">
                {battleLogs.length
                  ? battleLogs.slice(0, 4).map((log, index) => <p key={`${index}-${log}`}>{log}</p>)
                  : <p className="text-slate-400">Awaiting first dice roll. Choose “Roll combat dice” to resolve the clash.</p>}
              </div>
            </div>
          </section>

          <section aria-label={`${defender.name} defending force`} className="combat-force-panel combat-defender-panel rounded-2xl border border-rose-300/40 bg-slate-950/70 p-4 shadow-[0_12px_42px_rgba(0,0,0,.4)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-2 border-b border-rose-200/20 pb-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.2em] text-rose-200">Defender battalion</p>
                <h3 className="mt-1 truncate text-sm font-bold text-white">{defender.name}</h3>
              </div>
              <span className="text-3xl drop-shadow" aria-hidden="true">{defender.flag}</span>
            </div>
            <div className="combat-force-count py-4 text-center">
              <strong className="block font-mono text-4xl font-black tabular-nums text-rose-100 sm:text-5xl">{defSoldiers.toLocaleString()}</strong>
              <span className="text-[10px] font-semibold uppercase tracking-[.17em] text-slate-300">troops defending</span>
              <div className="combat-force-dice mt-2">
                <span className="block text-[8px] font-black uppercase tracking-[.16em] text-cyan-200">Defender dice</span>
                {lastRoll ? (
                  <>
                    <Dice3DCanvas rolls={lastRoll.defenderRolls} isAttacker={false} onSettled={handleDieSettled} />
                    <span className="inline-block rounded-full border border-cyan-200/30 bg-slate-950/80 px-2.5 py-1 font-mono text-xs font-black text-cyan-100">
                      {lastRoll.defenderRolls.join(' · ')}
                    </span>
                  </>
                ) : (
                  <div className="combat-dice-resting">Roll to reveal</div>
                )}
              </div>
            </div>
            <div className="space-y-2 rounded-xl border border-white/10 bg-black/25 p-3">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold uppercase tracking-wide text-slate-300">Strength remaining</span>
                <span className="font-mono font-bold text-rose-100">{defenderStrength.toFixed(0)}%</span>
              </div>
              <div
                role="progressbar"
                aria-label={`${defender.name} troop strength`}
                aria-valuenow={Math.round(defenderStrength)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 overflow-hidden rounded-full bg-slate-900"
              >
                <div className="h-full rounded-full bg-gradient-to-r from-rose-700 to-rose-300 shadow-[0_0_12px_rgba(251,113,133,.5)] transition-[width] duration-500" style={{ width: `${defenderStrength}%` }} />
              </div>
              <p className="text-[9px] leading-4 text-slate-400">Opening force: {defender.soldiers.toLocaleString()} · On-screen unit models: {Math.min(defSoldiers, 12)}</p>
            </div>
            <div className="mt-3 rounded-xl border border-rose-200/15 bg-rose-950/25 p-3">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-rose-200/80">Estimated chance to hold</span>
              <span className="mt-1 block font-mono text-2xl font-black text-rose-100">{((1 - estimatedWinChance) * 100).toFixed(1)}%</span>
              <span className="text-[9px] text-slate-400">Based on current forces</span>
            </div>
          </section>
        </main>

        <footer className="combat-arena-footer grid shrink-0 gap-2 rounded-2xl border border-white/15 bg-slate-950/75 p-3 shadow-xl backdrop-blur-xl sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:px-5">
          <div className="hidden min-w-0 sm:block">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Round {battleRound + 1}</span>
            <span className="truncate text-xs font-semibold text-slate-200">
              {attacker.name} <span className="text-amber-200">vs</span> {defender.name}
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {!isConquered && attSoldiers > 1 && defSoldiers > 0 && (
              <button
                type="button"
                onClick={handleRollDice}
                disabled={isRolling}
                className="min-w-48 cursor-pointer rounded-xl border border-amber-200/65 bg-gradient-to-b from-amber-400/35 to-orange-700/35 px-7 py-3 text-sm font-black uppercase tracking-wide text-amber-50 shadow-[0_0_25px_rgba(245,158,11,.2)] transition hover:from-amber-300/45 hover:to-orange-600/45 active:scale-[.98] disabled:cursor-wait disabled:opacity-70"
              >
                {isRolling ? '🎲 Resolving dice…' : battleRound === 0 ? '🎲 Roll combat dice' : '🎲 Roll next round'}
              </button>
            )}
            {isConquered && (
              <>
                <label className="flex min-w-56 flex-col gap-1 rounded-xl border border-emerald-200/25 bg-emerald-950/35 px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-emerald-100">
                  <span className="flex items-center justify-between gap-3">
                    <span>Garrison new territory</span>
                    <span className="font-mono text-sm text-white">{conquestGarrison}</span>
                  </span>
                  <input
                    type="range"
                    min="1"
                    max={Math.max(1, totalConquestSoldiers - 1)}
                    value={Math.min(conquestGarrison, Math.max(1, totalConquestSoldiers - 1))}
                    onChange={event => setConquestGarrison(Number(event.target.value))}
                    aria-label="Soldiers to transfer into conquered territory"
                    className="accent-emerald-300"
                  />
                  <span className="font-normal normal-case tracking-normal text-emerald-100/70">
                    {conquestBonus} conquest bonus · leave at least 1 at {attacker.name}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleFinishConquest}
                  className="min-w-48 cursor-pointer rounded-xl border border-emerald-200/60 bg-emerald-500/25 px-7 py-3 text-sm font-black uppercase tracking-wide text-emerald-100 shadow-[0_0_24px_rgba(16,185,129,.2)] transition hover:bg-emerald-400/35 active:scale-[.98]"
                >
                  Claim territory
                </button>
              </>
            )}
            {!isConquered && (
              <button
                type="button"
                onClick={handleStopAttack}
                disabled={isRolling}
                className="cursor-pointer rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-200 transition hover:bg-white/10 active:scale-[.98] disabled:cursor-wait disabled:opacity-50"
              >
                {attSoldiers <= 1 ? 'Retreat · no troops' : 'Retreat from battle'}
              </button>
            )}
          </div>
          <p className="hidden text-right text-[9px] leading-4 text-slate-400 sm:block">
            Each roll resolves a combat round.<br />Dice determine losses; strength odds are estimates.
          </p>
        </footer>

        {isConquered && (
          <div className="conquest-burst" aria-hidden="true">
            {BURST_PARTICLES.map((particle, index) => (
              <span
                key={index}
                className="conquest-spark"
                style={{
                  '--burst-x': particle.x,
                  '--burst-y': particle.y,
                  '--burst-delay': particle.delay
                }}
              />
            ))}
            <span className="conquest-emblem">✦</span>
          </div>
        )}
      </div>
    </div>
  );
}
