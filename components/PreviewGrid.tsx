
import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { GeneratedToken, Layer } from '../types';
import { renderToken } from '../utils';
import { Search, ChevronRight, Hash, ImageIcon, Filter } from 'lucide-react';

interface PreviewGridProps {
  tokens: GeneratedToken[];
  layers: Layer[];
}

// Sub-component for individual lazy-loaded token preview
const PreviewCard = memo(({ 
  token, 
  layers, 
  onSelect, 
  isSelected 
}: { 
  token: GeneratedToken, 
  layers: Layer[], 
  onSelect: (t: GeneratedToken) => void,
  isSelected: boolean
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !dataUrl) {
        render();
      }
    }, { threshold: 0.1 });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [dataUrl]);

  const render = async () => {
    if (!canvasRef.current) return;
    const url = await renderToken(token, layers, canvasRef.current);
    setDataUrl(url);
  };

  return (
    <button 
      ref={containerRef}
      onClick={() => onSelect(token)}
      className={`
        group relative aspect-square bg-[#111114] border rounded-lg overflow-hidden transition-all duration-200
        ${isSelected ? 'border-[#00f5ff] scale-105 shadow-[0_0_20px_rgba(0,245,255,0.2)] z-10' : 'border-[#1a1a1e] hover:border-gray-700'}
      `}
    >
      <canvas ref={canvasRef} width={256} height={256} className="hidden" />
      {dataUrl ? (
        <img src={dataUrl} className="w-full h-full object-contain" alt={`Token ${token.id}`} loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#0a0a0c]">
          <div className="w-5 h-5 border-2 border-t-[#00f5ff] border-gray-800 rounded-full animate-spin"></div>
        </div>
      )}
      <div className={`absolute inset-x-0 bottom-0 p-1.5 bg-black/60 backdrop-blur-md flex items-center justify-between transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <span className="text-[9px] font-mono font-bold text-white tracking-tighter">ID_{token.id}</span>
        {isSelected && <div className="w-1 h-1 rounded-full bg-[#00f5ff] shadow-[0_0_5px_#00f5ff]" />}
      </div>
    </button>
  );
});

export default function PreviewGrid({ tokens, layers }: PreviewGridProps) {
  const [selectedToken, setSelectedToken] = useState<GeneratedToken | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fixed error: Added useMemo to React imports to allow its usage here
  const filteredTokens = useMemo(() => {
    if (!searchQuery) return tokens;
    return tokens.filter(t => t.id.toString().includes(searchQuery));
  }, [tokens, searchQuery]);

  return (
    <div className="flex h-full gap-6">
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-[#0a0a0c]/80 backdrop-blur-md py-4 z-20 border-b border-[#1a1a1e]/50">
          <h2 className="text-xl font-bold flex items-center gap-2 tracking-tighter uppercase">
            <Hash className="w-5 h-5 text-[#00f5ff]" />
            Output Stream
            <span className="text-xs font-mono opacity-50 ml-2">[{filteredTokens.length} ITEMS]</span>
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#00f5ff] transition-colors" />
              <input 
                type="text" 
                placeholder="Lookup ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#111114] border border-[#1a1a1e] rounded-full py-1.5 pl-9 pr-4 text-xs outline-none focus:border-[#00f5ff] w-40 transition-all focus:w-60"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-24">
          {filteredTokens.map((token) => (
            <PreviewCard 
              key={token.id}
              token={token}
              layers={layers}
              isSelected={selectedToken?.id === token.id}
              onSelect={setSelectedToken}
            />
          ))}
          {filteredTokens.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500 opacity-40">
               <ImageIcon className="w-12 h-12 mb-4" />
               <p className="font-mono text-sm tracking-widest">NO_MATCHES_FOUND</p>
            </div>
          )}
        </div>
      </div>

      {/* Inspector Panel */}
      <div className={`
        w-80 bg-[#111114] border-l border-[#1a1a1e] p-6 flex flex-col transition-all duration-300 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-30
        ${selectedToken ? 'translate-x-0' : 'translate-x-full opacity-0 pointer-events-none'}
      `}>
        {selectedToken && (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold tracking-tighter text-sm uppercase">Item Audit</h3>
              <button 
                onClick={() => setSelectedToken(null)} 
                className="text-gray-500 hover:text-white p-1 hover:bg-[#1a1a1e] rounded"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-square bg-[#0a0a0c] border border-[#1a1a1e] rounded mb-6 overflow-hidden flex items-center justify-center relative group/large">
               {/* Hidden canvas for high-res preview if needed, or we just render manually */}
               <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-[10px] font-mono text-[#00f5ff] z-10 border border-[#00f5ff]/20">
                  ID: {selectedToken.id}
               </div>
               <TokenHighResRenderer token={selectedToken} layers={layers} />
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              <div className="space-y-3">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block border-b border-[#1a1a1e] pb-2">Traits</span>
                {layers.map(layer => {
                  const traitId = selectedToken.traits[layer.id];
                  const trait = layer.traits.find(t => t.id === traitId);
                  const weight = trait?.weight || 0;
                  const total = layer.traits.reduce((a, b) => a + b.weight, 0);
                  const percentage = total > 0 ? (weight / total * 100).toFixed(1) : "0";

                  return (
                    <div key={layer.id} className="bg-[#0a0a0c] p-3 rounded border border-[#1a1a1e] group/attr hover:border-[#00f5ff]/30 transition-colors">
                      <div className="flex justify-between items-center text-[9px] mb-1">
                        <span className="text-gray-500 font-bold uppercase">{layer.name}</span>
                        <span className="text-[#00f5ff] font-mono px-1.5 py-0.5 bg-[#00f5ff]/10 rounded">{percentage}%</span>
                      </div>
                      <div className="text-xs font-bold tracking-tight">{trait?.name || 'NONE'}</div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-6">
                 <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block border-b border-[#1a1a1e] pb-2 mb-3">System Hash</span>
                 <div className="font-mono text-[9px] break-all p-2 bg-[#0a0a0c] border border-[#1a1a1e] rounded opacity-60">
                    {selectedToken.hash}
                 </div>
              </div>
            </div>
            
            <button className="mt-6 w-full py-2 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest rounded transition-colors border border-white/10">
               Regenerate Salt
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Separate component for high-res audit rendering
function TokenHighResRenderer({ token, layers }: { token: GeneratedToken, layers: Layer[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const render = async () => {
      if (!canvasRef.current) return;
      const url = await renderToken(token, layers, canvasRef.current);
      setDataUrl(url);
    };
    render();
  }, [token, layers]);

  return (
    <>
      <canvas ref={canvasRef} width={1000} height={1000} className="hidden" />
      {dataUrl ? (
        <img src={dataUrl} className="w-full h-full object-contain" alt="High Res" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-t-[#00f5ff] border-gray-800 rounded-full animate-spin"></div>
        </div>
      )}
    </>
  );
}
