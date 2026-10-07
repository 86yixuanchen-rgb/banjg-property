import { Link } from "@tanstack/react-router";
import { Clock, User, ArrowRight, MoreHorizontal } from "lucide-react";
import { columns, priorityTone, type RepairRequest } from "@/lib/data";
import { columnStatus, useWorkspace } from "@/lib/workspace";

export function RequestCard({ r }: { r: RepairRequest }) {
  const { updateRequest, notify } = useWorkspace();
  return (
    <article className="group relative rounded-lg border bg-card p-3 shadow-card transition hover:border-ring">
      <Link
        to="/requests/$id"
        params={{ id: r.id }}
        className="absolute inset-0 rounded-lg"
        aria-label={`Open ${r.id} ${r.title}`}
      />
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-muted-foreground">{r.id}</span>
        <div className="relative z-10 flex items-center gap-1">
          <span
            className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${priorityTone[r.priority]}`}
          >
            {r.priority}
          </span>
          <label
            className="cursor-pointer rounded p-0.5 text-muted-foreground hover:bg-muted"
            title="Move request"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
            <select
              value={r.column}
              onChange={(e) => {
                const column = e.target.value as RepairRequest["column"];
                updateRequest(r.id, {
                  column,
                  status: columnStatus[column],
                  lastUpdate: "Just now",
                });
                notify(`${r.id} moved to ${column}`);
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label={`Move ${r.id} to another status`}
            >
              {columns.map((column) => (
                <option key={column.name}>{column.name}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="mt-1.5 text-sm font-medium leading-snug">{r.title}</div>
      <div className="text-xs text-muted-foreground">{r.address}</div>
      <div className="mt-2 text-[11px] text-muted-foreground">{r.status}</div>
      <div className="mt-2 space-y-1.5 rounded-md bg-muted p-2">
        <div className="flex items-start gap-1.5 text-xs">
          <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-waiting" />
          <span>
            <span className="text-muted-foreground">Waiting on </span>
            <span className="font-semibold">{r.waitingOn}</span>
          </span>
        </div>
        <div className="flex items-start gap-1.5 text-xs">
          <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="font-semibold text-primary">{r.nextAction}</span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {r.waiting}
        </span>
        <span>{r.lastUpdate}</span>
      </div>
    </article>
  );
}
