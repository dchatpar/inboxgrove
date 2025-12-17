import React from 'react';
import { motion, useScroll } from 'framer-motion';

const ScrollProgress: React.FC = () => {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[60] h-1 origin-left bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600"
      style={{ scaleX: scrollYProgress }}
      aria-hidden="true"
    />
  );
};

export default ScrollProgress;
