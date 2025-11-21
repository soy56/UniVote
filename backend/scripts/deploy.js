const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying College Election Contract...");

  const CollegeElection = await hre.ethers.getContractFactory("CollegeElection");
  const election = await CollegeElection.deploy();
  await election.deployed();

  console.log("✅ Contract deployed to:", election.address);
  console.log("📋 COPY THIS ADDRESS - You'll need it for the frontend!");

  console.log("\n🎨 Configuring election branding...");
  const metaTx = await election.updateElectionMeta(
    "Campus Leadership Elections 2025",
    "Choose the next generation of leaders driving innovation, inclusion, and student wellbeing.",
    "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=80"
  );
  await metaTx.wait();

  console.log("\n📝 Adding showcase candidates...");
  const candidates = [
    {
      name: "Alice Johnson",
      tagline: "Transparency • Tech • Trust",
      manifesto:
        "Launch a campus-wide open budget dashboard, expand 24/7 study hubs, and fund mental health sprints led by peer mentors.",
      image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Mohammed Singh",
      tagline: "Every Voice, Every Seat",
      manifesto:
        "Create a multilingual student senate, redesign club funding to reward collaboration, and host monthly town-hall lightning rounds.",
      image: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Priya Patel",
      tagline: "Planet First Campus",
      manifesto:
        "Deploy solar microgrids, implement zero-waste dining pilots, and launch climate justice hackathons with local partners.",
      image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
    },
  ];

  for (const candidate of candidates) {
    const tx = await election.addCandidate(
      candidate.name,
      candidate.tagline,
      candidate.manifesto,
      candidate.image
    );
    await tx.wait();
  }

  console.log("✅ Showcase candidates added!");

  console.log("\n⏱️ Scheduling voting window...");
  const now = Math.floor(Date.now() / 1000);
  const windowTx = await election.configureVotingWindow(0, now + 7 * 24 * 60 * 60);
  await windowTx.wait();

  const startTx = await election.startVoting();
  await startTx.wait();
  console.log("✅ Voting opened for one week.");

  console.log("\n🎉 Setup complete! Your voting system is ready!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
