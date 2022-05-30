const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Mudded Marketplace", () => {
	let muddedCoin;
	let muddedMarketplace;
	let owner;

	before(async () => {
		[owner, address2] = await ethers.getSigners();

		const MuddedCoin = await ethers.getContractFactory("MuddedCoin");
		muddedCoin = await MuddedCoin.deploy();
		await (await muddedCoin.freeMint()).wait();

		const MuddedMarketplace = await ethers.getContractFactory("MuddedMarketplace");
		muddedMarketplace = await MuddedMarketplace.deploy(muddedCoin.address);

		await muddedCoin.approve(muddedMarketplace.address, ethers.utils.parseEther("100000000"));
	});

	it("should set token address", async () => {
		expect(await muddedMarketplace.token()).to.equal(muddedCoin.address);
	});

	it("should add whitelist", async () => {
		const name = "Test WL";
		const price = ethers.utils.parseEther("100");
		const startTime = 123456;
		const available = 1;
		await (await muddedMarketplace.addWhitelist(name, price, startTime, available)).wait();
		const whitelist = await muddedMarketplace.getWhitelist(0);

		expect(whitelist.name).to.equal(name);
		expect(whitelist.price).to.equal(price);
		expect(whitelist.startTime).to.equal(startTime);
		expect(whitelist.available).to.equal(available);
		expect(whitelist.purchased).to.equal(0);
	});

	it("should update whitelist", async () => {
		const newStartTime = 999999999999;
		const newPrice = ethers.utils.parseEther("10000000");
		const newAvailable = 2;
		await (await muddedMarketplace.updateWhitelist(newPrice, newStartTime, newAvailable, 0)).wait();
		const whitelist = await muddedMarketplace.getWhitelist(0);

		expect(whitelist.price).to.equal(newPrice);
		expect(whitelist.startTime).to.equal(newStartTime);
		expect(whitelist.available).to.equal(newAvailable);
	});

	it("should fail to purchase inactive whitelist", async () => {
		await expect(muddedMarketplace.purchase(0)).to.be.revertedWith("Whitelist not live!");
	});

	it("should successfully purchase whitelist", async () => {
		const newStartTime = 123456;
		const newPrice = ethers.utils.parseEther("100");
		const newAvailable = 2;
		await (await muddedMarketplace.updateWhitelist(newPrice, newStartTime, newAvailable, 0)).wait();
		const previousOwnerBalance = await muddedCoin.balanceOf(owner.address);
		await (await muddedMarketplace.purchase(0)).wait();
		const whitelist = await muddedMarketplace.getWhitelist(0);
		const buyers = await muddedMarketplace.getBuyerAddresses(0);
		const currentOwnerBalance = await muddedCoin.balanceOf(owner.address);

		expect(whitelist.purchased).to.equal(1);
		expect(buyers[0]).to.equal(owner.address);
		expect(await muddedCoin.balanceOf(muddedMarketplace.address)).to.equal(ethers.utils.parseEther("100"));
		expect(ethers.utils.formatEther(previousOwnerBalance) - ethers.utils.formatEther(currentOwnerBalance)).to.equal(100);
	});

	it("should fail to purchase to whitelist twice", async () => {
		await expect(muddedMarketplace.purchase(0)).to.be.revertedWith("Buyer has already purchased!");
	});

	it("should fail to purchase full whitelist", async () => {
		const newStartTime = 123456;
		const newPrice = ethers.utils.parseEther("100");
		const newAvailable = 1;
		await (await muddedMarketplace.updateWhitelist(newPrice, newStartTime, newAvailable, 0)).wait();

		await expect(muddedMarketplace.purchase(0)).to.be.revertedWith("None available!");
	});

	it("should withdraw token balance to owner", async () => {
		const previousOwnerBalance = await muddedCoin.balanceOf(owner.address);
		await (await muddedMarketplace.ownerWithdraw()).wait();
		const currentOwnerBalance = await muddedCoin.balanceOf(owner.address);

		expect(await muddedCoin.balanceOf(muddedMarketplace.address)).to.equal(0);
		expect(ethers.utils.formatEther(currentOwnerBalance) - ethers.utils.formatEther(previousOwnerBalance)).to.equal(100);
	});
});
