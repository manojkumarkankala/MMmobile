import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, GitCompare, Eye, Zap, IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ProductWithRefs } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { useToast } from '../context/ToastContext';
import { inr, discountPercent, cn } from '../lib/utils';
import { RatingStars } from './RatingStars';

export function ProductCard({ product, index = 0 }: { product: ProductWithRefs; index?: number }) {
  const { add } = useCart();
  const { has: inWish, toggle: toggleWish } = useWishlist();
  const { has: inCompare, toggle: toggleCompare } = useCompare();
  const { toast } = useToast();
  const wished = inWish(product.id);
  const compared = inCompare(product.id);
  const disc = discountPercent(product.mrp, product.price);

  const onAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await add(product, 1);
    toast('Added to cart');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link
        to={`/product/${product.slug}`}
        className="group card overflow-hidden hover:shadow-card hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
      >
        <div className="relative aspect-square bg-ink-50 dark:bg-ink-800 overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
            {disc > 0 && <span className="badge bg-error-500 text-white">-{disc}%</span>}
            {product.is_new && <span className="badge bg-success-500 text-white">NEW</span>}
          </div>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWish(product); toast(wished ? 'Removed from wishlist' : 'Added to wishlist', 'info'); }}
            className={cn(
              'absolute top-2 right-2 w-9 h-9 rounded-full flex items-center justify-center transition-all',
              wished ? 'bg-error-500 text-white' : 'bg-white/90 dark:bg-ink-900/90 text-ink-600 dark:text-ink-300 hover:text-error-500'
            )}
            aria-label="Toggle wishlist"
          >
            <Heart className={cn('w-4 h-4', wished && 'fill-current')} />
          </button>
          <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(product); toast(compared ? 'Removed from compare' : 'Added to compare', 'info'); }}
              className={cn('w-8 h-8 rounded-full flex items-center justify-center shadow', compared ? 'bg-brand-600 text-white' : 'bg-white dark:bg-ink-900 text-ink-600 dark:text-ink-300')}
              title="Compare"
            >
              <GitCompare className="w-4 h-4" />
            </button>
            <span className="w-8 h-8 rounded-full bg-white dark:bg-ink-900 text-ink-600 dark:text-ink-300 flex items-center justify-center shadow" title="View">
              <Eye className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div className="p-3.5 flex flex-col gap-1.5 flex-1">
          <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wide">{product.brands?.name}</p>
          <h3 className="font-semibold text-sm text-ink-900 dark:text-white line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug min-h-[2.5rem]">
            {product.name}
          </h3>
          <RatingStars rating={product.rating} size="xs" />
          <div className="mt-auto pt-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-ink-900 dark:text-white flex items-center"><IndianRupee className="w-4 h-4" />{Math.round(product.price).toLocaleString('en-IN')}</span>
              {disc > 0 && <span className="text-xs text-ink-400 line-through">{inr(product.mrp)}</span>}
            </div>
            {product.emi_available && product.emi_from > 0 && (
              <p className="text-[11px] text-success-600 dark:text-success-400 font-medium flex items-center gap-0.5 mt-0.5">
                <Zap className="w-3 h-3" /> EMI from {inr(product.emi_from)}/mo
              </p>
            )}
            <button
              onClick={onAdd}
              className="btn-primary w-full mt-2.5 py-2 text-sm group/btn"
            >
              <ShoppingCart className="w-4 h-4 group-hover/btn:scale-110 transition-transform" /> Add to Cart
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
