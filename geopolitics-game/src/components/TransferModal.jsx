import { useState } from 'react';

export default function TransferModal({ source, board, playerOwnerName, onConfirm, onClose }) {
  const destinations = board.filter(country => (
    country.owner === playerOwnerName && country.id !== source.id
  ));
  const [destinationId, setDestinationId] = useState(destinations[0]?.id || '');
  const [amount, setAmount] = useState(1);
  const maxAmount = Math.max(1, source.soldiers - 1);
  const selectedAmount = Math.min(amount, maxAmount);

  const handleSubmit = event => {
    event.preventDefault();
    if (!destinationId || source.soldiers < 2) return;
    onConfirm(source.id, destinationId, selectedAmount);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-cyan-200/25 bg-slate-900/95 p-6 text-white shadow-2xl">
        <p className="text-center text-[10px] font-black uppercase tracking-[.18em] text-cyan-200">Troop movement</p>
        <h2 className="mt-1 text-center text-xl font-black">Transfer soldiers</h2>
        <p className="mt-2 text-center text-sm text-slate-300">
          Move troops from <strong className="text-white">{source.name}</strong>. It must retain at least one soldier.
        </p>

        {destinations.length ? (
          <>
            <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-slate-300">
              Destination
              <select
                value={destinationId}
                onChange={event => setDestinationId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-slate-950 p-3 text-sm text-white focus:border-cyan-300 focus:outline-none"
              >
                {destinations.map(country => (
                  <option key={country.id} value={country.id}>
                    {country.name} · {country.soldiers} soldiers
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-5 block">
              <span className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-300">
                Soldiers to transfer <strong className="font-mono text-lg text-cyan-100">{selectedAmount}</strong>
              </span>
              <input
                type="range"
                min="1"
                max={maxAmount}
                value={selectedAmount}
                onChange={event => setAmount(Number(event.target.value))}
                aria-label="Number of soldiers to transfer"
                className="mt-3 w-full accent-cyan-300"
              />
              <span className="mt-1 block text-[10px] text-slate-400">
                {source.soldiers - selectedAmount} soldiers will remain at {source.name}.
              </span>
            </label>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button type="button" onClick={onClose} className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-white/10">
                Cancel
              </button>
              <button type="submit" className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-cyan-300">
                Confirm transfer
              </button>
            </div>
          </>
        ) : (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-slate-300">
            You need another controlled country to transfer soldiers to.
            <button type="button" onClick={onClose} className="mt-4 block w-full rounded-xl bg-white/10 px-4 py-3 font-bold text-white hover:bg-white/15">
              Close
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
