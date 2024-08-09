import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { keccak256, encodePacked } from "viem";
import { getBlockTimestamp, impersonate, paramsDefault } from "./utils";

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
    const { resourceId, price, expirationDuration } = paramsDefault[0];

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

  describe("Should delete shop subscription", function () {
    it("existAccess() should return true or false accordingly", async function () {
      /* Arrange */

      const { pocketsub, wallet } = await loadFixture(deployPocketsubFixture);
      const { resourceId, price, expirationDuration, imageURL } = paramsDefault[0];

      /* Act */

      const dontexist = await pocketsub.read.existAccess([wallet.account.address, resourceId]);
      await pocketsub.write.setSubscription([resourceId, price, expirationDuration, imageURL]);
      const exist = await pocketsub.read.existAccess([wallet.account.address, resourceId]);
      await pocketsub.write.deleteSubscription([resourceId]);
      const dontexistAgain = await pocketsub.read.existAccess([wallet.account.address, resourceId]);
      await pocketsub.write.setSubscription([resourceId, price, expirationDuration, imageURL]);
      const existAgain = await pocketsub.read.existAccess([wallet.account.address, resourceId]);
      
      /* Assert */

      expect(dontexist).to.equal(false);
      expect(exist).to.equal(true);
      expect(dontexistAgain).to.equal(false);
      expect(existAgain).to.equal(true);
    });

    it("The item should be removed from the shop subscriptions", async function () {
      /* Arrange */

      const { pocketsub, wallet } = await loadFixture(deployPocketsubFixture);

      /* Act */

      await pocketsub.write.setSubscription([paramsDefault[0].resourceId, paramsDefault[0].price, paramsDefault[0].expirationDuration, paramsDefault[0].imageURL]);
      await pocketsub.write.setSubscription([paramsDefault[1].resourceId, paramsDefault[1].price, paramsDefault[1].expirationDuration, paramsDefault[1].imageURL]);
      await pocketsub.write.setSubscription([paramsDefault[2].resourceId, paramsDefault[2].price, paramsDefault[2].expirationDuration, paramsDefault[2].imageURL]);
      const threeSubs = await pocketsub.read.getShopSubscriptions([wallet.account.address]);
      await pocketsub.write.deleteSubscription([paramsDefault[1].resourceId]);
      const twoSubs = await pocketsub.read.getShopSubscriptions([wallet.account.address]);
      
      /* Assert */

      expect(threeSubs).to.have.length(3);
      expect(twoSubs).to.have.length(2);

      expect(threeSubs[threeSubs.length - 1].resourceId).to.equal(paramsDefault[2].resourceId);
      expect(twoSubs[twoSubs.length - 1].resourceId).to.equal(paramsDefault[2].resourceId);
    });
  });

  describe("Should mint customer subscription NFT", async function () {
    it("Should add shop address, image url and price to customer subscription NFT data", async function () {
      /* Arrange */

      const { pocketsub, wallets } = await loadFixture(deployPocketsubFixture);
      const { resourceId, price, expirationDuration, imageURL } = paramsDefault[0];

      const [Shop, Customer] = wallets;

      let shop = await impersonate(pocketsub, Shop);
      let customer = await impersonate(pocketsub, Customer);

      /* Act */

      await shop.write.setSubscription([resourceId, price, expirationDuration, imageURL]);
      const dealInfoEmpty = await pocketsub.read.dealInfo([0n]);
      await customer.write.mint([Shop.account.address, resourceId, Customer.account.address], { value: price });
      await shop.write.deleteSubscription([resourceId]);
      const dealInfo = await pocketsub.read.dealInfo([0n]);

      /* Assert */

      expect(dealInfoEmpty[0]).to.be.equal('0x0000000000000000000000000000000000000000');
      expect(dealInfoEmpty[1]).to.be.equal('');
      expect(dealInfoEmpty[2]).to.be.equal(0n);

      expect(dealInfo[0].toLowerCase).to.be.equal(Shop.account.address.toLowerCase);
      expect(dealInfo[1]).to.be.equal(imageURL);
      expect(dealInfo[2]).to.be.equal(price);
    });

    it("Should give the right tokenURI", async function () {
      /* Arrange */

      const { pocketsub, wallets } = await loadFixture(deployPocketsubFixture);
      const { resourceId, price, expirationDuration, imageURL } = paramsDefault[0];

      const [Shop, Customer] = wallets;

      let shop = await impersonate(pocketsub, Shop);
      let customer = await impersonate(pocketsub, Customer);

      await shop.write.setSubscription([resourceId, price, expirationDuration, imageURL]);

      /* Act */

      const mintTime = await getBlockTimestamp();
      await customer.write.mint([Shop.account.address, resourceId, Customer.account.address], { value: price });

      const tokenURI = await pocketsub.read.tokenURI([0n]);
      const metadata = JSON.parse(tokenURI.slice(27,tokenURI.length));

      /* Assert */

      expect(metadata.name).to.be.equal(resourceId);
      expect(metadata.image).to.be.equal(imageURL);
      expect(metadata.attributes[0].value).to.be.equal(mintTime + expirationDuration + 1);
    });
  });

  it("Should display metadata of customer subscription NFT after shop subscription is deleted", async function () {
  });

  it("Should test if customer has access to resource", async function () {
  });
});