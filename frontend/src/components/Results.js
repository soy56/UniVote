import React, { useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import ResultsDashboard from './ResultsDashboard';

const Results = ({ candidates, onBack, snapshot, votes = [] }) => {
  const [view, setView] = useState('list');
  const totalVotes = snapshot?.totalVotes || candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0);

  const podium = useMemo(() => {
    const sorted = [...candidates].sort((a, b) => b.voteCount - a.voteCount);
    return {
      winner: sorted[0],
      runners: sorted.slice(1)
    };
  }, [candidates]);

  const getProgress = (votes) => {
    if (!totalVotes) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 4,
          mb: 4,
          background: 'linear-gradient(135deg, rgba(30,64,175,0.85), rgba(15,23,42,0.92))',
          color: '#e2e8f0'
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" spacing={3} justifyContent="space-between">
          <Stack spacing={1.5}>
            <Typography variant="overline" sx={{ letterSpacing: 2, opacity: 0.7 }}>
              Election Snapshot
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {snapshot?.title || 'College Elections'}
            </Typography>
            <Typography variant="body1" sx={{ maxWidth: 560, opacity: 0.85 }}>
              {snapshot?.description || 'Transparent results streaming directly from the blockchain ledger.'}
            </Typography>
            <Chip
              icon={<EmojiEventsIcon />}
              label={`Total Votes Counted: ${totalVotes.toLocaleString()}`}
              sx={{ width: 'fit-content', bgcolor: 'rgba(30,64,175,0.45)', color: '#bfdbfe', fontWeight: 600 }}
            />
          </Stack>
          {podium.winner && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                background: 'rgba(15,23,42,0.65)',
                border: '1px solid rgba(191,219,254,0.22)'
              }}
            >
              <Stack spacing={1.5} alignItems="center">
                <Avatar
                  src={podium.winner.imageUri || undefined}
                  alt={podium.winner.name}
                  sx={{ width: 72, height: 72, fontSize: 28, fontWeight: 700 }}
                >
                  {podium.winner.name.charAt(0)}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {podium.winner.name}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.75, textAlign: 'center' }}>
                  {podium.winner.tagline || 'Leading the polls'}
                </Typography>
                <Chip
                  label={`${podium.winner.voteCount.toLocaleString()} votes (${getProgress(podium.winner.voteCount)}%)`}
                  color="primary"
                  sx={{ fontWeight: 600 }}
                />
              </Stack>
            </Paper>
          )}
        </Stack>
      </Paper>

      {/* View Toggle Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          mb: 3,
          background: 'rgba(15,23,42,0.8)',
          border: '1px solid rgba(148,163,184,0.2)'
        }}
      >
        <Tabs
          value={view}
          onChange={(e, newValue) => setView(newValue)}
          centered
          sx={{
            '& .MuiTab-root': {
              minHeight: 60,
              fontSize: '0.95rem',
              fontWeight: 600,
            }
          }}
        >
          <Tab
            icon={<ListAltIcon />}
            iconPosition="start"
            label="List View"
            value="list"
          />
          <Tab
            icon={<BarChartIcon />}
            iconPosition="start"
            label="Analytics Dashboard"
            value="dashboard"
          />
        </Tabs>
      </Paper>

      {/* Render based on selected view */}
      {view === 'dashboard' ? (
        <ResultsDashboard
          candidates={candidates}
          snapshot={snapshot}
          votes={votes}
        />
      ) : (
        <Grid container spacing={3}>
          {[podium.winner, ...podium.runners].filter(Boolean).map((candidate, index) => (
            <Grid item xs={12} md={6} key={candidate.id}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 4,
                  p: 3,
                  background: 'rgba(15,23,42,0.8)',
                  border: '1px solid rgba(148,163,184,0.2)'
                }}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                  <Avatar
                    src={candidate.imageUri || undefined}
                    alt={candidate.name}
                    sx={{ width: 60, height: 60, fontSize: 24, fontWeight: 700 }}
                  >
                    {candidate.name.charAt(0)}
                  </Avatar>
                  <Box flex={1} sx={{ width: '100%' }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#e2e8f0' }}>
                        {candidate.name}
                      </Typography>
                      {index === 0 && (
                        <Chip size="small" label="Winner" color="success" sx={{ fontWeight: 600 }} />
                      )}
                    </Stack>
                    {candidate.positionId && snapshot?.positions && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#a78bfa',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          display: 'block',
                          mb: 0.5
                        }}
                      >
                        Standing for {snapshot.positions.find(p => p.id === candidate.positionId)?.title || 'General Member'}
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ color: 'rgba(148,163,184,0.85)', mb: 1 }}>
                      {candidate.tagline}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(148,163,184,0.75)', mb: 1 }}>
                      {candidate.voteCount.toLocaleString()} votes — {getProgress(candidate.voteCount)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={getProgress(candidate.voteCount)}
                      sx={{
                        height: 10,
                        borderRadius: 6,
                        bgcolor: 'rgba(30,41,59,0.9)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 6,
                          background: 'linear-gradient(90deg, #60a5fa, #38bdf8)'
                        }
                      }}
                    />
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Divider sx={{ my: 4, borderColor: 'rgba(148,163,184,0.15)' }} />

      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          color="secondary"
          onClick={onBack}
          startIcon={<ArrowBackIcon />}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Back to voting experience
        </Button>
      </Box>
    </Box>
  );
};

export default Results;
