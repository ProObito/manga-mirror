import { useEffect, useState } from 'react';

export function MangaList() {
  const [manga, setManga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://townbackend-825d5dfe9e19.herokuapp.com/api/manga/list')
      .then(res => res.json())
      .then(data => setManga(data.manga || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-white mb-6">Manga List</h2>
      <div className="space-y-4">
        {manga.map(m => (
          <div key={m.id} className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-white font-bold">{m.title}</h3>
            <p className="text-gray-400">{m.chapters?.length || 0} chapters</p>
          </div>
        ))}
      </div>
    </div>
  );
}
