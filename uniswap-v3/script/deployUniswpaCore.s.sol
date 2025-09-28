// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "@uniswap/v3-core/contracts/UniswapV3Factory.sol";
import "@uniswap/v3-periphery/contracts/SwapRouter.sol";
import "@uniswap/v3-periphery/contracts/NonfungiblePositionManager.sol";
import "@uniswap/v3-periphery/contracts/NonfungibleTokenPositionDescriptor.sol";

contract DeployUniswapCore is Script {
    function run() external {
        vm.startBroadcast();

        // Use the existing WETH address
        address wethAddress = 0x5E3e9397Ac1Bd1b112aF2880fFEF74aC248b1F12;
        console.log("Using WETH at:", wethAddress);

        // Deploy UniswapV3Factory
        UniswapV3Factory factory = new UniswapV3Factory();
        console.log("UniswapV3Factory deployed at:", address(factory));
        
        // Deploy NonfungibleTokenPositionDescriptor
        NonfungibleTokenPositionDescriptor positionDescriptor = new NonfungibleTokenPositionDescriptor(
            wethAddress,
            bytes32("ETH")
        );
        console.log("PositionDescriptor deployed at:", address(positionDescriptor));
        
        // Deploy NonfungiblePositionManager
        NonfungiblePositionManager positionManager = new NonfungiblePositionManager(
            address(factory),
            wethAddress,
            address(positionDescriptor)
        );
        console.log("NonfungiblePositionManager deployed at:", address(positionManager));
        
        // Deploy SwapRouter
        SwapRouter swapRouter = new SwapRouter(address(factory), wethAddress);
        console.log("SwapRouter deployed at:", address(swapRouter));

        console.log("All contracts deployed successfully!");

        vm.stopBroadcast();
    }
}