import { useState } from 'react';
import WorldMap from './WorldMap';
import PlayerProfileMenu from './PlayerProfileMenu';
import GameSettings from './GameSettings';
import { AFRICAN_CAMPAIGN_COUNTRY_IDS, getAfricanCampaignCountries } from '../data/africanCampaignCountries';
import { getAfricanSoldierCount } from '../data/africanCountries';

export default function CountrySelectionScreen({
  countries,
  selectedCountry,
  onSelectCountry,
  onStartCampaign,
  accountLabel,
  user,
  isGuest,
  guestCommanderName,
  onGuestCommanderNameChange,
  onOpenProfile,
  onSignOut,
  onLeaveGuest,
  onBackToLanding,
  themeMode,
  musicVolume,
  onMusicVolumeChange,
  sfxVolume,
  onSfxVolumeChange
}) {
  const [countrySearch, setCountrySearch] = useState('');
  const [viewRegion, setViewRegion] = useState('Africa');
  const selectableCountries = getAfricanCampaignCountries(countries);
  const selectableCountryIds = new Set(AFRICAN_CAMPAIGN_COUNTRY_IDS);
  const mapBoard = selectableCountries.map(country => ({
    ...country,
    owner: country.id === selectedCountry?.id ? 'Your Nation' : 'Independent',
    soldiers: getAfricanSoldierCount(country.populationMb)
  }));
  const canStartCampaign = Boolean(
    selectedCountry
    && selectableCountryIds.has(selectedCountry.id)
    && (!isGuest || guestCommanderName.trim().length >= 2)
    && (!user || user.displayName?.trim().length >= 2)
  );
  const regionCountries = selectableCountries
    .filter(country => country.name.toLowerCase().includes(countrySearch.trim().toLowerCase()));

  return (
    <main data-theme={themeMode} className="battlefield-scene min-h-screen px-4 py-6 text-white sm:px-6">
      <header className="mx-auto mb-6 flex max-w-7xl items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-black tracking-wide text-amber-100">
            <img src="/favicon.jpg" alt="" aria-hidden="true" className="h-10 w-10 rounded-xl border border-amber-200/30 object-cover shadow-lg shadow-amber-500/20" />
            GeoPoly
          </h1>
          <p className="text-xs text-slate-300">Choose an African nation for your campaign</p>
        </div>
        <div className="flex items-center gap-2">
          <GameSettings
            musicVolume={musicVolume}
            onMusicVolumeChange={onMusicVolumeChange}
            sfxVolume={sfxVolume}
            onSfxVolumeChange={onSfxVolumeChange}
          />
          <button
            type="button"
            onClick={onBackToLanding}
            className="rounded-xl border border-white/15 bg-slate-950/50 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Back to briefing
          </button>
          <PlayerProfileMenu
            user={user}
            isGuest={isGuest}
            accountLabel={accountLabel}
            onOpenProfile={onOpenProfile}
            onSignOut={onSignOut}
            onLeaveGuest={onLeaveGuest}
          />
        </div>
      </header>

      <div className="mx-auto grid max-w-[1700px] gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
        <section className="min-w-0">
          <p className="mb-3 text-sm text-slate-200">
            Choose one of 10 playable African countries to lead your campaign. Other continents are available as read-only map previews.
          </p>
          <WorldMap
            board={mapBoard}
            regionFilter={viewRegion}
            onRegionChange={setViewRegion}
            onCountryClick={onSelectCountry}
            selectedCountryId={selectedCountry?.id}
            playerOwnerName="Your Nation"
            selectableCountryIds={selectableCountryIds}
            interactive
            selectionMode
          />
        </section>

        <aside className="flex min-w-0 flex-col rounded-3xl border border-white/15 bg-slate-950/75 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
          {isGuest && (
            <label className="mb-5 block space-y-2">
              <span className="block text-[11px] font-bold uppercase tracking-[.16em] text-cyan-300">
                Commander username <span className="text-rose-400">*</span>
              </span>
              <input
                type="text"
                autoComplete="nickname"
                minLength={2}
                maxLength={24}
                required
                value={guestCommanderName}
                onChange={event => onGuestCommanderNameChange(event.target.value.slice(0, 24))}
                placeholder="Choose a name (2–24 characters)"
                className="w-full rounded-xl border border-white/15 bg-slate-950/60 p-3 text-sm text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
              />
            </label>
          )}
          {user && !user.displayName?.trim() && (
            <p className="mb-5 rounded-xl border border-amber-400/30 bg-amber-950/30 p-3 text-xs text-amber-100">
              Set your required commander username in your profile before starting the campaign.
            </p>
          )}
          <span className="text-[11px] font-bold uppercase tracking-[.2em] text-amber-300">
            {viewRegion === 'Africa'
              ? `Africa campaign · ${selectableCountries.length} playable countries`
              : `${viewRegion} · Read-only preview`}
          </span>
          {viewRegion !== 'Africa' && (
            <p className="mt-2 rounded-xl border border-cyan-300/20 bg-cyan-950/30 p-3 text-xs leading-relaxed text-cyan-100">
              This continent is view-only. Return to Africa to choose one of the 10 playable countries.
            </p>
          )}
          {selectedCountry ? (
            <div className="my-5 rounded-2xl border border-emerald-400/25 bg-emerald-950/30 p-5 text-center">
              <span className="mb-2 block text-5xl">{selectedCountry.flag}</span>
              <h2 className="text-2xl font-black text-emerald-200">{selectedCountry.name}</h2>
              <p className="mt-2 text-sm text-slate-300">
                Starting garrison:{' '}
                <strong className="font-mono text-emerald-300">
                  {getAfricanSoldierCount(selectedCountry.populationMb)} troops
                </strong>
              </p>
            </div>
          ) : (
            <div className="my-5 flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-slate-950/40 p-5 text-center">
              <span className="mb-2 text-3xl text-amber-300">⌖</span>
              <p className="font-semibold text-white">Choose a country on the map</p>
              <p className="mt-1 text-xs text-slate-400">Choose one of the 10 playable African countries to set your capital.</p>
            </div>
          )}

          <label className="mt-2 block space-y-2">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">Find a country</span>
            <input
              type="search"
              value={countrySearch}
              onChange={event => setCountrySearch(event.target.value)}
              placeholder="Search playable African countries"
              disabled={viewRegion !== 'Africa'}
              aria-label="Search playable African countries"
              className="w-full rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/25"
            />
          </label>
          <div aria-label="Playable African countries" className={`mt-2 grid max-h-48 grid-cols-2 gap-1 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/40 p-2 sm:max-h-56 ${viewRegion !== 'Africa' ? 'opacity-55' : ''}`}>
            {regionCountries.map(country => (
              <button
                key={country.id}
                type="button"
                aria-pressed={selectedCountry?.id === country.id}
                disabled={viewRegion !== 'Africa'}
                onClick={() => onSelectCountry(country)}
                className={`min-w-0 rounded-lg border px-2 py-1.5 text-left text-[10px] font-semibold transition ${
                  selectedCountry?.id === country.id
                    ? 'border-emerald-300/50 bg-emerald-500/20 text-emerald-100'
                    : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="mr-1">{country.flag}</span><span className="truncate">{country.name}</span>
              </button>
            ))}
            {!regionCountries.length && (
              <p className="col-span-2 p-2 text-xs text-slate-400">No playable countries match this search.</p>
            )}
          </div>

          <button
            onClick={onStartCampaign}
            disabled={!canStartCampaign}
            className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 font-bold text-slate-950 shadow-lg transition hover:from-amber-400 hover:to-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Initialize Campaign
          </button>
          <p className="mt-3 text-center text-[11px] text-slate-500">
            Campaign roster: you + 9 AI countries from Africa.
          </p>
        </aside>
      </div>
    </main>
  );
}
