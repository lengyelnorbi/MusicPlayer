export class Playlist {
    id: number;
    name: string;
    musicCount: number; // Count of associated musics

    constructor(id: number, name: string, musicCount: number = 0) {
        this.id = id;
        this.name = name;
        this.musicCount = musicCount;
    }
}
