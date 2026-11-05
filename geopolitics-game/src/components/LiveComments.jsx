import { useEffect, useRef, useState } from 'react';
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const MAX_COMMENT_LENGTH = 500;

function formatTime(createdAt) {
  if (!createdAt?.toDate) return 'Just now';
  return createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getCommentsError(error) {
  if (error.code === 'permission-denied') {
    return 'Comments are unavailable because Firestore rules do not allow this campaign’s comments to be read or posted.';
  }
  return error.message || 'Could not load live comments.';
}

export default function LiveComments({ sessionId, watcherName, canComment = false }) {
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const lastSentAtRef = useRef(0);

  useEffect(() => {
    if (!sessionId) return undefined;

    const commentsQuery = query(
      collection(db, 'game_sessions', sessionId, 'comments'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    return onSnapshot(
      commentsQuery,
      snapshot => {
        setComments(snapshot.docs.map(comment => ({ id: comment.id, ...comment.data() })));
        setError('');
      },
      snapshotError => {
        console.error('Could not load live campaign comments:', snapshotError);
        setError(getCommentsError(snapshotError));
      }
    );
  }, [sessionId]);

  const handleSubmit = async event => {
    event.preventDefault();
    const text = message.trim();
    if (!text || !watcherName || isSending) return;

    const now = Date.now();
    if (now - lastSentAtRef.current < 2500) {
      setError('Please wait a moment before posting another comment.');
      return;
    }

    setIsSending(true);
    setError('');
    try {
      await addDoc(collection(db, 'game_sessions', sessionId, 'comments'), {
        author: watcherName,
        message: text,
        createdAt: serverTimestamp()
      });
      lastSentAtRef.current = Date.now();
      setMessage('');
    } catch (submitError) {
      console.error('Could not post live campaign comment:', submitError);
      setError(getCommentsError(submitError));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/15 bg-slate-950/45 p-3 backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
          💬 Spectator comments
        </h3>
        <span className="text-[10px] text-slate-400">{comments.length} / 100</span>
      </div>
      {canComment && (
        <form onSubmit={handleSubmit} className="mb-3 space-y-2">
          <label className="sr-only" htmlFor={`comment-${sessionId}`}>Write a live comment</label>
          <textarea
            id={`comment-${sessionId}`}
            value={message}
            onChange={event => setMessage(event.target.value.slice(0, MAX_COMMENT_LENGTH))}
            maxLength={MAX_COMMENT_LENGTH}
            rows={2}
            placeholder={`Share a thought as ${watcherName}…`}
            className="w-full resize-y rounded-xl border border-white/15 bg-slate-900/70 p-2.5 text-xs text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400">{message.length}/{MAX_COMMENT_LENGTH}</span>
            <button
              type="submit"
              disabled={!message.trim() || isSending}
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        </form>
      )}
      {error && <p role="alert" className="mb-2 rounded-lg border border-rose-400/30 bg-rose-950/40 p-2 text-[11px] text-rose-200">{error}</p>}
      <div aria-live="polite" className="max-h-56 space-y-2 overflow-y-auto pr-1">
        {comments.map(comment => (
          <article key={comment.id} className="rounded-xl border border-white/10 bg-white/5 p-2.5">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-[11px] font-bold text-teal-200">{comment.author}</span>
              <time className="shrink-0 text-[9px] text-slate-400">{formatTime(comment.createdAt)}</time>
            </div>
            <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-100">{comment.message}</p>
          </article>
        ))}
        {!comments.length && !error && (
          <p className="rounded-xl bg-white/5 p-3 text-[11px] text-slate-400">
            {canComment ? 'Be the first spectator to share a thought.' : 'Spectator comments will appear here live.'}
          </p>
        )}
      </div>
    </section>
  );
}
