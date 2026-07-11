import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, ShoppingCart, GitCompare, Share2, Zap, Shield, Truck, RotateCcw,
  CheckCircle2, ChevronRight, ThumbsUp, ThumbsDown, Sparkles, IndianRupee,
  Cpu, Battery, Camera, Monitor, MemoryStick, Smartphone, Award, Star,
} from 'lucide-react';
import { useProductBySlug, useReviews, useSimilarProducts } from '../hooks/useData';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { RatingStars } from '../components/RatingStars';
import { ProductCard } from '../components/ProductCard';
import { inr, discountPercent, cn, formatDate } from '../lib/utils';
import { aiReviewSummary } from '../lib/ai';
import { supabase } from '../lib/supabase';

const SPEC_ICONS: Record<string, any> = {
  display: Monitor, processor: Cpu, ram: MemoryStick, battery: Battery,
  rear_camera: Camera, front_camera: Camera, storage: MemoryStick, os: Smartphone,
};

export default function ProductDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { product, loading } = useProductBySlug(slug);
  const { data: reviews, loading: reviewsLoading } = useReviews(product?.id);
  const similar = useSimilarProducts(product);
  const { add } = useCart();
  const { has: inWish, toggle: toggleWish } = useWishlist();
  const { has: inCompare, toggle: toggleCompare } = useCompare();
  const { toast } = useToast();
  const { user } = useAuth();

  const [imgIdx, setImgIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<'specs' | 'reviews' | 'ai'>('specs');
  const [newReview, setNewReview] = useState({ rating: 5, title: '', body: '', pros: '', cons: '' });

  if (loading) {
    return (
      <div className="container-x py-10 grid lg:grid-cols-2 gap-8">
        <div className="aspect-square skeleton rounded-2xl" />
        <div className="space-y-3"><div className="h-8 w-2/3 skeleton rounded" /><div className="h-6 w-1/2 skeleton rounded" /><div className="h-24 skeleton rounded" /></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-x py-20 text-center">
        <p className="text-xl font-semibold text-ink-700 dark:text-ink-200 mb-3">Product not found</p>
        <Link to="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  const disc = discountPercent(product.mrp, product.price);
  const wished = inWish(product.id);
  const compared = inCompare(product.id);
  const summary = aiReviewSummary(product, reviews);
  const savings = product.mrp - product.price;

  const handleAdd = async () => { await add(product, qty); toast(`${qty} item(s) added to cart`); };
  const handleBuyNow = async () => { await add(product, qty); nav('/checkout'); };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast('Please login to write a review', 'error'); nav('/login'); return; }
    const { error } = await supabase.from('reviews').insert({
      product_id: product.id,
      user_id: user.id,
      user_name: (await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()).data?.full_name || 'Customer',
      rating: newReview.rating,
      title: newReview.title,
      body: newReview.body,
      pros: newReview.pros.split(',').map(s => s.trim()).filter(Boolean),
      cons: newReview.cons.split(',').map(s => s.trim()).filter(Boolean),
    });
    if (error) { toast(error.message, 'error'); return; }
    toast('Review submitted! Thank you.');
    setNewReview({ rating: 5, title: '', body: '', pros: '', cons: '' });
    setTimeout(() => window.location.reload(), 1200);
  };

  return (
    <div className="container-x py-6">
      <nav className="flex items-center gap-1.5 text-sm text-ink-500 mb-5 overflow-x-auto no-scrollbar">
        <Link to="/" className="hover:text-brand-600 shrink-0">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link to="/products" className="hover:text-brand-600 shrink-0">Products</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-ink-800 dark:text-ink-100 truncate">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Gallery */}
        <div>
          <motion.div
            key={imgIdx}
            initial={{ opacity: 0.3 }} animate={{ opacity: 1 }}
            className="aspect-square rounded-2xl overflow-hidden card bg-ink-50 dark:bg-ink-800"
          >
            <img src={product.images[imgIdx]} alt={product.name} className="w-full h-full object-cover" />
          </motion.div>
          {product.images.length > 1 && (
            <div className="flex gap-2 mt-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={cn('w-20 h-20 rounded-xl overflow-hidden border-2 transition', i === imgIdx ? 'border-brand-500' : 'border-transparent hover:border-ink-300')}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wide mb-1">{product.brands?.name}</p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900 dark:text-white mb-3">{product.name}</h1>
          <div className="flex items-center gap-3 mb-4">
            <RatingStars rating={product.rating} size="md" />
            <span className="text-sm text-ink-500">{product.review_count} reviews</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-3xl font-extrabold text-ink-900 dark:text-white flex items-center"><IndianRupee className="w-6 h-6" />{Math.round(product.price).toLocaleString('en-IN')}</span>
            {disc > 0 && <span className="text-lg text-ink-400 line-through">{inr(product.mrp)}</span>}
            {disc > 0 && <span className="badge bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300">{disc}% off</span>}
          </div>
          {savings > 0 && <p className="text-sm text-success-600 dark:text-success-400 font-medium">You save {inr(savings)}</p>}

          {product.emi_available && product.emi_from > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 rounded-lg px-3 py-2 w-fit">
              <Zap className="w-4 h-4" /> No Cost EMI from {inr(product.emi_from)}/mo
            </div>
          )}

          {/* Colors */}
          {product.colors.length > 0 && (
            <div className="mt-5">
              <p className="label">Color: <span className="font-normal text-ink-600">{product.colors[selectedColor]}</span></p>
              <div className="flex gap-2">
                {product.colors.map((c, i) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(i)}
                    className={cn('px-3 py-1.5 rounded-lg text-sm border-2 transition', i === selectedColor ? 'border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300' : 'border-ink-200 dark:border-ink-700 hover:border-ink-400')}
                  >{c}</button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + stock */}
          <div className="mt-5 flex items-center gap-4">
            <div>
              <p className="label">Quantity</p>
              <div className="flex items-center border border-ink-300 dark:border-ink-700 rounded-xl overflow-hidden w-fit">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-10 hover:bg-ink-100 dark:hover:bg-ink-800 text-lg">−</button>
                <span className="w-12 text-center font-semibold">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="w-9 h-10 hover:bg-ink-100 dark:hover:bg-ink-800 text-lg">+</button>
              </div>
            </div>
            <div>
              {product.stock > 0 ? (
                <p className="flex items-center gap-1.5 text-sm text-success-600 dark:text-success-400 font-medium mt-6"><CheckCircle2 className="w-4 h-4" /> In Stock ({product.stock} left)</p>
              ) : (
                <p className="text-sm text-error-500 font-medium mt-6">Out of Stock</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={handleAdd} className="btn-secondary flex-1 min-w-[140px] !py-3">
              <ShoppingCart className="w-5 h-5" /> Add to Cart
            </button>
            <button onClick={handleBuyNow} className="btn-primary flex-1 min-w-[140px] !py-3">
              <Zap className="w-5 h-5" /> Buy Now
            </button>
            <button
              onClick={() => { toggleWish(product); toast(wished ? 'Removed from wishlist' : 'Added to wishlist', 'info'); }}
              className={cn('btn !px-3 !py-3', wished ? 'bg-error-500 text-white' : 'btn-outline')}
            >
              <Heart className={cn('w-5 h-5', wished && 'fill-current')} />
            </button>
            <button
              onClick={() => { toggleCompare(product); toast(compared ? 'Removed from compare' : 'Added to compare', 'info'); }}
              className={cn('btn !px-3 !py-3', compared ? 'bg-brand-600 text-white' : 'btn-outline')}
            >
              <GitCompare className="w-5 h-5" />
            </button>
            <button onClick={() => { navigator.clipboard?.writeText(window.location.href); toast('Link copied!'); }} className="btn-outline !px-3 !py-3">
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Highlights */}
          {product.highlights.length > 0 && (
            <div className="mt-6 card p-4">
              <h3 className="font-semibold text-sm mb-2">Highlights</h3>
              <ul className="grid grid-cols-2 gap-2">
                {product.highlights.map(h => (
                  <li key={h} className="flex items-start gap-2 text-sm text-ink-700 dark:text-ink-200">
                    <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0 mt-0.5" /> {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Trust */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { icon: Truck, label: 'Same-day Delivery' },
              { icon: Shield, label: '1-Yr Warranty' },
              { icon: RotateCcw, label: '7-Day Returns' },
            ].map(t => (
              <div key={t.label} className="flex flex-col items-center text-center gap-1 p-2">
                <t.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <p className="text-[11px] text-ink-600 dark:text-ink-300">{t.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="flex gap-1 border-b border-ink-200 dark:border-ink-800 mb-6 overflow-x-auto no-scrollbar">
          {([['specs','Specifications'],['reviews',`Reviews (${reviews.length})`],['ai','AI Review Summary']] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cn('px-5 py-3 font-semibold text-sm whitespace-nowrap border-b-2 -mb-px transition flex items-center gap-1.5', tab === k ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-ink-500 hover:text-ink-800 dark:hover:text-ink-200')}
            >
              {k === 'ai' && <Sparkles className="w-4 h-4" />} {l}
            </button>
          ))}
        </div>

        {/* Specs tab */}
        {tab === 'specs' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="font-semibold mb-4">Technical Specifications</h3>
              <dl className="divide-y divide-ink-100 dark:divide-ink-800">
                {Object.entries(product.specs).map(([k, v]) => {
                  const Icon = SPEC_ICONS[k] || Smartphone;
                  return (
                    <div key={k} className="flex items-center gap-3 py-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 grid place-items-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <dt className="text-sm text-ink-500 capitalize w-32 shrink-0">{k.replace(/_/g, ' ')}</dt>
                      <dd className="text-sm font-medium text-ink-800 dark:text-ink-100 flex-1">{v}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold mb-4">Description</h3>
              <p className="text-sm text-ink-700 dark:text-ink-200 leading-relaxed mb-4">{product.description}</p>
              <div className="grid grid-cols-2 gap-3">
                {product.highlights.map(h => (
                  <div key={h} className="flex items-center gap-2 text-sm">
                    <Award className="w-4 h-4 text-accent-500 shrink-0" /> {h}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reviews tab */}
        {tab === 'reviews' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {reviewsLoading ? <p className="text-ink-500">Loading reviews…</p> : null}
              {reviews.length === 0 && !reviewsLoading ? (
                <div className="card p-8 text-center">
                  <p className="text-ink-500 mb-2">No reviews yet. Be the first to review!</p>
                </div>
              ) : (
                reviews.map((r: any) => (
                  <div key={r.id} className="card p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white grid place-items-center font-bold text-sm">{r.user_name?.[0]?.toUpperCase() || 'U'}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-ink-900 dark:text-white">{r.user_name}</p>
                        <p className="text-xs text-ink-500">{formatDate(r.created_at)}</p>
                      </div>
                      <RatingStars rating={r.rating} size="xs" showValue={false} />
                    </div>
                    {r.title && <h4 className="font-semibold text-sm mb-1">{r.title}</h4>}
                    <p className="text-sm text-ink-700 dark:text-ink-200 mb-3">{r.body}</p>
                    {r.pros?.length > 0 && (
                      <div className="mb-2">
                        {r.pros.map((p: string) => <p key={p} className="text-xs flex items-center gap-1.5 text-success-700 dark:text-success-400"><ThumbsUp className="w-3 h-3" /> {p}</p>)}
                      </div>
                    )}
                    {r.cons?.length > 0 && (
                      <div>
                        {r.cons.map((c: string) => <p key={c} className="text-xs flex items-center gap-1.5 text-error-700 dark:text-error-400"><ThumbsDown className="w-3 h-3" /> {c}</p>)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Write review */}
            <form onSubmit={submitReview} className="card p-5 h-fit">
              <h3 className="font-semibold mb-3">Write a Review</h3>
              <div className="mb-3">
                <label className="label">Rating</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button type="button" key={s} onClick={() => setNewReview(r => ({ ...r, rating: s }))}>
                      <Star className={cn('w-6 h-6', s <= newReview.rating ? 'fill-accent-400 text-accent-400' : 'text-ink-300 dark:text-ink-600')} />
                    </button>
                  ))}
                </div>
              </div>
              <input className="input mb-2" placeholder="Review title" value={newReview.title} onChange={e => setNewReview(r => ({ ...r, title: e.target.value }))} />
              <textarea className="input mb-2" rows={3} placeholder="Your review" value={newReview.body} onChange={e => setNewReview(r => ({ ...r, body: e.target.value }))} />
              <input className="input mb-2" placeholder="Pros (comma separated)" value={newReview.pros} onChange={e => setNewReview(r => ({ ...r, pros: e.target.value }))} />
              <input className="input mb-3" placeholder="Cons (comma separated)" value={newReview.cons} onChange={e => setNewReview(r => ({ ...r, cons: e.target.value }))} />
              <button type="submit" className="btn-primary w-full">Submit Review</button>
            </form>
          </div>
        )}

        {/* AI summary tab */}
        {tab === 'ai' && (
          <div className="max-w-3xl">
            <div className="card p-6 bg-gradient-to-br from-brand-50 to-accent-50 dark:from-ink-900 dark:to-ink-950 border-brand-200 dark:border-brand-900">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 text-white grid place-items-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold">AI Review Summary</h3>
                  <p className="text-xs text-ink-500">Generated from {reviews.length || product.review_count} reviews</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-5">
                <div className="text-center">
                  <p className="font-display text-4xl font-extrabold text-brand-600 dark:text-brand-400">{summary.overall.toFixed(1)}</p>
                  <RatingStars rating={summary.overall} size="xs" showValue={false} />
                </div>
                <div>
                  <span className={cn('badge', summary.sentiment === 'Excellent' ? 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300' : 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300')}>{summary.sentiment}</span>
                  <p className="text-sm text-ink-600 dark:text-ink-300 mt-2">{summary.summary}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-success-700 dark:text-success-400 mb-2 flex items-center gap-1.5"><ThumbsUp className="w-4 h-4" /> Pros</h4>
                  <ul className="space-y-1.5">
                    {summary.pros.map(p => (
                      <li key={p.text} className="text-sm flex items-center justify-between">
                        <span className="text-ink-700 dark:text-ink-200">{p.text}</span>
                        <span className="text-xs font-bold text-success-600">{p.count}×</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-error-700 dark:text-error-400 mb-2 flex items-center gap-1.5"><ThumbsDown className="w-4 h-4" /> Cons</h4>
                  <ul className="space-y-1.5">
                    {summary.cons.length > 0 ? summary.cons.map(c => (
                      <li key={c.text} className="text-sm flex items-center justify-between">
                        <span className="text-ink-700 dark:text-ink-200">{c.text}</span>
                        <span className="text-xs font-bold text-error-600">{c.count}×</span>
                      </li>
                    )) : <li className="text-sm text-ink-500">No significant cons reported</li>}
                  </ul>
                </div>
              </div>

              <div className="mt-5 p-4 rounded-xl bg-white dark:bg-ink-900 border border-brand-200 dark:border-brand-900">
                <p className="text-sm font-medium text-ink-800 dark:text-white"><Sparkles className="w-4 h-4 inline text-brand-500 mr-1" /> AI Recommendation: <span className="text-ink-600 dark:text-ink-300 font-normal">{summary.recommendation}</span></p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Similar products */}
      {similar.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-xl font-bold mb-5">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {similar.slice(0, 6).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}
