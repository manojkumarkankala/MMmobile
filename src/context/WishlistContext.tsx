import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Product } from '../types';

interface WishlistContextValue {
  ids: string[];
  items: Product[];
  loading: boolean;
  has: (productId: string) => boolean;
  toggle: (product: Product) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);
const LOCAL_KEY = 'mm-wishlist-local';

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRemote = useCallback(async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wishlists')
      .select('product_id, product:products(*)')
      .eq('user_id', userId);
    setLoading(false);
    if (error) { console.error('wishlist load', error.message); return; }
    const products = (data ?? []).map((r: any) => r.product as Product).filter(Boolean);
    setIds(products.map(p => p.id));
    setItems(products);
  }, []);

  useEffect(() => {
    if (user) {
      loadRemote(user.id);
    } else {
      try {
        const raw = localStorage.getItem(LOCAL_KEY);
        const parsed: string[] = raw ? JSON.parse(raw) : [];
        setIds(parsed);
        setItems([]);
      } catch { setIds([]); }
    }
  }, [user, loadRemote]);

  const persistLocal = (next: string[]) => localStorage.setItem(LOCAL_KEY, JSON.stringify(next));

  const has = useCallback((productId: string) => ids.includes(productId), [ids]);

  const toggle = useCallback(async (product: Product) => {
    if (user) {
      if (ids.includes(product.id)) {
        await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', product.id);
      } else {
        await supabase.from('wishlists').insert({ user_id: user.id, product_id: product.id });
      }
      await loadRemote(user.id);
    } else {
      setIds(prev => {
        const next = prev.includes(product.id) ? prev.filter(id => id !== product.id) : [...prev, product.id];
        persistLocal(next);
        return next;
      });
    }
  }, [user, ids, loadRemote]);

  return (
    <WishlistContext.Provider value={{ ids, items, loading, has, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
