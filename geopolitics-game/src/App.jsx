import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, signOut } from './config/firebase';

import { getAfricanSoldierCount as getSoldierCount } from "./data/africanCountries";
import { getAfricanCampaignCountries } from './data/africanCampaignCountries';
import { WORLD_COUNTRIES } from './data/worldCountries';
import { executeDiceRoll, calculateConquerBonus } from './utils/combatEngine';
import { evaluateNpcTurn } from './utils/npcEngine';
import { generateCommentary } from './utils/aiCommentary';
import { playConquestSound, playVictorySound, setGameAudioVolumes, startAmbientMusic, stopAmbientMusic } from './utils/gameAudio';

import CombatModal from './components/CombatModal';
import ReinforceModal from './components/ReinforceModal';
import AuthModal from './components/AuthModal';
import FullMapDashboard from './components/FullMapDashboard';
import SpectatorView from './components/SpectatorView';
import CountrySelectionScreen from './components/CountrySelectionScreen';
import LandingPage from './components/LandingPage';
import VictoryModal from './components/VictoryModal';

const CAMPAIGN_REGION = 'Africa';

function readSetting(key, fallback, validate) {
  try {
    const savedValue = window.localStorage.getItem(key);
    return validate(savedValue) ? savedValue : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingCampaignAuth, setPendingCampaignAuth] = useState(false);
  const [isSpectating, setIsSpectating] = useState(false);
  const [isSettingUpCampaign, setIsSettingUpCampaign] = useState(false);
  const [appMessage, setAppMessage] = useState('');
  const themeMode = 'dark';
  const [musicVolume, setMusicVolume] = useState(() => {
    const value = Number(readSetting('geopoly-music-volume', '0.35', saved => saved !== null && Number.isFinite(Number(saved))));
    return Math.max(0, Math.min(1, value));
  });
  const [sfxVolume, setSfxVolume] = useState(() => {
    const value = Number(readSetting('geopoly-sfx-volume', '0.7', saved => saved !== null && Number.isFinite(Number(saved))));
    return Math.max(0, Math.min(1, value));
  });

  const [gameState, setGameState] = useState(null);
  const [dismissedVictoryKey, setDismissedVictoryKey] = useState(null);
  const [guestCommanderName, setGuestCommanderName] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [selectedCountryId, setSelectedCountryId] = useState(null);
  const [conquestAnimation, setConquestAnimation] = useState(null);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const soundEnabledRef = useRef(soundEnabled);
  const hapticsEnabledRef = useRef(hapticsEnabled);
  
  const [attackerCountry, setAttackerCountry] = useState(null);
  const [defenderCountry, setDefenderCountry] = useState(null);
  const [activeCombat, setActiveCombat] = useState(false);
  
  const [fastForward, setFastForward] = useState(false);
  const activeCampaignRef = useRef(false);
  const celebratedWinnerRef = useRef(null);
  activeCampaignRef.current = Boolean(gameState && sessionId);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    hapticsEnabledRef.current = hapticsEnabled;
  }, [soundEnabled, hapticsEnabled]);

  useEffect(() => {
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.style.colorScheme = 'dark';
    setGameAudioVolumes(musicVolume, sfxVolume);
    try {
      window.localStorage.setItem('geopoly-music-volume', String(musicVolume));
      window.localStorage.setItem('geopoly-sfx-volume', String(sfxVolume));
    } catch (error) {
      console.error('Could not save game settings:', error);
    }
  }, [musicVolume, sfxVolume]);

  const enableMusic = () => {
    startAmbientMusic()
      .then(() => setMusicEnabled(true))
      .catch(error => {
        console.error('Could not start background music:', error);
        setAppMessage(`Could not start background music: ${error.message}`);
      });
  };

  const handleMusicToggle = () => {
    if (musicEnabled) {
      stopAmbientMusic();
      setMusicEnabled(false);
      return;
    }

    enableMusic();
  };

  const playConquestFeedback = (isPlayerConquest = false) => {
    if (soundEnabledRef.current) {
      playConquestSound().catch(error => {
        console.error('Could not play the territory capture sound:', error);
        setAppMessage(`Could not play the territory capture sound: ${error.message}`);
      });
    }

    if (
      isPlayerConquest
      && hapticsEnabledRef.current
      && typeof navigator !== 'undefined'
      && typeof navigator.vibrate === 'function'
    ) {
      navigator.vibrate([100, 50, 180]);
    }
  };

  useEffect(() => {
    const winner = gameState?.winner;
    if (!winner || celebratedWinnerRef.current === winner) return;
    celebratedWinnerRef.current = winner;

    if (soundEnabledRef.current) {
      playVictorySound().catch(error => {
        console.error('Could not play the victory celebration sound:', error);
        setAppMessage(`Could not play the victory celebration sound: ${error.message}`);
      });
    }

    if (
      hapticsEnabledRef.current
      && typeof navigator !== 'undefined'
      && typeof navigator.vibrate === 'function'
    ) {
      navigator.vibrate([120, 60, 120, 60, 280]);
    }
  }, [gameState?.winner]);

  // Monitor Firebase Authentication State
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      if (!currentUser) {
        setAuthReady(true);
        return;
      }

      setIsGuest(false);
      if (activeCampaignRef.current) {
        setAuthReady(true);
        return;
      }

      setAuthReady(false);
      const savedSessionId = `account_${currentUser.uid}`;

      try {
        const savedSession = await getDoc(doc(db, 'game_sessions', savedSessionId));
        if (!active || activeCampaignRef.current) return;

        if (savedSession.exists()) {
          const savedGame = savedSession.data();
          if (!Array.isArray(savedGame.board) || !Array.isArray(savedGame.turnOrder)) {
            throw new Error('The saved campaign data is incomplete and cannot be resumed.');
          }

          setGameState(savedGame);
          setSessionId(savedSessionId);
          const playerCountry = savedGame.board.find(
            country => country.owner === savedGame.playerOwnerName
          );
          if (playerCountry) setSelectedCountryId(playerCountry.id);
          setAppMessage('Your saved campaign has been restored.');
        }
      } catch (error) {
        if (!active) return;
        console.error('Could not restore saved campaign:', error);
        setAppMessage(`Could not restore your saved campaign: ${error.message}`);
      } finally {
        if (active) setAuthReady(true);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const addLog = (text, type = 'GENERAL') => {
    const time = new Date().toLocaleTimeString();
    setGameState(prev => ({
      ...prev,
      logs: [{ text, type, time }, ...(prev?.logs || [])]
    }));
  };

  // Sync game state to Cloud Firestore
  useEffect(() => {
    if (!gameState || !sessionId) return;

    const syncToFirestore = async () => {
      try {
        await setDoc(doc(db, "game_sessions", sessionId), {
          ...gameState,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error('Could not sync campaign to Firestore:', err);
      }
    };

    syncToFirestore();
  }, [gameState, sessionId]);

  const startNewGame = () => {
    if (!user && !isGuest) {
      setAppMessage('Choose guest play or sign in before starting a campaign.');
      return;
    }

    if (user && !user.displayName?.trim()) {
      setAppMessage('Set your commander username in your profile before starting a campaign.');
      return;
    }

    const commanderName = user?.displayName?.trim() || guestCommanderName.trim();
    if (commanderName.length < 2 || commanderName.length > 24) {
      setAppMessage('Enter a commander username between 2 and 24 characters before starting.');
      return;
    }

    const campaignCountries = getAfricanCampaignCountries(WORLD_COUNTRIES);
    const playerChoice = campaignCountries.find(country => country.id === selectedCountryId);
    if (!playerChoice) {
      setAppMessage('Choose your capital from the 10 playable African countries before initializing the campaign.');
      return;
    }

    const pool = campaignCountries.filter(country => country.id !== selectedCountryId);
    if (pool.length < 9) {
      setAppMessage('The African campaign needs 10 playable countries to start.');
      return;
    }

    enableMusic();

    const newSessionId = user ? `account_${user.uid}` : `game_${Date.now()}`;
    setSessionId(newSessionId);
    const shuffledPool = [...pool];
    for (let index = shuffledPool.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffledPool[index], shuffledPool[swapIndex]] = [shuffledPool[swapIndex], shuffledPool[index]];
    }
    const npcChoices = shuffledPool.slice(0, 9);

    const playerOwnerName = commanderName;

    const activeBoard = [
      {
        ...playerChoice,
        owner: playerOwnerName,
        soldiers: getSoldierCount(playerChoice.populationMb),
        originalValue: getSoldierCount(playerChoice.populationMb)
      },
      ...npcChoices.map((country, idx) => ({
        ...country,
        owner: `NPC ${idx + 1}`,
        soldiers: getSoldierCount(country.populationMb),
        originalValue: getSoldierCount(country.populationMb)
      }))
    ];

    const turnOrder = [playerOwnerName, ...npcChoices.map((_, idx) => `NPC ${idx + 1}`)];
    for (let index = turnOrder.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [turnOrder[index], turnOrder[swapIndex]] = [turnOrder[swapIndex], turnOrder[index]];
    }
    const startingTurn = turnOrder[0];

    setGameState({
      board: activeBoard,
      campaignRegion: CAMPAIGN_REGION,
      currentRound: 1,
      turnOrder,
      currentTurnIndex: turnOrder.indexOf(startingTurn),
      currentTurn: startingTurn,
      playerOwnerName,
      ownerUid: user?.uid || null,
      isGuest: !user,
      reinforcedRoundByOwner: {},
      logs: [{ text: `${CAMPAIGN_REGION} campaign initialized with 9 AI commanders. ${startingTurn} plays first!`, type: 'GENERAL', time: new Date().toLocaleTimeString() }]
    });
  };

  const startCampaignSetup = () => {
    if (user) {
      setIsSettingUpCampaign(true);
      return;
    }

    setPendingCampaignAuth(true);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
    setPendingCampaignAuth(false);
  };

  const continueCampaignAfterAuth = () => {
    if (pendingCampaignAuth) {
      setPendingCampaignAuth(false);
      setIsSettingUpCampaign(true);
    }
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    continueCampaignAfterAuth();
    setShowAuthModal(false);
  };

  const advanceTurn = () => {
    setGameState(prev => {
      let nextIndex = (prev.currentTurnIndex + 1) % prev.turnOrder.length;
      let nextRound = prev.currentRound;
      let isNewRound = false;

      if (nextIndex === 0) {
        nextRound += 1;
        isNewRound = true;
      }

      const nextTurnOwner = prev.turnOrder[nextIndex];

      return {
        ...prev,
        currentRound: nextRound,
        currentTurnIndex: nextIndex,
        currentTurn: nextTurnOwner,
        isNewRound
      };
    });
  };

  const needsPlayerReinforcements = Boolean(
    gameState
    && gameState.currentRound > 1
    && gameState.currentTurn === gameState.playerOwnerName
    && gameState.reinforcedRoundByOwner?.[gameState.playerOwnerName] !== gameState.currentRound
    && gameState.board.some(country => country.owner === gameState.playerOwnerName)
  );

  const handleReinforceComplete = (allocations) => {
    setGameState(prev => {
      const updatedBoard = prev.board.map(c => {
        if (allocations[c.id]) {
          return { ...c, soldiers: c.soldiers + allocations[c.id] };
        }
        return c;
      });

      return {
        ...prev,
        board: updatedBoard,
        winner: updatedBoard.every(country => country.owner === prev.playerOwnerName)
          ? prev.playerOwnerName
          : prev.winner || null,
        isNewRound: false,
        reinforcedRoundByOwner: {
          ...(prev.reinforcedRoundByOwner || {}),
          [prev.playerOwnerName]: prev.currentRound
        }
      };
    });

    const totalAdded = Object.values(allocations).reduce((a, b) => a + b, 0);
    addLog(`🪖 ${gameState.playerOwnerName} deployed +${totalAdded} reinforcement troops across controlled territories.`, 'GENERAL');
  };

  // Automated NPC Turn Processor
  useEffect(() => {
    if (!gameState || gameState.winner || gameState.currentTurn === gameState.playerOwnerName || activeCombat || needsPlayerReinforcements) return;

    const delay = fastForward ? 400 : 1600;

    const timer = setTimeout(() => {
      const npcOwner = gameState.currentTurn;
      let currentBoard = [...gameState.board];

      // Round 2+ NPC Reinforcement Rule
      const reinforcedRoundByOwner = { ...(gameState.reinforcedRoundByOwner || {}) };
      if (
        gameState.currentRound > 1
        && reinforcedRoundByOwner[npcOwner] !== gameState.currentRound
      ) {
        const npcTerritories = currentBoard.filter(c => c.owner === npcOwner);
        if (npcTerritories.length > 0) {
          const bonusPerTerritory = 2;
          currentBoard = currentBoard.map(c => {
            if (c.owner === npcOwner) {
              return { ...c, soldiers: c.soldiers + bonusPerTerritory };
            }
            return c;
          });
          addLog(`🪖 [${npcOwner}]: Received +${npcTerritories.length * 2} reinforcement troops (+2 per territory).`, 'NPC_JUSTIFICATION');
        }
        reinforcedRoundByOwner[npcOwner] = gameState.currentRound;
      }

      const decision = evaluateNpcTurn(npcOwner, currentBoard);
      addLog(`🤖 [${npcOwner}]: ${decision.justification}`, 'NPC_JUSTIFICATION');
      let lastConquest = null;

      if (decision.action === 'ATTACK') {
        const { attacker, defender } = decision;
        let currentAtt = attacker.soldiers;
        let currentDef = defender.soldiers;
        let result = null;

        while (currentAtt > 1 && currentDef > 0) {
          result = executeDiceRoll(currentAtt, currentDef);
          if (!result) break;
          currentAtt -= result.attackerLosses;
          currentDef -= result.defenderLosses;
        }

        const isConquered = currentDef <= 0;
        const bonus = isConquered ? calculateConquerBonus(defender.originalValue) : 0;

        currentBoard = currentBoard.map(c => {
          if (c.id === attacker.id) {
            return { ...c, soldiers: isConquered ? currentAtt + bonus : currentAtt };
          }
          if (c.id === defender.id) {
            return isConquered 
              ? { ...c, owner: npcOwner, soldiers: 1 } 
              : { ...c, soldiers: currentDef };
          }
          return c;
        });

        if (isConquered) {
          playConquestFeedback();
          lastConquest = {
            id: `${Date.now()}-${defender.id}`,
            attackerId: attacker.id,
            defenderId: defender.id
          };
          setConquestAnimation({
            id: lastConquest.id,
            attackerId: attacker.id,
            defenderId: defender.id
          });
          setTimeout(() => setConquestAnimation(null), 1800);
          const comm = generateCommentary({
            type: 'CONQUEST',
            attacker: npcOwner,
            defender: defender.name,
            bonus
          });
          addLog(comm, 'COMBAT');
        } else {
          addLog(`⚔️ ${npcOwner}'s attack against ${defender.name} failed/ended.`, 'COMBAT');
        }
      }

      setGameState(prev => ({
        ...prev,
        board: currentBoard,
        reinforcedRoundByOwner,
        lastConquest: lastConquest || prev.lastConquest || null,
        winner: currentBoard.every(country => country.owner === npcOwner)
          ? npcOwner
          : prev.winner || null,
        isNewRound: false
      }));

      advanceTurn();
    }, delay);

    return () => clearTimeout(timer);
  }, [gameState?.currentTurn, gameState?.currentRound, fastForward, activeCombat, needsPlayerReinforcements]);

  const handleBattleComplete = (result) => {
    setActiveCombat(false);
    const completesWorldConquest = result.conquered && gameState.board.every(country => (
      country.owner === gameState.playerOwnerName || country.id === result.defenderId
    ));

    setGameState(prev => {
      const updatedBoard = prev.board.map(c => {
        if (c.id === result.attackerId) {
          return { ...c, soldiers: result.finalAttackerSoldiers };
        }
        if (c.id === result.defenderId) {
          if (result.conquered) {
            return { ...c, owner: gameState.playerOwnerName, soldiers: result.finalDefenderSoldiers };
          }
          return { ...c, soldiers: result.finalDefenderSoldiers };
        }
        return c;
      });

      return {
        ...prev,
        board: updatedBoard,
        winner: result.conquered && updatedBoard.every(country => country.owner === prev.playerOwnerName)
          ? prev.playerOwnerName
          : prev.winner || null,
        lastConquest: result.conquered
          ? {
              id: `${Date.now()}-${result.defenderId}`,
              attackerId: result.attackerId,
              defenderId: result.defenderId
            }
          : prev.lastConquest || null
      };
    });

    addLog(
      completesWorldConquest
        ? `🌍 ${gameState.playerOwnerName} captured ${defenderCountry.name} and now rules every territory in the campaign!`
        : result.conquered
          ? `⚔️ ${gameState.playerOwnerName} captured ${defenderCountry.name} from ${defenderCountry.owner}.`
          : `⚔️ ${gameState.playerOwnerName}'s attack on ${defenderCountry.name} was repelled.`,
      'COMBAT'
    );

    if (result.conquered) {
      playConquestFeedback(true);
      setConquestAnimation({
        id: `${Date.now()}-${result.defenderId}`,
        attackerId: result.attackerId,
        defenderId: result.defenderId
      });
      setTimeout(() => {
        setConquestAnimation(null);
        setAttackerCountry(null);
        setDefenderCountry(null);
      }, 1800);
      const comm = generateCommentary({
        type: 'CONQUEST',
        attacker: gameState.playerOwnerName,
        defender: defenderCountry.name,
        bonus: calculateConquerBonus(defenderCountry.originalValue)
      });
      addLog(comm, 'COMBAT');
    }

    if (!result.conquered) {
      setAttackerCountry(null);
      setDefenderCountry(null);
    }

    if (!completesWorldConquest) advanceTurn();
  };

  const handleTransferSoldiers = (sourceId, destinationId, amount) => {
    const source = gameState?.board.find(country => country.id === sourceId);
    const destination = gameState?.board.find(country => country.id === destinationId);
    if (
      activeCombat
      || gameState?.currentTurn !== gameState?.playerOwnerName
      || !source
      || !destination
      || source.id === destination.id
      || source.owner !== gameState.playerOwnerName
      || destination.owner !== gameState.playerOwnerName
      || !Number.isInteger(amount)
      || amount < 1
      || amount >= source.soldiers
    ) {
      setAppMessage('Choose two controlled countries and an amount that leaves at least one soldier behind.');
      return;
    }

    setGameState(prev => ({
      ...prev,
      board: prev.board.map(country => {
        if (country.id === sourceId) return { ...country, soldiers: country.soldiers - amount };
        if (country.id === destinationId) return { ...country, soldiers: country.soldiers + amount };
        return country;
      })
    }));
    addLog(`🪖 ${gameState.playerOwnerName} transferred ${amount} soldiers from ${source.name} to ${destination.name}.`, 'GENERAL');
  };

  const handleSignOut = async () => {
    if (gameState && sessionId && !gameState.isGuest) {
      try {
        await setDoc(doc(db, 'game_sessions', sessionId), {
          ...gameState,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        console.error('Could not save campaign before sign-out:', error);
        throw new Error(`Your campaign could not be saved, so you were not signed out: ${error.message}`);
      }
    }

    await signOut(auth);
    stopAmbientMusic();
    setGameState(null);
    setSessionId(null);
    setIsSettingUpCampaign(false);
    setGuestCommanderName('');
    setMusicEnabled(false);
    setIsGuest(false);
    setAttackerCountry(null);
    setDefenderCountry(null);
    setActiveCombat(false);
    setAppMessage('Signed out. Your campaign is saved to your account and will be ready when you sign back in.');
  };

  const leaveGuestGame = async () => {
    let cleanupError = null;
    if (sessionId) {
      try {
        await deleteDoc(doc(db, 'game_sessions', sessionId));
      } catch (error) {
        cleanupError = error;
      }
    }

    setGameState(null);
    setSessionId(null);
    setIsSettingUpCampaign(false);
    setGuestCommanderName('');
    stopAmbientMusic();
    setMusicEnabled(false);
    setIsGuest(false);
    setAppMessage(cleanupError
      ? `Guest campaign ended locally, but its live session could not be deleted: ${cleanupError.message}`
      : 'Guest campaign ended and its live session was deleted.');
  };

  if (isSpectating) {
    return (
      <SpectatorView
        sessionId={sessionId}
        onExit={() => setIsSpectating(false)}
        themeMode={themeMode}
        musicVolume={musicVolume}
        onMusicVolumeChange={setMusicVolume}
        sfxVolume={sfxVolume}
        onSfxVolumeChange={setSfxVolume}
      />
    );
  }

  const playerCountries = gameState?.board.filter(c => c.owner === gameState?.playerOwnerName) || [];
  const victoryKey = gameState?.winner ? `${sessionId}:${gameState.winner}` : null;
  const playerReinforceBonus = playerCountries.length * 2;

  return (
    <div className="relative min-h-screen font-sans text-white">
      {appMessage && (
        <div role="status" className="fixed left-1/2 top-4 z-40 w-[min(90%,40rem)] -translate-x-1/2 rounded-xl border border-amber-400/30 bg-slate-900/95 p-3 text-center text-sm text-amber-100 shadow-xl">
          {appMessage}
          <button
            onClick={() => setAppMessage('')}
            aria-label="Dismiss message"
            className="ml-3 cursor-pointer text-amber-300 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
      {!gameState ? (
        !authReady ? (
          <div className="battlefield-scene flex min-h-screen items-center justify-center text-sm text-slate-300">
            Loading....
          </div>
        ) : !isSettingUpCampaign ? (
          <LandingPage
            onStartCampaign={startCampaignSetup}
            onWatchLive={() => setIsSpectating(true)}
            musicVolume={musicVolume}
            onMusicVolumeChange={setMusicVolume}
            sfxVolume={sfxVolume}
            onSfxVolumeChange={setSfxVolume}
          />
        ) : (
          <CountrySelectionScreen
            countries={WORLD_COUNTRIES}
            selectedCountry={WORLD_COUNTRIES.find(country => country.id === selectedCountryId)}
            onSelectCountry={country => setSelectedCountryId(country?.id || null)}
            onStartCampaign={startNewGame}
            accountLabel={user?.displayName || guestCommanderName || 'Choose commander name'}
            user={user}
            isGuest={isGuest}
            onOpenProfile={() => setShowAuthModal(true)}
            onSignOut={handleSignOut}
            onLeaveGuest={leaveGuestGame}
            onBackToLanding={() => setIsSettingUpCampaign(false)}
            guestCommanderName={guestCommanderName}
            onGuestCommanderNameChange={setGuestCommanderName}
            themeMode={themeMode}
            musicVolume={musicVolume}
            onMusicVolumeChange={setMusicVolume}
            sfxVolume={sfxVolume}
            onSfxVolumeChange={setSfxVolume}
          />
        )
      ) : (
        <FullMapDashboard
          board={gameState.board}
          campaignRegion={gameState.campaignRegion || 'Africa'}
          sessionId={sessionId}
          commanderName={gameState.playerOwnerName}
          currentTurn={gameState.currentTurn}
          currentRound={gameState.currentRound}
          playerOwnerName={gameState.playerOwnerName}
          logs={gameState.logs}
          onAdvanceTurn={advanceTurn}
          fastForward={fastForward}
          setFastForward={setFastForward}
          attackerCountry={attackerCountry}
          defenderCountry={defenderCountry}
          setAttackerCountry={setAttackerCountry}
          setDefenderCountry={setDefenderCountry}
          setActiveCombat={setActiveCombat}
          onTransferSoldiers={handleTransferSoldiers}
          conquestAnimation={conquestAnimation}
          isGuest={gameState.isGuest}
          accountLabel={user?.displayName || gameState.playerOwnerName}
          user={user}
          onOpenProfile={() => setShowAuthModal(true)}
          onSignOut={handleSignOut}
          onLeaveGuest={leaveGuestGame}
          winner={gameState.winner}
          musicEnabled={musicEnabled}
          soundEnabled={soundEnabled}
          hapticsEnabled={hapticsEnabled}
          onToggleMusic={handleMusicToggle}
          onToggleSound={() => setSoundEnabled(enabled => !enabled)}
          onToggleHaptics={() => setHapticsEnabled(enabled => !enabled)}
          themeMode={themeMode}
          musicVolume={musicVolume}
          onMusicVolumeChange={setMusicVolume}
          sfxVolume={sfxVolume}
          onSfxVolumeChange={setSfxVolume}
        />
      )}

      {showAuthModal && (
        <AuthModal
          user={user}
          onClose={closeAuthModal}
          onAuthenticated={continueCampaignAfterAuth}
          onContinueAsGuest={continueAsGuest}
        />
      )}

      {needsPlayerReinforcements && (
        <ReinforceModal
          playerCountries={playerCountries}
          totalBonus={playerReinforceBonus}
          onComplete={handleReinforceComplete}
        />
      )}

      {activeCombat && attackerCountry && defenderCountry && (
        <CombatModal
          attacker={attackerCountry}
          defender={defenderCountry}
          campaignRegion={gameState.campaignRegion || 'Africa'}
          onBattleComplete={handleBattleComplete}
        />
      )}
      {gameState?.winner === gameState?.playerOwnerName && victoryKey !== dismissedVictoryKey && (
        <VictoryModal
          commanderName={gameState.playerOwnerName}
          onDismiss={() => setDismissedVictoryKey(victoryKey)}
        />
      )}
    </div>
  );
}