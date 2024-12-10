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
- `approve` - https://www.tdly.co/shared/simulation/958f69ed-849d-4ed5-8816-b5a266b17fd7
- `upgrade` - https://www.tdly.co/shared/simulation/acac9227-189e-4a36-a4a2-a0c9d7bf6e51
- `setFlowrate` - https://www.tdly.co/shared/simulation/448484df-ff80-4113-a767-ef6a7438fc18
- `approve` - https://www.tdly.co/shared/simulation/10bc1cd4-7f16-41c7-89d7-093f19231fd6

**ENS Stream**
- `approve` - https://www.tdly.co/shared/simulation/f33f573d-459a-495b-9fdf-369a14b06c23
- `batchVestingPlans` - https://www.tdly.co/shared/simulation/b254299e-758f-4182-bf23-9d3b5d6306a2