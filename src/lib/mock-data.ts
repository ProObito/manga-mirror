import { Manga, Chapter } from './types';

const generateChapters = (mangaId: string, count: number): Chapter[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${mangaId}-ch-${i + 1}`,
    mangaId,
    number: i + 1,
    title: `Chapter ${i + 1}`,
    images: [],
    isLocked: i > 5,
    tokenCost: i > 5 ? 5 : 0,
    createdAt: new Date(Date.now() - (count - i) * 24 * 60 * 60 * 1000),
  }));
};

export const mockManga: Manga[] = [
  {
    id: '1',
    title: 'Solo Leveling',
    alternativeNames: ['나 혼자만 레벨업', 'Only I Level Up'],
    cover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=600&fit=crop',
    summary: 'In a world where hunters must battle deadly monsters to protect humanity, Sung Jin-Woo, the weakest of all hunters, finds himself in a mysterious dungeon. After a near-death experience, he gains the unique ability to level up endlessly.',
    genres: ['Action', 'Fantasy', 'Adventure'],
    author: 'Chugong',
    artist: 'Jang Sung-Rak',
    status: 'completed',
    released: '2018',
    rating: 4.9,
    ratingCount: 125000,
    viewCount: 0,
    chapters: generateChapters('1', 179),
    source: 'scraped',
    sourceUrl: 'https://example.com/solo-leveling',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-12-28'),
  },
  {
    id: '2',
    title: 'Tower of God',
    alternativeNames: ['신의 탑', "Kami no Tou"],
    cover: 'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=400&h=600&fit=crop',
    summary: 'Twenty-Fifth Bam, a young boy who spent his life trapped beneath a mysterious tower, enters it in pursuit of his only friend, Rachel. To reach her, he must climb the tower and face countless challenges.',
    genres: ['Action', 'Fantasy', 'Mystery'],
    author: 'SIU',
    artist: 'SIU',
    status: 'ongoing',
    released: '2010',
    rating: 4.8,
    ratingCount: 98000,
    viewCount: 0,
    chapters: generateChapters('2', 580),
    source: 'scraped',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-12-29'),
  },
  {
    id: '3',
    title: 'The Beginning After The End',
    alternativeNames: ['TBATE'],
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=600&fit=crop',
    summary: 'King Grey has unrivaled strength, wealth, and prestige in a world governed by martial ability. However, solitude lingers closely behind those with great power. Beneath the glamorous exterior of a powerful king lurks the shell of man.',
    genres: ['Action', 'Fantasy', 'Isekai'],
    author: 'TurtleMe',
    artist: 'Fuyuki23',
    status: 'ongoing',
    released: '2018',
    rating: 4.85,
    ratingCount: 87000,
    viewCount: 0,
    chapters: generateChapters('3', 200),
    source: 'scraped',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-12-27'),
  },
  {
    id: '4',
    title: 'Omniscient Reader',
    alternativeNames: ["Omniscient Reader's Viewpoint", '전지적 독자 시점'],
    cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop',
    summary: 'Dokja was an average office worker whose sole hobby was reading a web novel called "Three Ways to Survive the Apocalypse." One day, the novel becomes reality, and Dokja, who knows how the story ends, is the only person who can save the world.',
    genres: ['Action', 'Fantasy', 'Psychological'],
    author: 'Sing Shong',
    artist: 'Sleepy-C',
    status: 'ongoing',
    released: '2020',
    rating: 4.88,
    ratingCount: 76000,
    viewCount: 0,
    chapters: generateChapters('4', 165),
    source: 'scraped',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-12-28'),
  },
  {
    id: '5',
    title: 'Nano Machine',
    alternativeNames: ['나노 마신'],
    cover: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=600&fit=crop',
    summary: 'After being implanted with a nanomachine by his descendant from the future, a young martial artist\'s life is completely transformed. He gains incredible abilities that help him rise to power in a world of martial arts.',
    genres: ['Action', 'Martial Arts', 'Sci-Fi'],
    author: 'Han Joong-Weol-Ya',
    status: 'ongoing',
    released: '2020',
    rating: 4.7,
    ratingCount: 65000,
    viewCount: 0,
    chapters: generateChapters('5', 180),
    source: 'scraped',
    createdAt: new Date('2024-02-25'),
    updatedAt: new Date('2024-12-26'),
  },
  {
    id: '6',
    title: 'Return of the Mount Hua Sect',
    alternativeNames: ['화산귀환'],
    cover: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
    summary: 'The 13th disciple of the Mount Hua Sect, Chung Myung, sealed the Heavenly Demon and returned after 100 years of death. He finds his sect in ruins and decides to restore it to its former glory.',
    genres: ['Action', 'Martial Arts', 'Comedy'],
    author: 'Bee-eee',
    status: 'ongoing',
    released: '2021',
    rating: 4.82,
    ratingCount: 58000,
    viewCount: 0,
    chapters: generateChapters('6', 145),
    source: 'scraped',
    createdAt: new Date('2024-04-10'),
    updatedAt: new Date('2024-12-29'),
  },
  {
    id: '7',
    title: 'Martial Peak',
    alternativeNames: ['武炼巅峰', 'Wǔ Liàn Diān Fēng'],
    cover: 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=400&h=600&fit=crop',
    summary: 'The journey to martial arts peak is a lonely road. In the face of adversity, you must survive and remain unyielding. Only then can you break through the limits.',
    genres: ['Action', 'Martial Arts', 'Fantasy'],
    author: 'Momo',
    status: 'ongoing',
    released: '2018',
    rating: 4.5,
    ratingCount: 95000,
    viewCount: 0,
    chapters: generateChapters('7', 3500),
    source: 'scraped',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-30'),
  },
  {
    id: '8',
    title: 'The Great Mage Returns After 4000 Years',
    alternativeNames: ['4000년 만에 귀환한 대마도사'],
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=600&fit=crop',
    summary: 'The Great Mage Lucas Traumen, who was sealed by the Demigod for 4000 years, returns in the body of a third-rate wizard named Frey Blake. With his ancient knowledge, he sets out to defeat the Demigods.',
    genres: ['Action', 'Fantasy', 'Magic'],
    author: 'Nakwon (낙원)',
    status: 'ongoing',
    released: '2020',
    rating: 4.65,
    ratingCount: 52000,
    viewCount: 0,
    chapters: generateChapters('8', 160),
    source: 'scraped',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-12-25'),
  },
];

export const genres = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Isekai',
  'Magic',
  'Martial Arts',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
];

export const getTrendingManga = () => {
  return [...mockManga].sort((a, b) => b.viewCount - a.viewCount).slice(0, 10);
};

export const getMostRatedManga = () => {
  return [...mockManga].sort((a, b) => b.rating - a.rating);
};

export const getNewlyAddedManga = () => {
  return [...mockManga].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const searchManga = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return mockManga.filter(
    (manga) =>
      manga.title.toLowerCase().includes(lowerQuery) ||
      manga.alternativeNames?.some((name) => name.toLowerCase().includes(lowerQuery)) ||
      manga.genres.some((genre) => genre.toLowerCase().includes(lowerQuery)) ||
      manga.author?.toLowerCase().includes(lowerQuery) ||
      manga.artist?.toLowerCase().includes(lowerQuery)
  );
};
