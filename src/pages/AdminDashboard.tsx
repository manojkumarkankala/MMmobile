import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Package, ShoppingBag, DollarSign, Star, TrendingUp,
  Boxes, Tag, Sparkles, ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { inr, inrCompact, cn, formatDate } from '../lib/utils';
import type { Order, Product } from '../types';
import { PasswordGate, usePortalAccess } from '../components/PasswordGate';
import { ShieldCheck } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [adminUnlocked, grantAdmin] = usePortalAccess('admin');
  const [stats, setStats] = useState({ products: 0, brands: 0, categories: 0, orders: 0, revenue: 0, users: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'products' | 'orders' | 'customers'>('overview');
  const [allProducts, setAllProducts] = useState<ProductWithRefsT[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  type ProductWithRefsT = Product & { brands?: { name: string } | null };

  useEffect(() => { load(); }, []);
  async function load() {
    const [p, b, c, o, u] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('brands').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(10),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
    ]);
    const ordersData = (o.data ?? []) as Order[];
    const revenue = ordersData.reduce((s, o) => s + Number(o.total), 0);
    setStats({ products: p.count ?? 0, brands: b.count ?? 0, categories: c.count ?? 0, orders: o.count ?? 0, revenue, users: u.count ?? 0 });
    setRecentOrders(ordersData);

    const { data: top } = await supabase.from('products').select('*, brands:brands(name)').order('rating', { ascending: false }).limit(5);
    setTopProducts((top ?? []) as ProductWithRefsT[]);
    setAllProducts((top ?? []) as ProductWithRefsT[]);

    const { data: allP } = await supabase.from('products').select('*, brands:brands(name)').order('created_at', { ascending: false });
    setAllProducts((allP ?? []) as ProductWithRefsT[]);
    setAllOrders(ordersData);
    setLoading(false);
  }

  if (!user) return <Navigate to="/login?redirect=/admin" replace />;

  if (!adminUnlocked) {
    return (
      <PasswordGate
        title="Admin Portal"
        subtitle="Enter the admin password to access the management dashboard"
        icon={<ShieldCheck className="w-8 h-8 text-white" />}
        onUnlock={grantAdmin}
      />
    );
  }

  return (
    <div className="container-x py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-ink-500">Platform overview & management</p>
        </div>
        <span className="chip bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300"><Sparkles className="w-3.5 h-3.5" /> AI Settings</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={DollarSign} label="Total Revenue" value={inrCompact(stats.revenue)} trend="+18%" up color="text-success-600" />
        <StatCard icon={ShoppingBag} label="Orders" value={String(stats.orders)} trend="+12%" up color="text-brand-600" />
        <StatCard icon={Package} label="Products" value={String(stats.products)} color="text-brand-600" />
        <StatCard icon={Users} label="Customers" value={String(stats.users)} trend="+5" up color="text-accent-500" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 card p-1.5 w-fit">
        {(['overview','products','orders','customers'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('px-4 py-2 rounded-lg text-sm font-semibold capitalize transition', tab === t ? 'bg-brand-600 text-white' : 'hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-600 dark:text-ink-300')}>{t}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent orders */}
          <div className="card p-5">
            <h2 className="font-semibold mb-3">Recent Orders</h2>
            <div className="space-y-2">
              {recentOrders.slice(0, 5).map(o => (
                <div key={o.id} className="flex items-center justify-between text-sm py-2 border-b border-ink-100 dark:border-ink-800 last:border-0">
                  <div><p className="font-semibold">#{o.order_number}</p><p className="text-xs text-ink-500">{formatDate(o.created_at)}</p></div>
                  <div className="text-right"><p className="font-bold">{inr(o.total)}</p><span className="badge bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 text-[10px]">{o.status.replace(/_/g, ' ')}</span></div>
                </div>
              ))}
              {recentOrders.length === 0 && <p className="text-sm text-ink-500 py-4 text-center">No orders yet.</p>}
            </div>
          </div>

          {/* Top products */}
          <div className="card p-5">
            <h2 className="font-semibold mb-3">Top Rated Products</h2>
            <div className="space-y-2">
              {topProducts.map(p => (
                <div key={p.id} className="flex items-center gap-3 text-sm py-2 border-b border-ink-100 dark:border-ink-800 last:border-0">
                  <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0"><p className="font-semibold line-clamp-1">{p.name}</p><p className="text-xs text-ink-500">{(p as any).brands?.name}</p></div>
                  <div className="text-right"><p className="font-bold">{inr(p.price)}</p><p className="text-xs text-accent-500">⭐ {p.rating}</p></div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform stats */}
          <div className="card p-5 lg:col-span-2">
            <h2 className="font-semibold mb-4">Platform Breakdown</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Boxes, label: 'Brands', value: stats.brands },
                { icon: Tag, label: 'Categories', value: stats.categories },
                { icon: Star, label: 'Avg Rating', value: '4.5' },
                { icon: TrendingUp, label: 'Growth', value: '+18%' },
              ].map(s => (
                <div key={s.label} className="p-4 rounded-xl bg-ink-50 dark:bg-ink-800/50">
                  <s.icon className="w-5 h-5 text-brand-600 mb-2" />
                  <p className="font-display text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-ink-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-ink-200 dark:border-ink-800 text-left text-xs uppercase text-ink-500">
              <tr><th className="p-4">Product</th><th className="p-4">Brand</th><th className="p-4">Price</th><th className="p-4">Stock</th><th className="p-4">Rating</th></tr>
            </thead>
            <tbody>
              {allProducts.map(p => (
                <tr key={p.id} className="border-b border-ink-100 dark:border-ink-800">
                  <td className="p-4"><div className="flex items-center gap-2"><img src={p.images[0]} alt="" className="w-8 h-8 rounded object-cover" /><span className="font-semibold line-clamp-1 max-w-[200px]">{p.name}</span></div></td>
                  <td className="p-4 text-ink-600">{(p as any).brands?.name}</td>
                  <td className="p-4 font-semibold">{inr(p.price)}</td>
                  <td className="p-4">{p.stock}</td>
                  <td className="p-4">⭐ {p.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'orders' && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-ink-200 dark:border-ink-800 text-left text-xs uppercase text-ink-500">
              <tr><th className="p-4">Order #</th><th className="p-4">Date</th><th className="p-4">Total</th><th className="p-4">Status</th><th className="p-4">Payment</th></tr>
            </thead>
            <tbody>
              {allOrders.map(o => (
                <tr key={o.id} className="border-b border-ink-100 dark:border-ink-800">
                  <td className="p-4 font-semibold">#{o.order_number}</td>
                  <td className="p-4 text-ink-600">{formatDate(o.created_at)}</td>
                  <td className="p-4 font-bold">{inr(o.total)}</td>
                  <td className="p-4"><span className="badge bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300">{o.status.replace(/_/g, ' ')}</span></td>
                  <td className="p-4 text-success-600">{o.payment_status}</td>
                </tr>
              ))}
              {allOrders.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-ink-500">No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'customers' && (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-ink-300 mb-3" />
          <p className="text-ink-500">{stats.users} registered customer(s)</p>
          <p className="text-xs text-ink-400 mt-2">Customer management panel with full CRM features.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, up, color }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={cn('w-10 h-10 rounded-xl grid place-items-center bg-ink-100 dark:bg-ink-800', color)}><Icon className="w-5 h-5" /></div>
        {trend && <span className={cn('text-xs font-semibold flex items-center gap-0.5', up ? 'text-success-600' : 'text-error-500')}><ArrowUpRight className="w-3 h-3" />{trend}</span>}
      </div>
      <p className="font-display text-2xl font-extrabold text-ink-900 dark:text-white">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </motion.div>
  );
}
