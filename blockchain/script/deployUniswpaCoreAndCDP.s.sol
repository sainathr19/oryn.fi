// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.19;

// import "forge-std/Script.sol";
// import "../src/Tokens.sol";
// import "../src/MockPyth.sol";
// import "../src/CDP.sol";
// import "@uniswap/v3-core/contracts/UniswapV3Factory.sol";
// import "@uniswap/v3-core/contracts/UniswapV3Pool.sol";
// import "@uniswap/v3-periphery/contracts/NonfungiblePositionManager.sol";
// import "@uniswap/v3-periphery/contracts/SwapRouter.sol";

// contract DeployUniswapCoreAndCDP is Script {
//     // Uniswap contracts
//     UniswapV3Factory public factory;
//     NonfungiblePositionManager public positionManager;
//     SwapRouter public swapRouter;
    
//     // Mock tokens
//     MockToken public tokenA;
//     MockToken public tokenB;
//     MockToken public collateralToken;
    
//     // Price feed
//     MockPyth public mockPyth;
    
//     // CDP protocol
//     CDP public cdpProtocol;
    
//     // Pool fee (0.3%)
//     uint24 constant POOL_FEE = 3000;
    
//     function run() external {
//         uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
//         vm.startBroadcast(deployerPrivateKey);
        
//         // Deploy Uniswap V3 Factory
//         factory = new UniswapV3Factory();
        
//         // Deploy Position Manager (needs WETH9 address - use zero for mock)
//         positionManager = new NonfungiblePositionManager(
//             address(factory),
//             address(0) // WETH9 placeholder
//         );
        
//         // Deploy Swap Router
//         swapRouter = new SwapRouter(
//             address(factory),
//             address(0) // WETH9 placeholder
//         );
        
//         // Deploy mock tokens
//         tokenA = new MockToken("Token A", "TKNA", 18, 1000000 * 1e18);
//         tokenB = new MockToken("Token B", "TKNB", 18, 1000000 * 1e18);
//         collateralToken = new MockToken("Collateral", "COLL", 18, 1000000 * 1e18);
        
//         // Deploy MockPyth price feed
//         mockPyth = new MockPyth();
        
//         // Create Uniswap pools
//         address poolAB = factory.createPool(
//             address(tokenA),
//             address(tokenB),
//             POOL_FEE
//         );
        
//         address poolCollateralA = factory.createPool(
//             address(collateralToken),
//             address(tokenA),
//             POOL_FEE
//         );
        
//         // Initialize pools with sqrt price (1:1 ratio)
//         // sqrtPriceX96 = sqrt(price) * 2^96
//         uint160 sqrtPriceX96 = 79228162514264337593543950336; // sqrt(1) * 2^96
        
//         UniswapV3Pool(poolAB).initialize(sqrtPriceX96);
//         UniswapV3Pool(poolCollateralA).initialize(sqrtPriceX96);
        
//         // Set custom price feeds in MockPyth
//         bytes32 tokenAPriceId = keccak256("TOKEN_A_PRICE");
//         bytes32 tokenBPriceId = keccak256("TOKEN_B_PRICE");
//         bytes32 collateralPriceId = keccak256("COLLATERAL_PRICE");
        
//         mockPyth.updatePrice(tokenAPriceId, 1000 * 1e8, 0); // $1000
//         mockPyth.updatePrice(tokenBPriceId, 500 * 1e8, 0);  // $500
//         mockPyth.updatePrice(collateralPriceId, 2000 * 1e8, 0); // $2000
        
//         // Deploy CDP Protocol
//         cdpProtocol = new CDP(
//             address(collateralToken),
//             address(tokenA), // debt token
//             address(mockPyth),
//             collateralPriceId,
//             tokenAPriceId,
//             150, // 150% collateralization ratio
//             10 // 10% liquidation penalty
//         );
        
//         vm.stopBroadcast();
        
//         // Log deployed addresses
//         console.log("UniswapV3Factory:", address(factory));
//         console.log("NonfungiblePositionManager:", address(positionManager));
//         console.log("SwapRouter:", address(swapRouter));
//         console.log("Token A:", address(tokenA));
//         console.log("Token B:", address(tokenB));
//         console.log("Collateral Token:", address(collateralToken));
//         console.log("MockPyth:", address(mockPyth));
//         console.log("CDP Protocol:", address(cdpProtocol));
//         console.log("Pool A-B:", poolAB);
//         console.log("Pool Collateral-A:", poolCollateralA);
//     }
// }