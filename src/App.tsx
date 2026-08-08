import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { CompareProvider } from './context/CompareContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AIChatbot } from './components/AIChatbot';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Brands from './pages/Brands';
import Compare from './pages/Compare';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Wishlist from './pages/Wishlist';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Account from './pages/Account';
import About from './pages/About';
import Contact from './pages/Contact';
import Offers from './pages/Offers';
import NewArrivals from './pages/NewArrivals';
import AIRecommend from './pages/AIRecommend';
import FAQ from './pages/FAQ';
import Warranty from './pages/Warranty';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';
import SellerDashboard from './pages/SellerDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import AdminDashboard from './pages/AdminDashboard';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <WishlistProvider>
              <CompareProvider>
                <BrowserRouter>
                  <ScrollTop />
                  <div className="min-h-screen flex flex-col bg-[rgb(var(--bg))]">
                    <Navbar />
                    <main className="flex-1 bg-[rgb(var(--bg))]">
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/product/:slug" element={<ProductDetail />} />
                        <Route path="/brands" element={<Brands />} />
                        <Route path="/compare" element={<Compare />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/wishlist" element={<Wishlist />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/account/*" element={<Account />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/offers" element={<Offers />} />
                        <Route path="/new-arrivals" element={<NewArrivals />} />
                        <Route path="/ai-recommend" element={<AIRecommend />} />
                        <Route path="/faq" element={<FAQ />} />
                        <Route path="/warranty" element={<Warranty />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/terms" element={<Terms />} />
                       
                        <Route path="/delivery" element={<DeliveryDashboard />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    <Footer />
                    <AIChatbot />
                  </div>
                </BrowserRouter>
              </CompareProvider>
            </WishlistProvider>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
