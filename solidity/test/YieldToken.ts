import { expect } from "chai";
import hre from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
	ProxyAdmin,
	ProxyAdmin__factory,
	YieldPoolV2,
	YieldPoolV2__factory,
	YieldTokenV2,
	YieldTokenV2__factory,
} from "../typechain-types";

describe("YieldTokenV2 proxy", async () => {
	let yieldTokenV2Factory: YieldTokenV2__factory;
	let ProxyAdminFactory: ProxyAdmin__factory;
	let YieldTokenV2: YieldTokenV2;
	let YieldPoolV2: YieldPoolV2;
	let YieldPoolV2Factory: YieldPoolV2__factory;

	let owner: SignerWithAddress;
	let otherAccount: SignerWithAddress;
	let otherAccount2: SignerWithAddress;
	let ProxyAdmin: ProxyAdmin;
	const amount = hre.ethers.parseUnits("10000000", 18);

	const tokenName = "YieldEDU";
	const tokenSymbol = "YDU";

	const yieldRate = 10;
	const minDuration = 86400;
	const maxDuration = 31536000;

	beforeEach(async () => {
		[owner, otherAccount, otherAccount2] = await hre.ethers.getSigners();
		yieldTokenV2Factory = await hre.ethers.getContractFactory("YieldTokenV2");
		ProxyAdminFactory = await hre.ethers.getContractFactory("ProxyAdmin");
		YieldPoolV2Factory = await hre.ethers.getContractFactory("YieldPoolV2");

		YieldTokenV2 = await yieldTokenV2Factory.deploy();
		YieldPoolV2 = await YieldPoolV2Factory.deploy();

		// Deploy ProxyAdmin
		ProxyAdmin = await ProxyAdminFactory.deploy(owner.address);

		const TransparentUpgradeableProxy = await hre.ethers.getContractFactory(
			"TransparentUpgradeableProxy"
		);

		//  deploy YieldToken proxy
		const YieldTokenProxy = await TransparentUpgradeableProxy.deploy(
			await YieldTokenV2.getAddress(),
			await ProxyAdmin.getAddress(),
			YieldTokenV2.interface.encodeFunctionData("initialize", [
				tokenName,
				tokenSymbol,
				owner.address,
			])
		);

		// deploy YieldPool proxy with proxied YieldTokenV2 address
		const YieldPoolProxy = await TransparentUpgradeableProxy.connect(
			owner
		).deploy(
			await YieldPoolV2.getAddress(),
			await ProxyAdmin.getAddress(),
			YieldPoolV2.interface.encodeFunctionData("initialize", [
				await YieldTokenV2.getAddress(),
				yieldRate,
				minDuration,
				maxDuration,
			])
		);

		// Get YieldPoolV2 proxied instance
		YieldPoolV2 = YieldPoolV2Factory.attach(
			await YieldPoolProxy.getAddress()
		) as YieldPoolV2;

		// Get YieldTokenV2 proxied instance first
		YieldTokenV2 = yieldTokenV2Factory.attach(
			await YieldTokenProxy.getAddress()
		) as YieldTokenV2;
	});

	it("setMinter should revert if not called by owner", async () => {
		await expect(
			YieldTokenV2.connect(otherAccount).setMinter(otherAccount.address, true)
		).to.be.revertedWithCustomError(YieldTokenV2, "OwnableUnauthorizedAccount");
	});

	it("successfully sets a minter", async () => {
		await expect(YieldTokenV2.setMinter(otherAccount.address, true))
			.to.emit(YieldTokenV2, "MinterSet")
			.withArgs(otherAccount, true);
	});

	it("reverts when address is not a minter", async () => {
		await expect(YieldTokenV2.setMinter(otherAccount.address, true))
			.to.emit(YieldTokenV2, "MinterSet")
			.withArgs(otherAccount, true);

		await expect(YieldTokenV2.removeMinter(otherAccount2)).to.be.revertedWith(
			"Address is not a minter"
		);
	});
	it("successfully removes a minter", async () => {
		await expect(YieldTokenV2.setMinter(otherAccount.address, true))
			.to.emit(YieldTokenV2, "MinterSet")
			.withArgs(otherAccount, true);

		await expect(YieldTokenV2.removeMinter(otherAccount))
			.to.emit(YieldTokenV2, "MinterSet")
			.withArgs(otherAccount, false);
		await expect(YieldTokenV2.removeMinter(otherAccount2)).to.be.revertedWith(
			"Address is not a minter"
		);
	});

	it("successfully get minters", async () => {
		await expect(YieldTokenV2.setMinter(otherAccount.address, true))
			.to.emit(YieldTokenV2, "MinterSet")
			.withArgs(otherAccount, true);

		expect(await YieldTokenV2.getMinters()).to.include(otherAccount.address);
	});

	it("allows only owner to mint", async () => {
		await expect(
			YieldTokenV2.connect(otherAccount).mint(otherAccount2, amount)
		).to.be.revertedWithCustomError(YieldTokenV2, "UnauthorizedMinter");
	});

	it("successfully mints to an address", async () => {
		await expect(YieldTokenV2.mint(otherAccount2, amount))
			.to.emit(YieldTokenV2, "TokensMinted")
			.withArgs(otherAccount2, amount, owner);
	});

	it("reverts when mint to pool by an unauthorized owner", async () => {
		await expect(
			YieldTokenV2.connect(otherAccount).mintToPool(
				await YieldTokenV2.getAddress()
			)
		)
			.to.revertedWithCustomError(YieldTokenV2, "OwnableUnauthorizedAccount")
			.withArgs(otherAccount);
	});
	it("successfully min to pool by authorized owner", async () => {
		await expect(YieldTokenV2.mintToPool(await YieldPoolV2.getAddress()))
			.to.emit(YieldTokenV2, "TokensMinted")
			.withArgs(YieldPoolV2, amount, owner);

		expect(await YieldTokenV2.balanceOf(YieldPoolV2)).to.be.equals(amount);
	});

	it("should manage student status correctly", async () => {
		expect(await YieldTokenV2.getIsStudent(otherAccount)).to.be.equals(false);

		await YieldTokenV2.setStudentStatus(otherAccount, true);
		expect(await YieldTokenV2.getIsStudent(otherAccount)).to.be.equals(true);

		expect(await YieldTokenV2.getIsStudent(owner)).to.be.equals(false);
		expect(await YieldTokenV2.getIsStudent(owner)).to.be.equals(false);
	});

	it("should revert if an unauthorized account tries to burn tokens", async () => {
		await expect(YieldTokenV2.mintToPool(await YieldPoolV2.getAddress()))
			.to.emit(YieldTokenV2, "TokensMinted")
			.withArgs(YieldPoolV2, amount, owner);
		expect(await YieldTokenV2.balanceOf(YieldPoolV2)).to.be.equals(amount);

		await expect(YieldTokenV2.connect(otherAccount).burn(YieldPoolV2, amount))
			.to.be.revertedWithCustomError(YieldTokenV2, "OwnableUnauthorizedAccount")
			.withArgs(otherAccount);
	});

	it("should burn tokens", async () => {
		await expect(YieldTokenV2.mintToPool(await YieldPoolV2.getAddress()))
			.to.emit(YieldTokenV2, "TokensMinted")
			.withArgs(YieldPoolV2, amount, owner);
		expect(await YieldTokenV2.balanceOf(YieldPoolV2)).to.be.equals(amount);
		expect(await YieldTokenV2.burn(YieldPoolV2, amount));
		expect(await YieldTokenV2.balanceOf(YieldPoolV2)).to.be.equals(0);
	});
});
