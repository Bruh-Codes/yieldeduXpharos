// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


interface IYieldPool {
    function isTokenAllowed(address _address)external view returns(bool);
    
}

contract BorrowProtocol is ReentrancyGuard, Ownable{
    IYieldPool public yieldPool;





    struct Loan{
        uint256 collateralAmount;
        address collateralToken;
        address borrowToken;
        uint256 borrowAmount;
        uint256 duration;
        uint256 startTime;
        uint256 interestRate;
        address userAddress;
        bool active;
    }

    mapping(address => mapping(address => Loan)) public loans;
    mapping (address => uint256) userLoan;
    uint256 public minHealthFactor = 150;

    mapping(address => uint256) public liquidationThresholds;




event CollateralDeposited(address indexed user, address indexed token, uint256 amount);
    event LoanCreated(address indexed user, uint256 loanId, uint256 amount, address token);
    event LoanRepaid(address indexed user, uint256 loanId, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 loanId, uint256 amount);
    event LoanLiquidated(address indexed user, uint256 loanId, address liquidator);











    constructor(address _yieldPoolAddress, address _owner)Ownable(_owner) 
    
     {
        yieldPool = IYieldPool(_yieldPoolAddress);
    }

 function setMinHealthFactor(uint256 _minHealthFactor) external onlyOwner {
        minHealthFactor = _minHealthFactor;
    }

function setLiquidationThreshold(address token, uint256 threshold) external onlyOwner {
        require(threshold <= 100, "Threshold must be <= 100%");
        liquidationThresholds[token] = threshold;
    }

    function Borrow (address _collateralToken,uint256 _collateralAmount,address _borrowToken, uint256 _borrowAmount,uint256 duration) public view{

        require(yieldPool.isTokenAllowed(_collateralToken),"collateralToken is not allowed");
        require(yieldPool.isTokenAllowed(_borrowToken),"borrowToken is not allowed");
        
    }


}