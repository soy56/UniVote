import React from 'react';
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EnhancedCountdown from './EnhancedCountdown';

const HeroSection = ({
  snapshot,
  phaseLabel,
  countdown,
  hasVoted,
  isAdmin,
  isAuthenticated,
  onSignIn,
  onConnectWallet,
  walletLoading = false,
  now
}) => {
  const theme = useTheme();
  const bannerImage = snapshot?.bannerImage;

  const backgroundStyle = bannerImage
    ? {
      backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.65) 40%, rgba(15,23,42,0.85) 100%), url(${bannerImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
    : {
      background: 'radial-gradient(circle at 10% 20%, rgba(99,102,241,0.95) 0%, rgba(14,20,37,0.95) 55%, rgba(9,12,21,0.98) 100%)'
    };

  return (
    <Box
      sx={{
        borderRadius: { xs: 4, md: 5 },
        p: { xs: 4, md: 6 },
        color: theme.palette.common.white,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 25px 45px rgba(15, 23, 42, 0.45)',
        ...backgroundStyle
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="flex-start">
        <Box flex={1}>
          <Typography
            variant="overline"
            sx={{
              letterSpacing: 2,
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 600
            }}
          >
            {phaseLabel === 'Voting' ? 'LIVE' : 'ELECTION PORTAL'}
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              lineHeight: 1.15,
              maxWidth: 680,
              textShadow: '0 8px 20px rgba(15, 23, 42, 0.2)',
              fontSize: { xs: '2.25rem', md: '3.15rem' }
            }}
          >
            {snapshot?.title || 'College Elections Experience'}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              mt: 2.5,
              maxWidth: 640,
              color: 'rgba(255,255,255,0.82)',
              fontWeight: 400,
              lineHeight: 1.5,
              fontSize: { xs: '1rem', md: '1.25rem' }
            }}
          >
            {snapshot?.description ||
              'Shape the student leadership future with a secure, portal-first voting experience.'}
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ mt: 4 }} alignItems="center">
            {isAuthenticated ? (
              <Chip
                label="Signed in to portal"
                color="primary"
                variant="filled"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.12)',
                  color: theme.palette.common.white,
                  fontWeight: 600
                }}
              />
            ) : (
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={onConnectWallet || onSignIn}
                disabled={walletLoading}
                sx={{
                  px: 4,
                  py: 1.3,
                  fontWeight: 700,
                  borderRadius: 3,
                  boxShadow: '0 15px 30px rgba(34,211,238,0.4)'
                }}
              >
                {walletLoading ? 'Connecting wallet…' : 'Connect wallet to vote'}
              </Button>
            )}

            {!isAuthenticated && onSignIn && onConnectWallet && (
              <Button
                variant="outlined"
                color="secondary"
                size="large"
                onClick={onSignIn}
                disabled={walletLoading}
                sx={{
                  px: 4,
                  py: 1.3,
                  fontWeight: 700,
                  borderRadius: 3
                }}
              >
                Use portal credentials
              </Button>
            )}

            <Chip
              icon={<HowToVoteIcon sx={{ color: '#34d399' }} />}
              label={`Phase: ${phaseLabel}`}
              sx={{
                bgcolor: 'rgba(15,186,181,0.15)',
                color: '#5eead4',
                fontWeight: 600,
                px: 1.5
              }}
            />

            {countdown?.label && countdown?.display && (
              <Chip
                icon={<AccessTimeIcon sx={{ color: '#fde68a' }} />}
                label={`${countdown.label}: ${countdown.display}`}
                sx={{
                  bgcolor: 'rgba(253, 230, 138, 0.16)',
                  color: '#fef3c7',
                  fontWeight: 600,
                  px: 1.5
                }}
              />
            )}
          </Stack>

          {/* Enhanced Countdown Display */}
          {countdown?.label && countdown?.display && (
            <Box sx={{ mt: 3, maxWidth: 640 }}>
              <EnhancedCountdown countdown={countdown} snapshot={snapshot} now={now} />
            </Box>
          )}
        </Box>

        <Stack spacing={2} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
          {isAdmin && (
            <Chip
              variant="outlined"
              color="secondary"
              icon={<AdminPanelSettingsIcon />}
              label="Admin Mode"
              sx={{ fontWeight: 600, borderWidth: 2 }}
            />
          )}

          {hasVoted && (
            <Chip
              icon={<HowToVoteIcon />}
              label="Ballot Submitted"
              color="success"
              variant="filled"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

export default HeroSection;
