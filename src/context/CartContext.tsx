import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Product } from '../types';

interface LocalCartEntry { product: Product; quantity: number; }

interface CartContextValue {
  items: LocalCartEntry[];
  count: number;
  subtotal: number;
  loading: boolean;
  add: (product: Product, qty?: number) => Promise<void>;
  updateQty: (productId: string, qty: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const LOCAL_KEY = 'mm-cart-local';

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<LocalCartEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLocal = useCallback(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? (JSON.parse(raw) as LocalCartEntry[]) : [];
    } catch { return []; }
  }, []);

  const persistLocal = (entries: LocalCartEntry[]) => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
  };

  const loadRemote = useCallback(async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cart_items')
      .select('id, user_id, product_id, quantity, product:products(*)')
      .eq('user_id', userId);
    setLoading(false);
    if (error) { console.error('cart load', error.message); return; }
    const mapped: LocalCartEntry[] = (data ?? []).map((r: any) => ({
      product: r.product as Product,
      quantity: r.quantity,
    }));
    setItems(mapped.filter(i => i.product));
  }, []);

  useEffect(() => {
    if (user) {
      loadRemote(user.id);
    } else {
      setItems(loadLocal());
    }
  }, [user, loadLocal, loadRemote]);

  const add = useCallback(async (product: Product, qty = 1) => {
    if (user) {
      const { data: existing } = await supabase
        .from('cart_items').select('id, quantity').eq('user_id', user.id).eq('product_id', product.id).maybeSingle();
      if (existing) {
        await supabase.from('cart_items').update({ quantity: existing.quantity + qty }).eq('id', existing.id);
      } else {
        await supabase.from('cart_items').insert({ user_id: user.id, product_id: product.id, quantity: qty });
      }
      await loadRemote(user.id);
    } else {
      setItems(prev => {
        const found = prev.find(i => i.product.id === product.id);
        const next = found
          ? prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i)
          : [...prev, { product, quantity: qty }];
        persistLocal(next);
        return next;
      });
    }
  }, [user, loadRemote]);

  const updateQty = useCallback(async (productId: string, qty: number) => {
    if (qty < 1) return;
    if (user) {
      await supabase.from('cart_items').update({ quantity: qty }).eq('user_id', user.id).eq('product_id', productId);
      await loadRemote(user.id);
    } else {
      setItems(prev => {
        const next = prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i);
        persistLocal(next);
        return next;
      });
    }
  }, [user, loadRemote]);

  const remove = useCallback(async (productId: string) => {
    if (user) {
      await supabase.from('cart_items').delete().eq('user_id', user.id).eq('product_id', productId);
      await loadRemote(user.id);
    } else {
      setItems(prev => {
        const next = prev.filter(i => i.product.id !== productId);
        persistLocal(next);
        return next;
      });
    }
  }, [user, loadRemote]);

  const clear = useCallback(async () => {
    if (user) {
      await supabase.from('cart_items').delete().eq('user_id', user.id);
      await loadRemote(user.id);
    } else {
      setItems([]);
      persistLocal([]);
    }
  }, [user, loadRemote]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, subtotal, loading, add, updateQty, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
