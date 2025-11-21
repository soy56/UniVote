const hre = require('hardhat');

async function main() {
  console.log('Deploying contract (ephemeral Hardhat network)...');
  const CollegeElection = await hre.ethers.getContractFactory('CollegeElection');
  const election = await CollegeElection.deploy();
  await election.deployed();
  console.log('Deployed to:', election.address);

  console.log('Adding test candidates...');
  const tx1 = await election.addCandidate(
    'Alice Johnson',
    'Transparency • Tech • Trust',
    'Launch a campus-wide open budget dashboard, expand 24/7 study hubs, and fund mental health sprints led by peer mentors.',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80'
  );
  await tx1.wait();
  const tx2 = await election.addCandidate(
    'Mohammed Singh',
    'Every Voice, Every Seat',
    'Create a multilingual student senate, redesign club funding to reward collaboration, and host monthly town-hall lightning rounds.',
    'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80'
  );
  await tx2.wait();

  const startTx = await election.startVoting();
  await startTx.wait();

  const signers = await hre.ethers.getSigners();
  const voter = signers[1];
  console.log('Using voter address:', voter.address);

  // Connect contract with voter and vote for candidate 1
  const electionWithVoter = election.connect(voter);
  const voteTx = await electionWithVoter.vote(1);
  await voteTx.wait();
  console.log('Voter cast a vote for candidate 1');

  // Read results
  const [name, votes] = await election.getCandidate(1);
  console.log(`Candidate 1: ${name} — ${votes.toString()} votes`);

  console.log('Test complete');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
