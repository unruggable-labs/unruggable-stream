export const SUPERFLUID_ABI = [
    "function setFlowrate(address tokenAddress, address receiverAddress, int96 amountPerSecond)",
    "function getFlowrate(address tokenAddress, address sender, address receiver) external view returns (int96)"
];


export const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function increaseAllowance(address spender, uint256 increment)",
];

export const USDCX_ABI = [
    ...ERC20_ABI, 
    "function upgrade(uint256 amount) external",
    "function getUnderlyingToken() external view returns (address)",

    "event AdminChanged(address indexed,address indexed)",
    "event AgreementCreated(address indexed,bytes32,bytes32[])",
    "event AgreementLiquidated(address indexed,bytes32,address indexed,address indexed,uint256)",
    "event AgreementLiquidatedBy(address,address indexed,bytes32,address indexed,address indexed,uint256,uint256)",
    "event AgreementLiquidatedV2(address indexed,bytes32,address indexed,address indexed,address,uint256,int256,bytes)",
    "event AgreementStateUpdated(address indexed,address indexed,uint256)",
    "event AgreementTerminated(address indexed,bytes32)",
    "event AgreementUpdated(address indexed,bytes32,bytes32[])",
    "event Approval(address indexed,address indexed,uint256)",
    "event AuthorizedOperator(address indexed,address indexed)",
    "event Bailout(address indexed,uint256)",
    "event Burned(address indexed,address indexed,uint256,bytes,bytes)",
    "event CodeUpdated(bytes32,address)",
    "event Initialized(uint8)",
    "event Minted(address indexed,address indexed,uint256,bytes,bytes)",
    "event PoolAdminNFTCreated(address indexed)",
    "event PoolMemberNFTCreated(address indexed)",
    "event RevokedOperator(address indexed,address indexed)",
    "event Sent(address indexed,address indexed,address indexed,uint256,bytes,bytes)",
    "event TokenDowngraded(address indexed,uint256)",
    "event TokenUpgraded(address indexed,uint256)",
    "event Transfer(address indexed,address indexed,uint256)",
];

export const AUTOWRAP_MANAGER_ABI = [
    "function createWrapSchedule(address superToken, address strategy, address liquidityToken, uint64 expiry, uint64 lowerLimit, uint64 upperLimit)"
];

export const HEDGEY_BATCH_PLANNER_ABI = [
	"event BatchCreated(address indexed,address,uint256,uint256,uint8)",
	"function batchLockingPlans(address,address,uint256,(address,uint256,uint256,uint256,uint256)[],uint256,uint8)",
	"function batchVestingPlans(address,address,uint256,(address,uint256,uint256,uint256,uint256)[],uint256,address,bool,uint8)",

    "event PlanCreated(uint256 indexed id,address indexed recipient,address indexed token,uint256 amount,uint256 start,uint256 cliff,uint256 end,uint256 rate,uint256 period,address vestingAdmin,bool adminTransferOBO)"
];

export const HEDGEY_LOCKER_ABI = [
    "function revokePlans(uint256[] calldata planIds) external"
];