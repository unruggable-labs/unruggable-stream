// The below proposal was for setting up Service Provider streams
// It is a useful example against which to sanity check Tenderly simulations
// It this example the execute method is called on the ENSGovernor after the proposal has passed
// The Timelock/'ENS: DAO Wallet' is the ultimate executor of the calldatas contained within
// Hence why when simulating our transactions we do so as the Timelock/'ENS: DAO Wallet'
// https://www.tally.xyz/gov/ens/proposal/63865530602418424570813160277709124551851041237648860550576561576702951975816
// https://etherscan.io/tx/0x81b6b744ff95090b9d2727e7d5b6c9301e643a9de8305377011c2c5a4f11084a
// https://dashboard.tenderly.co/tx/mainnet/0x81b6b744ff95090b9d2727e7d5b6c9301e643a9de8305377011c2c5a4f11084a

import { Contract }                     from 'ethers';
import { 
    ERC20_ABI, 
    USDCX_ABI, 
    SUPERFLUID_ABI, 
    AUTOWRAP_MANAGER_ABI 
}                                       from './abis';
import { 
    USDC_ADDR, 
    USDCX_ADDR, 
    SUPERFLUID_ADDR, 
    SENDER_ADDR, 
    AUTOWRAP_MANAGER_ADDR, 
    AUTOWRAP_STRATEGY_ADDR, 
    UNRUGGABLE_ADDR 
}                                       from './addresses';
import { init }                         from './utils';

const { foundry, impersonatedSigner } = await init();

// function setFlowrate(address SuperUSDC, address StreamManagementPod, int96 114155251141552512)

const USDCContract          =  new Contract(USDC_ADDR, ERC20_ABI, foundry.provider);
const USDCXContract         =  new Contract(USDCX_ADDR, USDCX_ABI, foundry.provider);
const superfluidContract    =  new Contract(SUPERFLUID_ADDR, SUPERFLUID_ABI, foundry.provider);

const underlyingToken = await USDCXContract.getUnderlyingToken();
console.log("Underlying Token:", underlyingToken);

const USDCDecimals = await USDCContract.decimals();
const USDCXDecimals = await USDCXContract.decimals();

console.log("USDC Decimals:", USDCDecimals);
console.log("USDCX Decimals:", USDCXDecimals);

const USDCDivisor = BigInt(10) ** USDCDecimals; // Convert to BigInt
const USDCXDivisor = BigInt(10) ** USDCXDecimals; // Convert to BigInt

const USDCBalanceBefore = await USDCContract.balanceOf(SENDER_ADDR);
console.log("USDCBalanceBefore", USDCBalanceBefore);
console.log("USDCBalanceBefore Formatted", USDCBalanceBefore / USDCDivisor);

const USDCXBalanceBefore = await USDCXContract.balanceOf(SENDER_ADDR);
console.log("USDCXBalanceBefore", USDCXBalanceBefore);
console.log("USDCXBalanceBefore Formatted", USDCXBalanceBefore / USDCXDivisor);

// The yearly USDC funding amount is $1,200,000
const TOTAL_YEARLY_FUNDING = 1200000n;

// The upfront allowance is $100,000 USDC, 1 months worth of funding.
const UPFRONT_USDC_ALLOWANCE = 100000n;

const AUTOWRAP_ALLOWANCE = TOTAL_YEARLY_FUNDING - UPFRONT_USDC_ALLOWANCE;

const AutowrapManagerContract = new Contract(AUTOWRAP_MANAGER_ADDR, AUTOWRAP_MANAGER_ABI, foundry.provider);

/**
 * This function approves the Super USDCX contract to spend $100,000 of USDC on behalf of the sender, the ENS DAO wallet.
 */
export const approveUSDCX = async () => {
        
    console.log("-------------------");
    console.log("-------------------");
    console.log("1. approveUSDCX");
    console.log("-------------------");
    console.log("-------------------");

    // Check the allowance before. Should be 0.
    const USDCAllowanceBefore = await USDCContract.allowance(SENDER_ADDR, USDCX_ADDR);
    console.log("USDCAllowanceBefore", USDCAllowanceBefore);

    // We need to add the appropriate number of 0's for the USDC contract, 6
    const USDC_ALLOWANCE_AMOUNT = UPFRONT_USDC_ALLOWANCE * USDCDivisor;
    //console.log("USDC_ALLOWANCE_AMOUNT", USDC_ALLOWANCE_AMOUNT);

    // 300000000000
    // 100000000000

    // Generate the calldata for calling the approve function
    const approveAllowanceCalldata = USDCContract.interface.encodeFunctionData("approve", [USDCX_ADDR, USDC_ALLOWANCE_AMOUNT]);
    
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
        to: USDC_ADDR,
        from: SENDER_ADDR,
        data: approveAllowanceCalldata,
    });

    await approveAllowanceTx.wait();

    //Check that the allowance has been set correctly
    const USDCAllowanceAfter = await USDCContract.allowance(SENDER_ADDR, USDCX_ADDR);
    console.log("USDCAllowanceAfter", USDCAllowanceAfter);

    console.log("");
    console.log("");

    return approveAllowanceCalldata;
}

/**
 * This function 'upgrades' $100,000 USDC (that we just allowed) to USDCX.
 * Afterswards the ENS DAO wallet will have $100,000 more USDCX.
 */
export const upgradeUSDC = async () => {

    console.log("-------------------");
    console.log("-------------------");
    console.log("2. upgradeUSDC");
    console.log("-------------------");
    console.log("-------------------");

    // 300000000000000000000000
    // 100000000000000000000000n
    console.log("USDC_ALLOWANCE * USDCDivisor", UPFRONT_USDC_ALLOWANCE * USDCXDivisor);
    const upgradeUSDCCalldata = USDCXContract.interface.encodeFunctionData("upgrade", [UPFRONT_USDC_ALLOWANCE * USDCXDivisor]);

    console.log("-------------------");
    console.log("upgradeUSDCCalldata");
    console.log("-------------------");
    console.log(upgradeUSDCCalldata);
    console.log("-------------------");

    const USDCXBalanceBeforeUpgrade = await USDCXContract.balanceOf(SENDER_ADDR);
    console.log("USDCXBalanceBeforeUpgrade", USDCXBalanceBeforeUpgrade / USDCXDivisor);

    // They did 
    // 0x45977d03000000000000000000000000000000000000000000003f870857a3e0e3800000
    // We did
    // 0x45977d0300000000000000000000000000000000000000000000152d02c7e14af6800000

    // Send the transaction
    const upgradeUSDCTx = await impersonatedSigner.sendTransaction({
        to: USDCX_ADDR,
        from: SENDER_ADDR,
        data: upgradeUSDCCalldata,
    });

    const upgradeReceipt =  await upgradeUSDCTx.wait();
    console.log("Upgrade Transaction Confirmed");

    upgradeReceipt.logs.forEach((log) => {
        try {
            const parsedLog = USDCXContract.interface.parseLog(log);
            console.log("Parsed Log:", parsedLog.signature, parsedLog.args);
        } catch (error) {
            console.error("Log not related to this contract:", error);
        }
    });

    const USDCXBalanceAfterUpgrade = await USDCXContract.balanceOf(SENDER_ADDR);
    console.log("USDCXBalanceAfterUpgrade", USDCXBalanceAfterUpgrade / USDCXDivisor);

    console.log("");
    console.log("");

    return upgradeUSDCCalldata;
}

/**
 * This function sets up the stream to the Unruggable multisig wallet.
 * The flowrate of the Super USDCX token is 0.03802651753 USD per second which totals $1,200,000 per year.
 * Calculation: 1,200,000 / 31,556,926 = 0.03802651753 USD per second.
 */
export const setFlowrate = async () => {

    console.log("-------------------");
    console.log("-------------------");
    console.log("3. setFlowrate");
    console.log("-------------------");
    console.log("-------------------");

    const USD_PER_YEAR = 1200000n;
    const SECONDS_IN_YEAR = 31556926n;
    const USD_PER_SECOND = (USD_PER_YEAR * USDCXDivisor) / SECONDS_IN_YEAR;

    // Should be 38026517538495352n
    console.log("USD_PER_SECOND", USD_PER_SECOND);

    const setFlowrateCalldata = superfluidContract.interface.encodeFunctionData(
        "setFlowrate", 
        [USDCX_ADDR, UNRUGGABLE_ADDR, USD_PER_SECOND]
    );

    console.log("-------------------");
    console.log("setFlowrateCalldata");
    console.log("-------------------");
    console.log(setFlowrateCalldata);
    console.log("-------------------");

    console.log("Impersonated Signer:", impersonatedSigner.address);

    // Send the transaction
    const tx = await impersonatedSigner.sendTransaction({
        to: SUPERFLUID_ADDR,
        from: SENDER_ADDR,
        data: setFlowrateCalldata,
    });

    console.log("Transaction Hash:", tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("Transaction Confirmed:", receipt.hash);

    //int96 expectedFlowRate = 114155251141550940;
    const flowRate = await superfluidContract.getFlowrate(USDCX_ADDR, SENDER_ADDR, UNRUGGABLE_ADDR);
    console.log("Flow Rate:", flowRate);

    console.log("");
    console.log("");

    return setFlowrateCalldata;
}


export const approveAutowrap = async () => {

    console.log("-------------------");
    console.log("-------------------");
    console.log("4. approveAutowrap");
    console.log("-------------------");
    console.log("-------------------");

    // Check the allowance before. Should be 0.
    const USDCAllowanceBefore = await USDCContract.allowance(SENDER_ADDR, AUTOWRAP_STRATEGY_ADDR);
    console.log("Autowrap USDCAllowanceBefore", USDCAllowanceBefore);

    // We need to add the appropriate number of 0's for the USDC contract, 6
    const USDC_ALLOWANCE_AMOUNT = AUTOWRAP_ALLOWANCE * USDCDivisor;
    //console.log("Autowrap USDC_ALLOWANCE_AMOUNT", USDC_ALLOWANCE_AMOUNT);

    const newAllowance = USDCAllowanceBefore + USDC_ALLOWANCE_AMOUNT;

    // Generate the calldata for calling the approve function
    const approveAutowrapAllowanceCalldata = USDCContract.interface.encodeFunctionData("approve", [AUTOWRAP_STRATEGY_ADDR, newAllowance]);
    
    console.log("-------------------");
    console.log("approveAutowrapAllowanceCalldata");
    console.log("-------------------");
    console.log(approveAutowrapAllowanceCalldata);
    console.log("-------------------");

    // They did
    // 0x095ea7b30000000000000000000000001d65c6d3ad39d454ea8f682c49ae7744706ea96d000000000000000000000000000000000000000000000000000004a36fb03800
    // We did
    // 0x095ea7b30000000000000000000000001d65c6d3ad39d454ea8f682c49ae7744706ea96d0000000000000000000000000000000000000000000000000000027fce4c3eeb

    // Send the transaction from the ENS DAO wallet to the USDC contract address
    const approveAllowanceTx = await impersonatedSigner.sendTransaction({
        to: USDC_ADDR,
        from: SENDER_ADDR,
        data: approveAutowrapAllowanceCalldata,
    });

    await approveAllowanceTx.wait();

    //Check that the allowance has been set correctly
    const USDCAllowanceAfter = await USDCContract.allowance(SENDER_ADDR, AUTOWRAP_STRATEGY_ADDR);
    console.log("Autowrap USDCAllowanceAfter", USDCAllowanceAfter);

    console.log("");
    console.log("");

    return approveAutowrapAllowanceCalldata;
}


export const createAutowrapSchedule = async () => {

    //Sat Jan 24 2065 05:20:00 GMT+0000
    const EXPIRY_TIME_FAR_IN_FUTURE = 3000000000;
    const TWENTY_ONE_DAYS_IN_SECONDS = 1814400;
    const FIFTY_DAYS_IN_SECONDS = 4320000;

    // Generate the calldata for calling the createWrapSchedule function
    const createWrapScheduleCalldata = AutowrapManagerContract.interface.encodeFunctionData("createWrapSchedule", [
        USDCX_ADDR, 
        AUTOWRAP_STRATEGY_ADDR, 
        USDC_ADDR, 
        EXPIRY_TIME_FAR_IN_FUTURE, 
        TWENTY_ONE_DAYS_IN_SECONDS, 
        FIFTY_DAYS_IN_SECONDS
    ]);

    console.log("-------------------");
    console.log("createWrapScheduleCalldata");
    console.log("-------------------");
    console.log(createWrapScheduleCalldata);
    console.log("-------------------");

    // They did
    //0x5626f9e60000000000000000000000001ba8603da702602a8657980e825a6daa03dee93a0000000000000000000000001d65c6d3ad39d454ea8f682c49ae7744706ea96d000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000000000000000000000000000000b2d05e0000000000000000000000000000000000000000000000000000000000001baf80000000000000000000000000000000000000000000000000000000000041eb00
    // We did
    // 0x5626f9e60000000000000000000000001ba8603da702602a8657980e825a6daa03dee93a0000000000000000000000001d65c6d3ad39d454ea8f682c49ae7744706ea96d000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000000000000000000000000000000b2d05e0000000000000000000000000000000000000000000000000000000000001baf80000000000000000000000000000000000000000000000000000000000041eb00

    // Send the transaction from the ENS DAO wallet to the USDC contract address
    const createWrapScheduleTx = await impersonatedSigner.sendTransaction({
        to: AUTOWRAP_MGR_ADDR,
        from: SENDER_ADDR,
        data: createWrapScheduleCalldata,
    });

    await createWrapScheduleTx.wait();

    return createWrapScheduleCalldata;
}