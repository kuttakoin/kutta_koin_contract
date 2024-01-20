const { expect } = require("chai");
const hre = require("hardhat");

describe("KuttaKoin Contract", function() {
  // global vars
  let token;
  let kuttaKoin;
  let owner;
  let addr1;
  let addr2;
  let tokenCap = 150847000;
  let tokenBlockRewardDivisor = 1000000;
  let initialSupply = 15084700;
  let maxBlockReward = 1000;
  let outstandingSupply = tokenCap - initialSupply;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    token = await ethers.getContractFactory("KuttaKoin");
    [owner, addr1, addr2] = await hre.ethers.getSigners();

    // Deploy the token
    kuttaKoin = await token.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await kuttaKoin.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await kuttaKoin.balanceOf(owner.address);
      expect(await kuttaKoin.totalSupply()).to.equal(ownerBalance);
      expect(ownerBalance == initialSupply);
    });

    it("Should set the max capped supply to the argument provided during deployment", async function () {
      const cap = await kuttaKoin.cap();
      expect(Number(hre.ethers.formatEther(cap))).to.equal(tokenCap);
    });

    it("Should set the blockReward to the argument provided during deployment", async function () {
      const blockReward = await kuttaKoin.getBlockReward();
      const expectedReward = (tokenCap - initialSupply) / tokenBlockRewardDivisor;
      expect(Number(hre.ethers.formatEther(blockReward))).to.equal(expectedReward);
    });
  });

  describe("Setting Block Rewards", function () {
    it("Cap block reward higher than maximum allowed", async function () {
      await kuttaKoin.setBlockRewardDivisor(2);
      const blockReward = await kuttaKoin.getBlockReward();
      expect(Number(hre.ethers.formatEther(blockReward))).to.equal(maxBlockReward);
    });

    it("Do not allow non-owner to set block reward", async function () {
      await expect(kuttaKoin.connect(addr1).setBlockRewardDivisor(100));
      const blockReward = await kuttaKoin.getBlockReward();
      const expectedReward = (tokenCap - initialSupply) / tokenBlockRewardDivisor;
      expect(Number(hre.ethers.formatEther(blockReward))).to.equal(expectedReward);
    });
  });

  describe("Transactions", function () {
    it("Should provide miner reward on transaction", async function () {
      const initialSupply = await kuttaKoin.totalSupply();
      const expectedReward = await kuttaKoin.getBlockReward();

      // Transfer 50 tokens from owner to addr1
      await kuttaKoin.transfer(addr1.address, 50);
      const addr1Balance = await kuttaKoin.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      // Expect miner reward increases supply
      expect(await kuttaKoin.totalSupply()).to.equal(initialSupply + expectedReward);
    });

    it("Should transfer tokens between accounts", async function () {
      // Transfer 50 tokens from owner to addr1
      await kuttaKoin.transfer(addr1.address, 50);
      const addr1Balance = await kuttaKoin.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      // Transfer 50 tokens from addr1 to addr2
      // We use .connect(signer) to send a transaction from another account
      await kuttaKoin.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await kuttaKoin.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await kuttaKoin.balanceOf(owner.address);
      const addr1Balance = await kuttaKoin.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(0);

      // Try to send 1 token from addr1 (0 tokens) to owner (1000000 tokens).
      // `require` will evaluate false and revert the transaction.
      await expect(kuttaKoin.connect(addr1).transfer(owner.address, 1))
          .to.be.revertedWithCustomError(kuttaKoin, "ERC20InsufficientBalance");

      // Owner balance shouldn't have changed.
      expect(await kuttaKoin.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await kuttaKoin.balanceOf(owner.address);

      // Transfer 100 tokens from owner to addr1.
      await kuttaKoin.transfer(addr1.address, 100);

      // Transfer another 50 tokens from owner to addr2.
      await kuttaKoin.transfer(addr2.address, 50);

      // Check balances.
      const finalOwnerBalance = await kuttaKoin.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance - BigInt(150));

      const addr1Balance = await kuttaKoin.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(100);

      const addr2Balance = await kuttaKoin.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });
  });
  
  describe("Minting", function () {
    it("Should allow minting new tokens by owner", async function () {
      const initialOwnerBalance = await kuttaKoin.balanceOf(owner.address);
      expect(initialOwnerBalance).to.equal(BigInt(initialSupply) * BigInt(10 ** 18));

      const initialAddr1Balance = await kuttaKoin.balanceOf(addr1.address);
      expect(initialAddr1Balance).to.equal(0);

      const initialTotalSupply = await kuttaKoin.totalSupply();
      expect(initialTotalSupply).to.equal(BigInt(initialSupply) * BigInt(10 ** 18));

      await kuttaKoin.mintToUser(addr1.address, 50);
      const finalAddr1Balance = await kuttaKoin.balanceOf(addr1.address);
      const finalOwnerBalance = await kuttaKoin.balanceOf(owner.address);
      const finalTotalSupply = await kuttaKoin.totalSupply();
      expect(finalAddr1Balance).to.equal(50);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance);
      expect(finalTotalSupply).to.equal(initialOwnerBalance + finalAddr1Balance);
    });
  });
});