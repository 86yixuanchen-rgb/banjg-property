import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Home,
  Inbox,
  ClipboardList,
  Building2,
  Users,
  CalendarDays,
  BarChart3,
  Settings,
  Search,
  Bell,
  MessageSquareText,
  Menu,
  X,
  Check,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { AssistantPanel } from "./AssistantPanel";
import { useWorkspace } from "@/lib/workspace";

const nav = [
  { label: "Home", icon: Home, to: "/" as const },
  { label: "Unified Inbox", icon: Inbox, to: "/inbox" as const, badge: 3 },
  { label: "Requests", icon: ClipboardList, to: "/" as const },
  { label: "Properties", icon: Building2 },
  { label: "Contacts", icon: Users },
  { label: "Calendar", icon: CalendarDays },
  { label: "Analytics", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];

export function AppShell({
  children,
  onOpenAI,
  openAssistantSignal = 0,
}: {
  children: ReactNode;
  onOpenAI?: () => void;
  openAssistantSignal?: number;
}) {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [profile, setProfile] = useState(false);
  const [section, setSection] = useState<string | null>(null);
  const { requests, toasts, dismissToast } = useWorkspace();
  const navigate = useNavigate();
  useEffect(() => {
    if (openAssistantSignal > 0) setAssistantOpen(true);
  }, [openAssistantSignal]);
  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? requests
          .filter((item) =>
            [item.id, item.title, item.address, item.status, item.waitingOn].some((value) =>
              value.toLowerCase().includes(q),
            ),
          )
          .slice(0, 6)
      : [];
  }, [requests, search]);
  const openAI = () => {
    setAssistantOpen(true);
    onOpenAI?.();
  };

  const sidebar = (
    <aside className="h-full w-56 shrink-0 border-r bg-sidebar p-3">
      <nav className="space-y-0.5" aria-label="Main navigation">
        {nav.map((n) => {
          const inner = (
            <>
              <n.icon className="h-4 w-4" />
              <span className="flex-1">{n.label}</span>
              {n.badge ? (
                <span className="rounded bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                  {n.badge}
                </span>
              ) : null}
            </>
          );
          const cls =
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-sidebar-foreground hover:bg-sidebar-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";
          return n.to ? (
            <Link
              key={n.label}
              to={n.to}
              onClick={() => setMobileNav(false)}
              className={cls}
              activeOptions={{ exact: n.label === "Home" }}
              activeProps={{ className: "bg-sidebar-accent font-medium text-primary" }}
            >
              {inner}
            </Link>
          ) : (
            <button
              key={n.label}
              onClick={() => {
                setSection(n.label);
                setMobileNav(false);
              }}
              className={cls}
            >
              {inner}
            </button>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="relative z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-card px-3 sm:px-4">
        <button
          onClick={() => setMobileNav(true)}
          className="rounded-md p-2 hover:bg-muted md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/" className="flex items-center gap-2 md:w-52">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            K
          </div>
          <span className="hidden font-semibold tracking-tight sm:inline">
            Kinzo <span className="font-normal text-muted-foreground">Property</span>
          </span>
        </Link>
        <div className="relative mx-auto flex-1 md:max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requests, properties or people…"
            aria-label="Global search"
            className="h-9 w-full rounded-md border bg-muted pl-9 pr-8 text-sm outline-none focus:border-ring focus:bg-card"
          />
          {search ? (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-card"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {search ? (
            <div className="absolute left-0 right-0 top-11 z-50 max-h-80 overflow-auto rounded-lg border bg-card p-2 shadow-float">
              {results.length ? (
                results.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSearch("");
                      navigate({ to: "/requests/$id", params: { id: item.id } });
                    }}
                    className="flex w-full items-start gap-3 rounded-md p-3 text-left hover:bg-muted"
                  >
                    <span className="font-mono text-xs text-primary">{item.id}</span>
                    <span>
                      <span className="block text-sm font-medium">{item.title}</span>
                      <span className="block text-xs text-muted-foreground">{item.address}</span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No results for “{search}”
                </div>
              )}
            </div>
          ) : null}
        </div>
        <div className="ml-auto flex items-center gap-1 sm:gap-3">
          <button
            onClick={() => setNotifications((v) => !v)}
            className="relative rounded-md p-2 text-muted-foreground hover:bg-muted"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notifications ? (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-attention" />
            ) : null}
          </button>
          <button
            onClick={() => setProfile((v) => !v)}
            className="flex items-center gap-2 rounded-md p-1 hover:bg-muted"
            aria-expanded={profile}
          >
            <div className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
              SM
            </div>
            <div className="hidden text-left text-xs leading-tight lg:block">
              <div className="font-medium">Sarah Miller</div>
              <div className="text-muted-foreground">Harbour Realty</div>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground lg:block" />
          </button>
          {profile ? (
            <div className="absolute right-3 top-12 w-56 rounded-lg border bg-card p-2 shadow-float">
              <div className="border-b px-3 py-2 text-xs text-muted-foreground">
                Signed in as Sarah
              </div>
              <button
                onClick={() => {
                  setProfile(false);
                  setSection("Settings");
                }}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
              >
                <Settings className="h-4 w-4" />
                Workspace settings
              </button>
              <button
                onClick={() => setProfile(false)}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
              >
                <LogOut className="h-4 w-4" />
                Close menu
              </button>
            </div>
          ) : null}
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <div className="hidden md:block">{sidebar}</div>
        {mobileNav ? (
          <>
            <button
              onClick={() => setMobileNav(false)}
              className="fixed inset-0 z-40 bg-black/30 md:hidden"
              aria-label="Close navigation"
            />
            <div className="fixed inset-y-0 left-0 z-50 bg-sidebar pt-2 shadow-float md:hidden">
              <div className="flex items-center justify-between px-4 pb-2">
                <span className="font-semibold">Kinzo Property</span>
                <button onClick={() => setMobileNav(false)} className="p-2">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {sidebar}
            </div>
          </>
        ) : null}
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        {assistantOpen ? <AssistantPanel onClose={() => setAssistantOpen(false)} /> : null}
      </div>
      {!assistantOpen ? (
        <button
          onClick={openAI}
          className="fixed bottom-5 right-5 z-20 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-float hover:opacity-95"
        >
          <MessageSquareText className="h-4 w-4" />
          <span className="hidden sm:inline">Ask Kinzo AI</span>
        </button>
      ) : null}
      {section ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-float">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{section}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  This prototype area is ready for connected workspace data. Core repair workflows
                  remain fully available.
                </p>
              </div>
              <button
                onClick={() => setSection(null)}
                className="rounded p-1 hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => setSection(null)}
              className="mt-5 w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
      <div
        className="fixed bottom-4 left-1/2 z-[70] flex -translate-x-1/2 flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <button
            key={toast.id}
            onClick={() => dismissToast(toast.id)}
            className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-3 text-sm text-background shadow-float"
          >
            <Check className="h-4 w-4 text-done" />
            {toast.message}
          </button>
        ))}
      </div>
    </div>
  );
}
