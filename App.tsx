
import React, { useState, useRef } from 'react';
import Scene from './components/Scene';
import Toolbar from './components/Toolbar';
import { BrickData, BrickType, ToolMode, Challenge, BrickDims } from './types';
import { LEGO_COLORS, DEFAULT_BRICK_DEFINITIONS, BRICK_HEIGHT, PLATE_HEIGHT, STUD_SIZE } from './constants';
import { generateChallenge } from './services/geminiService';
import { X, MousePointer2, RotateCw, Move, ChevronUp, Save, Download, HardDrive, Camera } from 'lucide-react';
import { playSound } from './utils/audio';

const App: React.FC = () => {
  const [bricks, setBricks] = useState<BrickData[]>([]);
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
      setBricks([]);
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
    <div className="w-full h-screen bg-retro-bg relative overflow-hidden scanlines font-mono text-slate-200">
      
      {/* 3D Viewport */}
      <div className="absolute inset-0 z-0">
        <Scene 
          bricks={bricks} 
          setBricks={setBricks}
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
      <div className="absolute top-4 left-4 pointer-events-none select-none z-10">
        <div className="text-retro-cyan text-xs opacity-70 bg-black/40 p-2 rounded border border-retro-accent/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 bg-red-500 rounded-full ${isExploding ? 'animate-ping' : 'animate-pulse'}`}/> 
            <span>LIVE FEED</span>
          </div>
          CAM_X: 124.55<br/>
          CAM_Y: 045.22<br/>
          BRICK_COUNT: {bricks.length.toString().padStart(3, '0')}<br/>
          <span className={lockedLayer !== null ? "text-retro-yellow font-bold" : "text-slate-500"}>
            LAYER_LOCK: {lockedLayer !== null ? `FIXED @ ${lockedLayer.toFixed(1)}` : 'AUTO'}
          </span>
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

      {/* Help Modal */}
      {showHelp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
           <div className="bg-[#1a1a2e] border-2 border-retro-cyan p-1 w-full max-w-md shadow-[0_0_30px_rgba(0,255,245,0.2)]">
              <div className="border border-retro-cyan/30 p-6 relative">
                <button 
                  onClick={() => setShowHelp(false)}
                  className="absolute top-2 right-2 text-retro-cyan hover:text-white"
                >
                  <X size={24} />
                </button>

                <h2 className="text-2xl text-retro-cyan font-bold mb-6 uppercase tracking-widest text-center">
                  Operator Manual
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border border-slate-600 rounded flex items-center justify-center bg-slate-800">
                      <MousePointer2 className="text-retro-yellow"/>
                    </div>
                    <div>
                      <div className="text-retro-yellow font-bold uppercase text-sm">Place Brick</div>
                      <div className="text-xs text-slate-400">Click on grid or bricks. Or press <span className="text-white font-bold">ENTER</span>.</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border border-slate-600 rounded flex items-center justify-center bg-slate-800">
                      <RotateCw className="text-retro-neon"/>
                    </div>
                    <div>
                      <div className="text-retro-neon font-bold uppercase text-sm">Rotate Brick</div>
                      <div className="text-xs text-slate-400">Press <span className="text-white font-bold border border-slate-500 px-1 rounded">R</span> on your keyboard.</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border border-slate-600 rounded flex items-center justify-center bg-slate-800">
                      <Move className="text-retro-cyan"/>
                    </div>
                    <div>
                      <div className="text-retro-cyan font-bold uppercase text-sm">Nudge Position</div>
                       <div className="text-xs text-slate-400 mb-1">Use <span className="text-white font-bold">W / A / S / D</span> to move piece.</div>
                       <div className="text-xs text-slate-400">Hold <span className="text-white font-bold">SHIFT</span> + W/S to adjust height.</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border border-slate-600 rounded flex items-center justify-center bg-slate-800">
                      <Camera className="text-slate-300"/>
                    </div>
                    <div>
                      <div className="text-slate-300 font-bold uppercase text-sm">View Control</div>
                       <div className="text-xs text-slate-400">Left-click + Drag to Rotate. Scroll to Zoom.</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <button 
                    onClick={() => setShowHelp(false)}
                    className="px-8 py-2 bg-retro-cyan text-black font-bold uppercase tracking-widest hover:bg-white hover:scale-105 transition-all"
                  >
                    Start Building
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Snapshot Modal (Polaroid Style) */}
      {snapshotImg && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="relative animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setSnapshotImg(null)}
              className="absolute -top-10 right-0 text-white hover:text-retro-neon"
            >
              <X size={32} />
            </button>
            <div className="bg-white p-4 pb-16 shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500 max-w-lg">
              <div className="bg-black aspect-square w-full overflow-hidden border-2 border-gray-200">
                <img src={snapshotImg} alt="LEGO Build" className="w-full h-full object-cover" />
              </div>
              <div className="mt-4 flex justify-between items-end font-handwriting">
                 <div>
                   <p className="text-black font-bold text-xl font-serif italic">My Creation</p>
                   <p className="text-gray-500 text-sm font-mono">{new Date().toLocaleDateString()}</p>
                 </div>
                 <a 
                   href={snapshotImg} 
                   download={`brickmaster-${Date.now()}.png`}
                   className="text-slate-400 hover:text-black"
                   title="Save to Disk"
                 >
                   <Download size={24} />
                 </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal (Retro Terminal) */}
      {showStats && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-black border-2 border-green-500 p-1 w-full max-w-md font-mono shadow-[0_0_20px_rgba(34,197,94,0.3)]">
             <div className="border border-green-900 p-6 relative bg-green-950/20">
               <button 
                 onClick={() => setShowStats(false)}
                 className="absolute top-2 right-2 text-green-500 hover:text-white"
               >
                 <X size={20} />
               </button>
               
               <div className="flex items-center gap-2 mb-4 border-b border-green-500 pb-2">
                 <HardDrive className="text-green-500" />
                 <h2 className="text-xl text-green-500 font-bold uppercase tracking-widest">Data Analyzer</h2>
               </div>

               <div className="space-y-4 text-green-400 text-sm">
                 <div className="flex justify-between">
                   <span>TOTAL_BRICKS:</span>
                   <span className="font-bold">{bricks.length}</span>
                 </div>
                 <div className="flex justify-between">
                   <span>TOTAL_STUDS:</span>
                   <span className="font-bold">{stats.totalStuds}</span>
                 </div>
                 <div className="flex justify-between">
                   <span>NET_WEIGHT (est):</span>
                   <span className="font-bold">{stats.totalWeight.toFixed(1)}g</span>
                 </div>
                 <div className="flex justify-between text-green-300 border-t border-green-800 pt-2 mt-2">
                   <span>MARKET_VAL (1999):</span>
                   <span className="font-bold">${stats.estimatedPrice.toFixed(2)}</span>
                 </div>
                 
                 <div className="mt-4">
                   <p className="mb-2 uppercase text-xs text-green-600">Composition:</p>
                   <div className="h-24 overflow-y-auto pr-2 custom-scrollbar-green">
                     {Object.entries(stats.colorCounts).map(([color, count]) => (
                       <div key={color} className="flex justify-between text-xs opacity-80">
                         <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }}></div>
                           <span>{LEGO_COLORS.find(c => c.hex === color)?.name || color}</span>
                         </div>
                         <span>x{count}</span>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>

             </div>
          </div>
        </div>
      )}

      {/* Custom Piece Fabricator Modal */}
      {showCreator && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
           <div className="bg-[#1a1a2e] border-2 border-retro-yellow p-1 w-full max-w-md shadow-[0_0_30px_rgba(234,179,8,0.2)]">
              <div className="border border-retro-yellow/30 p-6 relative">
                <button 
                  onClick={() => setShowCreator(false)}
                  className="absolute top-2 right-2 text-retro-yellow hover:text-white"
                >
                  <X size={24} />
                </button>

                <h2 className="text-xl text-retro-yellow font-bold mb-6 uppercase tracking-widest text-center border-b border-retro-yellow/30 pb-2">
                  Part Fabricator
                </h2>

                <form onSubmit={handleCreatePiece} className="space-y-4">
                  
                  <div>
                    <label className="block text-xs text-retro-yellow mb-1 uppercase tracking-wider">Piece Designation</label>
                    <input 
                      type="text" 
                      value={newPieceName}
                      onChange={(e) => setNewPieceName(e.target.value)}
                      placeholder="e.g. Super Brick 5000"
                      className="w-full bg-slate-900 border border-slate-600 p-2 text-slate-200 focus:border-retro-yellow focus:outline-none"
                      maxLength={20}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-retro-yellow mb-1 uppercase tracking-wider">Width (Studs)</label>
                      <input 
                        type="number" 
                        value={newPieceWidth}
                        onChange={(e) => setNewPieceWidth(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                        className="w-full bg-slate-900 border border-slate-600 p-2 text-slate-200 focus:border-retro-yellow focus:outline-none"
                        min="1"
                        max="20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-retro-yellow mb-1 uppercase tracking-wider">Depth (Studs)</label>
                      <input 
                        type="number" 
                        value={newPieceDepth}
                        onChange={(e) => setNewPieceDepth(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                        className="w-full bg-slate-900 border border-slate-600 p-2 text-slate-200 focus:border-retro-yellow focus:outline-none"
                        min="1"
                        max="20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-retro-yellow mb-2 uppercase tracking-wider">Chassis Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewPieceStyle('brick')}
                        className={`p-2 text-xs uppercase border transition-all ${newPieceStyle === 'brick' ? 'border-retro-yellow bg-retro-yellow text-black font-bold' : 'border-slate-600 text-slate-400 hover:border-retro-yellow'}`}
                      >
                        Brick
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPieceStyle('plate')}
                        className={`p-2 text-xs uppercase border transition-all ${newPieceStyle === 'plate' ? 'border-retro-yellow bg-retro-yellow text-black font-bold' : 'border-slate-600 text-slate-400 hover:border-retro-yellow'}`}
                      >
                        Plate
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPieceStyle('tile')}
                        className={`p-2 text-xs uppercase border transition-all ${newPieceStyle === 'tile' ? 'border-retro-yellow bg-retro-yellow text-black font-bold' : 'border-slate-600 text-slate-400 hover:border-retro-yellow'}`}
                      >
                        Tile
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 text-center">
                      {newPieceStyle === 'brick' && "Standard Height (1.2)"}
                      {newPieceStyle === 'plate' && "Low Profile (0.4)"}
                      {newPieceStyle === 'tile' && "Low Profile (0.4) - No Studs"}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-700 mt-4">
                    <button 
                      type="submit"
                      className="w-full py-3 bg-retro-yellow text-black font-bold uppercase tracking-widest hover:bg-white hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                      <Save size={18} /> Fabricate
                    </button>
                  </div>

                </form>
              </div>
           </div>
        </div>
      )}

      {/* Challenge Modal */}
      {showChallenge && challenge && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-retro-panel border-2 border-retro-neon p-1 w-full max-w-lg shadow-[0_0_30px_rgba(233,69,96,0.3)] transform transition-all scale-100">
            <div className="border border-retro-neon/50 p-6 relative">
              
              <button 
                onClick={() => setShowChallenge(false)}
                className="absolute top-2 right-2 text-retro-cyan hover:text-white"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl text-retro-yellow font-bold mb-2 uppercase tracking-widest border-b border-retro-neon/30 pb-2">
                {challenge.title}
              </h2>
              
              <p className="text-slate-300 mb-6 leading-relaxed italic">
                "{challenge.description}"
              </p>

              <div className="space-y-4">
                <h3 className="text-retro-cyan uppercase text-sm tracking-wider">Mission Directives:</h3>
                <ul className="space-y-3">
                  {challenge.steps.map((step, idx) => (
                    <li key={idx} className="flex gap-3 text-slate-200">
                      <span className="text-retro-neon font-bold select-none">0{idx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 text-center">
                <button 
                  onClick={() => setShowChallenge(false)}
                  className="px-8 py-2 border border-retro-cyan text-retro-cyan hover:bg-retro-cyan hover:text-black transition-colors uppercase tracking-widest text-sm"
                >
                  Accept Mission
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default App;
