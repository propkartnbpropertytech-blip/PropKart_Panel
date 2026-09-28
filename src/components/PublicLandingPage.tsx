import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ListingProperty, ListingType } from '../types/panel';
import {
  Building2,
  Search,
  MapPin,
  Sparkles,
  Calendar,
  ShieldCheck,
  MessageCircle,
  ExternalLink,
  X,
  Home,
  Briefcase,
  Factory,
  Trees,
  Layers,
  Check,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Compass,
  PlusCircle,
  Video as VideoIcon,
  Camera,
  ChevronDown,
  Phone,
  Mail,
} from 'lucide-react';
import heroBgImage from '../assets/hero-bg.jpg';

interface PublicLandingPageProps {
  properties: ListingProperty[];
  onClose?: () => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({
  properties,
  onClose,
}) => {
  // View mode: 'landing' (Above-fold search, 3 cards on scroll down) vs 'category' (Separate page)
  const [currentView, setCurrentView] = useState<'landing' | 'category'>('landing');
  const [selectedSection, setSelectedSection] = useState<ListingType | 'all'>('Pre-sales');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [universalSearchQuery, setUniversalSearchQuery] = useState<string>('');
  const [universalType, setUniversalType] = useState<ListingType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBhk, setSelectedBhk] = useState<string>('all');

  const [selectedProperty, setSelectedProperty] = useState<ListingProperty | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Make cursor blink by default on page load
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const scrollShadowOpacity = Math.min(1, Math.max(0, scrollY / 250));

  // Filter properties: STRICTLY published only
  const publishedProperties = useMemo(() => {
    return properties.filter((p) => p.is_published === true);
  }, [properties]);

  // Filtered properties based on active transaction section, category, BHK, and search query
  const filteredProperties = useMemo(() => {
    return publishedProperties.filter((p) => {
      // Must match section
      if (selectedSection !== 'all' && p.listing_type !== selectedSection) return false;

      // Category filter
      if (selectedCategory !== 'all' && p.property_category !== selectedCategory) {
        return false;
      }

      // BHK filter
      if (selectedBhk !== 'all' && p.bhk && !p.bhk.includes(selectedBhk)) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesLocality = (p.locality || '').toLowerCase().includes(q);
        const matchesCity = (p.city || '').toLowerCase().includes(q);
        const matchesDeveloper = (p.developer || p.owner_name || '').toLowerCase().includes(q);
        const matchesSubtype = (p.property_sub_type || '').toLowerCase().includes(q);
        const matchesCode = (p.registration_code || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesLocality && !matchesCity && !matchesDeveloper && !matchesSubtype && !matchesCode) {
          return false;
        }
      }

      return true;
    });
  }, [publishedProperties, selectedSection, selectedCategory, selectedBhk, searchQuery]);

  // Counts for each tab
  const counts = useMemo(() => {
    return {
      'Pre-sales': publishedProperties.filter((p) => p.listing_type === 'Pre-sales').length,
      Rent: publishedProperties.filter((p) => p.listing_type === 'Rent').length,
      'Re-sale': publishedProperties.filter((p) => p.listing_type === 'Re-sale').length,
      Total: publishedProperties.length,
    };
  }, [publishedProperties]);

  const categories = [
    { id: 'all', label: 'All Categories', icon: Layers },
    { id: 'Residential', label: 'Residential', icon: Home },
    { id: 'Commercial', label: 'Commercial', icon: Briefcase },
    { id: 'Industrial', label: 'Industrial', icon: Factory },
    { id: 'Land & Plot', label: 'Land & Plot', icon: Trees },
  ];

  const handleInquireWhatsApp = (property: ListingProperty) => {
    const text = encodeURIComponent(
      `Hello PropKart, I am interested in *${property.title}* (${property.listing_type} - ${property.price_display || '₹ ' + property.price.toLocaleString('en-IN')}). Please share verified project brochure, floor plans, and pricing.`
    );
    window.open(`https://wa.me/919974209999?text=${text}`, '_blank');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setUniversalSearchQuery('');
    setSelectedCategory('all');
    setSelectedBhk('all');
  };

  const handleSelectCard = (type: ListingType) => {
    setSelectedSection(type);
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBhk('all');
    setCurrentView('category');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUniversalSearchSubmit = () => {
    setSearchQuery(universalSearchQuery);
    setSelectedSection('all');
    setSelectedCategory('all');
    setSelectedBhk('all');
    setCurrentView('category');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setCurrentView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToCards = () => {
    const el = document.getElementById('panel-channel-cards');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'all' || selectedBhk !== 'all';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-brand-500 selection:text-white relative">
      {/* ==================================================== */}
      {/* 100% TRANSPARENT HEADER: LOGO AND "NB LISTING" ONLY */}
      {/* (NO WHITE STRIP) */}
      {/* ==================================================== */}
      <header className="absolute top-0 left-0 right-0 z-40 bg-transparent px-4 sm:px-8 py-5 flex items-center justify-between transition-all pointer-events-auto">
        <div
          onClick={handleBackToHome}
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 active:scale-95 transition-all"
          title="NB Listing - Home"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-black">
            <img
              src="/favicon.svg"
              alt="NB Listing Official Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex items-center gap-1.5 select-none">
            <span
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                currentView === 'landing' ? 'text-white' : 'text-slate-900'
              }`}
              style={{ textShadow: 'none', filter: 'none' }}
            >
              NB <span className={currentView === 'landing' ? 'text-emerald-400' : 'text-emerald-600'}>Listing</span>
            </span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Close Preview</span>
          </button>
        )}
      </header>

      {/* Main Content View Switcher */}
      {currentView === 'landing' ? (
        /* ==================================================== */
        /* LANDING PAGE VIEW:                                   */
        /* 1. Above-the-fold: Universal search + 3D typo        */
        /*    (NO cards shown on this first screen)             */
        /* 2. Scroll down: The 3 Channel Cards                  */
        /* 3. Footer: Contains Assistance Phone & List Property */
        /* ==================================================== */
        <main className="flex-1">
          {/* Above-the-fold Hero */}
          <section className="relative overflow-hidden min-h-[90vh] sm:min-h-screen flex flex-col justify-center items-center text-center pt-24 pb-16 px-4 sm:px-6 lg:px-8">
            <div className="absolute inset-0 z-0 overflow-hidden select-none">
              <img
                src={heroBgImage}
                alt="Luxury Architecture Landscape"
                className="w-full h-full object-cover object-center"
              />
              <div
                className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none transition-opacity duration-150"
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(248, 250, 252, 0) 0%, rgba(248, 250, 252, 0.45) 50%, rgba(248, 250, 252, 1) 100%)',
                  opacity: scrollShadowOpacity,
                }}
              />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto w-full my-auto px-4 flex flex-col items-center">
              {/* 3D TITLE WITH DUAL TONE LIGHT COLOURS & NO WHITE SHADOW */}
              {/* Auto-adjustable to any screen width via fluid clamp */}
              <div className="w-full mb-8 sm:mb-12 md:mb-16">
                <h1 className="text-[clamp(1.85rem,5.5vw,4.25rem)] font-black tracking-tight leading-[1.15] select-none text-center max-w-4xl mx-auto break-words">
                  <span
                    className="inline"
                    style={{
                      color: '#FFFFFF',
                      textShadow:
                        '0 1px 0 #cbd5e1, 0 2px 0 #94a3b8, 0 3px 0 #64748b, 0 4px 0 #475569, 0 6px 1px rgba(0,0,0,0.4), 0 10px 14px rgba(0,0,0,0.55)',
                    }}
                  >
                    Discover Your Next{' '}
                  </span>
                  <span
                    className="inline"
                    style={{
                      color: '#6ee7b7',
                      textShadow:
                        '0 1px 0 #34d399, 0 2px 0 #10b981, 0 3px 0 #059669, 0 4px 0 #047857, 0 6px 1px rgba(0,0,0,0.4), 0 10px 14px rgba(0,0,0,0.55)',
                    }}
                  >
                    Exclusive Home
                  </span>
                </h1>
              </div>

              {/* ==================================================== */}
              {/* LONG STRIP SEARCH BAR ONLY (NO FILTERS ON MAIN PAGE) */}
              {/* Generous spacing above to eliminate congestion       */}
              {/* ==================================================== */}
              <div className="w-full max-w-3xl mx-auto space-y-4 px-1 sm:px-0">
                <div className="bg-white/95 backdrop-blur-xl border border-black/[0.08] rounded-full p-1.5 sm:p-2.5 shadow-2xl flex items-center gap-1.5 sm:gap-2 hover:shadow-apple-xl transition-all w-full">
                  <div className="pl-2.5 sm:pl-4 text-slate-400 shrink-0">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    autoFocus
                    value={universalSearchQuery}
                    onChange={(e) => setUniversalSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUniversalSearchSubmit()}
                    placeholder="Search Listing..."
                    className="borderless-search-input min-w-0 flex-1 bg-transparent !border-0 !border-none !outline-none !ring-0 !shadow-none text-xs sm:text-base text-slate-900 placeholder:text-slate-400 font-medium px-2 py-1.5 sm:py-2 caret-emerald-600 focus:bg-transparent"
                    style={{
                      border: 'none',
                      outline: 'none',
                      boxShadow: 'none',
                      backgroundColor: 'transparent',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleUniversalSearchSubmit}
                    className="px-4 sm:px-8 py-2.5 sm:py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-apple-sm transition-all cursor-pointer shrink-0"
                  >
                    <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Search</span>
                  </button>
                </div>

                {/* EXACTLY BELOW SEARCH BUTTON / BAR: RERA NUMBER STRING */}
                <div className="pt-1 text-center px-1">
                  <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-[10px] sm:text-xs text-white/95 font-medium shadow-md leading-tight text-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-mono font-bold tracking-tight sm:tracking-wide break-all sm:break-normal">
                      AG/GJ/AHMEDABAD/AHMEDABAD CITY/AA06870/170831R1
                    </span>
                    <span className="text-slate-300 hidden md:inline">our NB Property Tech RERA number</span>
                  </div>
                </div>
              </div>

              {/* Scroll down indicator to explore 3 cards */}
              <div
                onClick={handleScrollToCards}
                className="pt-10 sm:pt-14 flex flex-col items-center justify-center gap-1 text-white/90 text-xs font-bold cursor-pointer select-none group w-fit mx-auto transition-transform hover:translate-y-1"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
              >
                <span>Scroll down to explore property channels</span>
                <ChevronDown className="w-4 h-4 text-emerald-400 animate-bounce" />
              </div>
            </div>
          </section>

          {/* When scrolled down: The 3 Channel Cards */}
          <section id="panel-channel-cards" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-200/80">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
                <div className="space-y-1.5 text-left">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 w-fit">
                    <Compass className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Property Channels</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Choose Your Property Channel
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                    Explore verified real estate across Gujarat with full legal clarity, direct pricing, and operations verification.
                  </p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                    {counts.Total} Verified Properties Live
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                {[
                  {
                    id: 'Pre-sales' as ListingType,
                    title: 'Pre-sales',
                    subtitle: 'Exclusive Builder Launches & Upcoming Towers',
                    badge: '🏢 Pre-sales',
                    count: counts['Pre-sales'],
                    countLabel: 'Projects Live',
                    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
                    description:
                      'Discover upcoming developer launches, high-rise luxury towers, and early-bird pre-construction bookings with verified Gujarat RERA.',
                    highlight: 'Direct Developer Allotment • Early-Bird Pricing',
                    tagColor: 'bg-emerald-500 text-white',
                  },
                  {
                    id: 'Rent' as ListingType,
                    title: 'Rent',
                    subtitle: 'Verified Luxury Apartments & Move-in Ready Homes',
                    badge: '🔑 Rent',
                    count: counts['Rent'],
                    countLabel: 'Rentals Live',
                    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
                    description:
                      'Curated luxury apartments, penthouses, executive villas and commercial workspaces verified directly from genuine property owners.',
                    highlight: '100% Direct Owner Verified • No Brokerage Scams',
                    tagColor: 'bg-blue-500 text-white',
                  },
                  {
                    id: 'Re-sale' as ListingType,
                    title: 'Re-sale',
                    subtitle: 'Prime Commercial Spaces & Investment Plots',
                    badge: '🏷️ Re-sale',
                    count: counts['Re-sale'],
                    countLabel: 'Properties Live',
                    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
                    description:
                      'Ready-to-move resale homes, corporate office suites, and high-appreciation land investments with clear title deeds and instant possession.',
                    highlight: 'Clear Title Deeds • Market-Tested Valuation',
                    tagColor: 'bg-amber-500 text-white',
                  },
                ].map((card) => (
                  <div
                    key={card.id}
                    onClick={() => handleSelectCard(card.id)}
                    className="group relative h-[400px] sm:h-[440px] rounded-3xl overflow-hidden cursor-pointer shadow-apple-md hover:shadow-apple-2xl transition-all duration-500 transform hover:-translate-y-2 flex flex-col justify-between p-5 sm:p-6 select-none border border-black/10 active:scale-[0.99]"
                  >
                    {/* Background Architectural Image */}
                    <div className="absolute inset-0 z-0 overflow-hidden">
                      <img
                        src={card.image}
                        alt={card.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                      {/* Gradient Shadow Overlay for High Legibility */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/25 group-hover:from-black/98 group-hover:via-black/70 transition-all duration-300" />
                    </div>

                    {/* Top Card Badges */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider px-2.5 sm:px-3 py-1 rounded-full shadow-md ${card.tagColor}`}>
                        {card.badge}
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-900 shadow-sm">
                        {card.count} {card.countLabel}
                      </span>
                    </div>

                    {/* Bottom Card Content with Hover-Revealed Description */}
                    <div className="relative z-10 space-y-2">
                      {/* Channel Pre-title */}
                      <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        <span>{card.title} Channel</span>
                      </div>

                      {/* Primary Card Title */}
                      <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight group-hover:text-emerald-300 transition-colors">
                        {card.title}
                      </h3>

                      <p className="text-xs text-slate-300 font-medium line-clamp-2 group-hover:hidden transition-all">
                        {card.subtitle}
                      </p>

                      {/* Hover-Revealed Detailed Description & Highlights */}
                      <div className="max-h-0 opacity-0 group-hover:max-h-60 group-hover:opacity-100 overflow-hidden transition-all duration-500 ease-in-out space-y-3 pt-1">
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                          {card.description}
                        </p>

                        <div className="text-[11px] font-semibold text-emerald-400 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 w-fit">
                          ✓ {card.highlight}
                        </div>

                        <div className="pt-1 flex items-center gap-2 text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                          <span>Explore {card.title} Properties</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                        </div>
                      </div>

                      {/* Subtle affordance when not hovered */}
                      <div className="pt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-300 group-hover:hidden">
                        <span className="hidden sm:inline">Hover to read • </span>
                        <span>Tap to open channel</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      ) : (
        /* ==================================================== */
        /* SEPARATE PAGE VIEW: DEDICATED CHANNEL & SEARCH RESULTS */
        /* ==================================================== */
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6 pt-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <button
              type="button"
              onClick={handleBackToHome}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm border border-slate-200 shadow-apple-sm active:scale-95 transition-all cursor-pointer w-fit"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-600" />
              <span>Back to Channels</span>
            </button>

            <div className="inline-flex p-1.5 rounded-2xl bg-white border border-slate-200 shadow-apple-sm overflow-x-auto no-scrollbar">
              {(['Pre-sales', 'Rent', 'Re-sale', 'all'] as const).map((tab) => {
                const isActive = selectedSection === tab;
                const count = tab === 'all' ? counts.Total : counts[tab];
                const label = tab === 'all' ? 'All Channels' : tab;
                const icon = tab === 'Pre-sales' ? '🏢' : tab === 'Rent' ? '🔑' : tab === 'Re-sale' ? '🏷️' : '🌐';
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      setSelectedSection(tab);
                      setSelectedCategory('all');
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#1d1d1f] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-apple-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {selectedSection === 'Pre-sales' && '🏢 Pre-sales Launches & New Projects'}
                    {selectedSection === 'Rent' && '🔑 Verified Premium Rentals'}
                    {selectedSection === 'Re-sale' && '🏷️ High-Yield Re-sale Inventory'}
                    {selectedSection === 'all' && '🌐 Universal Verified Real Estate Showcase'}
                  </h1>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                    {filteredProperties.length} Available
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
                  {selectedSection === 'Pre-sales' && 'Browse verified developer launches, tower releases, and early-bird pre-sales across Gujarat with Gujarat RERA verification.'}
                  {selectedSection === 'Rent' && 'Handpicked luxury apartments, modern penthouses, executive villas & commercial spaces verified directly with property owners.'}
                  {selectedSection === 'Re-sale' && 'Prime ready-to-move homes, corporate office spaces & high-appreciation land plots with clear title deeds and immediate possession.'}
                  {selectedSection === 'all' && 'Complete directory of verified properties across Pre-sales Launches, Premium Rentals, and High-Yield Re-sale.'}
                </p>
              </div>
            </div>

            {/* DEDICATED SEARCH BAR */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex flex-col lg:flex-row items-center gap-3">
                <div className="relative flex-1 w-full text-left">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search in ${selectedSection === 'all' ? 'all channels' : selectedSection} (project, developer, locality, city)...`}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="w-full sm:w-44 text-left">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Land & Plot">Land & Plot</option>
                  </select>
                </div>

                <div className="w-full sm:w-36 text-left">
                  <select
                    value={selectedBhk}
                    onChange={(e) => setSelectedBhk(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="all">Any BHK</option>
                    <option value="1 BHK">1 BHK</option>
                    <option value="2 BHK">2 BHK</option>
                    <option value="3 BHK">3 BHK</option>
                    <option value="4 BHK">4+ BHK</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5 text-slate-500" />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider shrink-0 mr-1">
                  Category:
                </span>
                {categories.map((c) => {
                  const Icon = c.icon;
                  const isSel = selectedCategory === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isSel
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isSel ? 'text-white' : 'text-slate-500'}`} />
                      <span>{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {filteredProperties.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center text-slate-400 space-y-4 bg-white rounded-3xl border border-slate-200 p-8 shadow-apple-sm">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Building2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No properties match your criteria</h3>
              <p className="text-xs text-slate-500 max-w-md">
                {hasActiveFilters
                  ? 'No published properties match your active search and filter settings. Try clearing filters or expanding your search parameters.'
                  : `There are currently no published properties under ${selectedSection}. Check back shortly or approve listings in the Panel desk.`}
              </p>
              <div className="pt-2 flex items-center justify-center gap-3">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleBackToHome}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 cursor-pointer"
                >
                  Back to Channels
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-4">
              {filteredProperties.map((property) => {
                const mainImage =
                  property.images?.[0] ||
                  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80';
                const hasVideos = property.videos && property.videos.length > 0;
                const photoCount = property.images ? property.images.length : 1;

                return (
                  <div
                    key={property.id}
                    onClick={() => setSelectedProperty(property)}
                    className="group bg-white rounded-3xl overflow-hidden border border-black/[0.08] hover:border-emerald-500/50 transition-all duration-500 flex flex-col h-[520px] sm:h-[555px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15),0_8px_16px_-4px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.06)] hover:shadow-[0_32px_64px_-16px_rgba(16,185,129,0.28),0_16px_32px_-8px_rgba(0,0,0,0.12),0_0_0_1px_rgba(16,185,129,0.3)] hover:-translate-y-2 cursor-pointer relative ring-1 ring-black/[0.05] active:scale-[0.99]"
                  >
                    {/* 60% Ratio: Fixed Photographic Media Showcase */}
                    <div className="h-[56%] sm:h-[60%] relative overflow-hidden bg-slate-900 select-none">
                      <img
                        src={mainImage}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-black/35" />

                      {/* Top Badges */}
                      <div className="absolute top-3 sm:top-3.5 left-3 sm:left-3.5 right-3 sm:right-3.5 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider px-2.5 sm:px-3 py-1 rounded-xl shadow-md text-white ${
                              property.listing_type === 'Pre-sales'
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600'
                                : property.listing_type === 'Rent'
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
                                : 'bg-gradient-to-r from-blue-600 to-cyan-600'
                            }`}
                          >
                            {property.listing_type}
                          </span>
                          <span className="text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-1 rounded-xl bg-white/95 backdrop-blur-md text-slate-800 shadow-sm border border-white/60">
                            {property.property_category}
                          </span>
                        </div>

                        {/* Media Indicators (Photos & Videos) */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {hasVideos && (
                            <span className="text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-1 rounded-xl bg-purple-600/90 backdrop-blur-md text-white flex items-center gap-1 shadow-sm border border-white/20">
                              <VideoIcon className="w-3 h-3" />
                              <span>{property.videos!.length}</span>
                            </span>
                          )}
                          <span className="text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-1 rounded-xl bg-black/65 backdrop-blur-md text-white flex items-center gap-1 shadow-sm border border-white/20">
                            <Camera className="w-3 h-3" />
                            <span>{photoCount}</span>
                          </span>
                        </div>
                      </div>

                      {/* Bottom of Image: Price & Space Specs Overlay */}
                      <div className="absolute bottom-3 sm:bottom-3.5 left-3 sm:left-3.5 right-3 sm:right-3.5 flex items-end justify-between gap-2">
                        <div className="bg-white/95 backdrop-blur-xl px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.18)] border border-white/80 text-slate-900 min-w-0">
                          <div className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                            {property.listing_type === 'Rent' ? 'Monthly Rent' : 'Expected Price'}
                          </div>
                          <div className="text-sm sm:text-lg font-black text-slate-900 tracking-tight truncate">
                            {property.price_display || `₹ ${property.price.toLocaleString('en-IN')}`}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {property.area && (
                            <div className="bg-black/75 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold text-white shadow-md border border-white/15">
                              {property.area.toLocaleString('en-IN')} sq.ft
                            </div>
                          )}
                          {property.bhk && (
                            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 backdrop-blur-md px-2 sm:px-2.5 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-extrabold text-white shadow-md border border-white/15">
                              {property.bhk}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 40% Ratio: Content Body & Quick Action Buttons */}
                    <div className="h-[44%] sm:h-[40%] p-4 sm:p-5 flex flex-col justify-between bg-white">
                      <div className="space-y-1 sm:space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 tracking-tight">
                            {property.title}
                          </h3>
                        </div>

                        {property.developer ? (
                          <p className="text-[10px] sm:text-[11px] font-bold text-purple-700 flex items-center gap-1.5 mt-0.5">
                            <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                            <span className="line-clamp-1">By {property.developer}</span>
                          </p>
                        ) : property.property_sub_type ? (
                          <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-0.5">
                            {property.property_sub_type}
                          </p>
                        ) : null}

                        <p className="text-[11px] sm:text-xs text-slate-500 font-medium flex items-center gap-1.5 line-clamp-1">
                          <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
                          <span className="line-clamp-1">{property.locality || property.address}, {property.city}</span>
                        </p>

                        <p className="text-[11px] sm:text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                          {property.description}
                        </p>

                        {/* Pre-sales possession pill */}
                        {property.listing_type === 'Pre-sales' && property.possession_date && (
                          <div className="text-[9px] sm:text-[10px] text-purple-800 bg-purple-50/90 border border-purple-200/80 rounded-xl px-2.5 sm:px-3 py-0.5 sm:py-1 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-medium truncate">
                              <Calendar className="w-3 h-3 text-purple-600 shrink-0" />
                              <span>Possession: {property.possession_date}</span>
                            </span>
                            {property.rera_number && (
                              <span className="text-[9px] text-emerald-700 font-bold flex items-center gap-0.5 bg-emerald-100/80 px-1.5 py-0.5 rounded-md shrink-0 ml-1">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                <span>RERA</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 sm:pt-2.5 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedProperty(property)}
                          className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/60 shadow-xs transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer hover:text-slate-900 active:scale-95"
                        >
                          <span>View Details</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInquireWhatsApp(property);
                          }}
                          className="py-2 sm:py-2.5 px-3.5 sm:px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 flex items-center gap-1.5 transition-all shadow-[0_4px_14px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.45)] active:scale-95 cursor-pointer"
                          title="Chat on WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Inquire</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* Property Details Lightbox Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-900">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs uppercase font-extrabold px-2.5 py-1 rounded-xl text-white ${
                    selectedProperty.listing_type === 'Pre-sales'
                      ? 'bg-purple-600'
                      : selectedProperty.listing_type === 'Rent'
                      ? 'bg-emerald-600'
                      : 'bg-blue-600'
                  }`}
                >
                  {selectedProperty.listing_type}
                </span>
                <span className="text-xs font-bold text-slate-600">
                  {selectedProperty.property_category} • {selectedProperty.property_sub_type || 'Property'}
                </span>
              </div>
              <button
                onClick={() => setSelectedProperty(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-200/60 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="relative aspect-16/9 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs">
                <img
                  src={selectedProperty.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80'}
                  alt={selectedProperty.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">{selectedProperty.title}</h2>
                  {selectedProperty.developer && (
                    <p className="text-xs text-purple-700 font-bold mt-1">Developed by {selectedProperty.developer}</p>
                  )}
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedProperty.address || selectedProperty.locality}, {selectedProperty.city}</span>
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs text-slate-500 font-medium">Pricing</div>
                  <div className="text-2xl font-black text-emerald-700">
                    {selectedProperty.price_display || `₹ ${selectedProperty.price.toLocaleString('en-IN')}`}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Super Built-up</div>
                  <div className="text-sm font-extrabold text-slate-900 mt-0.5">{selectedProperty.area} sq.ft</div>
                </div>
                {selectedProperty.bhk && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Configuration</div>
                    <div className="text-sm font-extrabold text-slate-900 mt-0.5">{selectedProperty.bhk}</div>
                  </div>
                )}
                {selectedProperty.possession_date && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Possession</div>
                    <div className="text-sm font-extrabold text-slate-900 mt-0.5">{selectedProperty.possession_date}</div>
                  </div>
                )}
                {selectedProperty.rera_number && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                    <div className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider">Gujarat RERA</div>
                    <div className="text-xs font-mono font-bold text-emerald-900 mt-0.5 line-clamp-1">{selectedProperty.rera_number}</div>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description</h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {selectedProperty.description}
                </p>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedProperty(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 cursor-pointer text-center"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleInquireWhatsApp(selectedProperty)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2 cursor-pointer shadow-apple-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contact via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* FOOTER: ASSISTANCE PHONE & CONTACT INVENTORY */}
      {/* ==================================================== */}
      <footer className="mt-auto border-t border-slate-200 bg-white text-slate-600 font-sans">
        <div className="bg-[#1d1d1f] text-white border-b border-black/[0.08]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 border border-emerald-500/30">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Direct Operations Assistance Desk
                </div>
                <a
                  href="tel:+919974209999"
                  className="text-sm sm:text-base font-extrabold text-white hover:text-emerald-400 transition-colors"
                >
                  +91 99742 09999
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/919974209999?text=Hello%20NB%20Listing,%20I%20would%20like%20to%20list%20a%20property."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all shadow-apple-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-white" />
                <span>List a Property</span>
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
            <p>© 2026 NB Listing. All rights reserved. Powered by NB Property Technology.</p>
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Gujarat's Official Verified Property Directory</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLandingPage;
