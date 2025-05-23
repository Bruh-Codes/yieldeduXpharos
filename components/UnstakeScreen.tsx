"use client";

import { toast } from "@/hooks/use-toast";
import { getDynamicGasPrice, getYieldPoolConfig } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useWriteContract } from "wagmi";
import {
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { removeTransaction } from "@/utils/supabase/helpers";

const UnstakeScreen = ({
	amount,
	expectedYield,
	position_id,
	setShowWithDrawModal,
	transaction_hash,
	owner,
}: {
	amount?: number;
	expectedYield?: number;
	position_id: string | null;
	setShowWithDrawModal: Dispatch<SetStateAction<boolean>>;
	transaction_hash?: string;
	owner?: string;
}) => {
	const queryClient = useQueryClient();

	let penalty;
	let amountToReturn;
	if (amount) {
		penalty = amount / 10; // 10% penalty
		amountToReturn = amount - penalty;
	}

	const {
		writeContract: Unstake,
		isPending: unstakePending,
		error: unstakeError,
		isError: isUnstakeError,
	} = useWriteContract();

	const [unstakeLoading, setUnstakeLoading] = useState(false);

	useEffect(() => {
		if (isUnstakeError) {
			setUnstakeLoading(false);
			console.log(unstakeError);
			toast({
				variant: "destructive",
				title: "Unstake error",
				description: "An error occurred try again",
			});
		}
	}, [isUnstakeError, unstakeError]);

	useEffect(() => {
		if (unstakePending) {
			setUnstakeLoading(false);
		}
	}, [unstakePending]);

	const handleUnstake = async () => {
		setUnstakeLoading(true);
		try {
			const gas = await getDynamicGasPrice();

			Unstake(
				{ ...getYieldPoolConfig("unstake", [position_id]), gas },
				{
					async onSuccess() {
						const { error } = await removeTransaction(
							transaction_hash!,
							owner!
						);
						if (error) {
							console.log(error);
						}

						setUnstakeLoading(false);
						await queryClient.invalidateQueries();

						toast({
							title: "Transaction Successful",
							description: "Unstake was a success",
						});
						window.history.pushState({}, "", `/dashboard`);
						setShowWithDrawModal(false);
					},
					onError(error) {
						console.log(error);
						toast({
							variant: "destructive",
							title: "Transaction Rejected",
							description: "something went wrong",
						});
					},
				}
			);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			console.log(error);
			setUnstakeLoading(false);
		}
	};

	const isPending = unstakePending || unstakeLoading;
	return (
		<DialogContent className="m-2 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/40">
			<DialogHeader>
				<DialogTitle className="text-foreground">Unstake</DialogTitle>
				<DialogDescription className="space-y-4 pt-3 text-red-400">
					Continuing this process will result in a 10% penalty on your staked
					amount, reducing your expected yields.
				</DialogDescription>
			</DialogHeader>
			<div className="flex items-center gap-3 w-full">
				<div className="bg-slate-200 dark:bg-[#1A103D] w-full p-4 rounded-lg border border-slate-200 dark:border-slate-700/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500">
					<p className="text-sm text-slate-400">Deposited</p>
					<p className="text-xl font-bold">
						{amount ? `${amount} FYT` : "N/A"}
					</p>
				</div>
				<div className="bg-slate-200 dark:bg-[#1A103D] w-full p-4 rounded-lg border border-slate-200 dark:border-slate-700/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500">
					<p className="text-sm  text-slate-400">Current Yield</p>
					<p className="text-xl font-bold">
						{expectedYield ? `${Number(expectedYield).toFixed(8)} FYT` : "N/A"}
					</p>
				</div>
			</div>
			<div className="bg-slate-300 dark:bg-slate-700/50 w-full p-4 rounded-lg border border-slate-200 dark:border-slate-700/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500">
				<p className="text-sm  text-slate-400">Expected Earn</p>
				<p className="text-xl font-bold">
					{amountToReturn ? `${Number(amountToReturn).toFixed(4)} FYT` : "N/A"}
				</p>
			</div>
			<Button
				disabled={isPending}
				onClick={handleUnstake}
				type="button"
				variant={"default"}
				className="w-full bg-gradient-to-r from-sky-500 to-yellow-500 text-slate-800 font-semibold hover:opacity-90"
			>
				<>
					{isPending && (
						<div className="size-6 rounded-full animate-[spin_0.5s_linear_infinite] border-b-transparent border-[3px] border-white" />
					)}
					{unstakeLoading
						? "Please wait..."
						: unstakePending
						? "Waiting for approval..."
						: "Unstake"}
				</>
			</Button>
		</DialogContent>
	);
};

export default UnstakeScreen;
