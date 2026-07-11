import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, CreditCard, CheckCircle2, IndianRupee, ArrowRight, ShieldCheck, Zap, Truck, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { inr, deliveryCharge, genOrderNumber, genOtp } from '../lib/utils';
import type { Address, AddressSnapshot } from '../types';

export default function Checkout() {
  const { items, subtotal, count, clear } = useCart();
  const { user, profile } = useAuth();
  const { toast } = useToast();


  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<string | null>(null);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [step, setStep] = useState<'address' | 'payment' | 'success'>('address');
  const [processing, setProcessing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<{ id: string; otp: string } | null>(null);
  const [newAddr, setNewAddr] = useState({ label: 'Home', full_name: profile?.full_name || '', phone: profile?.phone || '', line1: '', line2: '', city: '', state: 'Telangana', pincode: '' });
  const [distance] = useState(4);
  const delivCharge = subtotal > 0 ? deliveryCharge(distance) : 0;
  const total = subtotal + delivCharge;

  useEffect(() => {
    if (user) loadAddresses();
  }, [user]);

  const loadAddresses = async () => {
    const { data } = await supabase.from('addresses').select('*').eq('user_id', user!.id).order('is_default', { ascending: false });
    if (data) { setAddresses(data as Address[]); if (data.length > 0) setSelectedAddr(data[0].id); }
  };

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('addresses').insert({ user_id: user!.id, ...newAddr, is_default: addresses.length === 0 }).select('*').single();
    if (error) { toast(error.message, 'error'); return; }
    setAddresses(prev => [...prev, data as Address]);
    setSelectedAddr(data.id);
    setShowAddrForm(false);
    setNewAddr({ label: 'Home', full_name: profile?.full_name || '', phone: profile?.phone || '', line1: '', line2: '', city: '', state: 'Telangana', pincode: '' });
    toast('Address saved');
  };

  if (!user) return <Navigate to="/login?redirect=/checkout" replace />;
  if (count === 0 && step !== 'success') return <Navigate to="/cart" replace />;

  const payNow = async () => {
    setProcessing(true);
    // Simulate Razorpay payment processing
    await new Promise(r => setTimeout(r, 1800));

    const addr = addresses.find(a => a.id === selectedAddr);
    if (!addr) { toast('Select an address', 'error'); setProcessing(false); return; }
    const addrSnapshot: AddressSnapshot = { full_name: addr.full_name, phone: addr.phone, line1: addr.line1, line2: addr.line2, city: addr.city, state: addr.state, pincode: addr.pincode, label: addr.label };
    const orderNumber = genOrderNumber();
    const otp = genOtp();

    const { data: order, error } = await supabase.from('orders').insert({
      user_id: user.id,
      order_number: orderNumber,
      status: 'confirmed',
      items_total: subtotal,
      delivery_charge: delivCharge,
      discount: 0,
      total,
      payment_method: 'razorpay',
      payment_status: 'paid',
      address: addrSnapshot,
      delivery_otp: otp,
      delivery_partner_name: 'MM Express',
      eta_minutes: 45,
    }).select('*').single();

    if (error || !order) { toast(error?.message || 'Order failed', 'error'); setProcessing(false); return; }

    // Insert order items
    const itemRows = items.map(i => ({
      order_id: order.id,
      product_id: i.product.id,
      product_name: i.product.name,
      product_image: i.product.images[0],
      price: i.product.price,
      quantity: i.quantity,
    }));
    await supabase.from('order_items').insert(itemRows);

    // Send notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Order Confirmed!',
      body: `Your order ${orderNumber} has been confirmed. OTP for delivery: ${otp}`,
      type: 'order',
    });

    setProcessing(false);
    setPlacedOrder({ id: order.id, otp });
    setStep('success');
    clear();
  };

  if (step === 'success' && placedOrder) {
    return (
      <div className="container-x py-12">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto card p-8 text-center">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 rounded-full bg-success-100 dark:bg-success-900 text-success-600 dark:text-success-400 grid place-items-center mx-auto mb-4"
          >
            <CheckCircle2 className="w-12 h-12" />
          </motion.div>
          <h1 className="font-display text-2xl font-bold mb-2">Order Placed Successfully!</h1>
          <p className="text-ink-500 mb-6">Thank you for your purchase. Your order is confirmed.</p>

          <div className="card p-4 mb-6 bg-brand-50 dark:bg-brand-950 text-left">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-ink-500 text-xs">Order ID</p><p className="font-bold">{placedOrder.id.slice(0, 8).toUpperCase()}</p></div>
              <div><p className="text-ink-500 text-xs">Delivery OTP</p><p className="font-extrabold text-brand-600 dark:text-brand-400 text-lg">{placedOrder.otp}</p></div>
              <div><p className="text-ink-500 text-xs">Payment</p><p className="font-semibold text-success-600">Paid via Razorpay</p></div>
              <div><p className="text-ink-500 text-xs">ETA</p><p className="font-semibold">~45 minutes</p></div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Link to={`/account/orders`} className="btn-primary">Track Order</Link>
            <Link to="/products" className="btn-outline">Continue Shopping</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container-x py-6">
      <h1 className="font-display text-2xl md:text-3xl font-bold mb-6">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center gap-4 mb-6 text-sm">
        <Step n={1} label="Address" active={step === 'address'} done={step === 'payment'} />
        <div className="h-px flex-1 bg-ink-200 dark:bg-ink-700" />
        <Step n={2} label="Payment" active={step === 'payment'} done={false} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {step === 'address' && (
            <>
              {/* Saved addresses */}
              {addresses.length > 0 && (
                <div className="card p-5">
                  <h2 className="font-semibold mb-3 flex items-center gap-2"><MapPin className="w-5 h-5 text-brand-600" /> Delivery Address</h2>
                  <div className="space-y-2">
                    {addresses.map(a => (
                      <button
                        key={a.id}
                        onClick={() => setSelectedAddr(a.id)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition flex items-start gap-3 ${selectedAddr === a.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-950' : 'border-ink-200 dark:border-ink-700 hover:border-brand-300'}`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 ${selectedAddr === a.id ? 'border-brand-500 bg-brand-500' : 'border-ink-300'}`}>
                          {selectedAddr === a.id && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{a.full_name} <span className="text-ink-500 font-normal">· {a.label}</span></p>
                          <p className="text-sm text-ink-600 dark:text-ink-300">{a.line1}, {a.city}, {a.state} - {a.pincode}</p>
                          <p className="text-xs text-ink-500 mt-0.5">{a.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* New address form */}
              {showAddrForm ? (
                <form onSubmit={saveAddress} className="card p-5 space-y-3">
                  <h2 className="font-semibold">Add New Address</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><label className="label">Full Name</label><input required className="input" value={newAddr.full_name} onChange={(e) => setNewAddr(a => ({ ...a, full_name: e.target.value }))} /></div>
                    <div><label className="label">Phone</label><input required className="input" value={newAddr.phone} onChange={(e) => setNewAddr(a => ({ ...a, phone: e.target.value }))} /></div>
                    <div><label className="label">Address Line 1</label><input required className="input" value={newAddr.line1} onChange={(e) => setNewAddr(a => ({ ...a, line1: e.target.value }))} /></div>
                    <div><label className="label">Address Line 2</label><input className="input" value={newAddr.line2} onChange={(e) => setNewAddr(a => ({ ...a, line2: e.target.value }))} /></div>
                    <div><label className="label">City</label><input required className="input" value={newAddr.city} onChange={(e) => setNewAddr(a => ({ ...a, city: e.target.value }))} /></div>
                    <div><label className="label">State</label><input required className="input" value={newAddr.state} onChange={(e) => setNewAddr(a => ({ ...a, state: e.target.value }))} /></div>
                    <div><label className="label">Pincode</label><input required className="input" value={newAddr.pincode} onChange={(e) => setNewAddr(a => ({ ...a, pincode: e.target.value }))} /></div>
                    <div><label className="label">Label</label><select className="input" value={newAddr.label} onChange={(e) => setNewAddr(a => ({ ...a, label: e.target.value }))}><option>Home</option><option>Work</option><option>Other</option></select></div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary">Save Address</button>
                    <button type="button" onClick={() => setShowAddrForm(false)} className="btn-outline">Cancel</button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setShowAddrForm(true)} className="card p-4 w-full text-center text-brand-600 dark:text-brand-400 font-semibold hover:shadow-card transition flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" /> Add New Address
                </button>
              )}

              {selectedAddr && (
                <button onClick={() => setStep('payment')} className="btn-primary w-full !py-3">Continue to Payment <ArrowRight className="w-4 h-4" /></button>
              )}
            </>
          )}

          {step === 'payment' && (
            <div className="card p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-brand-600" /> Payment Method</h2>
              <div className="space-y-3">
                <div className="p-4 rounded-xl border-2 border-brand-500 bg-brand-50 dark:bg-brand-950 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-600 text-white grid place-items-center font-bold text-xs">R</div>
                  <div className="flex-1">
                    <p className="font-semibold">Razorpay</p>
                    <p className="text-xs text-ink-500">UPI, Cards, NetBanking, Wallets</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-brand-600" />
                </div>
                <div className="p-4 rounded-xl border-2 border-ink-200 dark:border-ink-700 opacity-60 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-ink-400 text-white grid place-items-center font-bold text-xs">C</div>
                  <div className="flex-1"><p className="font-semibold">Cash on Delivery</p><p className="text-xs text-ink-500">Pay when you receive</p></div>
                </div>
              </div>

              {/* EMI info */}
              <div className="mt-4 p-3 rounded-lg bg-accent-50 dark:bg-accent-950 text-accent-700 dark:text-accent-300 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" /> No-Cost EMI available from {inr(Math.round(total / 12))}/mo for 12 months
              </div>

              <div className="flex gap-2 mt-5">
                <button onClick={() => setStep('address')} className="btn-outline">Back</button>
                <button onClick={payNow} disabled={processing} className="btn-primary flex-1 !py-3">
                  {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing Payment…</> : <><ShieldCheck className="w-4 h-4" /> Pay {inr(total)}</>}
                </button>
              </div>
              <p className="flex items-center justify-center gap-1.5 text-xs text-ink-500 mt-3"><ShieldCheck className="w-3.5 h-3.5" /> 256-bit encrypted secure payment</p>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="card p-5 h-fit lg:sticky lg:top-24">
          <h2 className="font-semibold mb-3">Order Summary</h2>
          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-2 text-sm">
                <img src={product.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-ink-800 dark:text-ink-100 text-xs">{product.name}</p>
                  <p className="text-ink-500 text-xs">Qty: {quantity}</p>
                </div>
                <p className="font-semibold text-xs">{inr(product.price * quantity)}</p>
              </div>
            ))}
          </div>
          <dl className="space-y-2 text-sm border-t border-ink-200 dark:border-ink-800 pt-3">
            <div className="flex justify-between"><dt className="text-ink-500">Subtotal</dt><dd className="font-semibold">{inr(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500 flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Delivery ({distance}km)</dt><dd className="font-semibold">{inr(delivCharge)}</dd></div>
            <div className="flex justify-between text-base border-t border-ink-200 dark:border-ink-800 pt-2"><dt className="font-bold">Total</dt><dd className="font-extrabold text-brand-600 dark:text-brand-400 flex items-center"><IndianRupee className="w-4 h-4" />{Math.round(total).toLocaleString('en-IN')}</dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
}

function Step({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full grid place-items-center text-xs font-bold ${done ? 'bg-success-500 text-white' : active ? 'bg-brand-600 text-white' : 'bg-ink-200 dark:bg-ink-700 text-ink-500'}`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : n}
      </div>
      <span className={`font-semibold ${active || done ? 'text-ink-900 dark:text-white' : 'text-ink-500'}`}>{label}</span>
    </div>
  );
}
