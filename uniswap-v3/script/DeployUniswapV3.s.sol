// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;
pragma abicoder v2;

import "forge-std/Script.sol";
import "v3-core/contracts/UniswapV3Factory.sol";
import "v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "v3-periphery/contracts/SwapRouter.sol";
import "v3-periphery/contracts/NonfungiblePositionManager.sol";
import "v3-periphery/contracts/NonfungibleTokenPositionDescriptor.sol";

contract DeployUniswapV3 is Script {
    // Deployment addresses will be stored here
    address public factory;
    address public swapRouter;
    address public positionManager;
    address public positionDescriptor;
    
    // WETH9 address - you'll need to deploy this first or use existing one
    address public constant WETH9 = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // Mainnet WETH
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying Uniswap V3 contracts...");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        
        // Step 1: Deploy UniswapV3Factory
        factory = deployFactory();
        
        // Step 2: Deploy NonfungibleTokenPositionDescriptor
        positionDescriptor = deployPositionDescriptor();
        
        // Step 3: Deploy NonfungiblePositionManager
        positionManager = deployPositionManager();
        
        // Step 4: Deploy SwapRouter
        swapRouter = deploySwapRouter();
        
        console.log("=== Deployment Complete ===");
        console.log("UniswapV3Factory:", factory);
        console.log("SwapRouter:", swapRouter);
        console.log("NonfungiblePositionManager:", positionManager);
        console.log("NonfungibleTokenPositionDescriptor:", positionDescriptor);
        
        vm.stopBroadcast();
    }
    
    function deployFactory() internal returns (address) {
        console.log("Deploying UniswapV3Factory...");
        UniswapV3Factory factoryContract = new UniswapV3Factory();
        console.log("UniswapV3Factory deployed at:", address(factoryContract));
        return address(factoryContract);
    }
    
    function deployPositionDescriptor() internal returns (address) {
        console.log("Deploying NonfungibleTokenPositionDescriptor...");
        // Note: This requires additional parameters for mainnet deployment
        // For testnet, you can use simpler parameters
        NonfungibleTokenPositionDescriptor descriptor = new NonfungibleTokenPositionDescriptor(
            WETH9,
            // nativeCurrencyLabelBytes
            0x4554480000000000000000000000000000000000000000000000000000000000
        );
        console.log("NonfungibleTokenPositionDescriptor deployed at:", address(descriptor));
        return address(descriptor);
    }
    
    function deployPositionManager() internal returns (address) {
        console.log("Deploying NonfungiblePositionManager...");
        NonfungiblePositionManager manager = new NonfungiblePositionManager(
            factory,
            WETH9,
            positionDescriptor
        );
        console.log("NonfungiblePositionManager deployed at:", address(manager));
        return address(manager);
    }
    
    function deploySwapRouter() internal returns (address) {
        console.log("Deploying SwapRouter...");
        SwapRouter router = new SwapRouter(factory, WETH9);
        console.log("SwapRouter deployed at:", address(router));
        return address(router);
    }
    
    // Optional: Create a pool after deployment
    function createPool(
        address token0,
        address token1,
        uint24 fee,
        uint160 sqrtPriceX96
    ) external returns (address pool) {
        require(factory != address(0), "Factory not deployed");
        
        pool = UniswapV3Factory(factory).createPool(token0, token1, fee);
        console.log("Pool created:", pool);
        
        // Initialize the pool with a price
        IUniswapV3Pool(pool).initialize(sqrtPriceX96);
        console.log("Pool initialized with price");
        
        return pool;
    }
}

