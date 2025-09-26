// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/OrynEngine.sol";
import "../src/OrynUSD.sol";
import "../src/mocks/MockPyth.sol";
import "../src/interfaces/PythStructs.sol";

/**
 * @title OrynEngineTestWithPyth
 * @notice Test suite for OrynEngine with Pyth Network integration
 */
contract OrynEngineTestWithPyth is Test {
    
    OrynEngine public orynEngine;
    OrynUSD public orynUSD;
    MockPyth public mockPyth;
    
    // Mock tokens
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant WBTC = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
    
    // Mock price feed IDs
    bytes32 public constant ETH_USD_PRICE_ID = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;
    bytes32 public constant BTC_USD_PRICE_ID = 0xe62df6c8b4c85fe1e1cc6f7e5a9bcd7b9b8b8b8b8b8b8b8b8b8b8b8b8b8b8;
    
    address public constant USER = address(0x1);
    uint256 public constant STARTING_BALANCE = 10 ether;
    
    function setUp() public {
        // Deploy contracts
        mockPyth = new MockPyth();
        orynUSD = new OrynUSD(address(this));
        
        // Setup token arrays
        address[] memory tokenAddresses = new address[](2);
        bytes32[] memory priceFeedIds = new bytes32[](2);
        
        tokenAddresses[0] = WETH;
        tokenAddresses[1] = WBTC;
        priceFeedIds[0] = ETH_USD_PRICE_ID;
        priceFeedIds[1] = BTC_USD_PRICE_ID;
        
        // Deploy OrynEngine
        orynEngine = new OrynEngine(
            tokenAddresses,
            priceFeedIds,
            address(orynUSD),
            address(mockPyth)
        );
        
        // Transfer ownership
        orynUSD.transferOwnership(address(orynEngine));
        
        // Set mock prices
        // ETH: $2000 (expo: -8)
        mockPyth.setPrice(ETH_USD_PRICE_ID, 200000000000, 1000000, -8, block.timestamp);
        
        // BTC: $45000 (expo: -8)
        mockPyth.setPrice(BTC_USD_PRICE_ID, 4500000000000, 10000000, -8, block.timestamp);
    }
    
    function testGetUSDValueWithPyth() public {
        // Test ETH price conversion
        uint256 ethAmount = 1 ether; // 1 ETH
        uint256 usdValue = orynEngine.getUSDValue(WETH, ethAmount);
        
        // Should be approximately $2000 (accounting for precision)
        assertApproxEqAbs(usdValue, 2000 ether, 1 ether);
    }
    
    function testGetTokenAmountinUSDWithPyth() public {
        // Test converting $1000 USD to ETH amount
        uint256 usdAmount = 1000 ether;
        uint256 tokenAmount = orynEngine.getTokenAmountinUSD(WETH, usdAmount);
        
        // Should be approximately 0.5 ETH ($1000 / $2000 per ETH)
        assertApproxEqAbs(tokenAmount, 0.5 ether, 0.01 ether);
    }
    
    function testGetLatestPythPrice() public {
        PythStructs.Price memory price = orynEngine.getLatestPythPrice(WETH);
        
        assertEq(price.price, 200000000000); // $2000 * 10^8
        assertEq(price.expo, -8);
        assertGt(price.publishTime, 0);
    }
    
    function testStalePrice() public {
        // Set an old price (older than threshold)
        mockPyth.setPrice(ETH_USD_PRICE_ID, 200000000000, 1000000, -8, block.timestamp - 400); // 400 seconds ago
        
        // This should revert due to stale price
        vm.expectRevert(OrynEngine.OrynEngine__StalePrice.selector);
        orynEngine.getLatestPythPrice(WETH);
    }
    
    function testPriceFeedNotFound() public {
        address unknownToken = address(0x999);
        
        vm.expectRevert(OrynEngine.OrynEngine__TokenNotAllowed.selector);
        orynEngine.getLatestPythPrice(unknownToken);
    }
    
    function testGetPriceFeedId() public {
        bytes32 feedId = orynEngine.getPriceFeedId(WETH);
        assertEq(feedId, ETH_USD_PRICE_ID);
    }
    
    function testGetPythContract() public {
        address pythAddress = address(orynEngine.getPythContract());
        assertEq(pythAddress, address(mockPyth));
    }
    
    function testPythPriceAgeThreshold() public {
        uint256 threshold = orynEngine.getPythPriceAgeThreshold();
        assertEq(threshold, 300); // 5 minutes
    }
    
    modifier fundUser() {
        // This would need mock ERC20 tokens for full testing
        // For now, just set up the user
        vm.deal(USER, STARTING_BALANCE);
        _;
    }
}