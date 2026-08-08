import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package, DollarSign, Plus, Pencil, Trash2, Sparkles,
  ShoppingBag, Star, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { inr, inrCompact, cn } from '../lib/utils';
import type { Product, ProductWithRefs, Brand, Category } from '../types';

export default function SellerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductWithRefs[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [, setAiDesc] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', slug: '', brand_id: '', category_id: '', price: '', mrp: '',
    description: '', highlights: '', stock: '', images: '', colors: '',
  });

  useEffect(() => { loadData(); }, []);
  async function loadData() {
    const [p, b, c] = await Promise.all([
      supabase.from('products').select('*, brands:brands(name,slug), categories:categories(name,slug)').order('created_at', { ascending: false }),
      supabase.from('brands').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
    ]);
    setProducts((p.data ?? []) as ProductWithRefs[]);
    setBrands((b.data ?? []) as Brand[]);
    setCategories((c.data ?? []) as Category[]);
    setLoading(false);
  }

  // Allow any logged-in user to view seller dashboard (demo mode)
  if (!user) return <Navigate to="/login?redirect=/seller" replace />;

  const revenue = products.reduce((s, p) => s + p.price * Math.max(1, Math.floor(p.review_count / 8)), 0);
  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const avgRating = products.length ? (products.reduce((s, p) => s + p.rating, 0) / products.length).toFixed(2) : '0';

  const generateAIDescription = () => {
    setAiLoading(true);
    setTimeout(() => {
      const name = form.name || 'This device';
      const brand = brands.find(b => b.id === form.brand_id)?.name || '';
      const price = form.price || '';
      const highlights = form.highlights.split(',').filter(Boolean);
      const top = highlights.slice(0, 3).join(', ');
      const desc = `${name} by ${brand} brings premium features at ${inr(Number(price) || 0)}. Highlights include ${top || 'cutting-edge technology'}.`;
      setForm(f => ({ ...f, description: desc }));
      setAiDesc(desc);
      setAiLoading(false);
      toast('AI description generated!');
    }, 900);
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.slug || form.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const payload = {
      name: form.name,
      slug,
      brand_id: form.brand_id || null,
      category_id: form.category_id || null,
      price: Number(form.price) || 0,
      mrp: Number(form.mrp) || Number(form.price) || 0,
      description: form.description,
      highlights: form.highlights.split(',').map(s => s.trim()).filter(Boolean),
      stock: Number(form.stock) || 0,
      images: form.images.split(',').map(s => s.trim()).filter(Boolean).length > 0 ? form.images.split(',').map(s => s.trim()).filter(Boolean) : ['https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=900'],
      colors: form.colors.split(',').map(s => s.trim()).filter(Boolean),
      emi_available: true,
      emi_from: Math.round((Number(form.price) || 0) / 12),
      is_featured: false, is_new: true,
    };

    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
      if (error) { toast(error.message, 'error'); return; }
      toast('Product updated');
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) { toast(error.message, 'error'); return; }
      toast('Product added');
    }
    setShowForm(false); setEditing(null);
    setForm({ name: '', slug: '', brand_id: '', category_id: '', price: '', mrp: '', description: '', highlights: '', stock: '', images: '', colors: '' });
    loadData();
  };

  const editProduct = (p: ProductWithRefs) => {
    setEditing(p);
    setForm({
      name: p.name, slug: p.slug, brand_id: p.brand_id, category_id: p.category_id,
      price: String(p.price), mrp: String(p.mrp), description: p.description,
      highlights: p.highlights.join(', '), stock: String(p.stock),
      images: p.images.join(', '), colors: p.colors.join(', '),
    });
    setShowForm(true);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { toast(error.message, 'error'); return; }
    toast('Product deleted', 'info');
    loadData();
  };

  return (
    <div className="container-x py-6 page-fill">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink-900 dark:text-white">Seller Dashboard</h1>
          <p className="text-sm text-ink-500">Manage your products, inventory & sales</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); setForm({ name: '', slug: '', brand_id: '', category_id: '', price: '', mrp: '', description: '', highlights: '', stock: '', images: '', colors: '' }); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={DollarSign} label="Revenue" value={inrCompact(revenue)} trend="+12%" up color="text-success-600" />
        <StatCard icon={Package} label="Products" value={String(products.length)} trend={`${totalStock} in stock`} color="text-brand-600" />
        <StatCard icon={Star} label="Avg Rating" value={avgRating} trend="Across all products" color="text-accent-500" />
        <StatCard icon={ShoppingBag} label="Sales" value={String(products.reduce((s, p) => s + Math.floor(p.review_count / 8), 0))} trend="+8 this week" up color="text-brand-600" />
      </div>

      {/* Product table */}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="border-b border-ink-200 dark:border-ink-800">
            <tr className="text-left text-ink-500 text-xs uppercase">
              <th className="p-4">Product</th><th className="p-4">Brand</th><th className="p-4">Price</th><th className="p-4">Stock</th><th className="p-4">Rating</th><th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="p-8 text-center text-ink-500">Loading…</td></tr> :
             products.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-ink-500">No products yet. Add your first product!</td></tr> :
             products.map(p => (
              <tr key={p.id} className="border-b border-ink-100 dark:border-ink-800 hover:bg-ink-50 dark:hover:bg-ink-800/30">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    <div><p className="font-semibold text-ink-900 dark:text-white line-clamp-1 max-w-[200px]">{p.name}</p><p className="text-xs text-ink-500">{p.brands?.name}</p></div>
                  </div>
                </td>
                <td className="p-4 text-ink-600 dark:text-ink-300">{p.brands?.name}</td>
                <td className="p-4 font-semibold">{inr(p.price)}</td>
                <td className="p-4"><span className={cn('badge', p.stock > 10 ? 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300' : 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-300')}>{p.stock}</span></td>
                <td className="p-4">⭐ {p.rating}</td>
                <td className="p-4">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => editProduct(p)} className="w-8 h-8 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900 text-brand-600 grid place-items-center"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteProduct(p.id)} className="w-8 h-8 rounded-lg hover:bg-error-100 dark:hover:bg-error-900 text-error-600 grid place-items-center"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            onSubmit={saveProduct} className="relative card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-3"
          >
            <h2 className="font-display text-xl font-bold">{editing ? 'Edit Product' : 'Add Product'}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><label className="label">Name</label><input required className="input" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="label">Slug (auto)</label><input className="input" value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" /></div>
              <div><label className="label">Brand</label><select className="input" value={form.brand_id} onChange={(e) => setForm(f => ({ ...f, brand_id: e.target.value }))}><option value="">Select brand</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              <div><label className="label">Category</label><select className="input" value={form.category_id} onChange={(e) => setForm(f => ({ ...f, category_id: e.target.value }))}><option value="">Select category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className="label">Price (₹)</label><input type="number" required className="input" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} /></div>
              <div><label className="label">MRP (₹)</label><input type="number" className="input" value={form.mrp} onChange={(e) => setForm(f => ({ ...f, mrp: e.target.value }))} /></div>
              <div><label className="label">Stock</label><input type="number" required className="input" value={form.stock} onChange={(e) => setForm(f => ({ ...f, stock: e.target.value }))} /></div>
              <div><label className="label">Colors (comma separated)</label><input className="input" value={form.colors} onChange={(e) => setForm(f => ({ ...f, colors: e.target.value }))} placeholder="Black, Blue" /></div>
            </div>
            <div><label className="label">Image URLs (comma separated)</label><input className="input" value={form.images} onChange={(e) => setForm(f => ({ ...f, images: e.target.value }))} placeholder="https://..." /></div>
            <div><label className="label">Highlights (comma separated)</label><input className="input" value={form.highlights} onChange={(e) => setForm(f => ({ ...f, highlights: e.target.value }))} placeholder="5G, 120Hz, 5000mAh" /></div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label !mb-0">Description</label>
                <button type="button" onClick={generateAIDescription} disabled={aiLoading} className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> {aiLoading ? 'Generating…' : 'AI Generate'}
                </button>
              </div>
              <textarea rows={3} className="input" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Product description…" />
            </div>
            <div className="flex gap-2 pt-2"><button type="submit" className="btn-primary">{editing ? 'Update' : 'Add'} Product</button><button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button></div>
          </motion.form>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, up, color }: any) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={cn('w-10 h-10 rounded-xl grid place-items-center bg-ink-100 dark:bg-ink-800', color)}><Icon className="w-5 h-5" /></div>
        {up != null && <span className={cn('text-xs font-semibold flex items-center gap-0.5', up ? 'text-success-600' : 'text-error-500')}>{up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{trend}</span>}
      </div>
      <p className="font-display text-2xl font-extrabold text-ink-900 dark:text-white">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
      {up == null && <p className="text-xs text-ink-400 mt-0.5">{trend}</p>}
    </div>
  );
}
