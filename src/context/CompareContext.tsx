import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Product } from '../types';

interface CompareContextValue {
  items: Product[];
  ids: string[];
  has: (id: string) => boolean;
  toggle: (p: Product) => void;
  remove: (id: string) => void;
  clear: () => void;
  max: number;
}

const CompareContext = createContext<CompareContextValue | undefined>(undefined);
const MAX = 4;

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);

  const has = useCallback((id: string) => items.some(p => p.id === id), [items]);

  const toggle = useCallback((p: Product) => {
    setItems(prev => {
      if (prev.some(x => x.id === p.id)) return prev.filter(x => x.id !== p.id);
      if (prev.length >= MAX) return prev;
      return [...prev, p];
    });
  }, []);

  const remove = useCallback((id: string) => setItems(prev => prev.filter(p => p.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  return (
    <CompareContext.Provider value={{ items, ids: items.map(p => p.id), has, toggle, remove, clear, max: MAX }}>
      {children}
    </CompareContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}
