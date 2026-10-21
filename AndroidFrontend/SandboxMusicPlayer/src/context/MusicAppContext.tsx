import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loadMusicMode, saveMusicMode, type MusicMode } from "@/services/appPreferences";
import { initializeOfflineLibrary } from "@/services/offlineLibrary";
import { loadStoredSession, logoutSession, subscribeToSessionChanges, type StoredSession } from "@/services/auth";

type ContextValue = {
  mode: MusicMode;
  setMode: (mode: MusicMode) => Promise<void>;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  session: StoredSession | null;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  initializing: boolean;
};

const MusicAppContext = createContext<ContextValue | null>(null);

export function MusicAppProvider({ children }: React.PropsWithChildren) {
  const [mode, setModeState] = useState<MusicMode>("online");
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<StoredSession | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => subscribeToSessionChanges(setSession), []);

  useEffect(() => {
    let active = true;
    Promise.all([loadMusicMode(), loadStoredSession()])
      .then(([savedMode, savedSession]) => {
        if (!active) return;
        setModeState(savedMode);
        setSession(savedSession);
      })
      .catch(error => console.warn("Could not restore app state:", error))
      .finally(() => {
        if (active) setInitializing(false);
      });
    return () => { active = false; };
  }, []);

  const setMode = useCallback(async (nextMode: MusicMode) => {
    if (nextMode === "offline") await initializeOfflineLibrary();
    await saveMusicMode(nextMode);
    setModeState(nextMode);
    setMenuOpen(false);
  }, []);

  const refreshSession = useCallback(async () => {
    setSession(await loadStoredSession());
  }, []);

  const logout = useCallback(async () => {
    await logoutSession();
    setSession(null);
  }, []);

  const value = useMemo<ContextValue>(() => ({
    mode,
    setMode,
    menuOpen,
    setMenuOpen,
    session,
    refreshSession,
    logout,
    initializing,
  }), [mode, setMode, menuOpen, session, refreshSession, logout, initializing]);

  return <MusicAppContext.Provider value={value}>{children}</MusicAppContext.Provider>;
}

export function useMusicApp() {
  const value = useContext(MusicAppContext);
  if (!value) throw new Error("useMusicApp must be used inside MusicAppProvider");
  return value;
}
