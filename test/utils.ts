import hre from "hardhat";

/*
 * { impersonateAccount } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
 * doesn't work so here is the home made version
 */
const impersonate = async (contract: any, account: any) =>
  await hre.viem.getContractAt(
    "Pocketsub",
    contract.address,
    { client: { wallet: account } }
  );

const paramsDefault = [
  {
  resourceId: "pass 1 day",
  price: BigInt(25),
  expirationDuration: 1,
  imageURL: "https://1"
  },
  {
    resourceId: "pass 1 week",
    price: BigInt(310),
    expirationDuration: 7,
    imageURL: "https://2"
  },
  {
    resourceId: "pass 12 months",
    price: BigInt(12500),
    expirationDuration: 365,
    imageURL: "https://3"
  }
];

async function increaseTime(seconds: number) {
  await hre.network.provider.request({
    method: "evm_increaseTime",
    params: [seconds],
  });
  await hre.network.provider.request({
    method: "evm_mine",
    params: [],
  });
}

async function getBlockTimestamp() {
  const block = await hre.network.provider.request({
    method: "eth_getBlockByNumber",
    params: ["latest", false], // false means we don't need full transaction objects
  });

  return Number(block.timestamp);
}

export { impersonate, paramsDefault, increaseTime, getBlockTimestamp };