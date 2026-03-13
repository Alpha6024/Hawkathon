const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load contract address
const addressPath = path.join(__dirname, "contract-address.json");
const CONTRACT_ADDRESS = fs.existsSync(addressPath)
  ? JSON.parse(fs.readFileSync(addressPath)).address
  : null;

// ABI
const ABI = [
  "function registerDoctor(string name, string specialty, string experience, uint256 fee) public",
  "function setAvailability(uint256 id, bool available) public",
  "function getAllDoctors() public view returns (tuple(uint256 id, string name, string specialty, string experience, uint256 fee, bool available, uint256 timestamp)[])",
  "function getDoctor(uint256 id) public view returns (tuple(uint256 id, string name, string specialty, string experience, uint256 fee, bool available, uint256 timestamp))",
  "function getCount() public view returns (uint256)",
];

const getContract = () => {
  if (!CONTRACT_ADDRESS)
    throw new Error("Contract not deployed yet. Run: npx hardhat run scripts/deploy.ts --network localhost");

  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const wallet   = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
};

const registerDoctorOnChain = async (name, specialty, experience, fee) => {
  const contract = getContract();
  const tx = await contract.registerDoctor(name, specialty, experience, BigInt(fee));
  const receipt = await tx.wait();
  console.log(`✅ Doctor "${name}" on blockchain. TxHash: ${tx.hash}`);
  return { txHash: tx.hash, blockNumber: receipt.blockNumber };
};

const getAllDoctorsFromChain = async () => {
  const contract = getContract();
  const doctors  = await contract.getAllDoctors();
  return doctors.map((d) => ({
    id:         Number(d.id),
    name:       d.name,
    specialty:  d.specialty,
    experience: d.experience,
    fee:        Number(d.fee),
    available:  d.available,
    timestamp:  new Date(Number(d.timestamp) * 1000).toLocaleString(),
  }));
};

const setAvailabilityOnChain = async (id, available) => {
  const contract = getContract();
  const tx = await contract.setAvailability(BigInt(id), available);
  await tx.wait();
  return { txHash: tx.hash };
};

module.exports = { registerDoctorOnChain, getAllDoctorsFromChain, setAvailabilityOnChain };