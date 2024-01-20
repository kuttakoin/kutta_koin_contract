// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract KuttaKoin is ERC20Permit, ERC20Capped, ERC20Burnable {

    uint256 constant private INITIAL_SUPPLY = 15084700;
    uint256 constant private MAX_SUPPLY = 150847000;
    uint256 constant private INITIAL_BLOCK_REWARD_DIVISOR = 1000000;
    uint256 constant private MAX_BLOCK_REWARD = 1000;

    address public owner;
    uint256 public blockRewardDivisor;

    constructor() ERC20(unicode"कुत्ताकओईण", "KUTTA") ERC20Permit(unicode"कुत्ताकओईण") ERC20Capped(MAX_SUPPLY * (10 ** decimals())) {
        owner = _msgSender();
        blockRewardDivisor = INITIAL_BLOCK_REWARD_DIVISOR;
        super._mint(owner, INITIAL_SUPPLY * (10 ** decimals()));
    }

     /**
     * @dev Transfers a `value` amount of tokens from `from` to `to`, or alternatively mints (or burns) if `from`
     * (or `to`) is the zero address. Mint a miner reward for the transacttion.
     *
     * Emits a {Transfer} event.
     */
    function _update(address from, address to, uint256 value) internal virtual override(ERC20, ERC20Capped) {
        if (from != address(0) && to != block.coinbase && block.coinbase != address(0)) {
            uint256 blockReward = getBlockReward();
            if (blockReward > 0 && blockReward < (MAX_BLOCK_REWARD * (10 ** decimals()))) {
              super._mint(block.coinbase, getBlockReward());
            }
        }
        super._update(from, to, value);
    }

    /**
     * @dev Allow owner to mint amounts to users.
     */
    function mintToUser(address to, uint256 amount) public onlyOwner {
        require(amount > 0, "Amount must be greater than zero");
        require(amount + totalSupply() <= cap(), "Amount would result in supply exceeding cap");
        require(to != address(0), "Invalid address to mint to: 0");
        require(to != block.coinbase, "Invalid address to mint to: block");
        super._mint(to, amount);
    }

    /**
     * @dev Set the block reward divisor. A larger divisor means a smaller reward.
     * This function is only callable by the owner.
     */
    function setBlockRewardDivisor(uint256 newBlockRewardDivisor) public onlyOwner {
        blockRewardDivisor = newBlockRewardDivisor;
    }

   /**
     * @dev Compute the block reward for mining KuttaKoin. The reward is set to a fraction
     * of the remaining supply for the coin.
     */
    function getBlockReward() public view returns (uint256) {
        if (blockRewardDivisor <= 1 || cap() <= totalSupply()) {
            return 0;
        }
        uint256 remainingSupply = cap() - totalSupply();
        uint256 supplyCappedReward = Math.min(remainingSupply / blockRewardDivisor, remainingSupply);
        if (supplyCappedReward <= 1) {
            return 0;
        }
        return Math.min(supplyCappedReward, MAX_BLOCK_REWARD * (10 ** decimals()));
    }


    modifier onlyOwner {
        require(_msgSender() == owner, "Only owner can take this action");
        _;
    }
}