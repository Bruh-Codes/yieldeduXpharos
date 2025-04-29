import { expect } from "chai";
import hre, { ethers } from 'hardhat'
import { BorrowProtocol, BorrowProtocol__factory, YieldPool, YieldPool__factory, YieldToken, YieldToken__factory } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";



describe('BorrowProtocol',async function(){
    let BorrowProtocol:BorrowProtocol;
    let BorrowProtocolFactory:BorrowProtocol__factory;
    let YieldPool:YieldPool;
    let owner:SignerWithAddress;
    let otherAccount:SignerWithAddress;
    let YieldPoolFactory:YieldPool__factory;
	let YieldToken: YieldToken;
    let YieldTokenFactory:YieldToken__factory;
    const tokenName = "YieldEDU";
	const tokenSymbol = "YDU";
    const yieldRate = 10;
	const minDuration = 86400;
	const maxDuration = 31536000;


    beforeEach(async() => {
        BorrowProtocolFactory = await hre.ethers.getContractFactory("BorrowProtocol");
		YieldTokenFactory = await hre.ethers.getContractFactory("YieldToken");
        YieldPoolFactory = await hre.ethers.getContractFactory("YieldPool");

		[owner, otherAccount] = await hre.ethers.getSigners();
        YieldToken= await YieldTokenFactory.deploy(owner,tokenName,tokenSymbol);
        YieldPool = await YieldPoolFactory.deploy(YieldToken.getAddress(),yieldRate,minDuration,maxDuration)
        BorrowProtocol = await BorrowProtocolFactory.deploy(await YieldPool.getAddress(),await YieldToken.getAddress(),owner)

    })

    it('updates the setMinHealthFactor',async()=> {
        await BorrowProtocol.setMinHealthFactor(2);
        const minHealthFactor = await BorrowProtocol.getMinHealthFactor();
        expect(minHealthFactor).to.be.equal(2)


    })

    it("reverts when liquidationThreshold is greater than 100%",async()=> {
        await expect( BorrowProtocol.setLiquidationThreshold(YieldToken,150)).to.be.revertedWith('Threshold must be <= 100%');
        expect(await BorrowProtocol.getLiquidationThreshold(YieldToken)).to.be.equal(80)
    })
    it("updates liquidationThreshold",async()=> {
        await BorrowProtocol.setLiquidationThreshold(YieldToken,90);
        expect(await BorrowProtocol.getLiquidationThreshold(YieldToken)).to.be.equal(90)
    })

    it("updates minCollateralAmount", async()=> {
        expect(await BorrowProtocol.getMinCollateralAmount(YieldToken)).to.be.equal(ethers.parseEther('1'));
        await BorrowProtocol.setMinCollateralAmount(YieldToken,ethers.parseEther('2'));
        expect(await BorrowProtocol.getMinCollateralAmount(YieldToken)).to.be.equal(ethers.parseEther('2'));
    })

    it('Updates the minimum duration for all token being staked',async()=> {
        const oneDays = 86400;
        const twoDays = oneDays * 2; 
        expect(await BorrowProtocol.getMinimumDuration()).to.be.equal((oneDays));
        await BorrowProtocol.setMinimumDuration(twoDays);
        expect(await BorrowProtocol.getMinimumDuration()).to.be.equal((twoDays));
    })

    it('calculates the healthFactor',async()=> {
        const collateralAmount1 = ethers.parseEther('1');
        const collateralAmount2 = ethers.parseEther('2');
        const borrowAmount = ethers.parseEther('5');
        expect(await BorrowProtocol.calculateHealthFactorSimulated(collateralAmount1,borrowAmount,YieldToken)).to.be.equal(16)
        expect(await BorrowProtocol.calculateHealthFactorSimulated(collateralAmount2,borrowAmount,YieldToken)).to.be.equal(32)
    })


    it("reverts when borrows token or collateral token is not allowed",async()=> {
        const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");
        const borrowAmount = ethers.parseEther('5');
        const collateralAmount1 = ethers.parseEther('6');
        const duration = 86400;
        const interestRate = 20;
        const collateralToken = YieldToken;
        await expect( BorrowProtocol.Borrow(AnotherToken,collateralAmount1,collateralToken,borrowAmount,duration,interestRate)).to.be
        .revertedWith('collateralToken not allowed');
        await YieldPool.removeAllowedToken(collateralToken)
        await expect( BorrowProtocol.Borrow(collateralToken,collateralAmount1,AnotherToken,borrowAmount,duration,interestRate)).to.be
        .revertedWith('collateralToken not allowed');
    })
    it("reverts when interest rate is invalid",async()=> {
        const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");
        const borrowAmount = ethers.parseEther('5');
        const collateralAmount1 = ethers.parseEther('6');
        const duration = 86400;
        const interestRate = 0;
        const collateralToken = YieldToken;
        await YieldPool.addAllowedTokens(AnotherToken)
        await expect( BorrowProtocol.Borrow(collateralToken,collateralAmount1,AnotherToken,borrowAmount,duration,interestRate)).to.be
        .revertedWith('invalid interest rate');
        
    })
    it("reverts when minimum collateral is too low",async()=> {
        const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");
        const borrowAmount = ethers.parseEther('5');
        const collateralAmount1 = ethers.parseEther('0.5');
        const duration = 86400;
        const interestRate = 10;
        const collateralToken = YieldToken;
        await YieldPool.addAllowedTokens(AnotherToken)
        await expect( BorrowProtocol.Borrow(collateralToken,collateralAmount1,AnotherToken,borrowAmount,duration,interestRate)).to.be
        .revertedWith('collateral too low');
        
    })
    it("reverts when borrow amount is zero",async()=> {
        const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");
        const borrowAmount = ethers.parseEther('0');
        const collateralAmount1 = ethers.parseEther('1');
        const duration = 86400;
        const interestRate = 10;
        const collateralToken = YieldToken;
        await YieldPool.addAllowedTokens(AnotherToken)
        await expect( BorrowProtocol.Borrow(collateralToken,collateralAmount1,AnotherToken,borrowAmount,duration,interestRate)).to.be
        .revertedWith('borrow amount is 0');
        
    })
    it("reverts when duration is too short",async()=> {
        const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount1 = ethers.parseEther('1');
        const duration = 864;
        const interestRate = 10;
        const collateralToken = YieldToken;
        await YieldPool.addAllowedTokens(AnotherToken)
        await expect( BorrowProtocol.Borrow(collateralToken,collateralAmount1,AnotherToken,borrowAmount,duration,interestRate)).to.be
        .revertedWith('duration too short');
        
    })
    it("reverts when healthFactor is too short",async()=> {
        const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");
        const borrowAmount = ethers.parseEther('40');
        const collateralAmount1 = ethers.parseEther('1');
        const duration = 86400;
        const interestRate = 10;
        const collateralToken = YieldToken;
        await YieldPool.addAllowedTokens(AnotherToken)
        await AnotherToken.mint(owner,ethers.parseEther('100'))
        await AnotherToken.approve(BorrowProtocol,borrowAmount)
        await BorrowProtocol.fundPool(AnotherToken,borrowAmount)
        await expect( BorrowProtocol.Borrow(collateralToken,collateralAmount1,AnotherToken,borrowAmount,duration,interestRate)).to.be
        .revertedWith('Health factor too low');
        
    })
    it("reverts when there is no liquidity in pool",async()=> {
        const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");
        const borrowAmount = ethers.parseEther('40');
        const collateralAmount1 = ethers.parseEther('1');
        const duration = 86400;
        const interestRate = 10;
        const collateralToken = YieldToken;
        await YieldPool.addAllowedTokens(AnotherToken)
        await AnotherToken.mint(owner,ethers.parseEther('100'))
        await AnotherToken.approve(BorrowProtocol,borrowAmount)
        await expect( BorrowProtocol.Borrow(collateralToken,collateralAmount1,AnotherToken,borrowAmount,duration,interestRate)).to.be
        .revertedWith('Not enough liquidity');
        
    })
    it("Borrows a token successfully",async()=> {
        const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount1 = ethers.parseEther('10');
        const duration = 86400;
        const interestRate = 10;
        const collateralToken = YieldToken;
        const loanId = 1;
        await YieldPool.addAllowedTokens(AnotherToken);
        await collateralToken.mint(owner, collateralAmount1);
        await AnotherToken.mint(BorrowProtocol, borrowAmount);

		await collateralToken.approve(BorrowProtocol, collateralAmount1);

         expect( await BorrowProtocol.Borrow(collateralToken,collateralAmount1,AnotherToken,borrowAmount,duration,interestRate)).to.emit(BorrowProtocol,'LoanCreated').withArgs(owner,loanId,borrowAmount,AnotherToken,duration).to.emit(BorrowProtocol,'CollateralDeposited').withArgs(owner,AnotherToken,collateralAmount1)
        
    })
    it("Borrows a token successfully and updates user loan",async()=> {
        const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount1 = ethers.parseEther('10');
        const duration = 86400;
        const interestRate = 10;
        const collateralToken = YieldToken;
        const loanId = 1;
        await YieldPool.addAllowedTokens(AnotherToken);
        await collateralToken.mint(owner, collateralAmount1);
        await AnotherToken.mint(BorrowProtocol, borrowAmount);

		await collateralToken.approve(BorrowProtocol, collateralAmount1);

         expect( await BorrowProtocol.Borrow(collateralToken,collateralAmount1,AnotherToken,borrowAmount,duration,interestRate)).to.emit(BorrowProtocol,'LoanCreated').withArgs(owner,loanId,borrowAmount,AnotherToken,duration).to.emit(BorrowProtocol,'CollateralDeposited').withArgs(owner,AnotherToken,collateralAmount1)

         const userLoan = await BorrowProtocol.getUserLoans(owner);

         expect(userLoan.length).to.be.equal(1);
         expect(userLoan[0].loanId).to.be.equal(0)
         expect(userLoan[0].collateralAmount).to.be.equal(collateralAmount1);
         expect(userLoan[0].collateralToken).to.be.equal(collateralToken);
         expect(userLoan[0].borrowToken).to.be.equal(AnotherToken);
         expect(userLoan[0].borrowAmount).to.be.equal(borrowAmount);
         expect(userLoan[0].duration).to.be.equal(duration);
         expect(userLoan[0].interestRate).to.be.equal(interestRate);
         expect(userLoan[0].userAddress).to.be.equal(owner);
         expect(userLoan[0].active).to.be.equal(true);

        
    })
    it("Borrows a token successfully and increment user borrow count",async()=> {
        const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount1 = ethers.parseEther('10');
        const duration = 86400;
        const interestRate = 10;
        const collateralToken = YieldToken;
        const loanId = 1;
        await YieldPool.addAllowedTokens(AnotherToken);
        await collateralToken.mint(owner, collateralAmount1);
        await AnotherToken.mint(BorrowProtocol, borrowAmount);

		await collateralToken.approve(BorrowProtocol, collateralAmount1);

         expect( await BorrowProtocol.Borrow(collateralToken,collateralAmount1,AnotherToken,borrowAmount,duration,interestRate)).to.emit(BorrowProtocol,'LoanCreated').withArgs(owner,loanId,borrowAmount,AnotherToken,duration).to.emit(BorrowProtocol,'CollateralDeposited').withArgs(owner,AnotherToken,collateralAmount1)
        
    })
    it("Borrows a token successfully and updates user loan",async()=> {
        const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount1 = ethers.parseEther('10');
        const duration = 86400;
        const interestRate = 10;
        const collateralToken = YieldToken;
        const loanId = 1;
        await YieldPool.addAllowedTokens(AnotherToken);
        await collateralToken.mint(owner, collateralAmount1);
        await AnotherToken.mint(BorrowProtocol, borrowAmount);

		await collateralToken.approve(BorrowProtocol, collateralAmount1);

         expect( await BorrowProtocol.Borrow(collateralToken,collateralAmount1,AnotherToken,borrowAmount,duration,interestRate)).to.emit(BorrowProtocol,'LoanCreated').withArgs(owner,loanId,borrowAmount,AnotherToken,duration).to.emit(BorrowProtocol,'CollateralDeposited').withArgs(owner,AnotherToken,collateralAmount1)

         let userLoan = await BorrowProtocol.getUserLoans(owner);

         expect(userLoan.length).to.be.equal(1);
         expect(userLoan[0].loanId).to.be.equal(0)
         expect(userLoan[0].collateralAmount).to.be.equal(collateralAmount1);
         expect(userLoan[0].collateralToken).to.be.equal(collateralToken);
         expect(userLoan[0].borrowToken).to.be.equal(AnotherToken);
         expect(userLoan[0].borrowAmount).to.be.equal(borrowAmount);
         expect(userLoan[0].duration).to.be.equal(duration);
         expect(userLoan[0].interestRate).to.be.equal(interestRate);
         expect(userLoan[0].userAddress).to.be.equal(owner);
         expect(userLoan[0].active).to.be.equal(true);

         await collateralToken.mint(owner, collateralAmount1);
        await AnotherToken.mint(BorrowProtocol, borrowAmount);

		await collateralToken.approve(BorrowProtocol, collateralAmount1);

         expect( await BorrowProtocol.Borrow(collateralToken,collateralAmount1,AnotherToken,borrowAmount,duration,interestRate)).to.emit(BorrowProtocol,'LoanCreated').withArgs(owner,loanId,borrowAmount,AnotherToken,duration).to.emit(BorrowProtocol,'CollateralDeposited').withArgs(owner,AnotherToken,collateralAmount1);

         userLoan = await BorrowProtocol.getUserLoans(owner);
         expect(userLoan.length).to.be.equal(2);
         expect(userLoan[1].loanId).to.be.equal(1)
         expect(userLoan[1].collateralAmount).to.be.equal(collateralAmount1);
         expect(userLoan[1].collateralToken).to.be.equal(collateralToken);
         expect(userLoan[1].borrowToken).to.be.equal(AnotherToken);
         expect(userLoan[1].borrowAmount).to.be.equal(borrowAmount);
         expect(userLoan[1].duration).to.be.equal(duration);
         expect(userLoan[1].interestRate).to.be.equal(interestRate);
         expect(userLoan[1].userAddress).to.be.equal(owner);
         expect(userLoan[1].active).to.be.equal(true);
        
    })
    it('gets all active loans', async()=> {
        const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount1 = ethers.parseEther('10');
        const duration = 86400;
        const interestRate = 10;
        const collateralToken = YieldToken;
        const loanId = 1;
        await YieldPool.addAllowedTokens(AnotherToken);
        await collateralToken.mint(owner, collateralAmount1);
        await AnotherToken.mint(BorrowProtocol, borrowAmount);

		await collateralToken.approve(BorrowProtocol, collateralAmount1);

         expect( await BorrowProtocol.Borrow(collateralToken,collateralAmount1,AnotherToken,borrowAmount,duration,interestRate)).to.emit(BorrowProtocol,'LoanCreated').withArgs(owner,loanId,borrowAmount,AnotherToken,duration).to.emit(BorrowProtocol,'CollateralDeposited').withArgs(owner,AnotherToken,collateralAmount1)

         await collateralToken.mint(owner, collateralAmount1);
         await collateralToken.transfer(otherAccount, collateralAmount1); 
        await AnotherToken.mint(BorrowProtocol, borrowAmount);

		await collateralToken.connect(otherAccount).approve(BorrowProtocol, collateralAmount1);

         expect( await BorrowProtocol.connect(otherAccount).Borrow(collateralToken,collateralAmount1,AnotherToken,borrowAmount,duration,interestRate)).to.emit(BorrowProtocol,'LoanCreated').withArgs(otherAccount,loanId,borrowAmount,AnotherToken,duration).to.emit(BorrowProtocol,'CollateralDeposited').withArgs(otherAccount,AnotherToken,collateralAmount1);
         expect((await BorrowProtocol.getAllActiveLoans()).length).to.be.equal(2)
    })

    it("gets all user loans",async()=> {
        const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount1 = ethers.parseEther('10');
        const duration = 86400;
        const interestRate = 10;
        const collateralToken = YieldToken;
        const loanId = 1;
        await YieldPool.addAllowedTokens(AnotherToken);
        await collateralToken.mint(owner, collateralAmount1);
        await AnotherToken.mint(BorrowProtocol, borrowAmount);

		await collateralToken.approve(BorrowProtocol, collateralAmount1);

         expect( await BorrowProtocol.Borrow(collateralToken,collateralAmount1,AnotherToken,borrowAmount,duration,interestRate)).to.emit(BorrowProtocol,'LoanCreated').withArgs(owner,loanId,borrowAmount,AnotherToken,duration).to.emit(BorrowProtocol,'CollateralDeposited').withArgs(owner,AnotherToken,collateralAmount1)

         await collateralToken.mint(owner, collateralAmount1);
         await collateralToken.transfer(otherAccount, collateralAmount1); 
        await AnotherToken.mint(BorrowProtocol, borrowAmount);

		await collateralToken.connect(otherAccount).approve(BorrowProtocol, collateralAmount1);

         expect( await BorrowProtocol.connect(otherAccount).Borrow(collateralToken,collateralAmount1,AnotherToken,borrowAmount,duration,interestRate)).to.emit(BorrowProtocol,'LoanCreated').withArgs(otherAccount,loanId,borrowAmount,AnotherToken,duration).to.emit(BorrowProtocol,'CollateralDeposited').withArgs(otherAccount,AnotherToken,collateralAmount1);
         expect((await BorrowProtocol.getUserLoans(owner)).length).to.be.equal(1)
         expect((await BorrowProtocol.getUserLoans(otherAccount)).length).to.be.equal(1)

    })
    it('calcualte the total due amount', async()=> {
        const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount1 = ethers.parseEther('10');
        const duration = 86400;
        const interestRate = 10;
        const collateralToken = YieldToken;
        const loanId = 1;
        await YieldPool.addAllowedTokens(AnotherToken);
        await collateralToken.mint(owner, collateralAmount1);
        await AnotherToken.mint(BorrowProtocol, borrowAmount);

		await collateralToken.approve(BorrowProtocol, collateralAmount1);

         expect( await BorrowProtocol.Borrow(collateralToken,collateralAmount1,AnotherToken,borrowAmount,duration,interestRate)).to.emit(BorrowProtocol,'LoanCreated').withArgs(owner,loanId,borrowAmount,AnotherToken,duration).to.emit(BorrowProtocol,'CollateralDeposited').withArgs(owner,AnotherToken,collateralAmount1)

         await collateralToken.mint(owner, collateralAmount1);
         await collateralToken.transfer(otherAccount, collateralAmount1); 
        await AnotherToken.mint(BorrowProtocol, borrowAmount);

		await collateralToken.connect(otherAccount).approve(BorrowProtocol, collateralAmount1);

         expect( await BorrowProtocol.connect(otherAccount).Borrow(collateralToken,collateralAmount1,AnotherToken,borrowAmount,duration,interestRate)).to.emit(BorrowProtocol,'LoanCreated').withArgs(otherAccount,loanId,borrowAmount,AnotherToken,duration).to.emit(BorrowProtocol,'CollateralDeposited').withArgs(otherAccount,AnotherToken,collateralAmount1);
         expect((await BorrowProtocol.getUserLoans(owner)).length).to.be.equal(1)

         const totalDue = await BorrowProtocol.calculateTotalDue(owner,loanId)

         expect(await BorrowProtocol.calculateTotalDue(owner,loanId)).to.be.equal(totalDue)

    })

    it('reverts paying a loan that does not exist',async()=> {
        const loanId = 5;
        await expect(BorrowProtocol.payLoan(loanId)).to.be.revertedWith('Loan not found')

    })
    it('successfull pays a loan',async()=> {
        const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
		const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount1 = ethers.parseEther('10');
        const duration = 86400;
        const interestRate = 10;
        const collateralToken = YieldToken;
        const loanId = 1;
        await YieldPool.addAllowedTokens(AnotherToken);
        await collateralToken.mint(owner, collateralAmount1);
        await AnotherToken.mint(owner, ethers.parseEther('10'));


        await collateralToken.transfer(owner, collateralAmount1); 
       await AnotherToken.mint(BorrowProtocol, borrowAmount);

       await collateralToken.approve(BorrowProtocol, collateralAmount1);

        expect( await BorrowProtocol.connect(owner).Borrow(collateralToken,collateralAmount1,AnotherToken,borrowAmount,duration,interestRate)).to.emit(BorrowProtocol,'LoanCreated').withArgs(owner,loanId,borrowAmount,AnotherToken,duration).to.emit(BorrowProtocol,'CollateralDeposited').withArgs(owner,AnotherToken,collateralAmount1);

         await collateralToken.mint(owner, collateralAmount1);
         await AnotherToken.mint(owner, ethers.parseEther('10'));
         await AnotherToken.transfer(otherAccount, ethers.parseEther('10'));
         await AnotherToken.mint(BorrowProtocol, borrowAmount);
         await collateralToken.transfer(otherAccount, collateralAmount1); 

          expect(await collateralToken.balanceOf(otherAccount)).to.be.equal(collateralAmount1)
          expect(await AnotherToken.balanceOf(otherAccount)).to.be.equal(ethers.parseEther('10'))

		await collateralToken.connect(otherAccount).approve(BorrowProtocol, collateralAmount1);

        await expect( BorrowProtocol.connect(otherAccount).Borrow(collateralToken,collateralAmount1,AnotherToken,borrowAmount,duration,interestRate)).to.emit(BorrowProtocol,'CollateralDeposited').withArgs(otherAccount,collateralToken,collateralAmount1)
        .to.emit(BorrowProtocol,'LoanCreated').withArgs(otherAccount,loanId,borrowAmount,AnotherToken,duration)



         expect((await BorrowProtocol.getUserLoans(owner)).length).to.be.equal(1)
         expect((await BorrowProtocol.getUserLoans(otherAccount)).length).to.be.equal(1)
         expect((await BorrowProtocol.getAllActiveLoans()).length).to.be.equal(2)
         
         const userLoans = await BorrowProtocol.getUserLoans(owner);
         const userLoanId = userLoans[0].loanId
         const totalDue = await BorrowProtocol.calculateTotalDue(owner,userLoanId)

         expect(await BorrowProtocol.calculateTotalDue(owner,userLoanId)).to.be.equal(totalDue);
         await AnotherToken.approve(BorrowProtocol,totalDue);

         const allowance = await AnotherToken.allowance(owner, BorrowProtocol.getAddress());
        expect(allowance).to.be.gte(totalDue);
        const balance = await AnotherToken.balanceOf(owner);
        expect(balance).to.be.gte(totalDue);


        expect((await BorrowProtocol.getUserLoans(owner)).length).to.be.equal(1)

        await expect(BorrowProtocol.payLoan(userLoanId))
        .to.emit(BorrowProtocol,'LoanRepaid').withArgs(owner,userLoanId,totalDue).to.emit(BorrowProtocol, 'ActiveLoanUpdated')
        .withArgs(userLoanId, false);

        expect((await BorrowProtocol.getUserLoans(otherAccount)).length).to.be.equal(1)
        const activeLoans  = await BorrowProtocol.getAllActiveLoans();
        expect( activeLoans[0].userAddress).to.be.equal(owner);
        expect( activeLoans[0].active).to.be.equal(false);

    })

    it("should successfully fund pool with a corresponding token",async()=> {
        await YieldToken.mint(owner,ethers.parseEther('1000'))
        await YieldToken.approve(BorrowProtocol,ethers.parseEther("1000"))
        await expect(BorrowProtocol.fundPool(YieldToken,ethers.parseEther('1000'))).to.emit(BorrowProtocol,"PoolFunded").withArgs(owner,YieldToken,ethers.parseEther('1000'))

    })

    it("reverts when the collateral amount is less than the required minimum", async () => {
        const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
        const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");
        const borrowAmount = ethers.parseEther('1');
        const insufficientCollateral = ethers.parseEther('0.1'); 
        const duration = 86400;
        const interestRate = 10;
        const collateralToken = YieldToken;
    
        await YieldPool.addAllowedTokens(AnotherToken);
        await collateralToken.mint(owner, insufficientCollateral);
    
        await collateralToken.approve(BorrowProtocol, insufficientCollateral);
    
        await expect(
            BorrowProtocol.Borrow(collateralToken, insufficientCollateral, AnotherToken, borrowAmount, duration, interestRate)
        ).to.be.revertedWith('collateral too low');
    });

    it("reverts when the borrow amount exceeds available liquidity", async () => {
        const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
        const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");
        const borrowAmount = ethers.parseEther('1000'); // Exceeds available liquidity
        const collateralAmount1 = ethers.parseEther('10');
        const duration = 86400;
        const interestRate = 10;
        const collateralToken = YieldToken;
    
        await YieldPool.addAllowedTokens(AnotherToken);
        await collateralToken.mint(owner, collateralAmount1);
        await collateralToken.approve(BorrowProtocol, collateralAmount1);
    
        await expect(
            BorrowProtocol.Borrow(collateralToken, collateralAmount1, AnotherToken, borrowAmount, duration, interestRate)
        ).to.be.revertedWith('Not enough liquidity');
    });
    

    it("allows a user to take multiple loans", async () => {
        const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
        const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount1 = ethers.parseEther('10');
        const duration = 86400;
        const interestRate = 10;
        const collateralToken = YieldToken;
    
        await YieldPool.addAllowedTokens(AnotherToken);
        await collateralToken.mint(owner, collateralAmount1);
        await AnotherToken.mint(BorrowProtocol, borrowAmount);
    
        await collateralToken.approve(BorrowProtocol, collateralAmount1);
    
        await BorrowProtocol.Borrow(collateralToken, collateralAmount1, AnotherToken, borrowAmount, duration, interestRate);
        const userLoans = await BorrowProtocol.getUserLoans(owner);
        expect(userLoans.length).to.be.equal(1);
    
        // Take another loan
        await collateralToken.mint(owner, collateralAmount1);
        await AnotherToken.mint(BorrowProtocol, borrowAmount);
        await collateralToken.approve(BorrowProtocol, collateralAmount1);
    
        await BorrowProtocol.Borrow(collateralToken, collateralAmount1, AnotherToken, borrowAmount, duration, interestRate);
        const updatedUserLoans = await BorrowProtocol.getUserLoans(owner);
        expect(updatedUserLoans.length).to.be.equal(2);
    });

    it("reverts when trying to interact with an expired loan", async () => {
        const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
        const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");
        const borrowAmount = ethers.parseEther('1');
        const collateralAmount1 = ethers.parseEther('10');
        const duration = 86400; // 1 day
        const interestRate = 10;
        const collateralToken = YieldToken;
    
        await YieldPool.addAllowedTokens(AnotherToken);
        await collateralToken.mint(owner, collateralAmount1);
        await AnotherToken.mint(BorrowProtocol, borrowAmount);
        await collateralToken.approve(BorrowProtocol, collateralAmount1);
    
        await BorrowProtocol.Borrow(collateralToken, collateralAmount1, AnotherToken, borrowAmount, duration, interestRate);
        const userLoans = await BorrowProtocol.getUserLoans(owner)
    
        // Wait for the loan to expire (1 day)
        await hre.ethers.provider.send('evm_increaseTime', [86400]);
        await hre.ethers.provider.send('evm_mine', []);
    
        // Try to interact with the loan after it has expired
        await expect(
            BorrowProtocol.payLoan(userLoans[0].loanId) // assuming repayLoan is the function to interact with the loan
        ).to.be.revertedWith('Loan expired');
    });

    
    it("reverts when trying to borrow with zero collateral", async () => {
        const AnotherTokenFactory = await hre.ethers.getContractFactory("YieldToken");
        const AnotherToken = await AnotherTokenFactory.deploy(owner, "AnotherToken", "ATK");
        const borrowAmount = ethers.parseEther('1');
        const zeroCollateral = ethers.parseEther('0'); // Zero collateral
        const duration = 86400;
        const interestRate = 10;
        const collateralToken = YieldToken;
    
        await YieldPool.addAllowedTokens(AnotherToken);
    
        await expect(
            BorrowProtocol.Borrow(collateralToken, zeroCollateral, AnotherToken, borrowAmount, duration, interestRate)
        ).to.be.revertedWith('collateral too low');
    });
        
    
    

})