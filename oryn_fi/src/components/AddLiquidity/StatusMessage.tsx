interface StatusMessageProps {
    type: "error" | "success";
    message: string;
    details?: string;
}

export const StatusMessage: React.FC<StatusMessageProps> = ({
    type,
    message,
    details
}) => {
    const styles = {
        error: "bg-red-50 border-red-200 text-red-600",
        success: "bg-green-50 border-green-200 text-green-600"
    };

    const icon = {
        error: "❌",
        success: "✅"
    };

    return (
        <div className={`${styles[type]} border rounded-lg p-3`}>
            <p className="text-sm">
                {icon[type]} {message}
            </p>
            {details && (
                <p className="text-xs mt-1 opacity-80">
                    {details}
                </p>
            )}
        </div>
    );
};
