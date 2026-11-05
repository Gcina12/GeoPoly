import { useEffect, useRef, useState } from 'react';
import { WORLD_COUNTRIES, WORLD_REGIONS } from '../data/worldCountries';
import CampaignFlag from './CampaignFlag';

const MAP_SIZE = 256;
const MIN_VIEW_WIDTH = 12;
const MAX_MERCATOR_LAT = 85.05112878;
const TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile';
const CAMPAIGN_FLAG_OFFSETS = {
  DZ: [0, -8],
  CD: [-16, 0],
  EG: [8, -8],
  ET: [12, -16],
  GH: [-12, -5],
  KE: [20, 0],
  MA: [-8, -8],
  NG: [8, -15],
  ZA: [-14, 8],
  TZ: [14, 10]
};
const REGION_BOUNDS = {
  Africa: [-18, 52, -36, 38],
  Americas: [-170, -30, -58, 76],
  Asia: [25, 180, -12, 82],
  Europe: [-25, 62, 34, 72],
  Oceania: [110, 180, -48, 5]
};
function projectLonLat(longitude, latitude) {
  const clampedLatitude = Math.max(-MAX_MERCATOR_LAT, Math.min(MAX_MERCATOR_LAT, latitude));
  const latitudeRadians = clampedLatitude * Math.PI / 180;
  return [
    ((longitude + 180) / 360) * MAP_SIZE,
    (0.5 - Math.log(Math.tan(Math.PI / 4 + latitudeRadians / 2)) / (2 * Math.PI)) * MAP_SIZE
  ];
}

function projectMapPoint(x, y) {
  return projectLonLat((x / 1000) * 360 - 180, 90 - (y / 500) * 180);
}

function projectCountryPath(path) {
  return path.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (_, x, y) => {
    const [projectedX, projectedY] = projectMapPoint(Number(x), Number(y));
    return `${projectedX.toFixed(3)} ${projectedY.toFixed(3)}`;
  });
}

const PROJECTED_COUNTRIES = WORLD_COUNTRIES.map(country => ({
  ...country,
  projectedPath: projectCountryPath(country.path),
  projectedCenter: projectMapPoint(...country.center)
}));
const PROJECTED_CENTER_BY_ID = new Map(PROJECTED_COUNTRIES.map(country => [country.id, country.projectedCenter]));

function clampViewBox(viewBox) {
  const width = Math.max(MIN_VIEW_WIDTH, Math.min(MAP_SIZE, viewBox.width));
  const height = Math.max(MIN_VIEW_WIDTH, Math.min(MAP_SIZE, viewBox.height));
  return {
    x: Math.max(0, Math.min(MAP_SIZE - width, viewBox.x)),
    y: Math.max(0, Math.min(MAP_SIZE - height, viewBox.y)),
    width,
    height
  };
}

function getRegionViewBox(region, aspectRatio) {
  if (!region || !REGION_BOUNDS[region]) {
    return { x: 0, y: 0, width: MAP_SIZE, height: MAP_SIZE };
  }

  const [west, east, south, north] = REGION_BOUNDS[region];
  const [westX, southY] = projectLonLat(west, south);
  const [eastX, northY] = projectLonLat(east, north);
  const centerX = (westX + eastX) / 2;
  const centerY = (southY + northY) / 2;
  const width = Math.min(MAP_SIZE, Math.max(eastX - westX, (southY - northY) * aspectRatio) * 1.3);
  return clampViewBox({
    x: centerX - width / 2,
    y: centerY - width / aspectRatio / 2,
    width,
    height: width / aspectRatio
  });
}

function getCampaignViewBox(board, aspectRatio) {
  const centers = board
    .map(country => PROJECTED_CENTER_BY_ID.get(country.id))
    .filter(Boolean);
  if (!centers.length) return getRegionViewBox(null, aspectRatio);

  const xs = centers.map(([x]) => x);
  const ys = centers.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const padding = Math.max((maxX - minX) * 0.12, (maxY - minY) * 0.12, 4);
  const width = Math.min(
    MAP_SIZE,
    Math.max(maxX - minX + padding * 2, (maxY - minY + padding * 2) * aspectRatio)
  );
  const height = width / aspectRatio;

  return clampViewBox({
    x: (minX + maxX) / 2 - width / 2,
    y: (minY + maxY) / 2 - height / 2,
    width,
    height
  });
}

function formatViewBox(viewBox) {
  return `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`;
}

export default function WorldMap({
  board,
  regionFilter = 'Africa',
  onRegionChange,
  onCountryClick,
  playerOwnerName,
  attackerCountry,
  defenderCountry,
  conquestAnimation,
  selectedCountryId,
  onCountryAction,
  selectableCountryIds,
  interactive = true,
  selectionMode = false,
  large = false
}) {
  const fallbackAspectRatio = large
    ? (typeof window !== 'undefined' && window.innerWidth < 1024 ? 1.2 : 1.85)
    : 1.5;
  const initialViewBox = selectionMode
    ? getRegionViewBox(regionFilter, fallbackAspectRatio)
    : getCampaignViewBox(board, fallbackAspectRatio);
  const [viewBox, setViewBox] = useState(initialViewBox);
  const [viewRegion, setViewRegion] = useState(regionFilter);
  const [hoveredCountryId, setHoveredCountryId] = useState(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });
  const svgRef = useRef(null);
  const viewBoxRef = useRef(initialViewBox);
  const viewRegionRef = useRef(regionFilter);
  const dragRef = useRef(null);
  const draggedRef = useRef(false);
  const hasManualViewRef = useRef(false);
  const hoveredCountry = WORLD_COUNTRIES.find(country => country.id === hoveredCountryId);
  const playableCountries = new Map(board.map(country => [country.id, country]));
  const selectedCountry = board.find(country => country.owner === 'Your Nation');
  const countrySelectHandler = onCountryClick || (() => {});
  const selectedMarkerCountry = playableCountries.get(selectedCountryId);
  const attackCenter = PROJECTED_CENTER_BY_ID.get(attackerCountry?.id);
  const defendCenter = PROJECTED_CENTER_BY_ID.get(defenderCountry?.id);
  const conquestStart = conquestAnimation
    ? PROJECTED_CENTER_BY_ID.get(conquestAnimation.attackerId)
    : null;
  const conquestEnd = conquestAnimation
    ? PROJECTED_CENTER_BY_ID.get(conquestAnimation.defenderId)
    : null;
  const aspectRatio = mapDimensions.width && mapDimensions.height
    ? mapDimensions.width / mapDimensions.height
    : fallbackAspectRatio;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const updateDimensions = (width, height) => {
      setMapDimensions({
        width,
        height
      });
      if (width > 0 && height > 0 && !hasManualViewRef.current) {
        const nextViewBox = selectionMode
          ? getRegionViewBox(regionFilter, width / height)
          : getCampaignViewBox(board, width / height);
        viewBoxRef.current = nextViewBox;
        setViewBox(nextViewBox);
      }
    };
    const observer = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(([entry]) => {
        updateDimensions(entry.contentRect.width, entry.contentRect.height);
      });
    observer?.observe(svg);
    const measureFrame = window.requestAnimationFrame(() => {
      const bounds = svg.getBoundingClientRect();
      updateDimensions(bounds.width, bounds.height);
    });
    return () => {
      window.cancelAnimationFrame(measureFrame);
      observer?.disconnect();
    };
  }, [board, regionFilter, selectionMode]);

  const tileZoom = Math.max(0, Math.min(18, Math.floor(Math.log2(Math.max(
    1,
    Math.min(
      (mapDimensions.width || 600) / viewBox.width,
      (mapDimensions.height || 400) / viewBox.height
    )
  )))));
  const tilesPerSide = 2 ** tileZoom;
  const tileWorldSize = MAP_SIZE / tilesPerSide;
  const firstTileX = Math.max(0, Math.floor(viewBox.x / tileWorldSize));
  const lastTileX = Math.min(tilesPerSide - 1, Math.floor((viewBox.x + viewBox.width) / tileWorldSize));
  const firstTileY = Math.max(0, Math.floor(viewBox.y / tileWorldSize));
  const lastTileY = Math.min(tilesPerSide - 1, Math.floor((viewBox.y + viewBox.height) / tileWorldSize));
  const visibleTiles = [];
  for (let tileX = firstTileX; tileX <= lastTileX; tileX += 1) {
    for (let tileY = firstTileY; tileY <= lastTileY; tileY += 1) {
      visibleTiles.push({ tileX, tileY });
    }
  }

  const updateViewBox = nextViewBox => {
    const clampedViewBox = clampViewBox(nextViewBox);
    viewBoxRef.current = clampedViewBox;
    setViewBox(clampedViewBox);
  };

  const focusRegion = region => {
    viewRegionRef.current = region;
    hasManualViewRef.current = true;
    setViewRegion(region);
    onRegionChange?.(region);
    updateViewBox(getRegionViewBox(region, aspectRatio));
  };

  const zoomAt = (factor, clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return;
    const bounds = svg.getBoundingClientRect();
    const offsetX = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width));
    const offsetY = Math.max(0, Math.min(1, (clientY - bounds.top) / bounds.height));
    const current = viewBoxRef.current;
    hasManualViewRef.current = true;
    const width = Math.max(MIN_VIEW_WIDTH, Math.min(MAP_SIZE, current.width * factor));
    const height = Math.max(MIN_VIEW_WIDTH, Math.min(MAP_SIZE, current.height * factor));
    const focusX = current.x + offsetX * current.width;
    const focusY = current.y + offsetY * current.height;
    updateViewBox({
      x: focusX - offsetX * width,
      y: focusY - offsetY * height,
      width,
      height
    });
  };

  const handlePointerDown = event => {
    if (event.button !== 0 && event.pointerType !== 'touch') return;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      viewBox: viewBoxRef.current
    };
    draggedRef.current = false;
  };

  const handlePointerMove = event => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const bounds = svgRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 5 && !draggedRef.current) {
      draggedRef.current = true;
      hasManualViewRef.current = true;
      svgRef.current?.setPointerCapture(event.pointerId);
    }
    if (!draggedRef.current) return;
    updateViewBox({
      ...drag.viewBox,
      x: drag.viewBox.x - (deltaX / bounds.width) * drag.viewBox.width,
      y: drag.viewBox.y - (deltaY / bounds.height) * drag.viewBox.height
    });
  };

  const handlePointerUp = event => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId);
    }
    if (draggedRef.current) {
      window.setTimeout(() => {
        draggedRef.current = false;
      }, 0);
    }
  };

  const handleWheel = event => {
    zoomAt(event.deltaY < 0 ? 0.82 : 1.22, event.clientX, event.clientY);
  };

  const handleCountryClick = (event, country, canSelect) => {
    event.stopPropagation();
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    if (canSelect) countrySelectHandler(country);
    else if (!selectionMode && playableCountries.has(country.id)) countrySelectHandler(country);
  };

  const handleZoomButton = factor => {
    const bounds = svgRef.current?.getBoundingClientRect();
    if (!bounds) return;
    zoomAt(factor, bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
  };

  const conflictPath = attackerCountry && defenderCountry && attackCenter && defendCenter
    ? `M ${attackCenter[0]} ${attackCenter[1]} Q ${(attackCenter[0] + defendCenter[0]) / 2} ${Math.min(attackCenter[1], defendCenter[1]) - 14} ${defendCenter[0]} ${defendCenter[1]}`
    : null;
  const markerScaleX = viewBox.width / (mapDimensions.width || 600);
  const markerScaleY = viewBox.height / (mapDimensions.height || 400);
  const flagWidth = 42 * markerScaleX;
  const flagHeight = 32 * markerScaleY;
  const panelWidth = 190 * markerScaleX;
  const panelHeight = 132 * markerScaleY;
  const selectedMarkerCenter = selectedMarkerCountry
    ? PROJECTED_CENTER_BY_ID.get(selectedMarkerCountry.id)
    : null;
  const panelX = selectedMarkerCenter
    ? Math.max(
      viewBox.x + markerScaleX * 5,
      Math.min(viewBox.x + viewBox.width - panelWidth - markerScaleX * 5, selectedMarkerCenter[0] + markerScaleX * 25)
    )
    : 0;
  const panelY = selectedMarkerCenter
    ? Math.max(
      viewBox.y + markerScaleY * 5,
      Math.min(viewBox.y + viewBox.height - panelHeight - markerScaleY * 5, selectedMarkerCenter[1] - panelHeight / 2)
    )
    : 0;

  return (
    <section className={`world-map-shell relative flex min-w-0 flex-col overflow-hidden rounded-3xl border border-amber-300/25 bg-slate-950/75 p-3 shadow-2xl backdrop-blur-xl ${large ? 'world-map-large' : ''}`}>
      <header className="relative z-10 mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-amber-200 sm:text-xs">
            🌐 World campaign map
          </span>
          <span className="mt-1 block text-[9px] text-slate-400">
            {selectionMode
              ? 'Africa is playable · Other continents are read-only previews'
              : `${viewRegion || 'World'} · Drag to pan · Scroll or pinch to zoom`}
          </span>
        </div>
        {!selectionMode && attackerCountry && (
          <span className="rounded-full border border-amber-300/35 bg-amber-950/65 px-3 py-1 font-mono text-[9px] text-amber-100 sm:text-[10px]">
            ⚔ {attackerCountry.name}{defenderCountry ? ` → ${defenderCountry.name}` : ' · Select a target'}
          </span>
        )}
      </header>

      <nav aria-label="Choose a continent" className="relative z-20 mb-2 flex gap-1 overflow-x-auto pb-1">
        {WORLD_REGIONS.map(region => (
          <button
            key={region}
            type="button"
            aria-pressed={viewRegion === region}
            onClick={() => focusRegion(region)}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-[10px] font-bold transition sm:text-xs ${
              viewRegion === region
                ? 'border-amber-200/50 bg-amber-400/20 text-amber-100'
                : 'border-white/10 bg-slate-950/40 text-slate-300 hover:bg-white/10'
            }`}
          >
            {region}
            {selectionMode && <span className="ml-1 text-[9px] text-slate-400">            {selectionMode
              ? region === 'Africa' ? '10 playable' : 'view only'
              : WORLD_COUNTRIES.filter(country => country.region === region).length}</span>}
          </button>
        ))}
        {!selectionMode && (
          <button
            type="button"
            onClick={() => focusRegion(null)}
            className={`ml-auto shrink-0 rounded-lg border px-3 py-1.5 text-[10px] font-bold transition sm:text-xs ${
              !viewRegion
                ? 'border-cyan-200/40 bg-cyan-400/15 text-cyan-100'
                : 'border-white/10 bg-slate-950/40 text-slate-300 hover:bg-white/10'
            }`}
          >
            World
          </button>
        )}
      </nav>

      <div className="world-map-canvas relative min-h-[300px] flex-1 overflow-hidden rounded-2xl border border-white/10 sm:min-h-[380px]">
        <svg
          ref={svgRef}
          viewBox={formatViewBox(viewBox)}
          preserveAspectRatio="xMidYMid meet"
          role="group"
          aria-label="Scrollable world map with country boundaries"
          className="world-map-svg absolute inset-0 h-full w-full"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          onDoubleClick={event => zoomAt(0.62, event.clientX, event.clientY)}
        >
          <defs>
            <filter id="world-country-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor="#fbbf24" floodOpacity=".65" />
              <feComposite in2="blur" operator="in" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="world-player-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor="#34d399" floodOpacity=".7" />
              <feComposite in2="blur" operator="in" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="world-target-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor="#fb7185" floodOpacity=".72" />
              <feComposite in2="blur" operator="in" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <rect x="0" y="0" width={MAP_SIZE} height={MAP_SIZE} fill="#071722" />
          <g className="world-imagery-tiles" pointerEvents="none">
            {visibleTiles.map(({ tileX, tileY }) => (
              <image
                key={`${tileZoom}-${tileX}-${tileY}`}
                href={`${TILE_URL}/${tileZoom}/${tileY}/${tileX}`}
                x={tileX * tileWorldSize}
                y={tileY * tileWorldSize}
                width={tileWorldSize}
                height={tileWorldSize}
                preserveAspectRatio="none"
              />
            ))}
          </g>
          <rect x="0" y="0" width={MAP_SIZE} height={MAP_SIZE} fill="#06121b" fillOpacity=".28" pointerEvents="none" />
          <g className="world-country-shapes">
            {PROJECTED_COUNTRIES.map(country => {
              const activeCountry = playableCountries.get(country.id);
              const isSelected = selectedCountry?.id === country.id;
              const isAttacker = attackerCountry?.id === country.id;
              const isDefender = defenderCountry?.id === country.id;
              const isHovered = hoveredCountryId === country.id;
              const isInRegion = !selectionMode || !regionFilter || country.region === regionFilter;
              const canSelect = interactive && isInRegion && (
                selectionMode
                  ? !selectableCountryIds || selectableCountryIds.has(country.id)
                  : Boolean(activeCountry)
              );
              const fill = isDefender
                ? '#dc3545'
                : isAttacker
                  ? '#f59e0b'
                  : isSelected
                    ? '#10b981'
                    : activeCountry
                      ? activeCountry.owner === playerOwnerName ? '#14b8a6' : '#c08b3c'
                      : country.region === viewRegion ? '#899177' : '#726f62';
              const stroke = isDefender ? '#fecdd3' : isAttacker ? '#fde68a' : isSelected || activeCountry?.owner === playerOwnerName ? '#a7f3d0' : '#d4c7a6';
              const glow = isDefender ? 'url(#world-target-glow)' : isAttacker || isHovered ? 'url(#world-country-glow)' : isSelected ? 'url(#world-player-glow)' : undefined;
              const fillOpacity = isDefender || isAttacker
                ? 0.4
                : isSelected || activeCountry?.owner === playerOwnerName
                  ? 0.3
                  : activeCountry
                    ? 0.19
                    : isInRegion
                      ? 0.045
                      : 0.012;

              return (
                <path
                  key={country.id}
                  d={country.projectedPath}
                  fill={fill}
                  fillOpacity={selectionMode && regionFilter && !isInRegion ? 0.18 : fillOpacity}
                  fillRule="evenodd"
                  stroke={stroke}
                  strokeWidth={activeCountry || isSelected ? 0.7 : 0.45}
                  strokeOpacity={activeCountry || isSelected ? 1 : 0.78}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  filter={glow}
                  role={canSelect ? 'button' : undefined}
                  tabIndex={canSelect ? 0 : -1}
                  aria-label={canSelect ? `${country.name}, ${country.region}${activeCountry ? `, ${activeCountry.owner}, ${activeCountry.soldiers} troops` : ''}` : undefined}
                  aria-pressed={canSelect ? isSelected : undefined}
                  className={canSelect ? 'world-country-selectable' : undefined}
                  onPointerEnter={() => setHoveredCountryId(country.id)}
                  onPointerLeave={() => setHoveredCountryId(null)}
                  onClick={event => handleCountryClick(event, country, canSelect)}
                  onKeyDown={event => {
                    if (canSelect && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault();
                      countrySelectHandler(country);
                    }
                  }}
                />
              );
            })}
          </g>

          {board.map(country => {
            const center = PROJECTED_CENTER_BY_ID.get(country.id);
            if (!center) return null;
            const isPlayer = country.owner === playerOwnerName || country.owner === 'Your Nation';
            const isSelected = selectedCountryId === country.id;
            const [x, y] = center;
            const [offsetX, offsetY] = CAMPAIGN_FLAG_OFFSETS[country.id] || [0, 0];
            const flagX = x + offsetX * markerScaleX;
            const flagY = y + offsetY * markerScaleY;
            return (
              <g key={`marker-${country.id}`}>
                {(offsetX !== 0 || offsetY !== 0) && (
                  <line
                    x1={x}
                    y1={y}
                    x2={flagX}
                    y2={flagY}
                    stroke={isSelected ? '#fde68a' : '#f8fafc'}
                    strokeOpacity=".8"
                    strokeWidth=".55"
                    vectorEffect="non-scaling-stroke"
                    pointerEvents="none"
                  />
                )}
                <foreignObject
                  x={flagX - flagWidth / 2}
                  y={flagY - flagHeight / 2}
                  width={flagWidth}
                  height={flagHeight}
                  style={{ overflow: 'visible' }}
                >
                  <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    style={{
                      width: '42px',
                      height: '32px',
                      transform: `scale(${markerScaleX}, ${markerScaleY})`,
                      transformOrigin: 'top left'
                    }}
                  >
                    <button
                      type="button"
                      disabled={!interactive}
                      aria-label={`${country.name}, ${country.owner}, ${country.soldiers} troops. Show commander.`}
                      aria-pressed={isSelected}
                      onClick={event => handleCountryClick(event, country, interactive)}
                      onPointerDown={event => event.stopPropagation()}
                      className={`map-country-flag flex h-full w-full items-center justify-center rounded-lg border-2 text-[26px] leading-none shadow-[0_3px_12px_rgba(0,0,0,.7)] transition duration-150 hover:z-10 hover:scale-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                        isSelected
                          ? 'border-white bg-slate-950/95 ring-2 ring-amber-300'
                          : isPlayer
                            ? 'border-emerald-300 bg-slate-950/90'
                            : 'border-slate-200/75 bg-slate-950/90'
                      }`}
                    >
                      <CampaignFlag countryId={country.id} className="h-6 w-9" />
                    </button>
                  </div>
                </foreignObject>
              </g>
            );
          })}

          {selectedMarkerCountry && selectedMarkerCenter && (
            <foreignObject
              x={panelX}
              y={panelY}
              width={panelWidth}
              height={panelHeight}
              style={{ overflow: 'visible' }}
            >
              <div
                xmlns="http://www.w3.org/1999/xhtml"
                style={{
                  width: '190px',
                  height: '132px',
                  transform: `scale(${markerScaleX}, ${markerScaleY})`,
                  transformOrigin: 'top left'
                }}
                className="map-commander-card flex items-center gap-2 rounded-xl border border-amber-200/65 bg-slate-950/95 p-2 text-white shadow-[0_12px_36px_rgba(0,0,0,.8)] ring-1 ring-amber-300/20"
              >
                <div className={`relative flex h-full w-[34%] shrink-0 items-end justify-center overflow-hidden rounded-lg border ${
                  selectedMarkerCountry.owner === playerOwnerName || selectedMarkerCountry.owner === 'Your Nation'
                    ? 'border-emerald-300/70 bg-gradient-to-b from-emerald-900 to-slate-950'
                    : 'border-amber-200/45 bg-gradient-to-b from-amber-950 to-slate-950'
                }`}>
                  <svg viewBox="0 0 64 92" className="h-[94%] w-full" role="img" aria-label="Commander portrait">
                    <path d="M7 92c1-18 10-28 25-28s24 10 25 28" fill={selectedMarkerCountry.owner === playerOwnerName || selectedMarkerCountry.owner === 'Your Nation' ? '#1b7660' : '#76502a'} />
                    <path d="M18 45c0-15 6-24 14-24s14 9 14 24v12c0 11-7 18-14 18s-14-7-14-18z" fill="#b87953" />
                    <path d="M13 38c1-19 8-29 19-29s18 10 19 29l-7-6-4-10-8 7-11-3z" fill="#303941" stroke="#d2a24b" strokeWidth="3" />
                    <path d="M17 37h30M22 46h6m8 0h6M26 57c4 3 8 3 12 0" fill="none" stroke="#251b18" strokeLinecap="round" strokeWidth="2" />
                    <path d="M9 92c3-14 9-22 17-25l6 9 6-9c8 3 14 11 17 25" fill="#111a20" />
                    <path d="m23 68 9 8 9-8-4 24h-10z" fill="#d2a24b" />
                    <circle cx="32" cy="17" r="3" fill="#e1bd73" />
                  </svg>
                  <CampaignFlag countryId={selectedMarkerCountry.id} className="absolute right-1 top-1 h-3 w-[18px] shadow" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <span className="truncate text-[8px] font-bold uppercase tracking-[.13em] text-amber-300">Commander profile</span>
                  <strong className="mt-0.5 truncate text-[13px] font-black uppercase leading-tight text-white">{selectedMarkerCountry.name}</strong>
                  <span className="mt-1 truncate text-[9px] font-semibold text-slate-300">{selectedMarkerCountry.owner === playerOwnerName ? 'Your commander' : selectedMarkerCountry.owner}</span>
                  <span className="mt-0.5 text-[9px] text-slate-300">Troops <b className="font-mono text-amber-200">{selectedMarkerCountry.soldiers.toLocaleString()}</b></span>
                  {onCountryAction && (
                  <button
                    type="button"
                    onClick={event => {
                      event.stopPropagation();
                      onCountryAction?.(selectedMarkerCountry);
                    }}
                    className="mt-1.5 w-fit rounded-md border border-amber-300/50 bg-amber-400/15 px-2 py-1 text-[8px] font-black uppercase tracking-wide text-amber-100 hover:bg-amber-400/30"
                  >
                    {selectedMarkerCountry.owner === playerOwnerName ? 'Commander actions' : `Engage ${selectedMarkerCountry.name}`}
                  </button>
                  )}
                </div>
                {interactive && (
                  <button
                    type="button"
                    aria-label="Close commander profile"
                    onClick={event => {
                      event.stopPropagation();
                      countrySelectHandler(null);
                    }}
                    onPointerDown={event => event.stopPropagation()}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-slate-900 text-[10px] font-bold text-white shadow-lg hover:bg-slate-700"
                  >
                    ×
                  </button>
                )}
              </div>
            </foreignObject>
          )}

          {conflictPath && (
            <path
              d={conflictPath}
              fill="none"
              stroke="#fff1a8"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          )}
          {conquestAnimation && conquestStart && conquestEnd && (
            <g key={conquestAnimation.id} pointerEvents="none">
              <path d={`M${conquestStart[0]} ${conquestStart[1]} Q${(conquestStart[0] + conquestEnd[0]) / 2} ${Math.min(conquestStart[1], conquestEnd[1]) - 16} ${conquestEnd[0]} ${conquestEnd[1]}`} fill="none" stroke="#fed7aa" strokeWidth="2" strokeDasharray="1" className="conquest-trajectory" />
              <circle cx={conquestEnd[0]} cy={conquestEnd[1]} r="6" fill="none" stroke="#fb923c" strokeWidth="2" className="conquest-blast-ring" />
            </g>
          )}

        </svg>

        <div className="absolute right-2 top-2 z-20 flex flex-col gap-1 rounded-xl border border-white/15 bg-slate-950/80 p-1 shadow-xl backdrop-blur-md">
          <button type="button" onClick={() => handleZoomButton(0.72)} aria-label="Zoom in on world map" className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-300/20 bg-amber-400/10 text-xl leading-none text-amber-100 hover:bg-amber-400/25">+</button>
          <button type="button" onClick={() => handleZoomButton(1.38)} aria-label="Zoom out on world map" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xl leading-none text-slate-100 hover:bg-white/10">−</button>
          <button type="button" onClick={() => focusRegion(viewRegion)} aria-label="Center the selected continent" className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-200/20 bg-cyan-400/10 text-xs font-bold text-cyan-100 hover:bg-cyan-400/20">⌖</button>
        </div>

        {hoveredCountry && (
          <div className="pointer-events-none absolute bottom-2 left-2 z-20 rounded-xl border border-amber-300/35 bg-slate-950/85 px-3 py-2 shadow-lg backdrop-blur-md">
            <span className="text-xs font-bold text-amber-100">{hoveredCountry.flag} {hoveredCountry.name}</span>
            <span className="ml-2 text-[9px] uppercase tracking-wider text-slate-400">{hoveredCountry.region} · {hoveredCountry.subregion}</span>
          </div>
        )}
      </div>

      <footer className="relative z-10 mt-2 flex flex-wrap items-center justify-between gap-2 text-[9px] text-slate-400">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Your country</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-300" /> AI nations</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" /> Defender</span>
        </span>
        <span>Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community</span>
        <span>Drag to pan · Scroll or pinch to zoom</span>
      </footer>
    </section>
  );
}
