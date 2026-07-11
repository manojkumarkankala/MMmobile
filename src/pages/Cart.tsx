import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, IndianRupee, Tag, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { inr, deliveryCharge } from '../lib/utils';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Cart() {
  const { items, subtotal, count, updateQty, remove, clear } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [distance] = useState(4); // demo distance for delivery calc

  const delivCharge = subtotal > 0 ? deliveryCharge(distance) : 0;
  const total = subtotal + delivCharge - discount;

  const applyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code === 'MM10' && subtotal >= 9999) { setDiscount(Math.min(subtotal * 0.1, 3000)); toast('Coupon MM10 applied — 10% off!'); }
    else if (code === 'MM20' && subtotal >= 49999) { setDiscount(Math.min(subtotal * 0.2, 10000)); toast('Coupon MM20 applied — 20% off!'); }
    else if (code === 'WELCOME15' && subtotal >= 14999) { setDiscount(Math.min(subtotal * 0.15, 5000)); toast('Coupon WELCOME15 applied — 15% off!'); }
    else { setDiscount(0); toast('Invalid coupon or minimum order not met', 'error'); }
  };

  if (count === 0) {
    return (
      <div className="container-x py-20 text-center">
        <ShoppingBag className="w-20 h-20 mx-auto text-ink-300 dark:text-ink-700 mb-4" />
        <h1 className="font-display text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-ink-500 mb-6">Add some phones to get started!</p>
        <Link to="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="container-x py-6">
      <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900 dark:text-white mb-6">Shopping Cart ({count})</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map(({ product, quantity }) => (
            <motion.div key={product.id} layout className="card p-4 flex gap-4">
              <Link to={`/product/${product.slug}`} className="w-24 h-24 rounded-xl overflow-hidden bg-ink-50 dark:bg-ink-800 shrink-0">
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${product.slug}`} className="font-semibold text-sm text-ink-900 dark:text-white hover:text-brand-600 line-clamp-2">{product.name}</Link>
                <p className="text-xs text-ink-500 mt-0.5">{(product as any).brands?.name}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-extrabold text-ink-900 dark:text-white flex items-center"><IndianRupee className="w-4 h-4" />{Math.round(product.price).toLocaleString('en-IN')}</span>
                  {product.mrp > product.price && <span className="text-xs text-ink-400 line-through">{inr(product.mrp)}</span>}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-ink-300 dark:border-ink-700 rounded-lg overflow-hidden">
                    <button onClick={() => updateQty(product.id, quantity - 1)} className="w-8 h-8 hover:bg-ink-100 dark:hover:bg-ink-800"><Minus className="w-3.5 h-3.5 mx-auto" /></button>
                    <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                    <button onClick={() => updateQty(product.id, quantity + 1)} className="w-8 h-8 hover:bg-ink-100 dark:hover:bg-ink-800"><Plus className="w-3.5 h-3.5 mx-auto" /></button>
                  </div>
                  <button onClick={() => remove(product.id)} className="text-error-500 hover:text-error-700 text-sm flex items-center gap-1">
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-ink-500">Subtotal</p>
                <p className="font-bold text-ink-900 dark:text-white">{inr(product.price * quantity)}</p>
              </div>
            </motion.div>
          ))}
          <button onClick={() => { clear(); toast('Cart cleared', 'info'); }} className="text-sm text-error-500 hover:underline">Clear cart</button>
        </div>

        {/* Summary */}
        <div className="card p-5 h-fit lg:sticky lg:top-24">
          <h2 className="font-semibold text-lg mb-4">Order Summary</h2>

          <form onSubmit={applyCoupon} className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Coupon code" className="input pl-9 text-sm" />
            </div>
            <button type="submit" className="btn-secondary !py-2 text-sm">Apply</button>
          </form>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink-500">Subtotal ({count} items)</dt><dd className="font-semibold">{inr(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Delivery ({distance} km)</dt><dd className="font-semibold">{delivCharge === 0 ? 'FREE' : inr(delivCharge)}</dd></div>
            {discount > 0 && <div className="flex justify-between text-success-600"><dt>Discount</dt><dd className="font-semibold">−{inr(discount)}</dd></div>}
            <div className="border-t border-ink-200 dark:border-ink-800 pt-2 flex justify-between text-base">
              <dt className="font-bold">Total</dt><dd className="font-extrabold text-brand-600 dark:text-brand-400">{inr(total)}</dd>
            </div>
          </dl>

          <button
            onClick={() => { if (!user) { toast('Please login to checkout', 'info'); nav('/login?redirect=/checkout'); } else nav('/checkout'); }}
            className="btn-primary w-full mt-4 !py-3 group"
          >
            Proceed to Checkout <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </button>
          <p className="flex items-center justify-center gap-1.5 text-xs text-ink-500 mt-3"><ShieldCheck className="w-3.5 h-3.5" /> Secured by Razorpay</p>
          <p className="text-xs text-ink-400 mt-1 text-center">EMI available at checkout</p>
        </div>
      </div>
    </div>
  );
}
