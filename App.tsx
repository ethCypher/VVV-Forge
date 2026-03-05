
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Layers, 
  Settings, 
  Plus, 
  LayoutGrid, 
  BarChart3, 
  Download,
  Zap,
  Box,
  Save,
  Cloud,
  Info,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Layer, GenerationView, CollectionConfig, GeneratedToken, Trait } from './types';
import { createPRNG, selectTrait, generateTokenHash, saveTraitImage, getTraitImage } from './utils';

// Components
import Sidebar from './components/Sidebar';
import LayerEditor from './components/LayerEditor';
import PreviewGrid from './components/PreviewGrid';
import QAStats from './components/QAStats';
import ExportPanel from './components/ExportPanel';

const PROJECT_KEY = 'default';

const INITIAL_LAYERS: Layer[] = [
  { id: '1', name: 'Background', traits: [], isVisible: true, isLocked: false },
  { id: '2', name: 'Body', traits: [], isVisible: true, isLocked: false },
  { id: '3', name: 'Eyes', traits: [], isVisible: true, isLocked: false },
];

const INITIAL_CONFIG: CollectionConfig = {
  name: 'My VVV Collection',
  symbol: 'MVV',
  description: 'A premium NFT collection generated with VVV-Forge.',
  size: 100,
  startIndex: 1,
  seed: 'vvv-forge-seed-' + Math.random().toString(36).substring(7),
  externalUrl: '',
  creatorAddress: '',
  sellerFeeBasisPoints: 500,
};

export default function App() {
  const [view, setView] = useState<GenerationView>(GenerationView.EDITOR);
  const [layers, setLayers] = useState<Layer[]>(INITIAL_LAYERS);
  const [config, setConfig] = useState<CollectionConfig>(INITIAL_CONFIG);
  const [tokens, setTokens] = useState<GeneratedToken[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Supply Metrics
  const metrics = useMemo(() => {
    const max = layers.reduce((acc, l) => acc * Math.max(1, l.traits.length), 1);
    let recommended = 0;
    if (max <= 1) recommended = 0;
    else if (max < 1000) recommended = Math.floor(max * 0.5);
    else if (max < 10000) recommended = Math.floor(max * 0.2);
    else recommended = 10000;

    return { max, recommended };
  }, [layers]);

  // Persistence logic - Integrated with IndexedDB
  const saveProject = useCallback(async () => {
    setSaveStatus('saving');

    try {
      // 1. Save binary assets to IndexedDB
      for (const layer of layers) {
        for (const trait of layer.traits) {
          if (trait.imageFile) {
            await saveTraitImage(trait.id, trait.imageFile);
          }
        }
      }

      // 2. Save metadata structure to localStorage
      // We strip the File and previewUrl objects for JSON serialization
      const projectData = {
        layers: layers.map(l => ({
          ...l,
          traits: l.traits.map(t => ({
            id: t.id,
            name: t.name,
            weight: t.weight,
            constraints: t.constraints
          }))
        })),
        config,
        tokens
      };

      localStorage.setItem(`vvv_forge_project_${PROJECT_KEY}`, JSON.stringify(projectData));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error("Failed to save project", err);
      setSaveStatus('idle');
      alert("Storage error: Could not save assets. Check browser disk space.");
    }
  }, [layers, config, tokens]);

  const loadProject = useCallback(async (key: string) => {
    const data = localStorage.getItem(`vvv_forge_project_${key}`);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        
        // Hydrate layers with binary assets from IndexedDB
        const hydratedLayers = await Promise.all(parsed.layers.map(async (l: any) => {
          const hydratedTraits = await Promise.all(l.traits.map(async (t: any) => {
            const file = await getTraitImage(t.id);
            return {
              ...t,
              imageFile: file,
              previewUrl: file ? URL.createObjectURL(file) : null
            } as Trait;
          }));
          return { ...l, traits: hydratedTraits } as Layer;
        }));

        setLayers(hydratedLayers);
        setConfig(parsed.config || INITIAL_CONFIG);
        setTokens(parsed.tokens || []);
      } catch (err) {
        console.error("Load failed", err);
      }
    }
  }, []);

  useEffect(() => {
    loadProject(PROJECT_KEY);
  }, [loadProject]);

  // Generate tokens logic
  const generateCollection = useCallback(() => {
    setIsGenerating(true);
    const rng = createPRNG(config.seed);
    const newTokens: GeneratedToken[] = [];
    const hashes = new Set<string>();
    
    const targetSize = Math.min(config.size, metrics.max);

    let attempts = 0;
    while (newTokens.length < targetSize && attempts < targetSize * 20) {
      attempts++;
      const tokenTraits: Record<string, string> = {};
      
      layers.forEach(layer => {
        if (layer.traits.length > 0) {
          const selected = selectTrait(layer.traits, rng());
          tokenTraits[layer.id] = selected.id;
        }
      });

      const hash = generateTokenHash(tokenTraits, layers);
      if (!hashes.has(hash)) {
        hashes.add(hash);
        newTokens.push({
          id: config.startIndex + newTokens.length,
          traits: tokenTraits,
          hash,
          rarityScore: 0
        });
      }
    }

    setTokens(newTokens);
    setIsGenerating(false);
    if (view === GenerationView.EDITOR) setView(GenerationView.PREVIEW);
  }, [layers, config, view, metrics.max]);

  const addLayer = () => {
    const newLayer: Layer = {
      id: Math.random().toString(36).substring(7),
      name: 'New Layer',
      traits: [],
      isVisible: true,
      isLocked: false
    };
    setLayers([...layers, newLayer]);
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0a0c] text-[#e2e8f0] overflow-hidden font-sans">
      <Sidebar view={view} setView={setView} />

      <main className="flex-1 flex flex-col min-w-0 bg-cyber-grid relative">
        <header className="h-16 border-b border-[#1a1a1e] flex items-center justify-between px-6 bg-[#0a0a0c]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <Box className="w-6 h-6 text-[#00f5ff]" />
            <h1 className="font-bold text-lg tracking-tight uppercase">
              VVV-Forge <span className="text-[#00f5ff] text-xs font-mono ml-2 opacity-50">v1.2.1</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={saveProject}
              disabled={saveStatus === 'saving'}
              className={`flex items-center gap-2 px-4 py-2 border border-[#1a1a1e] rounded font-bold transition-all
                ${saveStatus === 'saved' ? 'text-green-400 border-green-900 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'hover:bg-[#111114]'}
                ${saveStatus === 'saving' ? 'opacity-70 cursor-wait' : ''}
              `}
            >
              {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saveStatus === 'saving' ? 'SYNCING ASSETS...' : saveStatus === 'saved' ? 'SYNCED' : 'SAVE TO VAULT'}
            </button>
            <button 
              onClick={generateCollection}
              disabled={isGenerating || layers.every(l => l.traits.length === 0)}
              className="flex items-center gap-2 px-4 py-2 bg-[#00f5ff] text-black rounded font-bold hover:bg-[#00d8e2] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 shadow-[0_0_20px_rgba(0,245,255,0.2)]"
            >
              <Zap className="w-4 h-4" />
              GENERATE
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {view === GenerationView.EDITOR && (
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4 pb-20">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold flex items-center gap-2 tracking-tight uppercase">
                    <Layers className="w-5 h-5 text-[#b026ff]" />
                    Layer Stack
                  </h2>
                  <button 
                    onClick={addLayer}
                    className="p-2 hover:bg-[#1a1a1e] rounded transition-colors text-gray-400 hover:text-white"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {layers.map((layer, idx) => (
                  <LayerEditor 
                    key={layer.id} 
                    layer={layer} 
                    layers={layers}
                    setLayers={setLayers}
                    index={idx}
                  />
                ))}
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-[#111114] border border-[#1a1a1e] rounded-lg shadow-xl sticky top-0">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-[#00f5ff] mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Collection Config
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider font-semibold">Collection Name</label>
                      <input 
                        type="text" 
                        value={config.name}
                        onChange={(e) => setConfig({...config, name: e.target.value})}
                        className="w-full bg-[#0a0a0c] border border-[#1a1a1e] p-2 rounded focus:border-[#00f5ff] outline-none font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider font-semibold">Target Size</label>
                      <input 
                        type="number" 
                        value={config.size}
                        onChange={(e) => setConfig({...config, size: parseInt(e.target.value) || 0})}
                        className={`w-full bg-[#0a0a0c] border p-2 rounded outline-none font-mono text-sm ${config.size > metrics.max ? 'border-red-500' : 'border-[#1a1a1e] focus:border-[#00f5ff]'}`}
                      />
                      {config.size > metrics.max && (
                        <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Exceeds max supply limit.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-[#1a1a1e]">
                     <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Supply Insights
                     </h4>
                     <div className="space-y-3">
                        <div className="flex justify-between items-center">
                           <span className="text-xs text-gray-400">Max Combinations</span>
                           <span className="text-xs font-mono font-bold text-[#b026ff]">{metrics.max.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center group cursor-help" title="Based on uniqueness safety factor to prevent visual repetition">
                           <span className="text-xs text-gray-400 border-b border-dashed border-gray-600">Recommended Size</span>
                           <span className="text-xs font-mono font-bold text-[#00f5ff]">{metrics.recommended.toLocaleString()}</span>
                        </div>
                        {config.size === metrics.recommended && (
                           <div className="bg-[#00f5ff]/10 text-[#00f5ff] p-2 rounded text-[10px] font-bold text-center border border-[#00f5ff]/20">
                              OPTIMAL UNIQUENESS RATIO
                           </div>
                        )}
                        <button 
                           onClick={() => setConfig({...config, size: metrics.recommended})}
                           className="w-full py-1 text-[9px] font-bold uppercase bg-[#1a1a1e] hover:bg-[#252529] text-gray-400 rounded transition-colors"
                        >
                           Apply Recommended
                        </button>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === GenerationView.PREVIEW && <PreviewGrid tokens={tokens} layers={layers} />}
          {view === GenerationView.QA && <QAStats tokens={tokens} layers={layers} />}
          {view === GenerationView.EXPORT && <ExportPanel tokens={tokens} layers={layers} config={config} />}
        </div>
      </main>
      
      <footer className="fixed bottom-0 left-0 right-0 h-8 bg-[#0a0a0c] border-t border-[#1a1a1e] flex items-center justify-between px-4 text-[10px] font-mono text-gray-500 z-50">
        <div className="flex items-center gap-4">
          <span>PROJECT: {config.name.toUpperCase()}</span>
          <span className="text-[#00f5ff]">SIZE: {tokens.length} / {config.size}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Cloud className="w-3 h-3 text-green-500" />
            VAULT: LOCAL
          </span>
          <span>REVISION: 1.2.1</span>
        </div>
      </footer>
    </div>
  );
}
