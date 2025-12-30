export interface Manga {
  id: string;
  title: string;
  alternativeNames?: string[];
  cover: string;
  summary: string;
  genres: string[];
  author?: string;
  artist?: string;
  status: 'ongoing' | 'completed' | 'hiatus';
  released?: string;
  rating: number;
  ratingCount: number;
  viewCount: number;
  chapters: Chapter[];
  source: 'manual' | 'scraped';
  sourceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chapter {
  id: string;
  mangaId: string;
  number: number;
  title: string;
  url?: string;
  images: string[];
  isLocked: boolean;
  tokenCost: number;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  role: 'user' | 'admin' | 'owner';
  tokens: number;
  bookmarks: string[];
  readingHistory: ReadingProgress[];
  favorites: string[];
  createdAt: Date;
}

export interface ReadingProgress {
  mangaId: string;
  chapterId: string;
  page: number;
  lastRead: Date;
}

export interface ScraperSource {
  id: string;
  name: string;
  displayName: string;
  endpoint: string;
  isActive: boolean;
  lastSync: Date;
  mangaCount: number;
}

export interface PromoCode {
  id: string;
  code: string;
  tokens: number;
  maxUses: number;
  currentUses: number;
  expiresAt: Date;
  isActive: boolean;
}

export type ViewMode = 'grid' | 'list';
export type SortOption = 'rating' | 'views' | 'newest' | 'title';
