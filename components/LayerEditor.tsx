
import React, { useRef, useMemo } from 'react';
import { Layer, Trait } from '../types';
import { Trash2, Eye, EyeOff, Plus, ChevronUp, ChevronDown, ImageIcon, GripVertical, RefreshCw } from 'lucide-react';

interface LayerEditorProps {
  layer: Layer;
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  index: number;
}

const LayerEditor: React.FC<LayerEditorProps> = ({ layer, layers, setLayers, index }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalWeight = useMemo(() => layer.traits.reduce((acc, t) => acc + t.weight, 0), [layer.traits]);

  const updateLayer = (updates: Partial<Layer>) => {
    setLayers(prev => prev.map(l => l.id === layer.id ? { ...l, ...updates } : l));
  };

  const removeLayer = () => {
    setLayers(prev => prev.filter(l => l.id !== layer.id));
  };

  const moveLayer = (direction: 'up' | 'down') => {
    const newLayers = [...layers];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= layers.length) return;
    [newLayers[index], newLayers[targetIdx]] = [newLayers[targetIdx], newLayers[index]];
    setLayers(newLayers);
  };

  const normalizeWeights = () => {
    if (layer.traits.length === 0) return;
    const share = 100 / layer.traits.length;
    const normalized = layer.traits.map(t => ({ ...t, weight: parseFloat(share.toFixed(2)) }));
    updateLayer({ traits: normalized });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newTraits: Trait[] = Array.from(files).map((file: any) => ({
      id: Math.random().toString(36).substring(7),
      name: file.name.split('.')[0].replace(/_/g, ' '),
      weight: 10,
      imageFile: file,
      previewUrl: URL.createObjectURL(file),
      constraints: []
    }));

    updateLayer({ traits: [...layer.traits, ...newTraits] });
  };

  const removeTrait = (traitId: string) => {
    updateLayer({ traits: layer.traits.filter(t => t.id !== traitId) });
  };

  const updateTrait = (traitId: string, updates: Partial<Trait>) => {
    updateLayer({
      traits: layer.traits.map(t => t.id === traitId ? { ...t, ...updates } : t)
    });
  };

  return (
    <div className="bg-[#111114] border border-[#1a1a1e] rounded-lg overflow-hidden group">
      <div className="p-4 border-b border-[#1a1a1e] flex items-center justify-between bg-[#151518]">
        <div className="flex items-center gap-3">
          <GripVertical className="w-4 h-4 text-gray-600 cursor-grab" />
          <input 
            type="text" 
            value={layer.name}
            onChange={(e) => updateLayer({ name: e.target.value })}
            className="bg-transparent border-none focus:ring-1 focus:ring-[#00f5ff] rounded px-1 font-bold outline-none"
          />
          <button 
            onClick={normalizeWeights}
            className="text-[10px] bg-[#1a1a1e] text-gray-400 px-2 py-1 rounded hover:text-[#00f5ff] flex items-center gap-1 transition-colors uppercase font-mono"
            title="Normalize Weights to 100%"
          >
            <RefreshCw className="w-3 h-3" /> Normalize
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => updateLayer({ isVisible: !layer.isVisible })} className="p-1.5 hover:bg-[#1a1a1e] rounded transition-colors text-gray-500">
            {layer.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button onClick={() => moveLayer('up')} disabled={index === 0} className="p-1.5 hover:bg-[#1a1a1e] rounded transition-colors text-gray-500 disabled:opacity-20">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button onClick={() => moveLayer('down')} disabled={index === layers.length - 1} className="p-1.5 hover:bg-[#1a1a1e] rounded transition-colors text-gray-500 disabled:opacity-20">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button onClick={removeLayer} className="p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {layer.traits.map((trait) => {
            const percentage = totalWeight > 0 ? ((trait.weight / totalWeight) * 100).toFixed(1) : 0;
            return (
              <div key={trait.id} className="flex items-center gap-3 p-2 bg-[#0a0a0c] border border-[#1a1a1e] rounded group/trait relative">
                <div className="w-12 h-12 bg-[#1a1a1e] rounded overflow-hidden flex items-center justify-center relative">
                  {trait.previewUrl ? (
                    <img src={trait.previewUrl} alt={trait.name} className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-700" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <input 
                      type="text" 
                      value={trait.name}
                      onChange={(e) => updateTrait(trait.id, { name: e.target.value })}
                      className="w-full bg-transparent border-none text-xs font-medium outline-none text-gray-300 focus:text-[#00f5ff]"
                    />
                    <span className="text-[9px] font-mono text-[#00f5ff] ml-2 opacity-80">{percentage}%</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 uppercase font-mono">Weight</span>
                      <input 
                        type="number" 
                        value={trait.weight}
                        onChange={(e) => updateTrait(trait.id, { weight: parseFloat(e.target.value) || 0 })}
                        className="w-16 bg-[#151518] border border-[#1a1a1e] rounded px-1 py-0.5 text-[10px] outline-none text-[#00f5ff] font-mono"
                      />
                    </div>
                    <div className="w-full h-1 bg-[#1a1a1e] rounded-full overflow-hidden">
                      <div className="h-full bg-[#00f5ff]/40" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => removeTrait(trait.id)}
                  className="opacity-0 group-hover/trait:opacity-100 p-1.5 text-gray-500 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#1a1a1e] rounded hover:border-[#00f5ff]/50 hover:bg-[#00f5ff]/5 transition-all text-gray-500 hover:text-[#00f5ff]"
          >
            <Plus className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Add Assets</span>
            <input 
              type="file" 
              multiple 
              accept="image/png"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden" 
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LayerEditor;
