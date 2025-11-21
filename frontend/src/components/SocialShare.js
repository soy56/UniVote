import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    IconButton,
    Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
    FacebookShareButton,
    TwitterShareButton,
    WhatsappShareButton,
    LinkedinShareButton,
    FacebookIcon,
    TwitterIcon,
    WhatsappIcon,
    LinkedinIcon
} from 'react-share';
import ShareIcon from '@mui/icons-material/Share';

export default function SocialShare({ open, onClose }) {
    const shareUrl = window.location.href;
    const title = "I just voted on UniVote! 🗳️";
    const message = "I exercised my democratic right and voted in our college election using UniVote - a secure, blockchain-powered voting platform. Every vote counts! #UniVote #Democracy #StudentElections";

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white', position: 'relative' }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <ShareIcon />
                    <Typography variant="h6">Share Your Vote!</Typography>
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
                    <Typography variant="h3" sx={{ mb: 2 }}>
                        ✅
                    </Typography>
                    <Typography variant="h5" gutterBottom>
                        I Voted!
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Share your participation and encourage others to vote
                    </Typography>

                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            my: 3,
                            bgcolor: 'background.default',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
                            <Box textAlign="center">
                                <TwitterShareButton
                                    url={shareUrl}
                                    title={message}
                                    hashtags={['UniVote', 'Democracy', 'Vote']}
                                >
                                    <TwitterIcon size={56} round />
                                    <Typography variant="caption" display="block" mt={0.5}>
                                        Twitter
                                    </Typography>
                                </TwitterShareButton>
                            </Box>

                            <Box textAlign="center">
                                <FacebookShareButton
                                    url={shareUrl}
                                    quote={message}
                                >
                                    <FacebookIcon size={56} round />
                                    <Typography variant="caption" display="block" mt={0.5}>
                                        Facebook
                                    </Typography>
                                </FacebookShareButton>
                            </Box>

                            <Box textAlign="center">
                                <WhatsappShareButton
                                    url={shareUrl}
                                    title={message}
                                >
                                    <WhatsappIcon size={56} round />
                                    <Typography variant="caption" display="block" mt={0.5}>
                                        WhatsApp
                                    </Typography>
                                </WhatsappShareButton>
                            </Box>

                            <Box textAlign="center">
                                <LinkedinShareButton
                                    url={shareUrl}
                                    title={title}
                                    summary={message}
                                >
                                    <LinkedinIcon size={56} round />
                                    <Typography variant="caption" display="block" mt={0.5}>
                                        LinkedIn
                                    </Typography>
                                </LinkedinShareButton>
                            </Box>
                        </Box>
                    </Paper>

                    <Typography variant="caption" color="text.secondary">
                        Your vote is anonymous - sharing just shows you participated!
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} variant="contained" fullWidth>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
