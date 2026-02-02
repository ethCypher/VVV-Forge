
import React from 'react';
import { GenerationView } from '../types';
import { Layers, LayoutGrid, BarChart3, Download, Settings } from 'lucide-react';

interface SidebarProps {
  view: GenerationView;
  setView: (view: GenerationView) => void;
}

export default function Sidebar({ view, setView }: SidebarProps) {
  const items = [
    { id: GenerationView.EDITOR, icon: Layers, label: 'Editor' },
    { id: GenerationView.PREVIEW, icon: LayoutGrid, label: 'Preview' },
    { id: GenerationView.QA, icon: BarChart3, label: 'Analysis' },
    { id: GenerationView.EXPORT, icon: Download, label: 'Export' },
  ];

  return (
    <aside className="w-20 lg:w-64 border-r border-[#1a1a1e] flex flex-col bg-[#0a0a0c] z-20">
      <div className="flex-1 py-8 flex flex-col items-center lg:items-stretch px-4 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`
                flex items-center gap-3 p-3 rounded transition-all duration-200 group
                ${isActive 
                  ? 'bg-[#111114] text-[#00f5ff] border border-[#1a1a1e] shadow-[0_0_15px_rgba(0,245,255,0.1)]' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-[#111114]/50'
                }
              `}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
              <span className="hidden lg:block font-medium tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-4 mt-auto">
        <button className="flex items-center gap-3 p-3 w-full text-gray-500 hover:text-white transition-colors">
          <Settings className="w-6 h-6" />
          <span className="hidden lg:block">System</span>
        </button>
      </div>
    </aside>
  );
}
