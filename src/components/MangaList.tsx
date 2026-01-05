import { useEffect, useState } from 'react';

export function MangaLibrary() {
  const [manga, setManga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://townbackend-825d5dfe9e19.herokuapp.com/api/manga/list')
      .then(res => res.json())
      .then(data => {
        setManga(data.manga || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-white text-center p-12 text-2xl">Loading...</div>;

  return (
    <div className="min-h-screen bg-black p-8">
      <h1 className="text-6xl font-bold text-white text-center mb-4">📚 Comicktown</h1>
      <p className="text-gray-400 text-center mb-12 text-xl">
        {manga.length} Manga • {manga.reduce((sum, m) => sum + (m.chapters?.length || 0), 0)} Chapters
      </p>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {manga.map(m => (
          <div key={m.id} className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 hover:border-purple-400 transition-all hover:scale-105">
            <h2 className="text-2xl font-bold text-white mb-3 line-clamp-2">{m.title}</h2>
            <div className="flex gap-2 mb-4">
              <span className="bg-purple-600 px-3 py-1 rounded-full text-white text-sm font-semibold">{m.source}</span>
              <span className="bg-gray-700 px-3 py-1 rounded-full text-gray-300 text-sm">{m.chapters?.length || 0} Ch</span>
            </div>
            
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {m.chapters?.map((ch: any) => (
                <a
                  key={ch.num}
                  href={ch.url}
                  target="_blank"
                  className="flex justify-between items-center bg-black/50 hover:bg-purple-600 px-4 py-3 rounded-xl transition-all group"
                >
                  <span className="text-white font-semibold">Ch {ch.num}</span>
                  <span className="text-gray-400 group-hover:text-white text-sm">
                    {ch.size_mb > 0 ? ${ch.size_mb} MB : 'Read'}
                  </span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
