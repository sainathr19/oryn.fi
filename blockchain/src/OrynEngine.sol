// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./OrynUSD.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IPyth.sol";
import "./interfaces/PythStructs.sol";

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
contract OrynEngine is ReentrancyGuard {

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
    uint256 private constant PYTH_PRICE_AGE_THRESHOLD = 300; // 5 minutes in seconds

    IPyth private immutable i_pyth;
    mapping(address token => bytes32 priceFeedId) private s_priceFeeds;
    mapping(address user => mapping(address token => uint256 amount)) private s_CollateralDeposited;
    mapping(address user => uint256 amountOrynUSDMinted) private s_OrynUSDMinted;
    address[] private s_CollateralTokens;

    OrynUSD private immutable i_OrynUSD;

    ///////////////////
    //   Events   /////
    ///////////////////

    event CollateralDeposited(address indexed user, address indexed token, uint256 indexed amount);
    event CollateralRedeemed(address indexed RedeemedFrom, address indexed RedeemedTo, address indexed token, uint256 amount);

    ///////////////////
    // Functions  /////
    ///////////////////

    constructor (
        address[] memory tokenAddresses,
        bytes32[] memory priceFeedIds,
        address pythAddress
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

        if (pythAddress == address(0)) {
           revert OrynEngine__TokenAddressZero();
        }

        i_OrynUSD = new OrynUSD();
        i_pyth = IPyth(pythAddress);
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
        
        // Not sure if the below statement is needed 
        // _RevertIfHealthFactorIsBroken(msg.sender); 
        // The above statement has been removed since it doenst allow the user to partially burn tokens
    }

    // if we do start nearing undercollateralization, we need someone to liquidate positions
    // If someone is almost undercollateralized we will pay u to liquidate them
    // eg if someone intial deposited $100 to get $50OrynUSD
    // the deposit value falls to $75 we will ask them to liquidate it since it reached the threshold
    // the Liquidator takes of $75 and burns $50 OrynUSD 
    /** 
     * @param collateral The ERC20 address of the collateral they want to pay off 
     * @param user The address of the user whose debt they want to pay, The health factor should
     *         below the MIN_HEALTH_FACTOR
     * @param debtToCover The amount they are willing to cover so that they improve the user's healtfactor 
     * @notice you can partially cover the users debt and will get a liquidation bonus 
     * @notice The function working assumes the protocol will be roughly 200% overcollateralised 
     *         in order fro this to work 
     * @notice A known bug would be if the protocol was only 100% collateralized, we wouldn't be able to liquidate anyone.
     * For example, if the price of the collateral plummeted before anyone could be liquidated
     * 
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

        uint256 bonusCollateral = (tokenAmountFromDebtcovered/ LIQUIDATION_BONUS)/LIQUIDATION_PRECISION ;
        
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
        // total OrynUSD minted 
        // total collateral value
        (uint256 totalOrynUSDMinted, uint256 collateralValueinUSD) = _getAccountInformation(user);
        if (totalOrynUSDMinted == 0 ) {
            return 2 * PRECISION;
        }
        uint256 collateralAdjustedThreshold = (collateralValueinUSD/totalOrynUSDMinted)/LIQUIDATION_PRECISION;
        return ((collateralAdjustedThreshold * PRECISION) / totalOrynUSDMinted);
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
        
        // Convert Pyth price to positive uint256 and adjust for decimals
        uint256 price = uint256(uint64(pythPrice.price));
        uint256 priceAdjusted;
        
        if (pythPrice.expo >= 0) {
            priceAdjusted = price * (10 ** uint256(int256(pythPrice.expo)));
        } else {
            priceAdjusted = price * (10 ** (18 + uint256(-int256(pythPrice.expo))));
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
        
        // Convert Pyth price to positive uint256 and adjust for decimals
        uint256 price = uint256(uint64(pythPrice.price));
        uint256 priceAdjusted;
        
        if (pythPrice.expo >= 0) {
            priceAdjusted = price * (10 ** uint256(int256(pythPrice.expo)));
        } else {
            priceAdjusted = price * (10 ** (18 + uint256(-int256(pythPrice.expo))));
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
}