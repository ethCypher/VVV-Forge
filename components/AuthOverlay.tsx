
import React, { useState } from 'react';
import { Shield, Lock, User, Terminal } from 'lucide-react';
import { hashCredentials } from '../utils';

interface AuthOverlayProps {
  onUnlock: (authKey: string) => void;
}

export default function AuthOverlay({ onUnlock }: AuthOverlayProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setIsProcessing(true);
    const key = await hashCredentials(username, password);
    onUnlock(key);
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0c] p-6">
      <div className="absolute inset-0 opacity-20 pointer-events-none cyber-grid"></div>
      
      <div className="max-w-md w-full bg-[#111114] border border-[#1a1a1e] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#00f5ff]/10 rounded-full flex items-center justify-center mb-4 border border-[#00f5ff]/20">
            <Shield className="w-8 h-8 text-[#00f5ff]" />
          </div>
          <h2 className="text-2xl font-bold tracking-tighter uppercase">Forge Access</h2>
          <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest font-mono">Secure Project Vault</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <User className="w-3 h-3" /> Identity
            </label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-[#1a1a1e] p-3 rounded focus:border-[#00f5ff] outline-none font-mono text-sm"
              placeholder="Username"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Lock className="w-3 h-3" /> Passkey
            </label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-[#1a1a1e] p-3 rounded focus:border-[#00f5ff] outline-none font-mono text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isProcessing}
            className="w-full py-4 bg-[#00f5ff] text-black font-bold rounded flex items-center justify-center gap-3 hover:bg-[#00d8e2] transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'AUTHENTICATING...' : (
              <>
                <Terminal className="w-4 h-4" />
                UNLOCK WORKSPACE
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-[9px] text-gray-600 text-center font-mono leading-relaxed">
          WORKSPACE DATA IS PERSISTED LOCALLY USING AES-DERIVED SCHEMAS.<br/>
          CLEARING BROWSER CACHE WILL PURGE ALL PROJECTS.
        </p>
      </div>
    </div>
  );
}
