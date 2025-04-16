// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title YieldToken
 * @dev Represents token.
 */
contract YieldToken is ERC20, Ownable {
    // Track last mint time for each address
    mapping(address => uint256) public lastMintTime;
    mapping(address => bool) public isStudent;
    // Add student status tracking

    mapping(address => bool) public isMinter;
    address[] minters;

    uint256 public constant MINT_COOLDOWN = 1 days;

    /// @custom:oz-upgrades-unsafe-allow constructor
    event MinterSet(address account, bool status);
    // Event for tracking mints
    event TokensMinted(
        address indexed to,
        uint256 amount,
        address indexed minter
    );

    // Custom error for unauthorized minting
    error UnauthorizedMinter(address caller);
    error ZeroAddressMint();


    constructor(
        address initialOwner,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) Ownable(initialOwner) {}


    /**
     * @dev Minting specifically for student rewards
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mintForStudent(address to, uint256 amount) external {
        require(isStudent[to], "Address must be a student");
        lastMintTime[to] = block.timestamp;
        _mint(to, amount);
    }

    /**
     * @dev Minting specifically for contract rewards
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function InsufficientMint(address to, uint256 amount) external {
        lastMintTime[to] = block.timestamp;
        _mint(to, amount);
    }


    /**
     * @dev Check if address is a  student
     * @param student Address of the student
     */
    function getIsStudent(address student) external view returns (bool) {
        return isStudent[student];
    }
        function setMinter(address account, bool status) external onlyOwner {
        isMinter[account] = status;
        minters.push(account);
        emit MinterSet(account, status);
    }

    function removeMinter(address account) public onlyOwner {
        require(account != address(0), "Invalid address");
        require(isMinter[account], "Address is not a minter");

        // delete instead of setting to false
        delete isMinter[account];

        // Remove from array
        for (uint256 i = 0; i < minters.length; i++) {
            if (minters[i] == account) {
                minters[i] = minters[minters.length - 1];
                minters.pop();
                break;
            }
        }

        emit MinterSet(account, false);
    }

    function getMinters() public view onlyOwner returns (address[] memory) {
        return minters;
    }

    /**
     * @notice Mints new tokens to a specified address
     * @dev Only owner or approved minters can call this function
     * @param to Address to receive the minted tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) public {
        // Check for zero address
        if (to == address(0)) revert ZeroAddressMint();

        // Check if caller is authorized to mint
        if (msg.sender != owner() && !isMinter[msg.sender]) {
            revert UnauthorizedMinter(msg.sender);
        }

        _mint(to, amount);
        emit TokensMinted(to, amount, msg.sender);
    }


function mintToPool(address _yieldPoolAddress) public onlyOwner {
        _mint(_yieldPoolAddress, 10_000_000 * 10 ** 18);
        emit TokensMinted(_yieldPoolAddress, 10_000_000 * 10 ** 18, msg.sender);
    }

    /**
     * @dev Set student status for an address
     * @param student Address of the student
     * @param status True if student, false otherwise
     */
    function setStudentStatus(address student, bool status) external onlyOwner {
        isStudent[student] = status;
    }

    /**
     * @notice only the owner can burn tokens
     * @param from Address of the candidate
     * @param amount Name of the candidate
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}
