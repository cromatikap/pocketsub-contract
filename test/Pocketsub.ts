import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { impersonate, paramsDefault } from "./utils";

describe("Pocketsub", function () {
  async function deployPocketsubFixture() {
    
    const [wallet, ...wallets] = await hre.viem.getWalletClients();

    const GKM = await hre.viem.deployContract("Pocketsub", []);

    return {
      wallet,
      wallets,
      GKM
    };
  }

});