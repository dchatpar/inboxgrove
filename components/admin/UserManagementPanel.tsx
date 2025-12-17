import React, { useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  ListItemText,
  Menu,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Typography,
  Checkbox,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRowSelectionModel,
  GridToolbar,
} from '@mui/x-data-grid';
import {
  LoginOutlined as ImpersonateIcon,
  AcUnit as FreezeIcon,
  VisibilityOff as ShadowBanIcon,
  AttachMoney as CreditIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { User } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface UserManagementPanelProps {
  onImpersonate?: (user: User) => void;
}

const reasonCodes = [
  'SERVICE_OUTAGE_REFUND',
  'SALES_BONUS',
  'CHARGEBACK',
  'MANUAL_CORRECTION',
];

const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ onImpersonate }) => {
  const {
    currentUser,
    users,
    organizations,
    setUsers,
    setCurrentUser,
    setCurrentOrg,
    setImpersonationMode,
    addCreditTransaction,
    addAuditLog,
  } = useAppContext();

  const { enqueueSnackbar } = useSnackbar();

  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [statusFilter, setStatusFilter] = useState<User['status'][]>([]);
  const [roleFilter, setRoleFilter] = useState<User['role'][]>([]);
  const [orgFilter, setOrgFilter] = useState<string[]>([]);
  const [creditDialog, setCreditDialog] = useState<{ open: boolean; user: User | null; amount: number; reasonCode: string }>(
    { open: false, user: null, amount: 0, reasonCode: '' }
  );
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; user: User | null } | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const statusOk = statusFilter.length ? statusFilter.includes(u.status) : true;
      const roleOk = roleFilter.length ? roleFilter.includes(u.role) : true;
      const orgOk = orgFilter.length ? orgFilter.includes(u.orgId) : true;
      return statusOk && roleOk && orgOk;
    });
  }, [users, statusFilter, roleFilter, orgFilter]);

  const mutateUser = (userId: string, updates: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updates } : u)));
  };

  const pushAudit = (action: string, target: User) => {
    addAuditLog({
      id: `audit_${Date.now()}`,
      actorId: currentUser?.id || 'admin',
      action,
      targetId: target.id,
      metadata: { orgId: target.orgId },
      timestamp: new Date().toISOString(),
    });
  };

  const handleGhostLogin = (user: User) => {
    const org = organizations.find((o) => o.id === user.orgId) || null;
    setCurrentUser(user);
    setCurrentOrg(org);
    setImpersonationMode(true);
    pushAudit('LOGIN_AS_USER', user);
    enqueueSnackbar(`Ghost login as ${user.email}`, { variant: 'info' });
    if (onImpersonate) onImpersonate(user);
  };

  const handleFreeze = (user: User) => {
    mutateUser(user.id, { status: 'suspended' });
    pushAudit('FREEZE_ACCOUNT', user);
    enqueueSnackbar(`Frozen MTA for ${user.email}`, { variant: 'warning' });
  };

  const handleShadowBan = (user: User) => {
    mutateUser(user.id, { status: 'shadow_banned' });
    pushAudit('SHADOW_BAN', user);
    enqueueSnackbar(`Shadow banned ${user.email}`, { variant: 'info' });
  };

  const handleCreditDialogOpen = (user: User) => {
    setCreditDialog({ open: true, user, amount: 0, reasonCode: '' });
  };

  const handleCreditSave = () => {
    if (!creditDialog.user || creditDialog.amount === 0 || !creditDialog.reasonCode) {
      enqueueSnackbar('Amount and reason code are required', { variant: 'error' });
      return;
    }
    const { user, amount, reasonCode } = creditDialog;
    mutateUser(user.id, { credits: user.credits + amount });
    addCreditTransaction({
      id: `txn_${Date.now()}`,
      orgId: user.orgId,
      userId: user.id,
      userEmail: user.email,
      amount,
      type: 'admin_adjustment',
      description: amount > 0 ? 'Admin credit add' : 'Admin credit deduct',
      reasonCode,
      timestamp: new Date().toISOString(),
    });
    pushAudit('ADJUST_CREDITS', user);
    enqueueSnackbar(`${amount > 0 ? 'Added' : 'Deducted'} ${Math.abs(amount)} credits`, { variant: 'success' });
    setCreditDialog({ open: false, user: null, amount: 0, reasonCode: '' });
  };

  const handleContextMenu = (event: React.MouseEvent, user: User) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      user,
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  const columns: GridColDef[] = [
    {
      field: 'avatar',
      headerName: '',
      width: 64,
      sortable: false,
      renderCell: (params) => (
        <Avatar src={params.row.avatar}>{params.row.firstName?.[0]}</Avatar>
      ),
    },
    {
      field: 'org',
      headerName: 'Org Name',
      width: 180,
      valueGetter: (params) => organizations.find((o) => o.id === params.row.orgId)?.name || '—',
    },
    { field: 'email', headerName: 'Owner Email', width: 240 },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      renderCell: (params) => <Chip label={params.value} size="small" />,
    },
    {
      field: 'subscriptionPlan',
      headerName: 'Plan Tier',
      width: 130,
      renderCell: (params) => <Chip label={params.value} size="small" />,
    },
    {
      field: 'credits',
      headerName: 'Credit Balance',
      width: 150,
      type: 'number',
      renderCell: (params) => (
        <Typography fontWeight={700} color={params.value < 100 ? 'error.main' : 'inherit'}>
          {params.value.toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'risk',
      headerName: 'Risk Score',
      width: 120,
      valueGetter: (params) => organizations.find((o) => o.id === params.row.orgId)?.riskScore ?? 50,
      renderCell: (params) => (
        <Chip
          label={`${params.value}`}
          size="small"
          color={params.value > 80 ? 'error' : params.value > 60 ? 'warning' : 'success'}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === 'active'
              ? 'success'
              : params.value === 'suspended'
              ? 'error'
              : params.value === 'shadow_banned'
              ? 'warning'
              : 'default'
          }
        />
      ),
    },
  ];

  return (
    <Box>
      <Stack direction="row" spacing={2} mb={3} alignItems="center" flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status Filter</InputLabel>
          <Select
            multiple
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as User['status'][])}
            input={<OutlinedInput label="Status Filter" />}
            renderValue={(selected) => selected.join(', ')}
          >
            {['active', 'suspended', 'shadow_banned', 'pending', 'trial'].map((status) => (
              <MenuItem key={status} value={status}>
                <Checkbox checked={statusFilter.includes(status as User['status'])} />
                <ListItemText primary={status} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Role Filter</InputLabel>
          <Select
            multiple
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as User['role'][])}
            input={<OutlinedInput label="Role Filter" />}
            renderValue={(selected) => selected.join(', ')}
          >
            {['owner', 'admin', 'viewer', 'user', 'agency'].map((role) => (
              <MenuItem key={role} value={role}>
                <Checkbox checked={roleFilter.includes(role as User['role'])} />
                <ListItemText primary={role} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Organization</InputLabel>
          <Select
            multiple
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value as string[])}
            input={<OutlinedInput label="Organization" />}
            renderValue={(selected) =>
              selected
                .map((orgId) => organizations.find((o) => o.id === orgId)?.name || orgId)
                .join(', ')
            }
          >
            {organizations.map((org) => (
              <MenuItem key={org.id} value={org.id}>
                <Checkbox checked={orgFilter.includes(org.id)} />
                <ListItemText primary={org.name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Box sx={{ height: 720 }}>
        <DataGrid
          rows={filteredUsers}
          columns={columns}
          getRowId={(row) => row.id}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          checkboxSelection
          onRowSelectionModelChange={(selection) => setSelectedRows(selection)}
          rowSelectionModel={selectedRows}
          onCellContextMenu={(params, event) => handleContextMenu(event as React.MouseEvent, params.row)}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        />
      </Box>

      <Menu
        open={contextMenu !== null}
        onClose={closeContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
      >
        <MenuItem onClick={() => { if (contextMenu?.user) handleGhostLogin(contextMenu.user); closeContextMenu(); }}>
          <ImpersonateIcon fontSize="small" sx={{ mr: 1 }} /> Ghost Login
        </MenuItem>
        <MenuItem onClick={() => { if (contextMenu?.user) handleFreeze(contextMenu.user); closeContextMenu(); }}>
          <FreezeIcon fontSize="small" sx={{ mr: 1 }} /> Freeze MTA
        </MenuItem>
        <MenuItem onClick={() => { if (contextMenu?.user) handleShadowBan(contextMenu.user); closeContextMenu(); }}>
          <ShadowBanIcon fontSize="small" sx={{ mr: 1 }} /> Shadow Ban
        </MenuItem>
        <MenuItem onClick={() => { if (contextMenu?.user) handleCreditDialogOpen(contextMenu.user); closeContextMenu(); }}>
          <CreditIcon fontSize="small" sx={{ mr: 1 }} /> Credit Adjustment
        </MenuItem>
      </Menu>

      <Dialog open={creditDialog.open} onClose={() => setCreditDialog({ ...creditDialog, open: false })} maxWidth="xs" fullWidth>
        <DialogTitle>Credit Adjustment</DialogTitle>
        <DialogContent dividers>
          {creditDialog.user && (
            <Typography variant="body2" color="text.secondary" mb={2}>
              {creditDialog.user.email} — Current balance: {creditDialog.user.credits.toLocaleString()}
            </Typography>
          )}
          <Stack spacing={2}>
            <TextField
              label="Amount (positive add, negative deduct)"
              type="number"
              fullWidth
              value={creditDialog.amount}
              onChange={(e) => setCreditDialog((prev) => ({ ...prev, amount: Number(e.target.value) }))}
            />
            <FormControl fullWidth required>
              <InputLabel>Reason Code</InputLabel>
              <Select
                value={creditDialog.reasonCode}
                label="Reason Code"
                onChange={(e) => setCreditDialog((prev) => ({ ...prev, reasonCode: e.target.value }))}
              >
                {reasonCodes.map((code) => (
                  <MenuItem key={code} value={code}>{code}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreditDialog({ open: false, user: null, amount: 0, reasonCode: '' })}>Cancel</Button>
          <Button onClick={handleCreditSave} variant="contained" startIcon={<CreditIcon />}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagementPanel;