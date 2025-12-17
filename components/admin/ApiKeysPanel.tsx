import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Typography,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { ApiKey } from '../../types';
import { useAppContext } from '../../context/AppContext';

const allScopes: ApiKey['scopes'] = ['send_email', 'manage_domains', 'manage_users', 'read_only'];

const generateKey = () => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 24; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `sk_live_${out}`;
};

const ApiKeysPanel: React.FC = () => {
  const { apiKeys, addApiKey, revokeApiKey, users, organizations, addAuditLog, currentUser } = useAppContext();
  const { enqueueSnackbar } = useSnackbar();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('New Key');
  const [scopes, setScopes] = useState<ApiKey['scopes']>(['send_email']);
  const [orgId, setOrgId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [showKey, setShowKey] = useState<{ open: boolean; value: string } | null>(null);

  const rows = useMemo(() => apiKeys, [apiKeys]);

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', width: 200 },
    {
      field: 'orgId',
      headerName: 'Org',
      width: 180,
      renderCell: (params) => organizations.find((o) => o.id === params.value)?.name || params.value,
    },
    {
      field: 'userId',
      headerName: 'Owner',
      width: 220,
      renderCell: (params) => users.find((u) => u.id === params.value)?.email || params.value,
    },
    {
      field: 'scopes',
      headerName: 'Scopes',
      width: 240,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} flexWrap="wrap">
          {(params.value as ApiKey['scopes']).map((s: string) => (
            <Chip key={s} label={s} size="small" variant="outlined" />
          ))}
        </Stack>
      ),
    },
    {
      field: 'keyMasked',
      headerName: 'Key',
      width: 180,
    },
    {
      field: 'lastUsed',
      headerName: 'Last Used',
      width: 180,
      valueFormatter: (params) => (params.value ? dayjs(params.value as string).fromNow() : '—'),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 180,
      valueFormatter: (params) => dayjs(params.value as string).format('MMM D, YYYY h:mm A'),
    },
    {
      field: 'revoked',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Revoked' : 'Active'}
          color={params.value ? 'default' : 'success'}
          size="small"
          variant={params.value ? 'outlined' : 'filled'}
        />
      ),
    },
  ];

  const handleCreate = () => {
    if (!name.trim() || !orgId || !userId || scopes.length === 0) {
      enqueueSnackbar('Name, org, user, and scopes are required', { variant: 'error' });
      return;
    }
    const fullKey = generateKey();
    const masked = `sk_live_****${fullKey.slice(-6)}`;
    const newKey: ApiKey = {
      id: `key_${Date.now()}`,
      orgId,
      userId,
      name,
      keyMasked: masked,
      scopes,
      lastUsed: null,
      createdAt: new Date().toISOString(),
      revoked: false,
    };
    addApiKey(newKey);
    addAuditLog({
      id: `audit_${Date.now()}`,
      actorId: currentUser?.id || 'admin',
      action: 'CREATE_API_KEY',
      targetId: newKey.id,
      metadata: { orgId, userId, scopes },
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1',
    });
    setCreateOpen(false);
    setName('New Key');
    setScopes(['send_email']);
    setShowKey({ open: true, value: fullKey });
    enqueueSnackbar('API key created. Copy the full key now.', { variant: 'success' });
  };

  const handleRevoke = (id: string) => {
    revokeApiKey(id);
    addAuditLog({
      id: `audit_${Date.now()}`,
      actorId: currentUser?.id || 'admin',
      action: 'REVOKE_API_KEY',
      targetId: id,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1',
    });
    enqueueSnackbar('API key revoked', { variant: 'info' });
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">API Keys</Typography>
        <Button variant="contained" onClick={() => setCreateOpen(true)} startIcon={<span aria-hidden>＋</span>}>
          New Key
        </Button>
      </Stack>

      <Box sx={{ height: 620 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          disableRowSelectionOnClick
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: { sortModel: [{ field: 'createdAt', sort: 'desc' }] },
          }}
          pageSizeOptions={[25, 50, 100]}
          onCellClick={(params) => {
            if (params.field === 'keyMasked') {
              enqueueSnackbar('Full keys are shown only at creation time', { variant: 'info' });
            }
            if (params.field === 'revoked' && !params.row.revoked) {
              handleRevoke(params.row.id);
            }
          }}
        />
      </Box>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create API Key</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Organization</InputLabel>
              <Select value={orgId} label="Organization" onChange={(e) => setOrgId(e.target.value)}>
                {organizations.map((o) => (
                  <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>User</InputLabel>
              <Select value={userId} label="User" onChange={(e) => setUserId(e.target.value)}>
                {users.slice(0, 100).map((u) => (
                  <MenuItem key={u.id} value={u.id}>{u.email}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Scopes</InputLabel>
              <Select
                multiple
                value={scopes}
                onChange={(e) => setScopes(e.target.value as ApiKey['scopes'])}
                input={<OutlinedInput label="Scopes" />}
                renderValue={(selected) => selected.join(', ')}
              >
                {allScopes.map((scope) => (
                  <MenuItem key={scope} value={scope}>
                    <Checkbox checked={scopes.includes(scope)} />
                    <ListItemText primary={scope} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!showKey?.open} onClose={() => setShowKey(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Copy Your API Key</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" mb={1}>This key is shown only once. Store it securely.</Typography>
          <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider', fontFamily: 'JetBrains Mono, monospace' }}>
            {showKey?.value}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { if (showKey?.value) navigator.clipboard.writeText(showKey.value); }}>Copy</Button>
          <Button onClick={() => setShowKey(null)} variant="contained">Done</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default ApiKeysPanel;
