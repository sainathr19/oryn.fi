// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script, console} from "forge-std/Script.sol";
import {OrynMintingHook} from "../src/OrynMintingHook.sol";

import {Hooks} from "lib/v4-template/lib/uniswap-hooks/lib/v4-core/src/libraries/Hooks.sol";
import {HookMiner} from "@uniswap/v4-periphery/src/utils/HookMiner.sol";
import {IPoolManager} from "lib/v4-template/lib/uniswap-hooks/lib/v4-core/src/interfaces/IPoolManager.sol";

contract DeployOrynMintingHook is Script {
    // Pool manager address (update for your network)
    address constant POOL_MANAGER = 0xE03A1074c86CFeDd5C142C4F04F1a1536e203543; // eth Sepolia
    
    // Existing OrynEngine address (update with your deployed engine)
    address constant ORYN_ENGINE = 0xA3f5717581cFc0e8718B98Fd26E4fB8c313F4Fa0; // Update with your OrynEngine address
    
    // Position manager address (update for your network)
    address constant POSITION_MANAGER = 0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4; // Update with your PositionManager address

    function run() external {
        
        console.log("Deploying Oryn Minting Hook with deployer:", msg.sender);
        console.log("Pool Manager:", POOL_MANAGER);
        console.log("OrynEngine:", ORYN_ENGINE);
        console.log("Position Manager:", POSITION_MANAGER);


        uint160 flags = uint160(Hooks.AFTER_ADD_LIQUIDITY_FLAG);

        // Mine a salt that will produce a hook address with the correct flags
        bytes memory constructorArgs = abi.encode(IPoolManager(POOL_MANAGER), ORYN_ENGINE, POSITION_MANAGER);
        (address hookAddress, bytes32 salt) =
            HookMiner.find(CREATE2_FACTORY, flags, type(OrynMintingHook).creationCode, constructorArgs);

        vm.startBroadcast();

        // Deploy OrynMintingHook
        OrynMintingHook hook = new OrynMintingHook{salt: salt}(
            IPoolManager(POOL_MANAGER),
            ORYN_ENGINE,
            POSITION_MANAGER
        );

        vm.stopBroadcast();
        
        console.log("OrynMintingHook deployed at:", address(hook));
        
        // Verify the deployment
        require(address(hook) == hookAddress, "Hook address mismatch");
        console.log("Hook address verified successfully!");

        

        console.log("Deployment complete!");
        console.log("OrynMintingHook:", address(hook));
        console.log("Hook flags:", flags);
        console.log("Salt used:", vm.toString(salt));
    }
}