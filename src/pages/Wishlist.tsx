import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { inr } from '../lib/utils';

export default function Wishlist() {
  const { items, ids, toggle, loading } = useWishlist();
  const { add } = useCart();
  const { toast } = useToast();

  return (
    <div className="container-x py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-error-500 text-white grid place-items-center"><Heart className="w-5 h-5 fill-current" /></div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900 dark:text-white">My Wishlist</h1>
          <p className="text-sm text-ink-500">{ids.length} saved item(s)</p>
        </div>
      </div>

      {loading ? (
        <p className="text-ink-500">Loading…</p>
      ) : ids.length === 0 ? (
        <div className="card p-12 text-center">
          <Heart className="w-16 h-16 mx-auto text-ink-300 dark:text-ink-700 mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">No saved items yet</h2>
          <p className="text-ink-500 mb-6">Tap the heart on any product to save it for later.</p>
          <Link to="/products" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.length > 0 ? items.map(p => (
            <div key={p.id} className="card p-4 flex gap-4">
              <Link to={`/product/${p.slug}`} className="w-24 h-24 rounded-xl overflow-hidden bg-ink-50 dark:bg-ink-800 shrink-0">
                <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${p.slug}`} className="font-semibold text-sm text-ink-900 dark:text-white hover:text-brand-600 line-clamp-2">{p.name}</Link>
                <p className="font-extrabold text-brand-600 dark:text-brand-400 mt-1">{inr(p.price)}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { add(p, 1); toast('Added to cart'); }} className="btn-primary !py-1.5 !px-3 text-xs"><ShoppingCart className="w-3.5 h-3.5" /> Add</button>
                  <button onClick={() => toggle(p)} className="btn-outline !py-1.5 !px-3 text-xs text-error-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          )) : (
            // Guest users only have ids; show prompt to login to view saved items
            <div className="col-span-full card p-8 text-center">
              <p className="text-ink-600 dark:text-ink-300 mb-3">You have {ids.length} item(s) saved locally. <Link to="/login" className="text-brand-600 font-semibold">Login</Link> to sync your wishlist across devices.</p>
              <Link to="/products" className="btn-primary">Browse Products</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
