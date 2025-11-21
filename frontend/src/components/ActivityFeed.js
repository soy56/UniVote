import React from 'react';
import dayjs from 'dayjs';
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import BoltIcon from '@mui/icons-material/Bolt';
import PersonIcon from '@mui/icons-material/Person';

const gradientPalette = [
  'linear-gradient(135deg, #60a5fa, #a78bfa)',
  'linear-gradient(135deg, #34d399, #22d3ee)',
  'linear-gradient(135deg, #f472b6, #fb7185)',
  'linear-gradient(135deg, #fde68a, #fbbf24)'
];

const ActivityFeed = ({ activity, onRefresh, now }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: 4,
      p: 3,
      background: 'rgba(15,23,42,0.85)',
      border: '1px solid rgba(148,163,184,0.15)',
      backdropFilter: 'blur(14px)'
    }}
  >
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      justifyContent="space-between"
      sx={{ mb: 2, gap: { xs: 1, sm: 0 } }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700, color: '#e2e8f0' }}>
        Live Ballot Activity
      </Typography>
      <Tooltip title="Refresh">
        <IconButton
          onClick={onRefresh}
          size="small"
          sx={{ color: 'rgba(148,163,184,0.9)', alignSelf: { xs: 'flex-end', sm: 'center' } }}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>

    <Divider sx={{ mb: 2, borderColor: 'rgba(148,163,184,0.12)' }} />

    {activity.length === 0 ? (
      <Box sx={{ textAlign: 'center', py: 6, color: 'rgba(148,163,184,0.7)' }}>
        <BoltIcon sx={{ fontSize: 48, mb: 1, color: 'rgba(96,165,250,0.6)' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          No votes just yet
        </Typography>
        <Typography variant="body2">
          Cast the first ballot and kickstart the energy.
        </Typography>
      </Box>
    ) : (
      <List sx={{ maxHeight: 340, overflow: 'auto', pr: 1 }}>
        {activity.map((item, index) => {
          const when = item.timestamp ? dayjs(item.timestamp) : null;
          const relative = when && now ? `${now.to(when, true)} ago` : 'Just now';
          return (
            <ListItem key={item.id || `${index}`} alignItems="flex-start" sx={{ px: 1 }}>
              <ListItemAvatar>
                <Avatar
                  sx={{
                    background: gradientPalette[index % gradientPalette.length],
                    color: '#0f172a',
                    fontWeight: 700
                  }}
                >
                  {item.candidateName ? item.candidateName.charAt(0).toUpperCase() : <PersonIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
                      {item.candidateName || 'A candidate'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.8)' }}>
                      {relative}
                    </Typography>
                  </Stack>
                }
                secondary={
                  <Typography variant="body2" sx={{ color: 'rgba(148,163,184,0.75)' }}>
                    {item.candidateName
                      ? `Ballot from ${item.voterName || 'Anonymous voter'}`
                      : `${item.voterName || 'Anonymous voter'} cast a ballot`
                    }
                  </Typography>
                }
              />
            </ListItem>
          );
        })}
      </List>
    )}
  </Paper>
);

export default ActivityFeed;
