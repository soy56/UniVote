import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  Grid,
  IconButton,
  Snackbar,
  Stack,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

import HeroSection from './components/HeroSection';
import CandidateList from './components/CandidateList';
import Results from './components/Results';
import AdminPanel from './components/AdminPanel';
import ActivityFeed from './components/ActivityFeed';
import ElectionStats from './components/ElectionStats';
import AuthDialog from './components/AuthDialog';
import VoteReceipt from './components/VoteReceipt';
import SocialShare from './components/SocialShare';
import {
  signIn as authSignIn,
  signUp as authSignUp,
  getSession,
  setSession as persistSession,
  clearSession,
  requestWalletNonce,
  verifyWalletSignature
} from './services/authClient';
import {
  fetchElection,
  fetchElectionAuthed,
  addCandidate as apiAddCandidate,
  updateCandidate as apiUpdateCandidate,
  adjustVoteCount as apiAdjustVoteCount,
  updateElectionMeta as apiUpdateElectionMeta,
  updateVotingSchedule as apiUpdateVotingSchedule,
  setElectionPhase as apiSetElectionPhase,

  castVote as apiCastVote,
  fetchCurrentUser
} from './services/apiClient';
import { connectSocket, disconnectSocket } from './services/socket';
import { connectWallet, getSigner } from './blockchain';
import './App.css';

dayjs.extend(duration);
dayjs.extend(relativeTime);

const createAppTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#6366f1'
    },
    secondary: {
      main: '#22d3ee'
    },
    background: mode === 'dark'
      ? {
        default: '#050816',
        paper: 'rgba(15,23,42,0.85)'
      }
      : {
        default: '#f8fafc',
        paper: 'rgba(255,255,255,0.9)'
      }
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif"
  },
  components: {
    MuiPaper: {
      defaultProps: {
        elevation: 0
      },
      styleOverrides: {
        root: mode === 'dark'
          ? {}
          : {
            border: '1px solid rgba(148,163,184,0.2)'
          }
      }
    }
  }
});

const formatCountdown = (seconds) => {
  if (seconds <= 0) {
    return 'moments';
  }
  const durationObj = dayjs.duration(seconds, 'seconds');
  const parts = [];
  const days = Math.floor(durationObj.asDays());
  if (days) {
    parts.push(`${days}d`);
  }
  const hours = durationObj.hours();
  if (hours) {
    parts.push(`${hours}h`);
  }
  const minutes = durationObj.minutes();
  if (minutes) {
    parts.push(`${minutes}m`);
  }
  const secs = durationObj.seconds();
  if (!parts.length || secs) {
    parts.push(`${secs}s`);
  }
  return parts.join(' ');
};

function App() {
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('univote-theme');
    return saved || 'dark';
  });
  const [session, setSessionState] = useState(() => getSession());
  const [snapshot, setSnapshot] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [activity, setActivity] = useState([]);
  const [votedPositions, setVotedPositions] = useState([]);
  const [leadingCandidate, setLeadingCandidate] = useState(null);
  const [phase, setPhase] = useState('Draft');
  const [showResults, setShowResults] = useState(false);
  const [pendingCandidateId, setPendingCandidateId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  const [now, setNow] = useState(dayjs());
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [authLoading, setAuthLoading] = useState(false);
  const [walletAuthLoading, setWalletAuthLoading] = useState(false);
  const [voteReceipt, setVoteReceipt] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const theme = useMemo(() => createAppTheme(themeMode), [themeMode]);

  const notify = useCallback((message, severity = 'info') => {
    setToast({ open: true, message, severity });
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) => {
      const newMode = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('univote-theme', newMode);
      return newMode;
    });
  }, []);

  useEffect(() => {
    if (session) {
      persistSession(session);
    } else {
      clearSession();
    }
  }, [session]);

  const loadElectionData = useCallback(
    async (withSpinner = false) => {
      if (withSpinner) {
        setLoading(true);
      }
      try {
        const data = session ? await fetchElectionAuthed() : await fetchElection();
        setSnapshot(data.snapshot);
        setPhase(data.snapshot?.phase || 'Draft');
        setCandidates(data.candidates || []);
        setActivity(data.activity || []);
        setLeadingCandidate(data.leadingCandidate || null);
        setVotedPositions(data.votedPositions || []);
      } catch (error) {
        console.error('Error loading election data', error);
        notify('Unable to sync election data. Please try again shortly.', 'error');
      } finally {
        if (withSpinner) {
          setLoading(false);
        }
      }
    },
    [session, notify]
  );

  useEffect(() => {
    loadElectionData(true);
  }, [loadElectionData]);

  // Auto-refresh session on mount to get latest roles
  useEffect(() => {
    const refreshSession = async () => {
      if (!session?.token) return;
      try {
        const { user } = await fetchCurrentUser();
        if (user) {
          setSessionState(prev => ({ ...prev, user }));
          // Persist updated session immediately
          persistSession({ ...session, user });
        }
      } catch (error) {
        console.warn('Failed to refresh session:', error);
        // Optional: clear session if token is invalid
        // clearSession();
        // setSessionState(null);
      }
    };

    refreshSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const phaseLabel = phase || 'Draft';
  const hasVoted = votedPositions.length > 0;

  const authUser = session?.user || null;
  const portalDisplayName = useMemo(() => {
    if (!authUser) return '';
    if (authUser.username) return authUser.username;
    if (authUser.email) return authUser.email;
    if (authUser.walletAddress) {
      return `${authUser.walletAddress.slice(0, 6)}…${authUser.walletAddress.slice(-4)}`;
    }
    return '';
  }, [authUser]);

  const isPortalAdmin = useMemo(() => Boolean(authUser?.roles?.includes('admin')), [authUser]);
  const showAdminView = isPortalAdmin;

  const lastVoteRelative = useMemo(() => {
    if (!snapshot?.lastVoteAt) return '';
    return dayjs.unix(snapshot.lastVoteAt).from(now);
  }, [snapshot, now]);

  useEffect(() => {
    const interval = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-show results when election ends
  useEffect(() => {
    if (phaseLabel === 'Ended' && !showAdminView) {
      setShowResults(true);
    }
  }, [phaseLabel, showAdminView]);

  const handleVote = async (candidateId) => {
    if (!session) {
      notify('Sign in to cast your ballot.', 'warning');
      setAuthMode('signin');
      setAuthDialogOpen(true);
      return;
    }

    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;

    const positionId = candidate.positionId || null;
    // Check if user already voted for this position (or null position)
    // Note: votedPositions contains nulls for general votes
    if (votedPositions.includes(positionId)) {
      const posTitle = positionId
        ? snapshot?.positions?.find(p => p.id === positionId)?.title || 'this position'
        : 'this election';
      notify(`You have already voted for ${posTitle}.`, 'info');
      return;
    }

    // Client-side eligibility check
    const { departments, years } = snapshot?.eligibility || {};
    if (departments && departments.length > 0) {
      if (!session.user.department || !departments.includes(session.user.department)) {
        notify(`Voting is restricted to: ${departments.join(', ')}`, 'error');
        return;
      }
    }
    if (years && years.length > 0) {
      if (!session.user.year || !years.includes(session.user.year)) {
        notify(`Voting is restricted to years: ${years.join(', ')}`, 'error');
        return;
      }
    }

    setPendingCandidateId(candidateId);
    try {
      const response = await apiCastVote(candidateId);
      notify('Vote recorded. Thank you for participating!', 'success');

      // Show vote receipt if available
      if (response?.receipt) {
        setVoteReceipt(response.receipt);
      }

      await loadElectionData(false);
    } catch (error) {
      const message = error?.message || 'Voting failed. Please try again.';
      notify(message, 'error');
    } finally {
      setPendingCandidateId(null);
    }
  };

  const countdown = useMemo(() => {
    if (!snapshot) {
      return { label: '', display: '' };
    }
    const currentTime = now.unix();
    if (phaseLabel === 'Draft') {
      if (snapshot.votingStartsAt && snapshot.votingStartsAt > currentTime) {
        return {
          label: 'Voting opens in',
          display: formatCountdown(snapshot.votingStartsAt - currentTime)
        };
      }
      return { label: 'Launch status', display: 'Preparing launch' };
    }
    if (phaseLabel === 'Voting') {
      if (snapshot.votingEndsAt && snapshot.votingEndsAt > currentTime) {
        return {
          label: 'Voting closes in',
          display: formatCountdown(snapshot.votingEndsAt - currentTime)
        };
      }
      return { label: 'Voting window', display: 'Closing momentarily' };
    }
    return { label: 'Election', display: 'Closed' };
  }, [snapshot, phaseLabel, now]);

  const isVotingOpen = useMemo(() => {
    if (!snapshot || phaseLabel !== 'Voting') return false;
    const currentTime = now.unix();
    if (snapshot.votingStartsAt && currentTime < snapshot.votingStartsAt) return false;
    if (snapshot.votingEndsAt && currentTime > snapshot.votingEndsAt) return false;
    return true;
  }, [snapshot, phaseLabel, now]);

  const openAuthDialog = useCallback((mode = 'signin') => {
    setAuthMode(mode);
    setAuthDialogOpen(true);
  }, []);

  const handleAuthSubmit = useCallback(
    async (formValues) => {
      setAuthLoading(true);
      try {
        let user;
        if (authMode === 'signin') {
          user = await authSignIn(formValues);
          notify(`Welcome back, ${user.user?.username || user.user?.email}!`, 'success');
        } else {
          user = await authSignUp(formValues);
          notify(`Account created for ${user.user?.username || user.user?.email}.`, 'success');
        }
        setSessionState(user);
        connectSocket(user.user.id);
        setAuthDialogOpen(false);
      } catch (error) {
        const message = error?.message || 'Authentication failed. Please try again.';
        notify(message, 'error');
      } finally {
        setAuthLoading(false);
      }
    },
    [authMode, notify]
  );

  const handleAuthDialogClose = useCallback(() => {
    setAuthDialogOpen(false);
  }, []);

  const handleSignOut = useCallback(() => {
    setSessionState(null);
    disconnectSocket();
    notify('Signed out of the UniVote portal.', 'info');
  }, [notify]);

  const handleWalletSignIn = useCallback(async () => {
    setWalletAuthLoading(true);
    try {
      const accounts = await connectWallet();
      if (!accounts || !accounts.length) {
        throw new Error('Wallet connection cancelled.');
      }

      const primaryAddress = accounts[0];
      const challenge = await requestWalletNonce(primaryAddress);
      const signer = getSigner();
      const signature = await signer.signMessage(challenge.message);
      const sessionPayload = await verifyWalletSignature({
        address: challenge.address,
        signature
      });

      setSessionState(sessionPayload);
      connectSocket(sessionPayload.user.id);
      const shortAddress = `${challenge.address.slice(0, 6)}…${challenge.address.slice(-4)}`;
      notify(
        sessionPayload?.isNewUser
          ? `Wallet registered: ${shortAddress}`
          : `Wallet signed in: ${shortAddress}`,
        'success'
      );
      setAuthDialogOpen(false);
    } catch (error) {
      const message =
        error?.code === 4001
          ? 'Signature request was rejected.'
          : error?.message || 'Wallet sign-in failed.';
      throw new Error(message);
    } finally {
      setWalletAuthLoading(false);
    }
  }, [notify]);

  const triggerWalletSignIn = useCallback(async () => {
    try {
      await handleWalletSignIn();
    } catch (error) {
      const message = error?.message || 'Wallet sign-in failed.';
      notify(message, 'error');
    }
  }, [handleWalletSignIn, notify]);

  const handleCloseToast = (_, reason) => {
    if (reason === 'clickaway') return;
    setToast((prev) => ({ ...prev, open: false }));
  };

  const handleAddCandidate = useCallback((payload) => apiAddCandidate(payload), []);
  const handleUpdateCandidate = useCallback((id, payload) => apiUpdateCandidate(id, payload), []);
  const handleAdjustVoteCount = useCallback((id, newCount) => apiAdjustVoteCount(id, newCount), []);
  const handleUpdateMeta = useCallback((payload) => apiUpdateElectionMeta(payload), []);
  const handleUpdateSchedule = useCallback((payload) => apiUpdateVotingSchedule(payload), []);
  const handlePhaseAction = useCallback((action) => apiSetElectionPhase(action), []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        className="App"
        sx={{
          minHeight: '100vh',
          background: 'radial-gradient(circle at 20% 20%, #111827 0%, #020617 50%, #010409 100%)'
        }}
      >
        <AppBar
          position="sticky"
          color="transparent"
          elevation={0}
          sx={{
            backdropFilter: 'blur(16px)',
            background: 'rgba(2,6,23,0.85)',
            borderBottom: '1px solid rgba(99,102,241,0.1)'
          }}
        >
          <Toolbar
            sx={{
              flexWrap: { xs: 'wrap', md: 'nowrap' },
              alignItems: { xs: 'flex-start', md: 'center' },
              gap: { xs: 1.5, md: 0 }
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                letterSpacing: 0.6,
                flexBasis: { xs: '100%', md: 'auto' }
              }}
            >
              {showAdminView
                ? 'UniVote Admin Console'
                : 'UniVote - "Uni" for university/college elections'}
            </Typography>
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'stretch', md: 'center' }}
              sx={{
                width: { xs: '100%', md: 'auto' }
              }}
            >
              <Tooltip title="Refresh data">
                <IconButton
                  onClick={() => loadElectionData(true)}
                  color="primary"
                  sx={{ alignSelf: { xs: 'flex-end', md: 'center' } }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={themeMode === 'dark' ? 'Light mode' : 'Dark mode'}>
                <IconButton
                  onClick={toggleTheme}
                  color="primary"
                  sx={{ alignSelf: { xs: 'flex-end', md: 'center' } }}
                >
                  {themeMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
              </Tooltip>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ flexWrap: 'wrap', gap: 1 }}
              >
                <Chip
                  label={`Phase: ${phaseLabel}`}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
                {snapshot?.totalVotes >= 0 && (
                  <Chip
                    label={`${snapshot.totalVotes.toLocaleString()} votes`}
                    color="secondary"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Stack>
              {authUser ? (
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                >
                  <Chip
                    label={`Signed in: ${portalDisplayName}`}
                    color="info"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                  <Button
                    color="warning"
                    onClick={handleSignOut}
                    sx={{ fontWeight: 600, width: { xs: '100%', sm: 'auto' } }}
                  >
                    Sign out
                  </Button>
                </Stack>
              ) : (
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                >
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={triggerWalletSignIn}
                    disabled={walletAuthLoading}
                    sx={{ fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}
                  >
                    {walletAuthLoading ? 'Connecting wallet…' : 'Connect wallet'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => openAuthDialog('signin')}
                    disabled={walletAuthLoading}
                    sx={{ fontWeight: 600, width: { xs: '100%', sm: 'auto' } }}
                  >
                    Use credentials
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => openAuthDialog('signup')}
                    sx={{ fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}
                  >
                    Sign up
                  </Button>
                </Stack>
              )}
            </Stack>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
          {loading ? (
            <Stack alignItems="center" spacing={3} sx={{ py: 12 }}>
              <CircularProgress color="secondary" />
              <Typography variant="h6" sx={{ color: 'rgba(226,232,240,0.7)' }}>
                Syncing election data…
              </Typography>
            </Stack>
          ) : showAdminView ? (
            <Stack spacing={4}>
              <AdminPanel
                snapshot={snapshot}
                candidates={candidates}
                countdown={countdown}
                lastVoteRelative={lastVoteRelative}
                leadingCandidate={leadingCandidate}
                activity={activity}
                now={now}
                onRefresh={loadElectionData}
                onNotify={notify}
                phase={phaseLabel}
                adminProfile={{ ...authUser, token: session?.token }}
                onAddCandidate={handleAddCandidate}
                onUpdateCandidate={handleUpdateCandidate}
                onAdjustVoteCount={handleAdjustVoteCount}
                onUpdateMeta={handleUpdateMeta}
                onUpdateSchedule={handleUpdateSchedule}
                onPhaseAction={handlePhaseAction}
              />
            </Stack>
          ) : (
            <>
              <HeroSection
                snapshot={snapshot}
                phaseLabel={phaseLabel}
                countdown={countdown}
                hasVoted={hasVoted}
                isAdmin={isPortalAdmin}
                isAuthenticated={Boolean(authUser)}
                onSignIn={() => openAuthDialog('signin')}
                onConnectWallet={triggerWalletSignIn}
                walletLoading={walletAuthLoading}
                now={now}
              />

              <Box sx={{ mt: 6 }}>
                <ElectionStats
                  snapshot={snapshot}
                  leadingCandidate={leadingCandidate}
                  countdown={countdown}
                  lastVoteRelative={lastVoteRelative}
                  candidateCount={snapshot?.candidateCount || candidates.length}
                />
              </Box>

              <Box sx={{ mt: 6 }}>
                {showResults ? (
                  <Results
                    candidates={candidates}
                    snapshot={snapshot}
                    votes={activity}
                    onBack={() => setShowResults(false)}
                  />
                ) : (
                  snapshot?.positions && snapshot.positions.length > 0 ? (
                    <>
                      {[...snapshot.positions].sort((a, b) => a.order - b.order).map((pos) => {
                        const posCandidates = candidates.filter(c => c.positionId === pos.id);
                        if (posCandidates.length === 0) return null;
                        const userVotedForPos = votedPositions.includes(pos.id);

                        return (
                          <Box
                            key={pos.id}
                            sx={{
                              mb: 6,
                              p: 3,
                              borderRadius: 3,
                              background: 'rgba(15,23,42,0.4)',
                              border: '2px solid rgba(99,102,241,0.3)',
                              backdropFilter: 'blur(10px)'
                            }}
                          >
                            <Box
                              sx={{
                                mb: 3,
                                pb: 2,
                                borderBottom: '2px solid rgba(99,102,241,0.2)'
                              }}
                            >
                              <Typography
                                variant="h4"
                                sx={{
                                  fontWeight: 800,
                                  background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                                  backgroundClip: 'text',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  mb: 0.5
                                }}
                              >
                                {pos.title}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'rgba(148,163,184,0.85)',
                                  fontStyle: 'italic'
                                }}
                              >
                                {userVotedForPos
                                  ? '✓ You have voted for this position'
                                  : `Select one candidate for this position (${posCandidates.length} candidate${posCandidates.length !== 1 ? 's' : ''})`
                                }
                              </Typography>
                            </Box>
                            <CandidateList
                              candidates={posCandidates}
                              hasVoted={userVotedForPos}
                              onVote={handleVote}
                              pendingCandidateId={pendingCandidateId}
                              isVotingOpen={isVotingOpen}
                              phaseLabel={phaseLabel}
                              onShowResults={() => setShowResults(true)}
                              totalVotes={snapshot?.totalVotes || 0}
                              positionTitle={pos.title}
                            />
                          </Box>
                        );
                      })}
                      {candidates.some(c => !c.positionId) && (
                        <Box sx={{ mb: 8 }}>
                          <Typography variant="h4" sx={{ mb: 4, fontWeight: 800 }}>General Candidates</Typography>
                          <CandidateList
                            candidates={candidates.filter(c => !c.positionId)}
                            hasVoted={votedPositions.includes(null)}
                            onVote={handleVote}
                            pendingCandidateId={pendingCandidateId}
                            isVotingOpen={isVotingOpen}
                            phaseLabel={phaseLabel}
                            onShowResults={() => setShowResults(true)}
                            totalVotes={snapshot?.totalVotes || 0}
                            positionTitle="General Member"
                          />
                        </Box>
                      )}
                    </>
                  ) : (
                    <CandidateList
                      candidates={candidates}
                      hasVoted={votedPositions.length > 0}
                      onVote={handleVote}
                      pendingCandidateId={pendingCandidateId}
                      isVotingOpen={isVotingOpen}
                      phaseLabel={phaseLabel}
                      onShowResults={() => setShowResults(true)}
                      totalVotes={snapshot?.totalVotes || 0}
                      positionTitle="General Member"
                    />
                  )
                )}
              </Box>

              <Grid container spacing={4} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <ActivityFeed activity={activity} onRefresh={() => loadElectionData(false)} now={now} />
                </Grid>
              </Grid>
            </>
          )}
        </Container>

        <Box sx={{ textAlign: 'center', pb: 3 }}>
          <Typography
            variant="caption"
            sx={{
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: 'rgba(226,232,240,0.35)',
              fontWeight: 600
            }}
          >
            Made by Souvik Patra
          </Typography>
        </Box>

        <AuthDialog
          open={authDialogOpen}
          mode={authMode}
          loading={authLoading}
          onClose={handleAuthDialogClose}
          onSubmit={handleAuthSubmit}
          onModeChange={(mode) => setAuthMode(mode)}
          onWalletLogin={handleWalletSignIn}
          walletLoading={walletAuthLoading}
        />

        <VoteReceipt
          open={!!voteReceipt}
          onClose={() => {
            setVoteReceipt(null);
            setShareDialogOpen(true);
          }}
          receipt={voteReceipt}
        />

        <SocialShare
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
        />

        <Snackbar
          open={toast.open}
          autoHideDuration={6000}
          onClose={handleCloseToast}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%' }}>
            {toast.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider >
  );
}

export default App;
