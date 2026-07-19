import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer relative inline-flex h-6 w-[38px] min-w-[38px] shrink-0 cursor-pointer overflow-hidden rounded-full border-0 p-0 transition-colors data-[state=checked]:bg-[#4bd05a] data-[state=unchecked]:bg-[#626367] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4bd05a]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none absolute left-0 top-0.5 block h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.3)] ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
