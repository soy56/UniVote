import { ethers } from 'ethers';

// Contract address is read from environment for easier redeploys.
// Set REACT_APP_CONTRACT_ADDRESS in `frontend/.env.local` or fallback to the example address.
const CONTRACT_ADDRESS =
  process.env.REACT_APP_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const FALLBACK_RPC = process.env.REACT_APP_FALLBACK_RPC || 'http://127.0.0.1:8545';

// Contract ABI (rules for talking to the contract)
const CONTRACT_ABI = [
  'function admin() view returns (address)',
  'function hasVoted(address) view returns (bool)',
  'function checkIfVoted(address) view returns (bool)',
  'function candidateCount() view returns (uint256)',
  'function totalVotes() view returns (uint256)',
  'function phase() view returns (uint8)',
  'function electionTitle() view returns (string)',
  'function electionDescription() view returns (string)',
  'function bannerImage() view returns (string)',
  'function votingStartsAt() view returns (uint256)',
  'function votingEndsAt() view returns (uint256)',
  'function lastVoter() view returns (address)',
  'function lastVoteAt() view returns (uint256)',
  'function getElectionSnapshot() view returns (tuple(string title,string description,string bannerImage,uint8 phase,uint256 candidateCount,uint256 totalVotes,uint256 votingStartsAt,uint256 votingEndsAt,uint256 lastVoteAt,address lastVoter))',
  'function getCandidate(uint256) view returns (string memory,uint256)',
  'function getCandidateDetails(uint256) view returns (tuple(uint256 id,string name,string tagline,string manifesto,string imageUri,uint256 voteCount))',
  'function getAllCandidates() view returns (tuple(uint256 id,string name,string tagline,string manifesto,string imageUri,uint256 voteCount)[])',
  'function getLeadingCandidate() view returns (tuple(uint256 id,string name,string tagline,string manifesto,string imageUri,uint256 voteCount))',
  'function addCandidate(string,string,string,string)',
  'function updateCandidate(uint256,string,string,string,string)',
  'function updateElectionMeta(string,string,string)',
  'function configureVotingWindow(uint256,uint256)',
  'function startVoting()',
  'function closeVoting()',
  'function refreshPhase()',
  'function adminSetVoteCount(uint256,uint256)',
  'function vote(uint256)',
  'event CandidateAdded(uint256 indexed candidateId, string name)',
  'event CandidateUpdated(uint256 indexed candidateId, string name)',
  'event VoteCast(address indexed voter, uint256 indexed candidateId)',
  'event PhaseChanged(uint8)',
  'event ElectionMetadataUpdated(string title, string description, string banner)',
  'event VoteCountAdjusted(uint256 indexed candidateId, uint256 previousCount, uint256 newCount)'
];

export const phaseLabels = ['Draft', 'Voting', 'Ended'];

const getEthersProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum);
  }
  return new ethers.providers.JsonRpcProvider(FALLBACK_RPC);
};

export const getProvider = () => getEthersProvider();

export const getSigner = () => {
  const provider = getEthersProvider();
  if (!provider.getSigner) {
    throw new Error('Signer unavailable');
  }
  return provider.getSigner();
};

export const getContract = (withSigner = false) => {
  const provider = getEthersProvider();
  if (withSigner && provider.getSigner) {
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider.getSigner());
  }
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
};

export const connectWallet = async () => {
  if (!(typeof window !== 'undefined' && window.ethereum)) {
    alert('Please install MetaMask browser extension!');
    return null;
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    return accounts;
  } catch (error) {
    console.error('Error connecting wallet:', error);
    return null;
  }
};
