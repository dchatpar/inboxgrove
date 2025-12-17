import React from 'react';
import { Building2, Rocket, Briefcase, Users } from 'lucide-react';

const WhoIsThisFor: React.FC = () => {
  const personas = [
    {
      title: "Lead Gen Agencies",
      description: "Managing 20+ client accounts? Stop wasting billable hours on DNS configuration. Deploy isolated infrastructure for each client in 60 seconds—zero technical knowledge required.",
      icon: Briefcase
    },
    {
      title: "B2B SaaS Companies",
      description: "Scale user acquisition profitably. Run A/B tests across separate domains without risking your corporate sender reputation. Cut CAC by 40% with affordable inbox scale.",
      icon: Rocket
    },
    {
      title: "Recruiting Firms",
      description: "Contact 10x more candidates daily. No more 'daily sending limit' bottlenecks. Maintain 98%+ inbox placement even at high volume—candidates actually see your outreach.",
      icon: Users
    },
    {
      title: "Enterprise Sales Teams",
      description: "Equip each SDR with 5-10 dedicated inboxes. Double your team's pipeline capacity without doubling headcount. SOC-2 compliant infrastructure included.",
      icon: Building2
    }
  ];

  return (
    <section className="py-24 bg-slate-950 border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-brand-400 font-bold uppercase tracking-wider text-sm mb-2 block">
            Perfect For High-Volume Senders
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Join 3,000+ teams scaling their outreach
          </h2>
          <p className="mt-4 text-xl text-slate-400">
            Whether you're an agency, SaaS, or sales team—<span className="text-white font-semibold">MailScale handles the technical complexity</span> so you focus on results.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {personas.map((persona, index) => (
            <div key={index} className="group p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-brand-500/50 hover:bg-slate-800 transition-all duration-300">
              <div className="w-14 h-14 bg-slate-950 rounded-xl shadow-inner border border-slate-800 flex items-center justify-center text-brand-400 mb-6 group-hover:scale-110 transition-transform group-hover:text-brand-300">
                <persona.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-brand-300 transition-colors">{persona.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm group-hover:text-slate-300">
                {persona.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhoIsThisFor;