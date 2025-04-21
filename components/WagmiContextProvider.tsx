"use client";

import { wagmiAdapter, projectId, pharosTestnet } from "@/lib/wagmi";
import { createAppKit } from "@reown/appkit/react";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";
// import { arbitrum } from "@reown/appkit/networks";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { yieldEduMetadata } from "@/utils/metadata";

if (!projectId) {
	throw new Error("Project ID is not defined");
}

const clientFromReactQuery = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			refetchOnReconnect: true,
		},
	},
});

const metadata = {
	...yieldEduMetadata,
	name: " YieldPharos",
	description:
		"A decentralized education and a fixed-yield protocol that earns users guaranteed yields on their Pharos tokens.",
	url: "https://yieldpharos.vercel.app",
	icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

// the modal
createAppKit({
	adapters: [wagmiAdapter],
	projectId,
	networks: [pharosTestnet],
	defaultNetwork: pharosTestnet,
	metadata,
	features: {
		analytics: true, // Optional - defaults to Cloud configuration
		socials: false,
		swaps: false,
		onramp: false,
		receive: true,
	},
	themeMode: "dark",
	allWallets: "SHOW",
	themeVariables: {
		"--w3m-accent": "#0ea5e9",
	},
});

const WagmiContextProvider = ({
	children,
	cookies,
}: {
	children: React.ReactNode;
	cookies: string | null;
}) => {
	const initialState = cookieToInitialState(
		wagmiAdapter.wagmiConfig as Config,
		cookies
	);

	return (
		<>
			<WagmiProvider
				config={wagmiAdapter.wagmiConfig as Config}
				initialState={initialState}
			>
				<QueryClientProvider client={clientFromReactQuery}>
					{children}
					<ReactQueryDevtools initialIsOpen={false} />
				</QueryClientProvider>
			</WagmiProvider>
		</>
	);
};

export default WagmiContextProvider;
