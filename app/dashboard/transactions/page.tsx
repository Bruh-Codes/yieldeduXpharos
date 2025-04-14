import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { yieldEduMetadata } from "@/utils/metadata";
import { Metadata } from "next";

export const metadata: Metadata = {
	...yieldEduMetadata,
	title: " YieldPharos - Transactions",
	description:
		"View and manage your transaction history effortlessly with  YieldPharos. Keep track of your recent activities in one place.",
};

const page = () => {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
						Transactions
					</h1>
					<p className="text-slate-500 dark:text-slate-400">
						View your transaction history
					</p>
				</div>
			</div>

			<Card className="bg-whitedark:bg-[#1A103D] border-slate-200 dark:border-slate-700/40 backdrop-blur-sm shadow-sm">
				<CardHeader>
					<CardTitle className="text-slate-900 dark:text-white">
						Transaction History
					</CardTitle>
					<CardDescription className="text-slate-500 dark:text-slate-400">
						Record of your recent activities
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center h-64 bg-slate-100 dark:bg-[#1A103D] rounded-xl border border-slate-200 dark:border-slate-700/40">
						<p className="text-slate-500 dark:text-slate-400">
							Transaction history will appear here after connecting your wallet
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};
export default page;
