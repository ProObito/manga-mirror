// src/components/MangaScrapeButton.tsx
// Manual Scrape Button Component

'use client';

import { useState } from 'react';
import { useMangaScraper } from '@/hooks/useMangaBackend';

export function MangaScrapeButton() {
  const { scrape, loading, data, error } = useMangaScraper();
  const [source, setSource] = useState("all");

  const handleScrape = async () => {
    try {
      await scrape(source, 20);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <select 
        value={source} 
        onChange={(e) => setSource(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded px-4 py-2 w-full"
      >
        <option value="all">🌐 All Sites (Recommended)</option>
        <option value="comix.to">📖 Comix.to</option>
        <option value="vortexscans.org">⚡ VortexScans</option>
        <option value="evascans.org">🎯 EvaScans</option>
        <option value="asuracomic.net">🔥 AsuraComic</option>
        <option value="roliascan.com">📚 RoliaScan</option>
      </select>

      <button
        onClick={handleScrape}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded font-bold transition"
      >
        {loading ? '🔄 Scraping...' : '📚 Scrape Manga'}
      </button>

      {data && (
        <div className="bg-gray-800 p-4 rounded border border-gray-700">
          <div className="text-green-400 font-bold mb-2">
            ✅ {data.message}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Scraped: <span className="font-bold">{data.manga_scraped}</span></div>
            <div>Stored: <span className="font-bold text-green-400">{data.manga_stored}</span></div>
            <div>Active DB: <span className="font-bold">MongoDB {data.active_db}</span></div>
          </div>
          {data.errors.length > 0 && (
            <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500 rounded text-sm">
              {data.errors.map((err, i) => (
                <div key={i} className="text-yellow-400">{err}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500 p-4 rounded text-red-400">
          ❌ Error: {error}
        </div>
      )}
    </div>
  );
}
