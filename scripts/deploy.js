const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying SumoBattle contract...");

  const SumoBattle = await hre.ethers.getContractFactory("SumoBattle");
  const sumoBattle = await SumoBattle.deploy();

  await sumoBattle.waitForDeployment();

  const address = await sumoBattle.getAddress();

  console.log("✅ SumoBattle deployed to:", address);
  console.log("");
  console.log("📋 Next steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Update frontend/sumo-game/contract.js:");
  console.log(`   address: '${address}'`);
  console.log("3. Update frontend/sumo-game/app.js:");
  console.log("   mockMode: false");
  console.log("");
  console.log("🎉 Done! Now deploy to Vercel with: ./deploy.sh");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
