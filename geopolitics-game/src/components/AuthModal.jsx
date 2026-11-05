import { useState } from 'react';
import googleIcon from '../assets/googleicon.jpg';
import {
  auth,
  googleProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  getAdditionalUserInfo
} from '../config/firebase';

function getAuthErrorMessage(error) {
  const invalidCredentialsMessage = "We couldn't sign you in with those details. Please check your email and password, then try again.";
  const messages = {
    'auth/email-already-in-use': 'An account already exists for this email. Try signing in instead.',
    'auth/invalid-credential': invalidCredentialsMessage,
    'auth/invalid-login-credentials': invalidCredentialsMessage,
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/popup-closed-by-user': 'The Google sign-in window was closed before finishing.',
    'auth/weak-password': 'Choose a password with at least 6 characters.',
    'auth/user-not-found': invalidCredentialsMessage,
    'auth/wrong-password': invalidCredentialsMessage
  };

  return messages[error.code] || error.message || 'Authentication failed. Please try again.';
}

export default function AuthModal({ user, onClose, onAuthenticated, onContinueAsGuest }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [commanderName, setCommanderName] = useState(user?.displayName || '');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);

  const handleGoogleSignIn = async () => {
    const trimmedName = commanderName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 24) {
      setErrorMsg('Enter a commander username between 2 and 24 characters before continuing with Google.');
      return;
    }

    try {
      setErrorMsg('');
      setIsSubmitting(true);
      const credential = await signInWithPopup(auth, googleProvider);
      const isNewUser = getAdditionalUserInfo(credential)?.isNewUser;
      if (isNewUser || !credential.user.displayName) {
        await updateProfile(credential.user, { displayName: trimmedName });
      }
      onAuthenticated?.();
      onClose();
    } catch (err) {
      setErrorMsg(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      setErrorMsg('');
      setIsSubmitting(true);
      if (isSignUp) {
        const trimmedName = commanderName.trim();
        if (trimmedName.length < 2 || trimmedName.length > 24) {
          setErrorMsg('Choose a commander username between 2 and 24 characters.');
          setIsSubmitting(false);
          return;
        }
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: trimmedName });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onAuthenticated?.();
      onClose();
    } catch (err) {
      setErrorMsg(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCommanderName = async event => {
    event.preventDefault();
    const trimmedName = commanderName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 24) {
      setErrorMsg('Choose a commander username between 2 and 24 characters.');
      return;
    }

    try {
      setErrorMsg('');
      setIsSavingName(true);
      await updateProfile(user, { displayName: trimmedName });
      onAuthenticated?.();
      onClose();
    } catch (error) {
      setErrorMsg(getAuthErrorMessage(error));
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900/80 border border-white/20 rounded-3xl p-6 max-w-md w-full text-white shadow-2xl backdrop-blur-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold cursor-pointer text-lg"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-amber-500 mb-4">
          {user ? 'Player Profile' : isSignUp ? 'Create Account' : 'Sign In'}
        </h2>

        {user ? (
          <div className="text-center space-y-4">
            <div className="bg-white/10 p-4 rounded-2xl border border-white/15">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Commander profile</p>
              <p className="text-lg font-bold text-amber-300 mt-1">Commander: {user.displayName || 'Choose a username'}</p>
              {user.email && user.displayName && (
                <p className="mt-1 text-sm text-slate-300">{user.email}</p>
              )}
            </div>
            <form onSubmit={handleSaveCommanderName} className="space-y-3 text-left">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-300">Commander username</span>
                <input
                  type="text"
                  autoComplete="nickname"
                  minLength={2}
                  maxLength={24}
                  required
                  value={commanderName}
                  onChange={event => setCommanderName(event.target.value.slice(0, 24))}
                  placeholder="2–24 characters"
                  className="w-full rounded-xl border border-white/15 bg-slate-950/60 p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
              </label>
              {errorMsg && <p role="alert" className="text-xs text-rose-300">{errorMsg}</p>}
              <button
                type="submit"
                disabled={isSavingName}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-60"
              >
                {isSavingName ? 'Saving…' : 'Save commander name'}
              </button>
            </form>
            <p className="text-xs text-slate-400">Manage sign-out from your profile menu.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block space-y-1.5 text-left">
              <span className="text-xs font-semibold text-slate-300">
                Commander username <span className="text-rose-400">*</span>
              </span>
              <input
                type="text"
                autoComplete="nickname"
                placeholder="2–24 characters"
                value={commanderName}
                onChange={event => setCommanderName(event.target.value.slice(0, 24))}
                minLength={2}
                maxLength={24}
                required={isSignUp}
                className="w-full rounded-xl border border-white/15 bg-slate-950/60 p-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              />
            </label>
            <button
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/10 py-3 font-bold text-white transition-all hover:bg-white/20 disabled:cursor-wait disabled:opacity-60"
            >
              <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white p-1">
                <img src={googleIcon} alt="" className="h-full w-full object-contain" />
              </span>
              {isSubmitting ? 'Connecting…' : 'Continue with Google'}
            </button>

            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-xs text-slate-400 uppercase">OR</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              <input
                type="email"
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950/60 border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              />
              <input
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950/60 border border-white/15 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              />

              {errorMsg && (
                <p role="alert" className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/30">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full cursor-pointer rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 font-bold text-slate-950 shadow-lg transition-all hover:from-amber-400 hover:to-amber-500 disabled:cursor-wait disabled:opacity-60"
              >
                {isSubmitting ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <p className="text-xs text-center text-slate-400 mt-2">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                disabled={isSubmitting}
                className="text-amber-300 font-bold underline cursor-pointer"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
            {onContinueAsGuest && (
              <button
                type="button"
                onClick={onContinueAsGuest}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-60"
              >
                Continue as guest
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}