import React, { useState, useEffect } from 'react';
import { Database, Search, Sparkles, BookOpen, Layers, History, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { MemoryEpisode } from '../types';

export const MemoryPage: React.FC = () => {
  const [episodes, setEpisodes] = useState<MemoryEpisode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getEpisodes();
        setEpisodes(data);
      } catch (e) {
        console.error('Failed to load memory episodes', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.searchMemory(searchQuery);
      setSearchResults(res.results || []);
    } catch (e) {
      console.error('Search failed', e);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6 text-[#1C1917]">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-[#1C1917]">Memory & Knowledge Store</h1>
        <p className="text-xs text-[#78716C] mt-1">
          Episodic historical logs, playbooks, semantic vector retrieval with provenance, and learned policies.
        </p>
      </div>

      {/* Semantic Vector Search Bar */}
      <div className="auren-card p-6 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Semantic vector search across episodes, playbooks, and SOPs..."
              className="w-full bg-[#EFECE6] border border-[#DDD5CA] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:border-[#C5855A] font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-2.5 rounded-xl bg-[#181716] hover:bg-[#2A2724] text-[#FAF8F5] font-bold text-xs shadow-md transition-all cursor-pointer border border-[#35312C]"
          >
            {isSearching ? 'Querying Index...' : 'Vector Search'}
          </button>
        </form>

        {/* Search Results Display */}
        {searchResults.length > 0 && (
          <div className="mt-5 space-y-3 pt-4 border-t border-[#E2DAD0]/80">
            <h4 className="text-xs font-bold font-display text-[#8E5633] uppercase tracking-widest">
              Semantic Matches ({searchResults.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map((sr) => (
                <div key={sr.id} className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DAD0] text-xs space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1C1917] truncate">{sr.title_or_goal}</span>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#F5E9DF] text-[#8E5633] border border-[#DFB59D]">
                      Similarity: {(sr.similarity_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-[#78716C] text-[11px] font-medium leading-relaxed">{sr.snippet}</p>
                  <div className="pt-2 flex items-center justify-between text-[10px] text-[#78716C] border-t border-[#E2DAD0]/70">
                    <span className="capitalize font-mono">Domain: {sr.domain}</span>
                    <span className="font-mono uppercase text-[#78716C]">Type: {sr.source_type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Episodic Memories List */}
      <div className="auren-card p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold font-display text-[#1C1917] flex items-center space-x-2">
          <History className="w-4 h-4 text-[#8E5633]" />
          <span>Long-Term Episodic Execution Memory ({episodes.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {episodes.map((ep) => (
            <div key={ep.id} className="p-4.5 rounded-2xl bg-[#FAF8F5] border border-[#E2DAD0] space-y-2.5 text-xs hover:border-[#C5855A]/50 transition-all shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2DAD0]/80">
                <span className="font-mono text-[#8E5633] uppercase font-bold text-[10px]">Domain: {ep.domain}</span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                    ep.outcome === 'POSITIVE'
                      ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                      : 'bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]'
                  }`}
                >
                  {ep.outcome}
                </span>
              </div>
              <h4 className="font-bold font-display text-[#1C1917] text-xs">{ep.goal}</h4>
              <p className="text-[#78716C] text-[11px] leading-relaxed font-medium">{ep.episode_summary}</p>
              <div className="flex items-center justify-between text-[10px] text-[#78716C] pt-2 border-t border-[#E2DAD0]/70 font-mono">
                <span>Reward Score: <strong className="text-[#15803D]">+{ep.reward_score}</strong></span>
                <span>Confidence: <strong className="text-[#1C1917]">{(ep.confidence * 100).toFixed(0)}%</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
