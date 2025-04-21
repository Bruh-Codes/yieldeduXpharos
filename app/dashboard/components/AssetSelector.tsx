import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Asset } from "./CollateralAssets";

interface AssetSelectorProps {
	label: string;
	assets: Asset[];
	onSelect: (asset: string) => void;
	disabled?: boolean;
}

const AssetSelector: React.FC<AssetSelectorProps> = ({
	label,
	assets,
	onSelect,
	disabled,
}) => {
	return (
		<>
			<label className="block text-sm text-gray-400 mb-2">{label}</label>
			<Select disabled={disabled} onValueChange={(value) => onSelect(value)}>
				<SelectTrigger className="h-14 bg-sky-100 dark:bg-[#1A103D] border-sky-200 dark:border-slate-700/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:!ring-slate-500 dark:focus:!ring-sky-500 focus:!border-transparent focus:ring-offset-2 dark:ring-offset-sky-700 ring-offset-slate-700">
					<SelectValue placeholder="Select an asset" />
				</SelectTrigger>
				<SelectContent className="bg-white dark:bg-[#1A103D] border border-sky-100 dark:border-sky-700 rounded-lg shadow-md">
					<SelectGroup>
						{assets.map((asset: Asset) => (
							<SelectItem
								value={JSON.stringify(asset)}
								key={asset.symbol}
								className="p-3 rounded-md cursor-pointer hover:bg-sky-100 dark:hover:bg-sky-800/20"
							>
								<div className="flex w-full items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
										<span className="text-sm text-gray-700 dark:text-gray-300">
											{asset.symbol}
										</span>
									</div>
									<div className="flex flex-col gap-1 items-start">
										<p className="text-sm font-medium text-gray-900 dark:text-gray-100">
											{asset.symbol}
										</p>
										<p className="text-xs text-gray-500 dark:text-gray-400">
											{asset.name}
										</p>
									</div>
								</div>
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</>
	);
};

export default AssetSelector;
