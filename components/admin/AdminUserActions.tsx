import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  Chip,
  Typography,
  LinearProgress,
} from '@mui/material';
import {
  CloudFlare as CloudflareIcon,
  Storage as DomainIcon,
  Settings as ProvisionIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import cloudflareService from '../../services/cloudflareService';
import kumoMtaService from '../../services/kumoMtaService';
import { User } from '../../types';

interface AdminUserActionsProps {
  user: User | null;
  onClose: () => void;
}

const AdminUserActions: React.FC<AdminUserActionsProps> = ({ user, onClose }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [action, setAction] = useState<'domains' | 'cloudflare' | 'provisioning' | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Domain form
  const [domain, setDomain] = useState('');
  const [selector1, setSelector1] = useState('s1');
  const [selector2, setSelector2] = useState('s2');

  // Cloudflare form
  const [cfToken, setCfToken] = useState('');
  const [cfZoneId, setCfZoneId] = useState('');

  // KumoMTA form
  const [kumoBaseUrl, setKumoBaseUrl] = useState('http://46.21.157.216:8001');
  const [kumoApiKey, setKumoApiKey] = useState('14456a6f18f952990da9e2a3e5d401d8cd321a0f4c8457843eaf6d91dca15f4a');

  if (!user) return null;

  const handleAddDomain = async () => {
    if (!domain.trim()) {
      setStatus({ type: 'error', message: 'Domain is required' });
      return;
    }
    setLoading(true);
    try {
      // Simulate domain addition
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStatus({ type: 'success', message: `Domain ${domain} added for ${user.email}` });
      enqueueSnackbar(`Domain added for ${user.email}`, { variant: 'success' });
      setDomain('');
      setTimeout(() => setAction(null), 2000);
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message || 'Failed to add domain' });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectCloudflare = async () => {
    if (!cfToken.trim()) {
      setStatus({ type: 'error', message: 'Cloudflare token is required' });
      return;
    }
    setLoading(true);
    try {
      const creds = { apiToken: cfToken };
      const zones = await cloudflareService.findZoneByName(domain || 'example.com', creds);
      if (zones.ok) {
        setStatus({ type: 'success', message: `Connected to Cloudflare for ${user.email}` });
        enqueueSnackbar('Cloudflare connected', { variant: 'success' });
        setTimeout(() => setAction(null), 2000);
      } else {
        throw new Error(zones.error);
      }
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message || 'Failed to connect Cloudflare' });
    } finally {
      setLoading(false);
    }
  };

  const handleProvisionInfrastructure = async () => {
    setLoading(true);
    try {
      const creds = { baseUrl: kumoBaseUrl, apiKey: kumoApiKey };
      
      // Create domain
      await kumoMtaService.createDomain({ domain: domain || 'default.com', selector: selector1 }, creds);
      
      // Generate DKIM
      await kumoMtaService.generateDkim({ domain: domain || 'default.com', selector: selector1, key_size: 2048 }, creds);
      
      // Get DNS records
      const dnsRecords = await kumoMtaService.getDnsRecords(domain || 'default.com', ['46.21.157.216'], creds);
      
      // Create user
      const username = `${user.email.split('@')[0]}_${Date.now()}`;
      const password = `Pwd${Math.random().toString(36).slice(2, 10)}!`;
      await kumoMtaService.createUser({ username, password, email: user.email }, creds);
      
      // Reload
      await kumoMtaService.reloadConfig(creds);
      
      setStatus({ 
        type: 'success', 
        message: `Infrastructure provisioned for ${user.email}\nUsername: ${username}\nPassword: ${password}` 
      });
      enqueueSnackbar('Infrastructure provisioned', { variant: 'success' });
      setTimeout(() => setAction(null), 3000);
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message || 'Failed to provision infrastructure' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={action !== null} onClose={() => { setAction(null); setStatus(null); }} maxWidth="sm" fullWidth>
      <DialogTitle>
        Manage {user.email}
        <Chip label={user.subscriptionPlan} size="small" sx={{ ml: 2 }} />
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        {status && (
          <Alert
            severity={status.type}
            icon={status.type === 'success' ? <SuccessIcon /> : <ErrorIcon />}
            sx={{ mb: 2 }}
          >
            {status.message}
          </Alert>
        )}

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {action === 'domains' && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Add a new domain for {user.email}
            </Typography>
            <TextField
              label="Domain"
              placeholder="example.com"
              fullWidth
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={loading}
            />
            <TextField
              label="Selector 1"
              fullWidth
              value={selector1}
              onChange={(e) => setSelector1(e.target.value)}
              disabled={loading}
            />
            <TextField
              label="Selector 2"
              fullWidth
              value={selector2}
              onChange={(e) => setSelector2(e.target.value)}
              disabled={loading}
            />
          </Stack>
        )}

        {action === 'cloudflare' && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Connect Cloudflare to automate DNS for {user.email}
            </Typography>
            <TextField
              label="Cloudflare API Token"
              type="password"
              fullWidth
              value={cfToken}
              onChange={(e) => setCfToken(e.target.value)}
              disabled={loading}
            />
            <TextField
              label="Zone ID (optional)"
              fullWidth
              value={cfZoneId}
              onChange={(e) => setCfZoneId(e.target.value)}
              disabled={loading}
              helperText="Leave empty to auto-detect"
            />
          </Stack>
        )}

        {action === 'provisioning' && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Provision KumoMTA infrastructure for {user.email}
            </Typography>
            <TextField
              label="KumoMTA Base URL"
              fullWidth
              value={kumoBaseUrl}
              onChange={(e) => setKumoBaseUrl(e.target.value)}
              disabled={loading}
            />
            <TextField
              label="KumoMTA API Key"
              type="password"
              fullWidth
              value={kumoApiKey}
              onChange={(e) => setKumoApiKey(e.target.value)}
              disabled={loading}
            />
            <TextField
              label="Domain"
              placeholder="example.com"
              fullWidth
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              disabled={loading}
            />
            <Alert severity="info">
              This will create domain, generate DKIM, add DNS records, and provision SMTP user
            </Alert>
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={() => { setAction(null); setStatus(null); }} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={
            action === 'domains'
              ? handleAddDomain
              : action === 'cloudflare'
              ? handleConnectCloudflare
              : handleProvisionInfrastructure
          }
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Proceed'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminUserActions;
