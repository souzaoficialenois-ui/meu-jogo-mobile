import React from 'react';
import { GameState, DummyMode } from '../types';
import { ChevronsLeft } from 'lucide-react';

interface TrainingHUDProps {
  state: GameState;
  onReset: () => void;
  onToggleDummy: () => void;
  onExit: () => void;
  currentDummyMode: DummyMode;
}

export const TrainingHUD: React.FC<TrainingHUDProps> = ({ state, onReset, onToggleDummy, onExit, currentDummyMode }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50 p-4">
      {/* Top Bar - Training Info */}
      <div className="flex justify-between items-start pt-20 px-4">
        <div className="bg-black/70 p-4 rounded-xl border border-slate-600 pointer-events-auto backdrop-blur-sm">
            <h3 className="text-yellow-400 font-header text-lg mb-2 border-b border-slate-600 pb-1 tracking-wider">DEBUG DATA</h3>
            <div className="text-xs font-mono space-y-1 text-green-400">
                <div>P1 POS: <span className="text-white">{state.debug?.p1Pos.x}, {state.debug?.p1Pos.y}</span></div>
                <div>P2 POS: <span className="text-white">{state.debug?.p2Pos.x}, {state.debug?.p2Pos.y}</span></div>
                <div>DIST: <span className="text-white">{state.debug?.distance}</span></div>
            </div>
        </div>

        <div className="flex flex-col gap-2 pointer-events-auto">
            <button 
                onClick={onExit}
                className="bg-red-900/90 hover:bg-red-800 px-6 py-2 transform -skew-x-12 border-2 border-red-500 shadow-lg group"
            >
                <span className="block transform skew-x-12 font-header text-white font-bold tracking-wider">EXIT TRAINING</span>
            </button>
        </div>
      </div>

      {/* Side Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 pointer-events-auto">
        <button 
            onClick={onReset}
            className="w-40 bg-slate-800/90 hover:bg-slate-700 px-4 py-4 rounded-l-xl border-r-4 border-yellow-500 shadow-lg flex items-center justify-between transition-all hover:w-44"
        >
            <span className="font-header text-sm text-white">RESET POS</span>
            <ChevronsLeft className="text-yellow-400" size={24} />
        </button>
        
        <button 
            onClick={onToggleDummy}
            className="w-40 bg-slate-800/90 hover:bg-slate-700 px-4 py-4 rounded-l-xl border-r-4 border-blue-500 shadow-lg flex flex-col items-start transition-all hover:w-44"
        >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DUMMY ACTION</span>
            <span className="text-blue-400 font-header text-lg">{currentDummyMode}</span>
        </button>
      </div>
    </div>
  );
};