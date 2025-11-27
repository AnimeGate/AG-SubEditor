import { createContext, useContext, useState, ReactNode } from "react";

interface ProcessingContextType {
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

const ProcessingContext = createContext<ProcessingContextType | undefined>(
  undefined,
);

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <ProcessingContext.Provider value={{ isProcessing, setIsProcessing }}>
      {children}
    </ProcessingContext.Provider>
  );
}

export function useProcessing() {
  const context = useContext(ProcessingContext);
  if (context === undefined) {
    throw new Error("useProcessing must be used within a ProcessingProvider");
  }
  return context;
}
