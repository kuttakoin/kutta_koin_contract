const hre = require("hardhat");

async function main() {
  const KuttaKoin = await hre.ethers.getContractFactory("KuttaKoin");
  const kuttaKoin = await KuttaKoin.deploy();
  await kuttaKoin.waitForDeployment();
  console.log("Kutta Koin is live, bitches: ", await kuttaKoin.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
