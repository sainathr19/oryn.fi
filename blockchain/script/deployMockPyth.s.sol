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
    bytes32[] memory ids = new bytes32[](4);
        ids[0] = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace; // ETH/USD
        ids[1] = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43; // BTC/USD
        ids[2] = 0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a; // USDC/USD
        ids[3] = 0x78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501; // UNI/USD
    mockPyth.setPrice(ids[0], 4000_00000000, 100_00000000, -8, block.timestamp);
    console.log("The id for ETH/USD is ");
    console.logBytes32(ids[0]);
    mockPyth.setPrice(ids[1], 110000_00000000, 500_00000000, -8, block.timestamp);
    console.log("The id for BTC/USD is ");
    console.logBytes32(ids[1]);
    mockPyth.setPrice(ids[2], 1_00000000, 100_00000000, -8, block.timestamp);
    console.log("The id for USDC/USD is ");
    console.logBytes32(ids[2]);
    mockPyth.setPrice(ids[3], 12_00000000, 100_00000000, -8, block.timestamp);
    console.log("The id for UNI/USD is ");
    console.logBytes32(ids[3]);

        vm.stopBroadcast();
        
        console.log("MockPyth deployed to:", address(mockPyth));
    }
}