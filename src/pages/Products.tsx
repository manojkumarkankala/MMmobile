import { useSearchParams, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { SlidersHorizontal, X, ChevronRight, Sparkles } from 'lucide-react';
import { useProducts, useCategories, useBrands } from '../hooks/useData';
import { ProductCard } from '../components/ProductCard';
import { inr } from '../lib/utils';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { parseSearchQuery, aiRecommend } from '../lib/ai';

export default function Products() {
  const [params, setParams] = useSearchParams();
  const categories = useCategories();
  const brands = useBrands();

  const category = params.get('category') || undefined;
  const brand = params.get('brand') || undefined;
  const search = params.get('search') || undefined;
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [sort, setSort] = useState<'price-asc' | 'price-desc' | 'rating' | 'newest' | 'discount'>('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [aiMode, setAiMode] = useState(false);

  const { data, loading } = useProducts({ category, brand, search, minPrice, maxPrice, sort });

  // AI-enhanced re-ranking when search query present
  const displayed = useMemo(() => {
    if (!aiMode || !search) return data;
    const parsed = parseSearchQuery(search);
    return aiRecommend(data, { intent: parsed.intent, budget: parsed.budget, brand: parsed.brand });
  }, [data, aiMode, search]);

  const activeCat = categories.find(c => c.id === category);
  const activeBrand = brands.find(b => b.id === brand);

  const setParam = (key: string, val?: string) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val); else next.delete(key);
    setParams(next);
  };

  const clearAll = () => {
    setParams(new URLSearchParams());
    setMinPrice(undefined); setMaxPrice(undefined);
  };

  return (
    <div className="container-x py-6 page-fill">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-ink-500 mb-4">
        <Link to="/" className="hover:text-brand-600">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-ink-800 dark:text-ink-100">Products</span>
        {activeCat && (<><ChevronRight className="w-3.5 h-3.5" /><span className="text-ink-800 dark:text-ink-100">{activeCat.name}</span></>)}
        {activeBrand && (<><ChevronRight className="w-3.5 h-3.5" /><span className="text-ink-800 dark:text-ink-100">{activeBrand.name}</span></>)}
      </nav>

      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900 dark:text-white">
            {search ? `Results for "${search}"` : activeCat ? activeCat.name : activeBrand ? activeBrand.name : 'All Products'}
          </h1>
          <p className="text-sm text-ink-500 mt-1">{loading ? 'Loading…' : `${displayed.length} products found`}</p>
        </div>
        <div className="flex items-center gap-2">
          {search && (
            <button
              onClick={() => setAiMode(a => !a)}
              className={cn('btn text-sm !py-2', aiMode ? 'bg-brand-600 text-white' : 'btn-outline')}
            >
              <Sparkles className="w-4 h-4" /> AI Sort {aiMode ? 'ON' : 'OFF'}
            </button>
          )}
          <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="input !w-auto !py-2 text-sm">
            <option value="rating">Top Rated</option>
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="discount">Biggest Discount</option>
          </select>
          <button onClick={() => setShowFilters(true)} className="btn-outline !py-2 lg:hidden">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-5">
          <FilterPanel
            categories={categories} brands={brands}
            category={category} brand={brand}
            setParam={setParam}
            minPrice={minPrice} maxPrice={maxPrice}
            setMinPrice={setMinPrice} setMaxPrice={setMaxPrice}
            clearAll={clearAll}
          />
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="aspect-square skeleton" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-1/3 skeleton rounded" />
                    <div className="h-4 w-2/3 skeleton rounded" />
                    <div className="h-6 w-1/2 skeleton rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayed.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-ink-500 mb-3">No products match your filters.</p>
              <button onClick={clearAll} className="btn-primary">Clear Filters</button>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayed.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </motion.div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
          <motion.div
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            className="absolute left-0 top-0 bottom-0 w-80 bg-white dark:bg-ink-900 p-5 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Filters</h3>
              <button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button>
            </div>
            <FilterPanel
              categories={categories} brands={brands}
              category={category} brand={brand}
              setParam={setParam}
              minPrice={minPrice} maxPrice={maxPrice}
              setMinPrice={setMinPrice} setMaxPrice={setMaxPrice}
              clearAll={clearAll}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}

function FilterPanel({
  categories, brands, category, brand, setParam, minPrice, maxPrice, setMinPrice, setMaxPrice, clearAll,
}: any) {
  const priceRanges = [
    [0, 10000], [10000, 20000], [20000, 40000], [40000, 60000], [60000, 100000], [100000, 200000],
  ];
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-ink-700 dark:text-ink-200">Filters</h3>
        <button onClick={clearAll} className="text-xs text-brand-600 dark:text-brand-400 hover:underline">Clear all</button>
      </div>

      <div>
        <h4 className="label">Category</h4>
        <div className="space-y-1.5">
          <button onClick={() => setParam('category', undefined)} className={cn('block w-full text-left text-sm px-3 py-1.5 rounded-lg transition', !category ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold' : 'hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-700 dark:text-ink-200')}>All Categories</button>
          {categories.map((c: any) => (
            <button key={c.id} onClick={() => setParam('category', c.id)} className={cn('block w-full text-left text-sm px-3 py-1.5 rounded-lg transition', category === c.id ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold' : 'hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-700 dark:text-ink-200')}>{c.name}</button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="label">Brand</h4>
        <div className="space-y-1.5">
          <button onClick={() => setParam('brand', undefined)} className={cn('block w-full text-left text-sm px-3 py-1.5 rounded-lg transition', !brand ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold' : 'hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-700 dark:text-ink-200')}>All Brands</button>
          {brands.map((b: any) => (
            <button key={b.id} onClick={() => setParam('brand', b.id)} className={cn('block w-full text-left text-sm px-3 py-1.5 rounded-lg transition', brand === b.id ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold' : 'hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-700 dark:text-ink-200')}>{b.name}</button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="label">Price Range</h4>
        <div className="space-y-1.5">
          <button onClick={() => { setMinPrice(undefined); setMaxPrice(undefined); }} className={cn('block w-full text-left text-sm px-3 py-1.5 rounded-lg', !minPrice && !maxPrice ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold' : 'hover:bg-ink-100 dark:hover:bg-ink-800')}>All Prices</button>
          {priceRanges.map(([lo, hi]) => (
            <button key={`${lo}-${hi}`} onClick={() => { setMinPrice(lo); setMaxPrice(hi); }} className={cn('block w-full text-left text-sm px-3 py-1.5 rounded-lg', minPrice === lo ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold' : 'hover:bg-ink-100 dark:hover:bg-ink-800')}>
              {inr(lo)} – {inr(hi)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
