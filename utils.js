import axios from 'axios';
import { SENDER_ADDR } from './addresses';
import { Foundry } from '@adraffy/blocksmith';


let foundry = null;
let impersonatedSigner = null;

export const init = async () => {

    if (!foundry || !impersonatedSigner) {

        const PROVIDER_URL = `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`;

        foundry = await Foundry.launch({
            infoLog: false,
            fork: PROVIDER_URL,
        });

        await foundry.provider.send('anvil_impersonateAccount', [
            SENDER_ADDR
        ]);

        // Get a signer for the impersonated address
        impersonatedSigner = await foundry.provider.getSigner(SENDER_ADDR);
    }

    return { foundry, impersonatedSigner };
}

export const simulateTransactionBundle = async (transactions) => {

    const API_KEY = process.env.TENDERLY_API_KEY;
    const USERNAME = process.env.TENDERLY_USERNAME;
    const PROJECT = process.env.TENDERLY_PROJECT;
  
    const url = `https://api.tenderly.co/api/v1/account/${USERNAME}/project/${PROJECT}/simulate-bundle`;
  
    const payload = {
      network_id: "1",
      block_number: "latest",
      simulations: transactions,
    };
  
    try {
      const response = await axios.post(url, payload, {
        headers: {
          "X-Access-Key": API_KEY,
          "Content-Type": "application/json"
        }
      });
  
      console.log("Simulation Results:", response.data);
    } catch (error) {
      console.error("Error during simulation:", error.response?.data || error.message);
    }
};