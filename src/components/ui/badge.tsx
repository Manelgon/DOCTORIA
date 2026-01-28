import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded border px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-gray-200 bg-gray-50/50 text-gray-700 hover:bg-gray-100/50",
                secondary:
                    "border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100/50",
                destructive:
                    "border-red-200 bg-red-50/50 text-red-700 hover:bg-red-100/50",
                outline: "border-gray-300 text-gray-700 hover:bg-gray-50",
                success:
                    "border-green-200 bg-green-50/50 text-green-700 hover:bg-green-100/50",
                warning:
                    "border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100/50",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
