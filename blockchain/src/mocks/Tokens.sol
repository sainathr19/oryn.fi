// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 1_000_000_000 * 10 ** 6);
    }
}

contract WETH is ERC20 {
    constructor() ERC20("Wrapped Ether", "WETH") {
        _mint(msg.sender, 1_000_000_000 * 10 ** decimals());
    }
}

contract WBTC is ERC20 {
    constructor() ERC20("Wrapped Bitcoin", "WBTC") {
        _mint(msg.sender, 1_000_000_000 * 10 ** 8);
    }
}

contract UNI is ERC20 {
    constructor() ERC20("Uniswap", "UNI") {
        _mint(msg.sender, 1_000_000_000 * 10 ** decimals());
    }
}