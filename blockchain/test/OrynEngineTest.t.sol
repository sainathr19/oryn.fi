// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/OrynEngine.sol";
import "../src/OrynUSD.sol";
import "../src/mocks/MockPyth.sol";
import "../src/mocks/MockERC20.sol";
import "../src/mocks/MockUniswapV3Factory.sol";
import "../src/mocks/MockUniswapV3Pool.sol";
import "../src/mocks/MockNonfungiblePositionManager.sol";
import "../src/interfaces/IPyth.sol";
import "../src/interfaces/PythStructs.sol";
import "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import "@uniswap/v3-periphery/contracts/libraries/LiquidityAmounts.sol";

/**
 * @title OrynEngineTest
 * @notice Comprehensive test suite for OrynEngine with Pyth Network integration
 */
contract OrynEngineTest is Test {
    OrynEngine public orynEngine;
    OrynUSD public orynUSD;
    MockPyth public mockPyth;
    MockERC20 public weth;
    MockERC20 public wbtc;
    MockUniswapV3Factory public mockFactory;
    MockUniswapV3Pool public mockPool;
    MockNonfungiblePositionManager public mockPositionManager;
    
    // Test addresses
    address public constant USER = address(0x1);
    address public constant LIQUIDATOR = address(0x2);
    address public constant OWNER = address(0x3);
    
    // Starting balances
    uint256 public constant STARTING_BALANCE = 100 ether;
    uint256 public constant COLLATERAL_AMOUNT = 10 ether;
    uint256 public constant MINT_AMOUNT = 1000 ether; // $1000 worth of OrynUSD
    
    // Custom price feed IDs for testing (32 bytes each)
    bytes32 public constant ETH_USD_PRICE_ID = keccak256("ETH_USD_TEST");
    bytes32 public constant BTC_USD_PRICE_ID = keccak256("BTC_USD_TEST");
    
    // Mock prices with Pyth format: price * 10^expo
    // ETH: $2000.00 = 200000000000 * 10^(-8)
    int64 public constant ETH_PRICE = 200000000000;  // $2000 with 8 decimals
    // BTC: $40000.00 = 4000000000000 * 10^(-8)  
    int64 public constant BTC_PRICE = 4000000000000; // $40000 with 8 decimals
    int32 public constant PRICE_EXPO = -8;           // Pyth typically uses -8 exponent
    uint24 public constant POOL_FEE = 3000;
    int24 public constant TICK_LOWER = -600;
    int24 public constant TICK_UPPER = 600;
    
    event CollateralDeposited(address indexed user, address indexed token, uint256 indexed amount);

    function setUp() public {
        // Start prank as owner for deployment
        vm.startPrank(OWNER);

        // Deploy mock contracts
        mockPyth = new MockPyth();
        weth = new MockERC20("Wrapped Ethereum", "WETH", 18);
        wbtc = new MockERC20("Wrapped Bitcoin", "WBTC", 8);
        mockFactory = new MockUniswapV3Factory();

        uint160 sqrtPriceX96 = TickMath.getSqrtRatioAtTick(0);
        mockPool = new MockUniswapV3Pool(sqrtPriceX96, 0);
        mockFactory.setPool(address(weth), address(wbtc), POOL_FEE, address(mockPool));
        mockPositionManager = new MockNonfungiblePositionManager(address(mockFactory));
        
        // Set up mock prices in Pyth
        mockPyth.setPrice(ETH_USD_PRICE_ID, ETH_PRICE, 1000000, PRICE_EXPO, block.timestamp);
        mockPyth.setPrice(BTC_USD_PRICE_ID, BTC_PRICE, 2000000, PRICE_EXPO, block.timestamp);
        
        // Deploy OrynEngine with mock tokens and price feeds
        address[] memory tokenAddresses = new address[](2);
        bytes32[] memory priceFeedIds = new bytes32[](2);
        
        tokenAddresses[0] = address(weth);
        tokenAddresses[1] = address(wbtc);
        priceFeedIds[0] = ETH_USD_PRICE_ID;
        priceFeedIds[1] = BTC_USD_PRICE_ID;
        
        orynEngine = new OrynEngine(tokenAddresses, priceFeedIds, address(mockPyth), address(mockPositionManager));
        orynUSD = orynEngine.getOrynUSDContractAddress();
        
        vm.stopPrank();
        
        // Mint tokens to users
        weth.mint(USER, STARTING_BALANCE);
        wbtc.mint(USER, STARTING_BALANCE);
        weth.mint(LIQUIDATOR, STARTING_BALANCE);
        wbtc.mint(LIQUIDATOR, STARTING_BALANCE);
        
        // Set up approvals
        vm.startPrank(USER);
        weth.approve(address(orynEngine), type(uint256).max);
        wbtc.approve(address(orynEngine), type(uint256).max);
        mockPositionManager.setApprovalForAll(address(orynEngine), true);
        vm.stopPrank();
        
        vm.startPrank(LIQUIDATOR);
        weth.approve(address(orynEngine), type(uint256).max);
        wbtc.approve(address(orynEngine), type(uint256).max);
        vm.stopPrank();
    }
    
    function testSetup() public {
        // Test that contracts are deployed correctly
        assertTrue(address(orynEngine) != address(0));
        assertTrue(address(orynUSD) != address(0));
        assertTrue(address(mockPyth) != address(0));
        assertTrue(address(weth) != address(0));
        assertTrue(address(wbtc) != address(0));
        
        // Test that users have starting balances
        assertEq(weth.balanceOf(USER), STARTING_BALANCE);
        assertEq(wbtc.balanceOf(USER), STARTING_BALANCE);
    }
    
    function testPythPriceIntegration() public {
        // Test that we can get latest price from Pyth
        PythStructs.Price memory price = orynEngine.getLatestPythPrice(address(weth));
        
        assertEq(price.price, ETH_PRICE);
        assertEq(price.expo, PRICE_EXPO);
        assertGt(price.publishTime, 0);
        console.log("ETH Price from Pyth:", uint256(uint64(price.price)));
        console.log("ETH Expo from Pyth:", uint256(uint32(price.expo)));
    }
    
    function testGetUSDValue() public {
        uint256 ethAmount = 1 ether; // 1 ETH
        uint256 usdValue = orynEngine.getUSDValue(address(weth), ethAmount);
        
        console.log("1 ETH USD Value:", usdValue);
        // 1 ETH should be worth $2000 (2000 * 1e18)
        assertApproxEqRel(usdValue, 2000 ether, 1e15); // 0.1% tolerance
    }
    
    function testGetTokenAmountInUSD() public {
        uint256 usdAmount = 2000 ether; // $2000
        uint256 tokenAmount = orynEngine.getTokenAmountinUSD(address(weth), usdAmount);
        
        console.log("$2000 worth of ETH tokens:", tokenAmount);
        // $2000 USD should equal 1 ETH (1 * 1e18)
        assertApproxEqRel(tokenAmount, 1 ether, 1e15); // 0.1% tolerance
    }
    
    function testDepositCollateral() public {
        vm.startPrank(USER);
        
        uint256 balanceBefore = weth.balanceOf(USER);
        
        vm.expectEmit(true, true, true, true);
        emit CollateralDeposited(USER, address(weth), COLLATERAL_AMOUNT);
        
        orynEngine.depositCollateral(address(weth), COLLATERAL_AMOUNT);
        
        uint256 deposited = orynEngine.getCollateralDepositedAmount(USER, address(weth));
        uint256 balanceAfter = weth.balanceOf(USER);
        
        assertEq(deposited, COLLATERAL_AMOUNT);
        assertEq(balanceBefore - balanceAfter, COLLATERAL_AMOUNT);
        
        vm.stopPrank();
    }
    
    function testMintOrynUSD() public {
        vm.startPrank(USER);
        
        // First deposit collateral
        orynEngine.depositCollateral(address(weth), COLLATERAL_AMOUNT);
        
        // Then mint OrynUSD
        orynEngine.mintOrynUSD(MINT_AMOUNT);
        
        uint256 minted = orynEngine.getOrynUSDMint(USER);
        uint256 balance = orynUSD.balanceOf(USER);
        
        assertEq(minted, MINT_AMOUNT);
        assertEq(balance, MINT_AMOUNT);
        
        console.log("OrynUSD minted:", minted);
        console.log("OrynUSD balance:", balance);
        
        vm.stopPrank();
    }
    
    function testDepositCollateralAndMint() public {
        vm.startPrank(USER);
        
        orynEngine.depositCollateralAndMintOrynUSD(address(weth), COLLATERAL_AMOUNT, MINT_AMOUNT);
        
        uint256 deposited = orynEngine.getCollateralDepositedAmount(USER, address(weth));
        uint256 minted = orynEngine.getOrynUSDMint(USER);
        uint256 balance = orynUSD.balanceOf(USER);
        
        assertEq(deposited, COLLATERAL_AMOUNT);
        assertEq(minted, MINT_AMOUNT);
        assertEq(balance, MINT_AMOUNT);
        
        vm.stopPrank();
    }
    
    function testHealthFactor() public {
        vm.startPrank(USER);
        
        orynEngine.depositCollateralAndMintOrynUSD(address(weth), COLLATERAL_AMOUNT, MINT_AMOUNT);
        
        uint256 healthFactor = orynEngine.getHealthFactor(USER);
        
        console.log("Health Factor:", healthFactor);
        console.log("Min Health Factor:", orynEngine.getMinHealthFactor());
        
        // With 10 ETH ($20,000) collateral and $1000 minted
        // Health factor should be: (20000 * 50 / 100) / 1000 = 10
        assertGt(healthFactor, orynEngine.getMinHealthFactor());
        
        vm.stopPrank();
    }
    
    function testRedeemCollateral() public {
        vm.startPrank(USER);
        
        // Deposit collateral and mint some OrynUSD (less than max to keep healthy)
        orynEngine.depositCollateralAndMintOrynUSD(address(weth), COLLATERAL_AMOUNT, MINT_AMOUNT / 2);
        
        uint256 redeemAmount = 1 ether;
        uint256 balanceBefore = weth.balanceOf(USER);
        
        orynEngine.redeemCollateral(address(weth), redeemAmount);
        
        uint256 remainingCollateral = orynEngine.getCollateralDepositedAmount(USER, address(weth));
        uint256 balanceAfter = weth.balanceOf(USER);
        
        assertEq(remainingCollateral, COLLATERAL_AMOUNT - redeemAmount);
        assertEq(balanceAfter - balanceBefore, redeemAmount);
        
        vm.stopPrank();
    }
    
    function testBurnOrynUSD() public {
        vm.startPrank(USER);
        
        // Deposit collateral and mint OrynUSD
        orynEngine.depositCollateralAndMintOrynUSD(address(weth), COLLATERAL_AMOUNT, MINT_AMOUNT);
        
        uint256 burnAmount = 500 ether;
        
        // Approve OrynEngine to burn tokens
        orynUSD.approve(address(orynEngine), burnAmount);
        
        orynEngine.burnOrynUSD(burnAmount);
        
        uint256 remainingMinted = orynEngine.getOrynUSDMint(USER);
        uint256 balance = orynUSD.balanceOf(USER);
        
        assertEq(remainingMinted, MINT_AMOUNT - burnAmount);
        assertEq(balance, MINT_AMOUNT - burnAmount);
        
        vm.stopPrank();
    }

    function testDepositUniV3Position() public {
        vm.startPrank(USER);

        uint256 tokenId = _mintTestPosition(USER, 2 ether, 5e7); // 2 ETH and 0.5 BTC liquidity

        uint256 initialPositions = orynEngine.getUserPositions(USER).length;
        assertEq(initialPositions, 0);

        orynEngine.depositUniPosition(tokenId);

        uint256[] memory positions = orynEngine.getUserPositions(USER);
        assertEq(positions.length, 1);
        assertEq(positions[0], tokenId);

        uint256 positionValueUSD = orynEngine.getUniPositionValueUSD(tokenId);
        assertGt(positionValueUSD, 0);

        vm.stopPrank();
    }

    function testMintAgainstUniV3Position() public {
        vm.startPrank(USER);

        uint256 tokenId = _mintTestPosition(USER, 3 ether, 1e8); // 3 ETH and 1 BTC liquidity

        orynEngine.depositUniPosition(tokenId);

        uint256 positionValueUSD = orynEngine.getUniPositionValueUSD(tokenId);
        // Borrow 25% of value to remain overcollateralized
        uint256 mintAmount = positionValueUSD / 4;

        orynEngine.mintOrynUSD(mintAmount);

        assertEq(orynUSD.balanceOf(USER), mintAmount);
        assertGt(orynEngine.getHealthFactor(USER), orynEngine.getMinHealthFactor());

        vm.stopPrank();
    }

    function testRedeemUniV3Position() public {
        vm.startPrank(USER);

        uint256 tokenId = _mintTestPosition(USER, 1 ether, 25e7); // 1 ETH and 2.5 BTC

        orynEngine.depositUniPosition(tokenId);

        // No debt minted, should allow redeem
        orynEngine.redeemUniPosition(tokenId);

        assertEq(mockPositionManager.ownerOf(tokenId), USER);
        assertEq(orynEngine.getUserPositions(USER).length, 0);

        vm.stopPrank();
    }

    function testUniV3PositionFullCDPFlow() public {
        vm.startPrank(USER);

        // Mint a position with defined token balances
        uint256 tokenId = _mintTestPosition(USER, 4 ether, 8e7); // 4 ETH and 0.8 BTC liquidity

        (
            ,
            ,
            address token0,
            address token1,
            uint24 fee,
            int24 tickLower,
            int24 tickUpper,
            uint128 liquidity,
            ,
            ,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        ) = mockPositionManager.positions(tokenId);

        assertEq(tokensOwed0, 0);
        assertEq(tokensOwed1, 0);

        // Verify metadata and pool discovery
        assertEq(token0, address(weth));
        assertEq(token1, address(wbtc));
        address poolAddress = mockFactory.getPool(token0, token1, fee);
        assertEq(poolAddress, address(mockPool));

        (uint160 sqrtPriceX96, , , , , , ) = mockPool.slot0();
        uint160 sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(tickLower);
        uint160 sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(tickUpper);

        (uint256 amount0Expected, uint256 amount1Expected) = LiquidityAmounts.getAmountsForLiquidity(
            sqrtPriceX96,
            sqrtRatioAX96,
            sqrtRatioBX96,
            liquidity
        );

        // Deposit position and evaluate collateral value
        orynEngine.depositUniPosition(tokenId);

        uint256 enginePositionValue = orynEngine.getUniPositionValueUSD(tokenId);
        uint256 expectedValue = orynEngine.getUSDValue(token0, amount0Expected) +
            orynEngine.getUSDValue(token1, amount1Expected);

        assertApproxEqRel(enginePositionValue, expectedValue, 1e15); // 0.1% tolerance

        // Mint stablecoin against position
        uint256 mintAmount = enginePositionValue / 4; // 25% LTV to remain healthy
        orynEngine.mintOrynUSD(mintAmount);

        assertEq(orynUSD.balanceOf(USER), mintAmount);
        assertGt(orynEngine.getHealthFactor(USER), orynEngine.getMinHealthFactor());

        // Repay debt and redeem NFT
        orynUSD.approve(address(orynEngine), mintAmount);
        orynEngine.burnOrynUSD(mintAmount);
        orynEngine.redeemUniPosition(tokenId);

        assertEq(mockPositionManager.ownerOf(tokenId), USER);
        assertEq(orynEngine.getUserPositions(USER).length, 0);
        assertEq(orynEngine.getOrynUSDMint(USER), 0);

        vm.stopPrank();
    }

    function testUniV3PositionOutOfRangeValuation() public {
        vm.startPrank(USER);

        uint256 tokenId = _mintTestPosition(USER, 2 ether, 4e7);
        orynEngine.depositUniPosition(tokenId);

        // Move pool price above upper bound so liquidity is entirely in token1
        int24 newTick = TICK_UPPER + 2000;
        uint160 newSqrtPriceX96 = TickMath.getSqrtRatioAtTick(newTick);
        mockPool.setSlot0(newSqrtPriceX96, newTick);

        (
            ,
            ,
            address token0,
            address token1,
            uint24 fee,
            int24 tickLowerLocal,
            int24 tickUpperLocal,
            uint128 liquidity,
            ,
            ,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        ) = mockPositionManager.positions(tokenId);

        assertEq(fee, POOL_FEE);
        assertEq(tickLowerLocal, TICK_LOWER);
        assertEq(tickUpperLocal, TICK_UPPER);
        assertEq(tokensOwed0, 0);
        assertEq(tokensOwed1, 0);
        assertEq(token0, address(weth));
        assertEq(token1, address(wbtc));

        uint160 sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(TICK_LOWER);
        uint160 sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(TICK_UPPER);

        (uint256 amount0Expected, uint256 amount1Expected) = LiquidityAmounts.getAmountsForLiquidity(
            newSqrtPriceX96,
            sqrtRatioAX96,
            sqrtRatioBX96,
            liquidity
        );

        assertEq(amount0Expected, 0);
        uint256 expectedValue = orynEngine.getUSDValue(token1, amount1Expected);
        uint256 engineValue = orynEngine.getUniPositionValueUSD(tokenId);

        assertApproxEqRel(engineValue, expectedValue, 1e15);

        // reset pool state for subsequent tests
        mockPool.setSlot0(TickMath.getSqrtRatioAtTick(0), 0);

        vm.stopPrank();
    }

    function testRedeemUniPositionWithOutstandingDebtReverts() public {
        vm.startPrank(USER);

        uint256 tokenId = _mintTestPosition(USER, 3 ether, 6e7);
        orynEngine.depositUniPosition(tokenId);

        uint256 mintAmount = orynEngine.getUniPositionValueUSD(tokenId) / 3;
        orynEngine.mintOrynUSD(mintAmount);

        vm.expectRevert();
        orynEngine.redeemUniPosition(tokenId);

        vm.stopPrank();
    }

    function testDepositUniPositionWithUnsupportedTokensReverts() public {
        MockERC20 otherToken = new MockERC20("Other Token", "OTH", 18);

        uint160 sqrtPriceX96 = TickMath.getSqrtRatioAtTick(0);
        uint160 sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(TICK_LOWER);
        uint160 sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(TICK_UPPER);
        uint128 liquidity = LiquidityAmounts.getLiquidityForAmounts(
            sqrtPriceX96,
            sqrtRatioAX96,
            sqrtRatioBX96,
            1 ether,
            1 ether
        );

        MockNonfungiblePositionManager.PositionData memory positionData = MockNonfungiblePositionManager.PositionData({
            token0: address(otherToken),
            token1: address(weth),
            fee: POOL_FEE,
            tickLower: TICK_LOWER,
            tickUpper: TICK_UPPER,
            liquidity: liquidity,
            tokensOwed0: 0,
            tokensOwed1: 0
        });

        vm.startPrank(USER);
        uint256 tokenId = mockPositionManager.mintPosition(USER, positionData);

        vm.expectRevert(OrynEngine.OrynEngine__UnsupportedPositionTokens.selector);
        orynEngine.depositUniPosition(tokenId);

        vm.stopPrank();
    }
    
    function testLiquidationSetup() public {
        vm.startPrank(USER);
        
        // User deposits collateral and mints OrynUSD
        orynEngine.depositCollateralAndMintOrynUSD(address(weth), COLLATERAL_AMOUNT, MINT_AMOUNT);
        
        // Check user's initial state
        uint256 initialHealthFactor = orynEngine.getHealthFactor(USER);
        uint256 userDebt = orynEngine.getOrynUSDMint(USER);
        uint256 userCollateral = orynEngine.getCollateralDepositedAmount(USER, address(weth));
        
        console.log("Initial Health Factor:", initialHealthFactor);
        console.log("User Debt:", userDebt);
        console.log("User Collateral:", userCollateral);
        
        assertGt(initialHealthFactor, orynEngine.getMinHealthFactor());
        assertEq(userDebt, MINT_AMOUNT);
        assertEq(userCollateral, COLLATERAL_AMOUNT);
        
        vm.stopPrank();
        
        // Simulate price drop - ETH drops to $100 (10000000000 * 10^(-8))
        mockPyth.setPrice(ETH_USD_PRICE_ID, 10000000000, 1000000, PRICE_EXPO, block.timestamp);
        
        // Now user should be liquidatable
        uint256 healthFactorAfterDrop = orynEngine.getHealthFactor(USER);
        console.log("Health Factor after price drop:", healthFactorAfterDrop);
        
        // Verify user is now liquidatable
        assertLt(healthFactorAfterDrop, orynEngine.getMinHealthFactor());
        
        // Test that price changes are reflected correctly
        uint256 newUSDValue = orynEngine.getUSDValue(address(weth), 1 ether);
        console.log("New ETH USD Value after price drop:", newUSDValue);
        
        // Should be approximately $100 now
        assertApproxEqRel(newUSDValue, 100 ether, 1e15); // 0.1% tolerance
    }

    function testLiquidationExecution() public {
        // Use separate addresses to avoid health factor conflicts
        address poorUser = makeAddr("poorUser");
        address richLiquidator = makeAddr("richLiquidator");
        
        // Give poor user some ETH to start
        weth.mint(poorUser, COLLATERAL_AMOUNT);
        
        vm.startPrank(poorUser);
        weth.approve(address(orynEngine), COLLATERAL_AMOUNT);
        
    // Poor user deposits collateral and mints OrynUSD
    uint256 mintedAmount = 300 ether;
    orynEngine.depositCollateralAndMintOrynUSD(address(weth), COLLATERAL_AMOUNT, mintedAmount);
        vm.stopPrank();
        
        // Simulate catastrophic ETH price drop to $50
        mockPyth.setPrice(ETH_USD_PRICE_ID, 5000000000, 1000000, PRICE_EXPO, block.timestamp);
        
        // Verify user is liquidatable
        uint256 healthFactor = orynEngine.getHealthFactor(poorUser);
        console.log("Poor user health factor:", healthFactor);
        assertLt(healthFactor, orynEngine.getMinHealthFactor());
        
        // Rich liquidator gets OrynUSD from somewhere (mint directly as admin)
        vm.prank(address(orynEngine));
        orynUSD.mint(richLiquidator, 1000 ether);
        
        vm.startPrank(richLiquidator);
        orynUSD.approve(address(orynEngine), type(uint256).max);

    uint256 userDebtBefore = orynEngine.getOrynUSDMint(poorUser);
    uint256 debtToCover = 100 ether;
        uint256 liquidatorCollateralBefore = weth.balanceOf(richLiquidator);
        
        console.log("User debt before liquidation:", userDebtBefore);
        console.log("Liquidator collateral before:", liquidatorCollateralBefore);
        
        // Execute liquidation
        orynEngine.liquidate(address(weth), poorUser, debtToCover);
        
        uint256 liquidatorCollateralAfter = weth.balanceOf(richLiquidator);
        uint256 userDebtAfter = orynEngine.getOrynUSDMint(poorUser);
        
        console.log("User debt after liquidation:", userDebtAfter);
        console.log("Liquidator collateral after:", liquidatorCollateralAfter);
        
        // Verify liquidation worked
        assertEq(userDebtAfter, userDebtBefore - debtToCover);
        assertGt(liquidatorCollateralAfter, liquidatorCollateralBefore);
        
        vm.stopPrank();
    }
    
    function testRevertsOnStalePrice() public {
        // Advance time first to ensure we don't underflow
        vm.warp(500);
        
        // Set a very old timestamp to simulate stale price
        mockPyth.setPrice(ETH_USD_PRICE_ID, ETH_PRICE, 1000000, PRICE_EXPO, block.timestamp - 400);
        
        vm.expectRevert(OrynEngine.OrynEngine__StalePrice.selector);
        orynEngine.getLatestPythPrice(address(weth));
    }
    
    function testRevertsOnZeroPrice() public {
        // Set price to zero
        mockPyth.setPrice(ETH_USD_PRICE_ID, 0, 1000000, PRICE_EXPO, block.timestamp);
        
        vm.expectRevert(OrynEngine.OrynEngine__StalePrice.selector);
        orynEngine.getUSDValue(address(weth), 1 ether);
    }
    
    function testRevertsOnNegativePrice() public {
        // Set negative price
        mockPyth.setPrice(ETH_USD_PRICE_ID, -100000000000, 1000000, PRICE_EXPO, block.timestamp);
        
        vm.expectRevert(OrynEngine.OrynEngine__StalePrice.selector);
        orynEngine.getUSDValue(address(weth), 1 ether);
    }
    
    function testGetPriceFeedId() public {
        bytes32 feedId = orynEngine.getPriceFeedId(address(weth));
        assertEq(feedId, ETH_USD_PRICE_ID);
    }
    
    function testGetPythContract() public {
        address pythAddress = address(orynEngine.getPythContract());
        assertEq(pythAddress, address(mockPyth));
    }
    
    function testPythPriceAgeThreshold() public {
        uint256 threshold = orynEngine.getPythPriceAgeThreshold();
        assertEq(threshold, 60); // 1 minute as set in the contract
    }
    
    function testMultipleCollateralTypes() public {
        vm.startPrank(USER);
        
        // Deposit both ETH and BTC as collateral
        orynEngine.depositCollateral(address(weth), 5 ether);
        orynEngine.depositCollateral(address(wbtc), 1e8); // 1 BTC (8 decimals)
        
        // Check both deposits
        uint256 ethDeposited = orynEngine.getCollateralDepositedAmount(USER, address(weth));
        uint256 btcDeposited = orynEngine.getCollateralDepositedAmount(USER, address(wbtc));
        
        assertEq(ethDeposited, 5 ether);
        assertEq(btcDeposited, 1e8);
        
        // Mint OrynUSD against combined collateral
        orynEngine.mintOrynUSD(MINT_AMOUNT);
        
        uint256 healthFactor = orynEngine.getHealthFactor(USER);
        console.log("Health Factor with multiple collaterals:", healthFactor);
        
        assertGt(healthFactor, orynEngine.getMinHealthFactor());
        
        vm.stopPrank();
    }

    function _mintTestPosition(address recipient, uint256 amount0Desired, uint256 amount1Desired)
        internal
        returns (uint256 tokenId)
    {
        uint160 sqrtPriceX96 = TickMath.getSqrtRatioAtTick(0);
        uint160 sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(TICK_LOWER);
        uint160 sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(TICK_UPPER);

        uint128 liquidity = LiquidityAmounts.getLiquidityForAmounts(
            sqrtPriceX96,
            sqrtRatioAX96,
            sqrtRatioBX96,
            amount0Desired,
            amount1Desired
        );

        MockNonfungiblePositionManager.PositionData memory positionData = MockNonfungiblePositionManager.PositionData({
            token0: address(weth),
            token1: address(wbtc),
            fee: POOL_FEE,
            tickLower: TICK_LOWER,
            tickUpper: TICK_UPPER,
            liquidity: liquidity,
            tokensOwed0: 0,
            tokensOwed1: 0
        });

        tokenId = mockPositionManager.mintPosition(recipient, positionData);
    }
}