
import React from 'react';
import { BrickType, ToolMode, BrickDims } from '../types';
import { LEGO_COLORS } from '../constants';
import { MousePointer2, PaintBucket, Trash2, HelpCircle, PlusSquare, Camera, BarChart3, Bomb } from 'lucide-react';
import { playSound } from '../utils/audio';

interface ToolbarProps {
  selectedBrickType: BrickType;
  setSelectedBrickType: (t: BrickType) => void;
  selectedColor: string;
  setSelectedColor: (c: string) => void;
  toolMode: ToolMode;
  setToolMode: (m: ToolMode) => void;
  onGenerateChallenge: () => void;
  onToggleHelp: () => void;
  onOpenCreator: () => void;
  onTakeSnapshot: () => void;
  onToggleStats: () => void;
  onExplode: () => void;
  isLoading: boolean;
  definitions: Record<string, BrickDims>;
}

const Toolbar: React.FC<ToolbarProps> = ({
  selectedBrickType,
  setSelectedBrickType,
  selectedColor,
  setSelectedColor,
  toolMode,
  setToolMode,
  onGenerateChallenge,
  onToggleHelp,
  onOpenCreator,
  onTakeSnapshot,
  onToggleStats,
  onExplode,
  isLoading,
  definitions
}) => {
  
  // Categorize bricks dynamically based on keys and properties
  const allKeys = Object.keys(definitions);

  const baseplates = allKeys.filter(key => key.toLowerCase().includes('baseplate'));
  
  const tiles = allKeys.filter(key => 
    !baseplates.includes(key) && 
    key.toLowerCase().includes('tile')
  );
  
  const plates = allKeys.filter(key => 
    !baseplates.includes(key) && 
    !tiles.includes(key) && 
    key.toLowerCase().includes('plate')
  );
  
  const bricks = allKeys.filter(key => 
    !baseplates.includes(key) && 
    !tiles.includes(key) && 
    !plates.includes(key)
  );

  const renderBrickButton = (type: string) => (
    <button
      key={type}
      onClick={() => {
        playSound('click');
        setToolMode(ToolMode.BUILD);
        setSelectedBrickType(type);
      }}
      className={`p-2 border border-slate-700 rounded text-left transition-all group hover:border-slate-500 ${selectedBrickType === type && toolMode === ToolMode.BUILD ? 'border-retro-cyan bg-retro-accent/50' : ''}`}
    >
      <div className="text-[10px] text-slate-400 group-hover:text-retro-cyan truncate">{definitions[type].label}</div>
      <div className="flex gap-1 items-center mt-1">
         {definitions[type].shape === 'cylinder' ? (
           <div 
             className="h-2 rounded-full bg-current opacity-50 group-hover:opacity-100"
             style={{ width: '8px', height: '8px' }}
           ></div>
         ) : (
           <div 
            className={`h-1.5 bg-current opacity-50 rounded-sm group-hover:opacity-100 ${definitions[type].height < 1 ? 'h-1' : 'h-2'}`}
            style={{ width: `${Math.min(definitions[type].width * 8, 50)}px` }} // Cap width for UI
          ></div>
         )}
         {definitions[type].width > 4 && <span className="text-[8px] text-slate-600">x{definitions[type].width}</span>}
      </div>
    </button>
  );

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-slate-900/90 backdrop-blur-md border-l-4 border-retro-cyan flex flex-col font-mono z-10 shadow-2xl">
      
      {/* Header - Fixed */}
      <div className="p-6 pb-4 border-b-2 border-retro-neon flex justify-between items-center bg-slate-900/50">
        <div>
          <h1 className="text-2xl font-bold text-retro-yellow tracking-widest drop-shadow-[0_0_5px_rgba(255,215,0,0.5)]">
            BRICKMASTER
          </h1>
          <span className="text-xs text-retro-cyan animate-pulse">SYSTEM READY v1.2</span>
        </div>
        <button 
          onClick={() => {
            playSound('click');
            onToggleHelp();
          }}
          className="text-retro-cyan hover:text-white hover:scale-110 transition-transform"
          title="Controls Help"
        >
          <HelpCircle size={24} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        
        {/* Tools */}
        <div className="space-y-3">
          <h2 className="text-retro-cyan text-sm uppercase tracking-wider mb-2 border-l-2 border-retro-neon pl-2">Tools</h2>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => {
                playSound('click');
                setToolMode(ToolMode.BUILD);
              }}
              className={`p-3 rounded border-2 flex justify-center items-center transition-all ${toolMode === ToolMode.BUILD ? 'border-retro-yellow bg-retro-accent text-retro-yellow shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'border-slate-600 text-slate-400 hover:border-retro-cyan'}`}
              title="Build Mode"
            >
              <MousePointer2 size={20} />
            </button>
            <button 
              onClick={() => {
                playSound('click');
                setToolMode(ToolMode.PAINT);
              }}
              className={`p-3 rounded border-2 flex justify-center items-center transition-all ${toolMode === ToolMode.PAINT ? 'border-retro-yellow bg-retro-accent text-retro-yellow shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'border-slate-600 text-slate-400 hover:border-retro-cyan'}`}
              title="Paint Mode"
            >
              <PaintBucket size={20} />
            </button>
            <button 
              onClick={() => {
                playSound('click');
                setToolMode(ToolMode.DELETE);
              }}
              className={`p-3 rounded border-2 flex justify-center items-center transition-all ${toolMode === ToolMode.DELETE ? 'border-retro-neon bg-red-900/30 text-retro-neon shadow-[0_0_10px_rgba(233,69,96,0.5)]' : 'border-slate-600 text-slate-400 hover:border-retro-neon'}`}
              title="Delete Mode"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <h2 className="text-retro-cyan text-sm uppercase tracking-wider mb-2 border-l-2 border-retro-neon pl-2">Operations</h2>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => {
                playSound('click');
                onTakeSnapshot();
              }}
              className="p-3 rounded border-2 border-slate-600 text-slate-400 hover:border-retro-cyan hover:text-retro-cyan hover:bg-slate-800 transition-all flex justify-center"
              title="Snapshot"
            >
              <Camera size={20} />
            </button>
            <button 
              onClick={() => {
                playSound('click');
                onToggleStats();
              }}
              className="p-3 rounded border-2 border-slate-600 text-slate-400 hover:border-green-400 hover:text-green-400 hover:bg-slate-800 transition-all flex justify-center"
              title="Data Analyzer"
            >
              <BarChart3 size={20} />
            </button>
            <button 
              onClick={() => {
                onExplode();
              }}
              className="p-3 rounded border-2 border-slate-600 text-red-500 hover:border-red-500 hover:bg-red-900/30 hover:scale-105 active:scale-95 transition-all flex justify-center"
              title="SYSTEM RESET (EXPLODE)"
            >
              <Bomb size={20} />
            </button>
          </div>
        </div>

        {/* Components */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-l-2 border-retro-neon pl-2">
             <h2 className="text-retro-cyan text-sm uppercase tracking-wider">Components</h2>
             <button 
               onClick={() => {
                 playSound('click');
                 onOpenCreator();
               }}
               className="text-[10px] flex items-center gap-1 bg-retro-accent hover:bg-retro-cyan hover:text-black text-retro-cyan px-2 py-1 rounded border border-retro-cyan/50 transition-all"
             >
               <PlusSquare size={12} /> CREATE
             </button>
          </div>
          
          {/* Bricks Section */}
          <div>
            <h3 className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Standard Bricks</h3>
            <div className="grid grid-cols-2 gap-2">
              {bricks.map(renderBrickButton)}
            </div>
          </div>

          {/* Plates Section */}
          <div>
            <h3 className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Plates</h3>
            <div className="grid grid-cols-2 gap-2">
              {plates.map(renderBrickButton)}
            </div>
          </div>

          {/* Tiles Section */}
          <div>
            <h3 className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Tiles (Smooth)</h3>
            <div className="grid grid-cols-2 gap-2">
              {tiles.map(renderBrickButton)}
            </div>
          </div>

           {/* Baseplates Section */}
           {baseplates.length > 0 && (
            <div>
              <h3 className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Baseplates</h3>
              <div className="grid grid-cols-2 gap-2">
                {baseplates.map(renderBrickButton)}
              </div>
            </div>
           )}
        </div>

        {/* Colors */}
        <div className="space-y-3">
          <h2 className="text-retro-cyan text-sm uppercase tracking-wider mb-2 border-l-2 border-retro-neon pl-2">Palette</h2>
          <div className="grid grid-cols-5 gap-2">
            {LEGO_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => {
                  playSound('click');
                  setSelectedColor(c.hex);
                }}
                className={`w-8 h-8 rounded-sm border-2 transition-transform hover:scale-110 ${selectedColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Footer - Fixed */}
      <div className="p-6 pt-4 border-t-2 border-retro-neon bg-slate-900/50">
        <h2 className="text-retro-yellow text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-retro-neon animate-pulse"></span>
          Mission Control
        </h2>
        <button
          onClick={() => {
            playSound('click');
            onGenerateChallenge();
          }}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-retro-neon text-white font-bold uppercase tracking-widest border-b-4 border-red-800 hover:bg-red-500 hover:border-red-700 active:translate-y-1 active:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'DECODING...' : 'GET NEW MISSION'}
        </button>
        <p className="text-[10px] text-slate-500 mt-2 text-center">Powered by Gemini AI Neural Net</p>
      </div>
    </div>
  );
};

export default Toolbar;
