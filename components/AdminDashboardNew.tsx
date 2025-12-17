import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Tooltip,
  Paper,
  Chip,
  Stack,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  AccountBalanceWallet as WalletIcon,
  VpnKey as KeyIcon,
  PlaylistAddCheck as OnboardingIcon,
  HealthAndSafety as HealthIcon,
} from '@mui/icons-material';
import { SnackbarProvider } from 'notistack';
import UserManagementPanel from './admin/UserManagementPanel';
import ActivityLogsPanel from './admin/ActivityLogsPanel';
import AnalyticsDashboard from './admin/AnalyticsDashboard';
import CreditLedgerPanel from './admin/CreditLedgerPanel';
import ApiKeysPanel from './admin/ApiKeysPanel';
import OnboardingStepper from './admin/OnboardingStepper';
import DomainHealthMonitor from './admin/DomainHealthMonitor';
import { useAppContext } from '../context/AppContext';
import kumoMtaService from '../services/kumoMtaService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

type HealthState = 'checking' | 'up' | 'down';

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ py: 4 }}>{children}</Box>}
  </div>
);

const HealthDots: React.FC = () => {
  const [kumo, setKumo] = useState<HealthState>('checking');
  const [cf, setCf] = useState<HealthState>('checking');

  useEffect(() => {
    const check = async () => {
      try {
        const res = await kumoMtaService.checkHealth('http://46.21.157.216:8001');
        setKumo(res.ok ? 'up' : 'down');
      } catch {
        setKumo('down');
      }
      try {
        const doh = await fetch('https://cloudflare-dns.com/dns-query?name=example.com&type=A', {
          headers: { accept: 'application/dns-json' },
        });
        setCf(doh.ok ? 'up' : 'down');
      } catch {
        setCf('down');
      }
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  const renderChip = (label: string, state: HealthState) => (
    <Chip
      label={`${label}: ${state === 'checking' ? 'checking' : state === 'up' ? 'healthy' : 'down'}`}
      size="small"
      color={state === 'up' ? 'success' : state === 'down' ? 'error' : 'info'}
      sx={{ mr: 1 }}
    />
  );

  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
      {renderChip('KumoMTA', kumo)}
      {renderChip('Cloudflare DoH', cf)}
    </Stack>
  );
};

const EventTicker: React.FC = () => {
  const { auditLogs } = useAppContext();
  const events = auditLogs.slice(0, 8);
  return (
    <Box
      sx={{
        display: 'flex',
        overflowX: 'auto',
        gap: 2,
        py: 1,
        px: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
      }}
    >
      {events.map((e) => (
        <Chip
          key={e.id}
          label={`${e.action} :: ${e.targetId || 'system'}`}
          size="small"
          variant="outlined"
          sx={{ flexShrink: 0 }}
        />
      ))}
    </Box>
  );
};

const AdminDashboard: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { impersonationMode } = useAppContext();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleImpersonate = (user: any) => {
    console.log('Impersonating user:', user);
    // In a real app, this would switch to the user's dashboard view
  };

  return (
    <SnackbarProvider 
      maxSnack={3}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      autoHideDuration={3000}
    >
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {impersonationMode && (
          <Box sx={{ bgcolor: 'warning.dark', color: 'black', px: 3, py: 1.5, textAlign: 'center' }}>
            <Typography fontWeight={700}>You are masquerading as a user. Exit to restore your session.</Typography>
          </Box>
        )}
        {/* App Bar */}
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
              <Box sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: 2, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Typography variant="h6" fontWeight="bold" color="white">
                  IG
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  InboxGrove Admin
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  System Management Console
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title="Notifications">
                <IconButton color="inherit">
                  <Badge badgeContent={4} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Tooltip title="Settings">
                <IconButton color="inherit">
                  <SettingsIcon />
                </IconButton>
              </Tooltip>

              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

              <Tooltip title="Account">
                <IconButton onClick={handleMenuOpen}>
                  <Avatar sx={{ width: 36, height: 36 }} src="https://i.pravatar.cc/150?img=1">
                    A
                  </Avatar>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleMenuClose}>
                  <Avatar sx={{ width: 24, height: 24, mr: 2 }} />
                  Profile
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                  <SettingsIcon fontSize="small" sx={{ mr: 2 }} />
                  Settings
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleMenuClose}>
                  <LogoutIcon fontSize="small" sx={{ mr: 2 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 3 }}>
          <Stack spacing={2}>
            <HealthDots />
            <EventTicker />
          </Stack>
        </Container>

        {/* Navigation Tabs */}
        <Paper square elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Container maxWidth="xl">
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab icon={<DashboardIcon />} label="Analytics" iconPosition="start" />
              <Tab icon={<PeopleIcon />} label="User Management" iconPosition="start" />
              <Tab icon={<AssignmentIcon />} label="Activity Logs" iconPosition="start" />
              <Tab icon={<WalletIcon />} label="Credits" iconPosition="start" />
              <Tab icon={<KeyIcon />} label="API Keys" iconPosition="start" />
              <Tab icon={<OnboardingIcon />} label="Onboarding" iconPosition="start" />
              <Tab icon={<HealthIcon />} label="Domain Health" iconPosition="start" />
            </Tabs>
          </Container>
        </Paper>

        {/* Main Content */}
        <Container maxWidth="xl">
          <TabPanel value={currentTab} index={0}>
            <AnalyticsDashboard />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <UserManagementPanel onImpersonate={handleImpersonate} />
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <ActivityLogsPanel />
          </TabPanel>

          <TabPanel value={currentTab} index={3}>
            <CreditLedgerPanel />
          </TabPanel>

          <TabPanel value={currentTab} index={4}>
            <ApiKeysPanel />
          </TabPanel>

          <TabPanel value={currentTab} index={5}>
            <OnboardingStepper />
          </TabPanel>

          <TabPanel value={currentTab} index={6}>
            <DomainHealthMonitor />
          </TabPanel>
        </Container>
      </Box>
    </SnackbarProvider>
  );
};

export default AdminDashboard;
