import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface BackgroundState {
  enabled: boolean;
  imagePath: string | null;
  opacity: number;
  imageData?: string | null; // base64 data URL
}

export interface BackgroundContextType {
  background: BackgroundState;
  setBackground: (settings: BackgroundState) => void;
  updateBackground: (partial: Partial<BackgroundState>) => void;
}

export const defaultBackgroundState: BackgroundState = {
  enabled: false,
  imagePath: null,
  opacity: 0.3,
  imageData: null,
};

export const BackgroundContext = createContext<BackgroundContextType>({
  background: defaultBackgroundState,
  setBackground: () => {},
  updateBackground: () => {},
});

export function useBackground() {
  return useContext(BackgroundContext);
}

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [background, setBackgroundState] = useState<BackgroundState>(defaultBackgroundState);

  useEffect(() => {
    // Load background settings on mount
    loadBackgroundSettings().then(setBackgroundState);

    // Listen for updates from main process
    const unsubscribe = window.backgroundAPI.onUpdated((settings) => {
      setBackgroundState(settings);
    });

    return unsubscribe;
  }, []);

  const setBackground = (settings: BackgroundState) => {
    setBackgroundState(settings);
  };

  const updateBackground = (partial: Partial<BackgroundState>) => {
    setBackgroundState((prev) => ({ ...prev, ...partial }));
  };

  return (
    <BackgroundContext.Provider value={{ background, setBackground, updateBackground }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export async function loadBackgroundSettings(): Promise<BackgroundState> {
  try {
    const settings = await window.backgroundAPI.get();
    return settings;
  } catch {
    return defaultBackgroundState;
  }
}
