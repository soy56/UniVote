import React, { useMemo } from 'react';
import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Grid,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    useTheme
} from '@mui/material';
import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import PieChartIcon from '@mui/icons-material/PieChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import PeopleIcon from '@mui/icons-material/People';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

// Register ChartJS components
ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
);

export default function ResultsDashboard({ candidates = [], snapshot = {}, votes = [] }) {
    const theme = useTheme();
    const [chartType, setChartType] = React.useState('pie');

    // Calculate statistics
    const stats = useMemo(() => {
        const totalVotes = candidates.reduce((sum, c) => sum + (c.voteCount || 0), 0);
        const leadingCandidate = candidates.reduce((max, c) =>
            (c.voteCount || 0) > (max.voteCount || 0) ? c : max,
            candidates[0] || {}
        );

        // Assuming total eligible voters could be tracked in snapshot
        const eligibleVoters = snapshot.totalEligibleVoters || totalVotes;
        const turnoutPercentage = eligibleVoters > 0 ? ((totalVotes / eligibleVoters) * 100).toFixed(1) : 0;

        return {
            totalVotes,
            leadingCandidate,
            turnoutPercentage,
            candidateCount: candidates.length
        };
    }, [candidates, snapshot]);

    // Chart colors based on theme
    const chartColors = useMemo(() => {
        const isDark = theme.palette.mode === 'dark';
        return isDark ? [
            'rgba(99, 102, 241, 0.8)',   // indigo
            'rgba(34, 211, 238, 0.8)',   // cyan
            'rgba(251, 146, 60, 0.8)',   // orange
            'rgba(167, 139, 250, 0.8)',  // purple
            'rgba(52, 211, 153, 0.8)',   // emerald
            'rgba(248, 113, 113, 0.8)',  // red
            'rgba(250, 204, 21, 0.8)',   // yellow
        ] : [
            'rgba(79, 70, 229, 0.8)',    // indigo
            'rgba(6, 182, 212, 0.8)',    // cyan
            'rgba(234, 88, 12, 0.8)',    // orange
            'rgba(124, 58, 237, 0.8)',   // purple
            'rgba(16, 185, 129, 0.8)',   // emerald
            'rgba(220, 38, 38, 0.8)',    // red
            'rgba(202, 138, 4, 0.8)',    // yellow
        ];
    }, [theme.palette.mode]);

    // Pie chart data
    const pieData = {
        labels: candidates.map(c => c.name),
        datasets: [{
            data: candidates.map(c => c.voteCount || 0),
            backgroundColor: chartColors,
            borderColor: theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.9)',
            borderWidth: 2,
        }]
    };

    // Bar chart data
    const barData = {
        labels: candidates.map(c => c.name),
        datasets: [{
            label: 'Votes',
            data: candidates.map(c => c.voteCount || 0),
            backgroundColor: chartColors,
            borderColor: chartColors.map(color => color.replace('0.8', '1')),
            borderWidth: 1,
        }]
    };

    // Timeline chart data (votes over time)
    const timelineData = useMemo(() => {
        if (!votes || votes.length === 0) {
            return {
                labels: ['No data'],
                datasets: [{
                    label: 'Votes',
                    data: [0],
                    borderColor: chartColors[0],
                    backgroundColor: chartColors[0].replace('0.8', '0.3'),
                    tension: 0.4,
                    fill: true,
                }]
            };
        }

        // Sort votes by timestamp
        const sortedVotes = [...votes].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

        // Group by hour or day depending on election duration
        const groupedVotes = sortedVotes.reduce((acc, vote) => {
            const date = new Date((vote.createdAt || 0) * 1000);
            const hourKey = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
            acc[hourKey] = (acc[hourKey] || 0) + 1;
            return acc;
        }, {});

        const labels = Object.keys(groupedVotes);
        const data = Object.values(groupedVotes);

        return {
            labels,
            datasets: [{
                label: 'Votes Cast',
                data,
                borderColor: chartColors[0],
                backgroundColor: chartColors[0].replace('0.8', '0.3'),
                tension: 0.4,
                fill: true,
            }]
        };
    }, [votes, chartColors]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: theme.palette.text.primary,
                    padding: 15,
                    font: { size: 12, family: "'Inter', sans-serif" }
                }
            },
            tooltip: {
                backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(15,23,42,0.95)'
                    : 'rgba(255,255,255,0.95)',
                titleColor: theme.palette.text.primary,
                bodyColor: theme.palette.text.secondary,
                borderColor: theme.palette.divider,
                borderWidth: 1,
                padding: 12,
                displayColors: true,
            }
        },
        scales: chartType !== 'pie' ? {
            y: {
                beginAtZero: true,
                ticks: {
                    color: theme.palette.text.secondary,
                    stepSize: 1,
                },
                grid: {
                    color: theme.palette.mode === 'dark'
                        ? 'rgba(148,163,184,0.1)'
                        : 'rgba(148,163,184,0.2)',
                }
            },
            x: {
                ticks: {
                    color: theme.palette.text.secondary,
                },
                grid: {
                    display: false,
                }
            }
        } : undefined
    };

    return (
        <Stack spacing={3}>
            {/* Statistics Cards */}
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%)',
                            border: '1px solid',
                            borderColor: 'rgba(99,102,241,0.3)',
                        }}
                    >
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: 'rgba(99,102,241,0.2)',
                                    }}
                                >
                                    <HowToVoteIcon sx={{ color: '#6366f1', fontSize: 28 }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Votes
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                        {stats.totalVotes.toLocaleString()}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            background: 'linear-gradient(135deg, rgba(34,211,238,0.15) 0%, rgba(6,182,212,0.15) 100%)',
                            border: '1px solid',
                            borderColor: 'rgba(34,211,238,0.3)',
                        }}
                    >
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: 'rgba(34,211,238,0.2)',
                                    }}
                                >
                                    <PeopleIcon sx={{ color: '#22d3ee', fontSize: 28 }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Voter Turnout
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                        {stats.turnoutPercentage}%
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            background: 'linear-gradient(135deg, rgba(251,146,60,0.15) 0%, rgba(234,88,12,0.15) 100%)',
                            border: '1px solid',
                            borderColor: 'rgba(251,146,60,0.3)',
                        }}
                    >
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: 'rgba(251,146,60,0.2)',
                                    }}
                                >
                                    <BarChartIcon sx={{ color: '#fb923c', fontSize: 28 }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Candidates
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                        {stats.candidateCount}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            background: 'linear-gradient(135deg, rgba(52,211,153,0.15) 0%, rgba(16,185,129,0.15) 100%)',
                            border: '1px solid',
                            borderColor: 'rgba(52,211,153,0.3)',
                        }}
                    >
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: 'rgba(52,211,153,0.2)',
                                    }}
                                >
                                    <EmojiEventsIcon sx={{ color: '#34d399', fontSize: 28 }} />
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Leading
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            fontWeight: 700,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {stats.leadingCandidate?.name || 'N/A'}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Chart Display */}
            <Card>
                <CardHeader
                    title="Vote Distribution Analysis"
                    subheader="Interactive visualization of election results"
                    action={
                        <ToggleButtonGroup
                            value={chartType}
                            exclusive
                            onChange={(e, newType) => newType && setChartType(newType)}
                            size="small"
                        >
                            <ToggleButton value="pie" aria-label="pie chart">
                                <PieChartIcon fontSize="small" />
                            </ToggleButton>
                            <ToggleButton value="bar" aria-label="bar chart">
                                <BarChartIcon fontSize="small" />
                            </ToggleButton>
                            <ToggleButton value="timeline" aria-label="timeline chart">
                                <TimelineIcon fontSize="small" />
                            </ToggleButton>
                        </ToggleButtonGroup>
                    }
                />
                <CardContent>
                    <Box sx={{ height: 400 }}>
                        {chartType === 'pie' && <Pie data={pieData} options={chartOptions} />}
                        {chartType === 'bar' && <Bar data={barData} options={chartOptions} />}
                        {chartType === 'timeline' && <Line data={timelineData} options={chartOptions} />}
                    </Box>
                </CardContent>
            </Card>
        </Stack>
    );
}
