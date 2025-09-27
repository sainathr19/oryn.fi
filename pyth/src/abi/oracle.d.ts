export declare const oracleAbi: readonly [{
    readonly type: "function";
    readonly name: "getCurrentEmaPrice";
    readonly inputs: readonly [{
        readonly name: "id";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "tuple";
        readonly internalType: "struct PythStructs.Price";
        readonly components: readonly [{
            readonly name: "price";
            readonly type: "int64";
            readonly internalType: "int64";
        }, {
            readonly name: "conf";
            readonly type: "uint64";
            readonly internalType: "uint64";
        }, {
            readonly name: "expo";
            readonly type: "int32";
            readonly internalType: "int32";
        }, {
            readonly name: "publishTime";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getCurrentPrice";
    readonly inputs: readonly [{
        readonly name: "id";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "tuple";
        readonly internalType: "struct PythStructs.Price";
        readonly components: readonly [{
            readonly name: "price";
            readonly type: "int64";
            readonly internalType: "int64";
        }, {
            readonly name: "conf";
            readonly type: "uint64";
            readonly internalType: "uint64";
        }, {
            readonly name: "expo";
            readonly type: "int32";
            readonly internalType: "int32";
        }, {
            readonly name: "publishTime";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getEmaPrice";
    readonly inputs: readonly [{
        readonly name: "id";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "price";
        readonly type: "tuple";
        readonly internalType: "struct PythStructs.Price";
        readonly components: readonly [{
            readonly name: "price";
            readonly type: "int64";
            readonly internalType: "int64";
        }, {
            readonly name: "conf";
            readonly type: "uint64";
            readonly internalType: "uint64";
        }, {
            readonly name: "expo";
            readonly type: "int32";
            readonly internalType: "int32";
        }, {
            readonly name: "publishTime";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getEmaPriceNoOlderThan";
    readonly inputs: readonly [{
        readonly name: "id";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "age";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "price";
        readonly type: "tuple";
        readonly internalType: "struct PythStructs.Price";
        readonly components: readonly [{
            readonly name: "price";
            readonly type: "int64";
            readonly internalType: "int64";
        }, {
            readonly name: "conf";
            readonly type: "uint64";
            readonly internalType: "uint64";
        }, {
            readonly name: "expo";
            readonly type: "int32";
            readonly internalType: "int32";
        }, {
            readonly name: "publishTime";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getEmaPriceUnsafe";
    readonly inputs: readonly [{
        readonly name: "id";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "price";
        readonly type: "tuple";
        readonly internalType: "struct PythStructs.Price";
        readonly components: readonly [{
            readonly name: "price";
            readonly type: "int64";
            readonly internalType: "int64";
        }, {
            readonly name: "conf";
            readonly type: "uint64";
            readonly internalType: "uint64";
        }, {
            readonly name: "expo";
            readonly type: "int32";
            readonly internalType: "int32";
        }, {
            readonly name: "publishTime";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getPrice";
    readonly inputs: readonly [{
        readonly name: "id";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "price";
        readonly type: "tuple";
        readonly internalType: "struct PythStructs.Price";
        readonly components: readonly [{
            readonly name: "price";
            readonly type: "int64";
            readonly internalType: "int64";
        }, {
            readonly name: "conf";
            readonly type: "uint64";
            readonly internalType: "uint64";
        }, {
            readonly name: "expo";
            readonly type: "int32";
            readonly internalType: "int32";
        }, {
            readonly name: "publishTime";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getPriceNoOlderThan";
    readonly inputs: readonly [{
        readonly name: "id";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "age";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "price";
        readonly type: "tuple";
        readonly internalType: "struct PythStructs.Price";
        readonly components: readonly [{
            readonly name: "price";
            readonly type: "int64";
            readonly internalType: "int64";
        }, {
            readonly name: "conf";
            readonly type: "uint64";
            readonly internalType: "uint64";
        }, {
            readonly name: "expo";
            readonly type: "int32";
            readonly internalType: "int32";
        }, {
            readonly name: "publishTime";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getPriceUnsafe";
    readonly inputs: readonly [{
        readonly name: "id";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "price";
        readonly type: "tuple";
        readonly internalType: "struct PythStructs.Price";
        readonly components: readonly [{
            readonly name: "price";
            readonly type: "int64";
            readonly internalType: "int64";
        }, {
            readonly name: "conf";
            readonly type: "uint64";
            readonly internalType: "uint64";
        }, {
            readonly name: "expo";
            readonly type: "int32";
            readonly internalType: "int32";
        }, {
            readonly name: "publishTime";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getUpdateFee";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "bytes[]";
        readonly internalType: "bytes[]";
    }];
    readonly outputs: readonly [{
        readonly name: "feeAmount";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "pure";
}, {
    readonly type: "function";
    readonly name: "getValidTimePeriod";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "setEmaPrice";
    readonly inputs: readonly [{
        readonly name: "id";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "price";
        readonly type: "int64";
        readonly internalType: "int64";
    }, {
        readonly name: "conf";
        readonly type: "uint64";
        readonly internalType: "uint64";
    }, {
        readonly name: "expo";
        readonly type: "int32";
        readonly internalType: "int32";
    }, {
        readonly name: "publishTime";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "setPrice";
    readonly inputs: readonly [{
        readonly name: "id";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "price";
        readonly type: "int64";
        readonly internalType: "int64";
    }, {
        readonly name: "conf";
        readonly type: "uint64";
        readonly internalType: "uint64";
    }, {
        readonly name: "expo";
        readonly type: "int32";
        readonly internalType: "int32";
    }, {
        readonly name: "publishTime";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "setValidTimePeriod";
    readonly inputs: readonly [{
        readonly name: "_validTimePeriod";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "updatePriceFeeds";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "bytes[]";
        readonly internalType: "bytes[]";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "payable";
}, {
    readonly type: "function";
    readonly name: "updatePriceFeedsIfNecessary";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "bytes[]";
        readonly internalType: "bytes[]";
    }, {
        readonly name: "";
        readonly type: "bytes32[]";
        readonly internalType: "bytes32[]";
    }, {
        readonly name: "";
        readonly type: "uint64[]";
        readonly internalType: "uint64[]";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "payable";
}, {
    readonly type: "error";
    readonly name: "PriceFeedNotFound";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "StalePrice";
    readonly inputs: readonly [];
}];
//# sourceMappingURL=oracle.d.ts.map