import React from 'react';
import { BrickType, ToolMode, BrickDims } from '../types';
import { LEGO_COLORS } from '../constants';
import { MousePointer2, PaintBucket, Trash2, HelpCircle, Plus, Camera, BarChart3, Bomb, Component, RotateCcw, Save, Download, SunMedium, Moon, Sunset, SplitSquareHorizontal } from 'lucide-react';
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
  symmetryMode: boolean;
  setSymmetryMode: (m: boolean) => void;
  environmentPreset: string;
  setEnvironmentPreset: (env: string) => void;
  onSaveLocal: () => void;
  onLoadLocal: () => void;
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
  definitions,
  symmetryMode,
  setSymmetryMode,
  environmentPreset,
  setEnvironmentPreset,
  onSaveLocal,
  onLoadLocal
}) => {

  // Categorize bricks dynamically based on keys and properties
  const allKeys = Object.keys(definitions);

  const baseplates = allKeys.filter(key => key.toLowerCase().includes('baseplate'));

  const openings = allKeys.filter(key =>
    key.toLowerCase().includes('window') ||
    key.toLowerCase().includes('door')
  );

  const tiles = allKeys.filter(key =>
    !baseplates.includes(key) &&
    !openings.includes(key) &&
    key.toLowerCase().includes('tile')
  );

  const plates = allKeys.filter(key =>
    !baseplates.includes(key) &&
    !tiles.includes(key) &&
    !openings.includes(key) &&
    key.toLowerCase().includes('plate')
  );

  const bricks = allKeys.filter(key =>
    !baseplates.includes(key) &&
    !tiles.includes(key) &&
    !plates.includes(key) &&
    !openings.includes(key)
  );

  const renderBrickButton = (type: string) => {
    const isSelected = selectedBrickType === type && toolMode === ToolMode.BUILD;
    return (
      <button
        key={type}
        onClick={() => {
          playSound('click');
          setToolMode(ToolMode.BUILD);
          setSelectedBrickType(type);
        }}
        className={`p-3 rounded-xl flex flex-col items-start gap-2 transition-all duration-300 ${isSelected
          ? 'bg-brand-500 border border-brand-400 shadow-[0_4px_20px_rgba(14,165,233,0.4)] text-white'
          : 'glass-panel hover:bg-white/10 text-slate-300 hover:text-white border border-white/5'
          }`}
      >
        <div className="flex gap-1 items-center">
          {definitions[type].shape === 'cylinder' ? (
            <div
              className="h-3 rounded-full bg-current opacity-70"
              style={{ width: '12px', height: '12px' }}
            ></div>
          ) : definitions[type].shape === 'window' || definitions[type].shape === 'door' ? (
            <div
              className="h-3 border-2 border-current opacity-70 rounded-[2px]"
              style={{ width: '18px', height: '14px' }}
            ></div>
          ) : (
            <div
              className={`bg-current opacity-70 rounded-[2px] ${definitions[type].height < 1 ? 'h-1.5' : 'h-3'}`}
              style={{ width: `${Math.min(definitions[type].width * 8, 40)}px` }}
            ></div>
          )}
          {definitions[type].width > 4 && <span className="text-[10px] opacity-70 font-mono ml-1">x{definitions[type].width}</span>}
        </div>
        <div className="text-[11px] font-medium tracking-wide truncate w-full group-hover:text-white capitalize text-left">
          {definitions[type].label.toLowerCase()}
        </div>
      </button>
    );
  };

  return (
    <div className="absolute top-4 right-4 bottom-4 w-80 glass-panel rounded-3xl flex flex-col z-10 shadow-2xl border border-white/10 overflow-hidden">

      {/* Header */}
      <div className="p-6 pb-4 border-b border-white/10 bg-slate-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500 rounded-full blur-[60px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
              <Component className="text-brand-400" size={24} />
              Builder<span className="text-brand-400">Pro</span>
            </h1>
            <span className="text-[10px] text-brand-300 font-mono tracking-widest uppercase mt-1 block opacity-80">v2.0 Glass Edition</span>
          </div>
          <button
            onClick={() => {
              playSound('click');
              onToggleHelp();
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center btn-glass text-slate-300 hover:text-white group"
            title="Controls & Help"
          >
            <HelpCircle size={20} className="group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar relative z-10">

        {/* Tools */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent flex-1 opacity-50"></div>
            <h2 className="text-brand-300 text-[10px] font-mono uppercase tracking-[0.2em]">Tools</h2>
            <div className="h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent flex-1 opacity-50"></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => {
                playSound('click');
                setToolMode(ToolMode.BUILD);
              }}
              className={`p-4 rounded-2xl flex flex-col justify-center items-center gap-2 transition-all duration-300 ${toolMode === ToolMode.BUILD ? 'btn-active translate-y-[-2px]' : 'btn-glass text-slate-400'}`}
              title="Build Mode (1)"
            >
              <MousePointer2 size={22} className={toolMode === ToolMode.BUILD ? 'animate-bounce' : ''} />
              <span className="text-[9px] uppercase tracking-wider font-bold">Build</span>
            </button>
            <button
              onClick={() => {
                playSound('click');
                setToolMode(ToolMode.PAINT);
              }}
              className={`p-4 rounded-2xl flex flex-col justify-center items-center gap-2 transition-all duration-300 ${toolMode === ToolMode.PAINT ? 'btn-active translate-y-[-2px]' : 'btn-glass text-slate-400'}`}
              title="Paint Mode (2)"
            >
              <PaintBucket size={22} />
              <span className="text-[9px] uppercase tracking-wider font-bold">Paint</span>
            </button>
            <button
              onClick={() => {
                playSound('click');
                setToolMode(ToolMode.DELETE);
              }}
              className={`p-4 rounded-2xl flex flex-col justify-center items-center gap-2 transition-all duration-300 ${toolMode === ToolMode.DELETE ? 'bg-rose-500 border-none shadow-[0_4px_15px_rgba(244,63,94,0.4)] text-white translate-y-[-2px]' : 'btn-glass text-slate-400 hover:text-rose-400'}`}
              title="Delete Mode (3)"
            >
              <Trash2 size={22} />
              <span className="text-[9px] uppercase tracking-wider font-bold">Erase</span>
            </button>
          </div>
        </div>

        {/* Actions & Environment */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent flex-1 opacity-50"></div>
            <h2 className="text-brand-300 text-[10px] font-mono uppercase tracking-[0.2em]">Options</h2>
            <div className="h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent flex-1 opacity-50"></div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => { playSound('click'); setSymmetryMode(!symmetryMode); }}
              className={`p-3 rounded-2xl flex flex-col items-center gap-1 group transition-all duration-300 ${symmetryMode ? 'btn-active translate-y-[-2px]' : 'btn-glass text-slate-400 hover:text-brand-300'}`}
              title="Toggle Symmetry Mode"
            >
              <SplitSquareHorizontal size={16} className={symmetryMode ? 'animate-pulse' : ''} />
              <span className="text-[8px] uppercase tracking-wider font-bold">Mirror</span>
            </button>

            <button
              onClick={() => {
                playSound('click');
                const envs = ['city', 'sunset', 'dawn', 'night', 'studio', 'warehouse'];
                const nextIndex = (envs.indexOf(environmentPreset) + 1) % envs.length;
                setEnvironmentPreset(envs[nextIndex]);
              }}
              className="p-3 rounded-2xl btn-glass flex flex-col items-center gap-1 hover:text-amber-300 group"
              title="Cycle Lighting/Environment"
            >
              {environmentPreset === 'night' ? <Moon size={16} className="group-hover:scale-110 transition-transform" /> : <SunMedium size={16} className="group-hover:scale-110 transition-transform" />}
              <span className="text-[8px] uppercase tracking-wider opacity-70">Light</span>
            </button>
            <button
              onClick={onSaveLocal}
              className="p-3 rounded-2xl btn-glass flex flex-col items-center gap-1 hover:text-brand-300 group"
              title="Save Project Locally"
            >
              <Save size={16} className="group-hover:scale-110 transition-transform" />
              <span className="text-[8px] uppercase tracking-wider opacity-70">Save</span>
            </button>
            <button
              onClick={onLoadLocal}
              className="p-3 rounded-2xl btn-glass flex flex-col items-center gap-1 hover:text-brand-300 group"
              title="Load Local Project"
            >
              <Download size={16} className="group-hover:scale-110 transition-transform" />
              <span className="text-[8px] uppercase tracking-wider opacity-70">Load</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2">
            <button
              onClick={() => { playSound('click'); onTakeSnapshot(); }}
              className="p-3 rounded-2xl btn-glass flex flex-col items-center gap-1 hover:text-brand-300 group"
              title="Capture Image"
            >
              <Camera size={16} className="group-hover:scale-110 transition-transform" />
              <span className="text-[8px] uppercase tracking-wider opacity-70">Capture</span>
            </button>
            <button
              onClick={() => { playSound('click'); onToggleStats(); }}
              className="p-3 rounded-2xl btn-glass flex flex-col items-center gap-1 hover:text-emerald-400 group"
              title="Data Analyzer"
            >
              <BarChart3 size={16} className="group-hover:scale-110 transition-transform" />
              <span className="text-[8px] uppercase tracking-wider opacity-70">Stats</span>
            </button>
            <button
              onClick={onExplode}
              className="p-3 rounded-2xl btn-glass flex flex-col items-center gap-1 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 group"
              title="Reset Environment"
            >
              <RotateCcw size={16} className="group-hover:-rotate-180 transition-transform duration-500" />
              <span className="text-[8px] uppercase tracking-wider opacity-70">Reset</span>
            </button>
          </div>
        </div>

        {/* Components */}
        <div className="space-y-5">
          <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
            <h2 className="text-brand-200 text-xs font-semibold uppercase tracking-widest flex items-center gap-2">
              Pieces
            </h2>
            <button
              onClick={() => {
                playSound('click');
                onOpenCreator();
              }}
              className="p-1.5 bg-brand-500/20 hover:bg-brand-500 text-brand-300 hover:text-white rounded flex items-center gap-1 transition-all text-xs"
              title="Create Custom Piece"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-[10px] text-slate-400 mb-3 uppercase tracking-widest font-mono pl-1 border-l-2 border-brand-500">Standard</h3>
              <div className="grid grid-cols-2 gap-2">
                {bricks.map(renderBrickButton)}
              </div>
            </div>

            {openings.length > 0 && (
              <div>
                <h3 className="text-[10px] text-slate-400 mb-3 uppercase tracking-widest font-mono pl-1 border-l-2 border-brand-500">Architecture</h3>
                <div className="grid grid-cols-2 gap-2">
                  {openings.map(renderBrickButton)}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-[10px] text-slate-400 mb-3 uppercase tracking-widest font-mono pl-1 border-l-2 border-brand-500">Plates</h3>
              <div className="grid grid-cols-2 gap-2">
                {plates.map(renderBrickButton)}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] text-slate-400 mb-3 uppercase tracking-widest font-mono pl-1 border-l-2 border-brand-500">Smooth Tiles</h3>
              <div className="grid grid-cols-2 gap-2">
                {tiles.map(renderBrickButton)}
              </div>
            </div>

            {baseplates.length > 0 && (
              <div>
                <h3 className="text-[10px] text-slate-400 mb-3 uppercase tracking-widest font-mono pl-1 border-l-2 border-brand-500">Foundation</h3>
                <div className="grid grid-cols-2 gap-2">
                  {baseplates.map(renderBrickButton)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-4 pb-4">
          <div className="flex items-center gap-2 mb-3 mt-4">
            <div className="h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent flex-1 opacity-50"></div>
            <h2 className="text-brand-300 text-[10px] font-mono uppercase tracking-[0.2em]">Color Engine</h2>
            <div className="h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent flex-1 opacity-50"></div>
          </div>
          <div className="grid grid-cols-5 gap-3 bg-black/20 p-4 rounded-2xl border border-white/5">
            {LEGO_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => {
                  playSound('click');
                  setSelectedColor(c.hex);
                }}
                className={`w-10 h-10 rounded-full transition-all duration-300 relative group overflow-hidden ${selectedColor === c.hex ? 'scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)] ring-2 ring-white ring-offset-2 ring-offset-[#0f172a]' : 'hover:scale-105 border border-white/10'}`}
                title={c.name}
              >
                <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: c.hex }}></div>
                {/* Glossy top highlight */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent"></div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="p-5 border-t border-white/10 bg-slate-900/60 backdrop-blur-md relative overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-50 rounded-b-3xl"></div>
        <button
          onClick={() => {
            playSound('click');
            onGenerateChallenge();
          }}
          disabled={isLoading}
          className="w-full py-4 px-4 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white font-bold uppercase tracking-widest text-xs rounded-xl border border-white/20 hover:border-white/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait transition-all flex items-center justify-center gap-2 group"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <span className="group-hover:text-brand-300 transition-colors">Generate Challenge</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
