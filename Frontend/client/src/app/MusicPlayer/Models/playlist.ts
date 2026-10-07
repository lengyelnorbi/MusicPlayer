import { Music } from './music';

export class Playlist {
    id: number;
    name: string;
    musicCount: number;
    musics: Music[] | any = []; // Initialize the music array to an empty array
    duration: number = 0; // Initialize duration to 0

    constructor(id: number, name: string, musicCount: number = 0) {
        this.id = id;
        this.name = name;
        this.musicCount = musicCount;
    }
}
