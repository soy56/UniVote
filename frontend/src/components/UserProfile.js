import React, { useState, useEffect } from 'react';
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Divider,
    Grid,
    Stack,
    TextField,
    Typography
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';

const UserProfile = ({ session, onNotify, onProfileUpdate }) => {
    const [formData, setFormData] = useState({
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (session?.user) {
            setFormData(prev => ({
                ...prev,
                email: session.user.email || ''
            }));
        }
    }, [session]);

    const handleChange = (field) => (event) => {
        setFormData(prev => ({ ...prev, [field]: event.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            onNotify('New passwords do not match.', 'error');
            return;
        }

        if (formData.newPassword && !formData.currentPassword) {
            onNotify('Current password is required to change password.', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:4000/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.token}`
                },
                body: JSON.stringify({
                    email: formData.email,
                    currentPassword: formData.currentPassword || undefined,
                    newPassword: formData.newPassword || undefined
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update profile');
            }

            onNotify(data.message || 'Profile updated successfully!', 'success');

            // Clear password fields
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));

            // Notify parent to refresh session if needed
            if (onProfileUpdate) {
                onProfileUpdate(data.profile);
            }
        } catch (error) {
            onNotify(error.message || 'Failed to update profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!session?.user) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    Please sign in to view your profile
                </Typography>
            </Box>
        );
    }

    const getInitials = (username) => {
        if (!username) return '?';
        return username.slice(0, 2).toUpperCase();
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
            <Card
                sx={{
                    borderRadius: 4,
                    background: 'rgba(15,23,42,0.85)',
                    border: '1px solid rgba(148,163,184,0.2)'
                }}
            >
                <CardHeader
                    avatar={
                        <Avatar
                            sx={{
                                width: 80,
                                height: 80,
                                fontSize: '2rem',
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                                color: '#fff'
                            }}
                        >
                            {getInitials(session.user.username)}
                        </Avatar>
                    }
                    title={
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#e2e8f0' }}>
                            {session.user.username}
                        </Typography>
                    }
                    subheader={
                        <Typography variant="body2" sx={{ color: 'rgba(148,163,184,0.7)' }}>
                            Manage your profile settings
                        </Typography>
                    }
                    sx={{ pb: 0 }}
                />
                <CardContent>
                    <Stack spacing={3}>
                        <Divider sx={{ borderColor: 'rgba(148,163,184,0.12)' }} />

                        {/* Read-only Information */}
                        <Box>
                            <Typography variant="overline" sx={{ color: 'rgba(148,163,184,0.7)', fontWeight: 600 }}>
                                Account Information
                            </Typography>
                            <Stack spacing={2} sx={{ mt: 1.5 }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.6)' }}>
                                        Username
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
                                        {session.user.username}
                                    </Typography>
                                </Box>
                                {session.user.acharyaId && (
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.6)' }}>
                                            Acharya ID
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
                                            {session.user.acharyaId}
                                        </Typography>
                                    </Box>
                                )}
                                {session.user.department && (
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.6)' }}>
                                            Department
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
                                            {session.user.department}
                                        </Typography>
                                    </Box>
                                )}
                            </Stack>
                        </Box>

                        <Divider sx={{ borderColor: 'rgba(148,163,184,0.12)' }} />

                        {/* Editable Fields */}
                        <Box component="form" onSubmit={handleSubmit}>
                            <Typography variant="overline" sx={{ color: 'rgba(148,163,184,0.7)', fontWeight: 600, mb: 2, display: 'block' }}>
                                Update Profile
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange('email')}
                                        fullWidth
                                        required
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" sx={{ color: '#e2e8f0', mb: 1.5, mt: 1 }}>
                                        Change Password (optional)
                                    </Typography>
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        label="Current Password"
                                        type="password"
                                        value={formData.currentPassword}
                                        onChange={handleChange('currentPassword')}
                                        fullWidth
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        label="New Password"
                                        type="password"
                                        value={formData.newPassword}
                                        onChange={handleChange('newPassword')}
                                        fullWidth
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        label="Confirm New Password"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange('confirmPassword')}
                                        fullWidth
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        startIcon={<SaveIcon />}
                                        disabled={loading}
                                        fullWidth
                                        sx={{ mt: 1, fontWeight: 700 }}
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
};

export default UserProfile;
