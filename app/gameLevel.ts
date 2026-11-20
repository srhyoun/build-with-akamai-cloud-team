import { createContext } from 'react';
import type { GameState } from '../shared/types.ts';

export const GameLevelContext = createContext<GameState['level']>(2);
