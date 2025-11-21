import React from 'react';
import {
    Box,
    Button,
    Paper,
    Typography,
    Divider,
    IconButton,
    Tooltip
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import TableChartIcon from '@mui/icons-material/TableChart';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

export default function ExportButtons({ apiUrl, authToken }) {
    const handleExportPDF = async () => {
        try {
            const response = await fetch(`${apiUrl}/export/pdf`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to export PDF');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `election-results-${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('PDF export error:', error);
            alert('Failed to export PDF. Please try again.');
        }
    };

    const handleExportCSV = async () => {
        try {
            const response = await fetch(`${apiUrl}/export/csv`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to export CSV');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `election-results-${Date.now()}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('CSV export error:', error);
            alert('Failed to export CSV. Please try again.');
        }
    };

    const handleExportVotesCSV = async () => {
        try {
            const response = await fetch(`${apiUrl}/export/votes-csv`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to export votes CSV');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `vote-records-${Date.now()}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Vote records CSV export error:', error);
            alert('Failed to export vote records. Please try again.');
        }
    };

    return (
        <Paper
            sx={{
                p: 2,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.1) 100%)',
                border: '1px solid rgba(99,102,241,0.2)'
            }}
        >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                    <DownloadIcon color="primary" />
                    <Typography variant="h6">Export Results</Typography>
                </Box>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Box display="flex" gap={1} flexWrap="wrap" mt={2}>
                <Tooltip title="Download results as PDF report">
                    <Button
                        variant="contained"
                        startIcon={<PictureAsPdfIcon />}
                        onClick={handleExportPDF}
                        sx={{
                            background: 'linear-gradient(135deg, #e53935 0%, #ff5252 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #c62828 0%, #e53935 100%)'
                            }
                        }}
                    >
                        Export PDF
                    </Button>
                </Tooltip>

                <Tooltip title="Download results as CSV">
                    <Button
                        variant="contained"
                        startIcon={<TableChartIcon />}
                        onClick={handleExportCSV}
                        sx={{
                            background: 'linear-gradient(135deg, #43a047 0%, #66bb6a 100%)',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)'
                            }
                        }}
                    >
                        Export CSV
                    </Button>
                </Tooltip>

                <Tooltip title="Download detailed vote records">
                    <Button
                        variant="outlined"
                        startIcon={<TableChartIcon />}
                        onClick={handleExportVotesCSV}
                        size="small"
                    >
                        Vote Records
                    </Button>
                </Tooltip>
            </Box>

            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                Admin-only: Export election data for reporting and analysis
            </Typography>
        </Paper>
    );
}
