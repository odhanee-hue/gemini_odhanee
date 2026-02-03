import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- Types & Interfaces ---
interface Product {
  id: string;
  name: string;
  category: 'Sarees' | 'Lehengas' | 'Suits' | 'Kurtis';
  price: number;
  description: string;
  image: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  isAdmin?: boolean;
  joinedAt: string;
}

interface SiteSettings {
  promoBanner: string;
  marqueeText: string;
  announcementActive: boolean;
}

// --- Constants ---
const CATEGORIES: Product['category'][] = ['Sarees', 'Lehengas', 'Suits', 'Kurtis'];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Royal Banarasi Silk Saree',
    category: 'Sarees',
    price: 12500,
    description: 'A classic red Banarasi silk saree with intricate zari work, perfect for bridal wear.',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '2',
    name: 'Midnight Velvet Lehenga',
    category: 'Lehengas',
    price: 24000,
    description: 'Deep navy velvet lehenga with silver sequins and hand-embroidered floral motifs.',
    image: 'https://images.unsplash.com/photo-1599032909756-5dee8c65843b?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '3',
    name: 'Pastel Anarkali Suit',
    category: 'Suits',
    price: 8500,
    description: 'Flowy pastel pink Anarkali suit set with heavy gota patti work on the borders.',
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '4',
    name: 'Designer Chanderi Kurti',
    category: 'Kurtis',
    price: 3200,
    description: 'Elegant beige Chanderi kurti with subtle thread work and side slits.',
    image: 'https://images.unsplash.com/photo-1627484394640-62287332d783?auto=format&fit=crop&q=80&w=800'
  }
];

const INITIAL_USERS: User[] = [
  { id: 'admin-1', email: 'admin@odhanee.com', name: 'Odhanee Admin', isAdmin: true, joinedAt: '2023-01-01' },
  { id: 'user-1', email: 'customer@odhanee.com', name: 'Priya Verma', isAdmin: false, joinedAt: '2024-02-15' }
];

const INITIAL_SETTINGS: SiteSettings = {
  promoBanner: "FREE SHIPPING ON ORDERS OVER ₹50,000",
  marqueeText: "NEW SUMMER COLLECTION NOW LIVE • HANDCRAFTED WITH LOVE • WORLDWIDE DELIVERY",
  announcementActive: true
};

const ADDRESS_LINK = "https://share.google/b5fcGymUPx8lddgZw";

// --- Utilities ---
const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
};

// --- Icons ---
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
);
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
);
const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
);
const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);
const WhatsAppIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-10.6 8.38 8.38 0 0 1 3.8.9L21 3.5Z"/></svg>
);
const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
);

// --- Components ---

const Navbar = ({ 
  cartCount, 
  user,
  onNavigate, 
  onSearchOpen, 
  onCartOpen, 
  onLoginOpen,
  onMenuOpen 
}: { 
  cartCount: number; 
  user: User | null;
  onNavigate: (page: string) => void; 
  onSearchOpen: () => void; 
  onCartOpen: () => void;
  onLoginOpen: () => void;
  onMenuOpen: () => void;
}) => (
  <div className="fixed top-6 inset-x-0 z-[50] flex justify-center px-6 pointer-events-none">
    <nav className="bg-white/90 backdrop-blur-xl border border-gray-100 rounded-full px-8 py-4 flex items-center justify-between shadow-2xl max-w-7xl w-full pointer-events-auto">
      <div className="flex items-center space-x-4 lg:space-x-12">
        <button onClick={onMenuOpen} className="lg:hidden p-1 hover:text-[#D4AF37] transition-colors">
          <MenuIcon />
        </button>
        <h1 
          className="text-2xl font-bold tracking-tighter serif cursor-pointer hover:text-[#D4AF37] transition-colors"
          onClick={() => onNavigate('home')}
        >
          ODHANEE
        </h1>
        <div className="hidden lg:flex space-x-8 text-[10px] font-bold tracking-[0.2em] uppercase">
          <button onClick={() => onNavigate('shop')} className="hover:text-[#D4AF37] transition-colors">Shop All</button>
          <button onClick={() => onNavigate('shop')} className="hover:text-[#D4AF37] transition-colors">Collection</button>
          <button onClick={() => onNavigate('contact')} className="hover:text-[#D4AF37] transition-colors">Contact</button>
          {user?.isAdmin && (
            <button onClick={() => onNavigate('admin')} className="text-red-600 hover:text-black transition-colors border-b border-red-200">Admin</button>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-1 md:space-x-4">
        <button onClick={onSearchOpen} className="p-2 hover:text-[#D4AF37] transition-colors group relative">
          <SearchIcon />
          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white px-2 py-1 rounded pointer-events-none">Search</span>
        </button>
        <button onClick={user ? () => onNavigate('profile') : onLoginOpen} className="p-2 hover:text-[#D4AF37] transition-colors flex items-center space-x-2">
          <UserIcon />
          <span className="hidden md:inline text-[10px] uppercase tracking-widest font-bold">
            {user ? user.name.split(' ')[0] : 'Log In'}
          </span>
        </button>
        <button onClick={onCartOpen} className="relative p-2 hover:text-[#D4AF37] transition-colors">
          <CartIcon />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-bold border-2 border-white shadow-sm">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  </div>
);

const AnnouncementBar = ({ settings }: { settings: SiteSettings }) => {
  if (!settings.announcementActive) return null;
  return (
    <div className="bg-[#1A1A1A] text-white py-2 overflow-hidden flex whitespace-nowrap">
      <div className="animate-marquee inline-block px-4 text-[9px] font-bold tracking-[0.3em] uppercase">
        {settings.marqueeText} • {settings.marqueeText} • {settings.marqueeText}
      </div>
    </div>
  );
};

const MobileMenu = ({ 
  isOpen, 
  onClose, 
  onNavigate, 
  user, 
  settings 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onNavigate: (p: string) => void; 
  user: User | null;
  settings: SiteSettings;
}) => {
  const [showCategories, setShowCategories] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-[320px] h-full p-8 flex flex-col fade-in shadow-2xl overflow-y-auto">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-xl serif font-bold">ODHANEE</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><CloseIcon /></button>
        </div>

        <div className="flex flex-col space-y-2 text-[11px] font-bold uppercase tracking-[0.2em]">
          <button onClick={() => { onNavigate('home'); onClose(); }} className="text-left py-4 border-b border-gray-50 flex items-center justify-between group">
            <span className="group-hover:text-[#D4AF37] transition-colors">Home</span>
            <span className="text-gray-200">→</span>
          </button>
          
          <div className="border-b border-gray-50">
            <button 
              onClick={() => setShowCategories(!showCategories)} 
              className="w-full text-left py-4 flex items-center justify-between group"
            >
              <span className={showCategories ? "text-[#D4AF37]" : "group-hover:text-[#D4AF37] transition-colors"}>Categories</span>
              <span className={`transition-transform duration-300 ${showCategories ? 'rotate-180' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </span>
            </button>
            
            {showCategories && (
              <div className="pl-4 pb-4 flex flex-col space-y-4 fade-in">
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => { onNavigate('shop'); onClose(); }} 
                    className="text-left text-[10px] text-gray-400 hover:text-black transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => { onNavigate('shop'); onClose(); }} className="text-left py-4 border-b border-gray-50 flex items-center justify-between group">
            <span className="group-hover:text-[#D4AF37] transition-colors">Shop All</span>
            <span className="text-gray-200">→</span>
          </button>
          
          <button onClick={() => { onNavigate('contact'); onClose(); }} className="text-left py-4 border-b border-gray-50 flex items-center justify-between group">
            <span className="group-hover:text-[#D4AF37] transition-colors">Contact Us</span>
            <span className="text-gray-200">→</span>
          </button>
          
          <button onClick={() => { onNavigate('profile'); onClose(); }} className="text-left py-4 border-b border-gray-50 flex items-center justify-between group">
            <span className="group-hover:text-[#D4AF37] transition-colors">Account</span>
            <span className="text-gray-200">→</span>
          </button>
          
          {user?.isAdmin && (
            <button onClick={() => { onNavigate('admin'); onClose(); }} className="text-left py-4 border-b border-red-50 text-red-700 flex items-center justify-between group">
              <span className="group-hover:text-black transition-colors">Admin Panel</span>
              <span className="text-red-200">→</span>
            </button>
          )}
        </div>

        {/* Promotions Section */}
        <div className="mt-12 bg-[#FAF9F6] p-6 rounded-2xl border border-[#D4AF37]/20">
          <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#D4AF37] mb-3">Seasonal Offers</h4>
          <p className="text-[10px] leading-relaxed font-medium text-gray-600">
            {settings.promoBanner}
          </p>
          <button 
            onClick={() => { onNavigate('shop'); onClose(); }}
            className="mt-4 text-[8px] font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all"
          >
            Claim Offer
          </button>
        </div>

        <div className="mt-auto pt-8">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-4">Heritage Store</p>
          <div className="flex space-x-4">
            <a href="#" className="p-2 bg-gray-50 rounded-full hover:text-[#D4AF37] transition-colors"><InstagramIcon size={16} /></a>
            <a href="#" className="p-2 bg-gray-50 rounded-full hover:text-[#D4AF37] transition-colors"><FacebookIcon size={16} /></a>
            <a href="#" className="p-2 bg-gray-50 rounded-full hover:text-[#D4AF37] transition-colors"><WhatsAppIcon size={16} /></a>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="pt-48 px-6 max-w-7xl mx-auto mb-24 fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
        <div>
          <h2 className="text-6xl serif mb-6">Connect With Us</h2>
          <p className="text-gray-500 text-lg font-light leading-relaxed mb-12">
            Whether you seek a bespoke ensemble for your special day or have inquiries about our heritage weaves, our curators are here to assist you.
          </p>
          
          <div className="space-y-10">
            <div>
              <h4 className="text-[10px] uppercase font-bold tracking-[0.4em] text-[#D4AF37] mb-4">Our Boutique</h4>
              <a 
                href={ADDRESS_LINK} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xl serif hover:text-[#D4AF37] transition-colors block"
              >
                Visit us at our flagship location <br/>
                <span className="text-sm font-light text-gray-400 mt-2 block underline">View on Google Maps</span>
              </a>
            </div>
            <div>
              <h4 className="text-[10px] uppercase font-bold tracking-[0.4em] text-[#D4AF37] mb-4">Inquiries</h4>
              <p className="text-xl serif">concierge@odhanee.com</p>
              <p className="text-lg font-light text-gray-400 mt-1">+91 98765 43210</p>
            </div>
            <div>
              <h4 className="text-[10px] uppercase font-bold tracking-[0.4em] text-[#D4AF37] mb-4">Social Presence</h4>
              <div className="flex space-x-6">
                <a href="#" className="p-3 bg-gray-50 rounded-full hover:bg-[#D4AF37] hover:text-white transition-all"><InstagramIcon size={24} /></a>
                <a href="#" className="p-3 bg-gray-50 rounded-full hover:bg-[#D4AF37] hover:text-white transition-all"><FacebookIcon size={24} /></a>
                <a href="#" className="p-3 bg-gray-50 rounded-full hover:bg-[#D4AF37] hover:text-white transition-all"><WhatsAppIcon size={24} /></a>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-xl relative overflow-hidden">
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 fade-in">
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 className="text-3xl serif">Message Received</h3>
              <p className="text-gray-400 font-light">Thank you for reaching out. Our concierge will contact you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
                <input required type="text" className="w-full border-b border-gray-100 py-4 focus:outline-none focus:border-[#D4AF37] text-sm font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                <input required type="email" className="w-full border-b border-gray-100 py-4 focus:outline-none focus:border-[#D4AF37] text-sm font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 ml-1">The Message</label>
                <textarea required rows={4} className="w-full border-b border-gray-100 py-4 focus:outline-none focus:border-[#D4AF37] text-sm font-medium resize-none" />
              </div>
              <button type="submit" className="w-full bg-black text-white py-6 rounded-full text-[11px] font-bold uppercase tracking-[0.4em] hover:bg-[#D4AF37] transition-all shadow-xl active:scale-95 transform mt-6">
                Deliver Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, onAddToCart }: { product: Product; onAddToCart: (p: Product) => void }) => {
  const shareProduct = (platform: 'fb' | 'wa' | 'in') => {
    const url = window.location.href;
    const text = `Check out this beautiful ${product.name} from Odhanee!`;
    
    if (platform === 'fb') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'wa') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else if (platform === 'in') {
      // Instagram doesn't have a direct share URL for web, so we copy link
      navigator.clipboard.writeText(url);
      alert('Link copied for sharing on Instagram!');
    }
  };

  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-[3/4] mb-6 overflow-hidden rounded-[2rem] bg-gray-50 shadow-sm border border-gray-50">
        <img src={product.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        
        {/* Share Buttons Overlay */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 transition-transform">
          <button onClick={() => shareProduct('wa')} className="bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-green-500 hover:text-white transition-all text-gray-600 shadow-sm" title="Share on WhatsApp">
            <WhatsAppIcon size={16} />
          </button>
          <button onClick={() => shareProduct('fb')} className="bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-blue-600 hover:text-white transition-all text-gray-600 shadow-sm" title="Share on Facebook">
            <FacebookIcon size={16} />
          </button>
          <button onClick={() => shareProduct('in')} className="bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-pink-600 hover:text-white transition-all text-gray-600 shadow-sm" title="Copy for Instagram">
            <InstagramIcon size={16} />
          </button>
        </div>

        <button onClick={() => onAddToCart(product)} className="absolute inset-x-6 bottom-6 bg-white/95 backdrop-blur-md py-4 text-[10px] font-bold uppercase tracking-widest opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:bg-[#D4AF37] hover:text-white">Quick Add</button>
      </div>
      <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold mb-1">{product.category}</p>
      <h3 className="serif text-xl group-hover:text-[#D4AF37] transition-colors">{product.name}</h3>
      <p className="text-sm font-medium text-gray-900 mt-2">₹{product.price.toLocaleString()}</p>
    </div>
  );
};

const AdminDashboard = ({ 
  products, 
  users, 
  settings, 
  onUpdateProducts, 
  onUpdateUsers, 
  onUpdateSettings 
}: { 
  products: Product[]; 
  users: User[]; 
  settings: SiteSettings;
  onUpdateProducts: (p: Product[]) => void; 
  onUpdateUsers: (u: User[]) => void;
  onUpdateSettings: (s: SiteSettings) => void;
}) => {
  const [activeTab, setActiveTab] = useState<'Inventory' | 'Users' | 'Settings'>('Inventory');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Product>({ id: '', name: '', category: 'Sarees', price: 0, description: '', image: '' });

  const handleAddNewProduct = () => {
    setFormData({ id: Date.now().toString(), name: '', category: 'Sarees', price: 0, description: '', image: '' });
    setIsModalOpen(true);
  };

  const handleEditProduct = (p: Product) => {
    setFormData(p);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Delete this product?')) onUpdateProducts(products.filter(p => p.id !== id));
  };

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const exists = products.find(p => p.id === formData.id);
    if (exists) onUpdateProducts(products.map(p => p.id === formData.id ? formData : p));
    else onUpdateProducts([...products, formData]);
    setIsModalOpen(false);
  };

  const toggleAdmin = (email: string) => {
    onUpdateUsers(users.map(u => u.email === email ? { ...u, isAdmin: !u.isAdmin } : u));
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-32 fade-in">
      <div className="mb-12">
        <h2 className="text-5xl serif mb-4">Command Center</h2>
        <div className="flex space-x-8 border-b border-gray-100 text-[10px] uppercase font-bold tracking-widest text-gray-400">
          {(['Inventory', 'Users', 'Settings'] as const).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 transition-all border-b-2 ${activeTab === tab ? 'border-[#D4AF37] text-black' : 'border-transparent hover:text-gray-900'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Inventory' && (
        <div className="space-y-8 fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-xl serif">Product Catalog</h3>
            <button onClick={handleAddNewProduct} className="bg-black text-white px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-[#D4AF37] transition-all flex items-center space-x-2">
              <PlusIcon /> <span>New Piece</span>
            </button>
          </div>
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[9px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Cat</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 flex items-center space-x-3">
                      <img src={p.image} className="w-10 h-14 object-cover rounded shadow-sm" />
                      <span className="font-semibold text-sm">{p.name}</span>
                    </td>
                    <td className="px-6 py-4 text-[10px] uppercase font-bold text-gray-500">{p.category}</td>
                    <td className="px-6 py-4 font-medium">₹{p.price.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => handleEditProduct(p)} className="p-2 hover:bg-white rounded-full"><EditIcon /></button>
                        <button onClick={() => handleDeleteProduct(p.id)} className="p-2 hover:bg-white text-red-500 rounded-full"><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Users' && (
        <div className="space-y-8 fade-in">
          <h3 className="text-xl serif">User Accounts</h3>
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[9px] uppercase tracking-[0.2em] font-bold text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.email} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-sm">{u.name}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase ${u.isAdmin ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {u.isAdmin ? 'Administrator' : 'Customer'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => toggleAdmin(u.email)} 
                        className="text-[10px] font-bold uppercase text-[#D4AF37] hover:underline"
                      >
                        {u.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Settings' && (
        <div className="max-w-2xl space-y-8 fade-in">
          <h3 className="text-xl serif">Global Configuration</h3>
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-2">Marquee Message</label>
              <textarea 
                value={settings.marqueeText}
                onChange={e => onUpdateSettings({...settings, marqueeText: e.target.value})}
                className="w-full border border-gray-100 rounded-xl p-4 focus:outline-none focus:border-[#D4AF37] text-sm"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Enable Announcement Bar</span>
              <button 
                onClick={() => onUpdateSettings({...settings, announcementActive: !settings.announcementActive})}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.announcementActive ? 'bg-green-500' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.announcementActive ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
            <button onClick={() => alert('Settings Saved (LocalStorage)')} className="w-full bg-black text-white py-3 rounded-full text-[10px] uppercase font-bold tracking-widest hover:bg-[#D4AF37] transition-all">Save Global Settings</button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl max-w-xl w-full p-10 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl serif">Piece Curation</h3>
              <button onClick={() => setIsModalOpen(false)}><CloseIcon /></button>
            </div>
            <form onSubmit={handleSubmitProduct} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Product Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-b border-gray-100 py-2 focus:outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full border-b border-gray-100 py-2 focus:outline-none focus:border-[#D4AF37] bg-transparent">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Price (₹)</label>
                  <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full border-b border-gray-100 py-2 focus:outline-none focus:border-[#D4AF37]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">High-Res Image URL</label>
                  <input required type="url" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full border-b border-gray-100 py-2 focus:outline-none focus:border-[#D4AF37]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">The Story</label>
                  <textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border-b border-gray-100 py-2 focus:outline-none focus:border-[#D4AF37]" />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#D4AF37] text-white py-4 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-black transition-all mt-4">Publish Addition</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Hero = ({ onShop }: { onShop: () => void }) => (
  <div className="relative h-screen flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 z-0 pointer-events-none">
      <div className="video-wrapper">
        <iframe
          className="w-full h-full opacity-60 grayscale-[0.2]"
          src="https://www.youtube.com/embed/iVPaPCrqm_g?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&autohide=1&modestbranding=1&playlist=iVPaPCrqm_g&rel=0&iv_load_policy=3&enablejsapi=1"
          frameBorder="0"
          allow="autoplay; encrypted-media"
        ></iframe>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
    </div>
    
    <div className="relative z-10 text-center px-6 fade-in">
      <h3 className="text-[10px] font-bold tracking-[0.5em] uppercase text-white/70 mb-8">Pure Handloom Elegance</h3>
      <h2 className="text-6xl md:text-9xl serif text-white mb-12 leading-none">Timeless <br/> Heritage</h2>
      <button 
        onClick={onShop} 
        className="bg-white text-black px-12 py-5 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-[#D4AF37] hover:text-white transition-all shadow-2xl active:scale-95 transform"
      >
        Explore Shop
      </button>
    </div>
  </div>
);

// --- App Root ---

function App() {
  const [products, setProducts] = useLocalStorage<Product[]>('odhanee_products', INITIAL_PRODUCTS);
  const [cart, setCart] = useLocalStorage<CartItem[]>('odhanee_cart', []);
  const [user, setUser] = useLocalStorage<User | null>('odhanee_session', null);
  const [users, setUsers] = useLocalStorage<User[]>('odhanee_users', INITIAL_USERS);
  const [settings, setSettings] = useLocalStorage<SiteSettings>('odhanee_settings', INITIAL_SETTINGS);
  
  const [currentPage, setCurrentPage] = useState('home');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleLogin = (u: User) => {
    const existing = users.find(existingUser => existingUser.email === u.email);
    if (!existing) setUsers([...users, u]);
    setUser(u);
    setIsLoginOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('home');
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  const updateCartQty = (id: string, q: number) => setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: q } : item));

  useEffect(() => window.scrollTo(0, 0), [currentPage]);

  return (
    <div className="min-h-screen flex flex-col selection:bg-[#D4AF37] selection:text-white">
      <AnnouncementBar settings={settings} />
      
      <Navbar 
        cartCount={cartCount} 
        user={user}
        onNavigate={setCurrentPage} 
        onSearchOpen={() => setIsSearchOpen(true)}
        onCartOpen={() => setIsCartOpen(true)}
        onLoginOpen={() => setIsLoginOpen(true)}
        onMenuOpen={() => setIsMenuOpen(true)}
      />

      <MobileMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onNavigate={setCurrentPage}
        user={user}
        settings={settings}
      />

      <main className="flex-1 min-h-[60vh]">
        {currentPage === 'home' && (
          <div className="fade-in">
            <Hero onShop={() => setCurrentPage('shop')} />
            
            <section className="bg-white py-32 px-6">
              <div className="max-w-4xl mx-auto text-center">
                <h3 className="text-[10px] font-bold tracking-[0.4em] uppercase text-[#D4AF37] mb-8">The Craft</h3>
                <h2 className="text-4xl md:text-6xl serif mb-10 leading-tight">Authentic weaves, passed down through generations.</h2>
                <p className="text-lg text-gray-500 font-light leading-relaxed max-w-2xl mx-auto">
                  Every thread in an Odhanee saree is curated with precision, ensuring the integrity of traditional Indian textiles meets the sophistication of modern aesthetics.
                </p>
              </div>
            </section>

            <section className="bg-gray-50 py-24 px-6 overflow-hidden">
               <div className="max-w-7xl mx-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
                    <div className="relative group">
                      <div className="aspect-[4/5] overflow-hidden rounded-3xl shadow-2xl">
                        <img src="https://images.unsplash.com/photo-1595967734995-5809d4cd71d3?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-105" />
                      </div>
                      <div className="absolute -bottom-10 -right-10 bg-white p-10 rounded-2xl shadow-xl max-w-xs">
                         <h4 className="serif text-2xl mb-2">Sustainable Zari</h4>
                         <p className="text-[10px] text-gray-400 tracking-wider font-bold uppercase">Recycled Silver & Ethical Silk</p>
                      </div>
                    </div>
                    <div className="space-y-8">
                       <h2 className="text-5xl md:text-6xl serif leading-tight">Beyond the <br/>Ordinary Fabric</h2>
                       <p className="text-gray-500 text-lg font-light leading-relaxed">Every Odhanee creation undergoes a 24-step quality assurance process, from the initial cocoon sorting to the final tassel threading. We don't just sell clothes; we curate heirlooms.</p>
                       <button onClick={() => setCurrentPage('shop')} className="text-[#D4AF37] font-bold text-[10px] uppercase tracking-[0.3em] border-b-2 border-[#D4AF37] pb-2 hover:text-black hover:border-black transition-all">Explore the Process</button>
                    </div>
                 </div>
               </div>
            </section>
          </div>
        )}

        {currentPage === 'shop' && (
          <div className="pt-48 px-6 max-w-7xl mx-auto mb-24 fade-in">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div>
                <h2 className="text-6xl serif mb-4">Summer Edit</h2>
                <p className="text-gray-400 font-light max-w-sm">Lightweight textures meet regal craftsmanship in our latest curation.</p>
              </div>
              <div className="flex flex-wrap gap-8 text-[10px] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-2">
                {['All', ...CATEGORIES].map(c => (
                  <button key={c} className="hover:text-black transition-colors">{c}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
              {products.map(p => (
                <ProductCard key={p.id} product={p} onAddToCart={addToCart} />
              ))}
            </div>
          </div>
        )}

        {currentPage === 'contact' && <ContactPage />}

        {currentPage === 'admin' && user?.isAdmin && (
          <AdminDashboard 
            products={products} 
            users={users} 
            settings={settings}
            onUpdateProducts={setProducts} 
            onUpdateUsers={setUsers}
            onUpdateSettings={setSettings}
          />
        )}

        {currentPage === 'profile' && user && (
          <div className="pt-48 px-6 max-w-4xl mx-auto mb-24 fade-in">
            <div className="bg-white p-12 md:p-16 rounded-[3rem] border border-gray-100 shadow-sm text-center md:text-left md:flex items-center space-x-16">
               <div className="w-40 h-40 rounded-full bg-gray-50 flex items-center justify-center text-5xl serif mx-auto md:mx-0 shadow-inner">
                  {user.name.charAt(0)}
               </div>
               <div className="flex-1 mt-10 md:mt-0">
                  <h2 className="text-5xl serif mb-3">{user.name}</h2>
                  <p className="text-gray-400 text-sm font-medium mb-8 tracking-wide">{user.email}</p>
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                     <div className="bg-gray-50 px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-500">Member Since: {user.joinedAt}</div>
                     <div className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest ${user.isAdmin ? 'bg-red-50 text-red-600' : 'bg-gold/10 text-[#D4AF37]'}`}>
                       {user.isAdmin ? 'Curator' : 'Privileged Member'}
                     </div>
                  </div>
               </div>
               <button onClick={handleLogout} className="mt-10 md:mt-0 px-10 py-4 rounded-full border border-red-100 text-red-500 text-[11px] font-bold uppercase tracking-widest hover:bg-red-50 transition-all">Sign Out</button>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-[#1A1A1A] text-white/80 py-32 px-6 mt-32">
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-20 border-b border-white/5 pb-24">
           <div className="col-span-1 md:col-span-2 space-y-10">
              <h2 className="text-4xl serif text-white tracking-tighter">ODHANEE</h2>
              <p className="text-lg font-light leading-relaxed max-w-md opacity-60">Honoring the heritage of the loom through meticulously curated ethnic wear for the discerning modern woman.</p>
              
              <div className="space-y-4 pt-4">
                <h4 className="text-[11px] uppercase font-bold tracking-[0.4em] text-[#D4AF37]">Visit Our Boutique</h4>
                <a 
                  href={ADDRESS_LINK} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#D4AF37] transition-colors block text-sm"
                >
                  Odhanee Luxury Ethnic, Flagship Hub <br/>
                  Curated Heritage Street, New Delhi <br/>
                  <span className="text-[#D4AF37] underline block mt-2">Get Directions →</span>
                </a>
              </div>
           </div>
           <div className="space-y-8">
              <h4 className="text-[11px] uppercase font-bold tracking-[0.4em] text-[#D4AF37]">The Maison</h4>
              <ul className="space-y-5 text-sm font-medium">
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => setCurrentPage('shop')}>Collection</li>
                <li className="hover:text-white cursor-pointer transition-colors" onClick={() => setCurrentPage('contact')}>Contact Us</li>
                <li className="hover:text-white cursor-pointer transition-colors">Our Heritage</li>
              </ul>
              
              <div className="pt-8">
                <h4 className="text-[11px] uppercase font-bold tracking-[0.4em] text-[#D4AF37] mb-6">Socials</h4>
                <div className="flex space-x-6">
                  <a href="#" className="opacity-40 hover:opacity-100 hover:text-[#D4AF37] transition-all"><InstagramIcon size={20} /></a>
                  <a href="#" className="opacity-40 hover:opacity-100 hover:text-[#D4AF37] transition-all"><FacebookIcon size={20} /></a>
                  <a href="#" className="opacity-40 hover:opacity-100 hover:text-[#D4AF37] transition-all"><WhatsAppIcon size={20} /></a>
                </div>
              </div>
           </div>
           <div className="space-y-8">
              <h4 className="text-[11px] uppercase font-bold tracking-[0.4em] text-[#D4AF37]">Services</h4>
              <ul className="space-y-5 text-sm font-medium">
                <li className="hover:text-white cursor-pointer transition-colors">Global Delivery</li>
                <li className="hover:text-white cursor-pointer transition-colors">Bespoke Concierge</li>
                <li className="hover:text-white cursor-pointer transition-colors">Sustainability</li>
              </ul>
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                <p className="text-[10px] uppercase tracking-widest font-bold text-white/40">Concierge Desk</p>
                <p className="text-sm">+91 98765 43210</p>
              </div>
           </div>
         </div>
         <div className="max-w-7xl mx-auto pt-12 flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-[0.3em] text-white/20">
            <p>© 2024 Odhanee Luxury Ethnic. Curating memories with every thread.</p>
            <div className="flex space-x-12 mt-6 md:mt-0">
               <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
               <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
            </div>
         </div>
      </footer>

      {/* Overlays */}
      
      {isSearchOpen && (
        <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-2xl flex flex-col p-12 md:p-24 overflow-y-auto">
          <div className="max-w-5xl mx-auto w-full">
            <div className="flex justify-between items-center mb-20">
              <h2 className="text-4xl text-white serif">Curated Search</h2>
              <button onClick={() => setIsSearchOpen(false)} className="p-4 text-white/40 hover:text-white transition-colors"><CloseIcon /></button>
            </div>
            <div className="mb-20">
               <input autoFocus placeholder="Find your perfect drape..." className="w-full bg-transparent border-b-2 border-white/10 py-8 text-4xl md:text-7xl text-white font-light focus:outline-none focus:border-[#D4AF37] placeholder:text-white/5 transition-all" />
               <p className="mt-8 text-[11px] uppercase tracking-[0.4em] text-white/30 font-bold">Try 'Golden Banarasi for an evening gala'</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
               {products.slice(0, 3).map(p => (
                 <div key={p.id} className="fade-in group cursor-pointer" onClick={() => { addToCart(p); setIsSearchOpen(false); }}>
                    <div className="aspect-[3/4] overflow-hidden rounded-2xl mb-6 bg-white/5">
                      <img src={p.image} className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-all duration-700" />
                    </div>
                    <h4 className="text-white text-xl serif mb-1">{p.name}</h4>
                    <p className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">₹{p.price.toLocaleString()}</p>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {isLoginOpen && (
        <div className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] max-w-md w-full p-16 shadow-2xl relative fade-in overflow-hidden border border-gray-100">
            <button onClick={() => setIsLoginOpen(false)} className="absolute top-10 right-10 text-gray-300 hover:text-black transition-colors"><CloseIcon /></button>
            <div className="text-center mb-12">
               <h3 className="text-4xl serif mb-4">The Maison Circle</h3>
               <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400">Join our assembly of patrons</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleLogin({ id: 'u-'+Date.now(), email: 'guest@odhanee.com', name: 'Welcome Guest', joinedAt: new Date().toISOString().split('T')[0] }); }} className="space-y-8">
               <div className="space-y-2">
                 <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 ml-1">Member Email</label>
                 <input required type="email" placeholder="email@example.com" className="w-full border-b border-gray-100 py-4 focus:outline-none focus:border-[#D4AF37] text-sm font-medium" />
               </div>
               <div className="space-y-2">
                 <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 ml-1">Secure Pin</label>
                 <input required type="password" placeholder="••••••••" className="w-full border-b border-gray-100 py-4 focus:outline-none focus:border-[#D4AF37] text-sm" />
               </div>
               <button className="w-full bg-black text-white py-6 rounded-full text-[11px] font-bold uppercase tracking-[0.4em] hover:bg-[#D4AF37] transition-all shadow-xl active:scale-95 transform mt-10">Continue to Maison</button>
            </form>
            <p className="text-center mt-12 text-[9px] uppercase tracking-widest text-gray-300 font-bold">Inquiries? <span className="text-[#D4AF37] cursor-pointer hover:border-b border-[#D4AF37]">Create Membership</span></p>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-[170] flex justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg h-full shadow-2xl flex flex-col fade-in">
             <div className="p-12 border-b border-gray-50 flex justify-between items-center">
                <h2 className="text-3xl serif">The Wardrobe</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><CloseIcon /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-12 space-y-12">
                {cart.length === 0 ? (
                  <div className="text-center py-20 space-y-8">
                    <p className="text-gray-300 italic serif text-xl">Your collection is empty...</p>
                    <button onClick={() => { setIsCartOpen(false); setCurrentPage('shop'); }} className="bg-black text-white px-10 py-4 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-[#D4AF37] transition-all shadow-lg">Explore Shop</button>
                  </div>
                ) : cart.map(item => (
                  <div key={item.id} className="flex space-x-8">
                     <img src={item.image} className="w-28 h-40 object-cover rounded-2xl shadow-sm border border-gray-50" />
                     <div className="flex-1 flex flex-col justify-between py-2">
                        <div>
                           <div className="flex justify-between items-start">
                             <h4 className="text-xl serif text-gray-900">{item.name}</h4>
                             <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors"><TrashIcon /></button>
                           </div>
                           <p className="text-xs uppercase tracking-widest font-bold text-[#D4AF37] mt-2">₹{item.price.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center space-x-6">
                           <div className="flex items-center border border-gray-100 rounded-full px-4 py-2 bg-gray-50 text-xs font-bold">
                              <button onClick={() => updateCartQty(item.id, Math.max(1, item.quantity - 1))} className="px-3 hover:text-[#D4AF37] transition-colors">-</button>
                              <span className="px-4 border-x border-gray-200">{item.quantity}</span>
                              <button onClick={() => updateCartQty(item.id, item.quantity + 1)} className="px-3 hover:text-[#D4AF37] transition-colors">+</button>
                           </div>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
             {cart.length > 0 && (
               <div className="p-12 border-t border-gray-50 bg-gray-50/50 space-y-8">
                  <div className="flex justify-between items-end">
                     <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-gray-400">Estimated Total</span>
                     <span className="text-3xl serif font-bold">₹{cart.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}</span>
                  </div>
                  <button className="w-full bg-black text-white py-6 rounded-full text-[12px] font-bold uppercase tracking-[0.4em] hover:bg-[#D4AF37] transition-all shadow-2xl active:scale-95 transform">Confirm Selection</button>
                  <p className="text-center text-[9px] uppercase tracking-widest text-gray-400">Insured express delivery included</p>
               </div>
             )}
          </div>
        </div>
      )}

    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);