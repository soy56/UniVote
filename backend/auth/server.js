const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs/promises');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const { ethers } = require('ethers');
const crypto = require('crypto');
const QRCode = require('qrcode');
const http = require('http');
const { Server } = require('socket.io');

const PORT = parseInt(process.env.PORT, 10) || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'univote_secret_key_2024_secure';
const JWT_TTL = '24h';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000', 'https://univote-frontend.netlify.app'];
const USERS_FILE = path.join(__dirname, '..', 'users.json');
const DATA_FILE = path.join(__dirname, '..', 'data.json');

const defaultElectionData = {
  election: {
    title: 'University Election 2024',
    description: 'Cast your vote for the next student council.',
    bannerImage: '',
    phase: 'Draft',
    votingStartsAt: 0,
    votingEndsAt: 0,
    lastVoteAt: 0,
    lastVoter: null,
    eligibility: { departments: [], years: [] }
  },
  positions: [],
  candidates: [],
  votes: []
};

const readJson = async (filePath, defaultValue) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return defaultValue;
    }
    throw error;
  }
};

const writeJson = async (filePath, data) => {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
};

const loadUsers = async () => {
  const data = await readJson(USERS_FILE, { users: [] });
  return data.users || [];
};

const saveUsers = async (users) => {
  await writeJson(USERS_FILE, { users });
};

const walletChallenges = new Map();
const connectedUsers = new Map(); // userId -> socketId
const WALLET_NONCE_TTL_MS = 300000; // 5 minutes

const loadElectionData = async () => {
  const data = await readJson(DATA_FILE, defaultElectionData);

  const normalizedPositions = Array.isArray(data.positions)
    ? data.positions.map((pos) => ({
      id: pos.id || uuid(),
      title: pos.title || 'Position',
      order: Number(pos.order || 0),
      maxVotes: Number(pos.maxVotes || 1)
    }))
    : [];

  const normalizedCandidates = Array.isArray(data.candidates)
    ? data.candidates.map((candidate) => ({
      id: candidate.id || uuid(),
      positionId: candidate.positionId || null,
      name: candidate.name || 'Candidate',
      tagline: candidate.tagline || '',
      manifesto: candidate.manifesto || '',
      imageUri: candidate.imageUri || '',
      voteCount: Number(candidate.voteCount || 0),
      createdAt: candidate.createdAt || Date.now(),
      updatedAt: candidate.updatedAt || Date.now()
    }))
    : [];

  const normalizedVotes = Array.isArray(data.votes)
    ? data.votes.map((vote) => ({
      id: vote.id || uuid(),
      userId: vote.userId,
      candidateId: vote.candidateId,
      createdAt: Number(vote.createdAt || Date.now())
    }))
    : [];

  return {
    election: {
      ...defaultElectionData.election,
      ...data.election
    },
    positions: normalizedPositions,
    candidates: normalizedCandidates,
    votes: normalizedVotes
  };
};

const saveElectionData = async (data) => writeJson(DATA_FILE, data);

const sanitizeUser = (user) => {
  const { passwordHash, ...safeFields } = user;
  return safeFields;
};

const findUserByIdentifier = (users, identifier) => {
  const target = identifier.trim().toLowerCase();
  return users.find(
    (user) =>
      user.username?.toLowerCase() === target || user.email?.toLowerCase() === target
  );
};

const findUserByWallet = (users, address) => {
  const target = address.trim().toLowerCase();
  return users.find((user) => user.walletAddress?.toLowerCase() === target);
};

const normalizeAddress = (address) => {
  try {
    return ethers.utils.getAddress(address);
  } catch (error) {
    return null;
  }
};

const pruneWalletChallenges = () => {
  const now = Date.now();
  for (const [key, entry] of walletChallenges.entries()) {
    if (!entry || now - entry.createdAt > WALLET_NONCE_TTL_MS) {
      walletChallenges.delete(key);
    }
  }
};

const buildWalletMessage = (address, nonce) =>
  `UniVote authentication\nAddress: ${address}\nNonce: ${nonce}\nIssued at: ${new Date().toISOString()}`;

const computeTotalVotes = (candidates) =>
  candidates.reduce((sum, candidate) => sum + Number(candidate.voteCount || 0), 0);

const buildSnapshot = (data) => {
  const { election, candidates } = data;
  return {
    title: election.title,
    description: election.description,
    bannerImage: election.bannerImage,
    phase: election.phase,
    candidateCount: candidates.length,
    totalVotes: computeTotalVotes(candidates),
    votingStartsAt: Number(election.votingStartsAt || 0),
    votingEndsAt: Number(election.votingEndsAt || 0),
    lastVoteAt: Number(election.lastVoteAt || 0),
    lastVoter: election.lastVoter || null,
    eligibility: election.eligibility || { departments: [], years: [] },
    positions: data.positions || []
  };
};

const candidatePayload = (candidate) => ({
  id: candidate.id,
  positionId: candidate.positionId,
  name: candidate.name,
  tagline: candidate.tagline,
  manifesto: candidate.manifesto,
  imageUri: candidate.imageUri,
  voteCount: Number(candidate.voteCount || 0),
  createdAt: candidate.createdAt,
  updatedAt: candidate.updatedAt
});

const findLeadingCandidate = (candidates) => {
  return candidates.reduce((leader, candidate) => {
    if (!leader || Number(candidate.voteCount || 0) > Number(leader.voteCount || 0)) {
      return candidate;
    }
    return leader;
  }, null);
};

const buildActivityFeed = (data, users) => {
  const candidateMap = new Map(data.candidates.map((candidate) => [candidate.id, candidate]));
  const userMap = new Map(users.map((user) => [user.id, user]));

  return data.votes
    .slice()
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .slice(0, 25)
    .map((vote) => {
      const candidate = candidateMap.get(vote.candidateId);
      const voter = userMap.get(vote.userId);
      return {
        id: vote.id,
        candidateId: vote.candidateId,
        candidateName: candidate?.name || 'Candidate',
        voterId: vote.userId,
        voterName: voter?.username || voter?.email || 'Anonymous',
        timestamp: Number(vote.createdAt || Date.now())
      };
    });
};

const issueToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      roles: user.roles || [],
      username: user.username,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: JWT_TTL }
  );

const attachUser = (requireAuth = true) => async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    if (requireAuth) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    return next();
  }

  const [, token] = authHeader.split(' ');
  if (!token) {
    if (requireAuth) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const users = await loadUsers();
    const user = users.find((item) => item.id === payload.sub);
    if (!user) {
      if (requireAuth) {
        return res.status(401).json({ message: 'User not found.' });
      }
      return next();
    }

    req.user = sanitizeUser(user);
    next();
  } catch (error) {
    console.warn('Token verification failed', error.message);
    if (requireAuth) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }
    next();
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !Array.isArray(req.user.roles) || (!req.user.roles.includes('admin') && !req.user.roles.includes('developer'))) {
    return res.status(403).json({ message: 'Admin privileges required.' });
  }
  return next();
};

const requireDeveloper = (req, res, next) => {
  if (!req.user || !Array.isArray(req.user.roles) || !req.user.roles.includes('developer')) {
    return res.status(403).json({ message: 'Developer privileges required.' });
  }
  return next();
};

const resolveAllowedOrigins = () => {
  const fromEnv = ALLOWED_ORIGIN
    .split(',')
    .map((item) => item.trim())
    .filter((item) => Boolean(item));
  return Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS, ...fromEnv]));
};

const allowedOrigins = resolveAllowedOrigins();
const localNetworkPattern = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}):3000$/;

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin) || localNetworkPattern.test(origin)) {
        return callback(null, true);
      }

      console.warn(`Blocked CORS origin: ${origin}`);
      return callback(new Error('Origin not allowed by CORS policy.'));
    },
    credentials: false
  })
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/sign-up', async (req, res) => {
  try {
    const { username, email, password, department, acharyaId } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required.' });
    }

    if (!department || !department.trim()) {
      return res.status(400).json({ message: 'Department is required.' });
    }

    if (!acharyaId || !acharyaId.trim()) {
      return res.status(400).json({ message: 'Acharya ID is required.' });
    }

    const users = await loadUsers();
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    if (findUserByIdentifier(users, normalizedUsername) || findUserByIdentifier(users, normalizedEmail)) {
      return res.status(409).json({ message: 'An account with that username or email already exists.' });
    }

    // Check if Acharya ID already exists
    const acharyaIdExists = users.some(u => u.acharyaId && u.acharyaId.toLowerCase() === acharyaId.trim().toLowerCase());
    if (acharyaIdExists) {
      return res.status(409).json({ message: 'This Acharya ID is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const timestamp = new Date().toISOString();
    const newUser = {
      id: uuid(),
      username: username.trim(),
      email: email.trim(),
      passwordHash,
      department: department.trim(),
      acharyaId: acharyaId.trim(),
      roles: ['voter'],
      createdAt: timestamp,
      updatedAt: timestamp
    };

    users.push(newUser);
    await saveUsers(users);

    const token = issueToken(newUser);
    res.status(201).json({ user: sanitizeUser(newUser), token });
  } catch (error) {
    console.error('Sign-up error:', error);
    res.status(500).json({ message: 'Unable to create account right now.' });
  }
});

app.post('/sign-in', async (req, res) => {
  try {
    const { identifier, password } = req.body || {};

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password are required.' });
    }

    const users = await loadUsers();
    const user = findUserByIdentifier(users, identifier);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (user.banned) {
      return res.status(403).json({ message: 'Account is banned. Contact administration.' });
    }

    const token = issueToken(user);
    res.json({ user: sanitizeUser(user), token });
  } catch (error) {
    console.error('Sign-in error:', error);
    res.status(500).json({ message: 'Unable to sign in right now.' });
  }
});

app.post('/wallet/nonce', async (req, res) => {
  pruneWalletChallenges();
  const { address } = req.body || {};

  if (!address) {
    return res.status(400).json({ message: 'Wallet address is required.' });
  }

  const normalized = normalizeAddress(address);
  if (!normalized) {
    return res.status(400).json({ message: 'Invalid wallet address.' });
  }

  const nonce = crypto.randomBytes(24).toString('hex');
  const message = buildWalletMessage(normalized, nonce);
  walletChallenges.set(normalized.toLowerCase(), {
    nonce,
    message,
    createdAt: Date.now()
  });

  res.json({
    address: normalized,
    nonce,
    message
  });
});

app.post('/wallet/verify', async (req, res) => {
  pruneWalletChallenges();
  const { address, signature } = req.body || {};

  if (!address || !signature) {
    return res.status(400).json({ message: 'Address and signature are required.' });
  }

  const normalized = normalizeAddress(address);
  if (!normalized) {
    return res.status(400).json({ message: 'Invalid wallet address.' });
  }

  const challenge = walletChallenges.get(normalized.toLowerCase());
  if (!challenge) {
    return res.status(400).json({ message: 'Nonce expired or not found. Request a new sign-in.' });
  }

  const message = challenge.message || buildWalletMessage(normalized, challenge.nonce);
  let recovered;
  try {
    recovered = ethers.utils.verifyMessage(message, signature);
  } catch (error) {
    console.warn('Signature verification failed', error.message);
    return res.status(401).json({ message: 'Invalid signature.' });
  }

  if (recovered.toLowerCase() !== normalized.toLowerCase()) {
    console.warn('Signature mismatch', {
      expected: normalized,
      recovered
    });
    return res.status(401).json({ message: 'Signature does not match address.' });
  }

  walletChallenges.delete(normalized.toLowerCase());

  const users = await loadUsers();
  let user = findUserByWallet(users, normalized);
  let isNewUser = false;

  if (!user) {
    const timestamp = new Date().toISOString();
    user = {
      id: uuid(),
      username: `wallet-${normalized.slice(2, 8).toLowerCase()}`,
      email: '',
      walletAddress: normalized,
      passwordHash: null,
      roles: ['voter'],
      createdAt: timestamp,
      updatedAt: timestamp
    };

    users.push(user);
    isNewUser = true;
  } else {
    user.updatedAt = new Date().toISOString();
  }

  await saveUsers(users);

  const token = issueToken(user);
  res.json({ user: sanitizeUser(user), token, isNewUser });
});

app.get('/me', attachUser(true), (req, res) => {
  const { department, year, acharyaId, ...userProps } = req.user;
  res.json({ user: { ...userProps, department, year, acharyaId } });
});

// Get user profile
app.get('/profile', attachUser(true), (req, res) => {
  res.json({ profile: sanitizeUser(req.user) });
});

// Get all users (Admin only)
app.get('/users', attachUser(true), requireAdmin, async (req, res) => {
  try {
    const users = await loadUsers();
    const sanitized = users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      roles: u.roles,
      department: u.department,
      acharyaId: u.acharyaId,
      banned: !!u.banned,
      createdAt: u.createdAt,
      isOnline: connectedUsers.has(u.id)
    }));
    res.json({ users: sanitized });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
});

// Toggle ban status (Admin or Inspector)
app.post('/users/:id/toggle-ban', attachUser(true), async (req, res) => {
  const { id } = req.params;
  const currentUser = req.user;

  // Check if user has permission (Admin or Inspector)
  const isInspector = currentUser.roles?.includes('inspector');
  const isAdmin = currentUser.roles?.includes('admin');
  const isDeveloper = currentUser.roles?.includes('developer');

  if (!isInspector && !isAdmin && !isDeveloper) {
    return res.status(403).json({ message: 'Insufficient privileges.' });
  }

  // Prevent banning self
  if (id === currentUser.id) {
    return res.status(400).json({ message: 'You cannot ban yourself.' });
  }

  const users = await loadUsers();
  const targetUser = users.find(u => u.id === id);

  if (!targetUser) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const targetIsAdmin = targetUser.roles?.includes('admin');
  const targetIsDeveloper = targetUser.roles?.includes('developer');
  const targetIsInspector = targetUser.roles?.includes('inspector');

  // Permission Logic
  if (isInspector) {
    // Inspectors can ONLY ban regular voters (no special roles)
    if (targetIsAdmin || targetIsDeveloper || targetIsInspector) {
      return res.status(403).json({ message: 'Inspectors cannot ban privileged users.' });
    }
  } else if (isAdmin) {
    // Admins cannot ban Developers or other Admins (optional, but good practice)
    if (targetIsDeveloper || targetIsAdmin) {
      return res.status(403).json({ message: 'Cannot ban a superior or peer admin.' });
    }
  }

  targetUser.banned = !targetUser.banned;
  targetUser.updatedAt = new Date().toISOString();

  await saveUsers(users);

  res.json({
    message: targetUser.banned ? 'User banned.' : 'User unbanned.',
    user: { id: targetUser.id, banned: targetUser.banned }
  });
});

// Toggle user role (Developer or Admin)
app.post('/users/:id/toggle-role', attachUser(true), requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; // e.g., 'admin', 'inspector'
  const currentUser = req.user;

  if (!role) {
    return res.status(400).json({ message: 'Role is required.' });
  }

  // Prevent modifying self
  if (id === currentUser.id) {
    return res.status(400).json({ message: 'You cannot modify your own roles.' });
  }

  const isDeveloper = currentUser.roles?.includes('developer');
  const isAdmin = currentUser.roles?.includes('admin');

  // Permission Check
  if (role === 'admin' && !isDeveloper) {
    return res.status(403).json({ message: 'Only Developers can assign Admin role.' });
  }
  if (role === 'inspector' && !isDeveloper && !isAdmin) {
    return res.status(403).json({ message: 'Insufficient privileges to assign Inspector role.' });
  }
  // Prevent Admins from assigning arbitrary roles if we had more, but here we just check specific ones.

  const users = await loadUsers();
  const targetUser = users.find(u => u.id === id);

  if (!targetUser) {
    return res.status(404).json({ message: 'User not found.' });
  }

  // Protect Developers from being modified by Admins
  if (targetUser.roles?.includes('developer') && !isDeveloper) {
    return res.status(403).json({ message: 'Cannot modify a Developer account.' });
  }

  if (!targetUser.roles) targetUser.roles = [];

  if (targetUser.roles.includes(role)) {
    targetUser.roles = targetUser.roles.filter(r => r !== role);
  } else {
    targetUser.roles.push(role);
  }

  targetUser.updatedAt = new Date().toISOString();
  await saveUsers(users);

  res.json({
    message: 'User roles updated.',
    user: { id: targetUser.id, roles: targetUser.roles }
  });
});

// Update user profile (email and password only)
app.put('/profile', attachUser(true), async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body || {};
    const users = await loadUsers();
    const user = users.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    let updated = false;

    // Update email if provided
    if (email && email.trim() && email.trim() !== user.email) {
      const normalizedEmail = email.trim().toLowerCase();

      // Check if email is already taken by another user
      const emailTaken = users.some(u => u.id !== user.id && u.email?.toLowerCase() === normalizedEmail);
      if (emailTaken) {
        return res.status(409).json({ message: 'This email is already in use.' });
      }

      user.email = email.trim();
      updated = true;
    }

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new password.' });
      }

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ message: 'Current password is incorrect.' });
      }

      user.passwordHash = await bcrypt.hash(newPassword, 10);
      updated = true;
    }

    if (updated) {
      user.updatedAt = new Date().toISOString();
      await saveUsers(users);
      res.json({ message: 'Profile updated successfully.', profile: sanitizeUser(user) });
    } else {
      res.json({ message: 'No changes made.', profile: sanitizeUser(user) });
    }
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Unable to update profile.' });
  }
});
app.get('/debug-routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push(middleware.route.path);
    }
  });
  res.json(routes);
});

app.get('/election', async (req, res) => {
  try {
    const data = await loadElectionData();
    const users = await loadUsers();

    const snapshot = buildSnapshot(data);
    const candidates = data.candidates.map(candidatePayload);
    const fullActivity = buildActivityFeed(data, users);
    const leader = findLeadingCandidate(data.candidates);

    // Check if user is admin
    const isAdmin = req.user && Array.isArray(req.user.roles) && req.user.roles.includes('admin');

    // Sanitize activity for non-admin users (hide candidate names)
    const activity = isAdmin ? fullActivity : fullActivity.map(item => ({
      id: item.id,
      candidateId: null,  // Hide candidate ID
      candidateName: null, // Hide candidate name
      voterId: item.voterId,
      voterName: item.voterName,
      timestamp: item.timestamp
    }));

    let votedPositions = [];
    if (req.user) {
      const userVotes = data.votes.filter((vote) => vote.userId === req.user.id);
      votedPositions = userVotes.map(v => {
        const c = data.candidates.find(cand => cand.id === v.candidateId);
        return c ? c.positionId : null;
      });
    }

    res.json({
      snapshot,
      candidates,
      leader: leader ? candidatePayload(leader) : null,
      activity,
      votedPositions
    });
  } catch (error) {
    console.error('Get election error:', error);
    res.status(500).json({
      message: 'Failed to load election data.',
      error: error.message,
      stack: error.stack,
      path: DATA_FILE
    });
  }
});

app.get('/positions', async (req, res) => {
  const data = await loadElectionData();
  res.json({ positions: data.positions || [] });
});

app.post('/positions', attachUser(true), requireAdmin, async (req, res) => {
  const { title, order, maxVotes } = req.body || {};

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Position title is required.' });
  }

  const data = await loadElectionData();

  const newPosition = {
    id: uuid(),
    title: title.trim(),
    order: Number(order || 0),
    maxVotes: Number(maxVotes || 1)
  };

  if (!data.positions) data.positions = [];
  data.positions.push(newPosition);

  await saveElectionData(data);

  res.status(201).json({ position: newPosition, snapshot: buildSnapshot(data) });
});

app.delete('/positions/:id', attachUser(true), requireAdmin, async (req, res) => {
  const { id } = req.params;
  const data = await loadElectionData();
  console.log(`Attempting to delete position ${id}. Available positions:`, data.positions.map(p => p.id));

  if (!data.positions) return res.status(404).json({ message: 'Position not found.' });

  const initialLength = data.positions.length;
  data.positions = data.positions.filter(p => p.id !== id);

  if (data.positions.length === initialLength) {
    return res.status(404).json({ message: 'Position not found.' });
  }

  // Optional: Clear positionId from candidates who had this position
  data.candidates.forEach(c => {
    if (c.positionId === id) {
      c.positionId = null;
    }
  });

  await saveElectionData(data);
  res.json({ message: 'Position deleted.', snapshot: buildSnapshot(data) });
});

app.post('/candidates', attachUser(true), requireAdmin, async (req, res) => {
  const { name, tagline, manifesto, imageUri, positionId } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Candidate name is required.' });
  }

  const data = await loadElectionData();

  // Validate positionId if provided
  if (positionId) {
    const positionExists = data.positions.some(p => p.id === positionId);
    if (!positionExists) {
      return res.status(400).json({ message: 'Invalid position ID.' });
    }
  }

  const candidate = {
    id: uuid(),
    positionId: positionId || null,
    name: name.trim(),
    tagline: (tagline || '').trim(),
    manifesto: (manifesto || '').trim(),
    imageUri: (imageUri || '').trim(),
    voteCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  data.candidates.push(candidate);
  await saveElectionData(data);

  res.status(201).json({ candidate: candidatePayload(candidate) });
});

app.put('/candidates/:id', attachUser(true), requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, tagline, manifesto, imageUri, positionId } = req.body || {};

  const data = await loadElectionData();
  const candidate = data.candidates.find((item) => item.id === id);

  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found.' });
  }

  // Validate positionId if provided
  if (positionId) {
    const positionExists = data.positions.some(p => p.id === positionId);
    if (!positionExists) {
      return res.status(400).json({ message: 'Invalid position ID.' });
    }
    candidate.positionId = positionId;
  } else if (positionId === null) {
    candidate.positionId = null; // Allow clearing position
  }

  candidate.name = name?.trim() || candidate.name;
  candidate.tagline = tagline?.trim() ?? candidate.tagline;
  candidate.manifesto = manifesto?.trim() ?? candidate.manifesto;
  candidate.imageUri = imageUri?.trim() ?? candidate.imageUri;
  candidate.updatedAt = Date.now();

  await saveElectionData(data);

  res.json({ candidate: candidatePayload(candidate) });
});

app.post('/candidates/:id/vote-count', attachUser(true), requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { newCount } = req.body || {};

  if (newCount == null || Number.isNaN(Number(newCount)) || Number(newCount) < 0) {
    return res.status(400).json({ message: 'Vote count must be a non-negative number.' });
  }

  const data = await loadElectionData();
  const candidate = data.candidates.find((item) => item.id === id);

  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found.' });
  }

  candidate.voteCount = Number(newCount);
  candidate.updatedAt = Date.now();
  const snapshot = buildSnapshot(data);

  await saveElectionData(data);

  res.json({ candidate: candidatePayload(candidate), snapshot });
});

app.delete('/candidates/:id', attachUser(true), requireAdmin, async (req, res) => {
  const { id } = req.params;
  const data = await loadElectionData();

  const initialLength = data.candidates.length;
  data.candidates = data.candidates.filter(c => c.id !== id);

  if (data.candidates.length === initialLength) {
    return res.status(404).json({ message: 'Candidate not found.' });
  }

  // Also remove any votes for this candidate
  data.votes = data.votes.filter(v => v.candidateId !== id);

  await saveElectionData(data);
  res.json({ message: 'Candidate deleted.', snapshot: buildSnapshot(data) });
});


app.patch('/election/meta', attachUser(true), requireAdmin, async (req, res) => {
  const { title, description, bannerImage, eligibility } = req.body || {};
  const data = await loadElectionData();

  if (title != null) {
    data.election.title = title.trim();
  }
  if (description != null) {
    data.election.description = description.trim();
  }
  if (bannerImage != null) {
    data.election.bannerImage = bannerImage.trim();
  }
  if (eligibility != null) {
    data.election.eligibility = eligibility;
  }

  await saveElectionData(data);

  res.json({ snapshot: buildSnapshot(data) });
});

app.patch('/election/schedule', attachUser(true), requireAdmin, async (req, res) => {
  const { votingStartsAt, votingEndsAt } = req.body || {};

  const start = votingStartsAt ? Number(votingStartsAt) : 0;
  const end = votingEndsAt ? Number(votingEndsAt) : 0;

  if (end && start && end <= start) {
    return res.status(400).json({ message: 'Voting end time must be after the start time.' });
  }

  const data = await loadElectionData();
  data.election.votingStartsAt = start;
  data.election.votingEndsAt = end;

  await saveElectionData(data);

  res.json({ snapshot: buildSnapshot(data) });
});

app.post('/election/phase', attachUser(true), requireAdmin, async (req, res) => {
  const { action } = req.body || {};

  if (!action) {
    return res.status(400).json({ message: 'Phase action is required.' });
  }

  const now = Math.floor(Date.now() / 1000);
  const data = await loadElectionData();
  const { election, candidates } = data;

  if (action === 'start') {
    if (election.phase !== 'Draft') {
      return res.status(400).json({ message: 'Voting has already started.' });
    }
    if (!candidates.length) {
      return res.status(400).json({ message: 'At least one candidate is required before starting.' });
    }
    if (election.votingStartsAt && now < Number(election.votingStartsAt)) {
      return res.status(400).json({ message: 'Voting start time has not been reached yet.' });
    }
    election.phase = 'Voting';
  } else if (action === 'close') {
    if (election.phase !== 'Voting') {
      return res.status(400).json({ message: 'Voting is not active.' });
    }
    election.phase = 'Ended';
  } else if (action === 'refresh') {
    if (election.phase === 'Voting' && election.votingEndsAt && now > Number(election.votingEndsAt)) {
      election.phase = 'Ended';
    }
  } else if (action === 'reset') {
    election.phase = 'Draft';
    election.votingStartsAt = 0;
    election.votingEndsAt = 0;
    election.lastVoteAt = 0;
    election.lastVoter = null;
    data.votes = [];
    data.candidates = data.candidates.map((candidate) => ({
      ...candidate,
      voteCount: 0,
      updatedAt: Date.now()
    }));
  } else {
    return res.status(400).json({ message: 'Unknown phase action.' });
  }

  await saveElectionData(data);
  res.json({ snapshot: buildSnapshot(data) });
});

app.post('/votes', attachUser(true), async (req, res) => {
  const { candidateId } = req.body || {};

  if (!candidateId) {
    return res.status(400).json({ message: 'Candidate ID is required.' });
  }

  const data = await loadElectionData();
  const { election, candidates, votes } = data;

  // Eligibility Check
  const user = req.user;
  const { departments, years } = election.eligibility || {};

  if (departments && departments.length > 0) {
    if (!user.department || !departments.includes(user.department)) {
      return res.status(403).json({ message: `Voting is restricted to: ${departments.join(', ')}` });
    }
  }

  if (years && years.length > 0) {
    if (!user.year || !years.includes(user.year)) {
      return res.status(403).json({ message: `Voting is restricted to years: ${years.join(', ')}` });
    }
  }

  if (election.phase !== 'Voting') {
    return res.status(400).json({ message: 'Voting is not currently open.' });
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (election.votingStartsAt && nowSeconds < Number(election.votingStartsAt)) {
    return res.status(400).json({ message: 'Voting has not started yet.' });
  }
  if (election.votingEndsAt && nowSeconds > Number(election.votingEndsAt)) {
    election.phase = 'Ended';
    await saveElectionData(data);
    return res.status(400).json({ message: 'Voting window has closed.' });
  }

  const candidate = candidates.find((item) => item.id === candidateId);
  if (!candidate) {
    return res.status(404).json({ message: 'Candidate not found.' });
  }

  // Check if user has already voted for this position
  const existingVote = votes.find((vote) => {
    if (vote.userId !== user.id) return false;

    // Find the candidate this vote was for
    const votedCandidate = candidates.find(c => c.id === vote.candidateId);
    if (!votedCandidate) return false;

    // Check if the positions match (both null or both same ID)
    return votedCandidate.positionId === candidate.positionId;
  });

  if (existingVote) {
    const positionTitle = candidate.positionId
      ? data.positions.find(p => p.id === candidate.positionId)?.title || 'this position'
      : 'this election';
    return res.status(400).json({ message: `You have already voted for ${positionTitle}.` });
  }

  const vote = {
    id: uuid(),
    userId: req.user.id,
    candidateId,
    createdAt: Date.now()
  };

  votes.push(vote);
  candidate.voteCount = Number(candidate.voteCount || 0) + 1;
  candidate.updatedAt = Date.now();
  election.lastVoteAt = Math.floor(vote.createdAt / 1000);
  election.lastVoter = req.user.username || req.user.email || req.user.id;

  await saveElectionData(data);

  const snapshot = buildSnapshot(data);

  // Generate QR code receipt for vote verification
  const receiptData = {
    voteId: vote.id,
    candidateId: vote.candidateId,
    candidateName: candidate.name,
    timestamp: vote.createdAt,
    verificationCode: crypto.createHash('sha256').update(`${vote.id}-${vote.userId}-${vote.candidateId}`).digest('hex').substring(0, 16).toUpperCase()
  };

  const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(receiptData));

  res.status(201).json({
    snapshot,
    candidate: candidatePayload(candidate),
    receipt: {
      ...receiptData,
      qrCode: qrCodeDataURL
    }
  });
});

// Export Results to PDF
app.get('/export/pdf', attachUser(true), requireAdmin, async (req, res) => {
  try {
    const data = await loadElectionData();
    const snapshot = buildSnapshot(data);

    const doc = generatePDF(data, snapshot);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="election-results-${Date.now()}.pdf"`);

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ message: 'Failed to generate PDF export.' });
  }
});

// Export Results to CSV
app.get('/export/csv', attachUser(true), requireAdmin, async (req, res) => {
  try {
    const data = await loadElectionData();
    const tempPath = path.join(__dirname, `results-${Date.now()}.csv`);

    await generateCSV(data, tempPath);

    res.download(tempPath, `election-results-${Date.now()}.csv`, async (err) => {
      // Clean up temp file
      try {
        await fs.unlink(tempPath);
      } catch (unlinkError) {
        console.warn('Failed to delete temp CSV:', unlinkError);
      }

      if (err) {
        console.error('CSV download error:', err);
      }
    });
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ message: 'Failed to generate CSV export.' });
  }
});

// Export Detailed Vote Records CSV (Admin Only)
app.get('/export/votes-csv', attachUser(true), requireAdmin, async (req, res) => {
  try {
    const data = await loadElectionData();
    const tempPath = path.join(__dirname, `vote-records-${Date.now()}.csv`);

    await generateDetailedVoteCSV(data, tempPath);

    res.download(tempPath, `vote-records-${Date.now()}.csv`, async (err) => {
      // Clean up temp file
      try {
        await fs.unlink(tempPath);
      } catch (unlinkError) {
        console.warn('Failed to delete temp CSV:', unlinkError);
      }

      if (err) {
        console.error('CSV download error:', err);
      }
    });
  } catch (error) {
    console.error('Vote CSV export error:', error);
    res.status(500).json({ message: 'Failed to generate vote records export.' });
  }
});

// Verify Vote Receipt
app.post('/verify-receipt', async (req, res) => {
  try {
    const { verificationCode, voteId } = req.body || {};

    if (!verificationCode || !voteId) {
      return res.status(400).json({ message: 'Verification code and vote ID are required.' });
    }

    const data = await loadElectionData();
    const vote = data.votes.find(v => v.id === voteId);

    if (!vote) {
      return res.status(404).json({ message: 'Vote not found.', valid: false });
    }

    // Recreate verification code (same algorithm as during vote)
    const expectedCode = crypto.createHash('sha256')
      .update(`${vote.id}-${vote.userId}-${vote.candidateId}`)
      .digest('hex')
      .substring(0, 16)
      .toUpperCase();

    if (verificationCode.toUpperCase() === expectedCode) {
      const candidate = data.candidates.find(c => c.id === vote.candidateId);
      return res.json({
        valid: true,
        vote: {
          candidateName: candidate?.name || 'Unknown',
          timestamp: vote.createdAt
        }
      });
    } else {
      return res.json({ valid: false, message: 'Invalid verification code.' });
    }
  } catch (error) {
    console.error('Receipt verification error:', error);
    res.status(500).json({ message: 'Failed to verify receipt.' });
  }
});

// ============================================
// ELECTION ARCHIVE ENDPOINTS
// ============================================

const ARCHIVE_DIR = path.join(__dirname, '..', 'archive');
const ARCHIVE_INDEX_FILE = path.join(ARCHIVE_DIR, 'election-index.json');

// Archive current election (Admin only)
app.post('/elections/archive', attachUser(true), requireAdmin, async (req, res) => {
  try {
    const data = await readJson(DATA_FILE, defaultElectionData);
    const { title, description } = req.body;

    // Create archive filename with timestamp
    const timestamp = Date.now();
    const archiveId = `election-${timestamp}`;
    const archiveFile = path.join(ARCHIVE_DIR, `${archiveId}.json`);

    // Calculate final stats
    const totalVotes = data.votes.length;
    const candidatesWithVotes = data.candidates.map(candidate => ({
      ...candidate,
      voteCount: data.votes.filter(v => v.candidateId === candidate.id).length
    }));

    const winner = candidatesWithVotes.reduce((max, c) =>
      (c.voteCount > (max?.voteCount || 0)) ? c : max,
      candidatesWithVotes[0]
    );

    // Archive data
    const archiveData = {
      id: archiveId,
      title: title || data.election.title,
      description: description || data.election.description,
      archivedAt: timestamp,
      election: data.election,
      candidates: candidatesWithVotes,
      votes: data.votes,
      stats: {
        totalVotes,
        winnerName: winner?.name || 'No votes',
        winnerVotes: winner?.voteCount || 0
      }
    };

    // Save archive file
    await fs.writeFile(archiveFile, JSON.stringify(archiveData, null, 2), 'utf8');

    // Update archive index
    let archiveIndex = { elections: [], lastUpdated: null };
    try {
      const indexContent = await fs.readFile(ARCHIVE_INDEX_FILE, 'utf8');
      archiveIndex = JSON.parse(indexContent);
    } catch (error) {
      // Index doesn't exist yet, will be created
    }

    archiveIndex.elections.push({
      id: archiveId,
      title: archiveData.title,
      archivedAt: timestamp,
      totalVotes,
      winner: winner?.name || 'No votes'
    });
    archiveIndex.lastUpdated = timestamp;

    await fs.writeFile(ARCHIVE_INDEX_FILE, JSON.stringify(archiveIndex, null, 2), 'utf8');

    res.json({
      message: 'Election archived successfully',
      archiveId,
      archivedAt: timestamp
    });
  } catch (error) {
    console.error('Archive election error:', error);
    res.status(500).json({ message: 'Failed to archive election.' });
  }
});

// Get list of archived elections
app.get('/elections/history', async (req, res) => {
  try {
    let archiveIndex = { elections: [], lastUpdated: null };
    try {
      const indexContent = await fs.readFile(ARCHIVE_INDEX_FILE, 'utf8');
      archiveIndex = JSON.parse(indexContent);
    } catch (error) {
      // No archives yet
    }

    // Sort by date, newest first
    archiveIndex.elections.sort((a, b) => b.archivedAt - a.archivedAt);

    res.json(archiveIndex);
  } catch (error) {
    console.error('Get archive history error:', error);
    res.status(500).json({ message: 'Failed to get archive history.' });
  }
});

// Get specific archived election details
app.get('/elections/history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const archiveFile = path.join(ARCHIVE_DIR, `${id}.json`);

    try {
      const archiveContent = await fs.readFile(archiveFile, 'utf8');
      const archiveData = JSON.parse(archiveContent);
      res.json(archiveData);
    } catch (error) {
      res.status(404).json({ message: 'Archived election not found.' });
    }
  } catch (error) {
    console.error('Get archived election error:', error);
    res.status(500).json({ message: 'Failed to get archived election.' });
  }
});

// --- Socket.io Setup ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});



io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('register', (userId) => {
    if (userId) {
      connectedUsers.set(userId, socket.id);
      console.log(`User ${userId} registered with socket ${socket.id}`);
      io.emit('user_status_update', { userId, isOnline: true });
    }
  });

  socket.on('disconnect', () => {
    let disconnectedUserId = null;
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        connectedUsers.delete(userId);
        break;
      }
    }
    if (disconnectedUserId) {
      console.log(`User ${disconnectedUserId} disconnected`);
      io.emit('user_status_update', { userId: disconnectedUserId, isOnline: false });
    }
  });
});


// Version endpoint to verify deployment
app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.0',
    commit: 'latest-with-debug',
    timestamp: new Date().toISOString()
  });
});

// Catch-all 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🔐 Portal API listening on http://localhost:${PORT}`);
  console.log('   Users file:', USERS_FILE);
  console.log('   Election data:', DATA_FILE);
  console.log('   Allowing origin(s):', allowedOrigins.join(', '));
  console.log('   Update JWT_SECRET in production.');
});
