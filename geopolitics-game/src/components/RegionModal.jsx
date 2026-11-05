export default function RegionModal({
  country,
  isPlayerTurn,
  playerOwnerName,
  attackerCountry,
  playerCountries = [],
  onSelectAttacker,
  onStartCampaign,
  onStartTransfer,
  onClose
}) {
  if (!country) return null;

  const isOwnedByPlayer = country.owner === playerOwnerName;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900/85 border border-white/20 rounded-3xl p-6 max-w-sm w-full text-white shadow-2xl backdrop-blur-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold cursor-pointer text-lg"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <span className="text-5xl block mb-2 drop-shadow-lg">{country.flag}</span>
          <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-amber-500">
            {country.name}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Controlled by <strong className={isOwnedByPlayer ? "text-amber-300" : "text-slate-200"}>{country.owner}</strong>
          </p>
        </div>

        <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 mb-6 space-y-2 font-mono text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Garrison:</span>
            <span className="text-amber-300 font-bold">{country.soldiers} 🪖</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Population Tier:</span>
            <span className="text-slate-200 font-bold">Tier {country.originalValue}</span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Action buttons based on selection context */}
          {isOwnedByPlayer ? (
            <>
              <button
                onClick={() => onStartCampaign('SELECT_ATTACKER', country)}
                disabled={!isPlayerTurn || country.soldiers < 2}
                className={`w-full py-3.5 rounded-xl font-bold transition-all shadow-lg cursor-pointer ${
                  isPlayerTurn && country.soldiers >= 2
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500'
                    : 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed'
                }`}
              >
                {country.soldiers < 2 ? "Needs 2+ Troops to Attack" : "⚔️ Set as Attacker"}
              </button>
              {onStartTransfer && (
                <button
                  type="button"
                  onClick={() => onStartTransfer(country)}
                  disabled={!isPlayerTurn || country.soldiers < 2}
                  className="w-full rounded-xl border border-cyan-200/30 bg-cyan-950/45 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-900/60 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ⇄ Transfer soldiers
                </button>
              )}
            </>
          ) : (
            <>
              {playerCountries.length > 1 && (
                <fieldset className="space-y-2">
                  <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-300">Choose which country will attack</legend>
                  {playerCountries.map(playerCountry => {
                    const canAttack = playerCountry.soldiers >= 2;
                    const isSelected = attackerCountry?.id === playerCountry.id;
                    return (
                      <button
                        key={playerCountry.id}
                        type="button"
                        onClick={() => onSelectAttacker(playerCountry)}
                        disabled={!isPlayerTurn || !canAttack}
                        aria-pressed={isSelected}
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-45 ${
                          isSelected
                            ? 'border-amber-300/70 bg-amber-400/15 text-amber-100'
                            : 'border-white/10 bg-slate-950/50 text-slate-200 hover:bg-white/10'
                        }`}
                      >
                        <span>{playerCountry.flag} {playerCountry.name}</span>
                        <span className="font-mono text-xs">{playerCountry.soldiers} 🪖{!canAttack ? ' · Needs 2+' : ''}</span>
                      </button>
                    );
                  })}
                </fieldset>
              )}
              {playerCountries.length === 0 && (
                <p className="rounded-xl border border-rose-300/20 bg-rose-950/30 p-3 text-xs text-rose-200">You do not control a country that can attack.</p>
              )}
              {playerCountries.length === 1 && playerCountries[0].soldiers < 2 && (
                <p className="rounded-xl border border-rose-300/20 bg-rose-950/30 p-3 text-xs text-rose-200">Your country needs at least 2 soldiers to attack.</p>
              )}
              <button
                onClick={() => onStartCampaign('LAUNCH_CAMPAIGN', country)}
                disabled={!isPlayerTurn || !attackerCountry || attackerCountry.soldiers < 2}
                className={`w-full py-3.5 rounded-xl font-bold transition-all shadow-lg cursor-pointer ${
                  isPlayerTurn && attackerCountry && attackerCountry.soldiers >= 2
                    ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-400 hover:to-rose-500'
                    : 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed'
                }`}
              >
                {attackerCountry ? `🚀 Attack ${country.name} from ${attackerCountry.name}` : 'Choose an attacking country'}
              </button>
            </>
          )}

          <button
            onClick={onClose}
            className="w-full bg-white/10 hover:bg-white/20 border border-white/15 text-slate-300 font-bold py-2.5 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}