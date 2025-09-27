// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/mocks/MockPyth.sol";

contract DeployMockPyth is Script {
    function run() external {
        // uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // vm.startBroadcast(deployerPrivateKey);
        vm.startBroadcast();
        
        MockPyth mockPyth = new MockPyth();
        
        vm.stopBroadcast();
        
        console.log("MockPyth deployed to:", address(mockPyth));
    }
}