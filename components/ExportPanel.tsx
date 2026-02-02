
import React, { useState } from 'react';
import { GeneratedToken, Layer, CollectionConfig } from '../types';
import { Download, CheckCircle, Loader2, FileJson, FileImage, ShieldCheck } from 'lucide-react';
import { createZipArchive, formatMetadata } from '../utils';

interface ExportPanelProps {
  tokens: GeneratedToken[];
  layers: Layer[];
  config: CollectionConfig;
}

export default function ExportPanel({ tokens, layers, config }: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const startExport = async () => {
    if (tokens.length === 0) return;
    setIsExporting(true);
    setProgress(0);
    setIsComplete(false);

    try {
      await createZipArchive(tokens, layers, config, (p) => setProgress(p));
      setIsComplete(true);
    } catch (error) {
      console.error("Export failed", error);
      alert("Export failed. Please check browser console for details.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="p-10 bg-[#111114] border border-[#1a1a1e] rounded-2xl shadow-2xl relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#00f5ff]/10">
          <div 
            className="h-full bg-[#00f5ff] transition-all duration-300 shadow-[0_0_15px_#00f5ff]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-[#00f5ff]/10 rounded-full flex items-center justify-center mb-6 border border-[#00f5ff]/20">
            {isExporting ? (
              <Loader2 className="w-10 h-10 text-[#00f5ff] animate-spin" />
            ) : isComplete ? (
              <CheckCircle className="w-10 h-10 text-green-500" />
            ) : (
              <Download className="w-10 h-10 text-[#00f5ff]" />
            )}
          </div>

          <h2 className="text-3xl font-bold mb-2 tracking-tighter uppercase">ARCHIVE_DEPLOYMENT</h2>
          <p className="text-gray-400 mb-8 max-w-md mx-auto text-sm leading-relaxed">
            Your collection of <span className="text-[#00f5ff] font-mono">{tokens.length}</span> tokens has passed audit. 
            Export will generate a VVV-compatible package with absolute 1:1 numeric mapping.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mb-8">
            <div className="flex items-center gap-4 p-4 bg-[#0a0a0c] border border-[#1a1a1e] rounded-lg text-left">
              <div className="p-2 bg-[#b026ff]/10 rounded">
                <FileImage className="w-5 h-5 text-[#b026ff]" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase block font-mono">ASSET_PAYLOAD</span>
                <span className="text-sm font-bold tracking-tight">{tokens.length} PNG FILES</span>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-[#0a0a0c] border border-[#1a1a1e] rounded-lg text-left">
              <div className="p-2 bg-[#00f5ff]/10 rounded">
                <FileJson className="w-5 h-5 text-[#00f5ff]" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase block font-mono">META_PAYLOAD</span>
                <span className="text-sm font-bold tracking-tight">{tokens.length} JSON SCHEMAS</span>
              </div>
            </div>
          </div>

          <button 
            onClick={startExport}
            disabled={isExporting || tokens.length === 0}
            className="group relative px-10 py-5 bg-[#00f5ff] text-black font-bold rounded hover:scale-105 transition-all active:scale-95 disabled:opacity-50 overflow-hidden"
          >
            <div className="relative z-10 flex items-center gap-3 tracking-widest uppercase text-sm">
              {isExporting ? `PACKAGING ${progress}%` : isComplete ? 'ARCHIVE READY' : 'INITIATE DOWNLOAD'}
            </div>
          </button>
          
          <div className="mt-8 flex items-center gap-2 text-[10px] text-gray-500 font-mono tracking-widest uppercase">
            <ShieldCheck className="w-3 h-3 text-green-500" />
            CLIENT_SIDE_ENCRYPTION_ACTIVE
          </div>
        </div>
      </div>

      <div className="bg-[#111114] p-6 border border-[#1a1a1e] rounded-lg">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 font-mono">Final Schema Preview (1.json)</h3>
        <div className="bg-[#0a0a0c] p-4 rounded font-mono text-xs overflow-x-auto text-green-400 border border-[#1a1a1e]">
          <pre>
{JSON.stringify(tokens.length > 0 ? formatMetadata(tokens[0], config, layers) : { message: "Generate tokens to see preview" }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
