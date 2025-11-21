const { ethers } = require('ethers');
const fs = require('fs');

async function main() {
  const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');

  // Use a known Hardhat account private key for testing (Account #1)
  const privKey = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
  const wallet = new ethers.Wallet(privKey, provider);

  // Read contract address from frontend env for convenience
  let contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  try {
    const env = fs.readFileSync('../frontend/.env.local', 'utf8');
    const m = env.match(/REACT_APP_CONTRACT_ADDRESS=(0x[0-9a-fA-F]+)/);
    if (m) contractAddress = m[1];
  } catch (e) {
    // ignore and use fallback
  }

  const abi = [
    'function candidateCount() public view returns (uint)',
    'function getCandidate(uint) public view returns (string memory, uint)',
    'function vote(uint _candidateId) public',
  ];

  const contract = new ethers.Contract(contractAddress, abi, wallet);

  console.log('Using contract at', contractAddress);

  // Read current votes for candidate 1
  try {
    const [nameBefore, votesBefore] = await contract.getCandidate(1);
    console.log(`Before: ${nameBefore} has ${votesBefore.toString()} votes`);
  } catch (e) {
    console.error('Error reading before state:', e.message || e);
  }

  // Send vote tx
  try {
    const tx = await contract.vote(1);
    console.log('Sent vote tx, hash:', tx.hash);
    await tx.wait();
    console.log('Vote tx confirmed');
  } catch (e) {
    console.error('Error sending vote:', e.message || e);
  }

  // Read votes after
  try {
    const [nameAfter, votesAfter] = await contract.getCandidate(1);
    console.log(`After: ${nameAfter} has ${votesAfter.toString()} votes`);
  } catch (e) {
    console.error('Error reading after state:', e.message || e);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
