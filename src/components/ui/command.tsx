import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Lightweight CMDK-like list for our needs without adding a new dep.
// This provides a searchable list grouped by sections.

export interface CommandItem {
  value: string;
  label: string;
}

export interface CommandGroup {
  title: string;
  items: CommandItem[];
}

export function CommandDialog({
  open,
  onOpenChange,
  groups,
  onSelect,
  placeholder = "Search...",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: CommandGroup[];
  onSelect: (value: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        title: g.title,
        items: g.items.filter(
          (i) => i.label.toLowerCase().includes(q) || i.value.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-[720px] w-[92vw]">
        <div className="p-3 border-b">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full h-10 px-3 rounded-md bg-input/30 border border-input outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="max-h-[65vh] overflow-y-auto">
          {filtered.map((group) => (
            <div key={group.title} className="py-2">
              <div className="px-3 pb-1 text-xs font-semibold text-muted-foreground">
                {group.title}
              </div>
              <ul>
                {group.items.map((item) => (
                  <li key={item.value}>
                    <button
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        onSelect(item.value);
                        onOpenChange(false);
                      }}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">No results</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


