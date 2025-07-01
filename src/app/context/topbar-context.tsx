import React, { createContext, useContext, useState, ReactNode } from "react";

interface TopbarContextType {
  topbar: ReactNode;
  setTopbar: (component: ReactNode) => void;
}

const TopbarContext = createContext<TopbarContextType | undefined>(undefined);

export function TopbarProvider({ children }: { children: ReactNode }) {
  const [topbar, setTopbar] = useState<ReactNode>(null);

  return (
    <TopbarContext.Provider value={{ topbar, setTopbar }}>
      {children}
    </TopbarContext.Provider>
  );
}

export function useTopbar() {
  const context = useContext(TopbarContext);
  if (!context) {
    throw new Error("useTopbar must be used within a TopbarProvider");
  }
  return context;
}
