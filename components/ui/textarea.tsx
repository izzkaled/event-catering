import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-white px-2.5 py-2 text-base text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition-colors outline-none placeholder:text-muted-foreground/80 focus-visible:border-brand-palm focus-visible:ring-3 focus-visible:ring-brand-palm/25 disabled:cursor-not-allowed disabled:bg-[#f0ebe3] disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
