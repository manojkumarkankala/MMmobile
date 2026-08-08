import { useProducts } from '../hooks/useData';
import { ProductCard } from '../components/ProductCard';
import { Sparkles } from 'lucide-react';

export default function NewArrivals() {
  const { data, loading } = useProducts({ isNew: true, sort: 'newest' });

  return (
    <div className="container-x py-6 page-fill">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-success-500 to-brand-600 text-white grid place-items-center">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900 dark:text-white">New Arrivals</h1>
          <p className="text-sm text-ink-500">Fresh stock just landed at MMMobiles</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="card"><div className="aspect-square skeleton" /><div className="p-4 space-y-2"><div className="h-3 w-1/2 skeleton rounded" /><div className="h-4 w-3/4 skeleton rounded" /></div></div>)}
        </div>
      ) : data.length === 0 ? (
        <p className="text-ink-500">No new arrivals at the moment.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  );
}
