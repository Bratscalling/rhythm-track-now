
export interface VideoData {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  channel: string;
  views: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  songs: VideoData[];
  createdAt: Date;
  updatedAt: Date;
}
