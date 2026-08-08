import { Routes, Route, Link, NavLink, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { User, Package, Heart, MapPin, Bell, LogOut, ChevronRight, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { supabase } from '../lib/supabase';
import { inr, formatDateTime, cn } from '../lib/utils';
import type { Order, Address, AppNotification } from '../types';
import { useToast } from '../context/ToastContext';

export default function Account() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { ids: wishIds } = useWishlist();
  const { toast } = useToast();

  if (!user) return <Navigate to="/login?redirect=/account" replace />;

  const navItems = [
    { to: '/account', label: 'Profile', icon: User, end: true },
    { to: '/account/orders', label: 'Orders', icon: Package },
    { to: '/account/wishlist', label: 'Wishlist', icon: Heart, badge: wishIds.length },
    { to: '/account/addresses', label: 'Addresses', icon: MapPin },
    { to: '/account/notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="container-x py-6 page-fill">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 text-white grid place-items-center font-bold text-xl">{profile?.full_name?.[0]?.toUpperCase() || 'U'}</div>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-white">Hello, {profile?.full_name?.split(' ')[0] || 'User'}</h1>
          <p className="text-sm text-ink-500">{user.email}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="card p-3 h-fit">
          <nav className="space-y-1">
            {navItems.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition', isActive ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300' : 'hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-700 dark:text-ink-200')}
              >
                <n.icon className="w-4 h-4" /> {n.label}
                {n.badge ? <span className="ml-auto badge bg-accent-500 text-white">{n.badge}</span> : null}
              </NavLink>
            ))}
            <button onClick={() => { signOut(); toast('Signed out'); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-950 transition">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div className="lg:col-span-3">
          <Routes>
            <Route index element={<ProfileTab user={user} profile={profile} refresh={refreshProfile} />} />
            <Route path="orders" element={<OrdersTab userId={user.id} />} />
            <Route path="wishlist" element={<WishlistTab />} />
            <Route path="addresses" element={<AddressesTab userId={user.id} />} />
            <Route path="notifications" element={<NotificationsTab userId={user.id} />} />
            <Route path="*" element={<Navigate to="/account" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ user, profile, refresh }: any) {
  const [form, setForm] = useState({ full_name: profile?.full_name || '', phone: profile?.phone || '' });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: form.full_name, phone: form.phone }).eq('id', user.id);
    setSaving(false);
    if (error) toast(error.message, 'error');
    else { toast('Profile updated'); refresh(); }
  };

  return (
    <div className="card p-6">
      <h2 className="font-display text-xl font-bold mb-5">Profile Details</h2>
      <form onSubmit={save} className="space-y-4 max-w-md">
        <div><label className="label">Email</label><input value={user.email} disabled className="input opacity-60" /></div>
        <div><label className="label">Full Name</label><input value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} className="input" /></div>
        <div><label className="label">Phone</label><input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="input" /></div>
        <div><label className="label">Role</label><input value={profile?.role || 'customer'} disabled className="input capitalize opacity-60" /></div>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Changes'}</button>
      </form>
    </div>
  );
}

function OrdersTab({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setOrders((data ?? []) as Order[]);
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return <div className="card p-8 text-center text-ink-500">Loading orders…</div>;

  if (orders.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Package className="w-16 h-16 mx-auto text-ink-300 dark:text-ink-700 mb-3" />
        <h2 className="font-semibold text-lg mb-2">No orders yet</h2>
        <p className="text-ink-500 mb-4">Start shopping to see your orders here.</p>
        <Link to="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map(o => (
        <div key={o.id} className="card overflow-hidden">
          <button onClick={() => setExpanded(e => e === o.id ? null : o.id)} className="w-full p-4 flex items-center gap-4 text-left hover:bg-ink-50 dark:hover:bg-ink-800/50 transition">
            <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 grid place-items-center shrink-0"><Package className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-ink-900 dark:text-white">Order #{o.order_number}</p>
              <p className="text-xs text-ink-500">{formatDateTime(o.created_at)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-sm">{inr(o.total)}</p>
              <span className={cn('badge', o.status === 'delivered' ? 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300' : 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300')}>{o.status.replace(/_/g, ' ')}</span>
            </div>
            <ChevronRight className={cn('w-4 h-4 text-ink-400 transition-transform', expanded === o.id && 'rotate-90')} />
          </button>

          {expanded === o.id && (
            <div className="border-t border-ink-200 dark:border-ink-800 p-4 space-y-3">
              {/* Live tracking mock */}
              {o.status !== 'delivered' && o.status !== 'cancelled' && (
                <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-4 h-4 text-brand-600 animate-pulse" />
                    <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">Live Tracking</p>
                  </div>
                  <div className="h-2 bg-ink-200 dark:bg-ink-700 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                  <p className="text-xs text-ink-500 mt-1.5">Partner: {o.delivery_partner_name} · ETA: {o.eta_minutes} min</p>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-ink-500">Delivery OTP:</span>
                <span className="font-extrabold text-brand-600 dark:text-brand-400 text-lg tracking-widest">{o.delivery_otp}</span>
              </div>
              {o.order_items?.map(it => (
                <div key={it.id} className="flex gap-3">
                  <img src={it.product_image} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1"><p className="text-sm font-medium">{it.product_name}</p><p className="text-xs text-ink-500">Qty: {it.quantity} · {inr(it.price)}</p></div>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-ink-100 dark:border-ink-800">
                <p><span className="text-ink-500">Items:</span> {inr(o.items_total)}</p>
                <p><span className="text-ink-500">Delivery:</span> {inr(o.delivery_charge)}</p>
                <p className="font-bold col-span-2"><span className="text-ink-500">Total:</span> {inr(o.total)}</p>
              </div>
              <div className="text-xs text-ink-500">
                <p>Ship to: {o.address.full_name}, {o.address.line1}, {o.address.city}, {o.address.state} - {o.address.pincode}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function WishlistTab() {
  const { items } = useWishlist();
  if (items.length === 0) return <div className="card p-12 text-center"><Heart className="w-12 h-12 mx-auto text-ink-300 mb-3" /><p className="text-ink-500">Your wishlist is empty.</p><Link to="/products" className="btn-primary mt-4">Browse Products</Link></div>;
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {items.map(p => (
        <Link key={p.id} to={`/product/${p.slug}`} className="card p-3 flex gap-3 hover:shadow-card transition">
          <img src={p.images[0]} alt="" className="w-16 h-16 rounded-lg object-cover" />
          <div className="flex-1 min-w-0"><p className="text-sm font-semibold line-clamp-2">{p.name}</p><p className="text-brand-600 font-bold mt-1">{inr(p.price)}</p></div>
        </Link>
      ))}
    </div>
  );
}

function AddressesTab({ userId }: { userId: string }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: 'Home', full_name: '', phone: '', line1: '', line2: '', city: '', state: 'Telangana', pincode: '' });
  const { toast } = useToast();

  useEffect(() => { load(); }, []);
  const load = async () => {
    const { data } = await supabase.from('addresses').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    setAddresses(data as Address[]);
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('addresses').insert({ user_id: userId, ...form, is_default: addresses.length === 0 });
    if (error) { toast(error.message, 'error'); return; }
    toast('Address added'); setShowForm(false); setForm({ label: 'Home', full_name: '', phone: '', line1: '', line2: '', city: '', state: 'Telangana', pincode: '' }); load();
  };
  const del = async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id);
    toast('Address removed', 'info'); load();
  };

  return (
    <div className="space-y-3">
      {addresses.map(a => (
        <div key={a.id} className="card p-4 flex items-start gap-3">
          <MapPin className="w-5 h-5 text-brand-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm">{a.full_name} <span className="text-ink-500 font-normal">· {a.label}</span></p>
            <p className="text-sm text-ink-600 dark:text-ink-300">{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} - {a.pincode}</p>
            <p className="text-xs text-ink-500 mt-0.5">{a.phone}</p>
          </div>
          <button onClick={() => del(a.id)} className="text-error-500 text-xs hover:underline">Delete</button>
        </div>
      ))}
      {showForm ? (
        <form onSubmit={save} className="card p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input required placeholder="Full Name" className="input" value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} />
            <input required placeholder="Phone" className="input" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
            <input required placeholder="Address Line 1" className="input sm:col-span-2" value={form.line1} onChange={(e) => setForm(f => ({ ...f, line1: e.target.value }))} />
            <input required placeholder="City" className="input" value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} />
            <input required placeholder="Pincode" className="input" value={form.pincode} onChange={(e) => setForm(f => ({ ...f, pincode: e.target.value }))} />
          </div>
          <div className="flex gap-2"><button type="submit" className="btn-primary">Save</button><button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button></div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)} className="card p-4 w-full text-center text-brand-600 font-semibold hover:shadow-card transition">+ Add New Address</button>
      )}
    </div>
  );
}

function NotificationsTab({ userId }: { userId: string }) {
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      setNotifs((data ?? []) as AppNotification[]);
    })();
  }, [userId]);

  if (notifs.length === 0) return <div className="card p-12 text-center"><Bell className="w-12 h-12 mx-auto text-ink-300 mb-3" /><p className="text-ink-500">No notifications yet.</p></div>;
  return (
    <div className="space-y-2">
      {notifs.map(n => (
        <div key={n.id} className={cn('card p-4 flex items-start gap-3', !n.is_read && 'border-brand-300 dark:border-brand-700')}>
          <Bell className="w-5 h-5 text-brand-600 mt-0.5" />
          <div className="flex-1"><p className="font-semibold text-sm">{n.title}</p><p className="text-sm text-ink-600 dark:text-ink-300">{n.body}</p><p className="text-xs text-ink-400 mt-1">{formatDateTime(n.created_at)}</p></div>
        </div>
      ))}
    </div>
  );
}
