import React from 'react';
import { Rocket, Twitter, Linkedin, Youtube } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6 text-white">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                  <g transform="translate(128, 128)">
                    <rect x="-30" y="-22" width="60" height="45" rx="4" fill="none" stroke="white" strokeWidth="3" opacity="0.9"/>
                    <rect x="-26" y="-18" width="52" height="9" rx="2" fill="white" opacity="0.2"/>
                    <g transform="translate(-13, 3)">
                      <rect x="0" y="0" width="26" height="16" rx="1.5" fill="none" stroke="white" strokeWidth="1.5" opacity="0.8"/>
                      <path d="M 0 0 L 13 9 L 26 0" fill="none" stroke="white" strokeWidth="1.5" strokeLinejoin="round" opacity="0.8"/>
                    </g>
                  </g>
                </svg>
              </div>
              <span className="font-bold text-xl">InboxGrove</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-6">
              The ultimate cold email infrastructure platform. Automate inbox provisioning, scale your outreach with confidence, and dominate with advanced deliverability.
            </p>
            <div className="flex space-x-6">
              <a
                href="https://twitter.com/yassin_baum"
                target="_blank"
                rel="noreferrer"
                aria-label="Follow on Twitter"
                className="text-slate-400 hover:text-white transition-colors p-2 bg-slate-800 rounded-full hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
              >
                <Twitter size={20} />
              </a>
              <a
                href="https://www.linkedin.com/in/yassin-baum-08185522b/"
                target="_blank"
                rel="noreferrer"
                aria-label="Connect on LinkedIn"
                className="text-slate-400 hover:text-white transition-colors p-2 bg-slate-800 rounded-full hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="https://www.youtube.com/channel/UCLNC8YkvhJ2kQNwibFsYrhg"
                target="_blank"
                rel="noreferrer"
                aria-label="Subscribe on YouTube"
                className="text-slate-400 hover:text-white transition-colors p-2 bg-slate-800 rounded-full hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6 text-lg">Company</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white transition-colors block">Home</a></li>
              <li><a href="#" className="hover:text-white transition-colors block">About us</a></li>
              <li><a href="#" className="hover:text-white transition-colors block">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors block">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors block">Affiliate</a></li>
              <li><a href="#" className="hover:text-white transition-colors block">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 text-lg">Support & Legal</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-white transition-colors block">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors block">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors block">Anti Spam</a></li>
              <li><a href="#" className="hover:text-white transition-colors block">Cancel</a></li>
              <li><a href="#" className="hover:text-white transition-colors block">Refund Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors block">Knowledge Base</a></li>
            </ul>
          </div>

        </div>
        
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500 font-medium">
            Copyright @InboxGrove {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;