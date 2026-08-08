import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GitCompare, X, Sparkles, Trophy, Check, IndianRupee } from 'lucide-react';
import { useCompare } from '../context/CompareContext';
import { useProducts } from '../hooks/useData';
import { aiCompare } from '../lib/ai';
import { inr, discountPercent, cn } from '../lib/utils';
import { RatingStars } from '../components/RatingStars';
import { ProductCard } from '../components/ProductCard';

export default function Compare() {
  const { items, remove, clear } = useCompare();
  const { data: all } = useProducts({});
  const verdict = items.length >= 2 ? aiCompare(items) : null;

  return (
    <div className="container-x py-6 page-fill">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white grid place-items-center">
          <GitCompare className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900 dark:text-white">Compare Mobiles</h1>
          <p className="text-sm text-ink-500">Side-by-side comparison with AI verdict</p>
        </div>
      </div>

      {items.length < 2 ? (
        <div className="card p-12 text-center">
          <GitCompare className="w-16 h-16 mx-auto text-ink-300 dark:text-ink-700 mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Add phones to compare</h2>
          <p className="text-ink-500 mb-6">Select 2-4 phones to see a detailed comparison and AI-powered verdict.</p>
          <Link to="/products" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <>
          {/* AI Verdict */}
          {verdict && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="card p-5 mb-6 bg-gradient-to-r from-brand-50 to-accent-50 dark:from-ink-900 dark:to-ink-950 border-brand-200 dark:border-brand-900"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-brand-600" />
                <h2 className="font-display text-lg font-bold">AI Comparison Verdict</h2>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-7 h-7 text-accent-500" />
                <p className="font-semibold text-ink-900 dark:text-white">{verdict.winnerLabel}</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {verdict.analysis.map(a => {
                  const winner = items.find(p => p.id === a.winnerId)!;
                  return (
                    <div key={a.dimension} className="rounded-xl bg-white dark:bg-ink-900 p-3 border border-ink-200 dark:border-ink-800">
                      <p className="text-xs font-semibold text-ink-500 uppercase">{a.dimension}</p>
                      <p className="text-sm font-bold text-ink-900 dark:text-white mt-0.5">{winner.name.split(' ').slice(-2).join(' ')}</p>
                      <p className="text-xs text-ink-500 mt-1">{a.reason}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Comparison table */}
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <tbody>
                {/* Header row with images */}
                <tr>
                  <td className="p-4 w-32 sticky left-0 bg-white dark:bg-ink-900 font-semibold text-sm text-ink-500">Product</td>
                  {items.map(p => (
                    <td key={p.id} className="p-4 align-top min-w-[200px]">
                      <div className="relative">
                        <button onClick={() => remove(p.id)} className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-error-500 text-white grid place-items-center z-10"><X className="w-3.5 h-3.5" /></button>
                        <div className="aspect-square rounded-xl overflow-hidden bg-ink-50 dark:bg-ink-800 mb-2">
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <Link to={`/product/${p.slug}`} className="font-semibold text-sm text-ink-900 dark:text-white hover:text-brand-600 line-clamp-2">{p.name}</Link>
                      </div>
                    </td>
                  ))}
                </tr>
                {/* Price */}
                <Row label="Price" items={items} render={p => <span className="font-extrabold text-brand-600 dark:text-brand-400 flex items-center"><IndianRupee className="w-4 h-4" />{Math.round(p.price).toLocaleString('en-IN')}</span>} />
                <Row label="MRP" items={items} render={p => <span className="text-ink-500 line-through">{inr(p.mrp)}</span>} />
                <Row label="Discount" items={items} render={p => <span className="text-success-600 font-semibold">{discountPercent(p.mrp, p.price)}% off</span>} />
                <Row label="Rating" items={items} render={p => <RatingStars rating={p.rating} size="xs" />} highlight={verdict ? verdict.analysis.find(a => a.dimension === 'Value')?.winnerId : undefined} />
                {/* Specs */}
                {items[0] && Object.keys(items[0].specs).map(key => (
                  <Row
                    key={key}
                    label={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    items={items}
                    render={p => <span className="text-sm">{p.specs[key] || '—'}</span>}
                    highlight={verdict ? verdict.analysis.find(a => a.dimension.toLowerCase().replace(/[^a-z]/g, '') === key.toLowerCase().replace(/[^a-z]/g, ''))?.winnerId : undefined}
                  />
                ))}
                <Row label="Highlights" items={items} render={(p: any) => <ul className="space-y-1">{p.highlights.slice(0, 3).map((h: string) => <li key={h} className="text-xs flex items-start gap-1"><Check className="w-3 h-3 text-success-500 mt-0.5 shrink-0" />{h}</li>)}</ul>} />
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between">
            <button onClick={clear} className="btn-outline">Clear All</button>
            <Link to="/products" className="btn-primary">Add More Products</Link>
          </div>
        </>
      )}

      {/* Suggestions */}
      {all.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-xl font-bold mb-5">Popular to Compare</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {all.slice(0, 6).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, items, render, highlight }: {
  label: string;
  items: any[];
  render: (p: any) => React.ReactNode;
  highlight?: string;
}) {
  return (
    <tr className="border-t border-ink-100 dark:border-ink-800">
      <td className="p-4 sticky left-0 bg-white dark:bg-ink-900 font-semibold text-sm text-ink-500">{label}</td>
      {items.map(p => (
        <td key={p.id} className={cn('p-4', highlight === p.id && 'bg-success-50 dark:bg-success-950/30')}>
          {render(p)}
        </td>
      ))}
    </tr>
  );
}
