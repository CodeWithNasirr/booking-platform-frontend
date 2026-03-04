"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "./utils";

/* ================= ROOT ================= */

function Tabs({ className, ...props }) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

/* ================= LIST ================= */

function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-xl p-[3px] flex",
        className
      )}
      {...props}
    />
  );
}

/* ================= TRIGGER ================= */

function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex flex-1 h-[calc(100%-1px)] items-center justify-center gap-1.5",
        "rounded-xl border border-transparent px-2 py-1 text-sm font-medium",
        "whitespace-nowrap transition-[color,box-shadow]",
        "text-foreground dark:text-muted-foreground",
        "data-[state=active]:bg-card dark:data-[state=active]:bg-input/30",
        "data-[state=active]:text-foreground dark:data-[state=active]:text-foreground",
        "dark:data-[state=active]:border-input",
        "focus-visible:outline-none focus-visible:ring-[3px]",
        "focus-visible:ring-ring/50 focus-visible:border-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        "[&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

/* ================= CONTENT ================= */

function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

/* ================= EXPORTS ================= */

export { Tabs, TabsList, TabsTrigger, TabsContent };
