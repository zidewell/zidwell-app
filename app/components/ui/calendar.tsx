"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type ChevronProps } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center h-9",
        caption_label: "text-sm font-medium",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between z-10",
        button_previous:
          "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-transparent opacity-60 hover:opacity-100 transition disabled:opacity-30",
        button_next:
          "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-transparent opacity-60 hover:opacity-100 transition disabled:opacity-30",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-9 text-[0.75rem] font-normal text-foreground/50 rounded-md",
        week: "flex w-full mt-2",
        day: "h-9 w-9 p-0 text-center text-sm rounded-md",
        day_button:
          "inline-flex h-9 w-9 items-center justify-center rounded-md font-normal hover:bg-muted transition aria-selected:opacity-100",
        selected:
          "bg-[#FDC020] text-[#191919] hover:bg-[#FDC020] focus:bg-[#FDC020] font-semibold",
        today: "bg-muted text-foreground",
        outside: "text-foreground/30",
        disabled: "text-foreground/20",
        hidden: "invisible",
        range_start: "rounded-l-md",
        range_end: "rounded-r-md",
        range_middle:
          "aria-selected:bg-[#FDC020]/20 aria-selected:text-foreground",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...rest }: ChevronProps) => {
          if (orientation === "left") {
            return <ChevronLeft className="h-4 w-4" />;
          }
          if (orientation === "right") {
            return <ChevronRight className="h-4 w-4" />;
          }
          return null;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };