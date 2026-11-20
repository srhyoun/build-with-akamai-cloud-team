import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { GameState } from '../shared/types.ts';
import { App } from './App.tsx';
import { StartScreen } from './StartScreen.tsx';
import { GameLevelContext } from './gameLevel.ts';
import './style.css';
import './town/theme.css';

function GameEntry() {
  const [level, setLevel] = useState<GameState['level'] | null>(null);

  if (level === null) return <StartScreen onStart={setLevel} />;

  return (
    <GameLevelContext.Provider value={level}>
      <App />
    </GameLevelContext.Provider>
  );
}

const isReplay = new URLSearchParams(window.location.search).has('replay');
createRoot(document.getElementById('root')!).render(isReplay ? <App /> : <GameEntry />);
