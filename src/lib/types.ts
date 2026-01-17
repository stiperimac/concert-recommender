import { ObjectId } from 'mongodb';

export type ISODateString = string;

export type ArtistSignals = {
  spotify?: {
    id?: string;
    popularity?: number;
    followers?: number;
    genres?: string[];
  };
  lastfm?: {
    mbid?: string;
    listeners?: number;
    playcount?: number;
    tags?: string[];
  };
};

export type ArtistDoc = {
  _id: ObjectId;
  name: string;
  normalizedName: string;
  genres: string[];
  signals: ArtistSignals;
  createdAt: Date;
  updatedAt: Date;
};

export type EventDoc = {
  _id: ObjectId;
  tmId: string;
  name: string;
  url?: string;
  date: ISODateString; // YYYY-MM-DD
  localDateTime?: ISODateString;
  city?: string;
  countryCode?: string;
  venue?: string;
  artists: string[];
  images?: { url: string; width?: number; height?: number }[];
  location?: { lat: number; lon: number };
  createdAt: Date;
  updatedAt: Date;
};

export type InteractionDoc = {
  _id: ObjectId;
  userId: string;
  type: 'like_artist' | 'save_event' | 'view_event';
  targetType: 'artist' | 'event';
  targetId: string;
  createdAt: Date;
};

export type UserProfileDoc = {
  _id: string; // equals userId
  userId: string;
  city?: string;
  favoriteArtists: string[]; // by artist name
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PopularitySnapshotDoc = {
  _id: ObjectId;
  scope: 'artist' | 'event';
  period: 'day' | 'month' | 'year';
  key: string; // e.g. 2026-01 or 2026 or 2026-01-16
  generatedAt: Date;
  items: Array<{ id: string; name: string; score: number; meta?: any }>;
};

export type RecommendationDoc = {
  _id: ObjectId;
  userId: string;
  generatedAt: Date;
  horizonDays: number;
  city?: string;
  items: Array<{ id: string; name: string; score: number; meta?: any }>;
};
