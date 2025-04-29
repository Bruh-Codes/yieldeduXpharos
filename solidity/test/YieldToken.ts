import { expect } from "chai";
import hre from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
	YieldPool,
	YieldPool__factory,
	YieldToken,
	YieldToken__factory,
} from "../typechain-types";

describe("YieldToken proxy", async () => {
	let yieldTokenFactory: YieldToken__factory;
	let YieldToken: YieldToken;
	let YieldPool: YieldPool;
	let YieldPoolFactory: YieldPool__factory;

	let owner: SignerWithAddress;
	let otherAccount: SignerWithAddress;
	let otherAccount2: SignerWithAddress;
	const amount = hre.ethers.parseUnits("10000000", 18);

	const tokenName = "YieldEDU";
	const tokenSymbol = "YDU";

	const yieldRate = 10;
	const minDuration = 86400;
	const maxDuration = 31536000;

	beforeEach(async () => {
		[owner, otherAccount, otherAccount2] = await hre.ethers.getSigners();
		yieldTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		YieldPoolFactory = await hre.ethers.getContractFactory("YieldPool");

		YieldToken = await yieldTokenFactory.deploy(owner,tokenName,tokenSymbol);
		YieldPool = await YieldPoolFactory.deploy(await YieldToken.getAddress(),yieldRate,minDuration,maxDuration);

	});

	it("setMinter should revert if not called by owner", async () => {
		await expect(
			YieldToken.connect(otherAccount).setMinter(otherAccount.address, true)
		).to.be.revertedWithCustomError(YieldToken, "OwnableUnauthorizedAccount");
	});

	it("successfully sets a minter", async () => {
		await expect(YieldToken.setMinter(otherAccount.address, true))
			.to.emit(YieldToken, "MinterSet")
			.withArgs(otherAccount, true);
	});

	it("reverts when address is not a minter", async () => {
		await expect(YieldToken.setMinter(otherAccount.address, true))
			.to.emit(YieldToken, "MinterSet")
			.withArgs(otherAccount, true);

		await expect(YieldToken.removeMinter(otherAccount2)).to.be.revertedWith(
			"Address is not a minter"
		);
	});
	it("successfully removes a minter", async () => {
		await expect(YieldToken.setMinter(otherAccount.address, true))
			.to.emit(YieldToken, "MinterSet")
			.withArgs(otherAccount, true);

		await expect(YieldToken.removeMinter(otherAccount))
			.to.emit(YieldToken, "MinterSet")
			.withArgs(otherAccount, false);
		await expect(YieldToken.removeMinter(otherAccount2)).to.be.revertedWith(
			"Address is not a minter"
		);
	});

	it("successfully get minters", async () => {
		await expect(YieldToken.setMinter(otherAccount.address, true))
			.to.emit(YieldToken, "MinterSet")
			.withArgs(otherAccount, true);

		expect(await YieldToken.getMinters()).to.include(otherAccount.address);
	});

	it("allows only owner to mint", async () => {
		await expect(
			YieldToken.connect(otherAccount).mint(otherAccount2, amount)
		).to.be.revertedWithCustomError(YieldToken, "UnauthorizedMinter");
	});

	it("successfully mints to an address", async () => {
		await expect(YieldToken.mint(otherAccount2, amount))
			.to.emit(YieldToken, "TokensMinted")
			.withArgs(otherAccount2, amount, owner);
	});

	it("reverts when mint to pool by an unauthorized owner", async () => {
		await expect(
			YieldToken.connect(otherAccount).mintToPool(
				await YieldToken.getAddress()
			)
		)
			.to.revertedWithCustomError(YieldToken, "OwnableUnauthorizedAccount")
			.withArgs(otherAccount);
	});
	it("successfully min to pool by authorized owner", async () => {
		await expect(YieldToken.mintToPool(await YieldPool.getAddress()))
			.to.emit(YieldToken, "TokensMinted")
			.withArgs(YieldPool, amount, owner);

		expect(await YieldToken.balanceOf(YieldPool)).to.be.equals(amount);
	});

	it("should manage student status correctly", async () => {
		expect(await YieldToken.getIsStudent(otherAccount)).to.be.equals(false);

		await YieldToken.setStudentStatus(otherAccount, true);
		expect(await YieldToken.getIsStudent(otherAccount)).to.be.equals(true);

		expect(await YieldToken.getIsStudent(owner)).to.be.equals(false);
		expect(await YieldToken.getIsStudent(owner)).to.be.equals(false);
	});

	it("should revert if an unauthorized account tries to burn tokens", async () => {
		await expect(YieldToken.mintToPool(await YieldPool.getAddress()))
			.to.emit(YieldToken, "TokensMinted")
			.withArgs(YieldPool, amount, owner);
		expect(await YieldToken.balanceOf(YieldPool)).to.be.equals(amount);

		await expect(YieldToken.connect(otherAccount).burn(YieldPool, amount))
			.to.be.revertedWithCustomError(YieldToken, "OwnableUnauthorizedAccount")
			.withArgs(otherAccount);
	});

	it("should burn tokens", async () => {
		await expect(YieldToken.mintToPool(await YieldPool.getAddress()))
			.to.emit(YieldToken, "TokensMinted")
			.withArgs(YieldPool, amount, owner);
		expect(await YieldToken.balanceOf(YieldPool)).to.be.equals(amount);
		expect(await YieldToken.burn(YieldPool, amount));
		expect(await YieldToken.balanceOf(YieldPool)).to.be.equals(0);
	});
});
