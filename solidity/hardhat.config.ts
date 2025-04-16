// import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";
import "@nomicfoundation/hardhat-verify";
import "@openzeppelin/hardhat-upgrades";

import { vars } from "hardhat/config";
const ACCOUNT_PRIVATE_KEY = vars.get("ACCOUNT_PRIVATE_KEY");
// const PHAROS_API_KEY = vars.get("PHAROS_API_KEY");

if (!ACCOUNT_PRIVATE_KEY) {
	throw new Error(
		`ACCOUNT_PRIVATE_KEY is not set. "use npx hardhat vars set ACCOUNT_PRIVATE_KEY"`
	);
}

// if (!PHAROS_API_KEY) {
// 	throw new Error(
// 		`PHAROS_API_KEY is not set. "use npx hardhat vars set PHAROS_API_KEY"`
// 	);
// }

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
		"pharos-testnet": {
			url: "https://devnet.dplabs-internal.com",
			accounts: [ACCOUNT_PRIVATE_KEY],
		},
	},

	etherscan: {
		apiKey: {},
		customChains: [
			{
				chainId: 50002,
				network: "pharos-testnet",
				urls: {
					apiURL: "",
					browserURL: "https://pharosscan.xyz",
				},
			},
		],
	},

	sourcify: {
		enabled: false,
	},
};

export default config;
