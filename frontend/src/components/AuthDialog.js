import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const initialState = {
  username: '',
  email: '',
  identifier: '',
  password: '',
  confirm: '',
  department: '',
  acharyaId: ''
};

const AuthDialog = ({
  open,
  mode,
  loading,
  onClose,
  onSubmit,
  onModeChange,
  onWalletLogin,
  walletLoading = false
}) => {
  const [formValues, setFormValues] = useState(initialState);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!open) {
      setFormValues(initialState);
      setValidationError('');
      return;
    }

    setFormValues((prev) => ({
      ...initialState,
      username: prev.username,
      email: prev.email
    }));
    setValidationError('');
  }, [open, mode]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationError('');

    try {
      if (mode === 'signup') {
        if (!formValues.username.trim()) {
          setValidationError('Username is required.');
          return;
        }
        if (!formValues.acharyaId.trim()) {
          setValidationError('Acharya ID is required.');
          return;
        }
        if (!formValues.email.trim()) {
          setValidationError('Email is required.');
          return;
        }
        if (!formValues.department) {
          setValidationError('Department is required.');
          return;
        }
        if (!formValues.password) {
          setValidationError('Password cannot be empty.');
          return;
        }
        if (formValues.password !== formValues.confirm) {
          setValidationError('Passwords do not match.');
          return;
        }
        await onSubmit({
          username: formValues.username.trim(),
          acharyaId: formValues.acharyaId.trim(),
          email: formValues.email.trim(),
          department: formValues.department,
          password: formValues.password
        });
      } else {
        if (!formValues.identifier.trim()) {
          setValidationError('Enter your username or email.');
          return;
        }
        if (!formValues.password) {
          setValidationError('Password cannot be empty.');
          return;
        }
        await onSubmit({
          identifier: formValues.identifier.trim(),
          password: formValues.password
        });
      }
    } catch (error) {
      const message = error?.message || 'Unable to complete the request.';
      setValidationError(message);
    }
  };

  const switchLabel =
    mode === 'signup' ? 'Already registered? Sign in' : "Need an account? Create one";

  const switchMode = () => {
    if (mode === 'signup') {
      onModeChange('signin');
    } else {
      onModeChange('signup');
    }
  };

  const handleWalletLogin = async () => {
    if (!onWalletLogin) return;
    setValidationError('');
    try {
      await onWalletLogin();
    } catch (error) {
      const message = error?.message || 'Wallet sign-in failed.';
      setValidationError(message);
    }
  };

  const isBusy = loading || walletLoading;

  return (
    <Dialog open={open} onClose={isBusy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {mode === 'signup' ? 'Create your UniVote account' : 'Sign in to UniVote'}
      </DialogTitle>
      <DialogContent dividers>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            {mode === 'signup' ? (
              <>
                <TextField
                  label="Username"
                  value={formValues.username}
                  onChange={handleChange('username')}
                  fullWidth
                  autoFocus
                  required
                />
                <TextField
                  label="Acharya ID"
                  value={formValues.acharyaId}
                  onChange={handleChange('acharyaId')}
                  fullWidth
                  required
                  placeholder="e.g., ACH123456"
                />
                <TextField
                  label="Acharya's Email"
                  type="email"
                  value={formValues.email}
                  onChange={handleChange('email')}
                  fullWidth
                  required
                />
                <TextField
                  select
                  label="Department"
                  value={formValues.department}
                  onChange={handleChange('department')}
                  fullWidth
                  required
                >
                  <MenuItem value=""><em>Select Department</em></MenuItem>
                  <MenuItem value="Computer Science">Computer Science</MenuItem>
                  <MenuItem value="Electronics">Electronics & Communication</MenuItem>
                  <MenuItem value="Mechanical">Mechanical Engineering</MenuItem>
                  <MenuItem value="Civil">Civil Engineering</MenuItem>
                  <MenuItem value="Electrical">Electrical Engineering</MenuItem>
                  <MenuItem value="Information Technology">Information Technology</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
                <TextField
                  label="Password"
                  type="password"
                  value={formValues.password}
                  onChange={handleChange('password')}
                  fullWidth
                  required
                />
                <TextField
                  label="Confirm Password"
                  type="password"
                  value={formValues.confirm}
                  onChange={handleChange('confirm')}
                  fullWidth
                  required
                />
              </>
            ) : (
              <>
                <TextField
                  label="Username or Email"
                  value={formValues.identifier}
                  onChange={handleChange('identifier')}
                  fullWidth
                  autoFocus
                  required
                />
                <TextField
                  label="Password"
                  type="password"
                  value={formValues.password}
                  onChange={handleChange('password')}
                  fullWidth
                  required
                />
              </>
            )}

            {validationError && <Alert severity="error">{validationError}</Alert>}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || walletLoading}
              sx={{ mt: 1, fontWeight: 700 }}
            >
              {loading ? 'Processing…' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </Button>

            {onWalletLogin && (
              <Stack spacing={1} alignItems="stretch">
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<AccountBalanceWalletIcon />}
                  onClick={handleWalletLogin}
                  disabled={walletLoading || loading}
                  sx={{ fontWeight: 700 }}
                >
                  {walletLoading
                    ? 'Connecting wallet…'
                    : mode === 'signup'
                      ? 'Register with MetaMask'
                      : 'Sign in with wallet'}
                </Button>
                {mode === 'signup' && (
                  <Typography
                    variant="caption"
                    sx={{ color: 'rgba(148,163,184,0.85)', textAlign: 'center' }}
                  >
                    MetaMask will open so you can verify wallet ownership. A voter profile is created once you sign the request.
                  </Typography>
                )}
              </Stack>
            )}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
        <Button onClick={switchMode} color="secondary" sx={{ fontWeight: 600 }}>
          {switchLabel}
        </Button>
        <Button onClick={onClose} disabled={isBusy} sx={{ fontWeight: 600 }}>
          Cancel
        </Button>
      </DialogActions>
      <Box sx={{ px: 3, pb: 3 }}>
        <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.8)' }}>
          Portal admins are configured on the server. Keep credentials secure to protect election integrity.
        </Typography>
      </Box>
    </Dialog>
  );
};

export default AuthDialog;
