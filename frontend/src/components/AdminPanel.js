import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput
} from '@mui/material';
import SettingsInputComponentIcon from '@mui/icons-material/SettingsInputComponent';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import BarChartIcon from '@mui/icons-material/BarChart';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import EditNoteIcon from '@mui/icons-material/EditNote';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PolicyIcon from '@mui/icons-material/Policy';

import ActivityFeed from './ActivityFeed';
import ExportButtons from './ExportButtons';
import { fetchUsers, toggleUserBan, toggleUserRole } from '../services/apiClient';
import { getSocket } from '../services/socket';

const initialCandidateState = {
  name: '',
  tagline: '',
  manifesto: '',
  imageUri: '',
  positionId: ''
};

const AdminPanel = ({
  snapshot,
  candidates,
  countdown,
  lastVoteRelative,
  leadingCandidate,
  activity,
  now,
  onRefresh,
  onNotify,
  phase,
  adminProfile,
  onAddCandidate,
  onUpdateCandidate,
  onAdjustVoteCount,
  onUpdateMeta,
  onUpdateSchedule,
  onPhaseAction
}) => {
  const [candidateForm, setCandidateForm] = useState(initialCandidateState);
  const [metaForm, setMetaForm] = useState({
    title: '',
    description: '',
    bannerImage: '',
    eligibility: { departments: [], years: [] }
  });
  const [windowForm, setWindowForm] = useState({ start: '', end: '' });
  const [busyAction, setBusyAction] = useState('');
  const [editCandidate, setEditCandidate] = useState(null);
  const [voteDialog, setVoteDialog] = useState({ open: false, candidate: null, value: '' });
  const [positionForm, setPositionForm] = useState({ title: '', order: 0, maxVotes: 1 });
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleToggleBan = async (userId) => {
    try {
      await toggleUserBan(userId);
      loadUsers();
    } catch (error) {
      console.error('Failed to toggle ban:', error);
      alert('Failed to update user status.');
    }
  };

  const handleToggleRole = async (userId, role) => {
    try {
      await toggleUserRole(userId, role);
      loadUsers();
    } catch (error) {
      console.error('Failed to toggle role:', error);
      alert('Failed to update user role.');
    }
  };

  useEffect(() => {
    loadUsers();

    const socket = getSocket();
    if (socket) {
      const handleStatusUpdate = ({ userId, isOnline }) => {
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === userId ? { ...u, isOnline } : u
          )
        );
      };

      socket.on('user_status_update', handleStatusUpdate);

      return () => {
        socket.off('user_status_update', handleStatusUpdate);
      };
    }
  }, []);

  const handleCreatePosition = async () => {
    if (!positionForm.title) return;
    setBusyAction('create-position');
    try {
      const res = await fetch('http://localhost:4000/positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminProfile.token}`
        },
        body: JSON.stringify(positionForm)
      });
      if (res.ok) {
        onNotify('Position created successfully', 'success');
        setPositionForm({ title: '', order: 0, maxVotes: 1 });
        onRefresh();
      } else {
        const err = await res.json();
        onNotify(err.message || 'Failed to create position', 'error');
      }
    } catch (error) {
      onNotify('Network error', 'error');
    } finally {
      setBusyAction('');
    }
  };

  const handleDeletePosition = async (id) => {
    console.log('handleDeletePosition called with id:', id);
    console.log('adminProfile:', adminProfile);
    console.log('adminProfile.token:', adminProfile?.token);

    console.log('Proceeding with deletion...');
    setBusyAction(`delete-position-${id}`);
    try {
      const url = `http://localhost:4000/positions/${id}`;
      console.log('DELETE request to:', url);
      console.log('With token:', adminProfile.token);

      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminProfile.token}` }
      });

      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);

      if (res.ok) {
        console.log('Delete successful!');
        onNotify('Position deleted', 'success');
        onRefresh();
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Delete position failed:', res.status, errData);
        onNotify(errData.message || 'Failed to delete position', 'error');
      }
    } catch (error) {
      console.error('Network error deleting position:', error);
      onNotify('Network error', 'error');
    } finally {
      console.log('Clearing busy action');
      setBusyAction('');
    }
  };

  const handleDeleteCandidate = async (id) => {
    console.log('handleDeleteCandidate called with id:', id);
    setBusyAction(`delete-candidate-${id}`);
    try {
      const res = await fetch(`http://localhost:4000/candidates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminProfile.token}` }
      });

      if (res.ok) {
        onNotify('Candidate deleted', 'success');
        onRefresh();
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Delete candidate failed:', res.status, errData);
        onNotify(errData.message || 'Failed to delete candidate', 'error');
      }
    } catch (error) {
      console.error('Network error deleting candidate:', error);
      onNotify('Network error', 'error');
    } finally {
      setBusyAction('');
    }
  };

  useEffect(() => {
    setMetaForm({
      title: snapshot?.title || '',
      description: snapshot?.description || '',
      bannerImage: snapshot?.bannerImage || '',
      eligibility: snapshot?.eligibility || { departments: [], years: [] }
    });

    const startIso = snapshot?.votingStartsAt
      ? new Date(snapshot.votingStartsAt * 1000).toISOString().slice(0, 16)
      : '';
    const endIso = snapshot?.votingEndsAt
      ? new Date(snapshot.votingEndsAt * 1000).toISOString().slice(0, 16)
      : '';
    setWindowForm({ start: startIso, end: endIso });
  }, [snapshot]);

  const guardWrite = async (label, callback) => {
    try {
      setBusyAction(label);
      await callback();
      await onRefresh();
    } catch (error) {
      const reason = error?.error?.message || error?.data?.message || error?.message || 'Unexpected error';
      onNotify(reason, 'error');
    } finally {
      setBusyAction('');
    }
  };

  const handleAddCandidate = async () => {
    const { name, tagline, manifesto, imageUri, positionId } = candidateForm;
    if (!name.trim()) {
      onNotify('Candidate name is required.', 'warning');
      return;
    }
    await guardWrite('addCandidate', async () => {
      await onAddCandidate({ name, tagline, manifesto, imageUri, positionId: positionId || null });
      onNotify(`Candidate ${name} added successfully.`, 'success');
      setCandidateForm(initialCandidateState);
    });
  };

  const handleMetaUpdate = async () => {
    const { title, description, bannerImage, eligibility } = metaForm;
    await guardWrite('meta', async () => {
      await onUpdateMeta({ title, description, bannerImage, eligibility });
      onNotify('Election configuration updated.', 'success');
    });
  };

  const handleWindowUpdate = async () => {
    const startTimestamp = windowForm.start ? Math.floor(new Date(windowForm.start).getTime() / 1000) : 0;
    const endTimestamp = windowForm.end ? Math.floor(new Date(windowForm.end).getTime() / 1000) : 0;

    if (endTimestamp !== 0 && endTimestamp <= startTimestamp && startTimestamp !== 0) {
      onNotify('End time must be greater than start time.', 'warning');
      return;
    }

    await guardWrite('window', async () => {
      await onUpdateSchedule({ votingStartsAt: startTimestamp, votingEndsAt: endTimestamp });
      onNotify('Voting window saved.', 'success');
    });
  };

  const handleStartVoting = async () => {
    await guardWrite('start', async () => {
      await onPhaseAction('start');
      onNotify('Voting phase activated.', 'success');
    });
  };

  const handleCloseVoting = async () => {
    await guardWrite('close', async () => {
      await onPhaseAction('close');
      onNotify('Voting phase closed.', 'success');
    });
  };

  const handleRefreshPhase = async () => {
    await guardWrite('refresh', async () => {
      await onPhaseAction('refresh');
      onNotify('Phase refreshed based on timeline.', 'info');
    });
  };

  const handleResetElection = async () => {
    if (!window.confirm('Are you sure you want to reset the election? This will clear all votes.')) return;
    await guardWrite('reset', async () => {
      await onPhaseAction('reset');
      onNotify('Election reset to Draft.', 'success');
    });
  };

  const handleEditCandidateSave = async () => {
    if (!editCandidate?.name?.trim()) {
      onNotify('Candidate name cannot be empty.', 'warning');
      return;
    }
    const { id, name, tagline, manifesto, imageUri, positionId } = editCandidate;
    await guardWrite('editCandidate', async () => {
      await onUpdateCandidate(id, { name, tagline, manifesto, imageUri, positionId: positionId || null });
      onNotify('Candidate profile updated.', 'success');
      setEditCandidate(null);
    });
  };

  const handleVoteAdjust = async () => {
    const target = voteDialog.candidate;
    if (!target) return;
    const parsed = Number(voteDialog.value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      onNotify('Vote count must be a non-negative number.', 'warning');
      return;
    }

    await guardWrite('adjustVotes', async () => {
      await onAdjustVoteCount(target.id, parsed);
      onNotify('Vote count updated.', 'success');
      setVoteDialog({ open: false, candidate: null, value: '' });
    });
  };

  const phaseLabel = useMemo(() => phase || 'Unknown', [phase]);

  return (
    <Stack spacing={4} sx={{ color: '#e2e8f0' }}>
      <Paper
        sx={{
          borderRadius: 4,
          p: 3,
          background: 'linear-gradient(135deg, rgba(30,64,175,0.9), rgba(15,23,42,0.92))',
          border: '1px solid rgba(191,219,254,0.18)'
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} justifyContent="space-between">
          <Stack spacing={1.5}>
            <Typography variant="overline" sx={{ letterSpacing: 2 }}>
              Admin overview
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {snapshot?.title || 'Election'}
            </Typography>
            <Typography variant="body1" sx={{ maxWidth: 520, opacity: 0.85 }}>
              {snapshot?.description ||
                'Manage timelines, fine-tune candidate profiles, and keep the election operations flowing smoothly.'}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              <Chip label={`Phase: ${phaseLabel}`} color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
              <Chip
                label={`${snapshot?.totalVotes?.toLocaleString() || 0} votes`}
                color="secondary"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
              {adminProfile?.username && (
                <Chip
                  label={`Portal admin: ${adminProfile.username}`}
                  sx={{ bgcolor: 'rgba(99,102,241,0.18)', color: '#c7d2fe', fontWeight: 600 }}
                />
              )}
              {countdown?.label && countdown?.display && (
                <Chip
                  label={`${countdown.label}: ${countdown.display}`}
                  sx={{ bgcolor: 'rgba(15,118,110,0.25)', fontWeight: 600 }}
                  icon={<ScheduleIcon />}
                />
              )}
            </Stack>
          </Stack>
          {leadingCandidate && (
            <Card
              elevation={0}
              sx={{
                minWidth: 260,
                background: 'rgba(15,23,42,0.75)',
                border: '1px solid rgba(191,219,254,0.18)'
              }}
            >
              <CardHeader
                avatar={<BarChartIcon color="secondary" />}
                title="Projected leader"
                subheader={now ? now.format('MMM D, YYYY HH:mm') : ''}
                sx={{ '& .MuiCardHeader-subheader': { color: 'rgba(148,163,184,0.7)' } }}
              />
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {leadingCandidate.name}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(148,163,184,0.8)', mb: 1 }}>
                  {leadingCandidate.tagline}
                </Typography>
                <Chip
                  icon={<HowToVoteIcon />}
                  label={`${leadingCandidate.voteCount.toLocaleString()} votes`}
                  sx={{ bgcolor: 'rgba(96,165,250,0.18)', color: '#bfdbfe', fontWeight: 600 }}
                />
              </CardContent>
            </Card>
          )}
        </Stack>
      </Paper>

      <Grid container spacing={3}>

        <Grid item xs={12} md={7}>
          <Stack spacing={3}>
            {/* Positions Management */}
            <Card
              sx={{
                borderRadius: 4,
                background: 'rgba(15,23,42,0.85)',
                border: '1px solid rgba(148,163,184,0.2)'
              }}
            >
              <CardHeader
                title="Manage Positions"
                avatar={<HowToVoteIcon color="primary" />}
                subheader="Define roles for multi-position elections"
                sx={{ '& .MuiCardHeader-subheader': { color: 'rgba(148,163,184,0.7)' } }}
              />
              <CardContent>
                <Stack spacing={2}>
                  <Box display="flex" gap={1}>
                    <TextField
                      label="Position Title"
                      size="small"
                      fullWidth
                      value={positionForm.title}
                      onChange={(e) => setPositionForm({ ...positionForm, title: e.target.value })}
                    />
                    <TextField
                      label="Order"
                      type="number"
                      size="small"
                      style={{ width: 80 }}
                      value={positionForm.order}
                      onChange={(e) => setPositionForm({ ...positionForm, order: Number(e.target.value) })}
                    />
                    <Button
                      variant="contained"
                      disabled={!positionForm.title || busyAction === 'create-position'}
                      onClick={handleCreatePosition}
                    >
                      Add
                    </Button>
                  </Box>

                  <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: 'transparent' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: '#94a3b8' }}>Title</TableCell>
                          <TableCell sx={{ color: '#94a3b8' }}>Order</TableCell>
                          <TableCell align="right" sx={{ color: '#94a3b8' }}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[...(snapshot?.positions || [])].sort((a, b) => a.order - b.order).map((pos) => (
                          <TableRow key={pos.id}>
                            <TableCell sx={{ color: '#e2e8f0' }}>{pos.title}</TableCell>
                            <TableCell sx={{ color: '#e2e8f0' }}>{pos.order}</TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                color="error"
                                onClick={() => handleDeletePosition(pos.id)}
                                disabled={busyAction === `delete-position-${pos.id}`}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!snapshot?.positions || snapshot.positions.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={3} align="center" sx={{ color: '#94a3b8' }}>
                              No positions defined (General Election)
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Stack>
              </CardContent>
            </Card>
            <Card
              sx={{
                borderRadius: 4,
                background: 'rgba(15,23,42,0.85)',
                border: '1px solid rgba(148,163,184,0.2)'
              }}
            >
              <CardHeader
                avatar={<SettingsInputComponentIcon />}
                title="Election identity"
                subheader="Update the story voters see on the landing hero"
                sx={{ '& .MuiCardHeader-subheader': { color: 'rgba(148,163,184,0.7)' } }}
              />
              <CardContent>
                <Stack spacing={2.5}>
                  <TextField
                    label="Election Title"
                    fullWidth
                    value={metaForm.title}
                    onChange={(event) => setMetaForm((prev) => ({ ...prev, title: event.target.value }))}
                  />
                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    minRows={3}
                    value={metaForm.description}
                    onChange={(event) => setMetaForm((prev) => ({ ...prev, description: event.target.value }))}
                  />
                  <TextField
                    label="Banner Image URL"
                    fullWidth
                    value={metaForm.bannerImage}
                    onChange={(event) => setMetaForm((prev) => ({ ...prev, bannerImage: event.target.value }))}
                  />
                </Stack>
              </CardContent>
            </Card>

            <Card
              sx={{
                borderRadius: 4,
                background: 'rgba(15,23,42,0.85)',
                border: '1px solid rgba(148,163,184,0.2)'
              }}
            >
              <CardHeader
                avatar={<HowToVoteIcon />}
                title="Voter Eligibility"
                subheader="Restrict voting to specific groups"
                sx={{ '& .MuiCardHeader-subheader': { color: 'rgba(148,163,184,0.7)' } }}
              />
              <CardContent>
                <Stack spacing={2.5}>
                  <FormControl fullWidth>
                    <InputLabel>Allowed Departments</InputLabel>
                    <Select
                      multiple
                      value={metaForm.eligibility?.departments || []}
                      onChange={(e) =>
                        setMetaForm((prev) => ({
                          ...prev,
                          eligibility: { ...prev.eligibility, departments: e.target.value }
                        }))
                      }
                      input={<OutlinedInput label="Allowed Departments" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {['CS', 'IT', 'ECE', 'Mech', 'Civil', 'Arts'].map((dept) => (
                        <MenuItem key={dept} value={dept}>
                          {dept}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Allowed Years</InputLabel>
                    <Select
                      multiple
                      value={metaForm.eligibility?.years || []}
                      onChange={(e) =>
                        setMetaForm((prev) => ({
                          ...prev,
                          eligibility: { ...prev.eligibility, years: e.target.value }
                        }))
                      }
                      input={<OutlinedInput label="Allowed Years" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {['1', '2', '3', '4'].map((year) => (
                        <MenuItem key={year} value={year}>
                          Year {year}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleMetaUpdate}
                      disabled={busyAction === 'meta'}
                    >
                      {busyAction === 'meta' ? 'Saving…' : 'Save configuration'}
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card
            sx={{
              borderRadius: 4,
              height: '100%',
              background: 'rgba(15,23,42,0.85)',
              border: '1px solid rgba(148,163,184,0.2)'
            }}
          >
            <CardHeader
              avatar={<ScheduleIcon />}
              title="Schedule"
              subheader="Coordinate the launch window"
              sx={{ '& .MuiCardHeader-subheader': { color: 'rgba(148,163,184,0.7)' } }}
            />
            <CardContent>
              <Stack spacing={2.5}>
                <TextField
                  label="Voting starts"
                  type="datetime-local"
                  fullWidth
                  value={windowForm.start}
                  InputLabelProps={{ shrink: true }}
                  onChange={(event) => setWindowForm((prev) => ({ ...prev, start: event.target.value }))}
                />
                <TextField
                  label="Voting ends"
                  type="datetime-local"
                  fullWidth
                  value={windowForm.end}
                  InputLabelProps={{ shrink: true }}
                  onChange={(event) => setWindowForm((prev) => ({ ...prev, end: event.target.value }))}
                />
                <Stack spacing={1.5}>
                  <Button
                    variant="outlined"
                    onClick={handleWindowUpdate}
                    disabled={busyAction === 'window'}
                  >
                    {busyAction === 'window' ? 'Scheduling…' : 'Save window'}
                  </Button>
                  <Button onClick={handleStartVoting} disabled={busyAction === 'start'}>
                    {busyAction === 'start' ? 'Launching…' : 'Start voting'}
                  </Button>
                  <Button color="secondary" onClick={handleCloseVoting} disabled={busyAction === 'close'}>
                    {busyAction === 'close' ? 'Closing…' : 'Close voting'}
                  </Button>
                  <Button color="info" onClick={handleRefreshPhase} disabled={busyAction === 'refresh'}>
                    Refresh phase
                  </Button>
                  <Button
                    color="error"
                    startIcon={<RestartAltIcon />}
                    onClick={handleResetElection}
                    disabled={busyAction === 'reset'}
                  >
                    {busyAction === 'reset' ? 'Resetting…' : 'Reset election'}
                  </Button>
                </Stack>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Last recorded vote {lastVoteRelative || 'N/A'}
                </Alert>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* User Management Section */}
      <Card sx={{ mb: 4, borderRadius: 4, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.1)' }}>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={2}>
              <PersonIcon sx={{ color: '#6366f1' }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#e2e8f0' }}>
                User Management
              </Typography>
            </Stack>
          }
          action={
            <Button
              startIcon={<RestartAltIcon />} // Using RestartAltIcon as RefreshIcon was not imported, or I should import RefreshIcon. I'll use RestartAltIcon which is already imported.
              onClick={loadUsers}
              size="small"
              sx={{ color: 'rgba(148,163,184,0.7)' }}
            >
              Refresh
            </Button>
          }
        />
        <CardContent>
          <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { color: 'rgba(226,232,240,0.75)' } }}>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => {
                  const isTargetAdmin = user.roles?.includes('admin');
                  const isTargetInspector = user.roles?.includes('inspector');
                  const isTargetDeveloper = user.roles?.includes('developer');

                  const isViewerAdmin = adminProfile?.roles?.includes('admin');
                  const isViewerInspector = adminProfile?.roles?.includes('inspector');
                  const isViewerDeveloper = adminProfile?.roles?.includes('developer');

                  // Ban Logic
                  const canBan = isViewerDeveloper ||
                    (isViewerAdmin && !isTargetAdmin && !isTargetDeveloper) ||
                    (isViewerInspector && !isTargetAdmin && !isTargetDeveloper && !isTargetInspector);

                  // Role Logic
                  const canToggleInspector = (isViewerDeveloper || isViewerAdmin) && !isTargetDeveloper;
                  const canToggleAdmin = isViewerDeveloper;

                  return (
                    <TableRow key={user.id} hover sx={{ '& td': { borderBottom: '1px solid rgba(148,163,184,0.08)' } }}>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#f1f5f9' }}>
                          {user.username}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.7)' }}>
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {isTargetDeveloper ? (
                          <Chip label="Developer" size="small" sx={{ fontWeight: 600, bgcolor: '#ef4444', color: '#fff' }} />
                        ) : isTargetAdmin ? (
                          <Chip label="Admin" size="small" color="primary" sx={{ fontWeight: 600 }} />
                        ) : isTargetInspector ? (
                          <Chip label="Inspector" size="small" color="warning" sx={{ fontWeight: 600 }} />
                        ) : (
                          <Chip label="Voter" size="small" variant="outlined" sx={{ color: 'rgba(148,163,184,0.9)' }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(148,163,184,0.9)' }}>
                        {user.department || '-'}
                      </TableCell>
                      <TableCell>
                        {user.banned ? (
                          <Chip label="Banned" size="small" color="error" sx={{ fontWeight: 600 }} />
                        ) : user.isOnline ? (
                          <Chip label="Online" size="small" color="success" sx={{ fontWeight: 600 }} />
                        ) : (
                          <Chip label="Offline" size="small" sx={{ fontWeight: 600, bgcolor: 'rgba(148,163,184,0.2)', color: 'rgba(148,163,184,0.8)' }} />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {canBan && (
                          <Tooltip title={user.banned ? "Unban User" : "Ban User"}>
                            <IconButton
                              color={user.banned ? "success" : "error"}
                              onClick={() => handleToggleBan(user.id)}
                              size="small"
                            >
                              {user.banned ? <CheckCircleIcon /> : <BlockIcon />}
                            </IconButton>
                          </Tooltip>
                        )}

                        {canToggleInspector && (
                          <Tooltip title={isTargetInspector ? "Remove Inspector" : "Make Inspector"}>
                            <IconButton
                              color={isTargetInspector ? "warning" : "default"}
                              onClick={() => handleToggleRole(user.id, 'inspector')}
                              size="small"
                              disabled={user.id === adminProfile.id}
                            >
                              <PolicyIcon />
                            </IconButton>
                          </Tooltip>
                        )}

                        {canToggleAdmin && (
                          <Tooltip title={isTargetAdmin ? "Remove Admin" : "Make Admin"}>
                            <IconButton
                              color={isTargetAdmin ? "warning" : "primary"}
                              onClick={() => handleToggleRole(user.id, 'admin')}
                              size="small"
                              disabled={user.id === adminProfile.id}
                            >
                              {isTargetAdmin ? <SecurityIcon /> : <AdminPanelSettingsIcon />}
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'rgba(148,163,184,0.6)' }}>
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card
        sx={{
          borderRadius: 4,
          background: 'rgba(15,23,42,0.85)',
          border: '1px solid rgba(148,163,184,0.2)'
        }}
      >
        <CardHeader
          avatar={<HowToVoteIcon />}
          title="Candidate List"
          subheader="Audit and fine-tune vote counts or manifestos"
          sx={{ '& .MuiCardHeader-subheader': { color: 'rgba(148,163,184,0.7)' } }}
        />
        <CardContent>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 520 }}>
              <TableHead>
                <TableRow sx={{ '& th': { color: 'rgba(226,232,240,0.75)' } }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Tagline</TableCell>
                  <TableCell>Votes</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {candidates.map((candidate) => (
                  <TableRow key={candidate.id} hover sx={{ '& td': { borderBottom: '1px solid rgba(148,163,184,0.08)' } }}>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {candidate.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(148,163,184,0.7)' }}>
                        ID {candidate.id}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(148,163,184,0.85)' }}>
                      {candidate.positionId
                        ? (snapshot?.positions?.find(p => p.id === candidate.positionId)?.title || 'Unknown Position')
                        : <em style={{ color: 'rgba(148,163,184,0.5)' }}>General</em>
                      }
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(148,163,184,0.85)' }}>{candidate.tagline}</TableCell>
                    <TableCell>{candidate.voteCount.toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ flexWrap: 'wrap', gap: 1 }}>
                        <Tooltip title="Edit manifesto">
                          <IconButton
                            color="info"
                            size="small"
                            onClick={() =>
                              setEditCandidate({
                                id: candidate.id,
                                name: candidate.name,
                                tagline: candidate.tagline,
                                manifesto: candidate.manifesto,
                                imageUri: candidate.imageUri,
                                positionId: candidate.positionId
                              })
                            }
                          >
                            <EditNoteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Adjust votes">
                          <IconButton
                            color="secondary"
                            size="small"
                            onClick={() =>
                              setVoteDialog({
                                open: true,
                                candidate,
                                value: candidate.voteCount.toString()
                              })
                            }
                          >
                            <HowToVoteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete candidate">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDeleteCandidate(candidate.id)}
                            disabled={busyAction === `delete-candidate-${candidate.id}`}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {candidates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ color: 'rgba(148,163,184,0.7)' }}>
                      No candidates registered yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card
        sx={{
          borderRadius: 4,
          background: 'rgba(15,23,42,0.85)',
          border: '1px solid rgba(148,163,184,0.2)'
        }}
      >
        <CardHeader
          avatar={<AddCircleIcon color="primary" />}
          title="Add new candidate"
          subheader="New candidates appear as soon as you publish them"
          sx={{ '& .MuiCardHeader-subheader': { color: 'rgba(148,163,184,0.7)' } }}
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Position</InputLabel>
                <Select
                  value={candidateForm.positionId || ''}
                  label="Position"
                  onChange={(e) => setCandidateForm({ ...candidateForm, positionId: e.target.value || null })}
                >
                  <MenuItem value=""><em>None (General)</em></MenuItem>
                  {[...(snapshot?.positions || [])].sort((a, b) => a.order - b.order).map((pos) => (
                    <MenuItem key={pos.id} value={pos.id}>{pos.title}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Name"
                fullWidth
                value={candidateForm.name}
                onChange={(event) => setCandidateForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Tagline"
                fullWidth
                value={candidateForm.tagline}
                onChange={(event) => setCandidateForm((prev) => ({ ...prev, tagline: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Manifesto"
                multiline
                minRows={3}
                fullWidth
                value={candidateForm.manifesto}
                onChange={(event) => setCandidateForm((prev) => ({ ...prev, manifesto: event.target.value }))}
                placeholder="Share bold ideas, campus policies, and innovation promises."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Image URL"
                fullWidth
                value={candidateForm.imageUri}
                onChange={(event) => setCandidateForm((prev) => ({ ...prev, imageUri: event.target.value }))}
                placeholder="https://..."
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<RocketLaunchIcon />}
                onClick={handleAddCandidate}
                disabled={busyAction === 'addCandidate'}
              >
                {busyAction === 'addCandidate' ? 'Submitting…' : 'Publish candidate'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card
        sx={{
          borderRadius: 4,
          background: 'rgba(15,23,42,0.85)',
          border: '1px solid rgba(148,163,184,0.2)'
        }}
      >
        <CardHeader
          avatar={<HowToVoteIcon />}
          title="Live activity"
          subheader="Latest ballots recorded across the portal"
          sx={{ '& .MuiCardHeader-subheader': { color: 'rgba(148,163,184,0.7)' } }}
        />
        <CardContent>
          <ActivityFeed activity={activity} onRefresh={onRefresh} now={now} />
        </CardContent>
      </Card>

      <ExportButtons
        apiUrl={process.env.REACT_APP_API_URL || 'http://localhost:4000'}
        authToken={adminProfile?.token || ''}
      />

      <Dialog open={Boolean(editCandidate)} onClose={() => setEditCandidate(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit candidate profile</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              fullWidth
              value={editCandidate?.name || ''}
              onChange={(event) =>
                setEditCandidate((prev) => (prev ? { ...prev, name: event.target.value } : prev))
              }
            />
            <TextField
              label="Tagline"
              fullWidth
              value={editCandidate?.tagline || ''}
              onChange={(event) =>
                setEditCandidate((prev) => (prev ? { ...prev, tagline: event.target.value } : prev))
              }
            />
            <TextField
              label="Manifesto"
              fullWidth
              multiline
              minRows={3}
              value={editCandidate?.manifesto || ''}
              onChange={(event) =>
                setEditCandidate((prev) => (prev ? { ...prev, manifesto: event.target.value } : prev))
              }
            />
            <FormControl fullWidth>
              <InputLabel>Position</InputLabel>
              <Select
                value={editCandidate?.positionId || ''}
                label="Position"
                onChange={(e) =>
                  setEditCandidate((prev) => (prev ? { ...prev, positionId: e.target.value || null } : prev))
                }
              >
                <MenuItem value=""><em>None (General)</em></MenuItem>
                {[...(snapshot?.positions || [])].sort((a, b) => a.order - b.order).map((pos) => (
                  <MenuItem key={pos.id} value={pos.id}>{pos.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Image URL"
              fullWidth
              value={editCandidate?.imageUri || ''}
              onChange={(event) =>
                setEditCandidate((prev) => (prev ? { ...prev, imageUri: event.target.value } : prev))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCandidate(null)}>Cancel</Button>
          <Button onClick={handleEditCandidateSave} variant="contained" disabled={busyAction === 'editCandidate'}>
            {busyAction === 'editCandidate' ? 'Updating…' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={voteDialog.open} onClose={() => setVoteDialog({ open: false, candidate: null, value: '' })}>
        <DialogTitle>Adjust vote count</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {voteDialog.candidate?.name}
          </Typography>
          <TextField
            label="Votes"
            type="number"
            fullWidth
            value={voteDialog.value}
            onChange={(event) => setVoteDialog((prev) => ({ ...prev, value: event.target.value }))}
            inputProps={{ min: 0 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVoteDialog({ open: false, candidate: null, value: '' })}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleVoteAdjust}
            disabled={busyAction === 'adjustVotes'}
          >
            {busyAction === 'adjustVotes' ? 'Adjusting…' : 'Update votes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default AdminPanel;
