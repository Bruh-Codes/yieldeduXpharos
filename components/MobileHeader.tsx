import React from "react";

import { Button } from "./ui/button";
import { Moon, Sun, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Feedback from "./Feedback";

const MobileHeader = ({
	setTheme,
	theme,
	setToggleMobileMenu,
	toggleMobileMenu,
}: {
	setTheme: React.Dispatch<React.SetStateAction<string>>;
	theme: string | undefined;
	setToggleMobileMenu: (value: React.SetStateAction<boolean>) => void;
	toggleMobileMenu: boolean;
}) => {
	return (
		<div
			className={cn(
				"bg-slate-900/40 md:hidden z-30 w-full backdrop-blur-md inset-0 transition-all ease-in-out delay-150 h-screen fixed",
				{
					"translate-x-full": !toggleMobileMenu,
					"translate-x-0": toggleMobileMenu,
				}
			)}
			onClick={() => setToggleMobileMenu(false)}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				className={cn(
					"flex md:hidden translate-x-full relative flex-col transition-all ease-in-out duration-150 items-center justify-center h-screen w-[70%] ml-auto bg-white dark:bg-slate-900 gap-4",
					{
						"translate-x-full": !toggleMobileMenu,
						"translate-x-0 ": toggleMobileMenu,
					}
				)}
			>
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
					className="text-slate-600 dark:text-slate-300 hover:text-sky-500 hover:bg-sky-500/10"
				>
					<Moon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
					<Sun className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					<span className="sr-only">Toggle theme</span>
				</Button>
				<Button
					type="button"
					onClick={() => setToggleMobileMenu(false)}
					className="absolute right-5 top-5"
				>
					<X />
				</Button>

				<nav className="flex flex-col items-center gap-6">
					<a
						href="/about-us"
						className="text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-500 transition-colors"
					>
						About
					</a>
					<a
						href="/features"
						className="text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-500 transition-colors"
					>
						Features
					</a>
					<a
						href="/blogs"
						className="text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-500 transition-colors"
					>
						Blogs
					</a>
					<a
						href="/contact-support"
						className="text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-500 transition-colors"
					>
						Support
					</a>
				</nav>
				<Feedback>
					<Button
						className="hover:bg-transparent border-none bg-transparent text-slate-600 font-semibold dark:text-white hover:text-sky-500 dark:hover:text-sky-500"
						variant="outline"
					>
						Feedback
					</Button>
				</Feedback>
				<a
					href="/dashboard"
					className="text-slate-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-500 transition-colors"
				>
					Dashboard
				</a>

				{/* <OCIDLoginButton /> */}
			</div>
		</div>
	);
};

export default MobileHeader;
