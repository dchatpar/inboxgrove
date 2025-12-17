import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Card, CardContent, Chip, Grid, LinearProgress, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAppContext } from '../../context/AppContext';
import { queryTxt } from '../../services/dnsVerifyService';
import kumoMtaService from '../../services/kumoMtaService';

dayjs.extend(relativeTime);

type DomainStatus = {
  domain: string;
  spf: boolean;
  dmarc: boolean;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  checkedAt: string;
};

const DomainHealthMonitor: React.FC = () => {
  const { users } = useAppContext();
  const [statuses, setStatuses] = useState<DomainStatus[]>([]);
  const [kumoUp, setKumoUp] = useState<'checking' | 'up' | 'down'>('checking');

  const domains = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      const parts = u.email.split('@');
      if (parts[1]) set.add(parts[1]);
    });
    return Array.from(set).slice(0, 5);
  }, [users]);

  useEffect(() => {
    const poll = async () => {
      try {
        const health = await kumoMtaService.checkHealth('http://46.21.157.216:8001');
        setKumoUp(health.ok ? 'up' : 'down');
      } catch {
        setKumoUp('down');
      }

      const results: DomainStatus[] = [];
      for (const domain of domains) {
        try {
          const spf = await queryTxt(domain);
          const dmarc = await queryTxt(`_dmarc.${domain}`);
          const spfOk = spf.values.some((v) => v.startsWith('v=spf1'));
          const dmarcOk = dmarc.values.some((v) => v.startsWith('v=DMARC1'));
          const healthy = spfOk && dmarcOk;
          results.push({
            domain,
            spf: spfOk,
            dmarc: dmarcOk,
            status: healthy ? 'healthy' : spfOk || dmarcOk ? 'warning' : 'error',
            message: healthy ? 'SPF + DMARC present' : spfOk || dmarcOk ? 'Partial DNS present' : 'Records missing',
            checkedAt: new Date().toISOString(),
          });
        } catch {
          results.push({
            domain,
            spf: false,
            dmarc: false,
            status: 'error',
            message: 'Lookup failed',
            checkedAt: new Date().toISOString(),
          });
        }
      }
      setStatuses(results);
    };

    poll();
    const id = setInterval(poll, 45000);
    return () => clearInterval(id);
  }, [domains]);

  const healthyCount = statuses.filter((s) => s.status === 'healthy').length;
  const warningCount = statuses.filter((s) => s.status === 'warning').length;
  const errorCount = statuses.filter((s) => s.status === 'error').length;

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Chip label={`Healthy: ${healthyCount}`} color="success" />
        <Chip label={`Warning: ${warningCount}`} color="warning" />
        <Chip label={`Error: ${errorCount}`} color="error" />
        <Chip
          label={`KumoMTA: ${kumoUp === 'checking' ? 'checking' : kumoUp === 'up' ? 'up' : 'down'}`}
          color={kumoUp === 'up' ? 'success' : kumoUp === 'down' ? 'error' : 'info'}
        />
      </Stack>

      <Grid container spacing={2}>
        {statuses.map((s) => (
          <Grid item xs={12} md={6} key={s.domain}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">{s.domain}</Typography>
                  <Chip
                    label={s.status === 'healthy' ? 'Healthy' : s.status === 'warning' ? 'Partial' : 'Needs Fix'}
                    color={s.status === 'healthy' ? 'success' : s.status === 'warning' ? 'warning' : 'error'}
                    size="small"
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary" mt={1} mb={2}>
                  {s.message}
                </Typography>
                <Stack direction="row" spacing={1} mb={1}>
                  <Chip label={`SPF ${s.spf ? 'OK' : 'Missing'}`} color={s.spf ? 'success' : 'error'} size="small" />
                  <Chip label={`DMARC ${s.dmarc ? 'OK' : 'Missing'}`} color={s.dmarc ? 'success' : 'error'} size="small" />
                </Stack>
                <Typography variant="caption" color="text.secondary">Checked {dayjs(s.checkedAt).fromNow()}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {statuses.length === 0 && <LinearProgress />}

      {errorCount > 0 && (
        <Alert severity="warning" variant="outlined">
          Some domains are missing SPF/DMARC. Apply DNS fixes or rerun automation.
        </Alert>
      )}
    </Stack>
  );
};

export default DomainHealthMonitor;
