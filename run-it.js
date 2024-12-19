import { 
    assert, 
    simulateTransactionBundle 
}                                       from './utils';
import { 
    approveUSDCX, 
    upgradeUSDC, 
    setFlowrate, 
    increaseAutowrapAllowance,
    cancelSuperfluidStream 
}                                       from './test-usdc-stream';
import { 
    approveENS, 
    createPlan, 
    cancelPlan 
}                                       from './test-ens-stream';
import { 
    SENDER_ADDR, 
    USDC_ADDR, 
    USDCX_ADDR, 
    SUPERFLUID_ADDR, 
    ENS_TOKEN_ADDR, 
    HEDGEY_BATCH_PLANNER_ADDR, 
    LOCKER_ADDR
}                                       from './addresses';
import { init }                         from './utils';

const { foundry, impersonatedSigner } = await init();

assert(impersonatedSigner.address == SENDER_ADDR, "Impersonated signer is not the ENS DAO Wallet/Timelock");

//////////////////////////////
// USDC Stream Transactions //
//////////////////////////////
const approveUSDCXCalldata = await approveUSDCX();
const upgradeUSDCCalldata = await upgradeUSDC();
const setFlowrateCalldata = await setFlowrate();
const increaseAutowrapAllowanceCalldata = await increaseAutowrapAllowance();
const cancelSuperfluidStreamCalldata = await cancelSuperfluidStream();
// We don't need to create a new autowrap schedule for each stream.
// const createAutowrapCalldata = await createAutowrapSchedule();

console.log("------------------------------------------");
console.log("-------- CALL DATA FOR USDC STREAM --------")
console.log("------------------------------------------");

console.log("------------------------------------------");
console.log(approveUSDCXCalldata);
console.log("------------------------------------------");
console.log(upgradeUSDCCalldata);
console.log("------------------------------------------");
console.log(setFlowrateCalldata);
console.log("------------------------------------------");
console.log(increaseAutowrapAllowanceCalldata);
console.log("------------------------------------------");
console.log(cancelSuperfluidStreamCalldata);
console.log("------------------------------------------");

//////////////////////////////
// ENS Stream Transactions //
//////////////////////////////
const approveENSCalldata = await approveENS();
const [planId, createPlanCalldata] = await createPlan();
const cancelPlanCalldata = await cancelPlan(planId);

console.log("------------------------------------------");
console.log("-------- CALL DATA FOR ENS STREAM --------")
console.log("------------------------------------------");

console.log("------------------------------------------");
console.log(approveENSCalldata);
console.log("------------------------------------------");
console.log(createPlanCalldata);
console.log("------------------------------------------");
console.log(cancelPlanCalldata);
console.log("------------------------------------------");

//////////////////////////////
///// TENDERLY SIMULATION ////
//////////////////////////////

// Array of all our transactions to simulate with Tenderly
const transactions = [
    // USDC Stream Transactions
    {
        from: SENDER_ADDR, 
        to: USDC_ADDR,
        input: approveUSDCXCalldata,
    },
   {
        from: SENDER_ADDR, 
        to: USDCX_ADDR,
        input: upgradeUSDCCalldata,
    },
    {
        from: SENDER_ADDR, 
        to: SUPERFLUID_ADDR,
        input: setFlowrateCalldata,
    },
    {
        from: SENDER_ADDR, 
        to: USDC_ADDR,
        input: increaseAutowrapAllowanceCalldata,
    },
    {
        from: SENDER_ADDR, 
        to: SUPERFLUID_ADDR,
        input: cancelSuperfluidStreamCalldata,
    },
    // ENS Stream Transactions
   {
        from: SENDER_ADDR, 
        to: ENS_TOKEN_ADDR,
        input: approveENSCalldata,
    },
    {
        from: SENDER_ADDR, 
        to: HEDGEY_BATCH_PLANNER_ADDR,
        input: createPlanCalldata,
    },
    {
        from: SENDER_ADDR, 
        to: LOCKER_ADDR,
        input: cancelPlanCalldata,
    },
]

const defaults = {
    network_id: '1',
    save: true,
    save_if_fails: true,
    simulation_type: 'full',
};

const builtTransactions = transactions.map(item => ({ ...defaults, ...item }));

if (!process.env.TENDERLY_API_KEY || !process.env.TENDERLY_USERNAME || !process.env.TENDERLY_PROJECT) {
    console.error("Please set TENDERLY_API_KEY/TENDERLY_USERNAME/TENDERLY_PROJECT in .env");
} else {
    await simulateTransactionBundle(builtTransactions);
}

await foundry.shutdown();