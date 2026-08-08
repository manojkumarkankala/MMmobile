import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Package, ShoppingBag, DollarSign, Star, TrendingUp,
  Boxes, Tag, Sparkles, ArrowUpRight, Banknote, RefreshCw,
  Plus, Trash2, X, AlertTriangle, CheckCircle2,
  ShieldCheck, Search, RotateCcw, Smartphone, Save, Eye, EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { inr, inrCompact, cn, formatDate } from '../lib/utils';
import type { Order, Product, Brand, Category } from '../types';
import { PasswordGate, usePortalAccess } from '../components/PasswordGate';
import { useToast } from '../context/ToastContext';

type ProductWithRefs = Product & { brands?: { name: string } | null };
type CustomerRow = {
  id: string;
  full_name: string;
  phone: string;
  role: string;
  created_at: string;
  email?: string;
  order_count: number;
  total_spent: number;
  item_count: number;
};

const BLANK_FORM = {
  name: '', slug: '', brand_id: '', category_id: '',
  price: '', mrp: '', stock: '', description: '',
  images: '', colors: '', highlights: '',
  is_featured: false, is_new: true, emi_available: true,
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [adminUnlocked, grantAdmin] = usePortalAccess('admin');
  const { toast } = useToast();

  const [stats, setStats] = useState({ products: 0, brands: 0, categories: 0, orders: 0, revenue: 0, users: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<ProductWithRefs[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'overview' | 'products' | 'orders' | 'customers' | 'settings'>('overview');

  // Settings / UPI
  const [upiId, setUpiId] = useState('');
  const [upiSaving, setUpiSaving] = useState(false);
  const [upiSaved, setUpiSaved] = useState(false);
  const [showUpi, setShowUpi] = useState(false);

  // Products
  const [allProducts, setAllProducts] = useState<ProductWithRefs[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<ProductWithRefs | null>(null);
  const [productSearch, setProductSearch] = useState('');

  // Orders
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  // Customers
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [clearConfirm, setClearConfirm] = useState<CustomerRow | null>(null);
  const [clearing, setClearing] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  useEffect(() => { load(); }, []);

  async function load(quiet = false) {
    if (quiet) setRefreshing(true);
    const [p, b, c, o, u, brandsRes, catsRes] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('brands').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('brands').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
    ]);
    const ordersData = (o.data ?? []) as Order[];
    const revenue = ordersData.reduce((s, ord) => s + Number(ord.total), 0);
    setStats({ products: p.count ?? 0, brands: b.count ?? 0, categories: c.count ?? 0, orders: ordersData.length, revenue, users: u.count ?? 0 });
    setRecentOrders(ordersData.slice(0, 10));
    setAllOrders(ordersData);
    setBrands((brandsRes.data ?? []) as Brand[]);
    setCategories((catsRes.data ?? []) as Category[]);

    const { data: allP } = await supabase.from('products').select('*, brands:brands(name)').order('created_at', { ascending: false });
    setAllProducts((allP ?? []) as ProductWithRefs[]);

    const { data: top } = await supabase.from('products').select('*, brands:brands(name)').order('rating', { ascending: false }).limit(5);
    setTopProducts((top ?? []) as ProductWithRefs[]);

    await loadCustomers(ordersData);
    // Load UPI setting
    const { data: upiRow } = await supabase.from('settings').select('value').eq('key', 'upi_id').maybeSingle();
    setUpiId(upiRow?.value || '');
    setLoading(false);
    setRefreshing(false);
  }

  async function saveUpiId() {
    setUpiSaving(true);
    await supabase.from('settings').upsert({ key: 'upi_id', value: upiId.trim(), updated_at: new Date().toISOString() }, { onConflict: 'key' });
    setUpiSaving(false);
    setUpiSaved(true);
    setTimeout(() => setUpiSaved(false), 2500);
    toast('UPI ID saved! Customers will now see this UPI for payments.');
  }

  async function loadCustomers(ordersData?: Order[]) {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    const orders = ordersData ?? allOrders;
    const rows: CustomerRow[] = (profiles ?? []).map((prof: any) => {
      const myOrders = orders.filter(o => o.user_id === prof.id);
      const itemCount = myOrders.reduce((s, o) => s + (o.order_items?.reduce((si, i) => si + i.quantity, 0) ?? 0), 0);
      const totalSpent = myOrders.reduce((s, o) => s + Number(o.total), 0);
      return { ...prof, order_count: myOrders.length, total_spent: totalSpent, item_count: itemCount };
    });
    setCustomers(rows);
  }

  async function createProduct() {
    setSaving(true);
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const images = form.images.split('\n').map(s => s.trim()).filter(Boolean);
    const highlights = form.highlights.split('\n').map(s => s.trim()).filter(Boolean);
    const colors = form.colors.split(',').map(s => s.trim()).filter(Boolean);
    const { error } = await supabase.from('products').insert({
      name: form.name, slug, brand_id: form.brand_id || null, category_id: form.category_id || null,
      price: Number(form.price), mrp: Number(form.mrp) || Number(form.price),
      stock: Number(form.stock), description: form.description,
      images, highlights, colors,
      is_featured: form.is_featured, is_new: form.is_new, emi_available: form.emi_available,
      emi_from: Math.round(Number(form.price) / 12),
      specs: {}, rating: 0, review_count: 0,
    });
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast('Product created!');
    setShowAddProduct(false);
    setForm(BLANK_FORM);
    load(true);
  }

  async function deleteProduct(p: ProductWithRefs) {
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    setDeleteConfirm(null);
    if (error) { toast(error.message, 'error'); return; }
    toast('Product deleted.');
    load(true);
  }

  async function clearCustomer(c: CustomerRow) {
    setClearing(true);
    const { error } = await supabase.from('orders').delete().eq('user_id', c.id);
    setClearing(false);
    setClearConfirm(null);
    if (error) { toast(error.message, 'error'); return; }
    toast(`Cleared all orders for ${c.full_name || 'customer'}.`);
    load(true);
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

  const filteredProducts = allProducts.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    ((p as any).brands?.name ?? '').toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredCustomers = customers.filter(c =>
    (c.full_name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone || '').includes(customerSearch)
  );

  return (
    <div className="container-x py-6 page-fill">
      {/* Delete Product Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <Modal onClose={() => setDeleteConfirm(null)}>
            <div className="w-14 h-14 rounded-2xl bg-error-100 dark:bg-error-950 grid place-items-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-error-500" />
            </div>
            <h3 className="font-display text-lg font-bold text-center mb-1">Delete Product?</h3>
            <p className="text-sm text-ink-500 text-center mb-5">
              <span className="font-semibold text-ink-800 dark:text-ink-100">{deleteConfirm.name}</span> will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => deleteProduct(deleteConfirm)} className="flex-1 btn bg-error-500 hover:bg-error-600 text-white">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </Modal>
        )}

        {/* Clear Customer Confirm */}
        {clearConfirm && (
          <Modal onClose={() => setClearConfirm(null)}>
            <div className="w-14 h-14 rounded-2xl bg-warning-100 dark:bg-warning-950 grid place-items-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-warning-600" />
            </div>
            <h3 className="font-display text-lg font-bold text-center mb-1">Clear Customer Data?</h3>
            <p className="text-sm text-ink-500 text-center mb-2">
              This will delete ALL orders for <span className="font-semibold text-ink-800 dark:text-ink-100">{clearConfirm.full_name || 'this customer'}</span>.
            </p>
            <div className="flex gap-4 justify-center text-sm font-semibold mb-5">
              <span className="text-error-500">{clearConfirm.order_count} orders</span>
              <span className="text-error-500">{clearConfirm.item_count} items</span>
              <span className="text-error-500">{inr(clearConfirm.total_spent)}</span>
            </div>
            <p className="text-xs text-ink-400 text-center mb-5">Order count, item count, and total spent will all reset to zero. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setClearConfirm(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => clearCustomer(clearConfirm)} disabled={clearing} className="flex-1 btn bg-error-500 hover:bg-error-600 text-white">
                <RotateCcw className="w-4 h-4" /> {clearing ? 'Clearing…' : 'Clear All'}
              </button>
            </div>
          </Modal>
        )}

        {/* Add Product Drawer */}
        {showAddProduct && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-end"
            onClick={() => setShowAddProduct(false)}
          >
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="h-full w-full max-w-lg bg-white dark:bg-ink-950 shadow-2xl overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-ink-950 border-b border-ink-200 dark:border-ink-800 p-5 flex items-center justify-between z-10">
                <h2 className="font-display font-bold text-lg">Add New Product</h2>
                <button onClick={() => setShowAddProduct(false)} className="w-8 h-8 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 grid place-items-center"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <Field label="Product Name *">
                  <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Samsung Galaxy S24 Ultra" />
                </Field>
                <Field label="Slug (auto-generated if blank)">
                  <input className="input" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="samsung-galaxy-s24-ultra" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Brand">
                    <select className="input" value={form.brand_id} onChange={e => setForm(f => ({ ...f, brand_id: e.target.value }))}>
                      <option value="">— Select Brand —</option>
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Category">
                    <select className="input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                      <option value="">— Select Category —</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Price (₹) *">
                    <input className="input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="29999" />
                  </Field>
                  <Field label="MRP (₹)">
                    <input className="input" type="number" value={form.mrp} onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))} placeholder="34999" />
                  </Field>
                  <Field label="Stock">
                    <input className="input" type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="50" />
                  </Field>
                </div>
                <Field label="Description">
                  <textarea className="input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description…" />
                </Field>
                <Field label="Image URLs (one per line)">
                  <textarea className="input font-mono text-xs" rows={3} value={form.images} onChange={e => setForm(f => ({ ...f, images: e.target.value }))} placeholder="https://images.pexels.com/…" />
                </Field>
                <Field label="Highlights (one per line)">
                  <textarea className="input" rows={3} value={form.highlights} onChange={e => setForm(f => ({ ...f, highlights: e.target.value }))} placeholder="6.8-inch Dynamic AMOLED display&#10;200MP rear camera" />
                </Field>
                <Field label="Colors (comma separated)">
                  <input className="input" value={form.colors} onChange={e => setForm(f => ({ ...f, colors: e.target.value }))} placeholder="Titanium Black, Cream, Violet" />
                </Field>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="w-4 h-4 rounded" />
                    Featured
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={form.is_new} onChange={e => setForm(f => ({ ...f, is_new: e.target.checked }))} className="w-4 h-4 rounded" />
                    New Arrival
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={form.emi_available} onChange={e => setForm(f => ({ ...f, emi_available: e.target.checked }))} className="w-4 h-4 rounded" />
                    EMI Available
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowAddProduct(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={createProduct} disabled={saving || !form.name || !form.price} className="btn-primary flex-1">
                    {saving ? 'Saving…' : <><CheckCircle2 className="w-4 h-4" /> Create Product</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-ink-500">Platform overview &amp; management</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(true)} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1">
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} /> Refresh
          </button>
          <span className="chip bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300"><Sparkles className="w-3.5 h-3.5" /> AI Settings</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={DollarSign} label="Total Revenue" value={loading ? '…' : inrCompact(stats.revenue)} trend="+18%" up color="text-success-600" />
        <StatCard icon={ShoppingBag} label="Orders" value={loading ? '…' : String(stats.orders)} trend="+12%" up color="text-brand-600" />
        <StatCard icon={Package} label="Products" value={loading ? '…' : String(stats.products)} color="text-brand-600" />
        <StatCard icon={Users} label="Customers" value={loading ? '…' : String(stats.users)} trend="+5" up color="text-accent-500" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 card p-1.5 w-fit flex-wrap">
        {(['overview', 'products', 'orders', 'customers', 'settings'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('px-4 py-2 rounded-lg text-sm font-semibold capitalize transition', tab === t ? 'bg-brand-600 text-white' : 'hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-600 dark:text-ink-300')}>{t}</button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
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

      {/* ── Products ── */}
      {tab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                className="input pl-9"
                placeholder="Search products…"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
              />
            </div>
            <button onClick={() => setShowAddProduct(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-ink-200 dark:border-ink-800 text-left text-xs uppercase text-ink-500">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">Brand</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">MRP</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id} className="border-b border-ink-100 dark:border-ink-800 hover:bg-ink-50 dark:hover:bg-ink-900 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {p.images[0]
                          ? <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                          : <div className="w-10 h-10 rounded-lg bg-ink-100 dark:bg-ink-800 grid place-items-center shrink-0"><Package className="w-4 h-4 text-ink-400" /></div>}
                        <div>
                          <p className="font-semibold line-clamp-1 max-w-[180px]">{p.name}</p>
                          <div className="flex gap-1 mt-0.5">
                            {p.is_new && <span className="badge bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300 text-[10px]">New</span>}
                            {p.is_featured && <span className="badge bg-accent-100 text-accent-700 dark:bg-accent-900 dark:text-accent-300 text-[10px]">Featured</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-ink-600 dark:text-ink-400">{(p as any).brands?.name ?? '—'}</td>
                    <td className="p-4 font-semibold">{inr(p.price)}</td>
                    <td className="p-4 text-ink-500 line-through text-xs">{inr(p.mrp)}</td>
                    <td className="p-4">
                      <span className={cn('font-semibold', p.stock === 0 ? 'text-error-500' : p.stock < 5 ? 'text-warning-600' : 'text-ink-700 dark:text-ink-200')}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="p-4 text-accent-500">⭐ {p.rating}</td>
                    <td className="p-4">
                      <button
                        onClick={() => setDeleteConfirm(p)}
                        className="w-8 h-8 rounded-lg bg-error-50 dark:bg-error-950 text-error-500 hover:bg-error-100 dark:hover:bg-error-900 grid place-items-center transition"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr><td colSpan={7} className="p-10 text-center text-ink-500">
                    {productSearch ? 'No products match your search.' : 'No products yet. Click "Add Product" to get started.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Orders ── */}
      {tab === 'orders' && (
        <div className="space-y-4">
          {(() => {
            const codOrders = allOrders.filter(o => o.payment_method === 'cod');
            const codPaid = codOrders.filter(o => o.payment_status === 'paid').length;
            const codPending = codOrders.filter(o => o.payment_status === 'pending').length;
            const codCancelled = codOrders.filter(o => o.payment_status === 'cancelled' || o.status === 'cancelled').length;
            if (codOrders.length === 0) return null;
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="card p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 grid place-items-center shrink-0"><Banknote className="w-4 h-4 text-amber-700" /></div>
                  <div><p className="font-display text-xl font-extrabold">{codOrders.length}</p><p className="text-xs text-ink-500">COD Orders</p></div>
                </div>
                <div className="card p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-warning-100 dark:bg-warning-950 grid place-items-center shrink-0"><Banknote className="w-4 h-4 text-warning-600" /></div>
                  <div><p className="font-display text-xl font-extrabold text-warning-600">{codPending}</p><p className="text-xs text-ink-500">Cash Pending</p></div>
                </div>
                <div className="card p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-success-100 dark:bg-success-950 grid place-items-center shrink-0"><Banknote className="w-4 h-4 text-success-600" /></div>
                  <div><p className="font-display text-xl font-extrabold text-success-600">{codPaid}</p><p className="text-xs text-ink-500">Cash Collected</p></div>
                </div>
                <div className="card p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-error-100 dark:bg-error-950 grid place-items-center shrink-0"><Banknote className="w-4 h-4 text-error-500" /></div>
                  <div><p className="font-display text-xl font-extrabold text-error-500">{codCancelled}</p><p className="text-xs text-ink-500">COD Cancelled</p></div>
                </div>
              </div>
            );
          })()}
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="border-b border-ink-200 dark:border-ink-800 text-left text-xs uppercase text-ink-500">
                <tr>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Order Status</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Pay Status</th>
                </tr>
              </thead>
              <tbody>
                {allOrders.map(o => {
                  const isCod = o.payment_method === 'cod';
                  const ps = o.payment_status;
                  const payBadge = ps === 'paid' ? 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300'
                    : ps === 'cancelled' ? 'bg-error-100 text-error-600 dark:bg-error-900 dark:text-error-400'
                    : 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-300';
                  const sBadge = o.status === 'delivered' ? 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300'
                    : o.status === 'cancelled' ? 'bg-error-100 text-error-600 dark:bg-error-900 dark:text-error-400'
                    : 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300';
                  return (
                    <tr key={o.id} className={cn('border-b border-ink-100 dark:border-ink-800 transition hover:bg-ink-50 dark:hover:bg-ink-900', isCod && ps === 'cancelled' && 'opacity-60')}>
                      <td className="p-4 font-semibold">#{o.order_number}</td>
                      <td className="p-4 text-ink-600">{formatDate(o.created_at)}</td>
                      <td className="p-4 font-bold">{inr(o.total)}</td>
                      <td className="p-4"><span className={cn('badge', sBadge)}>{o.status.replace(/_/g, ' ')}</span></td>
                      <td className="p-4">
                        {isCod
                          ? <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 flex items-center gap-1 w-fit"><Banknote className="w-3 h-3" /> COD</span>
                          : <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300">Razorpay</span>}
                      </td>
                      <td className="p-4"><span className={cn('badge', payBadge)}>{ps === 'paid' ? 'Paid' : ps === 'cancelled' ? 'Cancelled' : 'Pending'}</span></td>
                    </tr>
                  );
                })}
                {allOrders.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-ink-500">No orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Customers ── */}
      {tab === 'customers' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              className="input pl-9"
              placeholder="Search by name or phone…"
              value={customerSearch}
              onChange={e => setCustomerSearch(e.target.value)}
            />
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="border-b border-ink-200 dark:border-ink-800 text-left text-xs uppercase text-ink-500">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Role</th>
                  <th className="p-4 text-center">Orders</th>
                  <th className="p-4 text-center">Items Purchased</th>
                  <th className="p-4">Total Spent</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(c => (
                  <tr key={c.id} className="border-b border-ink-100 dark:border-ink-800 hover:bg-ink-50 dark:hover:bg-ink-900 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 grid place-items-center font-bold text-sm shrink-0">
                          {(c.full_name || 'U')[0].toUpperCase()}
                        </div>
                        <span className="font-semibold">{c.full_name || <span className="text-ink-400 italic">No name</span>}</span>
                      </div>
                    </td>
                    <td className="p-4 text-ink-600">{c.phone || '—'}</td>
                    <td className="p-4">
                      <span className={cn('badge', c.role === 'admin' ? 'bg-error-100 text-error-600' : c.role === 'seller' ? 'bg-accent-100 text-accent-700' : c.role === 'delivery' ? 'bg-amber-100 text-amber-700' : 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300')}>
                        {c.role}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold">{c.order_count}</td>
                    <td className="p-4 text-center">
                      <span className={cn('font-bold', c.item_count > 0 ? 'text-brand-600' : 'text-ink-400')}>{c.item_count}</span>
                    </td>
                    <td className="p-4 font-semibold text-success-600">{c.total_spent > 0 ? inr(c.total_spent) : <span className="text-ink-400">₹0</span>}</td>
                    <td className="p-4 text-ink-500 text-xs">{formatDate(c.created_at)}</td>
                    <td className="p-4">
                      {c.order_count > 0 ? (
                        <button
                          onClick={() => setClearConfirm(c)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error-50 dark:bg-error-950 text-error-600 hover:bg-error-100 dark:hover:bg-error-900 text-xs font-semibold transition"
                          title="Clear all orders for this customer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Clear
                        </button>
                      ) : (
                        <span className="text-xs text-ink-400">No orders</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr><td colSpan={8} className="p-10 text-center text-ink-500">
                    {customerSearch ? 'No customers match your search.' : 'No customers yet.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Settings ── */}
      {tab === 'settings' && (
        <div className="max-w-2xl space-y-6">
          {/* UPI Settings Card */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-950 grid place-items-center shrink-0">
                <Smartphone className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg">UPI Payment ID</h2>
                <p className="text-sm text-ink-500">All customer UPI payments will be sent to this ID</p>
              </div>
            </div>

            {/* UPI ID Input */}
            <div className="mb-4">
              <label className="label mb-1.5">Your UPI ID</label>
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type={showUpi ? 'text' : 'password'}
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  placeholder="yourname@upi or phone@paytm"
                  className="input pl-10 pr-12 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowUpi(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 transition"
                >
                  {showUpi ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-ink-400 mt-1.5">Accepted formats: <span className="font-mono">name@upi</span>, <span className="font-mono">9999999999@paytm</span>, <span className="font-mono">name@phonepe</span></p>
            </div>

            {/* Preview */}
            {upiId.trim() && (
              <div className="mb-4 p-3 rounded-xl bg-success-50 dark:bg-success-950 border border-success-200 dark:border-success-800 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-success-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-success-700 dark:text-success-300">Payments will be received at</p>
                  <p className="font-mono font-bold text-sm text-success-800 dark:text-success-200 truncate">{upiId}</p>
                </div>
              </div>
            )}

            <button
              onClick={saveUpiId}
              disabled={upiSaving || !upiId.trim()}
              className="btn-primary w-full !py-3"
            >
              {upiSaving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                : upiSaved
                ? <><CheckCircle2 className="w-4 h-4" /> UPI ID Saved!</>
                : <><Save className="w-4 h-4" /> Save UPI ID</>}
            </button>
          </div>

          {/* What happens info */}
          <div className="card p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Banknote className="w-4 h-4 text-amber-600" /> How UPI Payments Work</h3>
            <ol className="space-y-3 text-sm text-ink-600 dark:text-ink-300">
              {[
                'Customer selects "UPI / PhonePe / GPay" at checkout',
                'Your UPI ID and QR code are displayed to the customer',
                'Customer opens their UPI app (PhonePe, GPay, Paytm) and pays',
                'Customer taps "I\'ve Paid" — order is confirmed automatically',
                'Money is credited directly to your UPI account',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 font-bold text-xs grid place-items-center shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Supported apps */}
          <div className="card p-5">
            <h3 className="font-semibold mb-3">Supported UPI Apps</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'PhonePe', color: 'bg-[#5f259f]', letter: 'P' },
                { name: 'Google Pay', color: 'bg-[#4285F4]', letter: 'G' },
                { name: 'Paytm', color: 'bg-[#00BAF2]', letter: 'T' },
              ].map(app => (
                <div key={app.name} className="flex items-center gap-2 p-3 rounded-xl bg-ink-50 dark:bg-ink-800">
                  <div className={`w-9 h-9 rounded-xl ${app.color} text-white font-extrabold text-sm grid place-items-center shrink-0`}>{app.letter}</div>
                  <span className="text-sm font-semibold">{app.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        className="card p-6 max-w-sm w-full"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label mb-1">{label}</label>
      {children}
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
