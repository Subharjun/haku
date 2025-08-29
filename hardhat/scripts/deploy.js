// Deploy script for LoanAgreementFactory
const hre = require("hardhat");

async function main() {
  console.log("Deploying LoanAgreementFactory...");

  // Get the contract factory
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get the contract factory
  const LoanAgreementFactory = await hre.ethers.getContractFactory("LoanAgreementFactory");
  
  // Deploy the contract
  const factory = await LoanAgreementFactory.deploy();
  
  // Wait for deployment to finish
  await factory.deployed();
  
  // Get the contract address
  const factoryAddress = factory.address;
  
  console.log("LoanAgreementFactory deployed to:", factoryAddress);
  
  // Verify contract on Etherscan if not on localhost
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("Waiting for 6 confirmation blocks before verification...");
    await factory.deployTransaction.wait(6);
    
    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: factoryAddress,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.error("Error verifying contract:", error);
    }
  }
  
  return factoryAddress;
}

// Execute the deployment
main()
  .then((factoryAddress) => {
    console.log("Deployment complete. Factory address:", factoryAddress);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  }); 