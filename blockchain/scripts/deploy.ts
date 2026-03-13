import { network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const { ethers } = await network.connect();
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with account:", deployer.address);

  const DoctorStore = await ethers.getContractFactory("DoctorStore", deployer);
  const doctorStore = await DoctorStore.deploy();
  await doctorStore.waitForDeployment();

  const address = await doctorStore.getAddress();
  console.log("DoctorStore deployed to:", address);

  // Save address to backend/blockchain/
  const outDir = path.join(process.cwd(), "..", "backend", "blockchain");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "contract-address.json"),
    JSON.stringify({ address }, null, 2)
  );
  console.log("Contract address saved to backend/blockchain/contract-address.json");
}

main().catch(console.error);