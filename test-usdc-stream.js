import { Foundry } from '@adraffy/blocksmith';
import { Contract } from 'ethers';

//Superfluid contract
const HOST_ADDR = "0x4E583d9390082B65Bef884b629DFA426114CED6d";

//ERC20 Token contract addresses
const USDC_ADDR = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDCX_ADDR = "0x1BA8603DA702602A8657980e825A6DAa03Dee93a";

const UNRUGGABLE_ADDRESS = "0x64Ca550F78d6Cc711B247319CC71A04A166707Ab";

/**
 * Contract address: 
 * The CFAv1Forwarder contract provides an easy to use interface to
 * ConstantFlowAgreementV1 specific functionality of Super Tokens.
 * Instances of this contract can operate on the protocol only if configured as "trusted forwarder"
 * by protocol governance.
 */
// Previously called CFA_FWD_ADDR
const SUPERFLUID_ADDR = "0xcfA132E353cB4E398080B9700609bb008eceB125";

//Stream management pod. Unused.
const STEWARDS_SAFE = "0xB162Bf7A7fD64eF32b787719335d06B2780e31D1";

//ENS DAO Wallet
const SENDER = "0xFe89cc7aBB2C4183683ab71653C4cdc9B02D44b7";

//Autowrap contract addresses
const AUTOWRAP_MGR_ADDR = "0x30aE282CF477E2eF28B14d0125aCEAd57Fe1d7a1";
const AUTOWRAP_STRATEGY_ADDR = "0x1D65c6d3AD39d454Ea8F682c49aE7744706eA96d";

const PROVIDER_URL = `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`;

const foundry = await Foundry.launch({
    infoLog: false,
    fork: PROVIDER_URL,
});

await foundry.provider.send('anvil_impersonateAccount', [
    SENDER
]);

// Get a signer for the impersonated address
const impersonatedSigner = await foundry.provider.getSigner(SENDER);

// function setFlowrate(address SuperUSDC, address StreamManagementPod, int96 114155251141552512)

const SUPERFLUID_ABI = [
    "function setFlowrate(address tokenAddress, address receiverAddress, int96 amountPerSecond)",
    "function getFlowrate(address tokenAddress, address sender, address receiver) external view returns (int96)"
];

const superfluidContract =  new Contract(SUPERFLUID_ADDR, SUPERFLUID_ABI, foundry.provider);

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
];

const USDCX_ABI = [
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

const USDCContract =  new Contract(USDC_ADDR, ERC20_ABI, foundry.provider);
const USDCXContract =  new Contract(USDCX_ADDR, USDCX_ABI, foundry.provider);

const underlyingToken = await USDCXContract.getUnderlyingToken();
console.log("Underlying Token:", underlyingToken);

const USDCDecimals = await USDCContract.decimals();
const USDCXDecimals = await USDCXContract.decimals();

console.log("USDC Decimals:", USDCDecimals);
console.log("USDCX Decimals:", USDCXDecimals);

const USDCDivisor = BigInt(10) ** USDCDecimals; // Convert to BigInt
const USDCXDivisor = BigInt(10) ** USDCXDecimals; // Convert to BigInt

const USDCBalanceBefore = await USDCContract.balanceOf(SENDER);
console.log("USDCBalanceBefore", USDCBalanceBefore);
console.log("USDCBalanceBefore Formatted", USDCBalanceBefore / USDCDivisor);

const USDCXBalanceBefore = await USDCXContract.balanceOf(SENDER);
console.log("USDCXBalanceBefore", USDCXBalanceBefore);
console.log("USDCXBalanceBefore Formatted", USDCXBalanceBefore / USDCXDivisor);

// The yearly USDC funding amount is $1,200,000
const TOTAL_YEARLY_FUNDING = 1200000n;

// The upfront allowance is $100,000 USDC, 1 months worth of funding.
const UPFRONT_USDC_ALLOWANCE = 100000n;

const AUTOWRAP_ALLOWANCE = TOTAL_YEARLY_FUNDING - UPFRONT_USDC_ALLOWANCE;


const WRAP_MANAGER_ABI = [
    "function createWrapSchedule(address superToken, address strategy, address liquidityToken, uint64 expiry, uint64 lowerLimit, uint64 upperLimit)"
];

const AutowrapManagerContract = new Contract(AUTOWRAP_MGR_ADDR, WRAP_MANAGER_ABI, foundry.provider);

/**
 * This function approves the Super USDCX contract to spend $100,000 of USDC on behalf of the sender, the ENS DAO wallet.
 */
const approveUSDCX = async () => {
        
    console.log("-------------------");
    console.log("-------------------");
    console.log("1. approveUSDCX");
    console.log("-------------------");
    console.log("-------------------");

    // Check the allowance before. Should be 0.
    const USDCAllowanceBefore = await USDCContract.allowance(SENDER, USDCX_ADDR);
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
        from: SENDER,
        data: approveAllowanceCalldata,
    });

    await approveAllowanceTx.wait();

    //Check that the allowance has been set correctly
    const USDCAllowanceAfter = await USDCContract.allowance(SENDER, USDCX_ADDR);
    console.log("USDCAllowanceAfter", USDCAllowanceAfter);

    console.log("");
    console.log("");

    return approveAllowanceCalldata;
}

/**
 * This function 'upgrades' $100,000 USDC (that we just allowed) to USDCX.
 * Afterswards the ENS DAO wallet will have $100,000 more USDCX.
 */
const upgradeUSDC = async () => {

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

    const USDCXBalanceBeforeUpgrade = await USDCXContract.balanceOf(SENDER);
    console.log("USDCXBalanceBeforeUpgrade", USDCXBalanceBeforeUpgrade / USDCXDivisor);

    // They did 
    // 0x45977d03000000000000000000000000000000000000000000003f870857a3e0e3800000
    // We did
    // 0x45977d0300000000000000000000000000000000000000000000152d02c7e14af6800000

    // Send the transaction
    const upgradeUSDCTx = await impersonatedSigner.sendTransaction({
        to: USDCX_ADDR,
        from: SENDER,
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

    const USDCXBalanceAfterUpgrade = await USDCXContract.balanceOf(SENDER);
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
const setFlowrate = async () => {

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
        [USDCX_ADDR, UNRUGGABLE_ADDRESS, USD_PER_SECOND]
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
        from: SENDER,
        data: setFlowrateCalldata,
    });

    console.log("Transaction Hash:", tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("Transaction Confirmed:", receipt.hash);

    //int96 expectedFlowRate = 114155251141550940;
    const flowRate = await superfluidContract.getFlowrate(USDCX_ADDR, SENDER, UNRUGGABLE_ADDRESS);
    console.log("Flow Rate:", flowRate);

    console.log("");
    console.log("");

    return setFlowrateCalldata;
}


const approveAutowrap = async () => {

    console.log("-------------------");
    console.log("-------------------");
    console.log("4. approveAutowrap");
    console.log("-------------------");
    console.log("-------------------");

    // Check the allowance before. Should be 0.
    const USDCAllowanceBefore = await USDCContract.allowance(SENDER, AUTOWRAP_STRATEGY_ADDR);
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
        from: SENDER,
        data: approveAutowrapAllowanceCalldata,
    });

    await approveAllowanceTx.wait();

    //Check that the allowance has been set correctly
    const USDCAllowanceAfter = await USDCContract.allowance(SENDER, AUTOWRAP_STRATEGY_ADDR);
    console.log("Autowrap USDCAllowanceAfter", USDCAllowanceAfter);

    console.log("");
    console.log("");

    return approveAutowrapAllowanceCalldata;
}


const createAutowrapSchedule = async () => {

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
        from: SENDER,
        data: createWrapScheduleCalldata,
    });

    await createWrapScheduleTx.wait();

    return createWrapScheduleCalldata;
}


const approveUSDCXCalldata = await approveUSDCX();
const upgradeUSDCCalldata = await upgradeUSDC();
const setFlowrateCalldata = await setFlowrate();
const approveAutowrapCalldata = await approveAutowrap();
//const createAutowrapCalldata = await createAutowrapSchedule();

console.log("------------------------------------------");
console.log("-------- CALL DATA FOR EXECUTABLE --------")
console.log("------------------------------------------");

console.log("------------------------------------------");
console.log(approveUSDCXCalldata);
console.log("------------------------------------------");
console.log(upgradeUSDCCalldata);
console.log("------------------------------------------");
console.log(setFlowrateCalldata);
console.log("------------------------------------------");
console.log(approveAutowrapCalldata);
console.log("------------------------------------------");
//console.log(createAutowrapCalldata);
//console.log("-------------------");