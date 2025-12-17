import React, { useEffect, useState } from 'react';
import { Rocket } from 'lucide-react';

const StickyCTA: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const threshold = 400; // Show after passing hero area
      setVisible(window.scrollY > threshold);
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 px-4 md:hidden">
      <div className="mx-auto max-w-md rounded-2xl border border-purple-500/40 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-[0_10px_30px_rgba(139,92,246,0.6)]">
        <a
          href="/onboarding"
          aria-label="Start free trial"
          className="flex items-center justify-center gap-2 py-3 font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 rounded-2xl"
        >
          <Rocket className="w-4 h-4" /> Start Free Trial
        </a>
      </div>
    </div>
  );
};

export default StickyCTA;
