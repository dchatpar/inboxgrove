import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FAQItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const faqData: FAQItem[] = [
  {
    question: "What is InboxGrove?",
    answer: (
        <>
        InboxGrove is a tool that automates the creation of company email accounts for cold outreach.<br/><br/>
        Here are your benefits:<br/>
        - Generate 50+ inboxes in 5 minutes (instead of 6+ hours with Google or Outlook)<br/>
        - Save 80% of costs with inboxes as low as $1/month instead of $7.20<br/>
        - Get the best deliverability (we manage it for you and guarantee it)<br/>
        - Never get blocked again (Google & Outlook don't allow you to cold email)<br/><br/>
        As a result, you can send more emails that land in the inbox and get more leads.
        </>
    )
  },
  {
    question: "Why do I need so many email accounts?",
    answer: <>
        To not land in the spam, an email account should send no more than 20-30 emails per day.<br/><br/>
        Therefore, the only way to scale your outreach is by having lots of email accounts.<br/><br/>
        Example:<br/>
        If you have 50 email accounts, you can target 5000-10,000 businesses a month (with a sequence of a few emails).<br/><br/>
        <em>This is how you can get 50-100+ businesses interested in your offer.</em>
    </>
  },
  {
    question: "What's the result for my business?",
    answer: <>
        Usually, businesses do email outreach in order to book sales calls.<br/><br/>
        By scaling your outreach with 50 or 200+ email accounts, our customers consistently book 30+ sales appointments and get 5+ clients.<br/><br/>
        Equally, a freelancer/SAAS with lower ticket offers can use email outreach to get hundreds of signups/customers.
    </>
  },
  {
    question: "Is this for me?",
    answer: "Cold outreach will work for you if you're targeting businesses. Therefore, any solopreneur, freelancer, agency owner or software founder can benefit from reaching out to their dream customers. Inside of InboxGrove's business plan, you'll get a full cold email course including tutorials on how you can get 10,000+ emails in any niche."
  },
  {
    question: "How does cold outreach work?",
    answer: "InboxGrove provides you with email accounts. Think of them as your soldiers. But you still need other tools such as an email sending tool like Instantly/Smartlead to send the emails. Also, you need to get emails of your dream customers with tools such as Apollo. In order to help you, we provide you with a full cold email course including how to get 10,000+ emails, set up the emails, write high converting emails etc."
  },
  {
      question: "Why can't I use Activecampaign/ Mailchimp / Mailgun / Sendgrid/ Convertkit etc.?",
      answer: "All of these providers are for 'transactional emails' only. Meaning, if you have an email list of subscribers that expect your email. Cold outreach is against their policies and will get you banned."
  },
  {
      question: "How is the deliverability?",
      answer: "Deliverability nowadays isn't a function of infrastructure or mailboxes anymore. It's about staying under Google & Outlooks radar by using Spintax (to create hundreds of email variations), avoiding spam trigger words, not using the same signature across your emails, etc. If this is new to you, don't worry. We provide you with a deliverability checklist and 5-minute training video that will ensure you land in the inbox. Keep scrolling to discover how we guarantee deliverability."
  },
  {
      question: "What's the difference to Google Workspace/Outlook?",
      answer: "The end result is the same: Company email accounts. But when using Google/Outlook, it would take you 12+ hours of technical setup (DKIM/DMARC/SPF etc.) to set them up and optimize for deliverability. Also, it would cost you $400+/Month for 50 email accounts. With InboxGrove, all it takes is 5 minutes to fill out a form and you save 3-5x the costs."
  },
  {
      question: "Why do I need domains?",
      answer: "In order to create email accounts, you need to have domains (also if you don't use InboxGrove). That's because you can't set up 50 email accounts on a single domain, you need to spread your volume to not land in spam. We recommend up to 5 emails per domain. For 50 email accounts, you should have at least 10 domains that you can bring or buy inside of InboxGrove.",
  },
  {
      question: "Can I bring my own domains?",
      answer: "Yes, you can bring your domains. Just text our 24/7 chat support and they'll send you instructions on how to connect them to Mailscale. Most customers buy domains inside of Mailscale because we automatically configure them properly (DKIM/DMARC/SPF) for $10-$15/year per domain. When setting up 50 email accounts, this will effectively only add $7-$10 a month and these are your domains in case you want to cancel Mailscale in the future."
  },
  {
      question: "Can I upgrade anytime?",
      answer: "Yes, of course. You can upgrade anytime no matter if you're on the monthly or yearly plan."
  },
  {
      question: "What's the process?",
      answer: <>
        It's a simple process that takes you 1-2 minutes only:<br/><br/>
        1. Pick your plan<br/>
        2. Get or add domains inside of Mailscale<br/>
        3. Fill out a form with your desired email usernames<br/>
        4. You get a CSV file with all email accounts that you can import with a single click into your email sending tool.<br/><br/>
        As with all providers, we recommend a warmup period of 1-2 weeks before starting to send campaigns.
      </>
  },
  {
      question: "How does the email infrastructure work?",
      answer: <>
        Using a self-hosted email infrastructure is nothing new. Large companies with thousands of employees such as TikTok don't use Google or Outlook (Also for security reasons).<br/><br/>
        They have their own infrastructure and of course, their emails land in the inbox when contacting businesses or sending emails between each other.<br/><br/>
        The only thing that's new here is that Mailscale finally makes this accessible to small business owners like yourself.<br/><br/>
        We're currently the only provider that owns the full infrastructure including SMTP servers, IP pools and more (While most others rent IPs like from Microsoft which is against their policies).<br/><br/>
        As a result, we can provide you with the best deliverability and reliability.<br/><br/>
        Our infrastructure is optimized for cold email outreach and we have a full automated monitoring system that scans for blacklisting, reputation, spam reports, bounces and more so you don't have to deal with any of that.
      </>
  },
  {
      question: "How many emails can I send with them?",
      answer: "While there's technically no limitation, you can negatively impact your reputation if you send too many emails (As with every provider). We recommend to send a maximum of 30-50 emails per email account per day."
  },
  {
      question: "Which email sending tools do you integrate with?",
      answer: <>
        You can integrate the email inboxes you create with Mailscale with virtually every cold email sending tool.<br/><br/>
        That's because every cold outreach tool usually allows you to add self-hosted email accounts (IMAP/SMTP).<br/><br/>
        Mailscale provides you with all the login credentials that you need.<br/><br/>
        Example Sending Tools: Instantly.ai, Smartlead.ai, Apollo.io, Success.ai, Reply.io, Lemlist, Mailshake<br/><br/>
        Tip: If you haven't decided on a sending tool yet, we highly recommend Instantly & Smartlead (They allow you to add unlimited email accounts at no fee).
      </>
  },
  {
      question: "How do you guarantee deliverability?",
      answer: <>
        Mailscale handles deliverability for you - so you can focus on closing deals.<br/><br/>
        We guarantee 95-100% deliverability when sending to professional inboxes (Google/Outlook).<br/><br/>
        If your deliverability drops, even as a result of you not following best practices, or prospects marking your emails as spam, we'll help you recover your domains within 7 days.<br/><br/>
        If we ever fail, you get your money back or we buy new domains for you (your choice).<br/><br/>
        Additionally, we guarantee an increase of 15% in replies when using Mailscale and following the deliverability checklist you receive upon signing up.
      </>
  },
  {
      question: "How do I cancel my subscription?",
      answer: <>
        You can easily cancel your subscription anytime <a href="#" className="text-brand-400 hover:underline">by clicking here.</a>
      </>
  }
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-32 bg-[#0a0a0a] relative">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <motion.span 
            className="inline-block text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 uppercase tracking-wider mb-4"
          >
            Got Questions?
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Frequently asked questions
          </h2>
        </motion.div>
        
        <div className="space-y-4">
          {faqData.map((item, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="border border-white/10 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 backdrop-blur-xl"
            >
              <motion.button
                whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                className="w-full px-8 py-6 text-left transition-colors flex justify-between items-center focus:outline-none"
                onClick={() => toggleFAQ(index)}
              >
                <span className="font-bold text-lg text-white pr-8">{item.question}</span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <ChevronDown className="h-5 w-5 text-purple-400 flex-shrink-0" />
                </motion.div>
              </motion.button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 pb-8 pt-2 text-gray-400 leading-relaxed border-t border-white/5">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;