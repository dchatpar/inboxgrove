import React from 'react';
import {
  Box,
  Chip,
  Typography,
  Stack,
  Card,
  CardContent,
  Avatar,
  Divider,
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAppContext } from '../../context/AppContext';

dayjs.extend(relativeTime);

const ActivityLogsPanel: React.FC = () => {
  const { auditLogs, users } = useAppContext();

  const columns: GridColDef[] = [
    {
      field: 'timestamp',
      headerName: 'Time',
      width: 180,
      valueFormatter: (params: any) => dayjs(params.value).format('MMM D, YYYY h:mm A'),
    },
    {
      field: 'actorId',
      headerName: 'Actor',
      width: 160,
      renderCell: (params) => {
        const user = users.find((u) => u.id === params.value);
        const label = user ? user.email : params.value;
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar sx={{ width: 28, height: 28, fontSize: '0.875rem' }}>
              {label?.[0]?.toUpperCase()}
            </Avatar>
            <Typography variant="body2">{label}</Typography>
          </Stack>
        );
      },
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 180,
      renderCell: (params) => <Chip label={params.value} size="small" variant="outlined" />,
    },
    {
      field: 'targetId',
      headerName: 'Target',
      width: 180,
      renderCell: (params) => {
        const user = users.find((u) => u.id === params.value);
        return <Typography variant="body2">{user ? user.email : params.value || '—'}</Typography>;
      },
    },
    {
      field: 'metadata',
      headerName: 'Metadata',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value ? JSON.stringify(params.value) : '—'}
        </Typography>
      ),
    },
    {
      field: 'ipAddress',
      headerName: 'IP',
      width: 140,
    },
  ];

  const recentLogs = auditLogs.slice(0, 10);

  return (
    <Box>
      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Recent Activity</Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2}>
              {recentLogs.map((log) => (
                <Stack
                  key={log.id}
                  direction="row"
                  spacing={2}
                  alignItems="flex-start"
                  sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.default', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <Chip label={log.action} size="small" variant="outlined" />
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight="medium">
                      {log.targetId || 'system'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(log.timestamp).fromNow()}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {log.ipAddress || '—'}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Box>
          <Typography variant="h6" mb={1.5}>All Audit Logs</Typography>
          <DataGrid
            rows={auditLogs}
            columns={columns}
            disableRowSelectionOnClick
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            pageSizeOptions={[25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              sorting: {
                sortModel: [{ field: 'timestamp', sort: 'desc' }],
              },
            }}
            sx={{ height: 620 }}
            getRowId={(row) => row.id}
          />
        </Box>
      </Stack>
    </Box>
  );
};

export default ActivityLogsPanel;
