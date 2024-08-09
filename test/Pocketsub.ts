import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { keccak256, encodePacked } from "viem";
import { impersonate, paramsDefault } from "./utils";

describe("Pocketsub", function () {
  async function deployPocketsubFixture() {
    
    const [wallet, ...wallets] = await hre.viem.getWalletClients();

    const pocketsub = await hre.viem.deployContract("Pocketsub", []);

    return {
      wallet,
      wallets,
      pocketsub
    };
  }

  it("Should set access and push resourceId and imageURL to author resources", async function () {
    /* Arrange */

    const { pocketsub, wallet } = await loadFixture(deployPocketsubFixture);
    const { resourceId, price, expirationDuration } = paramsDefault;

    const expectedHash = keccak256(encodePacked(
      ['address', 'string'],
      [wallet.account.address, resourceId]
    ));

    /* Act */

    await pocketsub.write.setSubscription([resourceId, price, expirationDuration, "https://TBD"]);
    const access = await pocketsub.read.accessControl([expectedHash]);

    /* Assert */

    expect(access[0]).to.equal(resourceId);
    expect(access[1]).to.equal(price);
    expect(access[2]).to.equal(expirationDuration);
  });

  it("Should get subscriptions made by store owner", async function () {
    /* Arrange */

    const { pocketsub, wallets } = await loadFixture(deployPocketsubFixture);

    const [Shop1, Shop2] = wallets;

    let shop1 = await impersonate(pocketsub, Shop1);
    let shop2 = await impersonate(pocketsub, Shop2);

    /* Act */

    await shop1.write.setSubscription(["pass 1 day", BigInt(10), 1, "https://1"]);
    await shop1.write.setSubscription(["pass 1 month", BigInt(30), 30, "https://2"]);
    await shop1.write.setSubscription(["pass 12 months", BigInt(250), 365, "https://3"]);

    await shop2.write.setSubscription(["other shop", BigInt(3), 4, "https://othershop"]);

    const result1 = await pocketsub.read.getShopSubscriptions([Shop1.account.address]);
    const result2 = await pocketsub.read.getShopSubscriptions([Shop2.account.address]);

    /* Assert */

    expect(result1).to.have.length(3);

    expect(result1[0].resourceId).to.equal("pass 1 day");
    expect(result1[1].resourceId).to.equal("pass 1 month");
    expect(result1[2].resourceId).to.equal("pass 12 months");

    expect(result1[0].price).to.equal(BigInt(10));
    expect(result1[1].price).to.equal(BigInt(30));
    expect(result1[2].price).to.equal(BigInt(250));

    expect(result1[0].expirationDuration).to.equal(1);
    expect(result1[1].expirationDuration).to.equal(30);
    expect(result1[2].expirationDuration).to.equal(365);

    expect(result1[0].imageURL).to.equal("https://1");
    expect(result1[1].imageURL).to.equal("https://2");
    expect(result1[2].imageURL).to.equal("https://3");

    expect(result2).to.have.length(1);
    expect(result2[0].resourceId).to.equal("other shop");
    expect(result2[0].price).to.equal(BigInt(3));
    expect(result2[0].expirationDuration).to.equal(4);
    expect(result2[0].imageURL).to.equal("https://othershop");
  });
});