import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Truck, MapPin, Package, CheckCircle2, Wallet, Star, Navigation,
  Phone, KeyRound, Route, TrendingUp, ArrowRight, User,
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

  useEffect(() => { loadOrders(); }, [user]);

  async function loadOrders() {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(20);
    setOrders((data ?? []) as Order[]);
    setLoading(false);
    const completed = (data ?? []).filter((o: any) => o.status === 'delivered');
    const totalEarnings = completed.reduce((s: number, o: any) => s + Number(o.delivery_charge), 0);
    setEarnings(totalEarnings);
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
  const accepted = orders.filter(o => o.status === 'shipped' || o.status === 'out_for_delivery');
  const completed = orders.filter(o => o.status === 'delivered');

  const acceptOrder = async (order: Order) => {
    await supabase.from('orders').update({ status: 'out_for_delivery', delivery_partner_name: user?.email?.split('@')[0] || 'MM Express' }).eq('id', order.id);
    toast('Order accepted! Navigate to store for pickup.');
    setActiveOrder(order);
    setActiveTab('accepted');
    loadOrders();
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    if (otpInput !== activeOrder.delivery_otp) { toast('Incorrect OTP. Try again.', 'error'); return; }
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', activeOrder.id);
    toast('Delivery confirmed! Wallet updated.');
    setEarnings(e => e + Number(activeOrder.delivery_charge));
    setOtpInput('');
    setActiveOrder(null);
    loadOrders();
  };

  const tabOrders = activeTab === 'available' ? available : activeTab === 'accepted' ? accepted : completed;
  const todayEarnings = earnings;
  const rating = 4.8;

  return (
    <div className="container-x py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900 dark:text-white">Delivery Partner</h1>
          <p className="text-sm text-ink-500">Deliver happiness, one order at a time</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn('chip', 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300')}><span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" /> Online</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Wallet} label="Today's Earnings" value={inr(todayEarnings)} color="text-success-600" />
        <StatCard icon={Route} label="Distance" value={`${distance.toFixed(1)} km`} color="text-brand-600" />
        <StatCard icon={Star} label="Rating" value={`${rating}★`} color="text-accent-500" />
        <StatCard icon={Package} label="Completed" value={String(completed.length)} color="text-brand-600" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order list */}
        <div className="lg:col-span-2">
          <div className="flex gap-1 mb-4 card p-1.5">
            {(['available','accepted','completed'] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={cn('flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition', activeTab === t ? 'bg-brand-600 text-white' : 'hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-600 dark:text-ink-300')}
              >
                {t} ({t === 'available' ? available.length : t === 'accepted' ? accepted.length : completed.length})
              </button>
            ))}
          </div>

          {loading ? <p className="text-ink-500 text-center py-8">Loading orders…</p> :
           tabOrders.length === 0 ? <div className="card p-12 text-center"><Package className="w-12 h-12 mx-auto text-ink-300 mb-3" /><p className="text-ink-500">No {activeTab} orders right now.</p></div> :
           <div className="space-y-3">
            {tabOrders.map(o => (
              <motion.div key={o.id} layout className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 grid place-items-center shrink-0"><Package className="w-5 h-5" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">#{o.order_number}</p>
                      <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300">{o.status.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-xs text-ink-500 mt-0.5">{formatDateTime(o.created_at)}</p>
                    <div className="mt-2 space-y-1 text-xs">
                      <p className="flex items-center gap-1.5 text-ink-600 dark:text-ink-300"><MapPin className="w-3.5 h-3.5 text-brand-500" /> {o.address.line1}, {o.address.city} - {o.address.pincode}</p>
                      <p className="flex items-center gap-1.5 text-ink-600 dark:text-ink-300"><User className="w-3.5 h-3.5" /> {o.address.full_name} · {o.address.phone}</p>
                      <p className="flex items-center gap-1.5 text-success-600"><Wallet className="w-3.5 h-3.5" /> Delivery: {inr(o.delivery_charge)}</p>
                    </div>
                  </div>
                </div>
                {activeTab === 'available' && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => acceptOrder(o)} className="btn-primary flex-1 !py-2 text-sm">Accept Order <ArrowRight className="w-4 h-4" /></button>
                    <a href="tel:+919000000000" className="btn-outline !py-2 !px-3"><Phone className="w-4 h-4" /></a>
                  </div>
                )}
                {activeTab === 'accepted' && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setActiveOrder(o)} className="btn-primary flex-1 !py-2 text-sm"><Navigation className="w-4 h-4" /> Navigate & Deliver</button>
                  </div>
                )}
                {activeTab === 'completed' && (
                  <div className="mt-3 p-2 rounded-lg bg-success-50 dark:bg-success-950 text-xs text-success-700 dark:text-success-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Delivered · Earned {inr(o.delivery_charge)}
                  </div>
                )}
              </motion.div>
            ))}
          </div>}
        </div>

        {/* Side panel: active delivery / wallet */}
        <div className="space-y-4">
          {activeOrder ? (
            <div className="card p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Navigation className="w-4 h-4 text-brand-600" /> Active Delivery</h3>
              {/* Live tracking mock */}
              <div className="aspect-video rounded-xl bg-gradient-to-br from-brand-100 to-accent-100 dark:from-ink-800 dark:to-ink-900 relative overflow-hidden mb-4">
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, #1c80f5 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <div className="absolute top-4 left-4 text-xs bg-white dark:bg-ink-900 px-2 py-1 rounded-lg font-semibold flex items-center gap-1"><MapPin className="w-3 h-3 text-brand-600" /> Store</div>
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
                <div className="absolute bottom-4 right-4 text-xs bg-white dark:bg-ink-900 px-2 py-1 rounded-lg font-semibold flex items-center gap-1"><MapPin className="w-3 h-3 text-error-500" /> Customer</div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between"><span className="text-ink-500">Order</span><span className="font-semibold">#{activeOrder.order_number}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">ETA</span><span className="font-semibold">{activeOrder.eta_minutes} min</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Earning</span><span className="font-semibold text-success-600">{inr(activeOrder.delivery_charge)}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Customer OTP</span><span className="font-extrabold text-brand-600 text-lg tracking-widest">{activeOrder.delivery_otp}</span></div>
              </div>

              <form onSubmit={verifyOtp} className="space-y-2">
                <label className="label">Enter customer OTP to confirm delivery</label>
                <div className="flex gap-2">
                  <input value={otpInput} onChange={(e) => setOtpInput(e.target.value)} maxLength={4} placeholder="••••" className="input text-center text-lg tracking-widest font-bold" />
                  <button type="submit" className="btn-primary"><KeyRound className="w-4 h-4" /> Verify</button>
                </div>
              </form>
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

          {/* Delivery charges info */}
          <div className="card p-5">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Wallet className="w-4 h-4 text-brand-600" /> Delivery Charges</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-ink-500">0-3 km</span><span className="font-semibold">₹30 min</span></div>
              <div className="flex justify-between"><span className="text-ink-500">3-5 km</span><span className="font-semibold">₹9/km</span></div>
              <div className="flex justify-between"><span className="text-ink-500">5-10 km</span><span className="font-semibold">₹12/km</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Above 10 km</span><span className="font-semibold">₹15/km</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="card p-4">
      <div className={cn('w-10 h-10 rounded-xl grid place-items-center bg-ink-100 dark:bg-ink-800 mb-2', color)}><Icon className="w-5 h-5" /></div>
      <p className="font-display text-xl font-extrabold text-ink-900 dark:text-white">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  );
}
