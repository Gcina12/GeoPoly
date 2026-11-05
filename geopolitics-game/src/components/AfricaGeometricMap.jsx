import { useEffect, useRef, useState } from 'react';
import { AFRICA_BOUNDARIES } from '../data/africaBoundaries';

const MAP_WIDTH = 530;
const MAP_HEIGHT = 620;
const FULL_VIEW_BOX = `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
const BOUNDARIES_BY_ID = new Map(AFRICA_BOUNDARIES.map(country => [country.id, country]));
const BLAST_PARTICLES = Array.from({ length: 14 }, (_, index) => {
  const angle = (index / 14) * Math.PI * 2;
  const distance = 10 + (index % 3) * 2;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    delay: `${1.02 + (index % 4) * 0.035}s`
  };
});

function createMeshPath() {
  const columns = 21;
  const rows = 24;
  const cellWidth = MAP_WIDTH / columns;
  const cellHeight = MAP_HEIGHT / rows;
  const triangles = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const left = column * cellWidth;
      const top = row * cellHeight;
      const right = left + cellWidth;
      const bottom = top + cellHeight;
      const diagonal = (row + column) % 2 === 0;

      if (diagonal) {
        triangles.push(`M${left} ${top}L${right} ${top}L${right} ${bottom}Z`);
        triangles.push(`M${left} ${top}L${left} ${bottom}L${right} ${bottom}Z`);
      } else {
        triangles.push(`M${left} ${top}L${right} ${top}L${left} ${bottom}Z`);
        triangles.push(`M${right} ${top}L${left} ${bottom}L${right} ${bottom}Z`);
      }
    }
  }

  return triangles.join('');
}

const LOW_POLY_MESH = createMeshPath();

function getFocusViewBox(attackerId, defenderId, zoom) {
  const attacker = BOUNDARIES_BY_ID.get(attackerId);
  const defender = BOUNDARIES_BY_ID.get(defenderId);

  const centerX = attacker && defender
    ? (attacker.center[0] + defender.center[0]) / 2
    : MAP_WIDTH / 2;
  const centerY = attacker && defender
    ? (attacker.center[1] + defender.center[1]) / 2
    : MAP_HEIGHT / 2;
  const spanX = attacker && defender ? Math.abs(attacker.center[0] - defender.center[0]) : 0;
  const spanY = attacker && defender ? Math.abs(attacker.center[1] - defender.center[1]) : 0;
  const focusWidth = attacker && defender
    ? Math.max(150, spanX * 1.8 + 110, (spanY * 1.8 + 130) * MAP_WIDTH / MAP_HEIGHT)
    : MAP_WIDTH;
  const width = Math.min(MAP_WIDTH, Math.max(80, focusWidth / zoom));
  const height = width * MAP_HEIGHT / MAP_WIDTH;
  const x = Math.max(0, Math.min(MAP_WIDTH - width, centerX - width / 2));
  const y = Math.max(0, Math.min(MAP_HEIGHT - height, centerY - height / 2));

  return `${x} ${y} ${width} ${height}`;
}

function animateViewBox(fromViewBox, toViewBox, onUpdate) {
  const start = fromViewBox.split(' ').map(Number);
  const end = toViewBox.split(' ').map(Number);
  const duration = 650;
  let animationFrame;

  const animate = (now, startedAt = now) => {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    const next = start.map((value, index) => value + (end[index] - value) * eased);
    onUpdate(next.join(' '));

    if (progress < 1) {
      animationFrame = requestAnimationFrame(timestamp => animate(timestamp, startedAt));
    }
  };

  animationFrame = requestAnimationFrame(timestamp => animate(timestamp));
  return () => cancelAnimationFrame(animationFrame);
}

export default function AfricaGeometricMap({
  board,
  attackerCountry,
  defenderCountry,
  onCountryClick,
  playerOwnerName,
  conquestAnimation,
  themeMode = 'dark',
  interactive = true,
  large = false,
  viewportFit = false
}) {
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [viewBox, setViewBox] = useState(FULL_VIEW_BOX);
  const viewBoxRef = useRef(FULL_VIEW_BOX);
  const attackerId = attackerCountry?.id;
  const defenderId = defenderCountry?.id;
  const targetViewBox = getFocusViewBox(attackerId, defenderId, zoom);
  const conquestStart = conquestAnimation
    ? BOUNDARIES_BY_ID.get(conquestAnimation.attackerId)?.center
    : null;
  const conquestEnd = conquestAnimation
    ? BOUNDARIES_BY_ID.get(conquestAnimation.defenderId)?.center
    : null;
  const conquestPath = conquestStart && conquestEnd
    ? `M ${conquestStart[0]} ${conquestStart[1]} Q ${(conquestStart[0] + conquestEnd[0]) / 2} ${Math.min(conquestStart[1], conquestEnd[1]) - 38} ${conquestEnd[0]} ${conquestEnd[1]}`
    : null;

  useEffect(() => {
    if (viewBoxRef.current === targetViewBox) return undefined;

    return animateViewBox(viewBoxRef.current, targetViewBox, nextViewBox => {
      viewBoxRef.current = nextViewBox;
      setViewBox(nextViewBox);
    });
  }, [attackerId, defenderId, targetViewBox]);

  const playableCountries = new Map(board.map(country => [country.id, country]));
  const focusedIds = new Set([attackerCountry?.id, defenderCountry?.id].filter(Boolean));

  const handleCountryKeyDown = (event, country) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onCountryClick(country);
    }
  };

  return (
    <section
      data-theme={themeMode}
      className={`relative flex w-full flex-col justify-between overflow-hidden rounded-3xl border border-amber-500/20 bg-slate-950/75 p-4 shadow-2xl backdrop-blur-xl ${
        viewportFit ? 'h-[min(55vh,520px)] min-h-[340px]' : large ? 'h-[min(76vh,860px)] min-h-[580px]' : 'h-[520px]'
      }`}
    >
      <header className="relative z-10 flex min-h-7 items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400/90">
          <span aria-hidden="true">🌍</span>
          African Sovereign Map
        </span>
        {attackerCountry && (
          <span className="rounded-full border border-amber-500/40 bg-amber-950/80 px-3 py-1 text-right font-mono text-[11px] text-amber-300">
            ⚔️ {attackerCountry.name}{defenderCountry ? ` → ${defenderCountry.name}` : ' · Select a target'}
          </span>
        )}
      </header>

      <div className="relative my-auto flex h-full w-full items-center justify-center">
        <svg
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          className={`h-full w-full ${viewportFit ? 'max-h-[calc(55vh-100px)]' : large ? 'max-h-[calc(76vh-100px)]' : 'max-h-[440px]'}`}
          role="group"
          aria-label={interactive ? 'Interactive map of African countries' : 'Map of the live campaign territories'}
        >
          <defs>
            <linearGradient id="africaOcean" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={themeMode === 'light' ? '#38bdf8' : '#0b2132'} />
              <stop offset="55%" stopColor={themeMode === 'light' ? '#0ea5e9' : '#0a1a2a'} />
              <stop offset="100%" stopColor={themeMode === 'light' ? '#67e8f9' : '#101a30'} />
            </linearGradient>
            <pattern id="africaWaterTexture" width="96" height="72" patternUnits="userSpaceOnUse">
              <path
                d="M-12 22C4 15 20 29 36 22S68 15 84 22S116 29 132 22M-12 55C4 48 20 62 36 55S68 48 84 55S116 62 132 55"
                fill="none"
                stroke={themeMode === 'light' ? '#e0f2fe' : '#38bdf8'}
                strokeOpacity={themeMode === 'light' ? '.4' : '.12'}
                strokeWidth=".8"
              />
            </pattern>
            <linearGradient id="africaGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={themeMode === 'light' ? '#b7c98b' : '#b6bd8b'} />
              <stop offset="48%" stopColor={themeMode === 'light' ? '#8ca66d' : '#879164'} />
              <stop offset="100%" stopColor={themeMode === 'light' ? '#647b52' : '#596348'} />
            </linearGradient>
            <linearGradient id="africaUnassigned" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={themeMode === 'light' ? '#f5deb3' : '#d8c29a'} />
              <stop offset="100%" stopColor={themeMode === 'light' ? '#d9ad79' : '#a77c58'} />
            </linearGradient>
            <linearGradient id="africaPlayer" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={themeMode === 'light' ? '#67e8f9' : '#86efac'} />
              <stop offset="100%" stopColor={themeMode === 'light' ? '#0891b2' : '#15803d'} />
            </linearGradient>
            <linearGradient id="africaTarget" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>
            <filter id="africaWarmGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor="#fbbf24" floodOpacity=".65" />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="africaGreenGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor="#4ade80" floodOpacity=".7" />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="africaTargetGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor="#fb7185" floodOpacity=".65" />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <clipPath id="africaLandClip">
              {AFRICA_BOUNDARIES.map(country => (
                <path key={country.id} d={country.path} fillRule="evenodd" />
              ))}
            </clipPath>
          </defs>

          <g aria-hidden="true" pointerEvents="none">
            <rect x="-1200" y="-1200" width="2930" height="3020" fill="url(#africaOcean)" />
            <rect x="-1200" y="-1200" width="2930" height="3020" fill="url(#africaWaterTexture)" />
            <text
              x="12"
              y="320"
              fill={themeMode === 'light' ? '#ecfeff' : '#7dd3fc'}
              fillOpacity=".72"
              fontSize="7"
              fontWeight="600"
              letterSpacing="1.4"
            >
              ATLANTIC OCEAN
            </text>
            <text
              x="518"
              y="370"
              fill={themeMode === 'light' ? '#ecfeff' : '#7dd3fc'}
              fillOpacity=".72"
              fontSize="7"
              fontWeight="600"
              letterSpacing="1.25"
              textAnchor="end"
            >
              INDIAN OCEAN
            </text>
          </g>

          <g aria-hidden="true">
            {AFRICA_BOUNDARIES.map(region => {
              const country = playableCountries.get(region.id);
              const isDefender = defenderCountry?.id === region.id;
              const isPlayer = country?.owner === playerOwnerName;
              const isFocused = focusedIds.has(region.id);

              return (
                <path
                  key={region.id}
                  d={region.path}
                  fill={isDefender ? 'url(#africaTarget)' : isPlayer ? 'url(#africaPlayer)' : country ? 'url(#africaGold)' : 'url(#africaUnassigned)'}
                  fillOpacity={country ? (isFocused ? 0.98 : isPlayer ? 0.9 : 0.82) : 0.6}
                  stroke="none"
                />
              );
            })}
            <path
              d={LOW_POLY_MESH}
              clipPath="url(#africaLandClip)"
              fill="none"
              stroke={themeMode === 'light' ? '#36513a' : '#6b4f3a'}
              strokeOpacity=".28"
              strokeWidth=".55"
              vectorEffect="non-scaling-stroke"
            />
            {AFRICA_BOUNDARIES.map(region => {
              const country = playableCountries.get(region.id);
              const isAttacker = attackerCountry?.id === region.id;
              const isDefender = defenderCountry?.id === region.id;
              const isPlayer = country?.owner === playerOwnerName;

              return (
                <path
                  key={region.id}
                  d={region.path}
                  fill="none"
                  stroke={isDefender ? '#fda4af' : isAttacker ? '#fef3c7' : isPlayer ? (themeMode === 'light' ? '#cffafe' : '#86efac') : country ? (themeMode === 'light' ? '#f0fdf4' : '#d9c7a2') : (themeMode === 'light' ? '#7c5e42' : '#9a6f4f')}
                  strokeOpacity={country ? 0.96 : 0.72}
                  strokeWidth={country ? (isAttacker || isDefender ? 1.5 : 0.85) : 0.65}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </g>

          {board.map(country => {
            const region = BOUNDARIES_BY_ID.get(country.id);
            if (!region) return null;

            const isAttacker = attackerCountry?.id === country.id;
            const isDefender = defenderCountry?.id === country.id;
            const isPlayer = country.owner === playerOwnerName;
            const isHovered = hoveredCountry?.id === country.id;
            const glowFilter = isDefender
              ? 'url(#africaTargetGlow)'
              : isAttacker || (isHovered && !isPlayer)
                ? 'url(#africaWarmGlow)'
                : isPlayer
                  ? 'url(#africaGreenGlow)'
                  : undefined;
            const markerRadius = isAttacker || isDefender ? 9 : 7;

            return (
              <g
                key={country.id}
                role={interactive ? 'button' : undefined}
                tabIndex={interactive ? 0 : -1}
                aria-label={`${country.name}, ${country.owner}, ${country.soldiers} troops`}
                aria-pressed={interactive ? isAttacker || isDefender : undefined}
                className={interactive ? 'cursor-pointer outline-none' : 'outline-none'}
                onClick={interactive ? () => onCountryClick(country) : undefined}
                onKeyDown={interactive ? event => handleCountryKeyDown(event, country) : undefined}
                onMouseEnter={() => setHoveredCountry(country)}
                onMouseLeave={() => setHoveredCountry(null)}
                onFocus={() => setHoveredCountry(country)}
                onBlur={() => setHoveredCountry(null)}
              >
                <path
                  d={region.path}
                  fill="transparent"
                  stroke="transparent"
                  strokeWidth="10"
                  pointerEvents="all"
                  vectorEffect="non-scaling-stroke"
                />
                {(isAttacker || isDefender || isPlayer || isHovered) && (
                  <path
                    d={region.path}
                    fill="none"
                    stroke={isDefender ? '#fecdd3' : isPlayer ? '#bbf7d0' : '#fff1b8'}
                    strokeWidth={isHovered ? 1.5 : 1}
                    strokeOpacity=".95"
                    filter={glowFilter}
                    pointerEvents="none"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
                <g transform={`translate(${region.center[0]} ${region.center[1]})`} pointerEvents="none">
                  <circle
                    r={markerRadius}
                    fill="#111827"
                    fillOpacity=".92"
                    stroke={isDefender ? '#fb7185' : isAttacker ? '#fbbf24' : isPlayer ? '#4ade80' : '#f8d88a'}
                    strokeWidth="1.2"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#fff7ed"
                    fontSize="5.5"
                    fontWeight="700"
                  >
                    {country.id}
                  </text>
                </g>
              </g>
            );
          })}

          {conquestPath && conquestStart && conquestEnd && (
            <g key={conquestAnimation.id} aria-hidden="true" pointerEvents="none">
              <path
                d={conquestPath}
                fill="none"
                stroke="#fb923c"
                strokeOpacity=".2"
                strokeWidth="1.2"
                strokeDasharray="3 7"
                strokeLinecap="round"
              />
              <path
                d={conquestPath}
                pathLength="1"
                className="conquest-trajectory"
                fill="none"
                stroke="#fed7aa"
                strokeWidth="1.7"
                strokeDasharray="1"
                strokeDashoffset="1"
                strokeLinecap="round"
              />
              <circle cx={conquestStart[0]} cy={conquestStart[1]} r="5" fill="#86efac" stroke="#dcfce7" strokeWidth="1.5" />
              <g>
                <animateMotion
                  dur="1.05s"
                  path={conquestPath}
                  rotate="auto"
                  fill="freeze"
                />
                <g className="conquest-bomb">
                  <path d="M-5 -3L-9 -6L-8 -1ZM5 -3L9 -6L8 -1ZM-5 3L-9 6L-8 1ZM5 3L9 6L8 1Z" fill="#c88752" />
                  <path d="M0 -7C4 -7 6 -3 5 1L2 6H-2L-5 1C-6 -3 -4 -7 0 -7Z" fill="#253242" stroke="#f1d29a" strokeWidth="1" />
                  <path d="M-1 -8Q-4 -11 -2 -13" fill="none" stroke="#fef3c7" strokeWidth="1.2" strokeLinecap="round" />
                  <circle className="conquest-bomb-fuse" cx="-2" cy="-13" r="1.5" fill="#fb923c" />
                </g>
              </g>
              <g transform={`translate(${conquestEnd[0]} ${conquestEnd[1]})`}>
                <circle className="conquest-blast-ring conquest-blast-ring-inner" r="3" fill="none" stroke="#fff1b8" strokeWidth="2" />
                <circle className="conquest-blast-ring conquest-blast-ring-outer" r="3" fill="none" stroke="#fb923c" strokeWidth="1.6" />
                <circle className="conquest-smoke conquest-smoke-one" cx="-2" cy="-3" r="3.5" />
                <circle className="conquest-smoke conquest-smoke-two" cx="3" cy="-2" r="3" />
                <circle className="conquest-smoke conquest-smoke-three" cx="0" cy="2" r="3.2" />
                {BLAST_PARTICLES.map((particle, index) => (
                  <circle
                    key={index}
                    className="conquest-blast-spark"
                    cx={particle.x}
                    cy={particle.y}
                    r={index % 3 === 0 ? 1.3 : 0.9}
                    style={{
                      '--spark-x': `${particle.x * 2.4}px`,
                      '--spark-y': `${particle.y * 2.4}px`,
                      '--spark-delay': particle.delay
                    }}
                  />
                ))}
              </g>
            </g>
          )}
        </svg>

        <div className="absolute right-2 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/80 p-1.5 shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => setZoom(current => Math.min(MAX_ZOOM, Number((current + ZOOM_STEP).toFixed(2))))}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in on map"
            title="Zoom in"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-300/25 bg-amber-400/10 text-2xl leading-none text-amber-200 transition-colors hover:bg-amber-400/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
          <span className="min-w-10 text-center font-mono text-[10px] text-slate-300" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom(current => Math.max(MIN_ZOOM, Number((current - ZOOM_STEP).toFixed(2))))}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out on map"
            title="Zoom out"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-300/25 bg-amber-400/10 text-2xl leading-none text-amber-200 transition-colors hover:bg-amber-400/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
        </div>

        {hoveredCountry && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-2xl border border-amber-400/50 bg-slate-900/90 px-4 py-2 text-center shadow-xl backdrop-blur-md">
            <span className="text-sm font-bold text-amber-300">
              {hoveredCountry.flag} {hoveredCountry.name}
            </span>
            <span className="block font-mono text-xs text-slate-300">
              Garrison: {hoveredCountry.soldiers} 🪖 ({hoveredCountry.owner})
            </span>
          </div>
        )}
      </div>

      <footer className="relative z-10 flex items-center justify-center gap-4 text-[10px] font-mono uppercase tracking-widest text-slate-400">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> {interactive ? 'Your nations' : 'Controlled territories'}</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-300" /> Territories</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" /> Target</span>
        <span>Natural Earth boundaries</span>
      </footer>
    </section>
  );
}
