"use client";

import React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "./utils";

export function Switch({ checked = false, onCheckedChange, className }) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        "w-11 h-6 bg-muted rounded-full relative transition-colors data-[state=checked]:bg-primary",
        className
      )}
      aria-checked={checked}
    >
      <SwitchPrimitive.Thumb className="block w-5 h-5 bg-white rounded-full translate-x-0 data-[state=checked]:translate-x-5 transition-transform" />
    </SwitchPrimitive.Root>
  );
}
