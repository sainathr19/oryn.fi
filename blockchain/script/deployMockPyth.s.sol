// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/mocks/MockPyth.sol";

contract DeployMockPyth is Script {
    function run() external {
        // uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // vm.startBroadcast(deployerPrivateKey);
        vm.startBroadcast();
        
        // MockPyth mockPyth = MockPyth(address(0x818fC108459769e8D18dCcEc6768936720174155));
        MockPyth mockPyth = new MockPyth();

    //     function setPrice(
    //     bytes32 id,
    //     int64 price,
    //     uint64 conf,
    //     int32 expo,
    //     uint256 publishTime
    // )
    mockPyth.setPrice(keccak256("ETH/USD"), 4000_00000000, 100_00000000, -8, block.timestamp);
    console.log("The id for ETH/USD is ");
    console.logBytes32(keccak256("ETH/USD"));
    mockPyth.setPrice(keccak256("BTC/USD"), 110000_00000000, 500_00000000, -8, block.timestamp);
    console.log("The id for BTC/USD is ");
    console.logBytes32(keccak256("BTC/USD"));
    mockPyth.setPrice(keccak256("USDC/USD"), 1_00000000, 100_00000000, -8, block.timestamp);
    console.log("The id for USDC/USD is ");
    console.logBytes32(keccak256("USDC/USD"));
    mockPyth.setPrice(keccak256("UNI/USD"), 12_00000000, 100_00000000, -8, block.timestamp);
    console.log("The id for UNI/USD is ");
    console.logBytes32(keccak256("UNI/USD"));

        vm.stopBroadcast();
        
        console.log("MockPyth deployed to:", address(mockPyth));
    }
}