import type { Music } from "./music";

export type Playlist = {
  id: number;
  name: string;
  musicCount?: number;
  musics?: Music[];
  duration?: number;
};
