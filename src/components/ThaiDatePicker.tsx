import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

function toDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Date picker that shows Thai month names and Buddhist (B.E.) years. Value is ISO yyyy-mm-dd. */
export function ThaiDatePicker({
  value,
  onChange,
  placeholder = "เลือกวันที่",
  fromYear = new Date().getFullYear() - 26,
  toYear = new Date().getFullYear(),
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fromYear?: number;
  toYear?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = toDate(value);

  const label = selected
    ? `${selected.getDate()} ${THAI_MONTHS[selected.getMonth()]} ${selected.getFullYear() + 543}`
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !selected && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={th}
          captionLayout="dropdown"
          startMonth={new Date(fromYear, 0)}
          endMonth={new Date(toYear, 11)}
          defaultMonth={selected ?? new Date()}
          selected={selected}
          onSelect={(d) => {
            if (d) {
              onChange(toISODate(d));
              setOpen(false);
            }
          }}
          formatters={{
            formatYearDropdown: (date) => String(date.getFullYear() + 543),
            formatMonthDropdown: (date) => THAI_MONTHS[date.getMonth()],
            formatCaption: (date) => `${THAI_MONTHS[date.getMonth()]} ${date.getFullYear() + 543}`,
          }}
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
