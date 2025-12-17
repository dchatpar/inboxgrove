import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';

const steps = [
  { id: 'domain', label: 'Connect Domain', detail: 'Validate DNS + fetch DKIM' },
  { id: 'infra', label: 'Provision Infrastructure', detail: 'KumoMTA + Cloudflare apply' },
  { id: 'warmup', label: 'Start Warmup', detail: 'Enable warmup flows and monitors' },
];

const OnboardingStepper: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const addLog = (msg: string) => {
    setLogs((prev) => [`${dayjs().format('HH:mm:ss')}  ${msg}`, ...prev].slice(0, 40));
  };

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 8 + Math.random() * 6);
        if (next >= 100) {
          addLog(`Step ${activeStep + 1} complete: ${steps[activeStep].label}`);
          setActiveStep((s) => Math.min(s + 1, steps.length));
          setRunning(false);
          return 100;
        }
        return next;
      });
    }, 900);
    return () => clearInterval(timer);
  }, [running, activeStep]);

  useEffect(() => {
    setProgress(activeStep >= steps.length ? 100 : 0);
  }, [activeStep]);

  const status = useMemo(() => {
    if (activeStep >= steps.length) return 'Done';
    if (running) return 'In progress';
    return 'Paused';
  }, [activeStep, running]);

  const handleStart = () => {
    if (activeStep >= steps.length) return;
    setRunning(true);
    addLog(`Starting ${steps[activeStep].label}…`);
  };

  const handleReset = () => {
    setActiveStep(0);
    setProgress(0);
    setLogs([]);
    setRunning(false);
  };

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Onboarding Runbook</Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={handleReset} disabled={running}>Reset</Button>
              <Button variant="contained" onClick={handleStart} disabled={running || activeStep >= steps.length}>
                {activeStep >= steps.length ? 'Completed' : running ? 'Running' : 'Run Step'}
              </Button>
            </Stack>
          </Stack>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Status: {status}
          </Typography>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((step) => (
              <Step key={step.id}>
                <StepLabel>{step.label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {activeStep < steps.length ? steps[activeStep].detail : 'All steps complete'}
            </Typography>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>Live Terminal</Typography>
          <Box
            sx={{
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              minHeight: 220,
              maxHeight: 320,
              overflow: 'auto',
              p: 2,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.85rem',
            }}
          >
            {logs.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Waiting for run…</Typography>
            ) : (
              <Stack spacing={1}>
                {logs.map((log, idx) => (
                  <Box key={idx}>{log}</Box>
                ))}
              </Stack>
            )}
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default OnboardingStepper;
