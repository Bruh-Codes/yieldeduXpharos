import { cookieStorage, createStorage } from "@wagmi/core";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { defineChain } from "@reown/appkit/networks";
// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
if (!projectId) {
	throw new Error("PROJECT_ID environment variable is not defined");
}

export const pharosTestnet = defineChain({
	id: 50002,
	name: "pharos Devnet",
	chainNamespace: "eip155",
	caipNetworkId: "eip155:50002",
	nativeCurrency: {
		name: "pharos",
		symbol: "PTT",
		decimals: 18,
	},

	testnet: true,
	rpcUrls: {
		default: {
			http: ["https://devnet.dplabs-internal.com/"],
		},
	},
	blockExplorers: {
		default: {
			name: "Pharos",
			url: "https://pharosscan.xyz",
		},
	},
});

export const networks = [pharosTestnet];

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
	storage: createStorage({
		storage: cookieStorage,
	}),
	ssr: true,
	projectId,
	networks,
});

export const config = wagmiAdapter.wagmiConfig;
