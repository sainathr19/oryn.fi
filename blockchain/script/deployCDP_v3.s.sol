/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import {OrynEngine} from "src/OrynEngine.sol";

contract DeployOOrynEngine is Script {
    function run() external {

//         THE USDC ADDRESS is  0x38A72C43Abd3fCDC56764E0D0226d9d6D17c3192
//   THE WETH ADDRESS is  0x9CBEf80A86c1F9209F774a8807043F6Efec19042
//   THE WBTC ADDRESS is  0xeBf11B64DC588FcC2573c9a6Efda449888ef2B27
//   THE UNI ADDRESS is  0x0491bDD4BA0D32AC596744F79ce425A36aaF4db6
// MockPyth deployed to: 0x818fC108459769e8D18dCcEc6768936720174155 

// The id for ETH/USD is 
//   0x0b43555ace6b39aae1b894097d0a9fc17f504c62fea598fa206cc6f5088e6e45
  
// The id for BTC/USD is 
//   0xee62665949c883f9e0f6f002eac32e00bd59dfe6c34e92a91c37d6a8322d6489
  
// The id for USDC/USD is 
//   0xff064b881a0c0fff844177f881a313ff894bfc6093d33b5514e34d7faa41b7ef
  
// The id for UNI/USD is 
//   0xc3c616edf761b05752b7dbe696995fec0b1e54988edaee794d878464e57ba591

        // TESTNET MAIN CONFIG 
        bytes32[] memory ids = new bytes32[](4);
        ids[0] = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace; // ETH/USD
        ids[1] = 0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43; // BTC/USD
        ids[2] = 0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a; // USDC/USD
        ids[3] = 0x78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501; // UNI/USD

        // ids[0] = 0x0b43555ace6b39aae1b894097d0a9fc17f504c62fea598fa206cc6f5088e6e45; // ETH/USD
        // ids[1] = 0xee62665949c883f9e0f6f002eac32e00bd59dfe6c34e92a91c37d6a8322d6489; // BTC/USD
        // ids[2] = 0xff064b881a0c0fff844177f881a313ff894bfc6093d33b5514e34d7faa41b7ef; // USDC/USD
        // ids[3] = 0xc3c616edf761b05752b7dbe696995fec0b1e54988edaee794d878464e57ba591; // UNI/USD


        address[] memory tokens = new address[](4);
        tokens[0] = 0x9CBEf80A86c1F9209F774a8807043F6Efec19042; // WETH
        tokens[1] = 0xeBf11B64DC588FcC2573c9a6Efda449888ef2B27; // WBTC
        tokens[2] = 0x38A72C43Abd3fCDC56764E0D0226d9d6D17c3192; // USDC
        tokens[3] = 0x0491bDD4BA0D32AC596744F79ce425A36aaF4db6; // UNI

        address oracle = 0xDd24F84d36BF92C65F92307595335bdFab5Bbd21; // MockPyth (ETH sepolia)
        // address oracle = 0xfb0EeE649130222d949265CafC442aC64233bd06; // MockPyth (ETH sepolia)

        address positionManager = 0x1238536071E1c677A632429e3655c799b22cDA52; // NFTPositionmanager

        vm.startBroadcast();
        OrynEngine engine = new OrynEngine(tokens, ids, oracle, positionManager);
        vm.stopBroadcast();

        console2.log("OrynEngine deployed at", address(engine));
    }
}