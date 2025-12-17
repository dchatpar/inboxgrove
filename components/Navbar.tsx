import React, { useState, useEffect } from 'react';
import { Menu, X, Rocket } from 'lucide-react';
import { NavItem } from '../types';
import { motion } from 'framer-motion';

const navItems: NavItem[] = [
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Domains', href: '/domains' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Admin', href: '/admin' },
];

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const sections = navItems.map(item => item.href.substring(1));
      let currentSection = '';
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            currentSection = section;
          }
        }
      }
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md shadow-sm border-b border-white/10' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0 flex items-center cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 rounded-xl"
            role="button"
            aria-label="Go to top"
            tabIndex={0}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
          >
            <div className="relative w-10 h-10 rounded-xl overflow-hidden mr-2 bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all">
              <svg className="w-6 h-6" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                <g transform="translate(128, 128)">
                  <rect x="-30" y="-22" width="60" height="45" rx="4" fill="none" stroke="white" strokeWidth="3" opacity="0.9"/>
                  <rect x="-26" y="-18" width="52" height="9" rx="2" fill="white" opacity="0.2"/>
                  <g transform="translate(-13, 3)">
                    <rect x="0" y="0" width="26" height="16" rx="1.5" fill="none" stroke="white" strokeWidth="1.5" opacity="0.8"/>
                    <path d="M 0 0 L 13 9 L 26 0" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round" opacity="0.8"/>
                  </g>
                  <g transform="translate(22, -13)">
                    <path d="M 0 11 L 0 0 M -4 4 L 0 0 L 4 4" fill="none" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </g>
                </g>
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight text-white group-hover:text-purple-400 transition-colors">InboxGrove</span>
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const isAnchor = item.href.startsWith('#');
              const isActive = isAnchor && activeSection === item.href.substring(1);
              return (
                <a
                  key={item.label}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`text-sm font-medium transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 rounded-md px-1 ${
                    isActive ? 'text-purple-400' : 'text-gray-400'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
            <motion.a
              href="/onboarding"
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(139,92,246,0.6)" }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-lg shadow-purple-500/30 text-sm"
            >
              Start Free Trial
            </motion.a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-400 hover:text-white p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 rounded-md"
              aria-label="Toggle navigation menu"
              aria-controls="mobile-nav"
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden absolute top-20 left-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 shadow-xl"
          id="mobile-nav"
        >
          <div className="px-4 pt-2 pb-6 space-y-2">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`block px-3 py-3 text-base font-medium rounded-md transition-colors ${
                   activeSection === item.href.substring(1) 
                   ? 'text-purple-400 bg-purple-500/10' 
                   : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="pt-4">
              <a
                href="/onboarding"
                className="block w-full text-center bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-3 rounded-lg font-bold shadow-md active:scale-95 transition-transform"
                onClick={() => setIsOpen(false)}
              >
                Start Free Trial
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;