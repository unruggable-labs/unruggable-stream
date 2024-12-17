# Unruggable Funding Proposal

- Install dependencies with `bun i`

- Create an Infura account.
- Set `INFURA_API_KEY` in `.env`

- Create an Tenderly account.
- Create a project within that account.
- Set `TENDERLY_API_KEY`, `TENDERLY_USERNAME`, and `TENDERLY_PROJECT` in `.env`

- Run `bun run run-it.ts`

## Simulations

**USDC Stream**
- `approve` - https://www.tdly.co/shared/simulation/7a33ba80-767d-4764-891f-b93690ad7b25
- `upgrade` - https://www.tdly.co/shared/simulation/d564e4b9-3c5d-4e90-91f7-9ae78e32fbd1
- `setFlowrate` - https://www.tdly.co/shared/simulation/725d872b-8174-4fa5-a60b-5d45eea1812f
- `increaseAllowance` - https://www.tdly.co/shared/simulation/d94d705b-0025-4500-b5d0-e4eba5221abe

**ENS Stream**
- `approve` - https://www.tdly.co/shared/simulation/82838efa-2dda-4660-abf7-991f2787388a
- `batchVestingPlans` - https://www.tdly.co/shared/simulation/d33f9323-8ec0-4402-a458-265b7fa546f7