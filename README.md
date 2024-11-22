# Decentralized Compute Resource Sharing Platform

This project implements a blockchain-based Decentralized Compute Resource Sharing platform using Clarity smart contracts on the Stacks blockchain. It allows users to share and monetize their excess computing resources, with smart contracts managing resource allocation, pricing, and payments.

## Features

- Provider registration and management
- Consumer fund management
- Resource allocation and job management
- Earnings distribution and withdrawal for providers
- Comprehensive test suite using Vitest

## Prerequisites

Before you begin, ensure you have met the following requirements:

- [Node.js](https://nodejs.org/) (v14 or later)
- [Clarinet](https://github.com/hirosystems/clarinet) (for Clarity smart contract development)
- [Vitest](https://vitest.dev/) (for testing)

## Installation

1. Clone the repository:
   \`\`\`
   git clone https://github.com/your-username/compute-sharing.git
   cd compute-sharing
   \`\`\`

2. Install the dependencies:
   \`\`\`
   npm install
   \`\`\`

3. Set up Clarinet:
   \`\`\`
   clarinet new
   \`\`\`

## Usage

### Deploying the Smart Contract

1. Copy the \`compute-sharing.clar\` file to the \`contracts\` directory in your Clarinet project.

2. Deploy the contract using Clarinet:
   \`\`\`
   clarinet deploy
   \`\`\`

### Interacting with the Contract

You can interact with the contract using Clarinet's console or by building a frontend application. Here are some example interactions:

1. Register as a provider:
   \`\`\`
   (contract-call? .compute-sharing register-provider u1000 u10)
   \`\`\`

2. Add funds as a consumer:
   \`\`\`
   (contract-call? .compute-sharing add-funds u1000)
   \`\`\`

3. Request compute resources:
   \`\`\`
   (contract-call? .compute-sharing request-compute 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM u50)
   \`\`\`

4. Complete a job (as a provider):
   \`\`\`
   (contract-call? .compute-sharing complete-job u1)
   \`\`\`

5. Withdraw earnings (as a provider):
   \`\`\`
   (contract-call? .compute-sharing withdraw-earnings)
   \`\`\`

## Smart Contract Functions

1. \`register-provider\`: Registers a new provider with available resources and price per unit.
2. \`update-provider\`: Updates an existing provider's resources and pricing.
3. \`add-funds\`: Allows consumers to add funds to their account.
4. \`request-compute\`: Enables consumers to request compute resources from a provider.
5. \`complete-job\`: Allows providers to mark a job as completed and receive payment.
6. \`withdraw-earnings\`: Enables providers to withdraw their accumulated earnings.

## Testing

To run the tests for the smart contract, use Vitest:

\`\`\`
npm test
\`\`\`

## Contributing

Contributions to the Decentralized Compute Resource Sharing platform are welcome. Please follow these steps to contribute:

1. Fork the repository
2. Create a new branch (\`git checkout -b feature/amazing-feature\`)
3. Make your changes
4. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
5. Push to the branch (\`git push origin feature/amazing-feature\`)
6. Open a Pull Request

## License

This project is licensed under the MIT License. See the \`LICENSE\` file for details.

## Contact

If you have any questions or feedback, please open an issue on the GitHub repository.

Happy computing!
