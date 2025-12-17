import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  People,
  Email,
  AttachMoney,
  Speed,
} from '@mui/icons-material';
import { SystemMetrics } from '../../types';
import { getMockData } from '../../services/mockDataService';

const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);

  useEffect(() => {
    const data = getMockData();
    setMetrics(data.systemMetrics);
  }, []);

  // Sample data for charts
  const emailsData = Array.from({ length: 30 }, (_, i) => ({
    day: `Day ${i + 1}`,
    sent: Math.floor(Math.random() * 10000) + 5000,
    delivered: Math.floor(Math.random() * 9500) + 4500,
    opened: Math.floor(Math.random() * 5000) + 2000,
    clicked: Math.floor(Math.random() * 2000) + 500,
  }));

  const revenueData = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    revenue: Math.floor(Math.random() * 50000) + 30000,
    users: Math.floor(Math.random() * 200) + 100,
  }));

  const usersByPlan = [
    { name: 'Free', value: 45, color: '#94a3b8' },
    { name: 'Starter', value: 25, color: '#3b82f6' },
    { name: 'Growth', value: 18, color: '#8b5cf6' },
    { name: 'Agency', value: 8, color: '#ec4899' },
    { name: 'Enterprise', value: 4, color: '#f59e0b' },
  ];

  const healthScoreData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    score: 95 + Math.random() * 4,
  }));

  const StatCard = ({ title, value, change, icon: Icon, trend }: any) => (
    <Card>
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">{title}</Typography>
            <Icon fontSize="small" color="primary" />
          </Stack>
          <Typography variant="h4" fontWeight="bold">{value}</Typography>
          {change && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              {trend === 'up' ? (
                <TrendingUp fontSize="small" color="success" />
              ) : (
                <TrendingDown fontSize="small" color="error" />
              )}
              <Typography variant="caption" color={trend === 'up' ? 'success.main' : 'error.main'}>
                {change}
              </Typography>
              <Typography variant="caption" color="text.secondary">vs last month</Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  if (!metrics) return <LinearProgress />;

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Top Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={metrics.totalUsers.toLocaleString()}
            change="+12.5%"
            icon={People}
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Emails Sent (24h)"
            value={metrics.emailsSent24h.toLocaleString()}
            change="+8.3%"
            icon={Email}
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Revenue (Month)"
            value={`$${(metrics.revenueMonth / 1000).toFixed(1)}K`}
            change="+23.1%"
            icon={AttachMoney}
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Health Score"
            value={`${metrics.avgHealthScore.toFixed(1)}%`}
            change="+0.4%"
            icon={Speed}
            trend="up"
          />
        </Grid>

        {/* Email Performance Chart */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Email Performance (Last 30 Days)</Typography>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={emailsData}>
                  <defs>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="sent" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSent)" />
                  <Area type="monotone" dataKey="delivered" stroke="#10b981" fillOpacity={1} fill="url(#colorDelivered)" />
                  <Line type="monotone" dataKey="opened" stroke="#8b5cf6" strokeWidth={2} />
                  <Line type="monotone" dataKey="clicked" stroke="#f59e0b" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Users by Plan */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Users by Plan</Typography>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={usersByPlan}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}%`}
                  >
                    {usersByPlan.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue Trends */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Revenue & User Growth</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis yAxisId="left" stroke="#94a3b8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue ($)" />
                  <Bar yAxisId="right" dataKey="users" fill="#10b981" name="New Users" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Health Score Timeline */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Health Score (24h)</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={healthScoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="hour" stroke="#94a3b8" />
                  <YAxis domain={[90, 100]} stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* System Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>System Status</Typography>
              <Grid container spacing={3} mt={1}>
                <Grid item xs={12} sm={6} md={3}>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">API Response Time</Typography>
                    <Typography variant="h5" fontWeight="bold">125ms</Typography>
                    <LinearProgress variant="determinate" value={85} color="success" />
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">System Uptime</Typography>
                    <Typography variant="h5" fontWeight="bold">{metrics.systemUptime.toFixed(2)}%</Typography>
                    <LinearProgress variant="determinate" value={metrics.systemUptime} color="success" />
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">Server Load</Typography>
                    <Typography variant="h5" fontWeight="bold">42%</Typography>
                    <LinearProgress variant="determinate" value={42} color="warning" />
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">Database Usage</Typography>
                    <Typography variant="h5" fontWeight="bold">67%</Typography>
                    <LinearProgress variant="determinate" value={67} color="info" />
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard;
