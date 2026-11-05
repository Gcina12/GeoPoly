let audioContext;
let musicBus;
let sfxBus;
let ambientOscillators = [];
let musicInterval;
let nextMusicNote = 0;
let musicVolume = 0.35;
let sfxVolume = 0.7;

const AMBIENT_SEQUENCE = [220, 261.63, 329.63, 392, 329.63, 261.63, 196, 220];

function getAudioContext() {
  if (!window.AudioContext) {
    throw new Error('Web Audio is not supported by this browser.');
  }

  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new window.AudioContext();
    musicBus = audioContext.createGain();
    sfxBus = audioContext.createGain();
    musicBus.gain.value = musicVolume;
    sfxBus.gain.value = sfxVolume;
    musicBus.connect(audioContext.destination);
    sfxBus.connect(audioContext.destination);
  }

  return audioContext;
}

export function setGameAudioVolumes(nextMusicVolume, nextSfxVolume) {
  musicVolume = Math.max(0, Math.min(1, nextMusicVolume));
  sfxVolume = Math.max(0, Math.min(1, nextSfxVolume));

  if (audioContext && audioContext.state !== 'closed') {
    musicBus.gain.setTargetAtTime(musicVolume, audioContext.currentTime, 0.03);
    sfxBus.gain.setTargetAtTime(sfxVolume, audioContext.currentTime, 0.03);
  }
}

function playTone(context, frequency, startTime, duration, volume, type = 'sine', bus = sfxBus) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(bus);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.05);
}

export async function startAmbientMusic() {
  const context = getAudioContext();
  await context.resume();

  if (musicInterval) return;

  const now = context.currentTime;
  ambientOscillators = [110, 164.81].map((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(index === 0 ? 0.08 : 0.045, now);
    oscillator.connect(gain);
    gain.connect(musicBus);
    oscillator.start(now);
    return oscillator;
  });

  nextMusicNote = 0;
  const playNextNote = () => {
    const noteContext = getAudioContext();
    playTone(
      noteContext,
      AMBIENT_SEQUENCE[nextMusicNote],
      noteContext.currentTime,
      0.75,
      0.1,
      'sine',
      musicBus
    );
    nextMusicNote = (nextMusicNote + 1) % AMBIENT_SEQUENCE.length;
  };

  playNextNote();
  musicInterval = window.setInterval(playNextNote, 620);
}

export function stopAmbientMusic() {
  if (musicInterval) {
    window.clearInterval(musicInterval);
    musicInterval = undefined;
  }

  ambientOscillators.forEach(oscillator => oscillator.stop());
  ambientOscillators = [];
}

export async function playConquestSound() {
  const context = getAudioContext();
  await context.resume();

  const now = context.currentTime;
  playTone(context, 523.25, now, 0.65, 0.09);
  playTone(context, 659.25, now + 0.12, 0.65, 0.08);
  playTone(context, 783.99, now + 0.24, 0.8, 0.09);
  playTone(context, 98, now, 0.32, 0.12, 'triangle');
}

export async function playVictorySound() {
  const context = getAudioContext();
  await context.resume();

  const now = context.currentTime;
  [392, 493.88, 587.33, 783.99, 987.77].forEach((frequency, index) => {
    playTone(context, frequency, now + index * 0.16, 1.15, 0.12, 'sine');
  });
  playTone(context, 130.81, now, 1.4, 0.16, 'triangle');
}
