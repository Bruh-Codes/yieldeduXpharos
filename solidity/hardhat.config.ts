// import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";
import "@nomicfoundation/hardhat-verify";
import "@openzeppelin/hardhat-upgrades";

import { vars } from "hardhat/config";
const ACCOUNT_PRIVATE_KEY = vars.get("ACCOUNT_PRIVATE_KEY");
const PHAROS_API_KEY = vars.get("PHAROS_API_KEY");

if (!ACCOUNT_PRIVATE_KEY) {
	throw new Error(
		`ACCOUNT_PRIVATE_KEY is not set. "use npx hardhat vars set ACCOUNT_PRIVATE_KEY"`
	);
}

if (!PHAROS_API_KEY) {
	throw new Error(
		`PHAROS_API_KEY is not set. "use npx hardhat vars set PHAROS_API_KEY"`
	);
}

const config = {
	gasReporter: {
		enabled: false,
		outputFile: "gas-report.txt",
		noColors: true,
	},
	solidity: {
		version: "0.8.28",
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	networks: {
		"edu-testnet": {
			url: "https://rpc.open-campus-codex.gelato.digital",
			accounts: [ACCOUNT_PRIVATE_KEY],
			// gas: 600000000, // Set the gas limit here
			// gasPrice: "auto",
		},
	},

	etherscan: {
		apiKey: {
			"edu-testnet": PHAROS_API_KEY,
		},
		customChains: [
			{
				chainId: 656476,
				network: "edu-testnet",
				urls: {
					apiURL: "https://edu-chain-testnet.blockscout.com/api",
					browserURL: "https://edu-chain-testnet.blockscout.com",
				},
				gas: 600000000, // Set the gas limit here
				gasPrice: "auto",
			},
		],
	},

	sourcify: {
		enabled: false,
	},
};

export default config;
