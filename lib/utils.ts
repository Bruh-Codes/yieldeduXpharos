/* eslint-disable @typescript-eslint/no-explicit-any */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import yieldTokenConfig from "@/solidity/artifacts/contracts/YieldToken.sol/YieldToken.json";
import yieldPoolConfig from "@/solidity/artifacts/contracts/YieldPool.sol/YieldPool.json";
import { Abi } from "viem";
import { getGasPrice } from "@wagmi/core";
import { config } from "./wagmi";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const YieldTokenAddress =
	"0x8D6444887c22Eb1A32De4299E507C62EbAb4004A" as `0x${string}`;
export const YieldPoolAddress =
	"0x835E7250A4E2ffc56F14AA171F0086Bc60A6D4eA" as `0x${string}`;

export const getYieldPoolConfig = (functionName: string, args?: any[]) => {
	return {
		abi: yieldPoolConfig.abi as Abi,
		address: YieldPoolAddress!,
		functionName: functionName,
		...(args && { args }),
	};
};
export const getYieldTokenConfig = (functionName: string, args?: any[]) => {
	return {
		abi: yieldTokenConfig.abi as Abi,
		address: YieldTokenAddress,
		functionName: functionName,
		...(args && { args }),
	};
};

export const getDynamicGasPrice = async () => {
	const gasPrice = await getGasPrice(config);
	return gasPrice;
};
