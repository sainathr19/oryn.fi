// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {USDC, WBTC, WETH, UNI} from "../src/mocks/Tokens.sol";
import {Script, console} from "forge-std/Script.sol";

contract DeployTokens is Script {

    function run() public {
        vm.startBroadcast();
        USDC usdc = new USDC();
        console.log("THE USDC ADDRESS is ", address(usdc)); 
        WETH weth = new WETH();
        console.log("THE WETH ADDRESS is ", address(weth)); 
        WBTC wbtc = new WBTC();
        console.log("THE WBTC ADDRESS is ", address(wbtc)); 
        UNI uni = new UNI();
        console.log("THE UNI ADDRESS is ", address(uni)); 
        vm.stopBroadcast();
    }
}
