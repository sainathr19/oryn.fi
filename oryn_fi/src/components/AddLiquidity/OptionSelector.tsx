import clsx from "clsx";

interface Option {
    label: string;
    value: string | number;
    description: string;
}

interface OptionSelectorProps {
    title: string;
    options: readonly Option[];
    selectedValue: string | number;
    onSelect: (value: string | number) => void;
    columns?: 2 | 3 | 4;
}

export const OptionSelector: React.FC<OptionSelectorProps> = ({
    title,
    options,
    selectedValue,
    onSelect,
    columns = 2
}) => {
    const gridCols = {
        2: "grid-cols-2",
        3: "grid-cols-3",
        4: "grid-cols-4"
    };

    return (
        <div className="space-y-3">
            <h3 className="text-lg font-medium text-dark-grey">{title}</h3>
            <div className={`grid ${gridCols[columns]} gap-3`}>
                {options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onSelect(option.value)}
                        className={clsx(
                            "p-3 rounded-xl border-2 transition-all",
                            selectedValue === option.value
                                ? "border-primary bg-primary/10"
                                : "border-border bg-white hover:border-gray-300"
                        )}
                    >
                        <div className="text-center">
                            <div className="text-dark-grey font-semibold">{option.label}</div>
                            <div className="text-mid-grey text-xs mt-1">{option.description}</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
