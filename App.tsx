import React, { useState, useRef, useEffect, useCallback } from 'react';
import Scene from './components/Scene';
import Toolbar from './components/Toolbar';
import { BrickData, BrickType, ToolMode, Challenge, BrickDims } from './types';
import { LEGO_COLORS, DEFAULT_BRICK_DEFINITIONS, BRICK_HEIGHT, PLATE_HEIGHT, STUD_SIZE } from './constants';
import { generateChallenge } from './services/geminiService';
import { X, MousePointer2, RotateCw, Move, ChevronUp, Save, Download, HardDrive, Camera, Sparkles, Plus, Check } from 'lucide-react';
import { playSound } from './utils/audio';

const App: React.FC = () => {
  const [bricks, setBricks] = useState<BrickData[]>([]);
  const [history, setHistory] = useState<BrickData[][]>([]);
  const [brickDefinitions, setBrickDefinitions] = useState<Record<string, BrickDims>>(DEFAULT_BRICK_DEFINITIONS);
  const [selectedBrickType, setSelectedBrickType] = useState<BrickType>(BrickType.TWO_BY_FOUR);
  const [selectedColor, setSelectedColor] = useState<string>(LEGO_COLORS[0].hex);
  const [toolMode, setToolMode] = useState<ToolMode>(ToolMode.BUILD);
  const [lockedLayer, setLockedLayer] = useState<number | null>(null);

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Snapshot state
  const [snapshotImg, setSnapshotImg] = useState<string | null>(null);
  const sceneActionRef = useRef<{ capture: () => string } | null>(null);

  // Explosion state
  const [isExploding, setIsExploding] = useState(false);

  // Creator State
  const [newPieceName, setNewPieceName] = useState('');
  const [newPieceWidth, setNewPieceWidth] = useState(2);
  const [newPieceDepth, setNewPieceDepth] = useState(4);
  const [newPieceStyle, setNewPieceStyle] = useState<'brick' | 'plate' | 'tile'>('brick');

  // Wrapper for setBricks that saves history
  const handleSetBricks = useCallback((action: React.SetStateAction<BrickData[]>) => {
    const newState = typeof action === 'function' ? (action as Function)(bricks) : action;

    // Only save history if state actually changes
    if (newState !== bricks) {
      setHistory(prev => [...prev, bricks]);
      setBricks(newState);
    }
  }, [bricks]);

  // Global Keyboard Shortcuts (Undo + Tools)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if user is typing in an input field (e.g. Creator modal)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Tool Switching
      if (e.key === '1') {
        setToolMode(ToolMode.BUILD);
        playSound('click');
      } else if (e.key === '2') {
        setToolMode(ToolMode.PAINT);
        playSound('click');
      } else if (e.key === '3') {
        setToolMode(ToolMode.DELETE);
        playSound('click');
      }

      // Undo Logic
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (isExploding) return;

        setHistory(currentHistory => {
          if (currentHistory.length > 0) {
            const previousState = currentHistory[currentHistory.length - 1];
            setBricks(previousState);
            playSound('delete'); // Feedback sound
            return currentHistory.slice(0, -1);
          }
          return currentHistory;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExploding]);

  const handleGenerateChallenge = async () => {
    setIsGenerating(true);
    try {
      const themes = ["Space Police", "Blacktron", "Castle", "Pirates", "Aquazone", "Ice Planet"];
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];
      const result = await generateChallenge(randomTheme);
      setChallenge(result);
      setShowChallenge(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExplode = () => {
    if (bricks.length === 0) return;
    playSound('explode');
    setIsExploding(true);
    setTimeout(() => {
      handleSetBricks([]); // Uses wrapper to ensure we can undo the explosion
      setIsExploding(false);
      setLockedLayer(null);
    }, 1500); // Clear after animation
  };

  const handleTakeSnapshot = () => {
    if (sceneActionRef.current) {
      playSound('shutter');
      const imgData = sceneActionRef.current.capture();
      setSnapshotImg(imgData);
    }
  };

  const handleCreatePiece = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPieceName) return;

    let height = BRICK_HEIGHT;
    let hasStuds = true;
    let prefix = 'custom';

    if (newPieceStyle === 'plate') {
      height = PLATE_HEIGHT;
      prefix = 'plate_custom';
    } else if (newPieceStyle === 'tile') {
      height = PLATE_HEIGHT;
      hasStuds = false;
      prefix = 'tile_custom';
    }

    const id = `${prefix}_${newPieceWidth}x${newPieceDepth}_${Date.now()}`;

    const newDef: BrickDims = {
      width: newPieceWidth,
      depth: newPieceDepth,
      height,
      hasStuds,
      label: newPieceName
    };

    setBrickDefinitions(prev => ({
      ...prev,
      [id]: newDef
    }));

    // Select the new piece
    setSelectedBrickType(id);
    setShowCreator(false);

    // Reset form
    setNewPieceName('');
    setNewPieceWidth(2);
    setNewPieceDepth(4);
    setNewPieceStyle('brick');
  };

  // Stats Calculations
  const calculateStats = () => {
    let totalStuds = 0;
    let totalWeight = 0;
    const colorCounts: Record<string, number> = {};

    bricks.forEach(b => {
      const def = brickDefinitions[b.type];
      if (!def) return;
      const studs = def.width * def.depth;
      totalStuds += studs;

      // Rough volume estimate for weight/price
      const volume = studs * def.height;
      totalWeight += volume;

      colorCounts[b.color] = (colorCounts[b.color] || 0) + 1;
    });

    // 1999 Pricing Algorithm: ~10 cents per piece average
    const estimatedPrice = (bricks.length * 0.10) + (totalStuds * 0.01);

    return { totalStuds, totalWeight, colorCounts, estimatedPrice };
  };

  const stats = calculateStats();

  return (
    <div className="w-full h-screen bg-transparent relative overflow-hidden font-sans text-slate-100 selection:bg-brand-500/30">

      {/* 3D Viewport */}
      <div className="absolute inset-0 z-0">
        <Scene
          bricks={bricks}
          setBricks={handleSetBricks}
          selectedColor={selectedColor}
          selectedBrickType={selectedBrickType}
          toolMode={toolMode}
          lockedLayer={lockedLayer}
          setLockedLayer={setLockedLayer}
          definitions={brickDefinitions}
          sceneActionRef={sceneActionRef}
          isExploding={isExploding}
        />
      </div>

      {/* HUD Elements */}
      <div className="absolute top-4 left-4 pointer-events-none select-none z-10 flex gap-4">
        <div className="glass-panel text-slate-300 text-xs px-4 py-3 rounded-2xl flex items-center gap-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-2">
            <div className="text-white font-medium uppercase tracking-widest text-[10px] opacity-60">Status</div>
            <div className="flex items-center gap-1.5 bg-brand-500/10 text-brand-300 px-2 py-1 rounded-full border border-brand-500/20">
              <div className={`w-1.5 h-1.5 bg-brand-400 rounded-full shadow-[0_0_8px_#38bdf8] ${isExploding ? 'animate-ping' : 'animate-pulse'}`} />
              <span className="font-semibold text-[10px] tracking-wider uppercase">Live</span>
            </div>
          </div>
          <div className="h-6 w-px bg-white/10"></div>
          <div className="flex gap-4 font-mono">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest opacity-50 font-sans">Bricks</span>
              <span className="text-white font-medium">{bricks.length.toString().padStart(3, '0')}</span>
            </div>
            {lockedLayer !== null && (
              <div className="flex flex-col">
                <span className="text-[9px] uppercase text-rose-400 tracking-widest font-sans">Layer Lock</span>
                <span className="text-rose-100 font-medium">L {lockedLayer.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar
        selectedBrickType={selectedBrickType}
        setSelectedBrickType={setSelectedBrickType}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        toolMode={toolMode}
        setToolMode={setToolMode}
        onGenerateChallenge={handleGenerateChallenge}
        onToggleHelp={() => setShowHelp(true)}
        onOpenCreator={() => setShowCreator(true)}
        onTakeSnapshot={handleTakeSnapshot}
        onToggleStats={() => setShowStats(true)}
        onExplode={handleExplode}
        isLoading={isGenerating}
        definitions={brickDefinitions}
      />

      {/* Glass Modals Structure Helper */}
      {/* Help Modal */}
      {showHelp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="glass-panel p-8 rounded-[2rem] w-full max-w-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/20 relative">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            <div className="mb-8">
              <h2 className="text-3xl font-display font-bold text-white tracking-tight mb-2 flex items-center gap-3">
                <span className="bg-brand-500/20 text-brand-300 p-2 rounded-xl border border-brand-500/20"><Sparkles size={24} /></span>
                Studio Guide
              </h2>
              <p className="text-slate-400 text-sm">Master your workspace with these essential controls.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-500/20 border border-brand-500/30 text-brand-400">
                  <MousePointer2 size={18} />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm mb-1">Place Brick</div>
                  <div className="text-xs text-slate-400 leading-relaxed">Click to position. Or hit <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-[10px]">ENTER</span> on keyboard.</div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                  <RotateCw size={18} />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm mb-1">Rotate</div>
                  <div className="text-xs text-slate-400 leading-relaxed">Tap <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-[10px]">R</span> to rotate clockwise.</div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/20 border border-amber-500/30 text-amber-400">
                  <Move size={18} />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm mb-1">Nudge & Elevate</div>
                  <div className="text-xs text-slate-400 leading-relaxed mb-1">Use <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-[10px]">W/A/S/D</span> to nudge.</div>
                  <div className="text-xs text-slate-400 leading-relaxed">Hold <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-[10px]">SHIFT</span> + W/S to adjust layer height lock.</div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/20 border border-rose-500/30 text-rose-400">
                  <RotateCw size={18} className="rotate-180" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm mb-1">Undo Last</div>
                  <div className="text-xs text-slate-400 leading-relaxed">Hit <span className="bg-white/10 px-1.5 py-0.5 rounded text-white font-mono text-[10px]">CMD/CTRL + Z</span> to rewind.</div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-8 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                Start Creating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot Modal */}
      {snapshotImg && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4">
          <div className="relative animate-in fade-in zoom-in duration-500 flex flex-col items-center max-w-2xl w-full">
            <button
              onClick={() => setSnapshotImg(null)}
              className="absolute -top-12 right-0 text-slate-400 hover:text-white bg-white/10 p-2 rounded-full backdrop-blur-md transition-all z-10 hover:rotate-90 hover:bg-rose-500 hover:text-white"
            >
              <X size={24} />
            </button>
            <div className="glass-panel p-6 pb-20 rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.6)] border border-white/20 w-full rotate-1 hover:rotate-0 transition-all duration-700">
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-inner border border-white/10 bg-black/50">
                <img src={snapshotImg} alt="Masterpiece" className="w-full h-full object-contain" />
              </div>
              <div className="mt-6 flex justify-between items-end px-4 relative">
                <div className="absolute top-4 left-6 opacity-30 blur-[20px] w-32 h-10 bg-brand-500 rounded-full"></div>
                <div className="relative z-10">
                  <p className="font-display font-medium text-2xl text-white tracking-tight">Masterpiece</p>
                  <p className="text-brand-300 text-sm font-mono tracking-widest mt-1 uppercase opacity-80">{new Date().toLocaleDateString()}</p>
                </div>
                <a
                  href={snapshotImg}
                  download={`builder-pro-${Date.now()}.png`}
                  className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white px-5 py-2.5 rounded-xl font-medium shadow-[0_4px_15px_rgba(14,165,233,0.4)] transition-all active:scale-95"
                >
                  <Download size={18} />
                  <span>Save HD File</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStats && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xl p-4">
          <div className="glass-panel border border-white/20 p-8 rounded-[2rem] w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden">

            {/* Background glow */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500 opacity-20 blur-[60px] rounded-full"></div>

            <button
              onClick={() => setShowStats(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/20">
                <HardDrive size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-white tracking-tight">Analytics</h2>
                <p className="text-emerald-400/80 text-xs font-mono uppercase tracking-widest">Model Data</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                <span className="text-slate-400 text-sm font-medium">Total Elements</span>
                <span className="text-white font-display text-xl font-bold bg-white/10 px-3 py-1 rounded-lg">{bricks.length}</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                <span className="text-slate-400 text-sm font-medium">Rendered Studs</span>
                <span className="text-white font-display text-xl font-bold bg-white/10 px-3 py-1 rounded-lg">{stats.totalStuds}</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                <span className="text-slate-400 text-sm font-medium">Est. Net Weight</span>
                <span className="text-white font-display text-xl font-bold bg-white/10 px-3 py-1 rounded-lg">{stats.totalWeight.toFixed(1)}g</span>
              </div>

              <div className="relative mt-6 pt-6">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
                <div className="flex justify-between items-center group cursor-help">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Market Value</span>
                    <div className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] items-center border border-white/10 group-hover:bg-slate-700 transition-colors">?</div>
                  </div>
                  <span className="text-emerald-400 font-display text-2xl font-bold drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]">
                    ${stats.estimatedPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-black/30 rounded-2xl p-5 border border-white/5 relative overflow-hidden">
              <p className="uppercase text-[10px] text-slate-500 mb-3 tracking-widest font-mono">Palette Usage</p>
              <div className="h-28 overflow-y-auto pr-3 custom-scrollbar flex flex-col gap-2 relative z-10">
                {Object.keys(stats.colorCounts).length === 0 ? (
                  <div className="text-slate-600 text-sm text-center py-4">No data</div>
                ) : (
                  Object.entries(stats.colorCounts).map(([color, count]) => {
                    const perc = Math.round((count / bricks.length) * 100);
                    return (
                      <div key={color} className="flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-md shadow-inner border border-white/20" style={{ backgroundColor: color }}></div>
                          <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">
                            {LEGO_COLORS.find(c => c.hex === color)?.name || color}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-400 rounded-full" style={{ width: `${perc}%` }}></div>
                          </div>
                          <span className="text-xs font-mono text-slate-400 w-8 text-right block">{count}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Piece Fabricator Modal */}
      {showCreator && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xl p-4">
          <div className="glass-panel border border-white/20 p-8 rounded-[2rem] w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden">

            {/* Background glow */}
            <div className="absolute -top-20 -left-20 w-48 h-48 bg-purple-500 opacity-20 blur-[60px] rounded-full"></div>

            <button
              onClick={() => setShowCreator(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="bg-purple-500/20 text-purple-400 p-2.5 rounded-xl border border-purple-500/20">
                <Component size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-white tracking-tight">Fabricator</h2>
                <p className="text-purple-400/80 text-xs font-mono uppercase tracking-widest">Tooling Lab</p>
              </div>
            </div>

            <form onSubmit={handleCreatePiece} className="space-y-6 relative z-10 text-left">

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Designation Name</label>
                <input
                  type="text"
                  value={newPieceName}
                  onChange={(e) => setNewPieceName(e.target.value)}
                  placeholder="e.g. Master Engine Block"
                  className="w-full bg-black/40 border-2 border-white/10 rounded-xl p-4 text-white focus:border-purple-400/50 focus:ring-4 focus:ring-purple-500/20 focus:outline-none transition-all placeholder:text-slate-600"
                  maxLength={25}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Width (X)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newPieceWidth}
                      onChange={(e) => setNewPieceWidth(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                      className="w-full bg-transparent border-b-2 border-white/10 pb-2 text-2xl text-white font-display focus:border-purple-400 focus:outline-none transition-all text-center placeholder:text-slate-600"
                      min="1"
                      max="20"
                    />
                  </div>
                </div>
                <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Depth (Z)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newPieceDepth}
                      onChange={(e) => setNewPieceDepth(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                      className="w-full bg-transparent border-b-2 border-white/10 pb-2 text-2xl text-white font-display focus:border-purple-400 focus:outline-none transition-all text-center placeholder:text-slate-600"
                      min="1"
                      max="20"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-3 uppercase tracking-wide">Chassis Class</label>
                <div className="grid grid-cols-3 gap-3 p-1 bg-black/30 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setNewPieceStyle('brick')}
                    className={`p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${newPieceStyle === 'brick' ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <span className="font-semibold text-sm">Brick</span>
                    <span className="text-[9px] opacity-70">Std. 1.2u</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPieceStyle('plate')}
                    className={`p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${newPieceStyle === 'plate' ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <span className="font-semibold text-sm">Plate</span>
                    <span className="text-[9px] opacity-70">Low 0.4u</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPieceStyle('tile')}
                    className={`p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${newPieceStyle === 'tile' ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <span className="font-semibold text-sm">Tile</span>
                    <span className="text-[9px] opacity-70">Smooth</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 mt-4 bg-white text-purple-900 font-bold rounded-xl hover:bg-slate-200 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] flex justify-center items-center gap-2"
              >
                <Plus size={20} /> Build Component
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Challenge Modal */}
      {showChallenge && challenge && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 animate-in zoom-in duration-500">
          <div className="glass-panel border-2 border-brand-400/50 p-10 rounded-[2.5rem] max-w-lg w-full shadow-[0_0_80px_rgba(14,165,233,0.3)] relative overflow-hidden">

            {/* Decorative radial gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>

            <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                <span className="inline-block px-3 py-1 bg-brand-500/20 text-brand-300 text-[10px] font-mono uppercase tracking-widest rounded-full border border-brand-500/30 mb-3">Incoming Signal</span>
                <h2 className="text-3xl font-display font-bold text-white tracking-tight">{challenge.title}</h2>
              </div>
              <button onClick={() => setShowChallenge(false)} className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-2xl p-6 mb-8 relative z-10">
              <p className="text-slate-300 italic text-lg leading-relaxed">"{challenge.description}"</p>
            </div>

            <div className="space-y-4 mb-10 relative z-10">
              <h3 className="text-[10px] uppercase text-slate-400 font-bold tracking-widest flex items-center gap-2">
                <div className="h-px bg-slate-700 flex-1"></div>
                Primary Objectives
                <div className="h-px bg-slate-700 flex-1"></div>
              </h3>
              <div className="bg-white/5 rounded-2xl border border-white/5 p-4 space-y-3">
                {challenge.steps.map((step, i) => (
                  <div key={i} className="flex gap-4 items-start drop-shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-400 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-slate-300 leading-relaxed font-medium">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowChallenge(false)}
              className="w-full py-4 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-2xl active:scale-95 transition-all shadow-[0_10px_30px_rgba(14,165,233,0.4)] relative z-10 flex items-center justify-center gap-2 text-lg"
            >
              Accept Mission
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
