"use client";

import { config } from "@/lib/wagmi";
import { readContracts } from "@wagmi/core";
import { useEffect, useState } from "react";
import { erc20Abi } from "viem";
import { useBalance } from "wagmi";

export const useGetAllowedTokens = (data: `0x${string}`[]) => {
	const [tokenDetails, setTokenDetails] = useState<
		{ address: `0x${string}`; name: string; symbol: string }[]
	>([]);

	useEffect(() => {
		const fetchTokenDetails = async () => {
			if ([...data]?.length > 0) {
				const contracts = data
					.map((tokenAddress) => [
						{
							address: tokenAddress,
							abi: erc20Abi,
							functionName: "name",
						},
						{
							address: tokenAddress,
							abi: erc20Abi,
							functionName: "symbol",
						},
					])
					.flat();

				try {
					const results = await readContracts(config, {
						allowFailure: false,
						contracts,
					});

					const details = data.map((tokenAddress, index) => ({
						address: tokenAddress,
						name: results[index * 2] as string, // `name` result cast to string
						symbol: results[index * 2 + 1] as string, // `symbol` result cast to string
					}));

					setTokenDetails(details);
				} catch (error) {
					console.error("Error fetching token details:", error);
				}
			}
		};

		fetchTokenDetails();
	}, [data]);

	return { tokenDetails };
};

export const useGetBallance = (
	walletAddress: `0x${string}`,
	tokenAddress: `0x${string}`
) => {
	const results = useBalance({
		address: walletAddress as unknown as `0x${string}`,
		token: tokenAddress,
	});

	return results;
};
