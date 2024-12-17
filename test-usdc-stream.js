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
import { init, assert }                 from './utils';

const { foundry, impersonatedSigner } = await init();

// Contract instances
const USDCContract              =  new Contract(USDC_ADDR, ERC20_ABI, foundry.provider);
const USDCXContract             =  new Contract(USDCX_ADDR, USDCX_ABI, foundry.provider);
const SuperfluidContract        =  new Contract(SUPERFLUID_ADDR, SUPERFLUID_ABI, foundry.provider);
const AutowrapManagerContract   = new Contract(AUTOWRAP_MANAGER_ADDR, AUTOWRAP_MANAGER_ABI, foundry.provider);

const underlyingToken = await USDCXContract.getUnderlyingToken();
assert(underlyingToken === USDC_ADDR, "Underlying token is not USDC");

const USDCDecimals = await USDCContract.decimals();
assert(USDCDecimals === 6n, "USDC Decimals are not 6");

const USDCXDecimals = await USDCXContract.decimals();
assert(USDCXDecimals === 18n, "USDCX Decimals are not 18");

const USDCDivisor = BigInt(10) ** USDCDecimals;
assert(USDCDivisor === 1000000n, "USDC Divisor is not 1000000");

const USDCXDivisor = BigInt(10) ** USDCXDecimals;
assert(USDCXDivisor === 1000000000000000000n, "USDCX Divisor is not 1000000000000000000");

// For debugging/interest
const USDCBalanceBefore = await USDCContract.balanceOf(SENDER_ADDR);
//console.log("USDCBalanceBefore", USDCBalanceBefore);
//console.log("USDCBalanceBefore Formatted", USDCBalanceBefore / USDCDivisor);
const USDCXBalanceBefore = await USDCXContract.balanceOf(SENDER_ADDR);
//console.log("USDCXBalanceBefore", USDCXBalanceBefore);
//console.log("USDCXBalanceBefore Formatted", USDCXBalanceBefore / USDCXDivisor);

// The yearly USDC funding amount is $1,200,000
const TOTAL_YEARLY_FUNDING = 1200000n;
// The upfront allowance is $100,000 USDC, 1 months worth of funding.
const UPFRONT_USDC_ALLOWANCE = 100000n;
// The amount that we will increase the autowrap allowance by is $1,100,000 USDC, 11 months worth of funding.
// INCREASE - the autowrap strategy is used by '[EP5.2] [Executable] Commence Streams for Service Providers' too.
// See https://www.tally.xyz/gov/ens/proposal/63865530602418424570813160277709124551851041237648860550576561576702951975816
const AUTOWRAP_ALLOWANCE = TOTAL_YEARLY_FUNDING - UPFRONT_USDC_ALLOWANCE;
assert(AUTOWRAP_ALLOWANCE === 1100000n, "Autowrap allowance is not 1100000");

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
    assert(USDCAllowanceBefore === 0n, "USDC Allowance Before is not 0");

    // We need to add the appropriate number of 0's for the USDC contract, 6
    const USDC_ALLOWANCE_AMOUNT = UPFRONT_USDC_ALLOWANCE * USDCDivisor;
    assert(USDC_ALLOWANCE_AMOUNT === 100000000000n, "USDC Allowance Amount is not 100000000000");

    // Generate the calldata for calling the approve function
    const approveAllowanceArguments = [USDCX_ADDR, USDC_ALLOWANCE_AMOUNT];
    const approveAllowanceCalldata = USDCContract.interface.encodeFunctionData("approve", approveAllowanceArguments);
    
    // Log the calldata
    console.log("-------------------");
    console.log("approveAllowanceArguments");
    console.log("-------------------");
    console.log(approveAllowanceArguments);
    console.log("-------------------");
    console.log("approveAllowanceCalldata");
    console.log("-------------------");
    console.log(approveAllowanceCalldata);
    console.log("-------------------");

    //////////////////////////////////////////////
    // Comparison with '[EP5.2] [Executable] Commence Streams for Service Providers'
    //////////////////////////////////////////////
    // They did
    // 0x095ea7b30000000000000000000000001ba8603da702602a8657980e825a6daa03dee93a00000000000000000000000000000000000000000000000000000045d964b800
    //////////////////////////////////////////////
    // We do
    // 0x095ea7b30000000000000000000000001ba8603da702602a8657980e825a6daa03dee93a000000000000000000000000000000000000000000000000000000174876e800
    //////////////////////////////////////////////

    // Send the transaction from the ENS DAO wallet to the USDC contract address
    const approveAllowanceTx = await impersonatedSigner.sendTransaction({
        to: USDC_ADDR,
        from: SENDER_ADDR,
        data: approveAllowanceCalldata,
    });

    const approveReceipt = await approveAllowanceTx.wait();

    //Check that the allowance has been set correctly
    const USDCAllowanceAfter = await USDCContract.allowance(SENDER_ADDR, USDCX_ADDR);
    assert(USDCAllowanceAfter === USDC_ALLOWANCE_AMOUNT, "USDC Allowance After is not 100000000000");

    // Format output
    console.log("");
    console.log("");

    // Return the calldata
    return approveAllowanceCalldata;
}

/**
 * This function 'upgrades' $100,000 USDC from the ENS DAO wallet/'Timelock' to USDCX.
 * This is possible after setting the allowance in the approveUSDCX function.
 * Afterwards the ENS DAO wallet will have $100,000 more USDCX, and $100,000 less USDC.
 */
export const upgradeUSDC = async () => {

    console.log("-------------------");
    console.log("-------------------");
    console.log("2. upgradeUSDC");
    console.log("-------------------");
    console.log("-------------------");

    const USDC_UPGRADE_AMOUNT = UPFRONT_USDC_ALLOWANCE * USDCDivisor;
    assert(USDC_UPGRADE_AMOUNT === 100000000000n, "USDC Upgrade Amount is not 100000000000");
    const upgradeUSDCArguments = [USDC_UPGRADE_AMOUNT];
    const upgradeUSDCCalldata = USDCXContract.interface.encodeFunctionData("upgrade", upgradeUSDCArguments);

    // Log the calldata
    console.log("-------------------");
    console.log("upgradeUSDCArguments");
    console.log("-------------------");
    console.log(upgradeUSDCArguments);
    console.log("-------------------");
    console.log("upgradeUSDCCalldata");
    console.log("-------------------");
    console.log(upgradeUSDCCalldata);
    console.log("-------------------");

    // The USDCX balance of the DAO wallet is affected independently of this executable - this could be anything
    const USDCXBalanceBeforeUpgrade = await USDCXContract.balanceOf(SENDER_ADDR);
    //console.log("USDCXBalanceBeforeUpgrade", USDCXBalanceBeforeUpgrade / USDCXDivisor);

    //////////////////////////////////////////////
    // Comparison with '[EP5.2] [Executable] Commence Streams for Service Providers'
    //////////////////////////////////////////////
    // They did
    // 0x45977d03000000000000000000000000000000000000000000003f870857a3e0e3800000
    //////////////////////////////////////////////
    // We do
    // 0x45977d0300000000000000000000000000000000000000000000152d02c7e14af6800000
    //////////////////////////////////////////////

    // Send the transaction
    const upgradeUSDCTx = await impersonatedSigner.sendTransaction({
        to: USDCX_ADDR,
        from: SENDER_ADDR,
        data: upgradeUSDCCalldata,
    });

    const upgradeReceipt =  await upgradeUSDCTx.wait();

    upgradeReceipt.logs.forEach((log) => {
        try {
            const parsedLog = USDCXContract.interface.parseLog(log);
            console.log("Parsed Log:", parsedLog.signature, parsedLog.args);
        } catch (error) {
            console.error("Log not related to this contract:", error);
        }
    });

    const USDCXBalanceAfterUpgrade = await USDCXContract.balanceOf(SENDER_ADDR);

    //USDCX has 18 decimals, USDC has 6. The before/after assertion needs to made considering the conversion.
    const USDCX_UPGRADE_AMOUNT = UPFRONT_USDC_ALLOWANCE * USDCXDivisor;
    const USDCX_BALANCE_DIFFERENCE = ((USDCXBalanceBeforeUpgrade + USDCX_UPGRADE_AMOUNT) - USDCXBalanceAfterUpgrade) / USDCXDivisor;
    assert(USDCX_BALANCE_DIFFERENCE == 100000n, "Formatted USDCX Balance After Upgrade is not 100000n");

    // Format output
    console.log("");
    console.log("");

    // Return the calldata
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
    // "There are 31,556,926 seconds in a year. While leap years account for most of the drift, 
    // you must skip a leap year in years that are divisible by 100 and not divisible by 400 to 
    // account for the slight variation. Then we also add leap seconds every now and again. 
    // We had one in 2016."
    const SECONDS_IN_YEAR = 31556926n;
    const USD_PER_SECOND = (USD_PER_YEAR * USDCXDivisor) / SECONDS_IN_YEAR;
    assert(USD_PER_SECOND === 38026517538495352n, "USD Per Second is not 38026517538495352");

    // Generate the calldata for calling the setFlowrate function
    const setFlowrateArguments =         [
        USDCX_ADDR, 
        UNRUGGABLE_ADDR, 
        USD_PER_SECOND
    ];
    const setFlowrateCalldata = SuperfluidContract.interface.encodeFunctionData(
        "setFlowrate", 
        setFlowrateArguments
    );

    // Log the calldata
    console.log("-------------------");
    console.log("setFlowrateArguments");
    console.log("-------------------");
    console.log(setFlowrateArguments);
    console.log("-------------------");
    console.log("setFlowrateCalldata");
    console.log("-------------------");
    console.log(setFlowrateCalldata);
    console.log("-------------------");

    //////////////////////////////////////////////
    // Comparison with '[EP5.2] [Executable] Commence Streams for Service Providers'
    //////////////////////////////////////////////
    // They did
    // 0x57e6aa36
    // 0000000000000000000000001ba8603d
    // a702602a8657980e825a6daa03dee93a
    // 000000000000000000000000b162bf7a
    // 7fd64ef32b787719335d06b2780e31d1
    // 00000000000000000000000000000000
    // 000000000000000001958f989989a980
    //////////////////////////////////////////////
    // We do
    // 0x57e6aa36
    // 0000000000000000000000001ba8603d
    // a702602a8657980e825a6daa03dee93a
    // 00000000000000000000000064ca550f
    // 78d6cc711b247319cc71a04a166707ab
    // 00000000000000000000000000000000
    // 0000000000000000008718ea8ded5b78
    //////////////////////////////////////////////

    // Send the transaction
    const tx = await impersonatedSigner.sendTransaction({
        to: SUPERFLUID_ADDR,
        from: SENDER_ADDR,
        data: setFlowrateCalldata,
    });

    // Wait for confirmation
    const setFlowrateReceipt = await tx.wait();

    const flowRate = await SuperfluidContract.getFlowrate(USDCX_ADDR, SENDER_ADDR, UNRUGGABLE_ADDR);
    assert(flowRate === 38026517538495352n, "Flowrate is not 38026517538495352");

    // Format output
    console.log("");
    console.log("");

    // Return the calldata
    return setFlowrateCalldata;
}

/**
 * This function INCREASES the amount of USDC (owned by the ENS DAO wallet/Timelock) that the Autowrap strategy contract is able to spend.
 * The increase is $1,100,000 USDC which covers the remaining 11 months of funding.
 * The allowance is specifically INCREASED rather than explicitly SET noting that the Autowrap strategy is used by 
 * '[EP5.2] [Executable] Commence Streams for Service Providers' too.
 */
export const increaseAutowrapAllowance = async () => {

    console.log("-------------------");
    console.log("-------------------");
    console.log("4. increaseAutowrapAllowance");
    console.log("-------------------");
    console.log("-------------------");

    // The USDC balance of the DAO wallet is affected independently of this executable - this could be anything
    const USDCAllowanceBefore = await USDCContract.allowance(SENDER_ADDR, AUTOWRAP_STRATEGY_ADDR);
    console.log("Autowrap USDCAllowanceBefore", USDCAllowanceBefore);


    // We need to add the appropriate number of 0's for the USDC contract, 6
    const USDC_ALLOWANCE_INCREMENT_AMOUNT = AUTOWRAP_ALLOWANCE * USDCDivisor;
    assert(USDC_ALLOWANCE_INCREMENT_AMOUNT === 1100000000000n, "USDC Allowance Amount is not 1100000000000");

    // Generate the calldata for calling the approve function
    const increaseAutowrapAllowanceArguments = [
        AUTOWRAP_STRATEGY_ADDR,
        USDC_ALLOWANCE_INCREMENT_AMOUNT
    ];
    const increaseAutowrapAllowanceCalldata = USDCContract.interface.encodeFunctionData(
        "increaseAllowance", 
        increaseAutowrapAllowanceArguments
    );
    
    // Log the calldata
    console.log("-------------------");
    console.log("increaseAutowrapAllowanceArguments");
    console.log("-------------------");
    console.log(increaseAutowrapAllowanceArguments);
    console.log("-------------------");
    console.log("increaseAutowrapAllowanceCalldata");
    console.log("-------------------");
    console.log(increaseAutowrapAllowanceCalldata);
    console.log("-------------------");

    //////////////////////////////////////////////
    // No comparison available
    //////////////////////////////////////////////
    // We do
    // 0x395093510000000000000000000000001d65c6d3ad39d454ea8f682c49ae7744706ea96d000000000000000000000000000000000000000000000000000001001d1bf800
    //////////////////////////////////////////////

    // Send the transaction from the ENS DAO wallet to the USDC contract address
    const increaseAutowrapAllowanceTx = await impersonatedSigner.sendTransaction({
        to: USDC_ADDR,
        from: SENDER_ADDR,
        data: increaseAutowrapAllowanceCalldata,
    });

    const increaseAutowrapAllowanceReceipt = await increaseAutowrapAllowanceTx.wait();

    //Check that the allowance has been set correctly
    const USDCAllowanceAfter = await USDCContract.allowance(
        SENDER_ADDR, 
        AUTOWRAP_STRATEGY_ADDR
    );
    console.log("Autowrap USDCAllowanceAfter", USDCAllowanceAfter);
    assert(USDCAllowanceAfter === USDCAllowanceBefore + USDC_ALLOWANCE_INCREMENT_AMOUNT, `USDC Allowance After is not correct`);

    // Format output
    console.log("");
    console.log("");

    // Return the calldata
    return increaseAutowrapAllowanceCalldata;
}