import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Paper,
    IconButton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import CloseIcon from '@mui/icons-material/Close';

export default function VoteReceipt({ open, onClose, receipt }) {
    if (!receipt) return null;

    const handleDownload = () => {
        // Create a downloadable image from the QR code
        const link = document.createElement('a');
        link.download = `vote-receipt-${receipt.verificationCode}.png`;
        link.href = receipt.qrCode;
        link.click();
    };

    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Vote Receipt</title>');
        printWindow.document.write('<style>body{font-family:Arial,sans-serif;text-align:center;padding:20px;}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(`
      <h1>🗳️ UniVote - Vote Receipt</h1>
      <p><strong>Verification Code:</strong> ${receipt.verificationCode}</p>
      <p><strong>Candidate:</strong> ${receipt.candidateName}</p>
      <p><strong>Timestamp:</strong> ${new Date(receipt.timestamp).toLocaleString()}</p>
      <img src="${receipt.qrCode}" alt="QR Code"  style="width:200px;height:200px;margin:20px auto;"/>
      <p style="font-size:12px;color:#666;">Save this receipt to verify your vote was counted</p>
    `);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'I Voted!',
                    text: `I just voted in UniVote! Verification Code: ${receipt.verificationCode}`,
                    url: window.location.href
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', position: 'relative' }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <CheckCircleIcon />
                    <Typography variant="h6">Vote Confirmed!</Typography>
                </Box>
                <IconButton
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                <Box textAlign="center">
                    <Typography variant="h6" gutterBottom>
                        Your vote has been recorded
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Save this receipt to verify your vote was counted
                    </Typography>

                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            my: 3,
                            bgcolor: 'background.default',
                            border: '2px dashed',
                            borderColor: 'primary.main'
                        }}
                    >
                        <img
                            src={receipt.qrCode}
                            alt="Vote Receipt QR Code"
                            style={{ width: '200px', height: '200px', margin: '0 auto' }}
                        />

                        <Box mt={2}>
                            <Typography variant="caption" color="text.secondary">
                                Verification Code
                            </Typography>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontFamily: 'monospace',
                                    letterSpacing: '0.1em',
                                    color: 'primary.main',
                                    fontWeight: 'bold'
                                }}
                            >
                                {receipt.verificationCode}
                            </Typography>
                        </Box>

                        <Box mt={2}>
                            <Typography variant="body2" color="text.secondary">
                                Voted for: <strong>{receipt.candidateName}</strong>
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {new Date(receipt.timestamp).toLocaleString()}
                            </Typography>
                        </Box>
                    </Paper>

                    <Typography variant="caption" color="text.secondary" display="block">
                        Scan this QR code or use the verification code to confirm your vote was counted
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
                <Box>
                    <IconButton onClick={handleDownload} title="Download QR Code">
                        <DownloadIcon />
                    </IconButton>
                    <IconButton onClick={handlePrint} title="Print Receipt">
                        <PrintIcon />
                    </IconButton>
                    {navigator.share && (
                        <IconButton onClick={handleShare} title="Share">
                            <ShareIcon />
                        </IconButton>
                    )}
                </Box>
                <Button onClick={onClose} variant="contained">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
