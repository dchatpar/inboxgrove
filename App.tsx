import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import SocialProof from './components/SocialProof';
import StatsAndProof from './components/StatsAndProof';
import ComparisonV2 from './components/ComparisonV2';
import BentoFeatures from './components/BentoFeatures';
import WhoIsThisFor from './components/WhoIsThisFor';
import FeatureSection from './components/FeatureSection';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import CostComparison from './components/CostComparison';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import Guarantee from './components/Guarantee';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import ScrollProgress from './components/ScrollProgress';
import StickyCTA from './components/StickyCTA';
import DomainSetup from './components/DomainSetup';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-slate-50 selection:bg-purple-600/30 selection:text-purple-200">
      <ScrollProgress />
      <Navbar />
      <main>
        {/* 1. Hero - Hook them immediately with clear value prop */}
        <Hero />
        
        {/* 2. Integration Partners - Build instant credibility */}
        <SocialProof />
        
        {/* 3. Stats & Social Proof - Show real results */}
        <StatsAndProof />
        
        {/* 4. Problem/Solution - Old Way vs New Way */}
        <ComparisonV2 />
        
        {/* 5. Who is this for - Target audience identification */}
        <WhoIsThisFor />
        
        {/* 6. Features Grid - Everything they get */}
        <BentoFeatures />
        
        {/* 7. Deep Dive: Speed & Automation */}
        <FeatureSection 
          title="Launch 50 inboxes in 60 seconds. No technical skills required."
          subtitle="ZERO-SETUP INFRASTRUCTURE"
          description={
            <>
              <p className="mb-4 text-slate-300 text-lg">
                Traditional setup requires buying domains, configuring DNS records (SPF, DKIM, DMARC), setting up mail servers, and manually warming each inbox.
              </p>
              <p className="mb-6 text-white text-xl font-bold">
                That's 10+ hours of tedious work per client. And if you mess up one DNS record? Your emails land in spam.
              </p>
              <p className="text-slate-300 text-lg">
                <span className="text-violet-400 font-bold">InboxGrove does it all automatically.</span> Click one button. Get credentials. Start sending. We handle servers, IP rotation, DNS authentication, and warmup behind the scenes.
              </p>
            </>
          }
          imageSrc="https://cdn.prod.website-files.com/661e47646211c5138cc16b64/661e4a5f434497684b7b8c03_Group%201171275964.webp"
          imageAlt="InboxGrove Provisioning Dashboard"
          ctaText="Get Started Free"
        />

        {/* 8. Deep Dive: Deliverability */}
        <FeatureSection 
          title="95-100% Inbox Placement. Guaranteed."
          subtitle="AI-POWERED WARMUP"
          description={
            <>
              <p className="mb-4 text-slate-300 text-lg">
                Anyone can send emails. <span className="text-white font-bold">Landing in the Primary Inbox is the real challenge.</span>
              </p>
              <p className="mb-6 text-white text-xl font-bold">
                Our AI Warmup Network operates 24/7, sending realistic conversations between your inboxes to build sender reputation with Google and Microsoft.
              </p>
              <p className="text-slate-300 text-lg">
                <span className="text-emerald-400 font-bold">Automatic reputation monitoring:</span> If a domain's health score drops below 95%, our system auto-pauses campaigns and initiates repair protocols. You stay in the inbox, always.
              </p>
            </>
          }
          imageSrc="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop"
          imageAlt="Deliverability Analytics Dashboard"
          reverse={true}
          ctaText="See Deliverability Stats"
          ctaHref="#pricing"
        />

        {/* 9. Additional Features */}
        <Features />
        
        {/* 10. Cost Comparison - Show the savings */}
        <CostComparison />
        
        {/* 10.5 Domain Setup & DNS Automation */}
        <DomainSetup />

        {/* 11. Social Proof - Testimonials */}
        <Testimonials />
        
        {/* 12. Pricing - Clear, transparent */}
        <Pricing />
        <Guarantee />
        <FAQ />
      </main>
      <StickyCTA />
      <Footer />
    </div>
  );
};

export default App;