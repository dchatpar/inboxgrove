import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader, CheckCircle, AlertCircle, Copy, Eye, EyeOff } from 'lucide-react';
import { integrationService, IntegrationConfig, INSTANTLY_API_BASE } from '../services/integrationService';

interface IntegrationModalProps {
  isOpen: boolean;
  serviceName: 'instantly' | 'smartlead' | 'apollo' | 'stripe' | 'cloudflare' | 'namecheap' | 'slack';
  serviceIcon: string;
  serviceDescription: string;
  docsUrl: string;
  onClose: () => void;
  onSuccess?: (config: IntegrationConfig) => void;
}

const IntegrationModal: React.FC<IntegrationModalProps> = ({
  isOpen,
  serviceName,
  serviceIcon,
  serviceDescription,
  docsUrl,
  onClose,
  onSuccess,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Load existing integration on mount
  useEffect(() => {
    if (isOpen) {
      const existing = integrationService.getIntegration(serviceName);
      if (existing && existing.apiKey) {
        setApiKey(existing.apiKey);
        setStatus('success');
        setMessage('Already connected');
        setAccountInfo(existing.metadata);
      } else {
        setStatus('idle');
        setMessage('');
        setApiKey('');
        setApiSecret('');
        setAccountInfo(null);
      }
    }
  }, [isOpen, serviceName]);

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setStatus('error');
      setMessage('Please enter your API key');
      return;
    }

    setTesting(true);
    setStatus('idle');

    try {
      let response;
      if (serviceName === 'instantly') {
        response = await integrationService.testInstantlyConnection(apiKey);
      } else {
        // Generic validation for other services
        response = {
          success: integrationService.validateApiKey(apiKey),
          message: 'API key format is valid',
        };
      }

      if (response.success) {
        setStatus('success');
        setMessage(response.message);
        setAccountInfo(response.integration?.metadata);
      } else {
        setStatus('error');
        setMessage(response.error || response.message);
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveIntegration = async () => {
    if (!apiKey.trim()) {
      setStatus('error');
      setMessage('Please enter your API key');
      return;
    }

    setLoading(true);

    try {
      // Test before saving
      let testResponse;
      if (serviceName === 'instantly') {
        testResponse = await integrationService.testInstantlyConnection(apiKey);
      } else {
        testResponse = {
          success: true,
          message: 'Integration saved',
        };
      }

      if (!testResponse.success) {
        setStatus('error');
        setMessage('Failed to validate. Please check your API key.');
        setLoading(false);
        return;
      }

      // Save integration
      const config: IntegrationConfig = {
        id: `${serviceName}-${Date.now()}`,
        service: serviceName,
        status: 'connected',
        apiKey,
        apiSecret: apiSecret || undefined,
        lastTestedAt: new Date().toISOString(),
        metadata: testResponse.integration?.metadata,
      };

      const result = integrationService.saveIntegration(config);

      if (result.success) {
        setStatus('success');
        setMessage('Integration saved successfully!');
        if (onSuccess) {
          onSuccess(config);
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setStatus('error');
        setMessage(result.error || 'Failed to save integration');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-slate-900 border border-slate-700 rounded-xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{serviceIcon}</span>
                <div>
                  <h2 className="text-2xl font-bold text-white capitalize">{serviceName}</h2>
                  <p className="text-sm text-slate-400">{serviceDescription}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Current Status */}
            {status !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
                  status === 'success'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                {status === 'success' ? (
                  <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
                ) : (
                  <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                )}
                <p className={status === 'success' ? 'text-green-200' : 'text-red-200'}>
                  {message}
                </p>
              </motion.div>
            )}

            {/* Account Info (if connected) */}
            {accountInfo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700"
              >
                <h3 className="text-sm font-bold text-slate-300 mb-3">Account Information</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(accountInfo).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-slate-400 capitalize">{key}:</span>
                      <span className="text-white font-mono">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* API Key Input */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-300 mb-2">API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter your ${serviceName} API key`}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 pr-12 text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none transition-colors"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Your API key is stored securely and never shared. Visit{' '}
                <a href={docsUrl} target="_blank" rel="noreferrer" className="text-purple-400 hover:text-purple-300">
                  documentation
                </a>{' '}
                to get your API key.
              </p>
            </div>

            {/* API Secret (if needed) */}
            {serviceName !== 'instantly' && (
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-300 mb-2">API Secret (Optional)</label>
                <div className="relative">
                  <input
                    type={showApiSecret ? 'text' : 'password'}
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="Enter your API secret"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 pr-12 text-white placeholder-slate-600 focus:border-purple-500 focus:outline-none transition-colors"
                  />
                  <button
                    onClick={() => setShowApiSecret(!showApiSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showApiSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="mb-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400 mb-3">📚 Quick Links:</p>
              <div className="space-y-2">
                <a
                  href={docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  → {serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} API Documentation
                </a>
                {serviceName === 'instantly' && (
                  <>
                    <a
                      href="https://app.instantly.ai/settings/api"
                      target="_blank"
                      rel="noreferrer"
                      className="block text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      → Generate API Key in Instantly
                    </a>
                    <a
                      href={INSTANTLY_API_BASE}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      → Instantly API Reference
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleTestConnection}
                disabled={testing || loading || !apiKey.trim()}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {testing ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </button>
              <button
                onClick={handleSaveIntegration}
                disabled={loading || testing || !apiKey.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Integration'
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-3 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 font-semibold rounded-lg transition-all"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntegrationModal;
