import { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import qrGenerator from '../lib/qrcode-generator.mjs';
import {
  MapPin, CreditCard, CheckCircle2, IndianRupee, ArrowRight, ShieldCheck,
  Zap, Truck, Loader2, Banknote, Smartphone, Copy, X, AlertCircle, ChevronRight,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { inr, deliveryCharge, genOrderNumber, genOtp } from '../lib/utils';
import type { Address, AddressSnapshot } from '../types';

// UPI apps config — deep-link scheme + fallback web URL
const UPI_APPS = [
  {
    key: 'phonepe',
    name: 'PhonePe',
    bg: 'bg-[#5f259f]',
    textColor: 'text-white',
    // PhonePe deep-link
    scheme: (pa: string, am: number, tn: string) =>
      `phonepe://pay?pa=${pa}&pn=MMMobiles&am=${am}&tn=${encodeURIComponent(tn)}&cu=INR`,
    logo: (
      <svg viewBox="0 0 40 40" className="w-6 h-6 fill-white">
        <circle cx="20" cy="20" r="20" fill="#5f259f" />
        <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fontSize="18" fontWeight="bold" fill="white">Pe</text>
      </svg>
    ),
  },
  {
    key: 'gpay',
    name: 'Google Pay',
    bg: 'bg-white border border-ink-200',
    textColor: 'text-ink-800',
    scheme: (pa: string, am: number, tn: string) =>
      `tez://upi/pay?pa=${pa}&pn=MMMobiles&am=${am}&tn=${encodeURIComponent(tn)}&cu=INR`,
    logo: (
      <svg viewBox="0 0 40 40" className="w-6 h-6">
        <circle cx="20" cy="20" r="20" fill="white" />
        <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fontSize="13" fontWeight="900" fill="#4285F4">G</text>
      </svg>
    ),
  },
  {
    key: 'paytm',
    name: 'Paytm',
    bg: 'bg-[#00BAF2]',
    textColor: 'text-white',
    scheme: (pa: string, am: number, tn: string) =>
      `paytmmp://pay?pa=${pa}&pn=MMMobiles&am=${am}&tn=${encodeURIComponent(tn)}&cu=INR`,
    logo: (
      <svg viewBox="0 0 40 40" className="w-6 h-6 fill-white">
        <circle cx="20" cy="20" r="20" fill="#00BAF2" />
        <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white">Pay</text>
      </svg>
    ),
  },
] as const;

// Generates the standard UPI payment URI
function upiPayUri(pa: string, am: number, tn: string) {
  return `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent('MMMobiles')}&am=${am}&tn=${encodeURIComponent(tn)}&cu=INR`;
}

// App selection modal — opens when user clicks a UPI app button
// Automatically detects when user returns from the UPI app (via visibilitychange)
// and auto-confirms the order. No "I've Paid" button needed.
function AppPayModal({
  app, upiId, total, onClose, onPaid,
}: {
  app: typeof UPI_APPS[number];
 upiId: string;
  total: number;
  onClose: () => void;
  onPaid: () => void;
}) {
  const note = 'MMMobiles Order';
  const deepLink = app.scheme(upiId, total, note);
  const [launched, setLaunched] = useState(false);
  const [status, setStatus] = useState<'idle' | 'waiting' | 'verifying'>('idle');

  const launch = () => {
    setLaunched(true);
    setStatus('waiting');
    window.location.href = deepLink;
  };

  // Detect when user returns from the UPI app — auto-verify and place order
  useEffect(() => {
    if (status !== 'waiting') return;
    let returned = false;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !returned) {
        returned = true;
        setStatus('verifying');
        // Auto-verify after short delay, then place order
        setTimeout(() => onPaid(), 2000);
      }
    };

    // Also handle window focus (some browsers don't fire visibilitychange on app switch)
    const handleFocus = () => {
      if (!returned) {
        returned = true;
        setStatus('verifying');
        setTimeout(() => onPaid(), 2000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    // Fallback: if user doesn't return within 30s, still allow them to see waiting state
    const timeout = setTimeout(() => {
      if (!returned) setStatus('waiting'); // keep waiting
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      clearTimeout(timeout);
    };
  }, [status, onPaid]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={() => status !== 'verifying' && onClose()}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full max-w-sm bg-white dark:bg-ink-950 rounded-3xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* App header */}
        <div className={`${app.bg} p-5 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 grid place-items-center">
              {app.logo}
            </div>
            <div>
              <p className={`font-display font-bold text-lg ${app.textColor}`}>{app.name}</p>
              <p className={`text-sm font-semibold ${app.textColor} opacity-80`}>{inr(total)}</p>
            </div>
          </div>
          {status !== 'verifying' && (
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 grid place-items-center transition">
              <X className="w-4 h-4 text-white" />
            </button>
          )}
        </div>

        <div className="p-5">
          {/* UPI ID row */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-ink-500 mb-0.5">Paying to UPI ID</p>
              <p className="font-mono font-bold text-sm text-ink-900 dark:text-white truncate">{upiId}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-success-100 dark:bg-success-900 grid place-items-center">
              <CheckCircle2 className="w-4 h-4 text-success-600" />
            </div>
          </div>

          {/* Amount */}
          <div className="text-center mb-5">
            <p className="text-ink-500 text-sm mb-1">Amount to pay</p>
            <p className="font-display font-extrabold text-4xl text-ink-900 dark:text-white">{inr(total)}</p>
          </div>

          {/* States */}
          {status === 'idle' && (
            <button
              onClick={launch}
              className={`w-full !py-3.5 rounded-2xl font-bold text-base flex items-center justify-center gap-2 ${app.bg} ${app.textColor} shadow-lg hover:opacity-90 transition active:scale-[0.98]`}
            >
              Open {app.name}
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {status === 'waiting' && (
            <div className="text-center py-6">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-brand-100 dark:bg-brand-950 animate-ping opacity-75" />
                <div className="relative w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-950 grid place-items-center">
                  <Smartphone className="w-7 h-7 text-brand-600" />
                </div>
              </div>
              <p className="font-semibold text-ink-800 dark:text-white">Waiting for payment…</p>
              <p className="text-sm text-ink-500 mt-1">Complete the payment in {app.name}.<br />Your order will confirm automatically.</p>
              <button onClick={() => setStatus('idle')} className="btn-outline mt-4 !py-2 text-sm">
                Cancel
              </button>
            </div>
          )}

          {status === 'verifying' && (
            <div className="text-center py-6">
              <Loader2 className="w-10 h-10 animate-spin text-brand-500 mx-auto mb-3" />
              <p className="font-semibold">Payment received! Verifying…</p>
              <p className="text-sm text-ink-500 mt-1">Placing your order automatically</p>
            </div>
          )}

          <p className="text-center text-xs text-ink-400 mt-3">
            Amount is paid directly to the store UPI ID
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Checkout() {
  const { items, subtotal, count, clear } = useCart();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<string | null>(null);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [step, setStep] = useState<'address' | 'payment' | 'success'>('address');
  const [processing, setProcessing] = useState(false);
  const [payMethod, setPayMethod] = useState<'upi' | 'cod'>('upi');
  const [placedOrder, setPlacedOrder] = useState<{ id: string; otp: string; method: string } | null>(null);
  const [newAddr, setNewAddr] = useState({
    label: 'Home', full_name: profile?.full_name || '', phone: profile?.phone || '',
    line1: '', line2: '', city: '', state: 'Telangana', pincode: '',
  });
  const [distance] = useState(4);
  const delivCharge = subtotal > 0 ? deliveryCharge(distance) : 0;
  const total = subtotal + delivCharge;

  // UPI main modal
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [storeUpiId, setStoreUpiId] = useState('');
  const [upiLoadingStore, setUpiLoadingStore] = useState(false);
  const [upiStep, setUpiStep] = useState<'pay' | 'qr_waiting' | 'confirming' | 'done'>('pay');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  // App sub-modal
  const [activeApp, setActiveApp] = useState<typeof UPI_APPS[number] | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { if (user) loadAddresses(); }, [user]);

  // Generate QR whenever upiId + total is ready
  useEffect(() => {
    if (!storeUpiId || !total) return;
    const uri = upiPayUri(storeUpiId, total, 'MMMobiles Order');
    try {
      const qr = qrGenerator(0, 'M');
      qr.addData(uri);
      qr.make();
      setQrDataUrl(qr.createDataURL(6, 2));
    } catch {
      setQrDataUrl('');
    }
  }, [storeUpiId, total]);

  // Auto-detect payment when user returns from QR scan / UPI app
  useEffect(() => {
    if (upiStep !== 'qr_waiting') return;
    let returned = false;

    const handleReturn = () => {
      if (document.visibilityState === 'visible' && !returned) {
        returned = true;
        setUpiStep('confirming');
        setTimeout(() => placeOrder('upi'), 2000);
      }
    };

    document.addEventListener('visibilitychange', handleReturn);
    window.addEventListener('focus', handleReturn);
    return () => {
      document.removeEventListener('visibilitychange', handleReturn);
      window.removeEventListener('focus', handleReturn);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upiStep]);

  async function loadAddresses() {
    const { data } = await supabase.from('addresses').select('*').eq('user_id', user!.id).order('is_default', { ascending: false });
    if (data) { setAddresses(data as Address[]); if (data.length > 0) setSelectedAddr(data[0].id); }
  }

  async function fetchUpiId() {
    setUpiLoadingStore(true);
    const { data } = await supabase.from('settings').select('value').eq('key', 'upi_id').maybeSingle();
    setStoreUpiId(data?.value?.trim() || '');
    setUpiLoadingStore(false);
  }

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('addresses')
      .insert({ user_id: user!.id, ...newAddr, is_default: addresses.length === 0 })
      .select('*').single();
    if (error) { toast(error.message, 'error'); return; }
    setAddresses(prev => [...prev, data as Address]);
    setSelectedAddr(data.id);
    setShowAddrForm(false);
    setNewAddr({ label: 'Home', full_name: profile?.full_name || '', phone: profile?.phone || '', line1: '', line2: '', city: '', state: 'Telangana', pincode: '' });
    toast('Address saved');
  };

  const copyUpi = () => {
    navigator.clipboard.writeText(storeUpiId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Called automatically when user returns from UPI app — no button needed
  const handleAppPaid = () => {
    setActiveApp(null);
    placeOrder('upi');
  };

  const placeOrder = async (method: 'upi' | 'cod') => {
    setProcessing(true);
    const addr = addresses.find(a => a.id === selectedAddr);
    if (!addr) { toast('Select an address', 'error'); setProcessing(false); return; }
    const addrSnapshot: AddressSnapshot = {
      full_name: addr.full_name, phone: addr.phone, line1: addr.line1,
      line2: addr.line2, city: addr.city, state: addr.state, pincode: addr.pincode, label: addr.label,
    };
    const orderNumber = genOrderNumber();
    const otp = genOtp();

    const { data: order, error } = await supabase.from('orders').insert({
      user_id: user!.id,
      order_number: orderNumber,
      status: 'confirmed',
      items_total: subtotal,
      delivery_charge: delivCharge,
      discount: 0,
      total,
      payment_method: method === 'upi' ? 'razorpay' : 'cod',
      payment_status: method === 'cod' ? 'pending' : 'paid',
      address: addrSnapshot,
      delivery_otp: otp,
      delivery_partner_name: 'MM Express',
      eta_minutes: 45,
    }).select('*').single();

    if (error || !order) { toast(error?.message || 'Order failed', 'error'); setProcessing(false); return; }

    await supabase.from('order_items').insert(items.map(i => ({
      order_id: order.id,
      product_id: i.product.id,
      product_name: i.product.name,
      product_image: i.product.images[0],
      price: i.product.price,
      quantity: i.quantity,
    })));

    await supabase.from('notifications').insert({
      user_id: user!.id,
      title: 'Order Confirmed!',
      body: `Your order ${orderNumber} has been confirmed. OTP: ${otp}`,
      type: 'order',
    });

    setProcessing(false);
    setShowUpiModal(false);
    setPlacedOrder({ id: order.id, otp, method });
    setStep('success');
    clear();
  };

  if (!user) return <Navigate to="/login?redirect=/checkout" replace />;
  if (count === 0 && step !== 'success') return <Navigate to="/cart" replace />;

  /* ── Success screen ── */
  if (step === 'success' && placedOrder) {
    return (
      <div className="container-x py-12 page-fill">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto card p-8 text-center">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 rounded-full bg-success-100 dark:bg-success-900 text-success-600 grid place-items-center mx-auto mb-4"
          >
            <CheckCircle2 className="w-12 h-12" />
          </motion.div>
          <h1 className="font-display text-2xl font-bold mb-2">Order Placed Successfully!</h1>
          <p className="text-ink-500 mb-6">Thank you for shopping at MMMobiles.</p>
          <div className="rounded-2xl bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800 p-4 mb-6 text-left">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-ink-500 text-xs">Order ID</p><p className="font-bold">{placedOrder.id.slice(0, 8).toUpperCase()}</p></div>
              <div><p className="text-ink-500 text-xs">Delivery OTP</p><p className="font-extrabold text-brand-600 text-lg tracking-widest">{placedOrder.otp}</p></div>
              <div><p className="text-ink-500 text-xs">Payment</p><p className="font-semibold text-success-600">{placedOrder.method === 'cod' ? 'Cash on Delivery' : 'Paid via UPI'}</p></div>
              <div><p className="text-ink-500 text-xs">ETA</p><p className="font-semibold">~45 minutes</p></div>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <Link to="/account/orders" className="btn-primary">Track Order</Link>
            <Link to="/products" className="btn-outline">Continue Shopping</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── Main checkout ── */
  return (
    <div className="container-x py-6 page-fill">

      {/* ── App sub-modal (PhonePe / GPay / Paytm) ── */}
      <AnimatePresence>
        {activeApp && (
          <AppPayModal
            app={activeApp}
            upiId={storeUpiId}
            total={total}
            onClose={() => setActiveApp(null)}
            onPaid={handleAppPaid}
          />
        )}
      </AnimatePresence>

      {/* ── UPI main modal ── */}
      <AnimatePresence>
        {showUpiModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3"
          >
            <motion.div
              initial={{ scale: 0.93, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.93, y: 24, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="w-full max-w-sm bg-white dark:bg-ink-950 rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-5 text-white relative">
                <button
                  onClick={() => { setShowUpiModal(false); setUpiStep('pay'); }}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 grid place-items-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">MMMobiles</p>
                <p className="font-display font-bold text-xl mb-1">Pay via UPI</p>
                <p className="font-display font-extrabold text-4xl">{inr(total)}</p>
              </div>

              <div className="p-5">
                {/* ── Loading ── */}
                {upiLoadingStore && (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
                  </div>
                )}

                {/* ── No UPI configured ── */}
                {!upiLoadingStore && !storeUpiId && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-warning-50 dark:bg-warning-950 border border-warning-200 dark:border-warning-800">
                    <AlertCircle className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-warning-700 dark:text-warning-300 text-sm">UPI not configured</p>
                      <p className="text-xs text-warning-600 dark:text-warning-400 mt-0.5">The store hasn't set up a UPI ID yet. Please choose Cash on Delivery.</p>
                    </div>
                  </div>
                )}

                {/* ── Verifying ── */}
                {!upiLoadingStore && storeUpiId && upiStep === 'confirming' && (
                  <div className="text-center py-10">
                    <Loader2 className="w-10 h-10 animate-spin text-brand-500 mx-auto mb-3" />
                    <p className="font-semibold">Payment received! Verifying…</p>
                    <p className="text-sm text-ink-500 mt-1">Placing your order automatically</p>
                  </div>
                )}

                {/* ── QR waiting state — auto-detects payment via visibilitychange ── */}
                {!upiLoadingStore && storeUpiId && upiStep === 'qr_waiting' && (
                  <div className="text-center py-6">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <div className="absolute inset-0 rounded-full bg-brand-100 dark:bg-brand-950 animate-ping opacity-75" />
                      <div className="relative w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-950 grid place-items-center">
                        <Loader2 className="w-7 h-7 animate-spin text-brand-600" />
                      </div>
                    </div>
                    <p className="font-semibold text-ink-800 dark:text-white">Waiting for payment…</p>
                    <p className="text-sm text-ink-500 mt-1">Complete the payment in your UPI app.<br />Your order will confirm automatically.</p>
                    <button onClick={() => setUpiStep('pay')} className="btn-outline mt-4 !py-2 text-sm">
                      Back
                    </button>
                  </div>
                )}

                {/* ── Pay screen ── */}
                {!upiLoadingStore && storeUpiId && upiStep === 'pay' && (
                  <>
                    {/* UPI ID */}
                    <div className="mb-4">
                      <p className="text-xs text-ink-500 mb-1.5 font-semibold uppercase tracking-wide">Store UPI ID</p>
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-ink-50 dark:bg-ink-800 border border-ink-200 dark:border-ink-700">
                        <span className="flex-1 font-mono font-bold text-sm text-ink-900 dark:text-white select-all">{storeUpiId}</span>
                        <button
                          onClick={copyUpi}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition font-semibold shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="mb-5 flex flex-col items-center">
                      <div className="p-3 rounded-2xl bg-white border-2 border-ink-100 shadow-soft inline-block mb-2">
                        {qrDataUrl
                          ? <img src={qrDataUrl} alt="UPI QR Code" className="w-44 h-44 block" />
                          : <div className="w-44 h-44 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-ink-400" /></div>}
                      </div>
                      <p className="text-xs text-ink-500 font-medium mb-3">Scan with any UPI app to pay {inr(total)}</p>
                      <button
                        onClick={() => setUpiStep('qr_waiting')}
                        className="btn-outline !py-2 !px-4 text-sm"
                      >
                        I've Scanned the QR Code
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px bg-ink-200 dark:bg-ink-700" />
                      <span className="text-xs text-ink-400 font-semibold">OR PAY USING APP</span>
                      <div className="flex-1 h-px bg-ink-200 dark:bg-ink-700" />
                    </div>

                    {/* App buttons */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {UPI_APPS.map(app => (
                        <motion.button
                          key={app.key}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveApp(app)}
                          className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 border-ink-200 dark:border-ink-700 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950 transition group"
                        >
                          <div className={`w-12 h-12 rounded-xl ${app.bg} grid place-items-center shadow-sm group-hover:shadow-md transition`}>
                            {app.logo}
                          </div>
                          <span className="text-xs font-semibold text-ink-700 dark:text-ink-300 leading-tight text-center">{app.name}</span>
                        </motion.button>
                      ))}
                    </div>

                    {/* Please pay notice */}
                    <div className="border-t border-ink-200 dark:border-ink-800 pt-4">
                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-warning-50 dark:bg-warning-950 border border-warning-200 dark:border-warning-800">
                        <AlertCircle className="w-5 h-5 text-warning-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-warning-700 dark:text-warning-300 font-medium">
                          Please pay {inr(total)} using the QR code or a UPI app above. Your order will be confirmed automatically once payment is detected.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <h1 className="font-display text-2xl md:text-3xl font-bold mb-6">Checkout</h1>

      {/* Step indicators */}
      <div className="flex items-center gap-4 mb-6 text-sm">
        <Step n={1} label="Address" active={step === 'address'} done={step === 'payment'} />
        <div className="h-px flex-1 bg-ink-200 dark:bg-ink-700" />
        <Step n={2} label="Payment" active={step === 'payment'} done={false} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">

          {/* ── Address step ── */}
          {step === 'address' && (
            <>
              {addresses.length > 0 && (
                <div className="card p-5">
                  <h2 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-brand-600" /> Delivery Address
                  </h2>
                  <div className="space-y-2">
                    {addresses.map(a => (
                      <button
                        key={a.id}
                        onClick={() => setSelectedAddr(a.id)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition flex items-start gap-3 ${selectedAddr === a.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-950' : 'border-ink-200 dark:border-ink-700 hover:border-brand-300'}`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${selectedAddr === a.id ? 'border-brand-500 bg-brand-500' : 'border-ink-300'}`}>
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

              {showAddrForm ? (
                <form onSubmit={saveAddress} className="card p-5 space-y-3">
                  <h2 className="font-semibold">Add New Address</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><label className="label">Full Name</label><input required className="input" value={newAddr.full_name} onChange={e => setNewAddr(a => ({ ...a, full_name: e.target.value }))} /></div>
                    <div><label className="label">Phone</label><input required className="input" value={newAddr.phone} onChange={e => setNewAddr(a => ({ ...a, phone: e.target.value }))} /></div>
                    <div><label className="label">Address Line 1</label><input required className="input" value={newAddr.line1} onChange={e => setNewAddr(a => ({ ...a, line1: e.target.value }))} /></div>
                    <div><label className="label">Address Line 2</label><input className="input" value={newAddr.line2} onChange={e => setNewAddr(a => ({ ...a, line2: e.target.value }))} /></div>
                    <div><label className="label">City</label><input required className="input" value={newAddr.city} onChange={e => setNewAddr(a => ({ ...a, city: e.target.value }))} /></div>
                    <div><label className="label">State</label><input required className="input" value={newAddr.state} onChange={e => setNewAddr(a => ({ ...a, state: e.target.value }))} /></div>
                    <div><label className="label">Pincode</label><input required className="input" value={newAddr.pincode} onChange={e => setNewAddr(a => ({ ...a, pincode: e.target.value }))} /></div>
                    <div><label className="label">Label</label><select className="input" value={newAddr.label} onChange={e => setNewAddr(a => ({ ...a, label: e.target.value }))}><option>Home</option><option>Work</option><option>Other</option></select></div>
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
                <button onClick={() => setStep('payment')} className="btn-primary w-full !py-3">
                  Continue to Payment <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          {/* ── Payment step ── */}
          {step === 'payment' && (
            <div className="card p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-600" /> Payment Method
              </h2>
              <div className="space-y-3 mb-4">
                <button
                  type="button"
                  onClick={() => setPayMethod('upi')}
                  className={`w-full text-left p-4 rounded-xl border-2 transition flex items-center gap-3 ${payMethod === 'upi' ? 'border-brand-500 bg-brand-50 dark:bg-brand-950' : 'border-ink-200 dark:border-ink-700 hover:border-brand-300'}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-600 text-white grid place-items-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">UPI / PhonePe / GPay</p>
                    <p className="text-xs text-ink-500">Pay instantly with any UPI app or QR code</p>
                  </div>
                  {payMethod === 'upi' && <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />}
                </button>

                <button
                  type="button"
                  onClick={() => setPayMethod('cod')}
                  className={`w-full text-left p-4 rounded-xl border-2 transition flex items-center gap-3 ${payMethod === 'cod' ? 'border-success-500 bg-success-50 dark:bg-success-950' : 'border-ink-200 dark:border-ink-700 hover:border-success-300'}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-success-600 text-white grid place-items-center shrink-0">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Cash on Delivery</p>
                    <p className="text-xs text-ink-500">Pay in cash when your order arrives</p>
                  </div>
                  {payMethod === 'cod' && <CheckCircle2 className="w-5 h-5 text-success-600 shrink-0" />}
                </button>
              </div>

              {/* UPI app badges */}
              <AnimatePresence>
                {payMethod === 'upi' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mb-4 flex items-center gap-2 flex-wrap">
                      {UPI_APPS.map(app => (
                        <span key={app.key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${app.bg} ${app.textColor}`}>
                          {app.name}
                        </span>
                      ))}
                      <span className="text-xs text-ink-400">+ any UPI app via QR</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-3 rounded-lg bg-accent-50 dark:bg-accent-950 text-accent-700 dark:text-accent-300 text-sm flex items-center gap-2 mb-5">
                <Zap className="w-4 h-4" /> No-Cost EMI from {inr(Math.round(total / 12))}/mo for 12 months
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep('address')} className="btn-outline">Back</button>
                <button
                  onClick={async () => {
                    if (payMethod === 'upi') {
                      await fetchUpiId();
                      setUpiStep('pay');
                      setShowUpiModal(true);
                    } else {
                      await placeOrder('cod');
                    }
                  }}
                  disabled={processing}
                  className={`flex-1 !py-3 btn ${payMethod === 'cod' ? 'bg-success-600 hover:bg-success-700 text-white' : 'btn-primary'}`}
                >
                  {processing
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                    : payMethod === 'cod'
                    ? <><Banknote className="w-4 h-4" /> Place Order — Pay on Delivery</>
                    : <><Smartphone className="w-4 h-4" /> Pay {inr(total)} via UPI</>}
                </button>
              </div>
              <p className="flex items-center justify-center gap-1.5 text-xs text-ink-500 mt-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                {payMethod === 'upi' ? 'Secure UPI — payment goes directly to store' : 'Pay cash when delivery partner arrives'}
              </p>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="card p-5 h-fit lg:sticky lg:top-24">
          <h2 className="font-semibold mb-3">Order Summary</h2>
          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-2 text-sm">
                <img src={product.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-ink-800 dark:text-ink-100 text-xs">{product.name}</p>
                  <p className="text-ink-500 text-xs">Qty: {quantity}</p>
                </div>
                <p className="font-semibold text-xs shrink-0">{inr(product.price * quantity)}</p>
              </div>
            ))}
          </div>
          <dl className="space-y-2 text-sm border-t border-ink-200 dark:border-ink-800 pt-3">
            <div className="flex justify-between"><dt className="text-ink-500">Subtotal</dt><dd className="font-semibold">{inr(subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-ink-500 flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Delivery ({distance}km)</dt>
              <dd className="font-semibold">{inr(delivCharge)}</dd>
            </div>
            <div className="flex justify-between text-base border-t border-ink-200 dark:border-ink-800 pt-2">
              <dt className="font-bold">Total</dt>
              <dd className="font-extrabold text-brand-600 flex items-center"><IndianRupee className="w-4 h-4" />{Math.round(total).toLocaleString('en-IN')}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Unused canvas ref kept for potential canvas-based QR */}
      <canvas ref={canvasRef} className="hidden" />
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
