"use client";

import React, { useEffect, useRef, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
	cn,
	getDynamicGasPrice,
	getYieldPoolConfig,
	getYieldTokenConfig,
	YieldPoolAddress,
	YieldTokenAddress,
} from "@/lib/utils";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { toast } from "@/hooks/use-toast";
import {
	useBalance,
	useReadContract,
	useSimulateContract,
	useWriteContract,
} from "wagmi";
import Modal from "./Modal";
import { parseEther } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { storeTransaction } from "@/utils/supabase/helpers";
import { ClassValue } from "clsx";

const StakingCard = ({
	className,
	children,
}: {
	className?: ClassValue;
	children?: React.ReactNode;
}) => {
	const [amount, setAmount] = useState("");
	const [lockDuration, setLockDuration] = useState(30);
	const [lockDurationCustom, setLockDurationCustom] = useState(0);
	const [showCustomInput, setShowCustomInput] = useState(false);
	const [customInputActive, setCustomInputActive] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const { isConnected, address } = useAppKitAccount();
	const durationInSeconds =
		Number(customInputActive ? lockDurationCustom : lockDuration) *
		24 *
		60 *
		60;
	const customInputRef = useRef<HTMLInputElement | null>(null);
	const buttonGridRef = useRef<HTMLDivElement>(null);
	const queryClient = useQueryClient();
	const { open } = useAppKit();
	const { data: allowance, refetch: refetchAllowance } = useReadContract({
		...getYieldTokenConfig("allowance", [address, YieldPoolAddress]),
	});

	// Approve hook
	const { writeContract: approve, isPending: isApprovePending } =
		useWriteContract();

	// Simulate approve
	const {
		data: approveSimulator,
		isError: isApproveError,
		error: approveError,
	} = useSimulateContract({
		...getYieldTokenConfig("approve", [
			YieldPoolAddress,
			parseEther(amount || "0"),
		]),
	});

	useEffect(() => {
		if (isApproveError) {
			console.error("Approval simulation error:", approveError);
		}
	}, [isApproveError, approveError]);

	const { writeContract: deposit, isPending: isDepositPending } =
		useWriteContract();

	const results = useBalance({
		address: address as unknown as `0x${string}`,
		token: YieldTokenAddress,
	});

	// Validate input
	const validateInput = () => {
		if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
			toast({
				variant: "destructive",
				title: "Invalid amount",
				description: "Please enter a valid amount greater than 0",
			});
			return false;
		}

		if (
			!durationInSeconds ||
			isNaN(Number(durationInSeconds)) ||
			Number(durationInSeconds) < 1
		) {
			toast({
				variant: "destructive",
				title: "Invalid duration",
				description: "Please enter a valid duration in days",
			});
			return false;
		}

		const hasBalance = results?.data?.formatted
			? Number(results?.data?.formatted) > 0
			: false;
		if (!hasBalance && isConnected) {
			setShowModal(true);
			return false;
		}

		return true;
	};

	const handleStake = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!isConnected) {
			open();
			return;
		}

		if (!validateInput()) {
			return;
		}

		const balance = results?.data?.formatted;
		if (Number(balance) < Number(amount)) {
			toast({
				variant: "destructive",
				title: "Insufficient Balance",
				description: "You don't have enough FYT tokens for the transaction",
			});
			return;
		}

		try {
			const amountInWei = parseEther(amount);

			// Ensure allowance data is fresh
			await refetchAllowance();

			// Check if we need approval
			if (!allowance || Number(allowance) < BigInt(amountInWei)) {
				if (!approveSimulator?.request) {
					toast({
						variant: "destructive",
						title: "Approval Simulation Failed",
						description: "Failed to simulate the approval transaction",
					});
					return;
				}

				// Execute approval
				approve(approveSimulator.request, {
					onError(error) {
						console.error("Approval error:", error);
						toast({
							variant: "destructive",
							title: "Approval Failed",
							description: error.message.includes("User rejected")
								? "You rejected the transaction"
								: `Approval failed: ${error.message}`,
						});
					},
					onSuccess: async () => {
						toast({
							title: "Approval Successful",
							description: "Transaction Approved. Proceeding with deposit...",
						});
						await refetchAllowance();
						// Now proceed with deposit
						executeDeposit();
					},
				});
			} else {
				// Already approved, proceed with deposit
				executeDeposit();
			}

			async function executeDeposit() {
				const depositConfig = getYieldPoolConfig("deposit", [
					YieldTokenAddress,
					amountInWei,
					durationInSeconds,
				]);

				const gas = await getDynamicGasPrice();

				deposit(
					{
						...depositConfig,
						gas,
					},
					{
						async onError(error) {
							console.error("Deposit error:", error);
							// Check for specific error types from the contract
							if (error.message.includes("User rejected")) {
								toast({
									variant: "destructive",
									title: "Transaction Rejected",
									description: "You rejected the transaction",
								});
							} else if (error.message.includes("Still locked")) {
								toast({
									variant: "destructive",
									title: "Lock Period Error",
									description:
										"The tokens are still locked for the specified duration",
								});
							} else {
								toast({
									variant: "destructive",
									title: "Deposit Failed",
									description: `Error: ${error.message}`,
								});
							}
						},
						async onSuccess(data) {
							// Invalidate queries to refresh data
							await queryClient.invalidateQueries();

							try {
								// Store transaction data
								const { error } = await storeTransaction({
									transaction_hash: data,
									owner: address!,
									amount: Number(amountInWei), // Be careful with this conversion
								});

								if (error) {
									console.error("Database error:", error);
									toast({
										variant: "destructive",
										title: "Database Error",
										description: "Failed to store transaction details",
									});
								}
							} catch (err) {
								console.error("Error storing transaction:", err);
							}

							toast({
								title: "Deposit Successful",
								description: "Your tokens have been successfully staked",
							});

							setAmount("");
							await queryClient.refetchQueries({ queryKey: ["transactions"] });
						},
					}
				);
			}
		} catch (error) {
			console.error("Transaction setup failed:", error);
			toast({
				variant: "destructive",
				title: "Transaction Failed",
				description:
					error instanceof Error ? error.message : "Unknown error occurred",
			});
		}
	};

	useEffect(() => {
		if (showCustomInput) customInputRef.current?.focus();
	}, [showCustomInput]);

	useEffect(() => {
		const customInput = customInputRef.current;

		const handleFocus = () => (setCustomInputActive(true), setLockDuration(1));
		const handleBlur = (e: FocusEvent) => {
			const clickedElement = e.relatedTarget as Node;
			const isClickInsideGrid = buttonGridRef.current?.contains(clickedElement);
			if (!isClickInsideGrid) return;

			if (lockDuration) {
				setCustomInputActive(false);
			}
		};

		customInput?.addEventListener("focus", handleFocus);
		customInput?.addEventListener("blur", handleBlur);

		return () => {
			customInput?.removeEventListener("focus", handleFocus);
			customInput?.removeEventListener("blur", handleBlur);
		};
	}, [customInputActive, lockDuration, showCustomInput]);

	const isTransactionInProgress = isApprovePending || isDepositPending;

	return (
		<>
			<Card
				className={cn(
					className,
					"bg-white mb-6 pb-0 xl:mb-0 dark:bg-[#1A103D50] border-slate-200 dark:border-slate-700/40 backdrop-blur-sm shadow-sm"
				)}
			>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
						<GraduationCap className="w-5 h-5 text-sky-500" />
						Stake PT
					</CardTitle>
					<CardDescription className="text-slate-500 dark:text-slate-400">
						Stake your PT tokens to earn rewards
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleStake} className="space-y-4">
						<div>
							<label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
								Amount
							</label>
							<Input
								disabled={isTransactionInProgress}
								type="text"
								required
								placeholder="Enter  PT
 amount"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								className="bg-slate-100 dark:bg-[#1A103D] border-slate-200 dark:border-slate-700/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:!ring-slate-500 dark:focus:!ring-sky-500 focus:!border-transparent focus:ring-offset-2 dark:ring-offset-sky-700 ring-offset-slate-700"
							/>
						</div>
						<div>
							<label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
								Lock Duration
							</label>
							<div
								ref={buttonGridRef}
								className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4 gap-2"
							>
								{["30", "60", "90"].map((days) => (
									<Button
										type="button"
										disabled={isTransactionInProgress}
										key={days}
										variant="outline"
										className={cn("border-slate-200 dark:border-slate-700/40", {
											"bg-gradient-to-r from-sky-500 hover:text-slate-900 to-yellow-500 text-slate-900 border-transparent":
												lockDuration === parseFloat(days),
											"bg-white dark:bg-[#1A103D] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800":
												lockDuration !== parseFloat(days),
										})}
										onClick={() => (
											setLockDuration(parseFloat(days)),
											setShowCustomInput(lockDurationCustom ? true : false),
											setCustomInputActive(false)
										)}
									>
										{days} Days
									</Button>
								))}
								{!showCustomInput ? (
									<Button
										variant="outline"
										className={cn(
											"bg-white border-slate-200 dark:border-slate-700/40  dark:bg-[#1A103D] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
										)}
										onClick={() => (
											setLockDuration(1),
											setShowCustomInput(true),
											setLockDurationCustom(1),
											setCustomInputActive(true)
										)}
									>
										Custom
									</Button>
								) : (
									<Input
										disabled={isTransactionInProgress}
										ref={customInputRef}
										type="number"
										min={1}
										max={365}
										maxLength={3}
										placeholder="Custom"
										value={lockDurationCustom}
										onChange={(e) =>
											setLockDurationCustom(parseFloat(e.target.value))
										}
										className={cn(
											"bg-slate-100 dark:bg-[#1A103D] border-slate-200 dark:border-slate-700/40 text-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:!ring-slate-500 dark:focus:!ring-sky-500 focus:!border-transparent dark:caret-white hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-200 focus:ring-offset-2 dark:ring-offset-sky-700 ring-offset-slate-700",
											{
												"bg-gradient-to-tr !text-slate-900 from-sky-500 to-yellow-500":
													lockDurationCustom && customInputActive,

												"bg-white dark:bg-[#1A103D] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800":
													!lockDurationCustom,
											}
										)}
									/>
								)}
							</div>
						</div>
						<div className="bg-slate-100 dark:bg-[#1A103D] rounded-xl p-4 space-y-2">
							<div className="flex justify-between text-sm">
								<span className="text-slate-500 dark:text-slate-400">
									Duration
								</span>
								<span className="text-slate-900 dark:text-slate-100">
									{customInputActive ? lockDurationCustom : lockDuration}{" "}
									{lockDurationCustom > 1 || lockDuration > 1 ? "days" : "day"}
								</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-slate-500 dark:text-slate-400">
									Base APY
								</span>
								<span className="text-sky-600 dark:text-sky-400">10.0%</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="text-slate-500 dark:text-slate-400">
									Bonus APY
								</span>
								<span className="text-sky-600 dark:text-sky-400">+2.5%</span>
							</div>
							<div className="border-t border-slate-200 dark:border-slate-700/40 pt-2 mt-2">
								<div className="flex justify-between font-medium">
									<span className="text-slate-700 dark:text-slate-300">
										Total APY
									</span>
									<span className="text-yellow-600 dark:text-yellow-400">
										12.5%
									</span>
								</div>
							</div>
						</div>
						<Button
							type="submit"
							disabled={isTransactionInProgress}
							className="w-full bg-gradient-to-r from-sky-500 to-yellow-500 text-slate-800 font-semibold hover:opacity-90"
						>
							{isTransactionInProgress ? (
								<>
									<div className="size-6 rounded-full animate-[spin_0.5s_linear_infinite] border-b-transparent border-[3px] border-green-950" />
									{isApprovePending
										? "Waiting for Approval..."
										: isDepositPending
										? "Waiting For Deposit Approval..."
										: "Checking..."}
								</>
							) : (
								"Stake Now"
							)}
						</Button>
						{children}
					</form>
				</CardContent>
			</Card>
			<Modal setShowModal={setShowModal} showModal={showModal} />
		</>
	);
};

export default StakingCard;
