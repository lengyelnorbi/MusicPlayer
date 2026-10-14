export class Music {
    id: number = 0;
    title: string = '';
    genre: string = '';
    addedAt: string = '';
    playlistIDs: number[] = [];

    constructor(data?: Partial<Music>) {
        Object.assign(this, data);
    }
}
