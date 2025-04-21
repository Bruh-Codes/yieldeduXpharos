"use client";
import React, { useState } from "react";
import { Sparkles, Book } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "./ui/button";
import Link from "next/link";
const AchievementBanner = () => {
	const [progress] = useState(1);

	return (
		<div className="dark:bg-gradient-to-r from-[#1A103D50] to-[#1A103D30] rounded-2xl p-6 border border-slate-200 dark:border-slate-700/40 shadow-sm relative overflow-hidden">
			<div className="absolute bg-white dark:bg-transparent inset-0 dark:bg-gradient-to-r from-sky-400/10 to-yellow-400/10 dark:opacity-20"></div>
			<div className="relative flex flex-col sm:flex-row gap-5 items-center justify-between">
				<div className="flex w-full items-center gap-4">
					<div className="p-3 bg-sky-500/20 rounded-xl">
						<Book className="w-8 h-8 text-sky-400" />
					</div>
					<div>
						<h2 className="text-md md:text-xl text-foreground font-semibold mb-1">
							Your Learning Progress
						</h2>
						<div className="flex items-center gap-4">
							<Progress
								value={progress}
								className="w-full md:w-52 lg:w-52 h-4 bg-slate-200 dark:bg-slate-700/50"
							/>
							<span className="text-sky-400 font-medium">{progress}%</span>
						</div>
					</div>
				</div>
				<div className="flex flex-col w-full max-w-[450px] md:flex-row items-center lg:justify-end gap-3">
					<Badge
						variant="outline"
						className="bg-yellow-400/20 w-fitdark:bg-[#1A103D] text-yellow-600 dark:text-yellow-400 border-yellow-400/30 px-3 py-1"
					>
						<Sparkles className="w-4 h-4 mr-1" />
						<p>+3% APY Boost</p>
					</Badge>
					<Button
						asChild
						size="sm"
						className="bg-sky-400 text-sm w-fit hover:bg-sky-500 border text-white"
					>
						<Link href="/dashboard/learn">Continue</Link>
					</Button>
				</div>
			</div>
		</div>
	);
};

export default AchievementBanner;
