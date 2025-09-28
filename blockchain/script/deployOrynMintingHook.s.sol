// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script, console} from "forge-std/Script.sol";
import {OrynMintingHook} from "../src/OrynMintingHook.sol";
import {IPoolManager} from "lib/v4-template/lib/uniswap-hooks/lib/v4-core/src/interfaces/IPoolManager.sol";

contract DeployOrynMintingHook is Script {
    // Pool manager address (update for your network)
    address constant POOL_MANAGER = 0x4300000000000000000000000000000000000000; // Base Sepolia
    
    // Existing OrynEngine address (update with your deployed engine)
    address constant ORYN_ENGINE = address(0); // Update with your OrynEngine address
    
    // Position manager address (update for your network)
    address constant POSITION_MANAGER = address(0); // Update with your PositionManager address

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying Oryn Minting Hook with deployer:", deployer);
        console.log("Pool Manager:", POOL_MANAGER);
        console.log("OrynEngine:", ORYN_ENGINE);
        console.log("Position Manager:", POSITION_MANAGER);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy OrynMintingHook
        OrynMintingHook hook = new OrynMintingHook(
            IPoolManager(POOL_MANAGER),
            ORYN_ENGINE,
            POSITION_MANAGER
        );
        
        console.log("OrynMintingHook deployed at:", address(hook));

        vm.stopBroadcast();

        console.log("Deployment complete!");
        console.log("OrynMintingHook:", address(hook));
    }
}
