// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./YieldToken.sol";

/**
 * @title YieldPool
 * @dev manages deposits and yield generation
 */

contract YieldPool is ReentrancyGuard {
    using SafeERC20 for IERC20;
    // State variables that can be configured in initializer
    uint256 private yieldRate;
    uint256 private constant YEAR = 365 days;
    uint256 private minDuration;
    uint256 private maxDuration;

    // State variables
    YieldToken private yieldTokenV2;
    uint256 private totalStakers;
    uint256 private totalValueLocked;
    uint256 private nextPositionId;

    address[] allowedTokens;
    address[] private activeStakers;

    mapping(address => bool) private allowedTokensMap;
    mapping(address => uint256) private activePositionsCount;
    mapping(address => uint256) private stakerIndex;
    mapping(address => mapping(address => uint256)) private userTokenBalance;

    struct Position {
        address positionAddress;
        address token;
        uint256 id;
        uint256 amount;
        uint256 startTime;
        uint256 lockDuration;
        bool withdrawn;
    }

    mapping(address => Position[]) private positions;
    mapping(uint256 => address) private positionOwners;
    address owner = msg.sender;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    // Events
    event Deposited(
        address indexed user,
        address token,
        uint256 amount,
        uint256 duration
    );
    event Withdrawn(
        address indexed user,
        address token,
        uint256 amount,
        uint256 yield
    );
    event TokenAllowedStatusChanged(address token, bool allowed);
    event YieldParametersUpdated(
        uint256 yieldRate,
        uint256 minDuration,
        uint256 maxDuration
    );

    constructor(
        address _yieldTokenAddress,
        uint256 _yieldRate,
        uint256 _minDuration,
        uint256 _maxDuration
    ) {
        // Initialize configurable parameters
        yieldRate = _yieldRate;
        minDuration = _minDuration;
        maxDuration = _maxDuration;

        // Initialize state variables
        yieldTokenV2 = YieldToken(_yieldTokenAddress);
        totalStakers = 0;
        totalValueLocked = 0;
        nextPositionId = 1;

        // Add YieldTokenV2 as first allowed token
        allowedTokens.push(_yieldTokenAddress);
        allowedTokensMap[_yieldTokenAddress] = true;
        emit TokenAllowedStatusChanged(_yieldTokenAddress, true);
    }

    /**
     * @notice updates the yield
     * @param _yieldRate The percentage yield e.g 10%
     * @param _minDuration The minimum duration lock time of tokens deposited.
     * @param _maxDuration The maximum duration lock time of tokens deposited.
     */

    function updateYieldParameters(
        uint256 _yieldRate,
        uint256 _minDuration,
        uint256 _maxDuration
    ) external onlyOwner {
        yieldRate = _yieldRate;
        minDuration = _minDuration;
        maxDuration = _maxDuration;
        emit YieldParametersUpdated(_yieldRate, _minDuration, _maxDuration);
    }

    /**
     * @return yieldTokenV2 the yield token users are going to earn.
     */

    function getYieldToken() external view returns (YieldToken) {
        return yieldTokenV2;
    }

    /**
     * @return yieldRate the percentage yield users are going to earn.
     */

    function getYieldRate() public view returns (uint256) {
        return yieldRate;
    }

    /**
     * @return minDuration the min duration users can stake
     */

    function getMinStakeDuration() public view returns (uint256) {
        return minDuration;
    }

    /**
     * @return getMaxStakeDuration the max duration users can stake
     */

    function getMaxStakeDuration() public view returns (uint256) {
        return maxDuration;
    }

    function getUserTokenBalances()
        public
        view
        returns (address[] memory tokens, uint256[] memory balances)
    {
        uint256 count = 0;

        // count the number of tokens the user has a balance of
        for (uint256 i = 0; i < allowedTokens.length; i++) {
            address token = allowedTokens[i];
            if (userTokenBalance[msg.sender][token] > 0) {
                count++;
            }
        }

        // arrays with the correct size
        tokens = new address[](count);
        balances = new uint256[](count);
        uint256 index = 0;

        // Populate  arrays with the tokens and balances
        for (uint256 i = 0; i < allowedTokens.length; i++) {
            address token = allowedTokens[i];
            if (userTokenBalance[msg.sender][token] > 0) {
                tokens[index] = token;
                balances[index] = userTokenBalance[msg.sender][token];
                index++;
            }
        }

        return (tokens, balances);
    }

    /**
     * @notice updates the yield
     * @param _token address of token to be checked if isAllowed
     * @return boolean if token is allowed (true) or not allowed (false)
     */

    function isTokenAllowed(address _token) public view returns (bool) {
        return allowedTokensMap[_token];
    }

    /**
     * @notice updates the yield
     * @param _newToken  the address of the token being modified.
     * @param _allowed The status of the token being modified true / false
     */
    function modifyAllowedTokens(
        address _newToken,
        bool _allowed
    ) public onlyOwner {
        allowedTokensMap[_newToken] = _allowed;
        emit TokenAllowedStatusChanged(_newToken, _allowed);
    }

    function removeAllowedToken(address _tokenAddress) public onlyOwner {
        uint256 indexToRemove;
        bool found = false;
        for (uint256 index = 0; index < allowedTokens.length; index++) {
            if (allowedTokens[index] == _tokenAddress) {
                indexToRemove = index;
                found = true;
                break;
            }
        }
        require(found, "Token not found in allowed tokens");

        // Check if there are any active positions using this token
        Position[] memory allPositions = getActivePositions();
        for (uint256 i = 0; i < allPositions.length; i++) {
            require(
                allPositions[i].token != _tokenAddress,
                "Token has an active position. Cannot be removed now"
            );
        }

        // Remove the token from the array by swapping it with the last element and popping
        uint256 lastIndex = allowedTokens.length - 1;
        if (indexToRemove != lastIndex) {
            allowedTokens[indexToRemove] = allowedTokens[lastIndex];
        }
        allowedTokens.pop();
        allowedTokensMap[_tokenAddress] = false;

        emit TokenAllowedStatusChanged(_tokenAddress, false);
    }

    /**
     * @notice updates the yield
     * @param _tokenAddress The token address to be added to allowed tokens list
     */

    function addAllowedTokens(address _tokenAddress) public onlyOwner {
        require(_tokenAddress != address(0), "Invalid token address");
        require(
            !isTokenAllowed(_tokenAddress),
            "Token already added and allowed"
        );

        allowedTokens.push(_tokenAddress);
        allowedTokensMap[_tokenAddress] = true;
        emit TokenAllowedStatusChanged(_tokenAddress, true);
    }

    /**
     * @notice get all allowed tokens in  a list
     * @return allowedTokens The token addresses in the allowedTokens list.
     */
    function getAllowedTokens() public view returns (address[] memory) {
        uint256 count = 0;

        // First count how many tokens are allowed
        for (uint256 i = 0; i < allowedTokens.length; i++) {
            if (allowedTokensMap[allowedTokens[i]]) {
                count++;
            }
        }

        // Create array with exact size needed
        address[] memory activeTokens = new address[](count);
        uint256 index = 0;

        // Fill array with allowed tokens
        for (uint256 i = 0; i < allowedTokens.length; i++) {
            if (allowedTokensMap[allowedTokens[i]]) {
                activeTokens[index] = allowedTokens[i];
                index++;
            }
        }

        return activeTokens;
    }

    /**
     * @notice get user position in an active yield pool
     * @param positionId uint256 id of a user position in a yieldPool stakes
     */
    function getPosition(
        uint256 positionId
    ) external view returns (Position memory) {
        address positionOwner = positionOwners[positionId];
        require(positionOwner != address(0), "Position does not exist");

        Position[] memory userPositions = positions[positionOwner];
        for (uint i = 0; i < userPositions.length; i++) {
            if (userPositions[i].id == positionId) {
                return userPositions[i];
            }
        }
        revert("Position not found");
    }

    function getTotalStakers() external view returns (uint256) {
        return totalStakers;
    }

    function getTotalValueLocked() external view returns (uint256) {
        return totalValueLocked;
    }

    /**
     * @notice gets all active positions participating in a yield pool
     * @return activePositions  a list of all active positions.
     */

    function getActivePositions()
        public
        view
        returns (Position[] memory activePositions)
    {
        uint256 totalPositions = 0;
        // count active non-withdrawn positions
        for (uint i = 0; i < activeStakers.length; i++) {
            Position[] memory userPositions = positions[activeStakers[i]];
            for (uint j = 0; j < userPositions.length; j++) {
                if (!userPositions[j].withdrawn) {
                    totalPositions++;
                }
            }
        }

        activePositions = new Position[](totalPositions);
        uint256 currentIndex = 0;

        //  collect all active positions
        for (uint i = 0; i < activeStakers.length; i++) {
            Position[] memory userPositions = positions[activeStakers[i]];
            for (uint j = 0; j < userPositions.length; j++) {
                if (!userPositions[j].withdrawn) {
                    activePositions[currentIndex] = userPositions[j];
                    currentIndex++;
                }
            }
        }

        return activePositions;
    }

    /**
     * @notice Deposits tokens into the yield pool.
     * @param _token The token to deposit
     * @param _amount The amount of tokens to deposit.
     * @param duration The lock duration for the deposit.
     */
    function deposit(
        address _token,
        uint256 _amount,
        uint256 duration
    ) external nonReentrant {
        require(_amount > 0, "Amount must be greater than 0");
        require(
            duration >= minDuration && duration <= maxDuration,
            "Invalid duration"
        );

        require(
            isTokenAllowed(_token),
            "We do not support the tokens you're staking"
        );

        // Save initial balance to verify transfer amount
        uint256 initialBalance = IERC20(_token).balanceOf(address(this));

        // Transfer tokens from user to this contract
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        // Verify correct amount was transferred
        uint256 newBalance = IERC20(_token).balanceOf(address(this));
        uint256 actualAmount = newBalance - initialBalance;
        require(actualAmount > 0, "No tokens were transferred");

        // Update state after successful transfer
        totalValueLocked += actualAmount;
        userTokenBalance[msg.sender][_token] += actualAmount;

        if (positions[msg.sender].length == 0) {
            stakerIndex[msg.sender] = activeStakers.length;
            activeStakers.push(msg.sender);
            totalStakers++;
        }

        // Create and add new position
        uint256 positionId = nextPositionId++;
        Position memory newPosition = Position({
            positionAddress: msg.sender,
            token: _token,
            id: positionId,
            amount: actualAmount,
            startTime: block.timestamp,
            lockDuration: duration,
            withdrawn: false
        });

        positions[msg.sender].push(newPosition);
        positionOwners[positionId] = msg.sender;
        activePositionsCount[msg.sender]++;

        emit Deposited(msg.sender, _token, actualAmount, duration);
    }

    /**
     * @notice withdraw tokens from the yield pool.
     * @param positionId uint256 id of an active user having funds in a yieldPool
     */

    function withdraw(uint256 positionId) external nonReentrant {
        // First check if position exists and get owner
        address positionOwner = positionOwners[positionId];
        require(positionOwner != address(0), "Position does not exist");
        require(
            positionOwner == msg.sender,
            "You are not the owner of this position"
        );

        Position[] storage userPositions = positions[msg.sender];
        uint256 positionIndex;
        bool found;

        for (uint i = 0; i < userPositions.length; i++) {
            if (userPositions[i].id == positionId) {
                positionIndex = i;
                found = true;
                break;
            }
        }

        require(found, "Position not found");
        Position storage position = userPositions[positionIndex];
        require(!position.withdrawn, "Already withdrawn");
        require(
            block.timestamp >= position.startTime + position.lockDuration,
            "Still locked"
        );

        address token = position.token;
        uint256 yieldAmount = calculateExpectedYield(
            position.amount,
            position.lockDuration
        );

        // Check if enough tokens are available in the contract
        uint256 tokenBalance = IERC20(token).balanceOf(address(this));

        require(
            tokenBalance >= position.amount + yieldAmount,
            "Insufficient token balance in pool"
        );

        // Update state before external calls
        totalValueLocked -= position.amount;
        userTokenBalance[msg.sender][token] -= position.amount;
        position.withdrawn = true;

        // Transfer yield
        IERC20(token).safeTransfer(msg.sender, position.amount);
        // Transfer tokens last
        IERC20(token).safeTransfer(msg.sender, yieldAmount);

        // Clean up position data
        activePositionsCount[msg.sender]--;

        // Only remove from active stakers if no active positions left
        if (activePositionsCount[msg.sender] == 0) {
            uint256 lastIndex = activeStakers.length - 1;
            address lastStaker = activeStakers[lastIndex];

            if (msg.sender != lastStaker) {
                uint256 currentStakerIndex = stakerIndex[msg.sender];
                activeStakers[currentStakerIndex] = lastStaker;
                stakerIndex[lastStaker] = currentStakerIndex;
            }

            activeStakers.pop();
            totalStakers--;
        }

        // Move this to the end of the function, after transfers
        delete positionOwners[positionId];

        emit Withdrawn(msg.sender, token, position.amount, yieldAmount);
    }

    /**
     * @notice Unstake tokens from the yield pool with penalty if before lock duration.
     * @param positionId uint256 id of an active user having funds in a yieldPool
     */
    function unstake(uint256 positionId) external nonReentrant {
        require(positionOwners[positionId] == msg.sender, "Not position owner");

        Position[] storage userPositions = positions[msg.sender];
        uint256 positionIndex;
        bool found;

        for (uint i = 0; i < userPositions.length; i++) {
            if (userPositions[i].id == positionId) {
                positionIndex = i;
                found = true;
                break;
            }
        }

        require(found, "Position not found");
        Position storage position = userPositions[positionIndex];
        require(!position.withdrawn, "Already withdrawn");

        address token = position.token;
        uint256 amountToReturn = position.amount;

        // 10% penalty if unstaking before lock duration
        if (block.timestamp < position.startTime + position.lockDuration) {
            uint256 penalty = position.amount / 10; // 10% penalty
            amountToReturn = position.amount - penalty;
        }

        // Check if enough tokens in the pool
        uint256 tokenBalance = IERC20(token).balanceOf(address(this));
        require(
            tokenBalance >= amountToReturn,
            "Insufficient token balance in pool"
        );

        // Update state before transfer
        totalValueLocked -= position.amount;
        userTokenBalance[msg.sender][token] -= position.amount;

        // Mark position as withdrawn
        position.withdrawn = true;

        // Clean up position data
        delete positionOwners[positionId];
        activePositionsCount[msg.sender]--;

        // Remove from active stakers if no positions left
        if (activePositionsCount[msg.sender] == 0) {
            uint256 lastIndex = activeStakers.length - 1;
            address lastStaker = activeStakers[lastIndex];

            if (msg.sender != lastStaker) {
                uint256 currentStakerIndex = stakerIndex[msg.sender];
                activeStakers[currentStakerIndex] = lastStaker;
                stakerIndex[lastStaker] = currentStakerIndex;
            }

            activeStakers.pop();
            totalStakers--;
        }

        // Transfer tokens
        IERC20(token).safeTransfer(msg.sender, amountToReturn);

        emit Withdrawn(msg.sender, token, amountToReturn, 0);
    }

    function calculateExpectedYield(
        uint256 _amount,
        uint256 _lockDuration
    ) public view returns (uint256) {
        // unchecked for gas optimization where overflow is impossible
        unchecked {
            return (_amount * _lockDuration * yieldRate) / (YEAR * 100);
        }
    }
}
