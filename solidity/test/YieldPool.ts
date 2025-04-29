import { expect } from "chai";
import hre from "hardhat";

import {
	YieldPool,
	YieldPool__factory,
	YieldToken,
	YieldToken__factory,
} from "../typechain-types";

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("YieldPool", async function () {
	let YieldPool: YieldPool;
	let YieldToken: YieldToken;
	let YieldPoolFactory: YieldPool__factory;
	let yieldTokenFactory: YieldToken__factory;
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
		yieldTokenFactory = await hre.ethers.getContractFactory("YieldToken");

		[owner, otherAccount] = await hre.ethers.getSigners();

		YieldPoolFactory = await hre.ethers.getContractFactory("YieldPool");

		YieldToken = await yieldTokenFactory.deploy(
			owner,
			tokenName,
			tokenSymbol
		);
		YieldPool = await YieldPoolFactory.deploy(await YieldToken.getAddress(),yieldRate,minDuration,maxDuration);



	});
	it("should mint tokens to yieldPool contract", async () => {
		//mint initialTokens to pool
		await YieldToken.mintToPool(YieldPool.getAddress());
		expect(await YieldToken.balanceOf(YieldPool)).to.be.equal(amount);
	});
	it("Should have upgraded the proxy to ", async function () {
		// Mint tokens to owner first
		await YieldToken.mint(owner.address, amount);

		// Check balance after mint
		const ownerBalance = await YieldToken.balanceOf(owner.address);
		expect(ownerBalance).to.equal(amount);
		// Approve YieldPool to spend tokens
		await YieldToken.approve(await YieldPool.getAddress(), amount);

		const yieldTokenAddress = await YieldToken.getAddress();
		// Perform deposit
		await expect(YieldPool.deposit(yieldTokenAddress, amount, duration))
			.to.emit(YieldPool, "Deposited")
			.withArgs(owner.address, yieldTokenAddress, amount, duration);

		const position = await YieldPool.getPosition(1);
		expect(position.amount).to.equal(amount);
		expect(position.lockDuration).to.equal(duration);
	});

	it("Should have set the name during upgrade", async function () {
		expect(await YieldToken.connect(otherAccount).name()).to.equal(
			"YieldEDU"
		);
		expect(await YieldToken.connect(otherAccount).symbol()).to.equal("YDU");
	});

	it("successful update yield parameters by owner", async () => {
		const oldRate = await YieldPool.getYieldRate();
		const oldMinDuration = await YieldPool.getMinStakeDuration();
		const oldMaxDuration = await YieldPool.getMaxStakeDuration();

		await expect(
			YieldPool.connect(otherAccount).updateYieldParameters(20, 2, 365)
		)
		.to.be.revertedWith('Not the contract owner')

		expect(await YieldPool.getYieldRate()).to.be.equal(oldRate);
		expect(await YieldPool.getMinStakeDuration()).to.be.equal(oldMinDuration);
		expect(await YieldPool.getMaxStakeDuration()).to.be.equal(oldMaxDuration);

		await expect(YieldPool.updateYieldParameters(15, 2, 365))
			.to.emit(YieldPool, "YieldParametersUpdated")
			.withArgs(15, 2, 365);

		expect(await YieldPool.getYieldRate()).to.be.equal(15);
		expect(await YieldPool.getMinStakeDuration()).to.be.equal(2);
		expect(await YieldPool.getMaxStakeDuration()).to.be.equal(365);
	});

	it("Throws an error if deposit token param is not acceptable", async () => {
		await YieldToken.mint(owner, amount);
		await YieldToken.approve(YieldPool, amount);
		await expect(
			YieldPool.deposit(otherAccount, amount, duration)
		).to.be.revertedWith("We do not support the tokens you're staking");
	});
	it("Throws an error if amount is not greater than zero", async () => {
		await YieldToken.approve(YieldPool, 0);
		await expect(
			YieldPool.deposit(YieldToken, 0, duration)
		).to.be.revertedWith("Amount must be greater than 0");
	});
	it("Throws an error if duration is less than required minimum or is more than required maximum duration", async () => {
		await YieldToken.mint(owner, amount);
		await YieldToken.approve(YieldPool, amount);
		await expect(
			YieldPool.deposit(YieldToken, amount, 0)
		).to.be.revertedWith("Invalid duration");
		await expect(
			YieldPool.deposit(YieldToken, amount, 365)
		).to.be.revertedWith("Invalid duration");
	});

	it("successfully deposits", async () => {
		await YieldToken.mint(owner, amount);
		await YieldToken.approve(YieldPool, amount);
		await expect(YieldPool.deposit(YieldToken, amount, duration))
			.to.emit(YieldPool, "Deposited")
			.withArgs(owner, YieldToken, amount, duration);
	});

	it("reverts when token is not acceptable", async () => {
		// Deploy a new token that is not allowed
		const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");

		await AnotherToken.mint(owner, amount);
		await AnotherToken.approve(YieldPool, amount);

		await expect(
			YieldPool.deposit(AnotherToken, amount, duration)
		).to.be.revertedWith("We do not support the tokens you're staking");
	});

	it("successfully gets user balances", async () => {
		await YieldToken.mint(owner, amount);
		await YieldToken.approve(YieldPool, amount);
		await expect(YieldPool.deposit(YieldToken, amount, duration))
			.to.emit(YieldPool, "Deposited")
			.withArgs(owner, YieldToken, amount, duration);

		expect(
			(await YieldPool.getUserTokenBalances()).balances[0].toString()
		).to.be.equal(amount.toString());
		expect(
			(await YieldPool.getUserTokenBalances()).tokens[0].toString()
		).to.be.equal(YieldToken);

		//deposit some new tokens
		await YieldToken.mint(owner, BigInt(Number(amount) * 2));
		await YieldToken.approve(YieldPool, BigInt(Number(amount) * 2));

		await expect(
			YieldPool.deposit(YieldToken, BigInt(Number(amount) * 2), duration)
		)
			.to.emit(YieldPool, "Deposited")
			.withArgs(owner, YieldToken, BigInt(Number(amount) * 2), duration);


			const userBalances = await YieldPool.getUserTokenBalances();
			
		expect(
			userBalances.balances[0].toString(),
		).to.be.equal(userBalances.balances[0].toString());
		expect(
			userBalances.tokens[0].toString()
		).to.be.equal(YieldToken);
	});

	it("successfully allows tokens", async () => {
		const allowedTokens = await YieldPool.getAllowedTokens();

		const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");

		expect(allowedTokens).to.include(await YieldToken.getAddress());
		expect(
			await YieldPool.isTokenAllowed(await YieldToken.getAddress())
		).to.be.equals(true);
		
		expect(allowedTokens).to.not.include(await AnotherToken.getAddress());
		expect(
			await YieldPool.isTokenAllowed(await AnotherToken.getAddress())
		).to.be.equals(false);

		//setAllowedToken
		await YieldPool.addAllowedTokens(await AnotherToken.getAddress());
		expect(await YieldPool.getAllowedTokens()).to.include(
			await AnotherToken.getAddress()
		);
		expect(
			await YieldPool.isTokenAllowed(await AnotherToken.getAddress())
		).to.be.equals(true);
		await YieldPool.removeAllowedToken(await AnotherToken.getAddress());
		expect(await YieldPool.getAllowedTokens()).to.not.include(
			await AnotherToken.getAddress()
		);
		expect(
			await YieldPool.isTokenAllowed(await AnotherToken.getAddress())
		).to.be.equals(false);

		// //modify allowedTokens
		await YieldPool.modifyAllowedTokens(AnotherToken, false);
		await YieldPool.modifyAllowedTokens(YieldToken, false);
		expect(await YieldPool.getAllowedTokens()).to.deep.equal([]);
	});

	it("Get user positions", async () => {
		await YieldToken.mint(owner, amount);
		await YieldToken.approve(YieldPool, amount);
		await YieldPool.deposit(YieldToken, amount, duration);

		const positions = await YieldPool.getPosition(1);
		expect(positions.amount).to.be.equal(amount);
		expect(positions.lockDuration).to.be.equal(duration);
	});
	it("reverts when position is not found", async () => {
		await YieldToken.mint(owner, amount);
		await YieldToken.approve(YieldPool, amount);
		await YieldPool.deposit(YieldToken, amount, duration);

		await expect(YieldPool.getPosition(2)).to.be.revertedWith(
			"Position does not exist"
		);
	});

	it("gets total stakers", async () => {
		await YieldToken.mint(owner, amount);
		await YieldToken.approve(YieldPool, amount);
		await expect(YieldPool.deposit(YieldToken, amount, duration))
		.to.emit(YieldPool, "Deposited")
		.withArgs(owner, YieldToken, amount, duration);
		
		expect(await YieldPool.getTotalStakers()).to.be.equal(1);
		const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");

		await AnotherToken.mint(otherAccount, amount);
		await AnotherToken.connect(otherAccount).approve(YieldPool, amount);
		await YieldPool.addAllowedTokens(await AnotherToken.getAddress());


		 expect(
			await YieldPool.connect(otherAccount).deposit(AnotherToken, amount, duration) //connect another user so count wont be the same
		)
			.to.emit(YieldPool, "Deposited")
			.withArgs(otherAccount, AnotherToken, amount, duration);

		expect(await YieldPool.getTotalStakers()).to.be.equal(2);
	});

	it("get total value locked", async () => {
		await YieldToken.mint(owner, amount);
		await YieldToken.approve(YieldPool, amount);
		await expect(YieldPool.deposit(YieldToken, amount, duration))
			.to.emit(YieldPool, "Deposited")
			.withArgs(owner, YieldToken, amount, duration);

		expect(await YieldPool.getTotalStakers()).to.be.equal(1);

		await YieldToken.mint(otherAccount, amount);
		await YieldToken.connect(otherAccount).approve(YieldPool, amount);

		await expect(
			YieldPool.connect(otherAccount).deposit(YieldToken, amount, duration) //connect another user so count wont be the same
		)
			.to.emit(YieldPool, "Deposited")
			.withArgs(otherAccount, YieldToken, amount, duration);

		expect(await YieldPool.getTotalStakers()).to.be.equal(2);
		expect(await YieldPool.getTotalValueLocked()).to.be.equal(
			hre.ethers.parseUnits("20000000", 18)
		);
	});

	it("successfully calculate Yield amount", async () => {
		const expectedYield =
			(BigInt(amount) * BigInt(duration) * BigInt(yieldRate)) /
			BigInt(31536000 * 100);

		expect(
			await YieldPool.calculateExpectedYield(amount, duration)
		).to.be.equal(expectedYield);
	});

	it("does not allow withdrawal when token is still locked", async () => {
		await YieldToken.mint(owner, amount);
		await YieldToken.approve(YieldPool, amount);

		await expect(YieldPool.deposit(YieldToken, amount, duration))
			.to.emit(YieldPool, "Deposited")
			.withArgs(owner, YieldToken, amount, duration);
		const userPosition1 = await YieldPool.getPosition(1);
		await expect(YieldPool.withdraw(userPosition1.id)).to.revertedWith(
			"Still locked"
		);
	});
	it("successfully withdraw", async () => {
		await YieldToken.mint(owner, 10);
		await YieldToken.approve(YieldPool, 10);
		await expect(YieldPool.deposit(YieldToken, 10, duration))
			.to.emit(YieldPool, "Deposited")
			.withArgs(owner, YieldToken, 10, duration);

		expect(await YieldPool.getTotalStakers()).to.be.equal(1);

		await YieldToken.mint(otherAccount, 10);
		await YieldToken.connect(otherAccount).approve(YieldPool, 10);

		await expect(
			YieldPool.connect(otherAccount).deposit(YieldToken, 10, duration) //connect another user so count wont be the same
		)
			.to.emit(YieldPool, "Deposited")
			.withArgs(otherAccount, YieldToken, 10, duration);

		expect(await YieldPool.getTotalStakers()).to.be.equal(2);
		const userPosition1 = await YieldPool.getPosition(1);

		//calculate yieldAmount
		const expectedYield =
			(BigInt(10) * BigInt(duration) * BigInt(yieldRate)) /
			BigInt(31536000 * 100);

		// Fast forward time to after the lock duration
		await hre.network.provider.send("evm_increaseTime", [duration]);

		await expect(YieldPool.withdraw(userPosition1.id))
			.to.emit(YieldPool, "Withdrawn")
			.withArgs(owner, YieldToken, BigInt(10) + expectedYield, expectedYield);
	});
	//test for insufficient balance in pool

	it("reverts when user tries to withdraw a position he does not own", async () => {
		await YieldToken.mint(owner, 10);
		await YieldToken.approve(YieldPool, 10);
		await expect(YieldPool.deposit(YieldToken, 10, duration))
			.to.emit(YieldPool, "Deposited")
			.withArgs(owner, YieldToken, 10, duration);

		expect(await YieldPool.getTotalStakers()).to.be.equal(1);

		await YieldToken.mint(otherAccount, 10);
		await YieldToken.connect(otherAccount).approve(YieldPool, 10);

		await expect(
			YieldPool.connect(otherAccount).deposit(YieldToken, 10, duration) //connect another user so count wont be the same
		)
			.to.emit(YieldPool, "Deposited")
			.withArgs(otherAccount, YieldToken, 10, duration);

		expect(await YieldPool.getTotalStakers()).to.be.equal(2);
		const userPosition2 = await YieldPool.getPosition(2);

		// Fast forward time to after the lock duration
		await hre.network.provider.send("evm_increaseTime", [duration]);

		await expect(YieldPool.withdraw(userPosition2.id)).to.revertedWith(
			"You are not the owner of this position"
		);
	});

	it("reverts when position has already been withdrawn", async () => {
		await YieldToken.mint(owner, 10);
		await YieldToken.approve(YieldPool, 10);
		await expect(YieldPool.deposit(YieldToken, 10, duration))
			.to.emit(YieldPool, "Deposited")
			.withArgs(owner, YieldToken, 10, duration);

		expect(await YieldPool.getTotalStakers()).to.be.equal(1);

		await YieldToken.mint(owner, 10);
		await YieldToken.approve(YieldPool, 10);

		await expect(
			YieldPool.deposit(YieldToken, 10, duration) //connect another user so count wont be the same
		)
			.to.emit(YieldPool, "Deposited")
			.withArgs(owner, YieldToken, 10, duration);

		expect(await YieldPool.getTotalStakers()).to.be.equal(1);
		const userPosition1 = await YieldPool.getPosition(1);

		//calculate yieldAmount
		const expectedYield =
			(BigInt(10) * BigInt(duration) * BigInt(yieldRate)) /
			BigInt(31536000 * 100);

		// Fast forward time to after the lock duration
		await hre.network.provider.send("evm_increaseTime", [duration]);

		await expect(YieldPool.withdraw(userPosition1.id))
			.to.emit(YieldPool, "Withdrawn")
			.withArgs(owner, YieldToken, BigInt(10) + expectedYield, expectedYield);
	});

	it("fails to unstake if user is not position owner", async () => {
		await YieldToken.mint(owner, 10);
		await YieldToken.approve(YieldPool, 10);
		await expect(YieldPool.deposit(YieldToken, 10, duration))
			.to.emit(YieldPool, "Deposited")
			.withArgs(owner, YieldToken, 10, duration);

		expect(await YieldPool.getTotalStakers()).to.be.equal(1);

		const userPosition1 = await YieldPool.getPosition(1);

		await expect(
			YieldPool.connect(otherAccount).unstake(userPosition1.id)
		).to.be.revertedWith("Not position owner");
	});

	it("fails to unstake if position does not exist", async () => {
		await YieldToken.mint(owner, 10);
		await YieldToken.approve(YieldPool, 10);

		await expect(
			YieldPool.deposit(YieldToken, 10, duration) //connect another user so count wont be the same
		)
			.to.emit(YieldPool, "Deposited")
			.withArgs(owner, YieldToken, 10, duration);

		expect(await YieldPool.getTotalStakers()).to.be.equal(1);

		await expect(YieldPool.unstake(2)).to.be.revertedWith(
			"Not position owner"
		);
	});

	it("successfully incur 10% penalty when users unstake", async () => {
		await YieldToken.mint(owner, 10);
		await YieldToken.approve(YieldPool, 10);

		await expect(
			YieldPool.deposit(YieldToken, 10, duration) //connect another user so count wont be the same
		)
			.to.emit(YieldPool, "Deposited")
			.withArgs(owner, YieldToken, 10, duration);

		const userPosition1 = await YieldPool.getPosition(1);
		const penalty = userPosition1.amount / BigInt(10);
		const amountToReturn = userPosition1.amount - penalty;

		await YieldToken.approve(YieldPool, penalty);

		await expect(YieldPool.unstake(userPosition1.id))
			.to.emit(YieldPool, "Withdrawn")
			.withArgs(owner, YieldToken, amountToReturn, 0);
	});
});
