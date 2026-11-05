import { useEffect, useRef, useState } from 'react';

export default function PlayerProfileMenu({
  user,
  isGuest,
  accountLabel,
  campaignStats,
  onOpenProfile,
  onSignOut,
  onLeaveGuest
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmingSignOut, setIsConfirmingSignOut] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const menuRef = useRef(null);
  const label = accountLabel || (isGuest ? 'Guest Commander' : 'Sign in');
  const commanderLabel = user || isGuest ? `Commander: ${label}` : label;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = event => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = event => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    setSignOutError('');
    setIsSigningOut(true);
    try {
      await onSignOut();
      setIsOpen(false);
      setIsConfirmingSignOut(false);
    } catch (error) {
      setSignOutError(error.message || 'Could not sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        aria-haspopup={user || isGuest ? 'menu' : undefined}
        aria-expanded={user || isGuest ? isOpen : undefined}
        onClick={() => {
          if (!user && !isGuest) {
            onOpenProfile();
            return;
          }
          setIsOpen(open => !open);
          setIsConfirmingSignOut(false);
          setSignOutError('');
        }}
        className="flex max-w-[min(16rem,48vw)] cursor-pointer items-center gap-2 rounded-xl border border-amber-300/20 bg-slate-950/60 p-1.5 pr-3 text-left transition hover:border-amber-300/50 hover:bg-slate-800/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        title={commanderLabel}
      >
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt=""
            className="h-8 w-8 rounded-lg border border-white/15 object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-300/25 bg-amber-400/10 font-bold text-amber-200">
            {(label[0] || 'G').toUpperCase()}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-xs font-bold text-slate-100">{commanderLabel}</span>
          <span className="block text-[9px] font-semibold uppercase tracking-wider text-amber-300/80">
            {user ? 'Commander' : isGuest ? 'Guest account' : 'Sign in / Register'}
          </span>
        </span>
        {(user || isGuest) && <span aria-hidden="true" className="text-[10px] text-slate-400">▾</span>}
      </button>

      {isOpen && (user || isGuest) && (
        <div
          role="menu"
          aria-label="Player profile"
          className="absolute right-0 top-full z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-white/15 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-xl"
        >
          <div className="mb-3 border-b border-white/10 pb-3">
            <p className="truncate text-sm font-bold text-amber-200">{commanderLabel}</p>
            {user?.email && <p className="mt-1 truncate text-xs text-slate-400">{user.email}</p>}
          </div>

          {campaignStats ? (
            <dl className="mb-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-center">
                <dd className="font-mono text-lg font-bold text-emerald-300">{campaignStats.territories}</dd>
                <dt className="text-[9px] uppercase tracking-wide text-slate-400">Territories</dt>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-center">
                <dd className="font-mono text-lg font-bold text-amber-300">{campaignStats.troops}</dd>
                <dt className="text-[9px] uppercase tracking-wide text-slate-400">Troops</dt>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-center">
                <dd className="font-mono text-lg font-bold text-sky-300">{campaignStats.round}</dd>
                <dt className="text-[9px] uppercase tracking-wide text-slate-400">Round</dt>
              </div>
            </dl>
          ) : (
            <p className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400">
              No active campaign
            </p>
          )}

          {isConfirmingSignOut ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-300">Sign out of your account?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmingSignOut(false)}
                  disabled={isSigningOut}
                  className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="flex-1 rounded-lg border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-xs font-bold text-rose-200 hover:bg-rose-500/25 disabled:opacity-50"
                >
                  {isSigningOut ? 'Signing out…' : 'Confirm sign out'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  onOpenProfile();
                }}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/10"
              >
                Account details
              </button>
              {isGuest && onLeaveGuest && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={onLeaveGuest}
                  className="w-full rounded-lg border border-rose-400/20 bg-rose-950/30 px-3 py-2 text-left text-xs font-semibold text-rose-200 hover:bg-rose-900/50"
                >
                  End guest campaign
                </button>
              )}
              {user ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setIsConfirmingSignOut(true)}
                  className="w-full rounded-lg border border-rose-400/20 bg-rose-950/30 px-3 py-2 text-left text-xs font-semibold text-rose-200 hover:bg-rose-900/50"
                >
                  Log out
                </button>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full rounded-lg bg-amber-400 px-3 py-2 text-left text-xs font-bold text-slate-950 hover:bg-amber-300"
                >
                  Sign in / Register
                </button>
              )}
            </div>
          )}

          {signOutError && (
            <p role="alert" className="mt-3 rounded-lg border border-rose-500/30 bg-rose-950/40 p-2 text-xs text-rose-200">
              {signOutError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
