import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart, Heart, GitCompare, Search, Menu, X, Sun, Moon, User, LogOut,
  LayoutDashboard, Mic, Sparkles, MapPin, Phone, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCategories } from '../hooks/useData';
import { cn } from '../lib/utils';

export function Navbar() {
  const { count: cartCount } = useCart();
  const { ids: wishIds } = useWishlist();
  const { items: compareItems } = useCompare();
  const { user, profile, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const categories = useCategories();
  const nav = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [userMenu, setUserMenu] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenu(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      nav(`/products?search=${encodeURIComponent(searchVal.trim())}`);
      setMobileOpen(false);
    }
  };

  const startVoice = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { alert('Voice search not supported in this browser. Try Chrome.'); return; }
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    setListening(true);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setSearchVal(text);
      nav(`/products?search=${encodeURIComponent(text)}`);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  return (
    <>
      {/* Top strip */}
      <div className="bg-ink-950 text-ink-200 text-xs">
        <div className="container-x flex items-center justify-between py-1.5">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-brand-400" />
            <span className="hidden sm:inline">Lakkaram, Choutuppal, Telangana 508252</span>
            <span className="sm:hidden">Choutuppal, TS</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="tel:+919000000000" className="flex items-center gap-1.5 hover:text-white transition">
              <Phone className="w-3.5 h-3.5" /> <span className="hidden sm:inline">+91 90000 00000</span>
            </a>
            <Link to="/seller" className="hidden sm:inline hover:text-white transition">Seller</Link>
            <Link to="/delivery" className="hidden sm:inline hover:text-white transition">Delivery</Link>
            <Link to="/admin" className="hidden sm:inline hover:text-white transition">Admin</Link>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 glass border-b border-ink-200 dark:border-ink-800">
        <div className="container-x">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-brand-600 text-white grid place-items-center font-extrabold font-display text-sm">MM</div>
              <div className="hidden sm:block">
                <p className="font-display font-extrabold text-lg leading-none text-ink-900 dark:text-white">MMMobiles</p>
                <p className="text-[10px] text-ink-500 dark:text-ink-400 leading-none">AI Mobile Store</p>
              </div>
            </Link>

            {/* Search (desktop) */}
            <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-2xl relative">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search for mobiles, brands, accessories…"
                  className="w-full bg-ink-100 dark:bg-ink-800 border border-transparent focus:border-brand-500 rounded-xl pl-10 pr-20 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={startVoice}
                    className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition', listening ? 'bg-error-500 text-white animate-pulse' : 'text-ink-500 hover:text-brand-600 hover:bg-ink-200 dark:hover:bg-ink-700')}
                    title="Voice search"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  <button type="submit" className="btn-primary py-1.5 px-3 text-sm">Search</button>
                </div>
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Link to="/compare" className="relative btn-ghost !px-2" title="Compare">
                <GitCompare className="w-5 h-5" />
                {compareItems.length > 0 && <Badge n={compareItems.length} />}
              </Link>
              <Link to="/wishlist" className="relative btn-ghost !px-2" title="Wishlist">
                <Heart className="w-5 h-5" />
                {wishIds.length > 0 && <Badge n={wishIds.length} />}
              </Link>
              <Link to="/cart" className="relative btn-ghost !px-2" title="Cart">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && <Badge n={cartCount} />}
              </Link>
              <button onClick={toggle} className="btn-ghost !px-2" title="Toggle theme">
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenu(o => !o)}
                    className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-800 transition"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white grid place-items-center text-xs font-bold">
                      {profile?.full_name?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <ChevronDown className="w-4 h-4 text-ink-400 hidden sm:block" />
                  </button>
                  <AnimatePresence>
                    {userMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 mt-2 w-56 card p-2 z-50"
                      >
                        <div className="px-3 py-2 border-b border-ink-200 dark:border-ink-700 mb-1">
                          <p className="text-sm font-semibold text-ink-900 dark:text-white truncate">{profile?.full_name || 'User'}</p>
                          <p className="text-xs text-ink-500 truncate">{user.email}</p>
                        </div>
                        <MenuItem to="/account" icon={<LayoutDashboard className="w-4 h-4" />} label="My Dashboard" onClick={() => setUserMenu(false)} />
                        <MenuItem to="/account/orders" icon={<ShoppingCart className="w-4 h-4" />} label="Orders" onClick={() => setUserMenu(false)} />
                        <MenuItem to="/account/wishlist" icon={<Heart className="w-4 h-4" />} label="Wishlist" onClick={() => setUserMenu(false)} />
                        <button
                          onClick={() => { signOut(); setUserMenu(false); nav('/'); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/30 transition"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link to="/login" className="btn-primary !py-2 !px-4 text-sm hidden sm:flex">
                  <User className="w-4 h-4" /> Login
                </Link>
              )}

              <button onClick={() => setMobileOpen(o => !o)} className="md:hidden btn-ghost !px-2" aria-label="Menu">
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:block border-t border-ink-200 dark:border-ink-800">
          <div className="container-x flex items-center gap-1 h-11 text-sm">
            <div className="relative" onMouseEnter={() => setCatsOpen(true)} onMouseLeave={() => setCatsOpen(false)}>
              <button className="flex items-center gap-1.5 px-3 py-2 font-semibold text-ink-800 dark:text-ink-100 hover:text-brand-600 dark:hover:text-brand-400">
                <Menu className="w-4 h-4" /> Categories <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {catsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    className="absolute top-full left-0 w-64 card p-2 mt-0 z-50"
                  >
                    {categories.map(c => (
                      <Link key={c.id} to={`/products?category=${c.id}`} className="block px-3 py-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-sm">
                        {c.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/products">All Products</NavLink>
            <NavLink to="/brands">Brands</NavLink>
            <NavLink to="/offers">Offers</NavLink>
            <NavLink to="/new-arrivals">New Arrivals</NavLink>
            <NavLink to="/compare">Compare</NavLink>
            {/* More dropdown (desktop) */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen(o => !o)}
                className="flex items-center gap-1.5 px-3 py-2 font-semibold text-ink-800 dark:text-ink-100 hover:text-brand-600 dark:hover:text-brand-400"
              >
                More <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', moreOpen && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    className="absolute top-full right-0 w-52 card p-2 mt-0 z-50"
                  >
                    <Link to="/ai-recommend" onClick={() => setMoreOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-sm font-semibold text-brand-600 dark:text-brand-400">
                      <Sparkles className="w-4 h-4" /> AI Recommend
                    </Link>
                    <Link to="/about" onClick={() => setMoreOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-sm">About</Link>
                    <Link to="/contact" onClick={() => setMoreOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-sm">Contact</Link>
                    <Link to="/faq" onClick={() => setMoreOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 text-sm">FAQ</Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-ink-200 dark:border-ink-800"
            >
              <div className="container-x py-4 space-y-3">
                <form onSubmit={submitSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    placeholder="Search…"
                    className="input pl-10 pr-10"
                  />
                  <button type="button" onClick={startVoice} className={cn('absolute right-3 top-1/2 -translate-y-1/2', listening && 'text-error-500')}>
                    <Mic className="w-4 h-4" />
                  </button>
                </form>
                <div className="grid grid-cols-2 gap-2">
                  {[['Home','/'],['Products','/products'],['Brands','/brands'],['Offers','/offers'],['New Arrivals','/new-arrivals'],['Compare','/compare']].map(([l,p]) => (
                    <Link key={p} to={p} onClick={() => setMobileOpen(false)} className="btn-secondary !py-2 text-sm justify-start">{l}</Link>
                  ))}
                </div>
                {/* More (mobile) */}
                <div className="rounded-xl border border-ink-200 dark:border-ink-700 overflow-hidden">
                  <button
                    onClick={() => setMobileMoreOpen(o => !o)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-ink-800 dark:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-800 transition"
                  >
                    <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-brand-500" /> More</span>
                    <ChevronDown className={cn('w-4 h-4 text-ink-400 transition-transform', mobileMoreOpen && 'rotate-180')} />
                  </button>
                  <AnimatePresence>
                    {mobileMoreOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-2 p-3 pt-1">
                          <Link to="/ai-recommend" onClick={() => { setMobileOpen(false); setMobileMoreOpen(false); }} className="btn-secondary !py-2 text-sm justify-start !text-brand-600 dark:!text-brand-400 font-semibold">AI Recommend</Link>
                          <Link to="/about" onClick={() => { setMobileOpen(false); setMobileMoreOpen(false); }} className="btn-secondary !py-2 text-sm justify-start">About</Link>
                          <Link to="/contact" onClick={() => { setMobileOpen(false); setMobileMoreOpen(false); }} className="btn-secondary !py-2 text-sm justify-start">Contact</Link>
                          <Link to="/faq" onClick={() => { setMobileOpen(false); setMobileMoreOpen(false); }} className="btn-secondary !py-2 text-sm justify-start">FAQ</Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex gap-2">
                  <Link to="/seller" onClick={() => setMobileOpen(false)} className="btn-outline flex-1 !py-2 text-sm">Seller</Link>
                  <Link to="/delivery" onClick={() => setMobileOpen(false)} className="btn-outline flex-1 !py-2 text-sm">Delivery</Link>
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="btn-outline flex-1 !py-2 text-sm">Admin</Link>
                </div>
                {!user && <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-primary w-full !py-2.5">Login / Sign Up</Link>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-500 text-white text-[10px] font-bold grid place-items-center animate-scale-in">
      {n > 99 ? '99+' : n}
    </span>
  );
}

function NavLink({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) {
  return (
    <Link to={to} className={cn('px-3 py-2 font-medium text-ink-700 dark:text-ink-200 hover:text-brand-600 dark:hover:text-brand-400 transition link-hover', className)}>
      {children}
    </Link>
  );
}

function MenuItem({ to, icon, label, onClick }: { to: string; icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-ink-100 dark:hover:bg-ink-800 transition">
      {icon} {label}
    </Link>
  );
}
