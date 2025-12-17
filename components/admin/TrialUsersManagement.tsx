import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Avatar,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Menu,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRowSelectionModel,
  GridToolbar,
} from '@mui/x-data-grid';
import {
  LoginOutlined as ImpersonateIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { User } from '../../types';
import { useAppContext } from '../../context/AppContext';

interface TrialUsersManagementProps {
  onImpersonate?: (user: User) => void;
  onSelectUser?: (user: User) => void;
}

const TrialUsersManagement: React.FC<TrialUsersManagementProps> = ({ onImpersonate }) => {
  const { users, setUsers } = useAppContext();
  const { enqueueSnackbar } = useSnackbar();

  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [statusFilter, setStatusFilter] = useState<User['status'][]>(['trial', 'pending']);
  const [planFilter, setPlanFilter] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; user: User | null } | null>(null);
  const [editDialog, setEditDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });

  // Filter trial users only
  const trialUsers = useMemo(() => {
    return users.filter(u => u.status === 'trial' || u.status === 'pending');
  }, [users]);

  const filteredUsers = useMemo(() => {
    return trialUsers.filter((u) => {
      const statusOk = statusFilter.length ? statusFilter.includes(u.status) : true;
      const planOk = planFilter.length ? planFilter.includes(u.subscriptionPlan) : true;
      return statusOk && planOk;
    });
  }, [trialUsers, statusFilter, planFilter]);

  const handleContextMenu = (event: React.MouseEvent, user: User) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
      user,
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleImpersonate = (user: User) => {
    enqueueSnackbar(`Impersonating ${user.email}`, { variant: 'info' });
    onImpersonate?.(user);
    closeContextMenu();
  };

  const handleEditUser = (user: User) => {
    setEditDialog({ open: true, user });
    closeContextMenu();
  };

  const handleDeleteUser = (user: User) => {
    setUsers(users.filter(u => u.id !== user.id));
    enqueueSnackbar(`User ${user.email} deleted`, { variant: 'success' });
    closeContextMenu();
  };

  const handleActivateTrial = (user: User) => {
    const updatedUser = { ...user, status: 'active' as const, subscriptionStatus: 'active' as const };
    setUsers(users.map(u => (u.id === user.id ? updatedUser : u)));
    enqueueSnackbar(`Trial activated for ${user.email}`, { variant: 'success' });
    closeContextMenu();
  };

  const handleExtendTrial = (user: User) => {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 7);
    const updatedUser = { ...user, nextBillingDate: newExpiry.toISOString() };
    setUsers(users.map(u => (u.id === user.id ? updatedUser : u)));
    enqueueSnackbar(`Trial extended for ${user.email}`, { variant: 'success' });
    closeContextMenu();
  };

  const handleSelectForActions = (user: User) => {
    setContextMenu(null);
    enqueueSnackbar(`Managing infrastructure for ${user.email}`, { variant: 'info' });
    // This will open the admin actions dialog in the parent component
    // Props callback needs to be passed
  };
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
    { field: 'email', headerName: 'Email', width: 240 },
    { field: 'firstName', headerName: 'First Name', width: 140 },
    { field: 'company', headerName: 'Company', width: 160 },
    {
      field: 'subscriptionPlan',
      headerName: 'Plan',
      width: 130,
      renderCell: (params) => <Chip label={params.value} size="small" color="primary" />,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'trial' ? 'warning' : params.value === 'pending' ? 'info' : 'success'}
        />
      ),
    },
    {
      field: 'inboxCount',
      headerName: 'Inboxes',
      width: 100,
      type: 'number',
    },
    {
      field: 'createdAt',
      headerName: 'Joined',
      width: 150,
      valueFormatter: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <Box>
      <Stack direction="row" spacing={2} mb={3} alignItems="center" flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            multiple
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as User['status'][])}
            input={<OutlinedInput label="Status" />}
            renderValue={(selected) => selected.join(', ')}
          >
            {['trial', 'pending', 'active'].map((status) => (
              <MenuItem key={status} value={status}>
                <Checkbox checked={statusFilter.includes(status as User['status'])} />
                <ListItemText primary={status} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Plan</InputLabel>
          <Select
            multiple
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as string[])}
            input={<OutlinedInput label="Plan" />}
            renderValue={(selected) => selected.join(', ')}
          >
            {['starter', 'professional', 'enterprise'].map((plan) => (
              <MenuItem key={plan} value={plan}>
                <Checkbox checked={planFilter.includes(plan)} />
                <ListItemText primary={plan} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="body2" color="text.secondary">
          {filteredUsers.length} trial users
        </Typography>
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

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={closeContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
      >
        <MenuItem onClick={() => contextMenu?.user && handleImpersonate(contextMenu.user)}>
          <ImpersonateIcon fontSize="small" sx={{ mr: 1 }} /> Impersonate
        </MenuItem>
        <MenuItem onClick={() => contextMenu?.user && onSelectUser?.(contextMenu.user)}>
          ⚙️ Manage Infrastructure
        </MenuItem>
        <MenuItem onClick={() => contextMenu?.user && handleEditUser(contextMenu.user)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => contextMenu?.user && handleActivateTrial(contextMenu.user)}>
          ✅ Activate Trial
        </MenuItem>
        <MenuItem onClick={() => contextMenu?.user && handleExtendTrial(contextMenu.user)}>
          ⏱️ Extend Trial
        </MenuItem>
        <MenuItem onClick={() => contextMenu?.user && handleDeleteUser(contextMenu.user)}>
          <DeleteIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} /> Delete
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, user: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Trial User</DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          {editDialog.user && (
            <Stack spacing={2}>
              <TextField
                label="Email"
                fullWidth
                value={editDialog.user.email}
                disabled
              />
              <TextField
                label="First Name"
                fullWidth
                value={editDialog.user.firstName}
                onChange={(e) =>
                  setEditDialog((prev) => ({
                    ...prev,
                    user: prev.user ? { ...prev.user, firstName: e.target.value } : null,
                  }))
                }
              />
              <TextField
                label="Last Name"
                fullWidth
                value={editDialog.user.lastName}
                onChange={(e) =>
                  setEditDialog((prev) => ({
                    ...prev,
                    user: prev.user ? { ...prev.user, lastName: e.target.value } : null,
                  }))
                }
              />
              <TextField
                label="Company"
                fullWidth
                value={editDialog.user.company || ''}
                onChange={(e) =>
                  setEditDialog((prev) => ({
                    ...prev,
                    user: prev.user ? { ...prev.user, company: e.target.value } : null,
                  }))
                }
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editDialog.user.status}
                  label="Status"
                  onChange={(e) =>
                    setEditDialog((prev) => ({
                      ...prev,
                      user: prev.user ? { ...prev.user, status: e.target.value as User['status'] } : null,
                    }))
                  }
                >
                  {['trial', 'pending', 'active', 'suspended'].map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Plan</InputLabel>
                <Select
                  value={editDialog.user.subscriptionPlan}
                  label="Plan"
                  onChange={(e) =>
                    setEditDialog((prev) => ({
                      ...prev,
                      user: prev.user ? { ...prev.user, subscriptionPlan: e.target.value as User['subscriptionPlan'] } : null,
                    }))
                  }
                >
                  {['free', 'starter', 'professional', 'enterprise'].map((plan) => (
                    <MenuItem key={plan} value={plan}>
                      {plan}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, user: null })}>Cancel</Button>
          <Button
            onClick={() => {
              if (editDialog.user) {
                setUsers(users.map((u) => (u.id === editDialog.user!.id ? editDialog.user : u)));
                enqueueSnackbar('User updated', { variant: 'success' });
                setEditDialog({ open: false, user: null });
              }
            }}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrialUsersManagement;
