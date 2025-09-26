// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "../interfaces/IUniPositionManager.sol";

contract MockNonfungiblePositionManager is IUniPositionManager {
    struct PositionData {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint128 liquidity;
        uint128 tokensOwed0;
        uint128 tokensOwed1;
    }

    address private immutable _factory;
    uint256 private _nextId = 1;

    mapping(uint256 => PositionData) private _positions;
    mapping(uint256 => address) private _owners;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    constructor(address factory_) {
        _factory = factory_;
    }

    function factory() external view override returns (address) {
        return _factory;
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "POSITION_DNE");
        return owner;
    }

    function positions(uint256 tokenId)
        external
        view
        override
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
        PositionData memory data = _positions[tokenId];
        return (
            0,
            address(0),
            data.token0,
            data.token1,
            data.fee,
            data.tickLower,
            data.tickUpper,
            data.liquidity,
            0,
            0,
            data.tokensOwed0,
            data.tokensOwed1
        );
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external override {
        require(_isApprovedOrOwner(msg.sender, from, tokenId), "NOT_AUTH" );
        require(to != address(0), "INVALID_TO");

        _owners[tokenId] = to;

        if (_isContract(to)) {
            bytes4 retval = IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, "");
            require(retval == IERC721Receiver.onERC721Received.selector, "UNSAFE_RECEIVER");
        }
    }

    function setApprovalForAll(address operator, bool approved) external {
        _operatorApprovals[msg.sender][operator] = approved;
    }

    function isApprovedForAll(address owner, address operator) external view returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function mintPosition(address to, PositionData calldata position) external returns (uint256 tokenId) {
        require(to != address(0), "INVALID_TO");
        tokenId = _nextId++;
        _positions[tokenId] = position;
        _owners[tokenId] = to;
    }

    function updateTokensOwed(uint256 tokenId, uint128 tokensOwed0, uint128 tokensOwed1) external {
        PositionData storage data = _positions[tokenId];
        data.tokensOwed0 = tokensOwed0;
        data.tokensOwed1 = tokensOwed1;
    }

    function _isApprovedOrOwner(address spender, address owner, uint256 tokenId) private view returns (bool) {
        require(_owners[tokenId] == owner, "NOT_OWNER");
        if (spender == owner) {
            return true;
        }
        return _operatorApprovals[owner][spender];
    }

    function _isContract(address account) private view returns (bool) {
        return account.code.length > 0;
    }
}
