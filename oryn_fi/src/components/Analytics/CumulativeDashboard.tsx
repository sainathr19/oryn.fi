import { InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../UI/tooltip";

export const CumulativeDashboard = () => {
  return (
    <div className="flex flex-col gap-3 px-2 pb-3 pt-2 sm:px-3 sm:pb-4 overflow-hidden sm:pt-3 w-full text-dark-grey">
      <h4 className="text-sm font-medium sticky inset-0">
        Cumulative Analytics
      </h4>
      <div className=" gap-3 w-full overflow-y-auto rounded-2xl pt-2 grid grid-cols-4">
        <div className="gap-2 rounded-2xl bg-white/50 p-4 flex flex-col items-start justify-between">
          <div className="gap-2 flex items-center justify-start">
            <span className="text-sm font-medium text-mid-grey">
              Total Borrowed
            </span>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="w-4 h-4 cursor-pointer text-mid-grey" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-56">In USD + tokens</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-4xl font-medium text-dark-grey/90">$21098</p>
        </div>
        <div className="gap-2 rounded-2xl bg-white/50 p-4 flex flex-col items-start justify-between">
          <span className="text-sm font-medium text-mid-grey">
            Number of Active Loans
          </span>
          <p className="text-4xl font-medium text-dark-grey/90">7</p>
        </div>
        <div className="gap-2 rounded-2xl bg-white/50 p-4 flex flex-col items-start justify-between">
          <span className="text-sm font-medium text-mid-grey">
            Average Borrow Interest Rate (%)
          </span>
          <p className="text-4xl font-medium text-dark-grey/90">21%</p>
        </div>
        <div className="gap-2 rounded-2xl bg-white/50 p-4 flex flex-col items-start justify-between">
          <div className="gap-2 flex items-center justify-start">
            <span className="text-sm font-medium text-mid-grey">
              Accrued Interest
            </span>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="w-4 h-4 cursor-pointer text-mid-grey" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-56">Unpaid Interest so far</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-4xl font-medium text-dark-grey/90">$312</p>
        </div>

        {/* SecondLine */}
        <div className="gap-2 rounded-2xl bg-white/50 p-4 flex flex-col items-start justify-between">
          <span className="text-sm font-medium text-mid-grey">
            Collateral Value (USD)
          </span>
          <p className="text-4xl font-medium text-dark-grey/90">$21098</p>
        </div>
        <div className="gap-2 rounded-2xl bg-white/50 p-4 flex flex-col items-start justify-between">
          <div className="gap-2 flex items-center justify-start">
            <span className="text-sm font-medium text-mid-grey">
              Borrow Power
            </span>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="w-4 h-4 cursor-pointer text-mid-grey" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-56">Max you can borrow</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-4xl font-medium text-dark-grey/90">7</p>
        </div>
        <div className="gap-2 rounded-2xl bg-white/50 p-4 flex flex-col items-start justify-between">
          <span className="text-sm font-medium text-mid-grey">
            Borrow Utilization (%)
          </span>
          <p className="text-4xl font-medium text-dark-grey/90">21%</p>
        </div>
        <div className="gap-2 rounded-2xl bg-white/50 p-4 flex flex-col items-start justify-between">
          <div className="gap-2 flex items-center justify-start">
            <span className="text-sm font-medium text-mid-grey">
              Health Factor
            </span>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="w-4 h-4 cursor-pointer text-mid-grey" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-56">Unpaid Interest so far</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-4xl font-medium text-dark-grey/90">$312</p>
        </div>
      </div>
    </div>
  );
};
