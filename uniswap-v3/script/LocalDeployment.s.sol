// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;
pragma abicoder v2;

import "forge-std/Script.sol";
import "./DeployUniswapV3.s.sol";

contract LocalDeployment is Script {
    DeployUniswapV3 deployer;
    
    // Mock WETH for local testing
    address public constant LOCAL_WETH = 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9;
    
    function run() external {
        vm.startBroadcast();
        
        console.log("Starting local Uniswap V3 deployment...");
        
        // Deploy main contracts
        deployer = new DeployUniswapV3();
        deployer.run();
        
        console.log("Local deployment completed!");
        
        vm.stopBroadcast();
    }
}