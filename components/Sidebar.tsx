"use client";

import {
	BarChart2,
	Book,
	CreditCard,
	Crown,
	LineChart,
	Lock,
	Settings,
	Trophy,
	Wallet,
	PanelLeft,
	Landmark,
} from "lucide-react";

import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

import Image from "next/image";
import React, { useContext, useEffect } from "react";
import YieldEDUIcon from "@/public/icon2.png";
import { GlobalContext } from "@/context/globalContext";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClassValue } from "clsx";

const Sidebar = () => {
	const pathname = usePathname();
	const router = useRouter();
	const { setSidebarOpen, sidebarOpen } = useContext(GlobalContext);

	useEffect(() => {
		if (window.innerWidth >= 1024) {
			setSidebarOpen(
				JSON.parse(localStorage.getItem("sidebarOpen")!) || sidebarOpen
			);
		}
	}, [setSidebarOpen, sidebarOpen]);

	useEffect(() => {
		if (pathname === "/dashboard/learn") {
			router.push("/dashboard");
		}
	}, [pathname, router]);

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth <= 1024) {
				setSidebarOpen(false);
			} else {
				setSidebarOpen(true);
			}
		};
		window.addEventListener("resize", handleResize);
		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, [setSidebarOpen, sidebarOpen]);

	const handleSidebarToggle = () => {
		setSidebarOpen(!sidebarOpen);
		if (sidebarOpen) {
			localStorage.setItem("sidebarOpen", JSON.stringify(false));
		} else {
			localStorage.setItem("sidebarOpen", JSON.stringify(true));
		}
	};

	return (
		<>
			<div className="relative flex h-screen">
				{/* Sidebar - Desktop */}
				<aside
					className={cn(
						"fixed inset-y-0 left-0 z-50 bg-white dark:bg-[#1A103D95] border-r border-slate-200 dark:border-slate-800/60 transform transition-all duration-100 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:flex backdrop-blur-md",
						{
							"-translate-x-full w-24": !sidebarOpen,
							"translate-x-0 w-3/4 sm:w-1/2 md:w-1/3 lg:w-full": sidebarOpen,
						}
					)}
				>
					<div className=" overflow-x-clip flex flex-col justify-center h-full w-full">
						<div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
							<div className="flex items-center justify-between gap-3 w-full">
								<Link href={"/"}>
									<Image
										src={YieldEDUIcon}
										alt=" YieldPharos Logo"
										priority
										className="size-14 shrink-0 aspect-square"
									/>
								</Link>
								{sidebarOpen && (
									<div>
										<h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-yellow-500">
											YieldPharos
										</h1>
										<p className="text-xs text-slate-500 dark:text-slate-400">
											Learn & Earn Protocol
										</p>
									</div>
								)}

								<TooltipProvider>
									<Tooltip disableHoverableContent={false}>
										<TooltipTrigger
											onClick={handleSidebarToggle}
											className={cn(
												"text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300",
												{
													"hidden lg:flex fixed -right-6": !sidebarOpen,
												}
											)}
										>
											<PanelLeft className="w-5 h-5" />
										</TooltipTrigger>
										<TooltipContent>
											<p>Toggle sidebar</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>
						</div>

						<div className="flex-1 overflow-y-auto py-4 px-3">
							<div className="mb-6">
								{sidebarOpen && (
									<p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-3">
										Main
									</p>
								)}
								<nav className="space-y-1">
									<TooltipProvider>
										<SidebarLink
											icon={<LineChart className="w-5 h-5" />}
											label="Dashboard"
											active={pathname === "/dashboard"}
											link={"/dashboard"}
										/>

										<SidebarLink
											className="opacity-25 cursor-not-allowed disabled"
											icon={<Book className="w-5 h-5" />}
											label="Learn"
											active={pathname === "/dashboard/learn"}
											link={"/dashboard"}
										/>

										<SidebarLink
											icon={<Lock className="w-5 h-5" />}
											label="Stake"
											active={pathname === "/dashboard/stake"}
											link={"/dashboard/stake"}
										/>
										<SidebarLink
											icon={<Landmark className="w-5 h-5" />}
											label="Borrow"
											active={pathname === "/dashboard/borrow"}
											link={"/dashboard/borrow"}
										/>

										<SidebarLink
											icon={<Trophy className="w-5 h-5" />}
											label="Rewards"
											active={pathname === "/dashboard/rewards"}
											link={"/dashboard/rewards"}
										/>
									</TooltipProvider>
								</nav>
							</div>

							<hr className="border-slate-200 dark:border-slate-800 my-4" />

							{sidebarOpen && (
								<p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-3">
									Analytics
								</p>
							)}
							<div className="mb-6">
								<nav className="space-y-1">
									<TooltipProvider>
										<SidebarLink
											icon={<BarChart2 className="w-5 h-5" />}
											label="Protocol Stats"
											active={pathname === "/dashboard/protocol-stats"}
											link={"/dashboard/protocol-stats"}
										/>
									</TooltipProvider>
								</nav>
							</div>

							<hr className="border-slate-200 dark:border-slate-800 my-4" />
							{sidebarOpen && (
								<p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-3">
									Account
								</p>
							)}
							<div className="mb-6">
								<nav className="space-y-1">
									<TooltipProvider>
										<SidebarLink
											icon={<Wallet className="w-5 h-5" />}
											label="Portfolio"
											active={pathname === "/dashboard/portfolio"}
											link={"/dashboard/portfolio"}
										/>

										<SidebarLink
											icon={<CreditCard className="w-5 h-5" />}
											label="Transactions"
											active={pathname === "/dashboard/transactions"}
											link={"/dashboard/transactions"}
										/>

										<SidebarLink
											icon={<Settings className="w-5 h-5" />}
											label="Settings"
											active={pathname === "/dashboard/settings"}
											link={"/dashboard/settings"}
										/>
									</TooltipProvider>
								</nav>
							</div>
						</div>
						<div className="p-4 border-t border-slate-200 dark:border-slate-800/60">
							<div
								className={cn("flex items-center gap-2", {
									"gap-0 justify-center": !sidebarOpen,
								})}
							>
								<div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
									<Crown className="w-4 h-4 text-sky-600 dark:text-sky-400" />
								</div>
								{sidebarOpen && (
									<div>
										<p className="text-sm font-medium text-slate-900 dark:text-white">
											Level 2
										</p>
										<p className="text-xs text-slate-500 dark:text-slate-400">
											Scholar
										</p>
									</div>
								)}
							</div>
							{/* <button className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300">
									<ChevronLeft className="w-5 h-5" />
								</button> */}
						</div>
					</div>
				</aside>
			</div>
		</>
	);
};

export default Sidebar;

function SidebarLink({
	icon,
	label,
	active,
	link,
	className,
}: {
	active: boolean;
	label: string;
	icon: React.JSX.Element;
	link: string;
	className?: ClassValue;
}) {
	const { sidebarOpen } = useContext(GlobalContext);
	// const router = useRouter();
	// const handleLinkClicked = (link: string) => {
	// 	if (window.innerWidth >= 1024) {
	// 		router.push(link);
	// 	} else {
	// 		setSidebarOpen(false);
	// 		router.push(link);
	// 	}
	// };

	return (
		<Tooltip disableHoverableContent={false}>
			<TooltipTrigger className={cn("flex items-center  w-full", className)}>
				<Link
					href={link}
					// onClick={() => handleLinkClicked(link)}
					className={cn(
						"flex items-center gap-3 w-full px-3 overflow-x-clip py-2 rounded-lg transition-colors",
						{
							"bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400":
								active,
							"text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-sky-800/15":
								!active,
							"gap-0 justify-center w-fit mx-auto": !sidebarOpen,
						}
					)}
				>
					<span
						className={cn({
							"text-sky-600 dark:text-sky-400": active,
							"text-slate-500 dark:text-slate-400": !active,
						})}
					>
						{icon}
					</span>

					{sidebarOpen ? (
						<span className="font-medium">{label}</span>
					) : (
						<TooltipContent>
							<span className="font-medium">{label}</span>
						</TooltipContent>
					)}
				</Link>
			</TooltipTrigger>
		</Tooltip>
	);
}
