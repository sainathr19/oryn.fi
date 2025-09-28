// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "forge-std/Script.sol";
import "@uniswap/v3-core/contracts/UniswapV3Factory.sol";
import "@uniswap/v3-periphery/contracts/NonfungiblePositionManager.sol";
import "@uniswap/v3-periphery/contracts/SwapRouter.sol";

// Mock WETH contract for testing
contract MockWETH {
    string public name = "Wrapped Ether";
    string public symbol = "WETH";
    uint8 public decimals = 18;
}

contract DeployUniswapCoreAndPeriphery is Script {
    // Uniswap contracts
    UniswapV3Factory public factory;
    NonfungiblePositionManager public positionManager;
    SwapRouter public swapRouter;
    MockWETH public weth;
    
    function run() external {
        vm.startBroadcast();
        
        // Deploy Mock WETH first
        weth = MockWETH(0x5E3e9397Ac1Bd1b112aF2880fFEF74aC248b1F12);
        
        // Deploy Uniswap V3 Factory
        factory = new UniswapV3Factory();
        
        // Deploy Position Manager with proper WETH address
        positionManager = new NonfungiblePositionManager(
            address(factory),
            address(weth)
        );
        
        // Deploy Swap Router with proper WETH address
        swapRouter = new SwapRouter(
            address(factory),
            address(weth)
        );
        
        vm.stopBroadcast();
        
        // Log deployed addresses
        console.log("Mock WETH:", address(weth));
        console.log("UniswapV3Factory:", address(factory));
        console.log("NonfungiblePositionManager:", address(positionManager));
        console.log("SwapRouter:", address(swapRouter));
    }
}