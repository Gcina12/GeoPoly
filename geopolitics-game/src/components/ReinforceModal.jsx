import { useState } from 'react';

export default function ReinforceModal({ playerCountries, totalBonus, onComplete }) {
  // Track extra soldiers assigned to each country ID
  const [allocations, setAllocations] = useState({});
  const assignedCount = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  const remainingBonus = totalBonus - assignedCount;

  const handleAdd = (countryId) => {
    if (remainingBonus <= 0) return;
    setAllocations(prev => ({
      ...prev,
      [countryId]: (prev[countryId] || 0) + 1
    }));
  };

  const handleRemove = (countryId) => {
    if (!allocations[countryId] || allocations[countryId] <= 0) return;
    setAllocations(prev => ({
      ...prev,
      [countryId]: allocations[countryId] - 1
    }));
  };

  const handleSubmit = () => {
    if (remainingBonus > 0) {
      alert(`Please allocate all ${totalBonus} reinforcement troops before continuing!`);
      return;
    }
    onComplete(allocations);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900/70 border border-white/20 rounded-3xl p-6 max-w-md w-full text-white shadow-2xl backdrop-blur-xl">
        <h2 className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-amber-500 mb-2">
          🪖 Round Reinforcements
        </h2>
        <p className="text-xs text-slate-300 text-center mb-6">
          You earned <strong className="text-amber-400">+{totalBonus} new soldiers</strong> (+2 per country owned). Deploy them to your territories:
        </p>

        <div className="bg-slate-950/50 border border-white/10 rounded-xl p-3 mb-4 flex justify-between items-center font-mono text-sm">
          <span>Unassigned Troops:</span>
          <span className={`font-bold ${remainingBonus > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {remainingBonus} 🪖
          </span>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 mb-6">
          {playerCountries.map(c => {
            const added = allocations[c.id] || 0;
            return (
              <div key={c.id} className="bg-white/10 border border-white/15 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{c.flag}</span>
                  <div>
                    <h4 className="font-bold text-xs">{c.name}</h4>
                    <span className="text-[10px] text-slate-300">Base: {c.soldiers} 🪖</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRemove(c.id)}
                    className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 font-bold border border-white/20 text-xs flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-mono font-bold text-amber-300 text-sm">
                    {c.soldiers + added}
                  </span>
                  <button
                    onClick={() => handleAdd(c.id)}
                    className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={remainingBonus > 0}
          className={`w-full font-bold py-3.5 rounded-xl transition-all duration-200 cursor-pointer ${
            remainingBonus === 0
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:from-amber-400 hover:to-amber-500 shadow-lg'
              : 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed'
          }`}
        >
          Confirm Reinforcements
        </button>
      </div>
    </div>
  );
}