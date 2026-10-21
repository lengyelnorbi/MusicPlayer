import { useCallback, useEffect, useRef, useState } from "react";
import type { Music } from "@/types/music";
import type { Playlist } from "@/types/playlist";
import { getMusicList } from "@/services/musicService";
import { getOfflineTracks } from "@/services/offlineLibrary";
import type { MusicMode } from "@/services/appPreferences";

export function useMusicList(mode: MusicMode = "online") {
  const [musics, setMusics] = useState<Music[]>([]);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [maxItemCount, setMaxItemCount] = useState(0);
  const [maxPageCount, setMaxPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const requestId = useRef(0);

  const changeSearchTerm = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadMusic = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      if (mode === "offline") {
        const local = await getOfflineTracks();
        const normalizedSearch = debouncedSearch.trim().toLocaleLowerCase();
        const filtered = local.filter((item) => {
          const trackGenres = String(item.genre ?? "").split(";").map(genre => genre.trim()).filter(Boolean);
          const matchesGenre = !selectedGenres.length || selectedGenres.some(genre => trackGenres.includes(genre));
          return item.title.toLocaleLowerCase().includes(normalizedSearch) && matchesGenre;
        });
        const start = (currentPage - 1) * limit;

        if (currentRequestId !== requestId.current) return;
        setMusics(filtered.slice(start, start + limit).map(track => ({
          ...track,
          genre: track.genre ?? "",
          addedAt: track.addedAt ?? "",
        })));
        setMaxItemCount(filtered.length);
        setMaxPageCount(Math.ceil(filtered.length / limit));
        setAvailableGenres([...new Set(local
          .flatMap(item => String(item.genre ?? "").split(";"))
          .map(genre => genre.trim())
          .filter(Boolean))].sort((a, b) => a.localeCompare(b)));
        setUserPlaylists([]);
      } else {
        const result = await getMusicList(currentPage, limit, debouncedSearch, selectedGenres);
        if (currentRequestId !== requestId.current) return;
        setMusics(result.items);
        setMaxItemCount(result.totalItemCount);
        setMaxPageCount(result.totalPages);
        setAvailableGenres(result.availableGenres);
        setUserPlaylists(result.userPlaylists);
      }
    } catch (cause) {
      if (currentRequestId !== requestId.current) return;
      setError(cause instanceof Error ? cause.message : "Could not load music.");
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }, [currentPage, limit, debouncedSearch, selectedGenres, mode]);

  useEffect(() => {
    void loadMusic();
    return () => { requestId.current += 1; };
  }, [loadMusic]);

  const toggleGenre = useCallback((genre: string) => {
    setSelectedGenres(current => current.includes(genre)
      ? current.filter(value => value !== genre)
      : [...current, genre]);
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedGenres([]);
    setCurrentPage(1);
  }, []);

  const changeLimit = useCallback((next: number) => {
    if (!Number.isInteger(next) || next < 1) return;
    setLimit(next);
    setCurrentPage(1);
  }, []);

  return {
    musics,
    availableGenres,
    selectedGenres,
    searchTerm,
    setSearchTerm: changeSearchTerm,
    currentPage,
    setCurrentPage,
    limit,
    changeLimit,
    maxItemCount,
    maxPageCount,
    loading,
    error,
    userPlaylists,
    loadMusic,
    toggleGenre,
    clearFilters,
  };
}
