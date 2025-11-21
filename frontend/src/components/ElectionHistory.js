import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Dialog,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Paper,
    Stack,
    Typography,
    useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ResultsDashboard from './ResultsDashboard';

export default function ElectionHistory({ apiUrl }) {
    const theme = useTheme();
    const [archives, setArchives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedArchive, setSelectedArchive] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    // Fetch archive list
    useEffect(() => {
        fetchArchives();
    }, []);

    const fetchArchives = async () => {
        try {
            const response = await fetch(`${apiUrl}/elections/history`);
            const data = await response.json();
            setArchives(data.elections || []);
        } catch (error) {
            console.error('Failed to fetch election history:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch archive details
    const fetchArchiveDetails = async (archiveId) => {
        try {
            const response = await fetch(`${apiUrl}/elections/history/${archiveId}`);
            const data = await response.json();
            setSelectedArchive(data);
            setDetailsOpen(true);
        } catch (error) {
            console.error('Failed to fetch archive details:', error);
        }
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Box>
            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    borderRadius: 4,
                    mb: 4,
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.15) 100%)',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark'
                        ? 'rgba(139,92,246,0.3)'
                        : 'rgba(139,92,246,0.2)'
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: theme.palette.mode === 'dark'
                                ? 'rgba(139,92,246,0.2)'
                                : 'rgba(139,92,246,0.15)'
                        }}
                    >
                        <HistoryIcon sx={{ color: '#8b5cf6', fontSize: 32 }} />
                    </Box>
                    <Box flex={1}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                            Election History
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            View past elections and compare results over time
                        </Typography>
                    </Box>
                    <Chip
                        label={`${archives.length} archived`}
                        color="secondary"
                        sx={{ fontWeight: 600 }}
                    />
                </Stack>
            </Paper>

            {loading ? (
                <Typography align="center" color="text.secondary">
                    Loading election history...
                </Typography>
            ) : archives.length === 0 ? (
                <Paper
                    elevation={0}
                    sx={{
                        p: 6,
                        textAlign: 'center',
                        borderRadius: 4,
                        border: '2px dashed',
                        borderColor: 'divider'
                    }}
                >
                    <HistoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Archived Elections
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                        Past elections will appear here once they are archived
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {archives.map((archive) => (
                        <Grid item xs={12} md={6} lg={4} key={archive.id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: theme.shadows[8]
                                    }
                                }}
                            >
                                <CardHeader
                                    title={
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                            {archive.title}
                                        </Typography>
                                    }
                                    subheader={
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                            <CalendarTodayIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                                            <Typography variant="caption" color="text.secondary">
                                                {formatDate(archive.archivedAt)}
                                            </Typography>
                                        </Stack>
                                    }
                                />
                                <CardContent sx={{ flex: 1 }}>
                                    <Stack spacing={2}>
                                        <Box>
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                                <EmojiEventsIcon fontSize="small" color="primary" />
                                                <Typography variant="body2" color="text.secondary">
                                                    Winner
                                                </Typography>
                                            </Stack>
                                            <Typography variant="body1" sx={{ fontWeight: 600, pl: 3.5 }}>
                                                {archive.winner}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                                <HowToVoteIcon fontSize="small" color="secondary" />
                                                <Typography variant="body2" color="text.secondary">
                                                    Total Votes
                                                </Typography>
                                            </Stack>
                                            <Typography variant="h6" sx={{ fontWeight: 700, pl: 3.5 }}>
                                                {archive.totalVotes.toLocaleString()}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                                <Box sx={{ p: 2, pt: 0 }}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<VisibilityIcon />}
                                        onClick={() => fetchArchiveDetails(archive.id)}
                                    >
                                        View Details
                                    </Button>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Archive Details Dialog */}
            <Dialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        minHeight: '70vh'
                    }
                }}
            >
                <DialogTitle>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                {selectedArchive?.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Archived {selectedArchive?.archivedAt && formatDate(selectedArchive.archivedAt)}
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setDetailsOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    {selectedArchive && (
                        <Box sx={{ pt: 2 }}>
                            <ResultsDashboard
                                candidates={selectedArchive.candidates}
                                snapshot={selectedArchive.election}
                                votes={selectedArchive.votes}
                            />
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}
