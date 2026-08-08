import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, MapPin, Package, CheckCircle2, Wallet, Star, Navigation,
  Phone, KeyRound, Route, TrendingUp, ArrowRight, User,
  Banknote, XCircle, AlertCircle, IndianRupee,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { inr, formatDateTime, cn } from '../lib/utils';
import type { Order } from '../types';
import { PasswordGate, usePortalAccess } from '../components/PasswordGate';

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [delivUnlocked, grantDeliv] = usePortalAccess('delivery');
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'accepted' | 'completed'>('available');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [earnings, setEarnings] = useState(0);
  const [distance] = useState(0);
  const [codConfirm, setCodConfirm] = useState<{ order: Order; action: 'paid' | 'cancelled' } | null>(null);
  const [otpVerified, setOtpVerified] = useState(false);

  useEffect(() => { loadOrders(); }, [user]);

  async function loadOrders() {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(50);
    setOrders((data ?? []) as Order[]);
    setLoading(false);
    const completed = (data ?? []).filter((o: any) => o.status === 'delivered');
    setEarnings(completed.reduce((s: number, o: any) => s + Number(o.delivery_charge), 0));
  }

  if (!user) return <Navigate to="/login?redirect=/delivery" replace />;
  if (!delivUnlocked) {
    return (
      <PasswordGate
        title="Delivery Partner Portal"
        subtitle="Enter the delivery password to access your delivery dashboard"
        icon={<Truck className="w-8 h-8 text-white" />}
        accent="accent"
        onUnlock={grantDeliv}
      />
    );
  }

  const available = orders.filter(o => o.status === 'confirmed' || o.status === 'placed');
  const accepted  = orders.filter(o => o.status === 'shipped' || o.status === 'out_for_delivery');
  const completed = orders.filter(o => o.status === 'delivered');

  const acceptOrder = async (order: Order) => {
    await supabase.from('orders').update({
      status: 'out_for_delivery',
      delivery_partner_name: user?.email?.split('@')[0] || 'MM Express',
    }).eq('id', order.id);
    toast('Order accepted! Navigate to store for pickup.');
    setActiveOrder(order);
    setActiveTab('accepted');
    loadOrders();
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    if (otpInput !== activeOrder.delivery_otp) { toast('Incorrect OTP. Try again.', 'error'); return; }
    const isCod = activeOrder.payment_method === 'cod';
    if (isCod) {
      // For COD: just mark OTP verified, show cash paid / cancel buttons
      setOtpVerified(true);
      toast('OTP verified! Collect cash and confirm.');
      return;
    }
    // For prepaid: directly mark delivered
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', activeOrder.id);
    toast('Delivery confirmed! Wallet updated.');
    setEarnings(e => e + Number(activeOrder.delivery_charge));
    setOtpInput('');
    setOtpVerified(false);
    setActiveOrder(null);
    loadOrders();
  };

  const handleCodAction = async (order: Order, action: 'paid' | 'cancelled') => {
    setCodConfirm(null);
    if (action === 'paid') {
      await supabase.from('orders').update({
        status: 'delivered',
        payment_status: 'paid',
      }).eq('id', order.id);
      toast('Cash collected. Order marked as delivered!');
      setEarnings(e => e + Number(order.delivery_charge));
      if (activeOrder?.id === order.id) { setActiveOrder(null); setOtpVerified(false); }
    } else {
      await supabase.from('orders').update({
        status: 'cancelled',
        payment_status: 'cancelled',
      }).eq('id', order.id);
      toast('Order cancelled and reported to admin.', 'error');
      if (activeOrder?.id === order.id) { setActiveOrder(null); setOtpVerified(false); }
    }
    loadOrders();
  };

  const tabOrders = activeTab === 'available' ? available : activeTab === 'accepted' ? accepted : completed;

  return (
    <div className="container-x py-6 page-fill">
      {/* COD Confirm Modal */}
      <AnimatePresence>
        {codConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setCodConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="card p-6 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              {codConfirm.action === 'paid' ? (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-success-100 dark:bg-success-950 grid place-items-center mx-auto mb-4">
                    <Banknote className="w-7 h-7 text-success-600" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-center mb-1">Confirm Cash Collected</h3>
                  <p className="text-sm text-ink-500 text-center mb-1">Order <span className="font-semibold text-ink-700 dark:text-ink-200">#{codConfirm.order.order_number}</span></p>
                  <p className="text-2xl font-extrabold text-center text-success-600 mb-5">{inr(codConfirm.order.total)}</p>
                  <p className="text-xs text-ink-500 text-center mb-5">Confirm that you have received the full cash amount from the customer.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setCodConfirm(null)} className="btn-secondary flex-1">Go Back</button>
                    <button onClick={() => handleCodAction(codConfirm.order, 'paid')} className="flex-1 btn bg-success-600 hover:bg-success-700 text-white">
                      <CheckCircle2 className="w-4 h-4" /> Confirm Paid
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-error-100 dark:bg-error-950 grid place-items-center mx-auto mb-4">
                    <XCircle className="w-7 h-7 text-error-500" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-center mb-1">Cancel This Order?</h3>
                  <p className="text-sm text-ink-500 text-center mb-5">Order <span className="font-semibold">#{codConfirm.order.order_number}</span> will be marked as cancelled and reported to admin.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setCodConfirm(null)} className="btn-secondary flex-1">Go Back</button>
                    <button onClick={() => handleCodAction(codConfirm.order, 'cancelled')} className="flex-1 btn bg-error-500 hover:bg-error-600 text-white">
                      <XCircle className="w-4 h-4" /> Cancel Order
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900 dark:text-white">Delivery Partner</h1>
          <p className="text-sm text-ink-500">Deliver happiness, one order at a time</p>
        </div>
        <div className={cn('chip', 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300')}>
          <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" /> Online
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Wallet} label="Today's Earnings" value={inr(earnings)} color="text-success-600" />
        <StatCard icon={Route} label="Distance" value={`${distance.toFixed(1)} km`} color="text-brand-600" />
        <StatCard icon={Star} label="Rating" value="4.8★" color="text-accent-500" />
        <StatCard icon={Package} label="Completed" value={String(completed.length)} color="text-brand-600" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order list */}
        <div className="lg:col-span-2">
          <div className="flex gap-1 mb-4 card p-1.5">
            {(['available', 'accepted', 'completed'] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={cn('flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition', activeTab === t ? 'bg-brand-600 text-white' : 'hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-600 dark:text-ink-300')}
              >
                {t} ({t === 'available' ? available.length : t === 'accepted' ? accepted.length : completed.length})
              </button>
            ))}
          </div>

          {loading
            ? <p className="text-ink-500 text-center py-8">Loading orders…</p>
            : tabOrders.length === 0
              ? <div className="card p-12 text-center"><Package className="w-12 h-12 mx-auto text-ink-300 mb-3" /><p className="text-ink-500">No {activeTab} orders right now.</p></div>
              : <div className="space-y-3">
                {tabOrders.map(o => {
                  const isCod = o.payment_method === 'cod';
                  return (
                    <motion.div key={o.id} layout className="card p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 grid place-items-center shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <p className="font-semibold text-sm">#{o.order_number}</p>
                            <div className="flex items-center gap-1.5">
                              {isCod && (
                                <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 flex items-center gap-1">
                                  <Banknote className="w-3 h-3" /> COD
                                </span>
                              )}
                              <span className={cn('badge', statusBadge(o.status))}>{o.status.replace(/_/g, ' ')}</span>
                            </div>
                          </div>
                          <p className="text-xs text-ink-500 mt-0.5">{formatDateTime(o.created_at)}</p>
                          <div className="mt-2 space-y-1 text-xs">
                            <p className="flex items-center gap-1.5 text-ink-600 dark:text-ink-300">
                              <MapPin className="w-3.5 h-3.5 text-brand-500" /> {o.address.line1}, {o.address.city} - {o.address.pincode}
                            </p>
                            <p className="flex items-center gap-1.5 text-ink-600 dark:text-ink-300">
                              <User className="w-3.5 h-3.5" /> {o.address.full_name} · {o.address.phone}
                            </p>
                            <p className="flex items-center gap-1.5 text-success-600">
                              <Wallet className="w-3.5 h-3.5" /> Delivery: {inr(o.delivery_charge)}
                            </p>
                            {isCod && (
                              <p className="flex items-center gap-1.5 text-amber-600 font-semibold">
                                <IndianRupee className="w-3.5 h-3.5" /> Collect cash: {inr(o.total)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Available tab */}
                      {activeTab === 'available' && (
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => acceptOrder(o)} className="btn-primary flex-1 !py-2 text-sm">
                            Accept Order <ArrowRight className="w-4 h-4" />
                          </button>
                          <a href="tel:+918341827908" className="btn-outline !py-2 !px-3"><Phone className="w-4 h-4" /></a>
                        </div>
                      )}

                      {/* Accepted tab */}
                      {activeTab === 'accepted' && (
                        <div className="mt-3 space-y-2">
                          <button onClick={() => { setActiveOrder(o); setOtpVerified(false); setOtpInput(''); }} className="btn-primary w-full !py-2 text-sm">
                            <Navigation className="w-4 h-4" /> Navigate &amp; Deliver
                          </button>
                        </div>
                      )}

                      {/* Completed tab */}
                      {activeTab === 'completed' && (
                        <div className="mt-3 p-2 rounded-lg bg-success-50 dark:bg-success-950 text-xs text-success-700 dark:text-success-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Delivered · Earned {inr(o.delivery_charge)}
                          {isCod && <span className="ml-1 text-amber-600">(Cash collected)</span>}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
          }
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {activeOrder ? (
            <div className="card p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Navigation className="w-4 h-4 text-brand-600" /> Active Delivery</h3>

              {/* COD reminder banner */}
              {activeOrder.payment_method === 'cod' && (
                <div className="mb-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Cash on Delivery</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Collect <strong>{inr(activeOrder.total)}</strong> from customer</p>
                  </div>
                </div>
              )}

              {/* Live tracking mock */}
              <div className="aspect-video rounded-xl bg-gradient-to-br from-brand-100 to-accent-100 dark:from-ink-800 dark:to-ink-900 relative overflow-hidden mb-4">
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, #1c80f5 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <div className="absolute top-4 left-4 text-xs bg-white dark:bg-ink-900 px-2 py-1 rounded-lg font-semibold flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-brand-600" /> Store
                </div>
                <motion.div
                  className="absolute"
                  initial={{ bottom: '15%', left: '15%' }}
                  animate={{ bottom: '70%', left: '70%' }}
                  transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse' }}
                >
                  <div className="w-8 h-8 rounded-full bg-brand-600 text-white grid place-items-center shadow-lg">
                    <Truck className="w-4 h-4" />
                  </div>
                </motion.div>
                <div className="absolute bottom-4 right-4 text-xs bg-white dark:bg-ink-900 px-2 py-1 rounded-lg font-semibold flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-error-500" /> Customer
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between"><span className="text-ink-500">Order</span><span className="font-semibold">#{activeOrder.order_number}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">ETA</span><span className="font-semibold">{activeOrder.eta_minutes} min</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Earning</span><span className="font-semibold text-success-600">{inr(activeOrder.delivery_charge)}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Customer OTP</span><span className="font-extrabold text-brand-600 text-lg tracking-widest">{activeOrder.delivery_otp}</span></div>
              </div>

              {!otpVerified ? (
                <form onSubmit={verifyOtp} className="space-y-2 mb-3">
                  <label className="label">Enter customer OTP to confirm delivery</label>
                  <div className="flex gap-2">
                    <input value={otpInput} onChange={e => setOtpInput(e.target.value)} maxLength={4} placeholder="••••" className="input text-center text-lg tracking-widest font-bold" />
                    <button type="submit" className="btn-primary"><KeyRound className="w-4 h-4" /> Verify</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 mb-3">
                  <div className="p-3 rounded-xl bg-success-50 dark:bg-success-950 border border-success-200 dark:border-success-800 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-success-600 shrink-0" />
                    <p className="text-sm font-semibold text-success-700 dark:text-success-300">OTP verified! Now confirm the delivery.</p>
                  </div>
                  {activeOrder.payment_method === 'cod' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCodConfirm({ order: activeOrder, action: 'paid' })}
                        className="flex-1 btn bg-success-600 hover:bg-success-700 text-white !py-2.5 text-sm"
                      >
                        <Banknote className="w-4 h-4" /> Mark Cash Paid
                      </button>
                      <button
                        onClick={() => setCodConfirm({ order: activeOrder, action: 'cancelled' })}
                        className="flex-1 btn bg-error-500 hover:bg-error-600 text-white !py-2.5 text-sm"
                      >
                        <XCircle className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="card p-5 text-center">
              <Truck className="w-10 h-10 mx-auto text-ink-300 dark:text-ink-700 mb-2" />
              <p className="text-sm text-ink-500">No active delivery. Accept an order to start.</p>
            </div>
          )}

          {/* Wallet */}
          <div className="card p-5 bg-gradient-to-br from-success-600 to-success-800 text-white">
            <p className="text-sm opacity-80">Wallet Balance</p>
            <p className="font-display text-3xl font-extrabold mt-1">{inr(earnings)}</p>
            <div className="flex items-center gap-2 mt-3 text-xs">
              <TrendingUp className="w-4 h-4" /> <span>{completed.length} deliveries completed</span>
            </div>
          </div>

          {/* Delivery charges */}
          <div className="card p-5">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Wallet className="w-4 h-4 text-brand-600" /> Delivery Charges</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-ink-500">0–3 km</span><span className="font-semibold">₹30 min</span></div>
              <div className="flex justify-between"><span className="text-ink-500">3–5 km</span><span className="font-semibold">₹9/km</span></div>
              <div className="flex justify-between"><span className="text-ink-500">5–10 km</span><span className="font-semibold">₹12/km</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Above 10 km</span><span className="font-semibold">₹15/km</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function statusBadge(status: string) {
  switch (status) {
    case 'delivered': return 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300';
    case 'cancelled': return 'bg-error-100 text-error-600 dark:bg-error-900 dark:text-error-400';
    case 'out_for_delivery': return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
    default: return 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300';
  }
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="card p-4">
      <div className={cn('w-10 h-10 rounded-xl grid place-items-center bg-ink-100 dark:bg-ink-800 mb-2', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="font-display text-xl font-extrabold text-ink-900 dark:text-white">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  );
}
