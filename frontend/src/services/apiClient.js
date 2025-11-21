import { publicRequest, withAuth } from './authClient';

export const fetchElection = () => publicRequest('/election', { method: 'GET' });

export const fetchElectionAuthed = () => withAuth('/election', { method: 'GET' });

export const addCandidate = (payload) =>
  withAuth('/candidates', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const updateCandidate = (id, payload) =>
  withAuth(`/candidates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

export const adjustVoteCount = (id, newCount) =>
  withAuth(`/candidates/${id}/vote-count`, {
    method: 'POST',
    body: JSON.stringify({ newCount })
  });

export const updateElectionMeta = (payload) =>
  withAuth('/election/meta', {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

export const updateVotingSchedule = (payload) =>
  withAuth('/election/schedule', {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

export const setElectionPhase = (action) =>
  withAuth('/election/phase', {
    method: 'POST',
    body: JSON.stringify({ action })
  });

export const castVote = (candidateId) =>
  withAuth('/votes', {
    method: 'POST',
    body: JSON.stringify({ candidateId })
  });

export const fetchUsers = () => withAuth('/users', { method: 'GET' });

export const toggleUserBan = (userId) =>
  withAuth(`/users/${userId}/toggle-ban`, {
    method: 'POST'
  });

export const toggleUserRole = (userId, role) =>
  withAuth(`/users/${userId}/toggle-role`, {
    method: 'POST',
    body: JSON.stringify({ role })
  });

export const fetchCurrentUser = () => withAuth('/me', { method: 'GET' });
