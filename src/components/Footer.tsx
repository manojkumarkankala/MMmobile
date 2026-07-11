import { Link } from 'react-router-dom';
import { MapPin, Phone, MessageCircle, Mail, Shield, Truck, CreditCard, Headphones } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-950">
      {/* Trust badges */}
      <div className="container-x py-8 border-b border-ink-200 dark:border-ink-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, title: 'Free Fast Delivery', sub: 'Same-day in Choutuppal' },
            { icon: Shield, title: '1-Year Warranty', sub: 'On all phones' },
            { icon: CreditCard, title: 'No-Cost EMI', sub: 'From all major banks' },
            { icon: Headphones, title: '24x7 Support', sub: 'Call, WhatsApp, Chat' },
          ].map(f => (
            <div key={f.title} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 grid place-items-center shrink-0">
                <f.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-ink-900 dark:text-white">{f.title}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-x py-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
        <div className="col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 text-white grid place-items-center font-extrabold font-display text-sm">MM</div>
            <div>
              <p className="font-display font-extrabold text-lg text-ink-900 dark:text-white leading-none">MMMobiles</p>
              <p className="text-[10px] text-ink-500 leading-none">AI Mobile Store</p>
            </div>
          </div>
          <p className="text-sm text-ink-600 dark:text-ink-300 mb-4">Premium mobile shopping experience powered by AI. Serving Choutuppal and beyond.</p>
          <div className="flex gap-2">
            <a href="https://maps.app.goo.gl/MRg2vJMNbMJmWoBq8" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-ink-100 dark:bg-ink-800 grid place-items-center text-ink-600 dark:text-ink-300 hover:bg-brand-600 hover:text-white transition" title="Google Maps">
              <MapPin className="w-4 h-4" />
            </a>
            <a href="tel:+919000000000" className="w-9 h-9 rounded-lg bg-ink-100 dark:bg-ink-800 grid place-items-center text-ink-600 dark:text-ink-300 hover:bg-success-600 hover:text-white transition" title="Call">
              <Phone className="w-4 h-4" />
            </a>
            <a href="https://wa.me/919000000000" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-ink-100 dark:bg-ink-800 grid place-items-center text-ink-600 dark:text-ink-300 hover:bg-success-600 hover:text-white transition" title="WhatsApp">
              <MessageCircle className="w-4 h-4" />
            </a>
            <a href="mailto:hello@mmmobiles.in" className="w-9 h-9 rounded-lg bg-ink-100 dark:bg-ink-800 grid place-items-center text-ink-600 dark:text-ink-300 hover:bg-brand-600 hover:text-white transition" title="Email">
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>

        <FooterCol title="Shop" links={[
          ['All Products','/products'],['Smartphones','/products'],['New Arrivals','/new-arrivals'],['Offers','/offers'],['Brands','/brands'],['Compare','/compare'],
        ]} />
        <FooterCol title="Company" links={[
          ['About Us','/about'],['Contact','/contact'],['FAQ','/faq'],['Warranty','/warranty'],['Privacy Policy','/privacy'],['Terms & Conditions','/terms'],
        ]} />
        <FooterCol title="Account" links={[
          ['My Dashboard','/account'],['Orders','/account/orders'],['Wishlist','/account/wishlist'],['Cart','/cart'],['Login','/login'],
        ]} />
        <FooterCol title="Portals" links={[
          ['Seller Dashboard','/seller'],['Delivery Partner','/delivery'],['Admin Panel','/admin'],['AI Assistant','/ai-recommend'],
        ]} />
      </div>

      <div className="border-t border-ink-200 dark:border-ink-800">
        <div className="container-x py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-ink-500 dark:text-ink-400">© {new Date().getFullYear()} MMMobiles. All rights reserved. Lakkaram, Choutuppal, Telangana 508252.</p>
          <div className="flex items-center gap-3 text-xs text-ink-500 dark:text-ink-400">
            <span>Secured by Razorpay</span><span>·</span><span>Powered by AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="font-semibold text-sm text-ink-900 dark:text-white mb-3">{title}</h4>
      <ul className="space-y-2">
        {links.map(([l, p]) => (
          <li key={l}><Link to={p} className="text-sm text-ink-600 dark:text-ink-300 hover:text-brand-600 dark:hover:text-brand-400 transition">{l}</Link></li>
        ))}
      </ul>
    </div>
  );
}
