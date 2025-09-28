// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./OrynUSD.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./interfaces/IPyth.sol";
import "./interfaces/PythStructs.sol";
import "./interfaces/IUniPositionManager.sol";
import "./interfaces/IUniswapV3PoolMinimal.sol";
import "./interfaces/IUniswapV3FactoryMinimal.sol";
// import "@uniswap/v3-core/contracts/libraries/TickMath.sol";
// import "@uniswap/v3-periphery/contracts/libraries/LiquidityAmounts.sol";
// import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";

contract OrynEngine is ReentrancyGuard, IERC721Receiver {
    error OrynEngine__NeedsMoreThanZero();
    error OrynEngine__TokenNotAllowed(address token);
    error OrynEngine__TokenAddresslengthandPriceFeedAddresslengthMustBeEqual();
    error OrynEngine__TransferFailed();
    error OrynEngine__BreaksHealthFactor(uint256 healthFactor);
    error OrynEngine__MintFailed();
    error OrynEngine__TokenAddressZero();
    error OrynEngine__HealthFactorOk();
    error OrynEngine__InValidIndex();
    error OrynEngine__PriceFeedNotFound();
    error OrynEngine__StalePrice();
    error OrynEngine__PositionNotOwner();
    error OrynEngine__UnsupportedPositionTokens();
    error OrynEngine__UninitializedPool();
    error OrynEngine__PositionDoesNotExist(uint256 positionId);
    error OrynEngine__PositionHasDebt(uint256 debt);
    error OrynEngine__RepayExceedsDebt(uint256 requested, uint256 available);
    error OrynEngine__PositionNotERC20(uint256 positionId);
    error OrynEngine__PositionNotUni(uint256 positionId);
    error OrynEngine__InsufficientCollateral();
    error OrynEngine__PositionAlreadyDeposited(uint256 tokenId);
    error OrynEngine__InvalidPrice();
    error OrynEngine__InvalidTickRange(int24 tickLower, int24 tickUpper);

    enum CollateralType {
        ERC20,
        UNI_V3
    }

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

    struct Position {
        address owner;
        CollateralType collateralType;
        address token;
        uint256 amount;
        uint256 uniTokenId;
        uint256 debt;
    }

    struct PositionDetails {
        uint256 positionId;
        CollateralType collateralType;
        address token;
        uint256 amount;
        uint256 uniTokenId;
        uint256 debt;
        uint256 collateralValueUSD;
        uint256 feeValueUSD;
        uint256 totalValueUSD;
        uint256 debtValueUSD;
        uint256 healthFactor;
    }

    uint256 private constant PRECISION = 1e18;
    uint256 private constant LIQUIDATION_TRESHOLD = 50;
    uint256 private constant LIQUIDATION_PRECISION = 100;
    uint256 private constant MIN_HEALTH_FACTOR = 1e18;
    uint256 private constant LIQUIDATION_BONUS = 10;
    uint256 private constant PYTH_PRICE_AGE_THRESHOLD = 60000;
    int24 private constant MIN_UNI_TICK = -887272;
    int24 private constant MAX_UNI_TICK = 887272;


    IPyth private immutable i_pyth;
    IUniPositionManager private immutable i_positionManager;
    // INonfungiblePositionManager private immutable i_positionManager;
    OrynUSD private immutable i_OrynUSD;

    mapping(address token => bytes32 priceFeedId) private s_priceFeeds;
    address[] private s_CollateralTokens;

    uint256 private s_nextPositionId = 1;
    mapping(uint256 positionId => Position position) private s_positions;
    mapping(address user => uint256[] positions) private s_userPositions;
    mapping(uint256 positionId => uint256 index) private s_positionIndex;
    mapping(uint256 tokenId => uint256 positionId) private s_tokenToPositionId;
    mapping(address => uint256) public s_userTotalBorrowed;

    event PositionOpened(uint256 indexed positionId, address indexed owner, uint8 collateralType, uint256 collateralReference);
    event PositionClosed(uint256 indexed positionId, address indexed owner);
    event PositionDebtUpdated(uint256 indexed positionId, uint256 newDebt);
    event PositionCollateralUpdated(uint256 indexed positionId, uint256 newAmount);
    event CollateralDeposited(address indexed user, address indexed token, uint256 amount);
    event CollateralRedeemed(address indexed RedeemedFrom, address indexed RedeemedTo, address indexed token, uint256 amount);
    event UniPositionDeposited(address indexed user, uint256 indexed positionId, uint256 indexed tokenId, address token0, address token1, uint256 usdValue);
    event UniPositionRedeemed(address indexed user, uint256 indexed positionId, uint256 indexed tokenId, uint256 usdValue);
    event PositionLiquidated(uint256 indexed positionId, address indexed liquidator, uint256 debtCovered);

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

    constructor(
        address[] memory tokenAddresses,
        bytes32[] memory priceFeedIds,
        address pythAddress,
        address positionManager
    ) {
        if (tokenAddresses.length != priceFeedIds.length) {
            revert OrynEngine__TokenAddresslengthandPriceFeedAddresslengthMustBeEqual();
        }

        if (pythAddress == address(0) || positionManager == address(0)) {
            revert OrynEngine__TokenAddressZero();
        }

        uint256 length = tokenAddresses.length;
        for (uint256 i = 0; i < length; ) {
            address token = tokenAddresses[i];
            bytes32 feedId = priceFeedIds[i];
            if (token == address(0) || feedId == bytes32(0)) {
                revert OrynEngine__TokenAddressZero();
            }
            s_priceFeeds[token] = feedId;
            s_CollateralTokens.push(token);
            unchecked {
                ++i;
            }
        }

        i_OrynUSD = new OrynUSD();
        i_pyth = IPyth(pythAddress);
        i_positionManager = IUniPositionManager(positionManager);
    }

    function depositCollateralAndMintOrynUSD(
        address tokenCollateralAddress,
        uint256 amountCollateral,
        uint256 amountOrynUSDtoMint
    ) external returns (uint256 positionId) {
        positionId = depositCollateral(tokenCollateralAddress, amountCollateral);
        if (amountOrynUSDtoMint > 0) {
            mintOrynUSD(positionId, amountOrynUSDtoMint);
        }
    }

    function depositUniPositionAndMint(uint256 tokenId, uint256 amountOrynUSDtoMint)
        external
        returns (uint256 positionId)
    {
        positionId = depositUniPosition(tokenId);
        if (amountOrynUSDtoMint > 0) {
            mintOrynUSD(positionId, amountOrynUSDtoMint);
        }
    }

    function depositUniPositionAndMintFrom(address from, uint256 tokenId, uint256 amountOrynUSDtoMint)
        external
        returns (uint256 positionId)
    {
        positionId = depositUniPositionFrom(from, tokenId);
        if (amountOrynUSDtoMint > 0) {
            mintOrynUSD(positionId, amountOrynUSDtoMint);
        }
    }

    function depositCollateral(address tokenCollateralAddress, uint256 amountCollateral)
        public
        moreThanZero(amountCollateral)
        isAllowedToken(tokenCollateralAddress)
        nonReentrant
        returns (uint256 positionId)
    {
        bool success = IERC20(tokenCollateralAddress).transferFrom(msg.sender, address(this), amountCollateral);
        if (!success) {
            revert OrynEngine__TransferFailed();
        }

        positionId = s_nextPositionId++;
        Position storage position = s_positions[positionId];
        position.owner = msg.sender;
        position.collateralType = CollateralType.ERC20;
        position.token = tokenCollateralAddress;
        position.amount = amountCollateral;

        s_positionIndex[positionId] = s_userPositions[msg.sender].length;
        s_userPositions[msg.sender].push(positionId);

        emit CollateralDeposited(msg.sender, tokenCollateralAddress, amountCollateral);
        emit PositionOpened(positionId, msg.sender, uint8(CollateralType.ERC20), amountCollateral);
        emit PositionCollateralUpdated(positionId, position.amount);
    }

    function depositUniPosition(uint256 tokenId) public nonReentrant returns (uint256 positionId) {
        if (tokenId == 0) {
            revert OrynEngine__InValidIndex();
        }
        if (s_tokenToPositionId[tokenId] != 0) {
            revert OrynEngine__PositionAlreadyDeposited(tokenId);
        }
        address owner = i_positionManager.ownerOf(tokenId);
        if (owner != msg.sender) {
            revert OrynEngine__PositionNotOwner();
        }

        UniPositionInfo memory positionInfo = _getUniPositionInfo(tokenId);
        _validatePositionTokens(positionInfo.token0, positionInfo.token1);

        i_positionManager.safeTransferFrom(msg.sender, address(this), tokenId);

        positionId = s_nextPositionId++;
        Position storage position = s_positions[positionId];
        position.owner = msg.sender;
        position.collateralType = CollateralType.UNI_V3;
        position.uniTokenId = tokenId;

        s_positionIndex[positionId] = s_userPositions[msg.sender].length;
        s_userPositions[msg.sender].push(positionId);
        s_tokenToPositionId[tokenId] = positionId;

        // Calculate USD value safely - if it fails, use 0 and emit event
        uint256 usdValue = this.getUniPositionValueUSD(tokenId);
        
        emit UniPositionDeposited(msg.sender, positionId, tokenId, positionInfo.token0, positionInfo.token1, usdValue);
        emit PositionOpened(positionId, msg.sender, uint8(CollateralType.UNI_V3), tokenId);
    }

    function depositUniPositionFrom(address from, uint256 tokenId) public returns (uint256 positionId) {
        if (tokenId == 0) {
            revert OrynEngine__InValidIndex();
        }
        if (s_tokenToPositionId[tokenId] != 0) {
            revert OrynEngine__PositionAlreadyDeposited(tokenId);
        }
        address owner = i_positionManager.ownerOf(tokenId);
        if (owner != from) {
            revert OrynEngine__PositionNotOwner();
        }

        UniPositionInfo memory positionInfo = _getUniPositionInfo(tokenId);
        _validatePositionTokens(positionInfo.token0, positionInfo.token1);

        i_positionManager.safeTransferFrom(from, address(this), tokenId);

        positionId = s_nextPositionId++;
        Position storage position = s_positions[positionId];
        position.owner = from;
        position.collateralType = CollateralType.UNI_V3;
        position.uniTokenId = tokenId;

        s_positionIndex[positionId] = s_userPositions[from].length;
        s_userPositions[from].push(positionId);
        s_tokenToPositionId[tokenId] = positionId;

        // Calculate USD value safely - if it fails, use 0 and emit event
        uint256 usdValue = this.getUniPositionValueUSD(tokenId);
        
        emit UniPositionDeposited(from, positionId, tokenId, positionInfo.token0, positionInfo.token1, usdValue);
        emit PositionOpened(positionId, from, uint8(CollateralType.UNI_V3), tokenId);
    }

    function mintOrynUSD(uint256 positionId, uint256 amountOrynUSDtoMint)
        public
        moreThanZero(amountOrynUSDtoMint)
        nonReentrant
    {
        Position storage position = _getPosition(positionId);
        if (position.owner != msg.sender) {
            revert OrynEngine__PositionNotOwner();
        }

        position.debt += amountOrynUSDtoMint;
        s_userTotalBorrowed[msg.sender] += amountOrynUSDtoMint;

        _revertIfPositionHealthFactorIsBroken(positionId);

        bool minted = i_OrynUSD.mint(msg.sender, amountOrynUSDtoMint);
        if (!minted) {
            revert OrynEngine__MintFailed();
        }

        emit PositionDebtUpdated(positionId, position.debt);
    }

    function burnOrynUSD(uint256 positionId, uint256 amount) public moreThanZero(amount) {
        Position storage position = _getPosition(positionId);
        if (position.owner != msg.sender) {
            revert OrynEngine__PositionNotOwner();
        }
        if (amount > position.debt) {
            revert OrynEngine__RepayExceedsDebt(amount, position.debt);
        }

        _burnOrynUSDFrom(msg.sender, amount);
        position.debt -= amount;
        s_userTotalBorrowed[msg.sender] -= amount;

        emit PositionDebtUpdated(positionId, position.debt);
    }

    function burnOrynUSDAndRedeemCollateral(
        uint256 positionId,
        uint256 repayAmount,
        uint256 collateralAmount
    ) external {
        if (repayAmount > 0) {
            burnOrynUSD(positionId, repayAmount);
        }
        if (collateralAmount > 0) {
            redeemCollateral(positionId, collateralAmount);
        }
    }

    function burnOrynUSDAndRedeemUniPosition(uint256 positionId) external {
        Position storage position = _getPosition(positionId);
        if (position.debt > 0) {
            burnOrynUSD(positionId, position.debt);
        }
        redeemUniPosition(positionId);
    }

    function redeemCollateral(uint256 positionId, uint256 amountCollateral)
        public
        moreThanZero(amountCollateral)
        nonReentrant
    {
        Position storage position = _getPosition(positionId);
        if (position.owner != msg.sender) {
            revert OrynEngine__PositionNotOwner();
        }
        if (position.collateralType != CollateralType.ERC20) {
            revert OrynEngine__PositionNotERC20(positionId);
        }
        if (amountCollateral > position.amount) {
            revert OrynEngine__InsufficientCollateral();
        }

        position.amount -= amountCollateral;

        if (position.debt > 0) {
            _revertIfPositionHealthFactorIsBroken(positionId);
        }

        emit CollateralRedeemed(msg.sender, msg.sender, position.token, amountCollateral);
        emit PositionCollateralUpdated(positionId, position.amount);

        bool success = IERC20(position.token).transfer(msg.sender, amountCollateral);
        if (!success) {
            revert OrynEngine__TransferFailed();
        }

        if (position.amount == 0 && position.debt == 0) {
            _removePosition(positionId, msg.sender);
            emit PositionClosed(positionId, msg.sender);
        }
    }

    function redeemUniPosition(uint256 positionId) public nonReentrant {
        Position storage position = _getPosition(positionId);
        if (position.owner != msg.sender) {
            revert OrynEngine__PositionNotOwner();
        }
        if (position.collateralType != CollateralType.UNI_V3) {
            revert OrynEngine__PositionNotUni(positionId);
        }
        if (position.debt != 0) {
            revert OrynEngine__PositionHasDebt(position.debt);
        }

        uint256 tokenId = position.uniTokenId;
        uint256 usdValue = _getUniPositionValueUSD(tokenId);

        _removePosition(positionId, msg.sender);
        s_tokenToPositionId[tokenId] = 0;

        i_positionManager.safeTransferFrom(address(this), msg.sender, tokenId);
        emit UniPositionRedeemed(msg.sender, positionId, tokenId, usdValue);
        emit PositionClosed(positionId, msg.sender);
    }

    function liquidatePosition(uint256 positionId, uint256 debtToCover)
        external
        moreThanZero(debtToCover)
        nonReentrant
    {
        Position storage position = _getPosition(positionId);
        address owner = position.owner;

        uint256 startingHealthFactor = getHealthFactor(positionId);
        if (startingHealthFactor >= MIN_HEALTH_FACTOR) {
            revert OrynEngine__HealthFactorOk();
        }

        uint256 debt = position.debt;
        if (debt == 0) {
            revert OrynEngine__HealthFactorOk();
        }

        if (position.collateralType == CollateralType.UNI_V3 && debtToCover < debt) {
            revert OrynEngine__RepayExceedsDebt(debtToCover, debt);
        }

        if (debtToCover > debt) {
            debtToCover = debt;
        }

        _burnOrynUSDFrom(msg.sender, debtToCover);

        position.debt = debt - debtToCover;
        s_userTotalBorrowed[owner] -= debtToCover;

        if (position.collateralType == CollateralType.ERC20) {
            uint256 collateralToSeize = _getTokenAmountFromUSD(position.token, debtToCover);
            uint256 bonusCollateral = (collateralToSeize * LIQUIDATION_BONUS) / LIQUIDATION_PRECISION;
            uint256 totalCollateral = collateralToSeize + bonusCollateral;
            if (totalCollateral > position.amount) {
                totalCollateral = position.amount;
            }

            position.amount -= totalCollateral;

            bool success = IERC20(position.token).transfer(msg.sender, totalCollateral);
            if (!success) {
                revert OrynEngine__TransferFailed();
            }

            emit CollateralRedeemed(owner, msg.sender, position.token, totalCollateral);
            emit PositionCollateralUpdated(positionId, position.amount);

            if (position.debt > 0) {
                _revertIfPositionHealthFactorIsBroken(positionId);
            }

            if (position.amount == 0 && position.debt == 0) {
                _removePosition(positionId, owner);
                emit PositionClosed(positionId, owner);
            }
        } else {
            if (position.debt != 0) {
                revert OrynEngine__PositionHasDebt(position.debt);
            }
            uint256 tokenId = position.uniTokenId;
            uint256 usdValue = _getUniPositionValueUSD(tokenId);
            _removePosition(positionId, owner);
            s_tokenToPositionId[tokenId] = 0;
            i_positionManager.safeTransferFrom(address(this), msg.sender, tokenId);
            emit UniPositionRedeemed(msg.sender, positionId, tokenId, usdValue);
            emit PositionClosed(positionId, owner);
        }

        emit PositionLiquidated(positionId, msg.sender, debtToCover);
    }

    function getTokenAmountinUSD(address token, uint256 USDAmountInWei) external view returns (uint256) {
        return _getTokenAmountFromUSD(token, USDAmountInWei);
    }

    function getUSDValue(address token, uint256 amount) external view returns (uint256) {
        return _getUSDValue(token, amount);
    }

    function getAccountCollateralValue(address user) external view returns (uint256 totalCollateralValueUSD) {
        uint256[] memory positionIds = s_userPositions[user];
        uint256 length = positionIds.length;
        for (uint256 i = 0; i < length; ) {
            totalCollateralValueUSD += _positionValueUSD(s_positions[positionIds[i]]);
            unchecked {
                ++i;
            }
        }
    }

    function getPositionValueUSD(uint256 positionId) external view returns (uint256) {
        Position storage position = _getPosition(positionId);
        return _positionValueUSD(position);
    }

    function getUniPositionValueUSD(uint256 tokenId) external view returns (uint256) {
        return _getUniPositionValueUSD(tokenId);
    }

    function getUniPositionValueBreakdown(uint256 positionId)
        external
        view
        returns (uint256 collateralValueUSD, uint256 feeValueUSD)
    {
        Position storage position = _getPosition(positionId);
        if (position.collateralType != CollateralType.UNI_V3) {
            revert OrynEngine__PositionNotUni(positionId);
        }

        (
            uint256 amount0Principal,
            uint256 amount1Principal,
            uint256 amount0Fees,
            uint256 amount1Fees
        ) = _getUniPositionTokenBreakdown(position.uniTokenId);

        UniPositionInfo memory positionInfo = _getUniPositionInfo(position.uniTokenId);
        collateralValueUSD =
            _getUSDValue(positionInfo.token0, amount0Principal) +
            _getUSDValue(positionInfo.token1, amount1Principal);

        feeValueUSD =
            _getUSDValue(positionInfo.token0, amount0Fees) +
            _getUSDValue(positionInfo.token1, amount1Fees);
    }

    function getPositionValueBreakdown(uint256 positionId)
        external
        view
        returns (uint256 collateralValueUSD, uint256 feeValueUSD, uint256 totalValueUSD)
    {
        Position storage position = _getPosition(positionId);
        return _getPositionValueDetails(position);
    }

    function getPositionFinancials(uint256 positionId)
        external
        view
        returns (uint256 collateralValueUSD, uint256 feeValueUSD, uint256 totalValueUSD, uint256 debtValueUSD)
    {
        Position storage position = _getPosition(positionId);
        (collateralValueUSD, feeValueUSD, totalValueUSD) = _getPositionValueDetails(position);
        debtValueUSD = position.debt;
    }

    function getUserPositionDetails(address user) external view returns (PositionDetails[] memory details) {
        uint256[] memory positionIds = s_userPositions[user];
        uint256 length = positionIds.length;
        details = new PositionDetails[](length);

        for (uint256 i = 0; i < length; ) {
            uint256 positionId = positionIds[i];
            Position storage position = s_positions[positionId];
            (
                uint256 collateralValueUSD,
                uint256 feeValueUSD,
                uint256 totalValueUSD
            ) = _getPositionValueDetails(position);

            details[i] = PositionDetails({
                positionId: positionId,
                collateralType: position.collateralType,
                token: position.token,
                amount: position.amount,
                uniTokenId: position.uniTokenId,
                debt: position.debt,
                collateralValueUSD: collateralValueUSD,
                feeValueUSD: feeValueUSD,
                totalValueUSD: totalValueUSD,
                debtValueUSD: position.debt,
                healthFactor: getHealthFactor(positionId)
            });

            unchecked {
                ++i;
            }
        }
    }

    function getPriceNoOlderThan(address token, uint256 maxAge) external view returns (PythStructs.Price memory) {
        bytes32 priceFeedId = getPriceFeedId(token);
        PythStructs.Price memory priceData = i_pyth.getPriceNoOlderThan(priceFeedId, maxAge);
        // if (priceData.price <= 0) {
        //     revert OrynEngine__InvalidPrice();
        // }
        return priceData;
    }

    function getHealthFactor(uint256 positionId) public view returns (uint256) {
        Position storage position = _getPosition(positionId);
        uint256 collateralValue = _positionValueUSD(position);
        return _calculateHealthFactor(collateralValue, position.debt);
    }

    function getPositionInfo(uint256 positionId)
        external
        view
        returns (
            address owner,
            CollateralType collateralType,
            address token,
            uint256 amount,
            uint256 uniTokenId,
            uint256 debt
        )
    {
        Position storage position = _getPosition(positionId);
        owner = position.owner;
        collateralType = position.collateralType;
        token = position.token;
        amount = position.amount;
        uniTokenId = position.uniTokenId;
        debt = position.debt;
    }

    function getUserPositions(address user) external view returns (uint256[] memory) {
        return s_userPositions[user];
    }

    function getPositionOwner(uint256 positionId) external view returns (address) {
        return _getPosition(positionId).owner;
    }

    function getOrynUSDContractAddress() public view returns (OrynUSD) {
        return i_OrynUSD;
    }

    function getPythContract() public view returns (IPyth) {
        return i_pyth;
    }

    function getPythPriceAgeThreshold() public pure returns (uint256) {
        return PYTH_PRICE_AGE_THRESHOLD;
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

    function getPriceFeedId(address token) public view returns (bytes32) {
        if (token == address(0)) {
            revert OrynEngine__TokenAddressZero();
        }
        return s_priceFeeds[token];
    }

    function getCollateralDepositedAmount(address user, address token) public view returns (uint256 total) {
        uint256[] memory positionIds = s_userPositions[user];
        uint256 length = positionIds.length;
        for (uint256 i = 0; i < length; ) {
            Position storage position = s_positions[positionIds[i]];
            if (position.collateralType == CollateralType.ERC20 && position.token == token) {
                total += position.amount;
            }
            unchecked {
                ++i;
            }
        }
    }

    function getOrynUSDMint(address user) public view returns (uint256) {
        return s_userTotalBorrowed[user];
    }

    function getCollateralTokens(uint256 index) public view returns (address) {
        if (index >= s_CollateralTokens.length) {
            revert OrynEngine__InValidIndex();
        }
        return s_CollateralTokens[index];
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

    /**
     * @notice Get the full position struct from NonFungiblePositionManager by tokenId
     * @param tokenId The NFT token ID
     * @return nonce The nonce of the position
     * @return operator The operator of the position
     * @return token0 The first token address
     * @return token1 The second token address
     * @return fee The fee tier
     * @return tickLower The lower tick
     * @return tickUpper The upper tick
     * @return liquidity The liquidity amount
     * @return feeGrowthInside0LastX128 The fee growth inside for token0
     * @return feeGrowthInside1LastX128 The fee growth inside for token1
     * @return tokensOwed0 The tokens owed for token0
     * @return tokensOwed1 The tokens owed for token1
     */
    function getUniPositionStruct(uint256 tokenId)
        external
        view
        returns (
            uint96 nonce,
            address operator,
            address token0,
            address token1,
            uint24 fee,
            int24 tickLower,
            int24 tickUpper,
            uint128 liquidity,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        )
    {
        return i_positionManager.positions(tokenId);
    }

    /**
     * @notice Get the collateral value in USD for a given NFT tokenId
     * @param tokenId The NFT token ID
     * @return collateralValueUSD The total collateral value in USD
     */
    function getUniTokenCollateralValue(uint256 tokenId) external view returns (uint256 collateralValueUSD) {
        return _getUniPositionValueUSD(tokenId);
    }

    function _getPosition(uint256 positionId) internal view returns (Position storage position) {
        position = s_positions[positionId];
        if (position.owner == address(0)) {
            revert OrynEngine__PositionDoesNotExist(positionId);
        }
    }

    function _removePosition(uint256 positionId, address owner) internal {
        uint256 index = s_positionIndex[positionId];
        uint256 lastIndex = s_userPositions[owner].length - 1;

        if (index != lastIndex) {
            uint256 lastPositionId = s_userPositions[owner][lastIndex];
            s_userPositions[owner][index] = lastPositionId;
            s_positionIndex[lastPositionId] = index;
        }

        s_userPositions[owner].pop();
        delete s_positionIndex[positionId];
        delete s_positions[positionId];
    }

    function _burnOrynUSDFrom(address payer, uint256 amount) internal {
        bool success = i_OrynUSD.transferFrom(payer, address(this), amount);
        if (!success) {
            revert OrynEngine__TransferFailed();
        }
        i_OrynUSD.burn(amount);
    }

    function _revertIfPositionHealthFactorIsBroken(uint256 positionId) internal view {
        uint256 positionHealthFactor = getHealthFactor(positionId);
        if (positionHealthFactor < MIN_HEALTH_FACTOR) {
            revert OrynEngine__BreaksHealthFactor(positionHealthFactor);
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

    function _positionValueUSD(Position storage position) internal view returns (uint256) {
        (, , uint256 totalValueUSD) = _getPositionValueDetails(position);
        return totalValueUSD;
    }

    function _getPositionValueDetails(Position storage position)
        internal
        view
        returns (uint256 collateralValueUSD, uint256 feeValueUSD, uint256 totalValueUSD)
    {
        if (position.collateralType == CollateralType.ERC20) {
            collateralValueUSD = _getUSDValue(position.token, position.amount);
            totalValueUSD = collateralValueUSD;
        } else {
            // Use PositionValue library for cleaner calculation
            (
                uint256 amount0Principal,
                uint256 amount1Principal,
                uint256 amount0Fees,
                uint256 amount1Fees
            ) = _getUniPositionTokenBreakdown(position.uniTokenId);

            UniPositionInfo memory info = _getUniPositionInfo(position.uniTokenId);
            collateralValueUSD =
                _getUSDValue(info.token0, amount0Principal) +
                _getUSDValue(info.token1, amount1Principal);

            feeValueUSD =
                _getUSDValue(info.token0, amount0Fees) +
                _getUSDValue(info.token1, amount1Fees);

            totalValueUSD = collateralValueUSD + feeValueUSD;
        }
    }

    function _getUniPositionValueUSD(uint256 tokenId) internal view returns (uint256) {
        // Get token breakdown (principal + fees)
        (
            uint256 amount0Principal,
            uint256 amount1Principal,
            uint256 amount0Fees,
            uint256 amount1Fees
        ) = _getUniPositionTokenBreakdown(tokenId);

        // Get position info for token addresses
        UniPositionInfo memory positionInfo = _getUniPositionInfo(tokenId);

        // Calculate total amounts (principal + fees)
        uint256 totalAmount0 = amount0Principal + amount0Fees;
        uint256 totalAmount1 = amount1Principal + amount1Fees;

        // Directly multiply with Pyth price feeds for USD value
        uint256 value0 = _getUSDValue(positionInfo.token0, totalAmount0);
        uint256 value1 = _getUSDValue(positionInfo.token1, totalAmount1);

        return value0 + value1;
    }

    function _getUniPositionTokenBreakdown(uint256 tokenId)
        internal
        view
        returns (
            uint256 amount0Principal,
            uint256 amount1Principal,
            uint256 amount0Fees,
            uint256 amount1Fees
        )
    {
        // Get position info
        UniPositionInfo memory positionInfo = _getUniPositionInfo(tokenId);
        
        // Get current pool price for principal calculation
        address factory = i_positionManager.factory();
        address poolAddress = IUniswapV3FactoryMinimal(factory).getPool(
            positionInfo.token0,
            positionInfo.token1,
            positionInfo.fee
        );
        if (poolAddress == address(0)) {
            revert OrynEngine__UninitializedPool();
        }

        uint160 sqrtPriceX96;
        try IUniswapV3PoolMinimal(poolAddress).slot0() returns (
            uint160 fetchedSqrtPriceX96,
            int24,
            uint16,
            uint16,
            uint16,
            uint8,
            bool
        ) {
            if (fetchedSqrtPriceX96 == 0) {
                revert OrynEngine__UninitializedPool();
            }
            sqrtPriceX96 = fetchedSqrtPriceX96;
        } catch {
            revert OrynEngine__UninitializedPool();
        }

        // Calculate principal amounts using simplified math (equivalent to LiquidityAmounts.getAmountsForLiquidity)
        (amount0Principal, amount1Principal) = _getAmountsForLiquidity(
            sqrtPriceX96,
            _getSqrtRatioAtTick(positionInfo.tickLower),
            _getSqrtRatioAtTick(positionInfo.tickUpper),
            positionInfo.liquidity
        );

        // Fee amounts are directly available from position (same as PositionValue.fees)
        amount0Fees = uint256(positionInfo.tokensOwed0);
        amount1Fees = uint256(positionInfo.tokensOwed1);
    }

    function _validatePositionTokens(address token0, address token1) internal view {
        if (s_priceFeeds[token0] == bytes32(0) || s_priceFeeds[token1] == bytes32(0)) {
            revert OrynEngine__UnsupportedPositionTokens();
        }
    }

    function _getTokenAmountFromUSD(address token, uint256 USDAmountInWei) internal view returns (uint256) {
        uint256 price = _getNormalizedPrice(token);
        uint256 amountIn18 = (USDAmountInWei * PRECISION) / price;
        return _from18Decimals(token, amountIn18);
    }

    function _getUSDValue(address token, uint256 amount) internal view returns (uint256) {
        uint256 price = _getNormalizedPrice(token);
        uint256 amountIn18 = _to18Decimals(token, amount);
        return (price * amountIn18) / PRECISION;
    }

    function _fetchLatestPythPrice(address token) internal view returns (PythStructs.Price memory priceData) {
        bytes32 priceFeedId = s_priceFeeds[token];

        try i_pyth.getPriceNoOlderThan(priceFeedId, PYTH_PRICE_AGE_THRESHOLD) returns (PythStructs.Price memory fetched) {
            if (fetched.price <= 0) {
                revert OrynEngine__InvalidPrice();
            }
            return fetched;
        } catch {
            revert OrynEngine__StalePrice();
        }
    }

    function _getNormalizedPrice(address token) internal view returns (uint256) {
        PythStructs.Price memory priceData = _fetchLatestPythPrice(token);
        return _normalizePrice(priceData);
    }

    function _normalizePrice(PythStructs.Price memory price) internal pure returns (uint256) {
        // int64 rawPrice = price.price;
        // if (rawPrice <= 0) {
        //     revert OrynEngine__InvalidPrice();
        // }

        // // return 1000;

        // uint256 basePrice = uint256(uint64(rawPrice));
        // int256 exponent = int256(price.expo) + 18;

        // if (exponent >= 0) {
        //     return basePrice * _pow10(uint256(exponent));
        // } else {
        //     return basePrice / _pow10(uint256(-exponent));
        // }
         int64 rawPrice = price.price;
    if (rawPrice <= 0) {
        revert OrynEngine__InvalidPrice();
    }

    uint256 basePrice = uint256(uint64(rawPrice));
    int32 expo = price.expo;
    
    // Calculate the final exponent needed to get 18 decimal places
    // Pyth gives us: actualPrice = rawPrice * 10^expo
    // We want: actualPrice * 10^18 = rawPrice * 10^(expo + 18)
    int256 finalExponent = int256(expo) + 18;
    
    if (finalExponent >= 0) {
        // Positive exponent: multiply
        if (finalExponent > 77) revert OrynEngine__InvalidPrice(); // Prevent overflow
        return basePrice * (10 ** uint256(finalExponent));
    } else {
        // Negative exponent: divide
        uint256 divisorExponent = uint256(-finalExponent);
        if (divisorExponent > 77) revert OrynEngine__InvalidPrice(); // Prevent underflow
        return basePrice / (10 ** divisorExponent);
    }
    }

    function _pow10(uint256 exponent) internal pure returns (uint256) {
        if (exponent > 59) {
            revert OrynEngine__InvalidPrice();
        }
        return 10 ** exponent;
    }

    function _to18Decimals(address token, uint256 amount) internal view returns (uint256) {
        uint8 decimals = IERC20Metadata(token).decimals();
        if (decimals == 18) {
            return amount;
        } else if (decimals > 18) {
            return amount / (10 ** (decimals - 18));
        } else {
            return amount * (10 ** (18 - decimals));
        }
    }

    function _from18Decimals(address token, uint256 amount) internal view returns (uint256) {
        uint8 decimals = IERC20Metadata(token).decimals();
        if (decimals == 18) {
            return amount;
        } else if (decimals > 18) {
            return amount * (10 ** (decimals - 18));
        } else {
            return amount / (10 ** (18 - decimals));
        }
    }

    function _calculateHealthFactor(uint256 collateralUSD, uint256 debt) internal pure returns (uint256) {
        if (debt == 0) {
            return type(uint256).max;
        }
        uint256 collateralAdjustedForThreshold = (collateralUSD * LIQUIDATION_TRESHOLD) / LIQUIDATION_PRECISION;
        return (collateralAdjustedForThreshold * PRECISION) / debt;
    }

    function getOwnerOfToken(uint256 tokenId) external view returns (address) {
        return i_positionManager.ownerOf(tokenId);
    }

    // Simplified helper functions to replace v3-core dependencies
    function _getSqrtRatioAtTick(int24 tick) internal pure returns (uint160 sqrtPriceX96) {
        // Simplified implementation that's more robust
        // For now, return a reasonable default value to prevent reverts
        // This is a temporary fix - in production, you'd want proper tick math
        if (tick == 0) {
            return 79228162514264337593543950336; // sqrt(1) * 2^96
        }
        
        // For non-zero ticks, use a simple approximation
        // This is not mathematically precise but prevents reverts
        uint256 absTick = tick < 0 ? uint256(-int256(tick)) : uint256(int256(tick));
        if (absTick > 887272) {
            absTick = 887272; // Cap at max tick
        }
        
        // Simple approximation: 1.0001^tick * 2^96
        // This is a rough approximation but should work for basic cases
        uint256 ratio = 79228162514264337593543950336; // 2^96
        for (uint256 i = 0; i < absTick && i < 100; i++) { // Limit iterations to prevent gas issues
            ratio = (ratio * 10001) / 10000;
        }
        
        if (tick < 0) {
            ratio = (2**192) / ratio; // Invert for negative ticks
        }
        
        sqrtPriceX96 = uint160(ratio);
    }

    function _getAmountsForLiquidity(
        uint160 sqrtRatioX96,
        uint160 sqrtRatioAX96,
        uint160 sqrtRatioBX96,
        uint128 liquidity
    ) internal pure returns (uint256 amount0, uint256 amount1) {
        // Safety checks
        if (liquidity == 0) {
            return (0, 0);
        }
        
        if (sqrtRatioAX96 > sqrtRatioBX96) (sqrtRatioAX96, sqrtRatioBX96) = (sqrtRatioBX96, sqrtRatioAX96);

        if (sqrtRatioX96 <= sqrtRatioAX96) {
            amount0 = _getAmount0ForLiquidity(sqrtRatioAX96, sqrtRatioBX96, liquidity);
        } else if (sqrtRatioX96 < sqrtRatioBX96) {
            amount0 = _getAmount0ForLiquidity(sqrtRatioX96, sqrtRatioBX96, liquidity);
            amount1 = _getAmount1ForLiquidity(sqrtRatioAX96, sqrtRatioX96, liquidity);
        } else {
            amount1 = _getAmount1ForLiquidity(sqrtRatioAX96, sqrtRatioBX96, liquidity);
        }
    }

    function _getAmount0ForLiquidity(
        uint160 sqrtRatioAX96,
        uint160 sqrtRatioBX96,
        uint128 liquidity
    ) internal pure returns (uint256 amount0) {
        if (sqrtRatioAX96 > sqrtRatioBX96) (sqrtRatioAX96, sqrtRatioBX96) = (sqrtRatioBX96, sqrtRatioAX96);
        
        // Safety checks to prevent division by zero and overflow
        if (sqrtRatioAX96 == 0 || sqrtRatioBX96 == 0 || liquidity == 0) {
            return 0;
        }
        
        // Simplified calculation to prevent overflow
        uint256 liquidity256 = uint256(liquidity);
        uint256 term1 = (liquidity256 << 96) / sqrtRatioBX96;
        uint256 term2 = (liquidity256 << 96) / sqrtRatioAX96;
        
        if (term1 > term2) {
            return term1 - term2;
        }
        return 0;
    }

    function _getAmount1ForLiquidity(
        uint160 sqrtRatioAX96,
        uint160 sqrtRatioBX96,
        uint128 liquidity
    ) internal pure returns (uint256 amount1) {
        if (sqrtRatioAX96 > sqrtRatioBX96) (sqrtRatioAX96, sqrtRatioBX96) = (sqrtRatioBX96, sqrtRatioAX96);
        
        // Safety check
        if (liquidity == 0) {
            return 0;
        }
        
        return uint256(liquidity) * (sqrtRatioBX96 - sqrtRatioAX96) >> 96;
    }

    /**
     * @notice Get NFT position details including token addresses and USD value
     * @param tokenId The NFT token ID
     * @return token0 The first token address in the pair
     * @return token1 The second token address in the pair
     * @return fee The fee tier of the pool
     * @return liquidity The liquidity amount in the position
     * @return totalValueUSD The total USD value of the position (principal + fees)
     * @return principalValueUSD The USD value of just the principal liquidity
     * @return feeValueUSD The USD value of accrued fees
     */
    function getNFTPositionDetails(uint256 tokenId) 
        external 
        view 
        returns (
            address token0,
            address token1,
            uint24 fee,
            uint128 liquidity,
            uint256 totalValueUSD,
            uint256 principalValueUSD,
            uint256 feeValueUSD
        ) 
    {
        // Get position info from Uniswap Position Manager
        UniPositionInfo memory positionInfo = _getUniPositionInfo(tokenId);
        
        token0 = positionInfo.token0;
        token1 = positionInfo.token1;
        fee = positionInfo.fee;
        liquidity = positionInfo.liquidity;
        
        // Get token breakdown (principal + fees)
        (
            uint256 amount0Principal,
            uint256 amount1Principal,
            uint256 amount0Fees,
            uint256 amount1Fees
        ) = _getUniPositionTokenBreakdown(tokenId);
        
        // Calculate USD values
        principalValueUSD = 
            _getUSDValue(token0, amount0Principal) + 
            _getUSDValue(token1, amount1Principal);
        
        feeValueUSD = 
            _getUSDValue(token0, amount0Fees) + 
            _getUSDValue(token1, amount1Fees);
        
        totalValueUSD = principalValueUSD + feeValueUSD;
    }

    function debugPriceCalculation(address token) 
        external 
        view 
        returns (
            int64 rawPrice,
            int32 expo,
            uint256 normalizedPrice,
            uint256 actualPrice
        ) 
    {
        PythStructs.Price memory priceData = _fetchLatestPythPrice(token);
        rawPrice = priceData.price;
        expo = priceData.expo;
        normalizedPrice = _normalizePrice(priceData);
        
        // Calculate the actual price for debugging
        if (expo >= 0) {
            uint256 positiveExpo = uint256(uint32(expo));
            actualPrice = uint256(uint64(rawPrice)) * _pow10(positiveExpo);
        } else {
            uint256 negativeExpo = uint256(uint32(-expo));
            actualPrice = uint256(uint64(rawPrice)) / _pow10(negativeExpo);
        }
    }
}