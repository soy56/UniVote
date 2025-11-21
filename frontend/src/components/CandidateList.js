import React, { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HowToVoteIcon from '@mui/icons-material/HowToVote';

const gradients = [
  'linear-gradient(135deg, rgba(59,130,246,0.28), rgba(147,197,253,0.18))',
  'linear-gradient(135deg, rgba(236,72,153,0.3), rgba(244,114,182,0.14))',
  'linear-gradient(135deg, rgba(16,185,129,0.34), rgba(45,212,191,0.16))',
  'linear-gradient(135deg, rgba(234,179,8,0.34), rgba(251,191,36,0.16))'
];

const CandidateList = ({
  candidates,
  hasVoted,
  onVote,
  pendingCandidateId,
  isVotingOpen,
  phaseLabel,
  onShowResults,
  totalVotes,
  positionTitle
}) => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('momentum');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const base = term
      ? candidates.filter((candidate) =>
        [candidate.name, candidate.tagline, candidate.manifesto]
          .join(' ')
          .toLowerCase()
          .includes(term)
      )
      : candidates;

    const sorted = [...base];
    if (sortKey === 'momentum') {
      sorted.sort((a, b) => b.voteCount - a.voteCount);
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [candidates, search, sortKey]);

  const canVote = isVotingOpen && !hasVoted;

  return (
    <Box>
      {!isVotingOpen && (
        <Alert
          severity={phaseLabel === 'Ended' ? 'info' : 'warning'}
          sx={{ mb: 3, borderRadius: 3, bgcolor: 'rgba(254, 243, 199, 0.04)' }}
        >
          {phaseLabel === 'Ended'
            ? 'This election is closed. Explore the results below.'
            : 'Voting is currently locked until the scheduled launch window.'}
        </Alert>
      )}

      {hasVoted && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }} icon={<HowToVoteIcon fontSize="small" />}>
          Your ballot is recorded. Thank you for shaping campus leadership!
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          mb: 4,
          background: 'rgba(15,23,42,0.85)',
          border: '1px solid rgba(148,163,184,0.15)'
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          sx={{ gap: { xs: 2, md: 0 } }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ width: { xs: '100%', md: 'auto' }, flexWrap: 'wrap', gap: 1 }}
          >
            <TextField
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search manifesto, name, or tagline"
              size="small"
              fullWidth
              sx={{
                minWidth: { md: 320 },
                background: 'rgba(15,23,42,0.8)',
                borderRadius: 2
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(148,163,184,0.8)' }} />
                  </InputAdornment>
                )
              }}
            />
          </Stack>
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}
          >
            <Chip
              label="Momentum"
              color={sortKey === 'momentum' ? 'primary' : 'default'}
              onClick={() => setSortKey('momentum')}
              variant={sortKey === 'momentum' ? 'filled' : 'outlined'}
            />
            <Chip
              label="Alphabetical"
              color={sortKey === 'alphabetical' ? 'primary' : 'default'}
              onClick={() => setSortKey('alphabetical')}
              variant={sortKey === 'alphabetical' ? 'filled' : 'outlined'}
            />
            <Tooltip title="View live results">
              <Button
                variant="outlined"
                color="secondary"
                onClick={onShowResults}
                startIcon={<VisibilityIcon />}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Results
              </Button>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        {filtered.map((candidate, index) => {
          const pending = pendingCandidateId === candidate.id;
          const share = totalVotes > 0 ? Math.round((candidate.voteCount / totalVotes) * 100) : 0;
          const gradient = gradients[index % gradients.length];
          const manifestoText = candidate.manifesto || 'Manifesto coming soon.';

          return (
            <Grid item xs={12} md={6} key={candidate.id}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 4,
                  p: 3,
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'rgba(15,23,42,0.75)',
                  border: '1px solid rgba(148,163,184,0.2)',
                  transition: 'transform 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 25px 45px rgba(15, 23, 42, 0.35)'
                  }
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.22,
                    background: candidate.imageUri
                      ? `url(${candidate.imageUri}) center/cover`
                      : gradient,
                    filter: 'saturate(120%)',
                    mixBlendMode: 'screen'
                  }}
                />
                <Stack spacing={2.5} sx={{ position: 'relative', zIndex: 1 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      src={candidate.imageUri || undefined}
                      alt={candidate.name}
                      sx={{
                        width: 64,
                        height: 64,
                        border: '2px solid rgba(255,255,255,0.6)',
                        fontSize: 24,
                        fontWeight: 700,
                        bgcolor: 'rgba(15,23,42,0.65)'
                      }}
                    >
                      {candidate.name.charAt(0)}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#e2e8f0' }}>
                        {candidate.name}
                      </Typography>
                      {positionTitle && (
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
                          Standing for {positionTitle}
                        </Typography>
                      )}
                      <Typography variant="body2" sx={{ color: 'rgba(226,232,240,0.75)' }}>
                        {candidate.tagline || 'Amplifying student impact.'}
                      </Typography>
                    </Box>
                    <Chip
                      icon={<FavoriteBorderIcon fontSize="small" />}
                      label={`${candidate.voteCount} votes`}
                      sx={{ bgcolor: 'rgba(15,118,110,0.2)', color: '#5eead4', fontWeight: 600 }}
                    />
                  </Stack>

                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(148,163,184,0.9)', minHeight: 60, lineHeight: 1.6 }}
                  >
                    {manifestoText.slice(0, 220)}
                    {manifestoText.length > 220 ? '…' : ''}
                  </Typography>

                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    justifyContent="space-between"
                    sx={{ gap: { xs: 1.5, sm: 0 } }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ flexWrap: 'wrap', gap: 1 }}
                    >
                      <Chip
                        label={`${share}% support`}
                        size="small"
                        sx={{ bgcolor: 'rgba(96,165,250,0.18)', color: '#bfdbfe', fontWeight: 600 }}
                      />
                      <Chip
                        variant="outlined"
                        size="small"
                        label={`Candidate #${candidate.id}`}
                        sx={{ borderColor: 'rgba(148,163,184,0.35)', color: 'rgba(148,163,184,0.9)' }}
                      />
                    </Stack>

                    <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title="Read manifesto">
                        <IconButton onClick={() => setSelectedCandidate(candidate)} color="info" size="small">
                          <InfoOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                      <Button
                        variant="contained"
                        color="secondary"
                        disabled={!canVote || pending}
                        onClick={() => onVote(candidate.id)}
                        sx={{ borderRadius: 2, fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}
                      >
                        {pending ? 'Submitting...' : hasVoted ? 'Voted' : 'Cast Vote'}
                      </Button>
                    </Stack>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Dialog
        open={Boolean(selectedCandidate)}
        onClose={() => setSelectedCandidate(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{selectedCandidate?.name}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {selectedCandidate?.tagline || 'Campaign vision in motion.'}
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {selectedCandidate?.manifesto || 'Manifesto coming soon.'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedCandidate(null)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedCandidate) {
                onVote(selectedCandidate.id);
                setSelectedCandidate(null);
              }
            }}
            disabled={!canVote || pendingCandidateId === selectedCandidate?.id}
          >
            {pendingCandidateId === selectedCandidate?.id ? 'Submitting...' : 'Vote for this candidate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CandidateList;
