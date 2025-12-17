import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, CreditCard, Globe, Zap, Key, MessageSquare,
  CheckCircle, AlertCircle, Trash2, RefreshCw, ExternalLink
} from 'lucide-react';
import { IntegrationConfig, integrationService } from '../services/integrationService';
import IntegrationModal from './IntegrationModal';

interface IntegrationService {
  id: string;
  name: 'instantly' | 'smartlead' | 'apollo' | 'stripe' | 'cloudflare' | 'namecheap' | 'slack';
  icon: string;
  description: string;
  docsUrl: string;
  features: string[];
  category: 'email' | 'payment' | 'dns' | 'communication';
}

const SERVICES: IntegrationService[] = [
  {
    id: 'instantly',
    name: 'instantly',
    icon: '📧',
    description: 'Cold email automation at scale',
    docsUrl: 'https://developer.instantly.ai/',
    features: ['Send campaigns', 'Track opens', 'A/B testing', 'Webhook support'],
    category: 'email',
  },
  {
    id: 'smartlead',
    name: 'smartlead',
    icon: '⚡',
    description: 'AI-powered email outreach platform',
    docsUrl: 'https://docs.smartlead.ai/',
    features: ['Campaign automation', 'Lead generation', 'Email tracking', 'API access'],
    category: 'email',
  },
  {
    id: 'apollo',
    name: 'apollo',
    icon: '🎯',
    description: 'B2B sales intelligence platform',
    docsUrl: 'https://docs.apollo.io/',
    features: ['Contact database', 'Enrichment', 'Bulk email', 'Export tools'],
    category: 'email',
  },
  {
    id: 'stripe',
    name: 'stripe',
    icon: '💳',
    description: 'Payment processing & billing',
    docsUrl: 'https://stripe.com/docs',
    features: ['Payments', 'Subscriptions', 'Invoicing', 'Webhooks'],
    category: 'payment',
  },
  {
    id: 'cloudflare',
    name: 'cloudflare',
    icon: '🌐',
    description: 'DNS management & security',
    docsUrl: 'https://developers.cloudflare.com/',
    features: ['DNS automation', 'DDoS protection', 'SSL/TLS', 'Analytics'],
    category: 'dns',
  },
  {
    id: 'slack',
    name: 'slack',
    icon: '💬',
    description: 'Team notifications & alerts',
    docsUrl: 'https://api.slack.com/',
    features: ['Notifications', 'Alerts', 'Webhooks', 'Bot integration'],
    category: 'communication',
  },
];

interface IntegrationsTabProps {
  onIntegrationSaved?: (serviceName: string) => void;
}

const IntegrationsTab: React.FC<IntegrationsTabProps> = ({ onIntegrationSaved }) => {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [selectedService, setSelectedService] = useState<IntegrationService | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = () => {
    const loaded = integrationService.getIntegrations();
    setIntegrations(loaded);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    loadIntegrations();
    setRefreshing(false);
  };

  const handleConnectService = (service: IntegrationService) => {
    setSelectedService(service);
    setShowModal(true);
  };

  const handleRemoveIntegration = (id: string) => {
    if (confirm('Are you sure you want to disconnect this integration?')) {
      integrationService.removeIntegration(id);
      loadIntegrations();
    }
  };

  const handleIntegrationSuccess = () => {
    loadIntegrations();
    if (selectedService && onIntegrationSaved) {
      onIntegrationSaved(selectedService.name);
    }
  };

  const isServiceConnected = (serviceName: string): boolean => {
    return integrations.some(i => i.service === serviceName && i.status === 'connected');
  };

  const getConnectedIntegration = (serviceName: string): IntegrationConfig | null => {
    return integrations.find(i => i.service === serviceName && i.status === 'connected') || null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Connected Integrations</h2>
          <p className="text-sm text-slate-400 mt-1">Connect third-party services to extend functionality</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Connected Integrations Overview */}
      {integrations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-lg font-bold text-white mb-2">
                {integrations.length} Integration{integrations.length !== 1 ? 's' : ''} Connected
              </h3>
              <div className="flex flex-wrap gap-2">
                {integrations.map(integration => (
                  <span
                    key={integration.id}
                    className="px-3 py-1 bg-green-500/20 border border-green-500/40 text-green-200 text-sm rounded-full capitalize"
                  >
                    ✓ {integration.service}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {SERVICES.filter(s => s.name !== 'stripe').map((service) => {
          const isConnected = isServiceConnected(service.name);
          const integration = getConnectedIntegration(service.name);

          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl border p-6 transition-all ${
                isConnected
                  ? 'bg-slate-900/80 border-green-500/50 shadow-lg shadow-green-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-4xl">{service.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white capitalize">{service.name}</h3>
                    <p className="text-sm text-slate-400">{service.description}</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    isConnected
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                  }`}
                >
                  {isConnected ? '✓ Connected' : 'Not Connected'}
                </span>
              </div>

              {/* Features */}
              <div className="mb-4 pb-4 border-t border-slate-800">
                <p className="text-xs text-slate-400 mb-2">Features:</p>
                <div className="flex flex-wrap gap-2">
                  {service.features.map((feature) => (
                    <span key={feature} className="text-xs bg-slate-800/50 text-slate-300 px-2 py-1 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Connection Info */}
              {isConnected && integration && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
                >
                  <p className="text-xs text-green-200 mb-2">
                    ✓ Connected on {new Date(integration.lastTestedAt || '').toLocaleDateString()}
                  </p>
                  {integration.metadata && (
                    <div className="text-xs text-slate-300 space-y-1">
                      {Object.entries(integration.metadata)
                        .slice(0, 2)
                        .map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-slate-400 capitalize">{key}:</span>
                            <span className="text-slate-200 font-mono">{String(value).substring(0, 30)}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {isConnected ? (
                  <>
                    <button
                      onClick={() => handleConnectService(service)}
                      className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <RefreshCw size={16} />
                      Update
                    </button>
                    <button
                      onClick={() => {
                        if (integration) handleRemoveIntegration(integration.id);
                      }}
                      className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-lg transition-all border border-red-500/20 flex items-center justify-center gap-2 text-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleConnectService(service)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    Connect
                  </button>
                )}
                <a
                  href={service.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-all flex items-center justify-center"
                  title="View documentation"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Integration Modal */}
      <IntegrationModal
        isOpen={showModal}
        serviceName={selectedService?.name || 'instantly'}
        serviceIcon={selectedService?.icon || '📧'}
        serviceDescription={selectedService?.description || ''}
        docsUrl={selectedService?.docsUrl || ''}
        onClose={() => setShowModal(false)}
        onSuccess={handleIntegrationSuccess}
      />
    </div>
  );
};

// Add missing import
import { Plus } from 'lucide-react';

export default IntegrationsTab;
