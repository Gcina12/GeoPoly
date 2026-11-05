import { useEffect, useRef, useState } from 'react';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query
} from 'firebase/firestore';
import { db } from '../config/firebase';
import WorldMap from './WorldMap';
import GameSettings from './GameSettings';
import LiveComments from './LiveComments';

function readWatcherName() {
  try {
    const savedName = window.localStorage.getItem('geopoly-watcher-name')?.trim() || '';
    return savedName.length >= 2 && savedName.length <= 24 ? savedName : '';
  } catch {
    return '';
  }
}

function getErrorMessage(error) {
  if (error.code === 'permission-denied') {
    return 'Live sessions are unavailable. Check that Firestore allows public read access to game_sessions.';
  }
  return error.message || 'Could not load live sessions.';
}

function getOwnerStats(board = []) {
  return Object.values(board.reduce((stats, country) => {
    if (!stats[country.owner]) {
      stats[country.owner] = { owner: country.owner, territories: 0, troops: 0 };
    }
    stats[country.owner].territories += 1;
    stats[country.owner].troops += country.soldiers;
    return stats;
  }, {})).sort((first, second) => second.territories - first.territories);
}

export default function SpectatorView({
  sessionId,
  onExit,
  musicVolume,
  onMusicVolumeChange,
  sfxVolume,
  onSfxVolumeChange
}) {
  const themeMode = 'dark';
  const [selectedSessionId, setSelectedSessionId] = useState(sessionId || null);
  const [sessions, setSessions] = useState([]);
  const [liveState, setLiveState] = useState(null);
  const [conquestAnimation, setConquestAnimation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [watcherName, setWatcherName] = useState(readWatcherName);
  const [watcherNameDraft, setWatcherNameDraft] = useState(readWatcherName);
  const [watcherNameError, setWatcherNameError] = useState('');
  const previousBoardRef = useRef(null);
  const previousConquestIdRef = useRef(null);
  const animationTimerRef = useRef(null);

  useEffect(() => {
    const source = selectedSessionId
      ? doc(db, 'game_sessions', selectedSessionId)
      : query(collection(db, 'game_sessions'), orderBy('updatedAt', 'desc'), limit(20));

    const unsubscribe = onSnapshot(
      source,
      snapshot => {
        if (selectedSessionId) {
          const nextState = snapshot.exists() ? snapshot.data() : null;
          const previousBoard = previousBoardRef.current;
          const conquest = nextState?.lastConquest;
          const capturedCountry = nextState?.board?.find(country => (
            previousBoard?.some(previous => previous.id === country.id && previous.owner !== country.owner)
          ));
          const changedConquest = conquest && conquest.id !== previousConquestIdRef.current
            ? conquest
            : null;
          const attackerId = changedConquest?.attackerId || (
            capturedCountry
              ? previousBoard?.find(country => country.owner === capturedCountry.owner && country.id !== capturedCountry.id)?.id
              : null
          );
          const defenderId = changedConquest?.defenderId || capturedCountry?.id;

          if (attackerId && defenderId) {
            const animationId = changedConquest?.id || `${Date.now()}-${defenderId}`;
            setConquestAnimation({ id: animationId, attackerId, defenderId });
            window.clearTimeout(animationTimerRef.current);
            animationTimerRef.current = window.setTimeout(() => setConquestAnimation(null), 1800);
          }

          previousBoardRef.current = nextState?.board || null;
          previousConquestIdRef.current = conquest?.id || null;
          setLiveState(nextState);
        } else {
          setSessions(snapshot.docs.map(session => ({
            id: session.id,
            ...session.data()
          })));
        }
        setError('');
        setLoading(false);
      },
      snapshotError => {
        setError(getErrorMessage(snapshotError));
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [selectedSessionId]);

  useEffect(() => () => window.clearTimeout(animationTimerRef.current), []);

  const handleBackToSessions = () => {
    previousBoardRef.current = null;
    previousConquestIdRef.current = null;
    setConquestAnimation(null);
    setLiveState(null);
    setSelectedSessionId(null);
    setLoading(true);
    setError('');
  };

  const selectSession = id => {
    previousBoardRef.current = null;
    previousConquestIdRef.current = null;
    setConquestAnimation(null);
    setLiveState(null);
    setSelectedSessionId(id);
    setLoading(true);
    setError('');
  };

  const handleWatcherNameSubmit = event => {
    event.preventDefault();
    const nextName = watcherNameDraft.trim();
    if (nextName.length < 2 || nextName.length > 24) {
      setWatcherNameError('Choose a name between 2 and 24 characters.');
      return;
    }

    try {
      window.localStorage.setItem('geopoly-watcher-name', nextName);
      setWatcherNameError('');
    } catch (storageError) {
      console.error('Could not remember the spectator name in this browser:', storageError);
      setWatcherNameError('This browser could not save your name. You can still watch and comment this time.');
    }
    setWatcherName(nextName);
  };

  const handleChangeWatcherName = () => {
    try {
      window.localStorage.removeItem('geopoly-watcher-name');
    } catch (storageError) {
      console.error('Could not clear the remembered spectator name:', storageError);
      setWatcherNameError('Could not clear the saved name. Check this browser’s privacy settings.');
      return;
    }
    setWatcherName('');
    setWatcherNameDraft('');
  };

  const ownerStats = getOwnerStats(liveState?.board);
  const commentary = (liveState?.logs || []).filter(log => (
    log.type === 'NPC_JUSTIFICATION' || log.type === 'COMBAT'
  ));
  const combatLogs = (liveState?.logs || []).filter(log => log.type === 'COMBAT');

  if (loading) {
    return (
      <div data-theme={themeMode} className="battlefield-scene flex min-h-screen items-center justify-center font-sans text-white">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          <p className="font-mono text-sm text-slate-400">Connecting to GeoPoly Live Feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-theme={themeMode} className="battlefield-scene min-h-screen p-3 font-sans text-white sm:p-6">
      <header className="mx-auto mb-5 flex max-w-[1800px] flex-wrap items-center justify-between gap-3">
        <div>
          <span className="rounded-full border border-emerald-500/40 bg-emerald-950/80 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-400">
            🔴 Live Spectator Mode
          </span>
          <h1 className="mt-2 bg-gradient-to-r from-cyan-300 via-sky-300 to-emerald-300 bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
            GeoPoly Live Command
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <GameSettings
            musicVolume={musicVolume}
            onMusicVolumeChange={onMusicVolumeChange}
            sfxVolume={sfxVolume}
            onSfxVolumeChange={onSfxVolumeChange}
          />
          <button
            type="button"
            onClick={onExit}
            className="cursor-pointer rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold transition hover:bg-white/20"
          >
            Exit Spectator
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1800px]">
        {error && (
          <p role="alert" className="mb-4 rounded-xl border border-rose-500/30 bg-rose-950/50 p-4 text-sm text-rose-200">
            {error}
          </p>
        )}

        {!watcherName && !error && (
          <section className="mx-auto max-w-xl rounded-3xl border border-white/30 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-2xl sm:p-8">
            <span className="mb-3 block text-4xl" aria-hidden="true">👀</span>
            <h2 className="mb-2 text-2xl font-black text-teal-100">Who’s watching?</h2>
            <p className="mb-5 text-sm text-slate-200">
              Choose the name that will appear beside your live comments. We’ll remember it on this browser.
            </p>
            <form onSubmit={handleWatcherNameSubmit} className="space-y-3">
              <label className="block">
                <span className="sr-only">Spectator name</span>
                <input
                  type="text"
                  autoComplete="nickname"
                  minLength={2}
                  maxLength={24}
                  required
                  value={watcherNameDraft}
                  onChange={event => setWatcherNameDraft(event.target.value.slice(0, 24))}
                  placeholder="Your spectator name (2–24 characters)"
                  className="w-full rounded-xl border border-white/25 bg-slate-950/50 p-3 text-sm text-white placeholder:text-slate-300 focus:border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-300/30"
                />
              </label>
              {watcherNameError && (
                <p role="status" className="rounded-xl border border-amber-300/30 bg-slate-950/40 p-3 text-xs text-amber-100">
                  {watcherNameError}
                </p>
              )}
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-teal-400 to-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:brightness-110"
              >
                Enter live spectator mode
              </button>
            </form>
          </section>
        )}

        {watcherName && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs text-slate-100 backdrop-blur-xl">
            <span>Watching as <strong className="text-teal-200">{watcherName}</strong></span>
            <button type="button" onClick={handleChangeWatcherName} className="cursor-pointer rounded-lg border border-white/20 px-2.5 py-1.5 font-semibold hover:bg-white/10">
              Change name
            </button>
          </div>
        )}
        {watcherName && watcherNameError && (
          <p role="status" className="mb-3 rounded-xl border border-amber-300/30 bg-slate-950/40 p-3 text-xs text-amber-100">
            {watcherNameError}
          </p>
        )}

        {watcherName && !selectedSessionId && !error && (
          <section className="space-y-3">
            <h2 className="inline-flex rounded-xl border border-white/50 bg-white/25 px-3 py-2 text-sm font-bold uppercase tracking-wider text-cyan-300 shadow-lg backdrop-blur-xl">
              Recent campaigns
            </h2>
            {sessions.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {sessions.map(session => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => selectSession(session.id)}
                    className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 text-left transition hover:border-cyan-400/50 hover:bg-white/15"
                  >
                    <span>
                      <strong className="block text-white">
                        {session.playerOwnerName || 'GeoPoly campaign'}
                      </strong>
                      <span className="text-xs text-slate-300">
                        Round {session.currentRound || 1} · {session.board?.length || 0} territories
                      </span>
                    </span>
                    <span className="shrink-0 rounded-lg bg-emerald-950/70 px-3 py-2 text-xs font-bold text-emerald-300">
                      Watch live →
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                No campaigns are available to spectate right now. Check back later.
              </p>
            )}
          </section>
        )}

        {watcherName && selectedSessionId && liveState && (
          <section aria-label="Live campaign dashboard">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBackToSessions}
                className="cursor-pointer rounded-xl border border-white/40 bg-white/25 px-3 py-2 text-sm font-semibold text-cyan-300 shadow-lg backdrop-blur-xl transition hover:bg-white/40 hover:text-cyan-100"
              >
                ← All campaigns
              </button>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs">
                  Round <strong>{liveState.currentRound || 1}</strong>
                </span>
                <span className="rounded-xl border border-emerald-400/30 bg-emerald-950/50 px-3 py-2 text-xs text-emerald-200">
                  Active turn: <strong>{liveState.currentTurn || 'Waiting'}</strong>
                </span>
                <span className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs">
                  {liveState.board?.length || 0} territories in play
                </span>
              </div>
            </div>

            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {ownerStats.map(({ owner, territories, troops }) => (
                <div
                  key={owner}
                  className={`flex min-w-40 items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                    owner === liveState.playerOwnerName
                      ? 'border-cyan-400/40 bg-cyan-950/40'
                      : 'border-white/10 bg-slate-900/70'
                  }`}
                >
                  <span className="min-w-0">
                    <span className={`block truncate text-xs font-bold ${
                      owner === liveState.playerOwnerName ? 'text-cyan-200' : 'text-slate-200'
                    }`}>{owner}</span>
                    <span className="text-[10px] text-slate-300">{territories} territories</span>
                  </span>
                  <span className="shrink-0 font-mono text-xs font-bold text-amber-300">{troops} 🪖</span>
                </div>
              ))}
            </div>

            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(20rem,0.8fr)]">
              <WorldMap
                board={liveState.board || []}
                regionFilter={liveState.campaignRegion || 'Africa'}
                attackerCountry={null}
                defenderCountry={null}
                onCountryClick={() => {}}
                playerOwnerName={liveState.playerOwnerName}
                conquestAnimation={conquestAnimation}
                interactive={false}
                large
              />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <section className="rounded-3xl border border-white/15 bg-slate-900/70 p-4 shadow-xl backdrop-blur-xl">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="text-sm font-extrabold uppercase tracking-wide text-cyan-300">🎙️ Live commentary</h2>
                    <span className="text-[10px] text-slate-300">{commentary.length} updates</span>
                  </div>
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1 xl:max-h-[32vh]">
                    {commentary.length ? commentary.map((log, index) => (
                      <article key={`${log.time}-${index}`} className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                        <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-300">
                          {log.type === 'COMBAT' ? 'Battle update' : 'Analyst feed'} · {log.time}
                        </span>
                        <p className={`text-xs leading-relaxed ${
                          log.type === 'COMBAT' ? 'font-semibold text-amber-200' : 'text-slate-100'
                        }`}>{log.text}</p>
                      </article>
                    )) : (
                      <p className="rounded-xl bg-slate-950/50 p-3 text-xs text-slate-300">
                        Commentary and turn updates will appear here as the campaign progresses.
                      </p>
                    )}
                  </div>
                </section>

                <section className="rounded-3xl border border-white/15 bg-slate-900/70 p-4 shadow-xl backdrop-blur-xl">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="text-sm font-extrabold uppercase tracking-wide text-amber-300">📜 Battle log</h2>
                    <span className="text-[10px] text-slate-300">{combatLogs.length} battles</span>
                  </div>
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1 xl:max-h-[32vh]">
                    {combatLogs.length ? combatLogs.map((log, index) => (
                      <article key={`${log.time}-${index}`} className="rounded-xl border border-amber-400/20 bg-amber-950/30 p-3">
                        <span className="mb-1 block text-[10px] font-semibold text-amber-300">{log.time}</span>
                        <p className="text-xs leading-relaxed text-amber-50">{log.text}</p>
                      </article>
                    )) : (
                      <p className="rounded-xl bg-slate-950/50 p-3 text-xs text-slate-300">
                        Battle outcomes will appear here as they are recorded.
                      </p>
                    )}
                  </div>
                </section>

                <LiveComments sessionId={selectedSessionId} watcherName={watcherName} canComment />
              </div>
            </div>
          </section>
        )}

        {watcherName && selectedSessionId && !liveState && !error && (
          <p className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center text-slate-300">
            This campaign is no longer available.
          </p>
        )}
      </main>
    </div>
  );
}
