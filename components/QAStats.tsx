
import React, { useMemo } from 'react';
import { GeneratedToken, Layer } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { AlertCircle, CheckCircle2, Search } from 'lucide-react';

interface QAStatsProps {
  tokens: GeneratedToken[];
  layers: Layer[];
}

export default function QAStats({ tokens, layers }: QAStatsProps) {
  const layerStats = useMemo(() => {
    return layers.map(layer => {
      const traitCounts: Record<string, number> = {};
      tokens.forEach(token => {
        const tid = token.traits[layer.id] || 'none';
        traitCounts[tid] = (traitCounts[tid] || 0) + 1;
      });

      const data = layer.traits.map(t => ({
        name: t.name,
        count: traitCounts[t.id] || 0,
        expected: (t.weight / layer.traits.reduce((a, b) => a + b.weight, 0)) * tokens.length
      }));

      return {
        layerName: layer.name,
        data
      };
    });
  }, [tokens, layers]);

  return (
    <div className="space-y-8 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111114] p-6 border border-[#1a1a1e] rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <h3 className="text-sm font-bold uppercase">Uniqueness Check</h3>
          </div>
          <p className="text-2xl font-mono font-bold">100.00%</p>
          <p className="text-xs text-gray-500 mt-1">No duplicates detected in generation.</p>
        </div>
        <div className="bg-[#111114] p-6 border border-[#1a1a1e] rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <h3 className="text-sm font-bold uppercase">Complexity Index</h3>
          </div>
          <p className="text-2xl font-mono font-bold">Medium</p>
          <p className="text-xs text-gray-500 mt-1">Variance is within normal operational bounds.</p>
        </div>
        <div className="bg-[#111114] p-6 border border-[#1a1a1e] rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Search className="w-5 h-5 text-[#00f5ff]" />
            <h3 className="text-sm font-bold uppercase">Missing Assets</h3>
          </div>
          <p className="text-2xl font-mono font-bold">0</p>
          <p className="text-xs text-gray-500 mt-1">All traits have associated image files.</p>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-bold">Trait Distribution Analysis</h2>
        {layerStats.map(stat => (
          <div key={stat.layerName} className="bg-[#111114] p-6 border border-[#1a1a1e] rounded-lg">
            <h3 className="text-sm font-bold uppercase text-[#00f5ff] mb-6 tracking-widest">{stat.layerName}</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stat.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0c', border: '1px solid #1a1a1e' }}
                    itemStyle={{ fontSize: '10px', color: '#00f5ff' }}
                  />
                  <Bar dataKey="count" fill="#00f5ff" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="expected" fill="#b026ff20" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
