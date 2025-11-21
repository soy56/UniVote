import React from 'react';
import {
  Avatar,
  Box,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const StatCard = ({ icon, title, value, subtitle, accent }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: 4,
      height: '100%',
      background: 'linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.92))',
      border: '1px solid rgba(148,163,184,0.12)'
    }}
  >
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Avatar
          sx={{
            bgcolor: accent,
            width: 48,
            height: 48,
            boxShadow: `0 12px 30px ${accent}33`
          }}
        >
          {icon}
        </Avatar>
        <Box>
          <Typography variant="subtitle2" sx={{ color: 'rgba(226,232,240,0.7)', letterSpacing: 0.6 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#e2e8f0' }}>
            {value}
          </Typography>
        </Box>
      </Stack>
      {subtitle && (
        <Typography variant="body2" sx={{ color: 'rgba(148,163,184,0.85)', lineHeight: 1.6 }}>
          {subtitle}
        </Typography>
      )}
    </Stack>
  </Paper>
);

const ElectionStats = ({ snapshot, leadingCandidate, countdown, lastVoteRelative, candidateCount }) => {
  const totalVotes = snapshot?.totalVotes || 0;
  const progress = leadingCandidate && totalVotes > 0 ? (leadingCandidate.voteCount / totalVotes) * 100 : 0;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <StatCard
          icon={<HowToVoteIcon />}
          title="Ballots Counted"
          value={totalVotes.toLocaleString()}
          subtitle={candidateCount ? `${candidateCount} candidates in this race` : 'Awaiting registration'}
          accent="rgba(59,130,246,0.85)"
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            height: '100%',
            background: 'linear-gradient(135deg, rgba(24,51,103,0.95), rgba(12,20,38,0.95))',
            border: '1px solid rgba(147,197,253,0.18)'
          }}
        >
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: 'rgba(16,185,129,0.9)',
                  width: 48,
                  height: 48,
                  boxShadow: '0 12px 30px rgba(16,185,129,0.35)'
                }}
              >
                <EmojiEventsIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ color: 'rgba(209,250,229,0.75)', letterSpacing: 0.6 }}>
                  Projected Leader
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#d1fae5' }}>
                  {leadingCandidate ? leadingCandidate.name : 'Awaiting votes'}
                </Typography>
              </Box>
            </Stack>
            {leadingCandidate && (
              <Box>
                <Typography variant="body2" sx={{ color: 'rgba(148,163,184,0.88)', mb: 1 }}>
                  {leadingCandidate.voteCount.toLocaleString()} votes captured ({progress.toFixed(1)}%)
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(progress, 100)}
                  sx={{
                    height: 10,
                    borderRadius: 6,
                    bgcolor: 'rgba(255,255,255,0.12)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 6,
                      background: 'linear-gradient(90deg, #34d399, #22d3ee)'
                    }
                  }}
                />
              </Box>
            )}
          </Stack>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <StatCard
          icon={<BarChartIcon />}
          title={countdown?.label || 'Timeline'}
          value={countdown?.display || 'No schedule'}
          subtitle={lastVoteRelative ? `Last vote ${lastVoteRelative}` : 'Be the first to cast a vote'}
          accent="rgba(168,85,247,0.85)"
        />
      </Grid>
      <Grid item xs={12}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            background: 'linear-gradient(120deg, rgba(15,23,42,0.95), rgba(30,64,175,0.85))',
            border: '1px solid rgba(191,219,254,0.18)'
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            justifyContent="space-between"
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
            >
              <Avatar sx={{ bgcolor: 'rgba(250,204,21,0.9)' }}>
                <AccessTimeIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                  Real-time turnout intelligence
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.78)' }}>
                  Progress pulses instantly as each verified ballot is committed on-chain.
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ElectionStats;
