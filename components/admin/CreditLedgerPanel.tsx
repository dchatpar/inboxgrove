import React, { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Typography,
  Checkbox,
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { useAppContext } from '../../context/AppContext';

const CreditLedgerPanel: React.FC = () => {
  const { creditLedger, users, organizations } = useAppContext();
  const [orgFilter, setOrgFilter] = useState<string[]>([]);
  const [userFilter, setUserFilter] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return creditLedger.filter((txn) => {
      const orgOk = orgFilter.length ? orgFilter.includes(txn.orgId) : true;
      const userOk = userFilter.length ? userFilter.includes(txn.userId) : true;
      return orgOk && userOk;
    });
  }, [creditLedger, orgFilter, userFilter]);

  const totals = useMemo(() => {
    const net = filtered.reduce((sum, t) => sum + t.amount, 0);
    const additions = filtered.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const deductions = filtered.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
    return { net, additions, deductions };
  }, [filtered]);

  const columns: GridColDef[] = [
    {
      field: 'timestamp',
      headerName: 'Time',
      width: 180,
      valueFormatter: (params) => dayjs(params.value as string).format('MMM D, YYYY h:mm A'),
    },
    {
      field: 'orgId',
      headerName: 'Organization',
      width: 200,
      renderCell: (params) => organizations.find((o) => o.id === params.value)?.name || params.value,
    },
    {
      field: 'userEmail',
      headerName: 'User',
      width: 220,
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 130,
      type: 'number',
      renderCell: (params) => (
        <Typography fontWeight={700} color={params.value > 0 ? 'success.main' : 'error.main'}>
          {params.value > 0 ? '+' : ''}{params.value.toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 160,
      renderCell: (params) => <Chip label={params.value} size="small" variant="outlined" />,
    },
    {
      field: 'reasonCode',
      headerName: 'Reason',
      width: 200,
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 200,
    },
  ];

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Organization</InputLabel>
          <Select
            multiple
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value as string[])}
            input={<OutlinedInput label="Organization" />}
            renderValue={(selected) => selected.map((id) => organizations.find((o) => o.id === id)?.name || id).join(', ')}
          >
            {organizations.map((org) => (
              <MenuItem key={org.id} value={org.id}>
                <Checkbox checked={orgFilter.includes(org.id)} />
                <ListItemText primary={org.name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>User</InputLabel>
          <Select
            multiple
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value as string[])}
            input={<OutlinedInput label="User" />}
            renderValue={(selected) => selected.map((id) => users.find((u) => u.id === id)?.email || id).join(', ')}
          >
            {users.slice(0, 100).map((user) => (
              <MenuItem key={user.id} value={user.id}>
                <Checkbox checked={userFilter.includes(user.id)} />
                <ListItemText primary={user.email} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Stack direction="row" spacing={2} flexWrap="wrap">
        <Card sx={{ minWidth: 240 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Net Change</Typography>
            <Typography variant="h5" fontWeight={700} color={totals.net >= 0 ? 'success.main' : 'error.main'}>
              {totals.net >= 0 ? '+' : ''}{totals.net.toLocaleString()}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 240 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Credits Added</Typography>
            <Typography variant="h5" fontWeight={700} color="success.main">+{totals.additions.toLocaleString()}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 240 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Usage / Deductions</Typography>
            <Typography variant="h5" fontWeight={700} color="error.main">{totals.deductions.toLocaleString()}</Typography>
          </CardContent>
        </Card>
      </Stack>

      <Box sx={{ height: 640 }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          disableRowSelectionOnClick
          getRowId={(row) => row.id}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: { sortModel: [{ field: 'timestamp', sort: 'desc' }] },
          }}
          pageSizeOptions={[25, 50, 100]}
        />
      </Box>
    </Stack>
  );
};

export default CreditLedgerPanel;