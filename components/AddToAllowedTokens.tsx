/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useSimulateContract, useWriteContract } from "wagmi";
import { getYieldPoolConfig } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const AddToAllowedTokens = () => {
	const [tokenAddress, setTokenAddress] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const { data: addTokenSimulator, error: addTokenSimulatorError } =
		useSimulateContract({
			...getYieldPoolConfig("addAllowedTokens", [tokenAddress]),

			query: {
				enabled: !!tokenAddress,
			},
		});

	useEffect(() => {
		if (addTokenSimulatorError) {
			console.log(addTokenSimulatorError);

			setIsLoading(false);
			toast({
				variant: "destructive",
				title: "Error adding token",
				description: addTokenSimulatorError.message,
			});
		}
	}, [addTokenSimulator, addTokenSimulatorError]);

	const {
		writeContract: addToAllowedTokens,
		isPending,
		isSuccess,
		isError,
		error,
	} = useWriteContract();

	useEffect(() => {
		if (isSuccess) {
			toast({
				variant: "default",
				title: "Token has been added to the contract",
				description: "Tokens have been minted successfully",
			});
			setIsLoading(false);
		}

		if (isError) {
			setIsLoading(false);
			console.error("addToken error:", error);

			toast({
				variant: "destructive",
				title: "Token adding Failed",
				description: "An error Occurred when adding token",
			});
		}
	}, [error, isError, isSuccess]);

	const handleAddToken = async () => {
		if (!tokenAddress) return;

		setIsLoading(true);
		try {
			if (addTokenSimulator)
				addToAllowedTokens({
					...getYieldPoolConfig("addAllowedTokens", [tokenAddress]),
				});
		} catch (error: any) {
			setIsLoading(false);
			console.error("Error adding token:", error);
		}
	};
	return (
		<div className="dark:bg-gradient-to-r from-[#1A103D50] to-[#1A103D30] rounded-2xl p-6 border border-slate-200 dark:border-slate-700/40 shadow-sm relative overflow-hidden">
			<div className="absolute bg-white dark:bg-transparent inset-0 dark:bg-gradient-to-r from-sky-400/10 to-yellow-400/10 dark:opacity-20"></div>
			<div className="relative flex flex-col sm:flex-row gap-5 items-end justify-between">
				<div className="flex flex-col w-full gap-4">
					<h2 className="text-md md:text-xl text-foreground font-semibold mb-1">
						Add A token to Allowed Tokens
					</h2>
					<Input
						disabled={isPending || isLoading}
						type="text"
						required
						placeholder="token address"
						value={tokenAddress}
						onChange={(e) => setTokenAddress(e.target.value)}
						className="bg-slate-100 dark:bg-[#1A103D] border-slate-200 dark:border-slate-700/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:!ring-slate-500 dark:focus:!ring-sky-500 focus:!border-transparent focus:ring-offset-2 dark:ring-offset-sky-700 ring-offset-slate-700"
					/>
				</div>
				<Button
					disabled={isPending || isLoading}
					onClick={handleAddToken}
					className="w-fit bg-gradient-to-r from-sky-500 to-yellow-500 text-slate-800 font-semibold hover:opacity-90"
				>
					{isPending || isLoading ? (
						<>
							<div className="size-5 rounded-full animate-[spin_0.5s_linear_infinite] border-b-transparent border-[3px] border-green-950" />
							please wait...
						</>
					) : (
						"Add Token"
					)}
				</Button>
			</div>
		</div>
	);
};

export default AddToAllowedTokens;
