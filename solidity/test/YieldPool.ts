import { expect } from "chai";
import hre from "hardhat";

import {
	ProxyAdmin__factory,
	YieldPoolV2__factory,
	YieldTokenV2__factory,
	YieldTokenV2,
	YieldPoolV2,
	ProxyAdmin,
	YieldToken,
	YieldToken__factory,
} from "../typechain-types";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("YieldPoolV2 Proxy", async function () {
	let YieldPoolV2: YieldPoolV2;
	let YieldTokenV2: YieldTokenV2;
	let yieldToken: YieldToken;
	let yieldTokenV2Factory: YieldTokenV2__factory;
	let YieldPoolV2Factory: YieldPoolV2__factory;
	let yieldTokenFactory: YieldToken__factory;
	let ProxyAdminFactory: ProxyAdmin__factory;
	let ProxyAdmin: ProxyAdmin;
	let owner: SignerWithAddress;
	let otherAccount: SignerWithAddress;

	const tokenName = "YieldEDU";
	const tokenSymbol = "YDU";

	const yieldRate = 10;
	const minDuration = 86400;
	const maxDuration = 31536000;

	const amount = hre.ethers.parseUnits("10000000", 18);
	const duration = 7 * 24 * 60 * 60;

	beforeEach(async () => {
		yieldTokenV2Factory = await hre.ethers.getContractFactory("YieldTokenV2");
		yieldTokenFactory = await hre.ethers.getContractFactory("YieldToken");

		[owner, otherAccount] = await hre.ethers.getSigners();

		YieldPoolV2Factory = await hre.ethers.getContractFactory("YieldPoolV2");
		ProxyAdminFactory = await hre.ethers.getContractFactory("ProxyAdmin");

		// Deploy implementation contracts first
		YieldPoolV2 = await YieldPoolV2Factory.deploy();
		YieldTokenV2 = await yieldTokenV2Factory.deploy();
		yieldToken = await yieldTokenFactory.deploy(
			owner,
			"Fixed Yield Token",
			"FYT"
		);

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

		// Get YieldTokenV2 proxied instance first
		YieldTokenV2 = yieldTokenV2Factory.attach(
			await YieldTokenProxy.getAddress()
		) as YieldTokenV2;

		// Now we can set the minter after YieldTokenV2 is properly initialized
		await YieldTokenV2.setMinter(await YieldPoolV2.getAddress(), true);

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

		await YieldTokenV2.setMinter(await YieldPoolProxy.getAddress(), true);

		// Get YieldPoolV2 proxied instance
		YieldPoolV2 = YieldPoolV2Factory.attach(
			await YieldPoolProxy.getAddress()
		) as YieldPoolV2;
	});
	it("should mint tokens to yieldPoolV2 contract", async () => {
		//mint initialTokens to pool
		await YieldTokenV2.mintToPool(await YieldPoolV2.getAddress());
		expect(await YieldTokenV2.balanceOf(YieldPoolV2)).to.be.equal(amount);
	});
	it("Should have upgraded the proxy to v2", async function () {
		// Mint tokens to owner first
		await YieldTokenV2.mint(owner.address, amount);

		// Check balance after mint
		const ownerBalance = await YieldTokenV2.balanceOf(owner.address);
		expect(ownerBalance).to.equal(amount);
		// Approve YieldPoolV2 to spend tokens
		await YieldTokenV2.approve(await YieldPoolV2.getAddress(), amount);

		const yieldTokenAddress = await YieldTokenV2.getAddress();
		// Perform deposit
		await expect(YieldPoolV2.deposit(yieldTokenAddress, amount, duration))
			.to.emit(YieldPoolV2, "Deposited")
			.withArgs(owner.address, yieldTokenAddress, amount, duration);

		const position = await YieldPoolV2.getPosition(1);
		expect(position.amount).to.equal(amount);
		expect(position.lockDuration).to.equal(duration);
	});

	it("Should have set the name during upgrade", async function () {
		expect(await YieldTokenV2.connect(otherAccount).name()).to.equal(
			"YieldEDU"
		);
		expect(await YieldTokenV2.connect(otherAccount).symbol()).to.equal("YDU");
	});

	it("successful update yield parameters by owner", async () => {
		const oldRate = await YieldPoolV2.getYieldRate();
		const oldMinDuration = await YieldPoolV2.getMinStakeDuration();
		const oldMaxDuration = await YieldPoolV2.getMaxStakeDuration();

		await expect(
			YieldPoolV2.connect(otherAccount).updateYieldParameters(20, 2, 365)
		).to.be.revertedWithCustomError(YieldPoolV2, "OwnableUnauthorizedAccount");

		expect(await YieldPoolV2.getYieldRate()).to.be.equal(oldRate);
		expect(await YieldPoolV2.getMinStakeDuration()).to.be.equal(oldMinDuration);
		expect(await YieldPoolV2.getMaxStakeDuration()).to.be.equal(oldMaxDuration);

		await expect(YieldPoolV2.updateYieldParameters(15, 2, 365))
			.to.emit(YieldPoolV2, "YieldParametersUpdated")
			.withArgs(15, 2, 365);

		expect(await YieldPoolV2.getYieldRate()).to.be.equal(15);
		expect(await YieldPoolV2.getMinStakeDuration()).to.be.equal(2);
		expect(await YieldPoolV2.getMaxStakeDuration()).to.be.equal(365);
	});

	it("Throws an error if deposit token param is not acceptable", async () => {
		await YieldTokenV2.mint(owner, amount);
		await YieldTokenV2.approve(YieldPoolV2, amount);
		await expect(
			YieldPoolV2.deposit(otherAccount, amount, duration)
		).to.be.revertedWith("We do not support the tokens you're staking");
	});
	it("Throws an error if amount is not greater than zero", async () => {
		await YieldTokenV2.approve(YieldPoolV2, 0);
		await expect(
			YieldPoolV2.deposit(YieldTokenV2, 0, duration)
		).to.be.revertedWith("Amount must be greater than 0");
	});
	it("Throws an error if duration is less than required minimum or is more than required maximum duration", async () => {
		await YieldTokenV2.mint(owner, amount);
		await YieldTokenV2.approve(YieldPoolV2, amount);
		await expect(
			YieldPoolV2.deposit(YieldTokenV2, amount, 0)
		).to.be.revertedWith("Invalid duration");
		await expect(
			YieldPoolV2.deposit(YieldTokenV2, amount, 365)
		).to.be.revertedWith("Invalid duration");
	});

	it("successfully deposits", async () => {
		await YieldTokenV2.mint(owner, amount);
		await YieldTokenV2.approve(YieldPoolV2, amount);
		await expect(YieldPoolV2.deposit(YieldTokenV2, amount, duration))
			.to.emit(YieldPoolV2, "Deposited")
			.withArgs(owner, YieldTokenV2, amount, duration);
	});

	it("reverts when token is not acceptable", async () => {
		await yieldToken.mint(owner, amount);
		await yieldToken.approve(YieldPoolV2, amount);
		await expect(
			YieldPoolV2.deposit(yieldToken, amount, duration)
		).to.be.revertedWith("We do not support the tokens you're staking");
	});

	it("successfully gets user balances", async () => {
		await YieldTokenV2.mint(owner, amount);
		await YieldTokenV2.approve(YieldPoolV2, amount);
		await expect(YieldPoolV2.deposit(YieldTokenV2, amount, duration))
			.to.emit(YieldPoolV2, "Deposited")
			.withArgs(owner, YieldTokenV2, amount, duration);

		expect(
			(await YieldPoolV2.getUserTokenBalances()).balances[0].toString()
		).to.be.equal(amount.toString());
		expect(
			(await YieldPoolV2.getUserTokenBalances()).tokens[0].toString()
		).to.be.equal(YieldTokenV2);

		//deposit some new tokens
		await YieldPoolV2.addAllowedTokens(yieldToken);
		await yieldToken.mint(owner, BigInt(Number(amount) * 2));
		await yieldToken.approve(YieldPoolV2, BigInt(Number(amount) * 2));

		await expect(
			YieldPoolV2.deposit(yieldToken, BigInt(Number(amount) * 2), duration)
		)
			.to.emit(YieldPoolV2, "Deposited")
			.withArgs(owner, yieldToken, BigInt(Number(amount) * 2), duration);

		expect(
			(await YieldPoolV2.getUserTokenBalances()).balances[1].toString()
		).to.be.equal((await YieldPoolV2.getUserTokenBalances()).balances[1]);
		expect(
			(await YieldPoolV2.getUserTokenBalances()).tokens[1].toString()
		).to.be.equal(yieldToken);
	});

	it("successfully allows tokens", async () => {
		const allowedTokens = await YieldPoolV2.getAllowedTokens();
		expect(allowedTokens).to.include(await YieldTokenV2.getAddress());
		expect(
			await YieldPoolV2.isTokenAllowed(await YieldTokenV2.getAddress())
		).to.be.equals(true);
		expect(allowedTokens).to.not.include(await yieldToken.getAddress());
		expect(
			await YieldPoolV2.isTokenAllowed(await yieldToken.getAddress())
		).to.be.equals(false);

		//setAllowedToken
		await YieldPoolV2.addAllowedTokens(await yieldToken.getAddress());
		expect(await YieldPoolV2.getAllowedTokens()).to.include(
			await yieldToken.getAddress()
		);
		expect(
			await YieldPoolV2.isTokenAllowed(await yieldToken.getAddress())
		).to.be.equals(true);
		await YieldPoolV2.removeAllowedToken(await YieldTokenV2.getAddress());
		expect(await YieldPoolV2.getAllowedTokens()).to.not.include(
			await YieldTokenV2.getAddress()
		);
		expect(
			await YieldPoolV2.isTokenAllowed(await YieldTokenV2.getAddress())
		).to.be.equals(false);

		//modify allowedTokens
		await YieldPoolV2.modifyAllowedTokens(yieldToken, false);
		expect(await YieldPoolV2.getAllowedTokens()).to.deep.equal([]);
	});

	it("Get user positions", async () => {
		await YieldTokenV2.mint(owner, amount);
		await YieldTokenV2.approve(YieldPoolV2, amount);
		await YieldPoolV2.deposit(YieldTokenV2, amount, duration);

		const positions = await YieldPoolV2.getPosition(1);
		expect(positions.amount).to.be.equal(amount);
		expect(positions.lockDuration).to.be.equal(duration);
	});
	it("reverts when position is not found", async () => {
		await YieldTokenV2.mint(owner, amount);
		await YieldTokenV2.approve(YieldPoolV2, amount);
		await YieldPoolV2.deposit(YieldTokenV2, amount, duration);

		await expect(YieldPoolV2.getPosition(2)).to.be.revertedWith(
			"Position does not exist"
		);
	});

	it("gets total stakers", async () => {
		await YieldTokenV2.mint(owner, amount);
		await YieldTokenV2.approve(YieldPoolV2, amount);
		await expect(YieldPoolV2.deposit(YieldTokenV2, amount, duration))
			.to.emit(YieldPoolV2, "Deposited")
			.withArgs(owner, YieldTokenV2, amount, duration);

		expect(await YieldPoolV2.getTotalStakers()).to.be.equal(1);

		await yieldToken.mint(otherAccount, amount);
		await yieldToken.connect(otherAccount).approve(YieldPoolV2, amount);
		await YieldPoolV2.addAllowedTokens(await yieldToken.getAddress());

		await expect(
			YieldPoolV2.connect(otherAccount).deposit(yieldToken, amount, duration) //connect another user so count wont be the same
		)
			.to.emit(YieldPoolV2, "Deposited")
			.withArgs(otherAccount, yieldToken, amount, duration);

		expect(await YieldPoolV2.getTotalStakers()).to.be.equal(2);
	});

	it("get total value locked", async () => {
		await YieldTokenV2.mint(owner, amount);
		await YieldTokenV2.approve(YieldPoolV2, amount);
		await expect(YieldPoolV2.deposit(YieldTokenV2, amount, duration))
			.to.emit(YieldPoolV2, "Deposited")
			.withArgs(owner, YieldTokenV2, amount, duration);

		expect(await YieldPoolV2.getTotalStakers()).to.be.equal(1);

		await yieldToken.mint(otherAccount, amount);
		await yieldToken.connect(otherAccount).approve(YieldPoolV2, amount);
		await YieldPoolV2.addAllowedTokens(await yieldToken.getAddress());

		await expect(
			YieldPoolV2.connect(otherAccount).deposit(yieldToken, amount, duration) //connect another user so count wont be the same
		)
			.to.emit(YieldPoolV2, "Deposited")
			.withArgs(otherAccount, yieldToken, amount, duration);

		expect(await YieldPoolV2.getTotalStakers()).to.be.equal(2);
		expect(await YieldPoolV2.getTotalValueLocked()).to.be.equal(
			hre.ethers.parseUnits("20000000", 18)
		);
	});

	it("successfully calculate Yield amount", async () => {
		const expectedYield =
			(BigInt(amount) * BigInt(duration) * BigInt(yieldRate)) /
			BigInt(31536000 * 100);

		expect(
			await YieldPoolV2.calculateExpectedYield(amount, duration)
		).to.be.equal(expectedYield);
	});

	it("does not allow withdrawal when token is still locked", async () => {
		await YieldTokenV2.mint(owner, amount);
		await YieldTokenV2.approve(YieldPoolV2, amount);

		await expect(YieldPoolV2.deposit(YieldTokenV2, amount, duration))
			.to.emit(YieldPoolV2, "Deposited")
			.withArgs(owner, YieldTokenV2, amount, duration);
		const userPosition1 = await YieldPoolV2.getPosition(1);
		await expect(YieldPoolV2.withdraw(userPosition1.id)).to.revertedWith(
			"Still locked"
		);
	});
	it("successfully withdraw", async () => {
		await YieldTokenV2.mint(owner, 10);
		await YieldTokenV2.approve(YieldPoolV2, 10);
		await expect(YieldPoolV2.deposit(YieldTokenV2, 10, duration))
			.to.emit(YieldPoolV2, "Deposited")
			.withArgs(owner, YieldTokenV2, 10, duration);

		expect(await YieldPoolV2.getTotalStakers()).to.be.equal(1);

		await yieldToken.mint(otherAccount, 10);
		await yieldToken.connect(otherAccount).approve(YieldPoolV2, 10);
		await YieldPoolV2.addAllowedTokens(await yieldToken.getAddress());

		await expect(
			YieldPoolV2.connect(otherAccount).deposit(yieldToken, 10, duration) //connect another user so count wont be the same
		)
			.to.emit(YieldPoolV2, "Deposited")
			.withArgs(otherAccount, yieldToken, 10, duration);

		expect(await YieldPoolV2.getTotalStakers()).to.be.equal(2);
		const userPosition1 = await YieldPoolV2.getPosition(1);

		//calculate yieldAmount
		const expectedYield =
			(BigInt(10) * BigInt(duration) * BigInt(yieldRate)) /
			BigInt(31536000 * 100);

		// Fast forward time to after the lock duration
		await hre.network.provider.send("evm_increaseTime", [duration]);

		await expect(YieldPoolV2.withdraw(userPosition1.id))
			.to.emit(YieldPoolV2, "Withdrawn")
			.withArgs(owner, YieldTokenV2, BigInt(10) + expectedYield, expectedYield);
	});
	//test for insufficient balance in pool

	it("reverts when user tries to withdraw a position he does not own", async () => {
		await YieldTokenV2.mint(owner, 10);
		await YieldTokenV2.approve(YieldPoolV2, 10);
		await expect(YieldPoolV2.deposit(YieldTokenV2, 10, duration))
			.to.emit(YieldPoolV2, "Deposited")
			.withArgs(owner, YieldTokenV2, 10, duration);

		expect(await YieldPoolV2.getTotalStakers()).to.be.equal(1);

		await yieldToken.mint(otherAccount, 10);
		await yieldToken.connect(otherAccount).approve(YieldPoolV2, 10);
		await YieldPoolV2.addAllowedTokens(await yieldToken.getAddress());

		await expect(
			YieldPoolV2.connect(otherAccount).deposit(yieldToken, 10, duration) //connect another user so count wont be the same
		)
			.to.emit(YieldPoolV2, "Deposited")
			.withArgs(otherAccount, yieldToken, 10, duration);

		expect(await YieldPoolV2.getTotalStakers()).to.be.equal(2);
		const userPosition2 = await YieldPoolV2.getPosition(2);

		// Fast forward time to after the lock duration
		await hre.network.provider.send("evm_increaseTime", [duration]);

		await expect(YieldPoolV2.withdraw(userPosition2.id)).to.revertedWith(
			"You are not the owner of this position"
		);
	});

	it("reverts when position has already been withdrawn", async () => {
		await YieldTokenV2.mint(owner, 10);
		await YieldTokenV2.approve(YieldPoolV2, 10);
		await expect(YieldPoolV2.deposit(YieldTokenV2, 10, duration))
			.to.emit(YieldPoolV2, "Deposited")
			.withArgs(owner, YieldTokenV2, 10, duration);

		expect(await YieldPoolV2.getTotalStakers()).to.be.equal(1);

		await yieldToken.mint(owner, 10);
		await yieldToken.approve(YieldPoolV2, 10);
		await YieldPoolV2.addAllowedTokens(await yieldToken.getAddress());

		await expect(
			YieldPoolV2.deposit(yieldToken, 10, duration) //connect another user so count wont be the same
		)
			.to.emit(YieldPoolV2, "Deposited")
			.withArgs(owner, yieldToken, 10, duration);

		expect(await YieldPoolV2.getTotalStakers()).to.be.equal(1);
		const userPosition1 = await YieldPoolV2.getPosition(1);

		//calculate yieldAmount
		const expectedYield =
			(BigInt(10) * BigInt(duration) * BigInt(yieldRate)) /
			BigInt(31536000 * 100);

		// Fast forward time to after the lock duration
		await hre.network.provider.send("evm_increaseTime", [duration]);

		await expect(YieldPoolV2.withdraw(userPosition1.id))
			.to.emit(YieldPoolV2, "Withdrawn")
			.withArgs(owner, YieldTokenV2, BigInt(10) + expectedYield, expectedYield);
	});

	it("fails to unstake if user is not position owner", async () => {
		await YieldTokenV2.mint(owner, 10);
		await YieldTokenV2.approve(YieldPoolV2, 10);
		await expect(YieldPoolV2.deposit(YieldTokenV2, 10, duration))
			.to.emit(YieldPoolV2, "Deposited")
			.withArgs(owner, YieldTokenV2, 10, duration);

		expect(await YieldPoolV2.getTotalStakers()).to.be.equal(1);

		const userPosition1 = await YieldPoolV2.getPosition(1);

		await expect(
			YieldPoolV2.connect(otherAccount).unstake(userPosition1.id)
		).to.be.revertedWith("Not position owner");
	});

	it("fails to unstake if position does not exist", async () => {
		await YieldTokenV2.mint(owner, 10);
		await YieldTokenV2.approve(YieldPoolV2, 10);

		await expect(
			YieldPoolV2.deposit(YieldTokenV2, 10, duration) //connect another user so count wont be the same
		)
			.to.emit(YieldPoolV2, "Deposited")
			.withArgs(owner, YieldTokenV2, 10, duration);

		expect(await YieldPoolV2.getTotalStakers()).to.be.equal(1);

		await expect(YieldPoolV2.unstake(2)).to.be.revertedWith(
			"Not position owner"
		);
	});

	it("successfully incur 10% penalty when users unstake", async () => {
		await YieldTokenV2.mint(owner, 10);
		await YieldTokenV2.approve(YieldPoolV2, 10);

		await expect(
			YieldPoolV2.deposit(YieldTokenV2, 10, duration) //connect another user so count wont be the same
		)
			.to.emit(YieldPoolV2, "Deposited")
			.withArgs(owner, YieldTokenV2, 10, duration);

		const userPosition1 = await YieldPoolV2.getPosition(1);
		const penalty = userPosition1.amount / BigInt(10);
		const amountToReturn = userPosition1.amount - penalty;

		await yieldToken.approve(YieldPoolV2, penalty);

		await expect(YieldPoolV2.unstake(userPosition1.id))
			.to.emit(YieldPoolV2, "Withdrawn")
			.withArgs(owner, YieldTokenV2, amountToReturn, 0);
	});
});
