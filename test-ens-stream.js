// I found this TX by looking at the Hedgey app interface through our safe
// This is a transaction where Spence executes multiple calldata's on the main.mg.wg.ens.eth safe to create various Hedgey vesting plans
// https://etherscan.io/tx/0x1a893a7535c63320ea86381fe6760a5fd61a0998898f70724de1df6143b5665a
// https://dashboard.tenderly.co/tx/mainnet/0x1a893a7535c63320ea86381fe6760a5fd61a0998898f70724de1df6143b5665a

// We want to have the Timelock/'ENS: DAO Wallet' create the Hedgey vesting plan directly

// I attempted to create a plan through the Hedgey app interface to get an idea for the flow, arguments, and calldata
// Doing so was trying to use https://etherscan.io/address/0x1bb64AF7FE05fc69c740609267d2AbE3e119Ef82#code as the locker address
// Labelled as 'Hedgey Finance: Voting Token Vesting 2'. Created Oct-31-2023.

// Looking at the Tenderley trace for Spence's TX (above), that transaction used https://etherscan.io/address/0x73cd8626b3cd47b009e68380720cfe6679a3ec3d#code
// Labelled as 'Hedgey Finance: Voting Token Lockups'. Created Aug-08-2023.

// Having played around, different combinations of configurations use different locker contracts:
// Allow revocable, Governance allowed, Allow admin transfer = 0x1bb64AF7FE05fc69c740609267d2AbE3e119Ef82
// NOT revocable, Governance allowed, Allow admin transfer = 0x73cD8626b3cD47B009E68380720CFE6679A3Ec3D
// NOT revocable, Governance allowed, NO Admin transfer allowed = 0xdE8465D44eBfC761Ee3525740E06C916886E1aEB

// When we call execute on the Governor in response to a successful executable proposal, it passes through to the Timelock/'ENS: DAO Wallet' (same thing) and execution occurs in that context.
// As such we need to approve the HEDGEY_BATCH_PLANNER_ADDR to spend 100,000 ENS tokens on behalf of the Timelock/'ENS: DAO Wallet'
// Then we need to call the batchVestingPlans function on the HEDGEY_BATCH_PLANNER_ADDR with the appropriate arguments to create the vesting plan

// The end result is that the Timelock/'ENS: DAO Wallet' will have created a vesting plan for the UNRUGGABLE_ADDRESS to receive 100,000 ENS tokens over 4 years. During that period Unruggable will be able to use them to take part in DAO Governance


import { Contract } from 'ethers';
import { UNRUGGABLE_ADDR, SENDER_ADDR, LOCKER_ADDR, ENS_TOKEN_ADDR, HEDGEY_BATCH_PLANNER_ADDR } from './addresses';
import { ERC20_ABI, HEDGEY_BATCH_PLANNER_ABI } from './abis';
import { init } from './utils';

const { foundry, impersonatedSigner } = await init();

const ENSTokenContract =  new Contract(ENS_TOKEN_ADDR, ERC20_ABI, foundry.provider);

const HedgeyBatchPlannerContract = new Contract(HEDGEY_BATCH_PLANNER_ADDR, HEDGEY_BATCH_PLANNER_ABI, foundry.provider);

const ENS_ALLOWANCE = 100000n;

const ENSDecimals = await ENSTokenContract.decimals();

console.log("ENS Decimals:", ENSDecimals);

const ENSDivisor = BigInt(10) ** ENSDecimals; // Convert to BigInt


export const approveENS = async () => {
        
    console.log("-------------------");
    console.log("-------------------");
    console.log("1. approveENS");
    console.log("-------------------");
    console.log("-------------------");


    // Check the allowance before. Should be 0.
    const ENSAllowanceBefore = await ENSTokenContract.allowance(SENDER_ADDR, HEDGEY_BATCH_PLANNER_ADDR);
    console.log("ENSAllowanceBefore", ENSAllowanceBefore);

    // We need to add the appropriate number of 0's for the ENS contract, 
    const ENS_ALLOWANCE_AMOUNT = ENS_ALLOWANCE * ENSDivisor;
    //console.log("ENS_ALLOWANCE_AMOUNT", ENS_ALLOWANCE_AMOUNT);

    // 300000000000
    // 100000000000

    // Generate the calldata for calling the approve function
    const approveAllowanceCalldata = ENSTokenContract.interface.encodeFunctionData("approve", [HEDGEY_BATCH_PLANNER_ADDR, ENS_ALLOWANCE_AMOUNT]);
    
    console.log("-------------------");
    console.log("approveAllowanceCalldata");
    console.log("-------------------");
    console.log(approveAllowanceCalldata);
    console.log("-------------------");


    // They did
    // 0x095ea7b30000000000000000000000001ba8603da702602a8657980e825a6daa03dee93a00000000000000000000000000000000000000000000000000000045d964b800
    // We did
    // 0x095ea7b30000000000000000000000001ba8603da702602a8657980e825a6daa03dee93a000000000000000000000000000000000000000000000000000000174876e800

    // Send the transaction from the ENS DAO wallet to the USDC contract address
    const approveAllowanceTx = await impersonatedSigner.sendTransaction({
        to: ENS_TOKEN_ADDR,
        from: SENDER_ADDR,
        data: approveAllowanceCalldata,
    });

    await approveAllowanceTx.wait();

    //Check that the allowance has been set correctly
    const ENSAllowanceAfter = await ENSTokenContract.allowance(SENDER_ADDR, HEDGEY_BATCH_PLANNER_ADDR);
    console.log("ENSAllowanceAfter", ENSAllowanceAfter);

    console.log("");
    console.log("");

    return approveAllowanceCalldata;
}


export const createPlan = async () => {

    /*
    /// @notice function to create a batch of vesting plans.
    /// @dev the function will pull in the entire balance of totalAmount to the contract, increase the allowance and then via loop mint vesting plans
    /// @param locker is the address of the lockup plan that the tokens will be locked in, and NFT plan provided to
    /// @param token is the address of the token that is given and locked to the individuals
    /// @param totalAmount is the total amount of tokens being locked, this has to equal the sum of all the individual amounts in the plans struct
    /// @param plans is the array of plans that contain each plan parameters
    /// @param period is the length of the period in seconds that tokens become unlocked / vested
    /// @param vestingAdmin is the address of the vesting admin, that will be the same for all plans created
    /// @param adminTransferOBO is an emergency toggle that allows the vesting admin to tranfer a vesting plan on behalf of a beneficiary
    /// @param mintType is an internal tool to help with identifying front end applications
    function batchVestingPlans(
        address locker,
        address token,
        uint256 totalAmount,
        Plan[] calldata plans,
        uint256 period,
        address vestingAdmin,
        bool adminTransferOBO,
        uint8 mintType
    )
    */

    //"function batchVestingPlans(address,address,uint256,(address,uint256,uint256,uint256,uint256)[],uint256,address,bool,uint8)"


    /*
    struct Plan {
        address recipient;
        uint256 amount;
        uint256 start;
        uint256 cliff;
        uint256 rate;
    }
    */

    const TOTAL_ENS_AMOUNT = ENS_ALLOWANCE * ENSDivisor;
    const currentTimestampSeconds = Math.floor(Date.now() / 1000);

    const SECONDS_IN_YEAR = 31536000n; //This is the number that Hedgey uses.
    const NUMBER_OF_YEARS = 4n;
    const ENS_PER_SECOND = TOTAL_ENS_AMOUNT / (SECONDS_IN_YEAR * NUMBER_OF_YEARS);

    //792744799594114


    console.log("ENS_PER_SECOND", ENS_PER_SECOND);


    const PERIOD = 1;
    const CAN_ADMIN_TRANSFER = true;
    const MINT_TYPE = 7;

    // Generate the calldata to create the vesting plan
    const batchVestingPlansCalldata = HedgeyBatchPlannerContract.interface.encodeFunctionData("batchVestingPlans", [
        LOCKER_ADDR,
        ENS_TOKEN_ADDR,
        TOTAL_ENS_AMOUNT,
        [
            [
                UNRUGGABLE_ADDR, 
                TOTAL_ENS_AMOUNT, 
                currentTimestampSeconds, 
                currentTimestampSeconds, 
                ENS_PER_SECOND,
            ],
        ],
        PERIOD,
        SENDER_ADDR,
        CAN_ADMIN_TRANSFER,
        MINT_TYPE
    ]);
    
    console.log("-------------------");
    console.log("batchVestingPlansCalldata");
    console.log("-------------------");
    console.log(batchVestingPlansCalldata);
    console.log("-------------------");


    // Send the transaction from the ENS DAO wallet to the USDC contract address
    const batchVestingPlansTx = await impersonatedSigner.sendTransaction({
        to: HEDGEY_BATCH_PLANNER_ADDR,
        from: SENDER_ADDR,
        data: batchVestingPlansCalldata,
    });

    await batchVestingPlansTx.wait();
    
    return batchVestingPlansCalldata;
}