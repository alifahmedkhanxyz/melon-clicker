import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TonConnectUIProvider, TonConnectButton } from '@tonconnect/ui-react';
import { GameState, ItemType, GameObject, PopEffect, UserProgress } from './types';
import { submitScore, subscribeToLeaderboard } from './services/firebase';
import { getProgress, saveProgress, markMinedToday } from './services/storage';
import { initAudio, playMelonSound, playBombSound, playIceSound } from './services/audio';
import { Button } from './components/Button';
import { FallingObject } from './components/FallingObject';
import { Leaderboard } from './components/Leaderboard';
import { Play, Hammer, RotateCcw } from 'lucide-react';

// Telegram Web App global
declare global {
  interface Window {
    Telegram: any;
  }
}

const MANIFEST_URL = 'https://raw.githubusercontent.com/ton-community/tutorials/main/03-client/test/public/tonconnect-manifest.json';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [items, setItems] = useState<GameObject[]>([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [popEffects, setPopEffects] = useState<PopEffect[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLB, setLoadingLB] = useState(true);
  
  // Progress State
  const [progress, setProgress] = useState<UserProgress>({
    totalScore: 0,
    playsLeft: 3,
    lastPlayedDate: '',
    lastMinedDate: ''
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const freezeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Refs for game loop to avoid stale closures
  const scoreRef = useRef(0);
  const timeLeftRef = useRef(30);
  const frozenRef = useRef(false);

  // Initialize
  useEffect(() => {
    // Sync progress
    const p = getProgress();
    setProgress(p);

    // Leaderboard
    const unsubscribe = subscribeToLeaderboard((data) => {
      setLeaderboard(data);
      setLoadingLB(false);
    });

    // Telegram
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }

    return () => {
      unsubscribe();
      clearIntervals();
    };
  }, []);

  const clearIntervals = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    if (freezeRef.current) clearTimeout(freezeRef.current);
  };

  const haptic = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    }
  };

  const updateScore = (delta: number) => {
    setScore(prev => {
      const newScore = Math.max(0, prev + delta);
      scoreRef.current = newScore;
      return newScore;
    });
  };

  const startGame = () => {
    if (progress.playsLeft <= 0) {
      alert("No plays left today! Come back tomorrow.");
      return;
    }

    // Initialize audio context on user gesture
    initAudio();

    setScore(0);
    scoreRef.current = 0;
    
    setTimeLeft(30);
    timeLeftRef.current = 30;
    
    setItems([]);
    setIsFrozen(false);
    frozenRef.current = false;
    
    setPopEffects([]);
    setGameState(GameState.PLAYING);

    // Game Timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (frozenRef.current) return; // Don't count down if frozen (optional design choice, kept consistent)
      
      setTimeLeft(prev => {
        const newVal = prev - 1;
        timeLeftRef.current = newVal;
        if (newVal <= 0) {
          endGame();
          return 0;
        }
        return newVal;
      });
    }, 1000);

    // Spawner
    startSpawner();
  };

  const endGame = () => {
    clearIntervals();
    setGameState(GameState.GAME_OVER);
    
    const finalScore = scoreRef.current;
    saveProgress(finalScore, 1);
    
    // Update local state
    setProgress(prev => ({
      ...prev,
      totalScore: prev.totalScore + finalScore,
      playsLeft: prev.playsLeft - 1
    }));

    // Submit to Firebase
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const name = user?.username || user?.first_name || `Rodent-${Math.floor(Math.random()*1000)}`;
    submitScore(name, finalScore);
  };

  const startSpawner = () => {
    if (spawnRef.current) clearInterval(spawnRef.current);
    
    spawnRef.current = setInterval(() => {
      if (frozenRef.current) return;
      
      // Use ref for current time left logic
      const t = timeLeftRef.current;
      const count = t > 15 ? (Math.random() > 0.5 ? 2 : 1) : (Math.random() > 0.3 ? 2 : 1);
      
      for(let i=0; i<count; i++) {
        spawnItem();
      }
    }, 550);
  };

  const spawnItem = () => {
    setItems(prev => {
      if (prev.length > 12) return prev; // Limit objects on screen
      
      const r = Math.random();
      let type = ItemType.MELON;
      if (r > 0.78) type = ItemType.BOMB;
      if (r > 0.94) type = ItemType.ICE;

      return [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        type,
        x: Math.floor(Math.random() * 80) + 10,
        duration: 2 + Math.random() * 2, // 2-4 seconds
        delay: 0
      }];
    });
  };

  const handleHit = useCallback((id: string, type: ItemType, x: number, y: number) => {
    // Remove item
    setItems(prev => prev.filter(i => i.id !== id));

    // Logic
    if (type === ItemType.MELON) {
      playMelonSound();
      updateScore(10);
      haptic('light');
      addPopEffect(x, y, '+10', '#00ff88');
    } else if (type === ItemType.BOMB) {
      playBombSound();
      updateScore(-5);
      haptic('heavy');
      addPopEffect(x, y, '-5', '#ff4757');
      // Shake screen
      document.body.classList.add('animate-shake');
      setTimeout(() => document.body.classList.remove('animate-shake'), 500);
    } else if (type === ItemType.ICE) {
      playIceSound();
      haptic('medium');
      addPopEffect(x, y, '❄️ FREEZE', '#74b9ff');
      triggerFreeze();
    }
  }, []);

  const addPopEffect = (x: number, y: number, text: string, color: string) => {
    const id = Date.now().toString() + Math.random();
    setPopEffects(prev => [...prev, { id, x, y, text, color }]);
    setTimeout(() => {
      setPopEffects(prev => prev.filter(p => p.id !== id));
    }, 600);
  };

  const triggerFreeze = () => {
    setIsFrozen(true);
    frozenRef.current = true;
    
    // Clear timer but don't clear spawner (just let it pause via flag)
    // Actually, we want to pause the countdown visually too?
    // The timer interval checks frozenRef, so it will pause decrementing.
    
    if (freezeRef.current) clearTimeout(freezeRef.current);
    
    freezeRef.current = setTimeout(() => {
      setIsFrozen(false);
      frozenRef.current = false;
    }, 2000);
  };

  const handleMiss = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const handleDailyMine = () => {
    const today = new Date().toDateString();
    if (progress.lastMinedDate === today) {
      alert("Already mined today!");
      return;
    }
    const reward = Math.floor(Math.random() * 600) + 300;
    markMinedToday(reward);
    setProgress(prev => ({
      ...prev,
      totalScore: prev.totalScore + reward,
      lastMinedDate: today
    }));
    playMelonSound(); // Small reward sound
    alert(`Mined ${reward} Melons!`);
    haptic('medium');
  };

  return (
    <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
      <div className="relative min-h-screen flex flex-col items-center font-sans text-white overflow-hidden">
        
        {/* Header */}
        <div className="z-20 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/20 to-transparent">
           <h1 className="text-2xl font-black drop-shadow-md">🍈 Rodent Royal</h1>
           <div className="bg-black/30 px-3 py-1 rounded-full text-sm font-mono backdrop-blur">
             Total: {progress.totalScore}
           </div>
        </div>

        {/* Game Area */}
        <div className="relative w-full flex-grow max-w-2xl mx-auto">
          
          {gameState === GameState.MENU && (
             <div className="flex flex-col items-center justify-center h-full p-6 space-y-6 animate-fade-in">
                <div className="text-6xl animate-bounce">🐹</div>
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-center w-full">
                  <div className="text-lg mb-2 text-white/80">Plays Left Today</div>
                  <div className="text-4xl font-black text-yellow-300">{progress.playsLeft}/3</div>
                </div>

                <Button 
                  onClick={startGame} 
                  disabled={progress.playsLeft <= 0}
                  className="text-xl py-4 flex items-center gap-2 justify-center w-64"
                >
                  <Play fill="currentColor" /> PLAY GAME
                </Button>

                <div className="flex gap-4 w-full justify-center">
                  <Button variant="secondary" onClick={handleDailyMine}>
                    <Hammer size={18} className="mr-2 inline" /> Daily Mine
                  </Button>
                  <div className="rounded-2xl overflow-hidden shadow-lg">
                     <TonConnectButton />
                  </div>
                </div>

                <Leaderboard scores={leaderboard} loading={loadingLB} />
             </div>
          )}

          {gameState === GameState.PLAYING && (
            <div className="absolute inset-0 overflow-hidden rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm m-2 shadow-2xl">
              {/* HUD */}
              <div className="absolute top-4 left-0 right-0 flex justify-center z-20">
                <div className={`px-6 py-2 rounded-full font-black text-4xl shadow-lg border-2 border-white/20 backdrop-blur-md transition-all duration-300 ${timeLeft <= 5 ? 'bg-red-500/80 animate-pulse scale-110' : 'bg-black/30'}`}>
                  {timeLeft}
                </div>
              </div>
              <div className="absolute top-4 right-4 z-20 text-2xl font-bold drop-shadow-lg text-yellow-300">
                {score} 🍈
              </div>

              {/* Items */}
              {items.map(item => (
                <FallingObject 
                  key={item.id} 
                  data={item} 
                  isFrozen={isFrozen} 
                  onHit={handleHit} 
                  onMiss={handleMiss} 
                />
              ))}

              {/* Pop Effects */}
              {popEffects.map(pop => (
                <div 
                  key={pop.id}
                  className="absolute font-black text-4xl z-30 pointer-events-none animate-pop"
                  style={{ 
                    left: pop.x - 20, 
                    top: pop.y - 50,
                    color: pop.color,
                    textShadow: `0 0 10px ${pop.color}`
                  }}
                >
                  {pop.text}
                </div>
              ))}
              
              {isFrozen && (
                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center pointer-events-none z-0">
                  <div className="text-9xl opacity-20 rotate-12">❄️</div>
                </div>
              )}
            </div>
          )}

          {(gameState === GameState.GAME_OVER || gameState === GameState.ALL_DONE) && (
            <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in space-y-6">
              <div className="text-6xl">🎉</div>
              <h2 className="text-4xl font-black">Time's Up!</h2>
              
              <div className="bg-white/20 p-8 rounded-3xl backdrop-blur-md text-center border border-white/30 shadow-xl w-full max-w-xs">
                <div className="text-white/80 text-lg">Score</div>
                <div className="text-6xl font-black text-yellow-300 mb-4">{score}</div>
                <div className="h-px bg-white/30 my-4"></div>
                <div className="text-white/80">Total Melons</div>
                <div className="text-2xl font-bold">{progress.totalScore}</div>
              </div>

              <div className="flex flex-col gap-3 w-full max-w-xs">
                 <Button onClick={() => setGameState(GameState.MENU)}>
                   <RotateCcw className="inline mr-2"/> Back to Menu
                 </Button>
              </div>
            </div>
          )}

        </div>
        
        {/* Footer */}
        <div className="p-4 text-xs text-white/40 text-center">
          Rodent Royal • Built on TON • React
        </div>
      </div>
    </TonConnectUIProvider>
  );
};

export default App;
