export type Music = {
  id: number;
  title: string;
  file_id: string;
  genre: string;
  addedAt: string;
  playlistIDs: number[];
  /** Present for downloaded tracks; absent for catalogue/API records. */
  fileUri?: string;
};
