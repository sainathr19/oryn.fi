export const IOType = {
  collateral: "collateral",
  loan: "loan",
} as const;

export type ContractAddressKey =
  | "ORYN_ENGINE_ADDRESS_V3"
  | "ORYN_ENGINE_ADDRESS_V4"
  | "UNI_V3_POSITION_MANAGER_ADDRESS"
  | "UNI_V4_POSITION_MANAGER_ADDRESS";

export type ContractAddresses = Record<ContractAddressKey, `0x${string}`>;

export const contractAddresses: ContractAddresses = {
  ORYN_ENGINE_ADDRESS_V3: "0x11C4776F2d0C1a780948C0C041bAc588Eae38B71",
  ORYN_ENGINE_ADDRESS_V4: "0x",
  UNI_V3_POSITION_MANAGER_ADDRESS: "0x1238536071E1c677A632429e3655c799b22cDA52",
  UNI_V4_POSITION_MANAGER_ADDRESS: "0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4",
};

export type IOType = (typeof IOType)[keyof typeof IOType];
