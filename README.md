# Unruggable Funding Proposal

- Install dependencies with `bun i`

- Create an Infura account.
- Set `INFURA_API_KEY` in `.env`

- Create an Tenderly account.
- Create a project within that account.
- Set `TENDERLY_API_KEY`, `TENDERLY_USERNAME`, and `TENDERLY_PROJECT` in `.env`

- Run `bun run run-it.ts`

## Example Simulations
If you don't want to run the Tenderly simulations, here are some examples:


**USDC Stream**
- `approve` - https://www.tdly.co/shared/simulation/6aefdafc-310a-4eba-800a-8eb17d09dcdc
- `upgrade` - https://www.tdly.co/shared/simulation/04eb112f-4433-4710-a72e-de9a8452a53b
- `setFlowrate` - https://www.tdly.co/shared/simulation/890cd8d9-ee3f-4218-a259-616e738b2d72
- `approve` - https://www.tdly.co/shared/simulation/b310bf57-151a-4ca1-a51a-829327dad6d2

**ENS Stream**
- `approve` - https://www.tdly.co/shared/simulation/8f7e0e2e-ce5a-4fe9-8533-9754296555c7
- `batchVestingPlans` - https://www.tdly.co/shared/simulation/4542cad7-0f17-4fa0-bedc-37290088892c