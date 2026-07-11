import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Brand, Category, ProductWithRefs } from '../types';

export function useProducts(filters?: {
  category?: string;
  brand?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'discount';
  featured?: boolean;
  isNew?: boolean;
}) {
  const [data, setData] = useState<ProductWithRefs[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      let q = supabase.from('products').select('*, brands:brands(name,slug), categories:categories(name,slug)');
      if (filters?.category) q = q.eq('category_id', filters.category);
      if (filters?.brand) q = q.eq('brand_id', filters.brand);
      if (filters?.featured) q = q.eq('is_featured', true);
      if (filters?.isNew) q = q.eq('is_new', true);
      if (filters?.minPrice != null) q = q.gte('price', filters.minPrice);
      if (filters?.maxPrice != null) q = q.lte('price', filters.maxPrice);
      if (filters?.search) {
        q = q.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      switch (filters?.sort) {
        case 'price-asc': q = q.order('price', { ascending: true }); break;
        case 'price-desc': q = q.order('price', { ascending: false }); break;
        case 'rating': q = q.order('rating', { ascending: false }); break;
        case 'discount': q = q.order('mrp', { ascending: false }); break;
        case 'newest': q = q.order('created_at', { ascending: false }); break;
        default: q = q.order('is_featured', { ascending: false }).order('rating', { ascending: false });
      }
      const { data: rows, error: err } = await q.limit(60);
      if (!active) return;
      if (err) { setError(err.message); setData([]); }
      else setData((rows ?? []) as ProductWithRefs[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [filters?.category, filters?.brand, filters?.search, filters?.minPrice, filters?.maxPrice, filters?.sort, filters?.featured, filters?.isNew]);

  return { data, loading, error };
}

export function useProductBySlug(slug?: string) {
  const [product, setProduct] = useState<ProductWithRefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, brands:brands(name,slug), categories:categories(name,slug)')
        .eq('slug', slug)
        .maybeSingle();
      if (!active) return;
      if (error) setError(error.message);
      setProduct((data as ProductWithRefs) ?? null);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [slug]);

  return { product, loading, error };
}

export function useBrands() {
  const [data, setData] = useState<Brand[]>([]);
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from('brands').select('*').order('sort_order');
      if (active) setData((data ?? []) as Brand[]);
    })();
    return () => { active = false; };
  }, []);
  return data;
}

export function useCategories() {
  const [data, setData] = useState<Category[]>([]);
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from('categories').select('*').order('sort_order');
      if (active) setData((data ?? []) as Category[]);
    })();
    return () => { active = false; };
  }, []);
  return data;
}

export function useReviews(productId?: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!productId) return;
    let active = true;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (active) { setData(data ?? []); setLoading(false); }
    })();
    return () => { active = false; };
  }, [productId]);
  return { data, loading };
}

export function useSimilarProducts(product?: ProductWithRefs | null) {
  const [data, setData] = useState<ProductWithRefs[]>([]);
  useEffect(() => {
    if (!product) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('products')
        .select('*, brands:brands(name,slug), categories:categories(name,slug)')
        .eq('category_id', product.category_id)
        .neq('id', product.id)
        .order('rating', { ascending: false })
        .limit(6);
      if (active) setData((data ?? []) as ProductWithRefs[]);
    })();
    return () => { active = false; };
  }, [product?.id]);
  return data;
}
