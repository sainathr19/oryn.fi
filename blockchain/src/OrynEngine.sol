// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./OrynUSD.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./interfaces/IPyth.sol";
import "./interfaces/PythStructs.sol";
import "./interfaces/IUniPositionManager.sol";
import "./interfaces/IUniswapV3PoolMinimal.sol";
import "./interfaces/IUniswapV3FactoryMinimal.sol";
import "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import "@uniswap/v3-periphery/contracts/libraries/LiquidityAmounts.sol";

/**
 * @title OrynUSDEngine
 * @author Pranav Lakkadi 
 * 
 * The system is designed to be as minimal as possible, and have the tokens maintain a 1 token == $1 peg at all times.
 * a stablecoin with the properties:
 * - Exogenously Collateralized
 * - Dollar Pegged
 * - Algorithmically Stable
 *
 *
 * The OrynUSD system should always be overcollateralised 
 * 
 * @notice This contract is the core of the Decentralized Stablecoin system. It handles all the logic
 * for minting and redeeming OrynUSD, as well as depositing and withdrawing collateral.
 * @notice This contract is based on the MakerDAO DSS system
 */
contract OrynEngine is ReentrancyGuard, IERC721Receiver {

    ///////////////////
    //   Errors  //////
    ///////////////////
    error OrynEngine__NeedsMoreThanZero();
    error OrynEngine__TokenNotAllowed(address token);
    error OrynEngine__TokenAddresslengthandPriceFeedAddresslengthMustBeEqual();
    error OrynEngine__TransferFailed();
    error OrynEngine__BreaksHealthFactor(uint256 healthFactor);
    error OrynEngine__MintFailed();
    error OrynEngine__TokenAddressZero();
    error OrynEngine__HealthFactorOk();
    error OrynEngine__HealthFactorNotImproved();
    error OrynEngine__InValidIndex();
    error OrynEngine__PriceFeedNotFound();
    error OrynEngine__StalePrice();
    error OrynEngine__PositionAlreadyDeposited();
    error OrynEngine__PositionNotOwner();
    error OrynEngine__UnsupportedPositionTokens();
    error OrynEngine__UninitializedPool();

    struct UniPositionInfo {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint128 liquidity;
        uint128 tokensOwed0;
        uint128 tokensOwed1;
    }

    ///////////////////
    // Modifiers  /////
    ///////////////////
    modifier moreThanZero(uint256 amount) {
        if (amount == 0) {
            revert OrynEngine__NeedsMoreThanZero();
        }
        _;
    }

    modifier isAllowedToken(address token) {
        if (s_priceFeeds[token] == bytes32(0)) {
            revert OrynEngine__TokenNotAllowed(token);
        }
        _;
    }

    //////////////////////
    // State Variables ///
    //////////////////////
    uint256 private constant ADDITIONAL_FEED_PRECISION = 1e10;
    uint256 private constant PRECISION = 1e18;
    uint256 private constant LIQUIDATION_TRESHOLD = 50; // 200% overCollateralised
    uint256 private constant LIQUIDATION_PRECISION = 100;
    uint256 private constant MIN_HEALTH_FACTOR = 1e18;
    uint256 private constant LIQUIDATION_BONUS = 10; // 10% Bonus 
    uint256 private constant PYTH_PRICE_AGE_THRESHOLD = 60; // 1 minute in seconds

    IPyth private immutable i_pyth;
    IUniPositionManager private immutable i_positionManager;
    mapping(address token => bytes32 priceFeedId) private s_priceFeeds;
    mapping(address user => mapping(address token => uint256 amount)) private s_CollateralDeposited;
    mapping(address user => uint256 amountOrynUSDMinted) private s_OrynUSDMinted;
    address[] private s_CollateralTokens;
    mapping(uint256 tokenId => address owner) private s_positionOwner;
    mapping(address user => uint256[] tokenIds) private s_userPositions;
    mapping(uint256 tokenId => uint256 index) private s_positionIndex;

    OrynUSD private immutable i_OrynUSD;

    ///////////////////
    //   Events   /////
    ///////////////////

    event CollateralDeposited(address indexed user, address indexed token, uint256 indexed amount);
    event CollateralRedeemed(address indexed RedeemedFrom, address indexed RedeemedTo, address indexed token, uint256 amount);
    event UniPositionDeposited(address indexed user, uint256 indexed tokenId, address indexed token0, address token1, uint256 usdValue);
    event UniPositionRedeemed(address indexed user, uint256 indexed tokenId, uint256 usdValue);

    ///////////////////
    // Functions  /////
    ///////////////////

    constructor (
        address[] memory tokenAddresses,
        bytes32[] memory priceFeedIds,
        address pythAddress,
        address positionManager
    ) {
        if (tokenAddresses.length != priceFeedIds.length) {
            revert OrynEngine__TokenAddresslengthandPriceFeedAddresslengthMustBeEqual(); 
        }
        uint256 length = tokenAddresses.length;
        
        // The price feed ID will be w.r.t USD from Pyth Network
        for (uint i = 0; i < length; ) {
            if (tokenAddresses[i] == address(0) || priceFeedIds[i] == bytes32(0)) {
           revert OrynEngine__TokenAddressZero();
        }
            s_priceFeeds[tokenAddresses[i]] = priceFeedIds[i];
            s_CollateralTokens.push(tokenAddresses[i]);

            unchecked {
                ++i;
            }
        }

          if (pythAddress == address(0) || positionManager == address(0)) {
           revert OrynEngine__TokenAddressZero();
        }

        i_OrynUSD = new OrynUSD();
        i_pyth = IPyth(pythAddress);
          i_positionManager = IUniPositionManager(positionManager);
    }

    ////////////////////////////
    //   External Functions   //
    ////////////////////////////
    
    /**
     * @param tokenCollateralAddress address of ERC20 token 
     * @param amountCollateral amount of token deposited as collateral
     * @param amountOrynUSDtoMint amount of OrynUSD minted 
     * @notice This function will deposit collateral and mint OrynUSD in 1 function 
     */
    function depositCollateralAndMintOrynUSD(address tokenCollateralAddress, uint256 amountCollateral,uint256 amountOrynUSDtoMint) 
    external {
        depositCollateral(tokenCollateralAddress, amountCollateral);
        mintOrynUSD(amountOrynUSDtoMint);
    }

    function depositUniPositionAndMint(uint256 tokenId, uint256 amountOrynUSDtoMint) external {
        depositUniPosition(tokenId);
        mintOrynUSD(amountOrynUSDtoMint);
    }

    /** 
     * @notice follows CEI 
     * @param tokenCollateralAddress - address of the token deposited as collateral
     * @param amountCollateral - amount of collateral as deposit 
     */
    function depositCollateral(address tokenCollateralAddress, uint256 amountCollateral) public 
    moreThanZero(amountCollateral) 
    isAllowedToken(tokenCollateralAddress) 
    nonReentrant
    {
        unchecked {
            s_CollateralDeposited[msg.sender][tokenCollateralAddress] += amountCollateral;
        }

        emit CollateralDeposited(msg.sender, tokenCollateralAddress , amountCollateral);

        bool success = IERC20(tokenCollateralAddress).transferFrom(msg.sender, address(this), amountCollateral);
        if (!success) {
            revert OrynEngine__TransferFailed();
        }
    }

    function depositUniPosition(uint256 tokenId) public nonReentrant {
        if (tokenId == 0) {
            revert OrynEngine__InValidIndex();
        }

        if (s_positionOwner[tokenId] != address(0)) {
            revert OrynEngine__PositionAlreadyDeposited();
        }

        address owner = i_positionManager.ownerOf(tokenId);
        if (owner != msg.sender) {
            revert OrynEngine__PositionNotOwner();
        }

        (UniPositionInfo memory positionInfo) = _getUniPositionInfo(tokenId);
        _validatePositionTokens(positionInfo.token0, positionInfo.token1);

        i_positionManager.safeTransferFrom(msg.sender, address(this), tokenId);

        s_positionOwner[tokenId] = msg.sender;
        s_positionIndex[tokenId] = s_userPositions[msg.sender].length;
        s_userPositions[msg.sender].push(tokenId);

    uint256 usdValue = _getUniPositionValueUSD(positionInfo);

        emit UniPositionDeposited(msg.sender, tokenId, positionInfo.token0, positionInfo.token1, usdValue);
    }


    /**
     * 
     * @param tokenCollateralAddress address of the collateral token
     * @param amountCollateral amount of collateral to redeem
     * @param amountOrynUSDtoBurn amount of OrynUSD to burn 
     * @notice this function burns th OrynUSD token to get back the deposited Collateral 
     */
    function redeemCollateralForOrynUSD(address tokenCollateralAddress,uint256 amountCollateral, uint256 amountOrynUSDtoBurn) 
    external {
        burnOrynUSD(amountOrynUSDtoBurn);
        redeemCollateral(tokenCollateralAddress, amountCollateral);
    }

    
    /**
     * This function is used to redeem collateral as long as user doesnt break the HealthFactor
     * 
     * @param tokenCollateralAddress The ERC20 Address of the token deposited as collateral
     * @param amountCollateral The amount of the collateral user wants to redeem 
     */
    function redeemCollateral(address tokenCollateralAddress, uint256 amountCollateral ) 
    public moreThanZero(amountCollateral) isAllowedToken(tokenCollateralAddress) nonReentrant {
        // in order to Redeem collateral:
        // 1) Health factor must be more than 1, after the collateral has been pulled  
        _redeemCollateral(tokenCollateralAddress, amountCollateral, msg.sender, msg.sender);

        _RevertIfHealthFactorIsBroken(msg.sender);
    }

    function redeemUniPosition(uint256 tokenId) external nonReentrant {
        address owner = s_positionOwner[tokenId];
        if (owner != msg.sender) {
            revert OrynEngine__PositionNotOwner();
        }

    UniPositionInfo memory positionInfo = _getUniPositionInfo(tokenId);
    uint256 positionValue = _getUniPositionValueUSD(positionInfo);

        _removeUserPosition(msg.sender, tokenId);

        i_positionManager.safeTransferFrom(address(this), msg.sender, tokenId);
        delete s_positionOwner[tokenId];
        delete s_positionIndex[tokenId];

        _RevertIfHealthFactorIsBroken(msg.sender);

        emit UniPositionRedeemed(msg.sender, tokenId, positionValue);
    }

    /**
     * @notice follows CEI
     * @param amountOrynUSDtoMint The amount of Decentralised stable coin to mint 
     * @notice They must always have more collateral value than Minimum threshold 
     */
    function mintOrynUSD(uint256 amountOrynUSDtoMint) public moreThanZero(amountOrynUSDtoMint) nonReentrant{
        unchecked {
            s_OrynUSDMinted[msg.sender] += amountOrynUSDtoMint;
        }
        _RevertIfHealthFactorIsBroken(msg.sender);
        bool minted = i_OrynUSD.mint(msg.sender,amountOrynUSDtoMint);
        if (!minted) {
            revert OrynEngine__MintFailed();
        }
    }

    /**
     * This function is to burn the minted token 
     * @param amount The amount OrynUSD to burn 
     */
    function burnOrynUSD(uint256 amount) public moreThanZero(amount) {
        _burnOrynUSD(amount, msg.sender, msg.sender);
        // _RevertIfHealthFactorIsBroken(msg.sender); 
    }

    /** 
     * @param collateral The ERC20 address of the collateral they want to pay off 
     * @param user The address of the user whose debt they want to pay, The health factor should
     *         below the MIN_HEALTH_FACTOR
     * @param debtToCover The amount they are willing to cover so that they improve the user's healtfactor 
     * @notice you can partially cover the users debt and will get a liquidation bonus 
     * @notice The function working assumes the protocol will be roughly 200% overcollateralised 
     *         in order fro this to work 
     * Follows CEI 
     */
    function liquidate(address collateral, address user, uint256 debtToCover) 
    external moreThanZero(debtToCover) isAllowedToken(collateral) nonReentrant {
        // needs to check the health Factor
        if (user == address(0)) {
            revert OrynEngine__TokenAddressZero();
        }

        uint256 startingHealthFactor = _HealthFactor(user);
        if (startingHealthFactor >= MIN_HEALTH_FACTOR ) {
            revert OrynEngine__HealthFactorOk();
        }
        
        uint256 tokenAmountFromDebtcovered = getTokenAmountinUSD(collateral, debtToCover);

        uint256 bonusCollateral = (tokenAmountFromDebtcovered * LIQUIDATION_BONUS) / LIQUIDATION_PRECISION;
        
        uint256 totalCollateralToRedeem = tokenAmountFromDebtcovered + bonusCollateral;

        _redeemCollateral(collateral, totalCollateralToRedeem, user, msg.sender);

        _burnOrynUSD(debtToCover, user, msg.sender);

        uint256 endingHealthFactor = _HealthFactor(user);
        if (endingHealthFactor <= startingHealthFactor) {
            revert OrynEngine__HealthFactorNotImproved();
        }
        _RevertIfHealthFactorIsBroken(msg.sender);
    }

    ////////////////////////////////////////////////
    //   Private and Internal View Functions   /////
    ////////////////////////////////////////////////

    /**
     * 
     * @dev this is a low level function dont call this untill you check the health Factor 
     */
    function _burnOrynUSD(
        uint256 amountOrynUSDToBurn,
        address onBehalfOf,
        address OrynUSDFrom
    ) private {
        s_OrynUSDMinted[onBehalfOf] -= amountOrynUSDToBurn;
        bool success = i_OrynUSD.transferFrom(OrynUSDFrom ,address(this), amountOrynUSDToBurn);
        if (!success) {
            revert OrynEngine__TransferFailed();
        }
        i_OrynUSD.burn(amountOrynUSDToBurn);
    }

    /**
     * @dev this is a low level function dont call this until you check the health Factor 
     */
    function _redeemCollateral(
        address tokenCollateralAddress, 
        uint256 amountCollateral,
        address from, // The guy whose has taken the debt 
        address to) private {
        s_CollateralDeposited[from][tokenCollateralAddress] -= amountCollateral;

        emit CollateralRedeemed(from, to ,tokenCollateralAddress, amountCollateral);

        bool success = IERC20(tokenCollateralAddress).transfer(to, amountCollateral);
        if (!success) {
            revert OrynEngine__TransferFailed();
        }
    }

    /**
     * 
     * @param user The address of the user, to get the account Information 
     * @return totalOrynUSDMinted Returns the total OrynUSD minted by the user
     * @return CollateralValueInUSD Returns the amount collateral deposited in USD
     */
    function _getAccountInformation(address user) 
    private 
    view 
    returns(uint256 totalOrynUSDMinted, uint256 CollateralValueInUSD) {
        totalOrynUSDMinted = s_OrynUSDMinted[user];
        CollateralValueInUSD = _getAccountCollateralValue(user);
    }
    
    /**
     * Returns how close to liquidation a user is 
     * If the user goes below 1 the user can get liquidated 
     * @param user the address whose health factor we want to calculate
     */
    function _HealthFactor(address user) private view returns (uint256) {
        (uint256 totalOrynUSDMinted, uint256 collateralValueinUSD) = _getAccountInformation(user);
        return _calculateHealthFactor(collateralValueinUSD, totalOrynUSDMinted);
    }

    /**
     * This function is to check if an address when redeemed collateral breaks the healthFactor or not
     * 
     * @param user The address whose health factor is being checked 
     */
    function _RevertIfHealthFactorIsBroken(address user) internal view{
        // Check the health factor (To see if enough collateral is there or no)
        // Revert is enough collateral is not there
        uint256 userHealthFactor = _HealthFactor(user);
        if (userHealthFactor < MIN_HEALTH_FACTOR) {
            revert OrynEngine__BreaksHealthFactor(userHealthFactor);
        }

    }

    ////////////////////////////////////////////////
    //   Public and External View Functions   /////
    ////////////////////////////////////////////////

    /**
     * This is to convert the amount of OrynUSD to the value in the collateral token terms in USD
     * 
     * @param token The address of the ERC20 to deposited as collateral
     * @param USDAmountInWei The Amount of OrynUSD tokens 
     */
    function getTokenAmountinUSD(address token, uint256 USDAmountInWei) public view returns(uint256) {
        bytes32 priceFeedId = s_priceFeeds[token];
        PythStructs.Price memory pythPrice;
        
        try i_pyth.getPriceNoOlderThan(priceFeedId, PYTH_PRICE_AGE_THRESHOLD) returns (PythStructs.Price memory priceData) {
            pythPrice = priceData;
        } catch {
            revert OrynEngine__StalePrice();
        }
        
        // Validate price is positive
        if (pythPrice.price <= 0) {
            revert OrynEngine__StalePrice();
        }
        
        // Convert Pyth price to 18 decimals: price * 10^expo -> 18 decimals
        uint256 price = uint256(uint64(pythPrice.price));
        uint256 priceAdjusted;
        
        if (pythPrice.expo >= 0) {
            // If expo is positive, multiply: price * 10^expo * 10^18
            priceAdjusted = price * (10 ** (uint256(int256(pythPrice.expo)) + 18));
        } else {
            // If expo is negative: price * 10^(-|expo|) * 10^18 = price * 10^(18-|expo|)
            uint256 negativeExpo = uint256(-int256(pythPrice.expo));
            if (negativeExpo <= 18) {
                priceAdjusted = price * (10 ** (18 - negativeExpo));
            } else {
                priceAdjusted = price / (10 ** (negativeExpo - 18));
            }
        }
        
        return (USDAmountInWei * PRECISION) / priceAdjusted;
    }

    /**
     * This function gives the value of the collateral deposited in USD 
     * 
     * @param user The address of the user who deposited the collateral
     */
    function _getAccountCollateralValue(address user) public view returns (uint256 totalCollateralValueUSD){
        // loop through each collateral token, get the amount they have deposited and map it 
        // to the price to get the USD value 
        uint256 length = s_CollateralTokens.length;
        for (uint i = 0; i < length; ) {
            address token = s_CollateralTokens[i];
            uint256 amount = s_CollateralDeposited[user][token];
            unchecked {
                totalCollateralValueUSD += getUSDValue(token, amount);
                ++i;
            }
        }

        uint256[] memory positionIds = s_userPositions[user];
        uint256 positionsLength = positionIds.length;
        for (uint256 j = 0; j < positionsLength; ) {
            uint256 tokenId = positionIds[j];
            UniPositionInfo memory positionInfo = _getUniPositionInfo(tokenId);
            totalCollateralValueUSD += _getUniPositionValueUSD(positionInfo);
            unchecked {
                ++j;
            }
        }
    }

    /**
     * This Function is to convert the depoisited token value into USD 
     * 
     * @param token The address of the ERC20 token deposited as collateral
     * @param amount The Quantity of the token deposited as collateral
     */
    function getUSDValue(address token, uint256 amount) public view returns(uint256) {
        bytes32 priceFeedId = s_priceFeeds[token];
        PythStructs.Price memory pythPrice;
        
        try i_pyth.getPriceNoOlderThan(priceFeedId, PYTH_PRICE_AGE_THRESHOLD) returns (PythStructs.Price memory priceData) {
            pythPrice = priceData;
        } catch {
            revert OrynEngine__StalePrice();
        }
        
        // Validate price is positive
        if (pythPrice.price <= 0) {
            revert OrynEngine__StalePrice();
        }
        
        // Convert Pyth price to 18 decimals: price * 10^expo -> 18 decimals
        uint256 price = uint256(uint64(pythPrice.price));
        uint256 priceAdjusted;
        
        if (pythPrice.expo >= 0) {
            // If expo is positive, multiply: price * 10^expo * 10^18
            priceAdjusted = price * (10 ** (uint256(int256(pythPrice.expo)) + 18));
        } else {
            // If expo is negative: price * 10^(-|expo|) * 10^18 = price * 10^(18-|expo|)
            uint256 negativeExpo = uint256(-int256(pythPrice.expo));
            if (negativeExpo <= 18) {
                priceAdjusted = price * (10 ** (18 - negativeExpo));
            } else {
                priceAdjusted = price / (10 ** (negativeExpo - 18));
            }
        }
        
        return (priceAdjusted * amount) / PRECISION;
    } 

    function  getAdditionFeedPrecision() public pure returns (uint256) {
        return ADDITIONAL_FEED_PRECISION;
    }

    function getPrecision() public pure returns (uint256) {
        return PRECISION;
    }

    function getLiquidationThreshold() public pure returns (uint256) {
        return LIQUIDATION_TRESHOLD;
    }

    function getLiquidationPrecision() public pure returns (uint256) {
        return LIQUIDATION_PRECISION;
    }

    function getLiquidationBonus() public pure returns (uint256) {
        return LIQUIDATION_BONUS;
    }

    function getMinHealthFactor() public pure returns (uint256) {
        return MIN_HEALTH_FACTOR;
    }

    function getPriceFeedId(address token) public view returns(bytes32) {
        if (token == address(0)) {
            revert OrynEngine__TokenAddressZero();
        }
        return s_priceFeeds[token];
    }

    function getCollateralDepositedAmount(address user, address token) public view returns(uint256) {
        if (user == address(0) || token == address(0)) {
            revert OrynEngine__TokenAddressZero();
        }
        return s_CollateralDeposited[user][token];
    }

    function getOrynUSDMint(address user) public view returns (uint256) {
        if (user == address(0)) {
            revert OrynEngine__TokenAddressZero();
        }
        return s_OrynUSDMinted[user];
    }

    function getCollateralTokens(uint256 index) public view returns (address) {
        if(s_CollateralTokens.length < index) {
            revert OrynEngine__InValidIndex();
        }
        return s_CollateralTokens[index];
    }

    function getUserPositions(address user) external view returns (uint256[] memory) {
        return s_userPositions[user];
    }

    function getOrynUSDContractAddress() public view returns (OrynUSD) {
        return i_OrynUSD;
    }

    function getHealthFactor(address user) public view returns (uint256) {
        return _HealthFactor(user);
    }

    function getPythContract() public view returns (IPyth) {
        return i_pyth;
    }

    function getPythPriceAgeThreshold() public pure returns (uint256) {
        return PYTH_PRICE_AGE_THRESHOLD;
    }

    function getUniPositionValueUSD(uint256 tokenId) external view returns (uint256) {
    UniPositionInfo memory positionInfo = _getUniPositionInfo(tokenId);
    return _getUniPositionValueUSD(positionInfo);
    }

    /**
     * @notice Get the latest price from Pyth for a given token
     * @param token The token address to get price for
     * @return The latest Pyth price structure
     */
    function getLatestPythPrice(address token) public view returns (PythStructs.Price memory) {
        bytes32 priceFeedId = s_priceFeeds[token];
        if (priceFeedId == bytes32(0)) {
            revert OrynEngine__TokenNotAllowed(token);
        }
        
        try i_pyth.getPriceNoOlderThan(priceFeedId, PYTH_PRICE_AGE_THRESHOLD) returns (PythStructs.Price memory priceData) {
            return priceData;
        } catch {
            revert OrynEngine__StalePrice();
        }
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function getPositionManager() external view returns (IUniPositionManager) {
        return i_positionManager;
    }

    function _validatePositionTokens(address token0, address token1) internal view {
        if (s_priceFeeds[token0] == bytes32(0) || s_priceFeeds[token1] == bytes32(0)) {
            revert OrynEngine__UnsupportedPositionTokens();
        }
    }

    function _getUniPositionInfo(uint256 tokenId) internal view returns (UniPositionInfo memory positionInfo) {
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
        ) = i_positionManager.positions(tokenId);

        positionInfo = UniPositionInfo({
            token0: token0,
            token1: token1,
            fee: fee,
            tickLower: tickLower,
            tickUpper: tickUpper,
            liquidity: liquidity,
            tokensOwed0: tokensOwed0,
            tokensOwed1: tokensOwed1
        });
    }

    function _getUniPositionValueUSD(UniPositionInfo memory positionInfo) internal view returns (uint256) {
        address factory = i_positionManager.factory();
        address poolAddress = IUniswapV3FactoryMinimal(factory).getPool(positionInfo.token0, positionInfo.token1, positionInfo.fee);
        if (poolAddress == address(0)) {
            revert OrynEngine__UninitializedPool();
        }

        (
            uint160 sqrtPriceX96,
            ,
            ,
            ,
            ,
            ,
        ) = IUniswapV3PoolMinimal(poolAddress).slot0();

        uint160 sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(positionInfo.tickLower);
        uint160 sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(positionInfo.tickUpper);

        (uint256 amount0Principal, uint256 amount1Principal) = LiquidityAmounts.getAmountsForLiquidity(
            sqrtPriceX96,
            sqrtRatioAX96,
            sqrtRatioBX96,
            positionInfo.liquidity
        );

        uint256 amount0Total = amount0Principal + uint256(positionInfo.tokensOwed0);
        uint256 amount1Total = amount1Principal + uint256(positionInfo.tokensOwed1);

        uint256 value0 = getUSDValue(positionInfo.token0, amount0Total);
        uint256 value1 = getUSDValue(positionInfo.token1, amount1Total);

        return value0 + value1;
    }

    function _removeUserPosition(address user, uint256 tokenId) internal {
        uint256 index = s_positionIndex[tokenId];
        uint256 lastIndex = s_userPositions[user].length - 1;

        if (index != lastIndex) {
            uint256 lastTokenId = s_userPositions[user][lastIndex];
            s_userPositions[user][index] = lastTokenId;
            s_positionIndex[lastTokenId] = index;
        }

        s_userPositions[user].pop();
    }

    function _calculateHealthFactor(uint256 collateralUSD, uint256 debt) internal pure returns (uint256) {
        if (debt == 0) {
            return type(uint256).max;
        }

        uint256 collateralAdjustedForThreshold = (collateralUSD * LIQUIDATION_TRESHOLD) / LIQUIDATION_PRECISION;
        return (collateralAdjustedForThreshold * PRECISION) / debt;
    }
}