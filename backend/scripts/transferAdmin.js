const fs = require('fs');
const hre = require('hardhat');

async function main() {
  const newAdmin = process.env.NEW_ADMIN;
  if (!newAdmin) {
    throw new Error('Please set the NEW_ADMIN environment variable to the wallet address that should receive admin rights.');
  }

  let contractAddress = process.env.CONTRACT_ADDRESS || process.env.CONTRACT;
  if (!contractAddress) {
    try {
      const envContents = fs.readFileSync('../frontend/.env.local', 'utf8');
      const match = envContents.match(/REACT_APP_CONTRACT_ADDRESS=(0x[0-9a-fA-F]+)/);
      if (match) {
        contractAddress = match[1];
      }
    } catch (error) {
      // ignore missing file
    }
  }

  if (!contractAddress) {
    throw new Error('Unable to determine contract address. Set CONTRACT_ADDRESS environment variable or ensure frontend/.env.local has REACT_APP_CONTRACT_ADDRESS.');
  }

  console.log('🔐 Transferring admin rights for contract', contractAddress);
  console.log('➡️  New admin wallet:', newAdmin);

  const election = await hre.ethers.getContractAt('CollegeElection', contractAddress);
  const currentAdmin = await election.admin();
  console.log('👤 Current admin:', currentAdmin);

  if (currentAdmin.toLowerCase() === newAdmin.toLowerCase()) {
    console.log('ℹ️  The provided address already holds admin rights. Nothing to do.');
    return;
  }

  const tx = await election.transferAdmin(newAdmin);
  console.log('📨 Transaction submitted:', tx.hash);
  await tx.wait();
  console.log('✅ Admin rights transferred successfully.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
