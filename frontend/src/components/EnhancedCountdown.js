import React from 'react';
import { Box, LinearProgress, Typography, Chip } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export default function EnhancedCountdown({ countdown, snapshot, now }) {
    if (!countdown || !countdown.display) return null;

    // Calculate urgency level and progress
    const getUrgencyData = () => {
        if (!snapshot) return { level: 'normal', progress: 0, color: 'primary' };

        const currentTime = now.unix();

        if (snapshot.votingEndsAt && snapshot.votingStartsAt) {
            const totalDuration = snapshot.votingEndsAt - snapshot.votingStartsAt;
            const elapsed = currentTime - snapshot.votingStartsAt;
            const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
            const remaining = snapshot.votingEndsAt - currentTime;

            // Urgency levels
            const oneHour = 3600;
            const oneDay = 86400;

            if (remaining <= oneHour) {
                return { level: 'critical', progress, color: 'error', pulse: true };
            } else if (remaining <= oneDay) {
                return { level: 'urgent', progress, color: 'warning', pulse: false };
            } else {
                return { level: 'normal', progress, color: 'success', pulse: false };
            }
        }

        return { level: 'normal', progress: 0, color: 'primary', pulse: false };
    };

    const urgency = getUrgencyData();

    return (
        <Box
            sx={{
                p: 2,
                borderRadius: 2,
                background: urgency.level === 'critical'
                    ? 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(220,38,38,0.15) 100%)'
                    : urgency.level === 'urgent'
                        ? 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(245,158,11,0.15) 100%)'
                        : 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)',
                border: '1px solid',
                borderColor: urgency.level === 'critical'
                    ? 'rgba(239,68,68,0.3)'
                    : urgency.level === 'urgent'
                        ? 'rgba(251,191,36,0.3)'
                        : 'rgba(99,102,241,0.2)',
                animation: urgency.pulse ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                    '0%, 100%': {
                        opacity: 1,
                    },
                    '50%': {
                        opacity: 0.8,
                    },
                },
            }}
        >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                    {urgency.level === 'critical' ? (
                        <WarningAmberIcon color="error" />
                    ) : (
                        <AccessTimeIcon color={urgency.color} />
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {countdown.label}
                    </Typography>
                </Box>
                <Chip
                    label={countdown.display}
                    size="small"
                    color={urgency.color}
                    sx={{
                        fontWeight: 700,
                        animation: urgency.pulse ? 'pulse 2s infinite' : 'none',
                    }}
                />
            </Box>

            {urgency.progress > 0 && (
                <Box>
                    <LinearProgress
                        variant="determinate"
                        value={urgency.progress}
                        color={urgency.color}
                        sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'rgba(148,163,184,0.2)',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                background: urgency.level === 'critical'
                                    ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                                    : urgency.level === 'urgent'
                                        ? 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)'
                                        : 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                            },
                        }}
                    />
                    <Typography
                        variant="caption"
                        sx={{
                            display: 'block',
                            mt: 0.5,
                            textAlign: 'right',
                            color: 'text.secondary',
                        }}
                    >
                        {urgency.progress.toFixed(1)}% elapsed
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
