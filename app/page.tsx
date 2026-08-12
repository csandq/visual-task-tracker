"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Status = "done" | "in-progress" | "blocked" | "todo";
type Priority = "High" | "Medium" | "Low";
type View = "journeys" | "my-tasks" | "calendar" | "backlog" | "settings";
type ActivityEntry = { id: number; message: string; timestamp: string; status?: Status };
type Attachment = { id: string; name: string; size: number; type: string };
type Step = { id: number; label: string; status: Status; note: string; deadline: string; people?: string; owner?: string; attachment?: Attachment; activity?: ActivityEntry[] };
type Task = { id: number; title: string; project: string; tags: string[]; priority: Priority; steps: Step[]; links?: string[]; dependencies?: number[]; pausedFrom?: string; backlog?: boolean };
type ActivityLogEntry = { id: number; timestamp: string; action: "added" | "edited" | "removed" | "moved"; entity: "journey" | "step" | "tag" | "workspace" | "attachment"; message: string };
type KairosData = {
  version: 1;
  exportedAt?: string;
  tasks: Task[];
  tagLibrary: Record<string, string>;
  workspaces: Record<string, { description: string; color: string; active: boolean }>;
  activityLog?: ActivityLogEntry[];
  dismissedNotifications?: number[];
};

const ON_HOLD_WORKSPACE = "On hold";

const defaultWorkspaces: Record<string, { description: string; color: string; active: boolean }> = {
  "Brand refresh": { description: "Campaigns, identity work, and how Kairos shows up in the world.", color: "#b89acb", active: true },
  "Product experience": { description: "Improvements to the product journey, research, and customer experience.", color: "#b6da78", active: true },
  "Content engine": { description: "Stories, editorial work, and reusable content for the business.", color: "#e9a66d", active: true },
  [ON_HOLD_WORKSPACE]: { description: "Paused journeys waiting for the right moment, decision, or dependency.", color: "#85858b", active: true },
};

const seedTasks: Task[] = [
  {
    id: 1,
    title: "Launch the autumn campaign",
    project: "Brand refresh",
    tags: ["Marketing", "Q4"],
    priority: "High",
    links: ["https://example.com/campaign-brief"],
    dependencies: [],
    steps: [
      { id: 11, label: "Research", status: "done", note: "Competitor scan and audience interviews are wrapped.", deadline: "Aug 4" },
      { id: 12, label: "Concept", status: "done", note: "Direction B approved by the brand team.", deadline: "Aug 8" },
      { id: 13, label: "Create", status: "in-progress", note: "Social assets are in review. Homepage copy still needs a pass.", deadline: "Aug 13" },
      { id: 14, label: "Review", status: "todo", note: "", deadline: "Aug 16" },
      { id: 15, label: "Launch", status: "todo", note: "", deadline: "Aug 20" },
    ],
  },
  {
    id: 2,
    title: "Improve onboarding flow",
    project: "Product experience",
    tags: ["Design", "Product"],
    priority: "Medium",
    links: ["https://example.com/onboarding-research"],
    dependencies: [1],
    steps: [
      { id: 21, label: "Audit", status: "done", note: "Drop-off is highest during workspace setup.", deadline: "Aug 1" },
      { id: 22, label: "Map flow", status: "done", note: "", deadline: "Aug 6" },
      { id: 23, label: "Prototype", status: "done", note: "Testable mobile and desktop paths ready.", deadline: "Aug 9" },
      { id: 24, label: "Test", status: "blocked", note: "Waiting for five more participants to confirm.", deadline: "Aug 12" },
      { id: 25, label: "Ship", status: "todo", note: "", deadline: "Aug 18" },
    ],
  },
  {
    id: 3,
    title: "Publish customer story",
    project: "Content engine",
    tags: ["Editorial"],
    priority: "Low",
    links: [],
    dependencies: [2],
    steps: [
      { id: 31, label: "Interview", status: "done", note: "Recording and transcript saved in the project folder.", deadline: "Jul 29" },
      { id: 32, label: "Draft", status: "in-progress", note: "First draft is about 70% complete.", deadline: "Aug 14" },
      { id: 33, label: "Approve", status: "todo", note: "", deadline: "Aug 19" },
      { id: 34, label: "Publish", status: "todo", note: "", deadline: "Aug 22" },
    ],
  },
];

const statusLabel: Record<Status, string> = {
  done: "Done",
  "in-progress": "In progress",
  blocked: "Blocked",
  todo: "Not started",
};

const defaultTagColors: Record<string, string> = {
  Marketing: "#5d7fa3", Q4: "#8c6d9f", Design: "#b26d86", Product: "#4f8a70", Editorial: "#b27a47", Planning: "#718096",
};

const monthNumbers: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3, may: 4, jun: 5, june: 5,
  jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

function dateKey(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

function isoWeekNumber(date: Date) {
  const thursday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  thursday.setDate(thursday.getDate() + 4 - (thursday.getDay() || 7));
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  return Math.ceil((((thursday.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
}

function StatusLoadingState() {
  return <div className="status-loader"><span className="status-pixels" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <i key={index} style={{ animationDelay: `${index * 90}ms` }}/>)}</span><strong>Status</strong></div>;
}

function parseDateKey(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : null;
}

function normalizeDeadline(value: string) {
  const trimmed = value.trim();
  if (parseDateKey(trimmed)) return trimmed;
  const match = /^([A-Za-z]+)\s+(\d{1,2})(?:,?\s+(\d{4}))?$/.exec(trimmed);
  if (!match) return value;
  const month = monthNumbers[match[1].toLowerCase()];
  const day = Number(match[2]);
  const year = Number(match[3] ?? new Date().getFullYear());
  if (month === undefined) return value;
  const date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? dateKey(date) : value;
}

function formatDeadline(value: string) {
  const date = parseDateKey(normalizeDeadline(value));
  return date ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : value;
}

function daysUntil(value: string, now = new Date()) {
  const date = parseDateKey(normalizeDeadline(value));
  if (!date) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
}

function normalizeTasks(tasks: Task[]) {
  return tasks.map((task) => ({
    ...task,
    tags: Array.isArray(task.tags) ? task.tags : [],
    links: Array.isArray(task.links) ? task.links : [],
    dependencies: Array.isArray(task.dependencies) ? [...new Set(task.dependencies.filter((id) => id !== task.id))] : [],
    steps: Array.isArray(task.steps) ? task.steps.map((step) => ({ ...step, note: step.note ?? "", deadline: normalizeDeadline(step.deadline ?? ""), activity: step.activity ?? [], attachment: typeof step.attachment === "string" ? { id: "legacy", name: step.attachment, size: 0, type: "application/octet-stream" } : step.attachment })) : [],
  }));
}

function normalizeData(data: KairosData): KairosData {
  const tasks = normalizeTasks(data.tasks ?? []);
  const tagLibrary = { ...(data.tagLibrary ?? {}) };
  const workspaces = { ...(data.workspaces ?? {}) };
  for (const tag of new Set(tasks.flatMap((task) => task.tags))) {
    if (!tagLibrary[tag]) tagLibrary[tag] = "#718096";
  }
  for (const project of new Set(tasks.filter((task) => !task.backlog).map((task) => task.project))) {
    if (!workspaces[project]) workspaces[project] = { description: "A collection of related tasks and journeys.", color: "#91a09a", active: true };
  }
  if (!workspaces[ON_HOLD_WORKSPACE]) workspaces[ON_HOLD_WORKSPACE] = defaultWorkspaces[ON_HOLD_WORKSPACE];
  return { ...data, tasks, tagLibrary, workspaces, activityLog: Array.isArray(data.activityLog) ? data.activityLog.slice(-200) : [], dismissedNotifications: Array.isArray(data.dismissedNotifications) ? data.dismissedNotifications : [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseBackup(value: unknown): KairosData {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.tasks) || !isRecord(value.tagLibrary) || !isRecord(value.workspaces)) {
    throw new Error("This is not a supported Kairos backup.");
  }
  const taskIds = new Set<number>();
  const stepIds = new Set<number>();
  for (const rawTask of value.tasks) {
    if (!isRecord(rawTask) || !Number.isSafeInteger(rawTask.id) || taskIds.has(rawTask.id as number) || typeof rawTask.title !== "string" || !rawTask.title.trim() || typeof rawTask.project !== "string" || !rawTask.project.trim() || !Array.isArray(rawTask.tags) || !["High", "Medium", "Low"].includes(rawTask.priority as string) || !Array.isArray(rawTask.steps)) throw new Error("A journey in this backup is malformed.");
    taskIds.add(rawTask.id as number);
    for (const rawStep of rawTask.steps) {
      if (!isRecord(rawStep) || !Number.isSafeInteger(rawStep.id) || stepIds.has(rawStep.id as number) || typeof rawStep.label !== "string" || !rawStep.label.trim() || !["done", "in-progress", "blocked", "todo"].includes(rawStep.status as string) || typeof rawStep.note !== "string" || typeof rawStep.deadline !== "string") throw new Error("A step in this backup is malformed.");
      stepIds.add(rawStep.id as number);
    }
  }
  for (const [name, workspace] of Object.entries(value.workspaces)) {
    if (!name.trim() || !isRecord(workspace) || typeof workspace.description !== "string" || typeof workspace.color !== "string" || typeof workspace.active !== "boolean") throw new Error("A workspace in this backup is malformed.");
  }
  return normalizeData(value as KairosData);
}

function nextAvailableId(tasks: Task[]) {
  return Math.max(0, ...tasks.flatMap((task) => [task.id, ...task.steps.map((step) => step.id)])) + 1;
}

function progress(task: Task) {
  return task.steps.length === 0 ? 0 : Math.round((task.steps.filter((step) => step.status === "done").length / task.steps.length) * 100);
}

function formatRelativeDate(value: string) {
  const date = parseDateKey(normalizeDeadline(value));
  return date ? date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "No deadline";
}

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function viewForPath(pathname: string): View {
  if (pathname.endsWith("/work")) return "journeys";
  if (pathname.endsWith("/my-tasks")) return "my-tasks";
  if (pathname.endsWith("/calendar")) return "calendar";
  if (pathname.endsWith("/backlog") || pathname.endsWith("/start")) return "backlog";
  if (pathname.endsWith("/settings")) return "settings";
  return "backlog";
}

function normalizeLink(rawValue: string) {
  const value = rawValue.trim();
  if (!value) return null;
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(candidate);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [selected, setSelected] = useState<{ taskId: number; stepId: number } | null>(null);
  const [filter, setFilter] = useState("All work");
  const [sortBy, setSortBy] = useState<"manual" | "urgency" | "deadline">("manual");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [stepSortBy, setStepSortBy] = useState<"urgency" | "deadline">("urgency");
  const [stepSortDirection, setStepSortDirection] = useState<"asc" | "desc">("asc");
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [newWorkspace, setNewWorkspace] = useState("");
  const [dragged, setDragged] = useState<number | null>(null);
  const [collapsedTasks, setCollapsedTasks] = useState<number[]>(() => seedTasks.map((task) => task.id));
  const [ready, setReady] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
  const [editTaskId, setEditTaskId] = useState<number | null>(null);
  const [tagDraft, setTagDraft] = useState("");
  const [linkDraft, setLinkDraft] = useState("");
  const [dependencyPickerOpen, setDependencyPickerOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>("backlog");
  const [tagLibrary, setTagLibrary] = useState<Record<string, string>>(defaultTagColors);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#668d74");
  const [workspaces, setWorkspaces] = useState(defaultWorkspaces);
  const [settingsTab, setSettingsTab] = useState<"tags" | "workspaces" | "data" | "activity" | "uploads">("tags");
  const [uploads, setUploads] = useState<Attachment[]>([]);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceColor, setNewWorkspaceColor] = useState("#7b9b88");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error" | "offline">("offline");
  const [saveError, setSaveError] = useState("");
  const [serverReady, setServerReady] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => { const today = new Date(); return new Date(today.getFullYear(), today.getMonth(), 1); });
  const [calendarWorkspace, setCalendarWorkspace] = useState("All workspaces");
  const [detailsFullscreen, setDetailsFullscreen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<number[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [formError, setFormError] = useState("");
  const [clock, setClock] = useState(() => new Date());
  const newTitleRef = useRef<HTMLInputElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const saveAttemptRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        setSidebarCollapsed(localStorage.getItem("kairos-sidebar-collapsed") === "true");
        const response = await fetch("/api/state", { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const payload = await response.json() as { data: KairosData | null };
        const data = payload.data ? normalizeData(payload.data) : { version: 1 as const, tasks: normalizeTasks(seedTasks), tagLibrary: defaultTagColors, workspaces: defaultWorkspaces };
        if (!cancelled) {
          setTasks(data.tasks);
          setTagLibrary(data.tagLibrary);
          setWorkspaces(data.workspaces);
          setActivityLog(data.activityLog ?? []);
          setDismissedNotificationIds(data.dismissedNotifications ?? []);
          setCollapsedTasks(data.tasks.map((task) => task.id));
          setServerReady(true);
          setSaveState("saved");
          setSaveError("");
          setReady(true);
        }
        return;
      } catch {
        if (cancelled) return;
        setServerReady(false);
      }
      try {
        const savedTasks = localStorage.getItem("kairos-tasks-v1");
        const savedTags = localStorage.getItem("kairos-tag-library-v1");
        const savedWorkspaces = localStorage.getItem("kairos-workspaces-v1");
        const savedActivity = localStorage.getItem("kairos-activity-log-v1");
        const savedDismissed = localStorage.getItem("kairos-dismissed-notifications-v1");
        const localData = normalizeData({
          version: 1,
          tasks: savedTasks ? JSON.parse(savedTasks) as Task[] : seedTasks,
          tagLibrary: savedTags ? JSON.parse(savedTags) as Record<string, string> : defaultTagColors,
          workspaces: savedWorkspaces ? JSON.parse(savedWorkspaces) as KairosData["workspaces"] : defaultWorkspaces,
          activityLog: savedActivity ? JSON.parse(savedActivity) as ActivityLogEntry[] : [],
          dismissedNotifications: savedDismissed ? JSON.parse(savedDismissed) as number[] : [],
        });
        setTasks(localData.tasks);
        setTagLibrary(localData.tagLibrary);
        setWorkspaces(localData.workspaces);
        setActivityLog(localData.activityLog ?? []);
        setDismissedNotificationIds(localData.dismissedNotifications ?? []);
        setCollapsedTasks(localData.tasks.map((task) => task.id));
      } catch {
        // Browser storage is optional; the server remains authoritative.
      }
      if (!cancelled) { setSaveState("offline"); setSaveError("Kairos is working locally. Your changes will sync when the data server reconnects."); setReady(true); }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function syncView() { setCurrentView(viewForPath(window.location.pathname)); }
    syncView();
    window.addEventListener("popstate", syncView);
    return () => window.removeEventListener("popstate", syncView);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("kairos-tasks-v1", JSON.stringify(tasks));
  }, [tasks, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem("kairos-sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem("kairos-tag-library-v1", JSON.stringify(tagLibrary));
  }, [tagLibrary, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem("kairos-workspaces-v1", JSON.stringify(workspaces));
  }, [workspaces, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem("kairos-activity-log-v1", JSON.stringify(activityLog));
  }, [activityLog, ready]);

  useEffect(() => {
    if (ready) localStorage.setItem("kairos-dismissed-notifications-v1", JSON.stringify(dismissedNotificationIds));
  }, [dismissedNotificationIds, ready]);

  useEffect(() => {
    if (!ready || !serverReady) return;
    const attempt = ++saveAttemptRef.current;
    const timer = window.setTimeout(async () => {
      const data: KairosData = { version: 1, tasks, tagLibrary, workspaces, activityLog, dismissedNotifications: dismissedNotificationIds };
      setSaveState("saving");
      setSaveError("");
      try {
        const response = await fetch("/api/state", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        if (attempt === saveAttemptRef.current) setSaveState("saved");
      } catch (error) {
        if (attempt === saveAttemptRef.current) {
          setSaveState("error");
          setSaveError(error instanceof Error ? error.message : "Kairos could not save your changes.");
        }
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [tasks, tagLibrary, workspaces, activityLog, dismissedNotificationIds, ready, serverReady]);

  useEffect(() => {
    function handleShortcuts(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        setSidebarCollapsed((value) => !value);
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const firstWorkspace = Object.entries(workspaces).find(([, info]) => info.active)?.[0] ?? Object.keys(workspaces)[0] ?? "";
        setNewWorkspace(activeWorkspace ?? firstWorkspace);
        setFormError("");
        setShowNew(true);
      }
    }
    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [activeWorkspace, workspaces]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function dismissWithEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setNotificationsOpen(false);
      setDependencyPickerOpen(false);
      setShowNew(false);
      setDetailsFullscreen(false);
      setEditTaskId(null);
      setSelected(null);
    }
    window.addEventListener("keydown", dismissWithEscape);
    return () => window.removeEventListener("keydown", dismissWithEscape);
  }, []);

  useEffect(() => {
    if (showNew) window.setTimeout(() => newTitleRef.current?.focus(), 0);
  }, [showNew]);

  useEffect(() => {
    if (!notificationsOpen) return;
    function closeNotifications(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setNotificationsOpen(false);
    }
    document.addEventListener("mousedown", closeNotifications);
    return () => document.removeEventListener("mousedown", closeNotifications);
  }, [notificationsOpen]);

  useEffect(() => {
    if (currentView !== "settings" || settingsTab !== "uploads") return;
    fetch("/api/attachments", { headers: { Accept: "application/json" } })
      .then((response) => response.ok ? response.json() as Promise<{ attachments?: Attachment[] }> : Promise.reject(new Error("Unable to read uploads")))
      .then((payload) => setUploads(Array.isArray(payload.attachments) ? payload.attachments : []))
      .catch(() => setUploads([]));
  }, [currentView, settingsTab]);

  const visibleTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
    const matchesFilter = filter === "All work" || (filter === "In progress" && task.steps.some((s) => s.status === "in-progress")) || (filter === "Blocked" && task.steps.some((s) => s.status === "blocked")) || task.priority === filter;
    return matchesFilter && (!activeWorkspace || task.project === activeWorkspace);
    });
    if (sortBy === "manual") return filtered;
    const urgencyRank: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };
    return [...filtered].sort((a, b) => {
      if (sortBy === "urgency") {
        const result = urgencyRank[a.priority] - urgencyRank[b.priority] || a.title.localeCompare(b.title);
        return sortDirection === "asc" ? result : -result;
      }
      const aDeadline = Math.min(...a.steps.map((step) => parseDateKey(normalizeDeadline(step.deadline))?.getTime() ?? Number.MAX_SAFE_INTEGER));
      const bDeadline = Math.min(...b.steps.map((step) => parseDateKey(normalizeDeadline(step.deadline))?.getTime() ?? Number.MAX_SAFE_INTEGER));
      const result = aDeadline - bDeadline || a.title.localeCompare(b.title);
      return sortDirection === "asc" ? result : -result;
    });
  }, [tasks, filter, activeWorkspace, sortBy, sortDirection]);

  const selectedTask = selected ? tasks.find((task) => task.id === selected.taskId) : undefined;
  const selectedStep = selectedTask?.steps.find((step) => step.id === selected?.stepId);
  const taskToEdit = editTaskId ? tasks.find((task) => task.id === editTaskId) : undefined;
  const openSteps = useMemo(() => tasks.flatMap((task) => task.steps.filter((step) => step.status !== "done").map((step) => ({ task, step }))), [tasks]);
  const sortedOpenSteps = useMemo(() => [...openSteps].sort((a, b) => {
    const rank: Record<Status, number> = { blocked: 0, "in-progress": 1, todo: 2, done: 3 };
    const aDate = parseDateKey(normalizeDeadline(a.step.deadline))?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bDate = parseDateKey(normalizeDeadline(b.step.deadline))?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const statusDifference = rank[a.step.status] - rank[b.step.status];
    const result = stepSortBy === "urgency" ? statusDifference || aDate - bDate || a.task.title.localeCompare(b.task.title) : aDate - bDate || statusDifference || a.task.title.localeCompare(b.task.title);
    return stepSortDirection === "asc" ? result : -result;
  }), [openSteps, stepSortBy, stepSortDirection]);
  const blockedSteps = openSteps.filter(({ step }) => step.status === "blocked");
  const urgentSteps = sortedOpenSteps.slice(0, 5);
  const visibleNotifications = blockedSteps.filter(({ step }) => !dismissedNotificationIds.includes(step.id));
  const workspaceTaskCount = activeWorkspace ? tasks.filter((task) => task.project === activeWorkspace).length : tasks.length;
  const inMotionCount = tasks.filter((task) => task.steps.some((step) => step.status === "in-progress")).length;
  const blockedCount = tasks.filter((task) => task.steps.some((step) => step.status === "blocked")).length;
  const closestStep = useMemo(() => openSteps
    .map(({ task, step }) => ({ task, step, date: parseDateKey(normalizeDeadline(step.deadline)) }))
    .filter((item): item is { task: Task; step: Step; date: Date } => item.date !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0], [openSteps]);
  const closestDeadlineDays = closestStep ? Math.max(0, Math.ceil((closestStep.date.getTime() - new Date(clock.getFullYear(), clock.getMonth(), clock.getDate()).getTime()) / 86_400_000)) : null;
  const allSteps = tasks.flatMap((task) => task.steps);
  const weeklyProgress = allSteps.length === 0 ? 0 : Math.round((allSteps.filter((step) => step.status === "done").length / allSteps.length) * 100);
  const completionHistory = useMemo(() => {
    const today = new Date(clock.getFullYear(), clock.getMonth(), clock.getDate());
    const days = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (13 - index));
      return { date, key: dateKey(date), count: 0 };
    });
    const counts = new Map(days.map((day) => [day.key, 0]));
    tasks.forEach((task) => task.steps.forEach((step) => (step.activity ?? []).forEach((entry) => {
      if (entry.status === "done") {
        const key = dateKey(new Date(entry.timestamp));
        if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    })));
    return days.map((day) => ({ ...day, count: counts.get(day.key) ?? 0 }));
  }, [tasks, clock]);
  const completionMax = Math.max(1, ...completionHistory.map((day) => day.count));
  const todayKey = dateKey(new Date());
  const calendarDates = useMemo(() => {
    const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - mondayOffset);
    return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
  }, [calendarMonth]);
  const calendarLabel = calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const headerDateLabel = `W${String(isoWeekNumber(clock)).padStart(2, "0")} · ${clock.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}`.toUpperCase();
  const headerTimeLabel = clock.toLocaleTimeString(undefined, { hour12: false });
  const greeting = greetingForHour(new Date().getHours());

  function navigateTo(view: View) {
    setCurrentView(view);
    const base = window.location.pathname.startsWith("/kairos") ? "/kairos" : "";
    const suffix = view === "journeys" ? "/work" : view === "backlog" ? "" : `/${view}`;
    window.history.pushState({}, "", `${base}${suffix || "/"}`);
  }

  function recordActivity(action: ActivityLogEntry["action"], entity: ActivityLogEntry["entity"], message: string) {
    setActivityLog((current) => [...current, { id: Date.now() * 1000 + Math.floor(Math.random() * 1000), timestamp: new Date().toISOString(), action, entity, message }].slice(-200));
  }

  function updateTask(taskId: number, patch: Partial<Task>) {
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, ...patch } : task));
    const task = tasks.find((item) => item.id === taskId);
    if (task) recordActivity("edited", "journey", `Edited journey “${task.title}”.`);
  }

  function toggleTaskCollapsed(taskId: number) {
    setCollapsedTasks((current) => current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]);
  }

  function addTagToTask(task: Task, rawTag: string) {
    const tag = rawTag.trim();
    if (!tag || task.tags.includes(tag)) return;
    updateTask(task.id, { tags: [...task.tags, tag] });
    if (!tagLibrary[tag]) setTagLibrary((current) => ({ ...current, [tag]: "#718096" }));
  }

  function renameTag(oldName: string, nextName: string) {
    const name = nextName.trim();
    if (!name || name === oldName || Object.prototype.hasOwnProperty.call(tagLibrary, name)) return;
    setTagLibrary((current) => { const next = { ...current, [name]: current[oldName] }; delete next[oldName]; return next; });
    setTasks((current) => current.map((task) => ({ ...task, tags: task.tags.map((tag) => tag === oldName ? name : tag) })));
    recordActivity("edited", "tag", `Renamed tag “${oldName}” to “${name}”.`);
  }

  function deleteTag(tagName: string) {
    setTagLibrary((current) => { const next = { ...current }; delete next[tagName]; return next; });
    setTasks((current) => current.map((task) => ({ ...task, tags: task.tags.filter((tag) => tag !== tagName) })));
    recordActivity("removed", "tag", `Removed tag “${tagName}”.`);
  }

  function renameWorkspace(oldName: string, nextName: string) {
    if (oldName === ON_HOLD_WORKSPACE) return;
    const name = nextName.trim();
    if (!name || name === oldName || Object.prototype.hasOwnProperty.call(workspaces, name)) return;
    setWorkspaces((current) => { const next = { ...current, [name]: current[oldName] }; delete next[oldName]; return next; });
    setTasks((current) => current.map((task) => task.project === oldName ? { ...task, project: name } : task));
    if (activeWorkspace === oldName) setActiveWorkspace(name);
    recordActivity("edited", "workspace", `Renamed workspace “${oldName}” to “${name}”.`);
  }

  function updateStep(patch: Partial<Step>) {
    if (!selected) return;
    setTasks((current) => current.map((task) => task.id !== selected.taskId ? task : {
      ...task,
      steps: task.steps.map((step) => step.id === selected.stepId ? { ...step, ...patch } : step),
    }));
    const task = tasks.find((item) => item.id === selected.taskId);
    const step = task?.steps.find((item) => item.id === selected.stepId);
    if (task && step) recordActivity("edited", "step", `Edited step “${step.label}” in “${task.title}”.`);
  }

  function setStepStatus(taskId: number, stepId: number, status: Status) {
    const timestamp = new Date().toISOString();
    setTasks((current) => current.map((task) => task.id !== taskId ? task : {
      ...task,
      steps: task.steps.map((step) => step.id !== stepId ? step : {
        ...step,
        status,
        activity: [{ id: Date.now(), message: `You moved this step to ${statusLabel[status].toLowerCase()}`, timestamp, status }, ...(step.activity ?? [])].slice(0, 20),
      }),
    }));
    const task = tasks.find((item) => item.id === taskId);
    const step = task?.steps.find((item) => item.id === stepId);
    if (task && step) recordActivity("moved", "step", `Moved “${step.label}” in “${task.title}” to ${statusLabel[status].toLowerCase()}.`);
    if (status !== "blocked") setDismissedNotificationIds((current) => current.filter((id) => id !== stepId));
  }

  function openNewTask() {
    const firstWorkspace = Object.entries(workspaces).find(([, info]) => info.active)?.[0] ?? Object.keys(workspaces)[0] ?? "";
    setNewWorkspace(activeWorkspace ?? firstWorkspace);
    setFormError("");
    setShowNew(true);
  }

  function addTask() {
    if (!newTitle.trim()) {
      setFormError("Give this journey a name before creating it.");
      return;
    }
    setTasks((current) => {
      const id = nextAvailableId(current);
      const project = newWorkspace || activeWorkspace || Object.entries(workspaces).find(([, info]) => info.active)?.[0] || Object.keys(workspaces)[0] || "New initiative";
      return [{
        id,
        title: newTitle.trim(),
        project,
        tags: ["Planning"],
        priority: "Medium",
        links: [],
        dependencies: [],
        steps: [
          { id: id + 1, label: "Define", status: "todo", note: "", deadline: dateKey(new Date()), activity: [] },
          { id: id + 2, label: "Plan", status: "todo", note: "", deadline: dateKey(new Date()) },
          { id: id + 3, label: "Execute", status: "todo", note: "", deadline: dateKey(new Date()) },
        ],
      }, ...current];
    });
    setNewTitle("");
    setNewWorkspace("");
    setFormError("");
    setShowNew(false);
    recordActivity("added", "journey", `Created journey “${newTitle.trim()}”.`);
  }

  function addBacklogTask() {
    const title = quickTitle.trim();
    if (!title) {
      setFormError("Write a task before adding it.");
      return;
    }
    const id = nextAvailableId(tasks);
    setTasks((current) => [{ id, title, project: "Backlog", tags: [], priority: "Medium", links: [], dependencies: [], steps: [], backlog: true }, ...current]);
    setActivityLog((current) => [...current, { id: Date.now() * 1000, timestamp: new Date().toISOString(), action: "added", entity: "journey", message: `Added “${title}” to the backlog.` }].slice(-200));
    setQuickTitle("");
    setFormError("");
  }

  function finishTaskEdit(task: Task) {
    if (task.backlog && task.project !== "Backlog" && task.steps.length > 0) {
      updateTask(task.id, { backlog: false });
      recordActivity("moved", "journey", `Moved “${task.title}” from the backlog into journeys.`);
    }
    setEditTaskId(null);
  }

  function deleteTask(taskId: number) {
    const task = tasks.find((item) => item.id === taskId);
    setTasks((current) => current.filter((task) => task.id !== taskId));
    if (selected?.taskId === taskId) setSelected(null);
    if (editTaskId === taskId) setEditTaskId(null);
    if (task) recordActivity("removed", "journey", `Removed journey “${task.title}”.`);
  }

  function deleteSelectedStep() {
    if (!selected) return;
    const { taskId, stepId } = selected;
    const task = tasks.find((item) => item.id === taskId);
    const step = task?.steps.find((item) => item.id === stepId);
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, steps: task.steps.filter((step) => step.id !== stepId) } : task));
    setSelected(null);
    if (task && step) recordActivity("removed", "step", `Removed step “${step.label}” from “${task.title}”.`);
  }

  function addStep(taskId: number) {
    const stepId = nextAvailableId(tasks);
    const step: Step = { id: stepId, label: "New step", status: "todo", note: "", deadline: "", activity: [] };
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, steps: [...task.steps, step] } : task));
    setSelected({ taskId, stepId });
    setEditTaskId(null);
    const task = tasks.find((item) => item.id === taskId);
    if (task) recordActivity("added", "step", `Added a new step to “${task.title}”.`);
  }

  function viewTaskInJourneys(task: Task) {
    setActiveWorkspace(null);
    setCollapsedTasks((current) => current.filter((id) => id !== task.id));
    setEditTaskId(null);
    setSelected(null);
    navigateTo("journeys");
  }

  function viewStepInMySteps(task: Task, step: Step) {
    setActiveWorkspace(null);
    setEditTaskId(null);
    setSelected({ taskId: task.id, stepId: step.id });
    navigateTo("my-tasks");
  }

  function pauseTask(task: Task) {
    if (task.project === ON_HOLD_WORKSPACE) return;
    updateTask(task.id, { project: ON_HOLD_WORKSPACE, pausedFrom: task.project });
    recordActivity("moved", "journey", `Paused journey “${task.title}” in On hold.`);
    setEditTaskId(null);
  }

  function resumeTask(task: Task) {
    const fallback = Object.entries(workspaces).find(([name, info]) => info.active && name !== ON_HOLD_WORKSPACE)?.[0] ?? "Brand refresh";
    updateTask(task.id, { project: task.pausedFrom && workspaces[task.pausedFrom] ? task.pausedFrom : fallback, pausedFrom: undefined });
    recordActivity("moved", "journey", `Resumed journey “${task.title}”.`);
    setEditTaskId(null);
  }

  async function retrySave() {
    setSaveState("saving");
    setSaveError("");
    const data: KairosData = { version: 1, tasks, tagLibrary, workspaces, activityLog, dismissedNotifications: dismissedNotificationIds };
    const attempt = ++saveAttemptRef.current;
    try {
      const response = await fetch("/api/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      setServerReady(true);
      if (attempt === saveAttemptRef.current) setSaveState("saved");
    } catch (error) {
      if (attempt === saveAttemptRef.current) {
        setSaveState(serverReady ? "error" : "offline");
        setSaveError(error instanceof Error ? error.message : "Kairos could not save your changes.");
      }
    }
  }

  function reorder(overId: number) {
    if (dragged === null || dragged === overId) return;
    setTasks((current) => {
      const from = current.findIndex((task) => task.id === dragged);
      const to = current.findIndex((task) => task.id === overId);
      const next = [...current];
      const [moving] = next.splice(from, 1);
      next.splice(to, 0, moving);
      return next;
    });
  }

  function exportData() {
    const data: KairosData = { version: 1, exportedAt: new Date().toISOString(), tasks, tagLibrary, workspaces, activityLog, dismissedNotifications: dismissedNotificationIds };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `kairos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function importData(file: File) {
    try {
      const data = parseBackup(JSON.parse(await file.text()) as unknown);
      setTasks(data.tasks);
      setTagLibrary(data.tagLibrary);
      setWorkspaces(data.workspaces);
      setActivityLog(data.activityLog ?? []);
      setDismissedNotificationIds(data.dismissedNotifications ?? []);
      setCollapsedTasks(data.tasks.map((task) => task.id));
      setSaveError("");
    } catch (error) { window.alert(error instanceof Error ? error.message : "That file is not a valid Kairos backup."); }
  }

  async function uploadAttachment(file: File) {
    if (!selected) return;
    if (file.size > 10 * 1024 * 1024) { window.alert("Files must be 10 MB or smaller."); return; }
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
    try {
      const response = await fetch("/api/attachments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, type: file.type || "application/octet-stream", data: btoa(binary) }) });
      if (!response.ok) throw new Error("The file could not be saved to Kairos.");
      const payload = await response.json() as { attachment: Attachment };
      updateStep({ attachment: payload.attachment });
      recordActivity("added", "attachment", `Attached “${file.name}” to a step.`);
    } catch (error) { window.alert(error instanceof Error ? error.message : "The file could not be saved to Kairos."); }
  }

  async function deleteUpload(attachment: Attachment) {
    if (!window.confirm(`Delete “${attachment.name}” from Kairos?`)) return;
    try {
      const response = await fetch(`/api/attachments/${encodeURIComponent(attachment.id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("The file could not be deleted.");
      setUploads((current) => current.filter((item) => item.id !== attachment.id));
      setTasks((current) => current.map((task) => ({ ...task, steps: task.steps.map((step) => step.attachment?.id === attachment.id ? { ...step, attachment: undefined } : step) })));
      recordActivity("removed", "attachment", `Deleted uploaded file “${attachment.name}”.`);
    } catch (error) { window.alert(error instanceof Error ? error.message : "The file could not be deleted."); }
  }

  if (!ready) {
    return <main className="app-shell"><section className="workspace"><div className="empty" role="status"><span>⌁</span><h3>Loading Kairos…</h3><p>Reading your saved workstreams.</p></div></section></main>;
  }

  return (
    <main className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/><circle cx="6" cy="6" r="1.6" fill="currentColor"/></svg></span><div><span className="brand-name">Kairos</span></div></div>
        <button className="collapse-toggle" onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>{sidebarCollapsed ? "›" : "‹"}</button>
        <nav aria-label="Primary navigation">
          <button className={`nav-item ${currentView === "backlog" ? "active" : ""}`} title="Welcome" onClick={() => navigateTo("backlog")}><span>＋</span><span className="nav-text">Welcome</span><b>{tasks.filter((task) => task.backlog).length}</b></button>
          <button className={`nav-item ${currentView === "journeys" ? "active" : ""}`} title="Workstreams" onClick={() => navigateTo("journeys")}><span>⌁</span><span className="nav-text">Workstreams</span></button>
          <button className={`nav-item ${currentView === "my-tasks" ? "active" : ""}`} title="My steps" onClick={() => { navigateTo("my-tasks"); setSelected(null); setEditTaskId(null); }}><span>◫</span><span className="nav-text">My steps</span><b>{tasks.flatMap((task) => task.steps).filter((step) => step.status !== "done").length}</b></button>
          <button className={`nav-item ${currentView === "calendar" ? "active" : ""}`} title="Calendar" onClick={() => { navigateTo("calendar"); setSelected(null); setEditTaskId(null); }}><span>⌑</span><span className="nav-text">Calendar</span></button>
          <button className={`nav-item ${currentView === "settings" ? "active" : ""}`} title="Settings" onClick={() => { navigateTo("settings"); setSelected(null); setEditTaskId(null); }}><span>⚙</span><span className="nav-text">Settings</span></button>
        </nav>
        <div className="nav-label">Workspace</div>
        <button className={`nav-item workspace-nav ${activeWorkspace === null ? "active" : ""}`} title="All workspaces" onClick={() => { setActiveWorkspace(null); navigateTo("journeys"); }}><span className="all-workspaces-mark" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.3" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="8" r="1.7" fill="currentColor"/></svg></span><span className="nav-text">All workspaces</span><b>{tasks.length}</b></button>
        {Object.entries(workspaces).filter(([, info]) => info.active).map(([name, info]) => <button key={name} className={`nav-item workspace-nav ${activeWorkspace === name ? "active" : ""}`} title={name} onClick={() => { setActiveWorkspace(name); navigateTo("journeys"); }}><span className="project-dot" style={{ background: info.color }} /><span className="nav-text">{name}</span><b>{tasks.filter((task) => task.project === name).length}</b></button>)}
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="topbar-intro"><p className="eyebrow date-label">{headerDateLabel} · {headerTimeLabel}</p>{currentView === "backlog" && <h1>Welcome, Christian.</h1>}{currentView === "journeys" && <><h1>{greeting}, Christian.</h1><p className="topbar-sub">Your workstreams, milestones, and next steps in one view.</p></>}</div>
          <div className="top-actions"><div className="notification-wrap" ref={notificationRef}><button className="icon-btn" aria-label={`${visibleNotifications.length} attention notifications`} aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((value) => !value)}>♧{visibleNotifications.length > 0 && <i />}</button>{notificationsOpen && <div className="notification-popover" role="status"><div className="notification-head"><strong>Attention queue</strong><div><button className="notification-clear" onClick={() => { setDismissedNotificationIds(blockedSteps.map(({ step }) => step.id)); setNotificationsOpen(false); }}>Clear</button><button className="notification-dismiss" aria-label="Close attention queue" onClick={() => setNotificationsOpen(false)}>×</button></div></div>{visibleNotifications.length > 0 ? visibleNotifications.slice(0, 4).map(({ task, step }) => <button key={`${task.id}-${step.id}`} onClick={() => { setSelected({ taskId: task.id, stepId: step.id }); setNotificationsOpen(false); }}><b>{step.label}</b><span>{task.title}</span></button>) : <p>No attention items right now.</p>}<small className="notification-help">Items appear when a step is marked Blocked. Clearing hides current alerts until another blocked step is created.</small></div>}</div>{currentView !== "backlog" && <button className="new-btn" onClick={openNewTask}><span className="new-btn-inner"><svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6.5 2v9M2 6.5h9"/></svg>New task</span></button>}</div>
        </header>

        {(saveState === "error" || saveState === "offline") && <div className="save-status" role="alert"><span>{saveError || "Your latest changes are not saved to the server."}</span><button onClick={retrySave}>{serverReady ? "Retry save" : "Reconnect"}</button></div>}

        {currentView === "settings" ? <section className="settings-page">
          <div className="settings-head"><div><p className="eyebrow">PERSONAL SETTINGS</p><h2>Organize your system</h2><p>Keep projects and vocabulary useful as your work changes.</p></div></div>
          <div className="settings-tabs"><button className={settingsTab === "tags" ? "active" : ""} onClick={() => setSettingsTab("tags")}>Tags <span>{Object.keys(tagLibrary).length}</span></button><button className={settingsTab === "workspaces" ? "active" : ""} onClick={() => setSettingsTab("workspaces")}>Workspaces <span>{Object.keys(workspaces).length}</span></button><button className={settingsTab === "activity" ? "active" : ""} onClick={() => setSettingsTab("activity")}>Activity log <span>{activityLog.length}</span></button><button className={settingsTab === "uploads" ? "active" : ""} onClick={() => setSettingsTab("uploads")}>Uploads <span>{uploads.length}</span></button><button className={settingsTab === "data" ? "active" : ""} onClick={() => setSettingsTab("data")}>Data</button></div>
          {settingsTab === "tags" ? <><div className="settings-card">
            <div className="tag-table-head"><span>Tag</span><span>Color</span><span>Used on</span><span /></div>
            {Object.entries(tagLibrary).map(([tag, color]) => <div className="tag-setting-row" key={tag}>
              <div className="tag-name-edit"><i style={{ background: color }} /><input defaultValue={tag} onBlur={(e) => renameTag(tag, e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} aria-label={`Rename ${tag}`} /></div>
              <label className="color-picker"><input type="color" value={color} onChange={(e) => setTagLibrary((current) => ({ ...current, [tag]: e.target.value }))}/><span>{color.toUpperCase()}</span></label>
              <span className="usage-count">{tasks.filter((task) => task.tags.includes(tag)).length} tasks</span>
              <button className="delete-tag" onClick={() => deleteTag(tag)} aria-label={`Delete ${tag}`}>Delete</button>
            </div>)}
            <div className="new-tag-row"><input value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="New tag name"/><label className="color-picker"><input type="color" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)}/><span>{newTagColor.toUpperCase()}</span></label><button onClick={() => { const name = newTagName.trim(); if (name && !Object.prototype.hasOwnProperty.call(tagLibrary, name)) { setTagLibrary((current) => ({ ...current, [name]: newTagColor })); setNewTagName(""); } }}>＋ Add tag</button></div>
          </div>
          <div className="settings-note"><span>i</span><p><strong>One shared vocabulary</strong>Tags created while editing a task are saved here automatically and suggested everywhere else.</p></div></> : settingsTab === "workspaces" ? <><div className="settings-card workspace-settings-card">
            <div className="workspace-table-head"><span>Workspace / project</span><span>Tasks</span><span>Status</span></div>
            {Object.entries(workspaces).map(([name, info]) => <div className="workspace-setting-row" key={name}>
              <div className="workspace-name-edit"><div className="workspace-edit-line"><i style={{ background: info.color }}/><input defaultValue={name} aria-label={`Rename ${name}`} onBlur={(e) => renameWorkspace(name, e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}/><label className="color-picker" title="Change workspace colour"><input type="color" value={info.color} onChange={(e) => setWorkspaces((current) => ({ ...current, [name]: { ...current[name], color: e.target.value } }))}/><span>{info.color.toUpperCase()}</span></label></div><textarea value={info.description} aria-label={`${name} description`} onChange={(e) => setWorkspaces((current) => ({ ...current, [name]: { ...current[name], description: e.target.value } }))}/></div>
              <span className="usage-count">{tasks.filter((task) => task.project === name).length} tasks</span>
              {name === ON_HOLD_WORKSPACE ? <span className="workspace-status system">System</span> : <button className={`workspace-status ${info.active ? "open" : "closed"}`} onClick={() => setWorkspaces((current) => ({ ...current, [name]: { ...current[name], active: !current[name].active } }))}>{info.active ? "Live" : "Closed"}</button>}
            </div>)}
            <div className="new-workspace-row"><input value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} placeholder="New workspace name"/><label className="color-picker"><input type="color" value={newWorkspaceColor} onChange={(e) => setNewWorkspaceColor(e.target.value)}/><span>{newWorkspaceColor.toUpperCase()}</span></label><button onClick={() => { const name = newWorkspaceName.trim(); if (name && !Object.prototype.hasOwnProperty.call(workspaces, name)) { setWorkspaces((current) => ({ ...current, [name]: { description: "A collection of related tasks and journeys.", color: newWorkspaceColor, active: true } })); setNewWorkspaceName(""); } }}>＋ New workspace</button></div>
          </div><div className="settings-note"><span>i</span><p><strong>Projects without clutter</strong>Closing a workspace hides it from navigation without deleting its tasks. Reopen it here any time.</p></div></> : settingsTab === "activity" ? <section className="activity-log-page"><div className="settings-card activity-log-card">{activityLog.length === 0 ? <div className="empty"><span>◌</span><h3>No activity yet</h3><p>Your latest Kairos changes will appear here.</p></div> : [...activityLog].reverse().map((entry) => <article className="activity-log-row" key={entry.id}><span className={`activity-action ${entry.action}`}>{entry.action}</span><div><strong>{entry.message}</strong><time>{new Date(entry.timestamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</time></div></article>)}</div></section> : settingsTab === "uploads" ? <><div className="settings-card uploads-card">{uploads.length === 0 ? <div className="empty"><span>⌁</span><h3>No uploads yet</h3><p>Files attached to steps will appear here.</p></div> : uploads.map((attachment) => <article className="upload-row" key={attachment.id}><div><strong>{attachment.name}</strong><small>{Math.ceil(attachment.size / 1024)} KB · {attachment.type || "File"}</small></div><div><a className="save-btn" href={`/api/attachments/${encodeURIComponent(attachment.id)}`} target="_blank" rel="noreferrer">Open</a><button className="save-btn" onClick={() => deleteUpload(attachment)}>Delete</button></div></article>)}</div><div className="settings-note"><span>i</span><p><strong>Files stored with Kairos</strong>Uploads are stored on the Kairos server and can be removed here. Deleting a file also clears its step attachment.</p></div></> : <><div className="settings-card data-settings-card">
            <div><p className="eyebrow">STORAGE</p><h3>Your Kairos data</h3><p>{saveState === "saved" ? "Saved securely to this Kairos server." : saveState === "saving" ? "Saving your latest changes…" : saveState === "offline" ? "Offline: local data is shown until the server reconnects." : `Save failed: ${saveError || "the server did not accept the change."}`}</p></div>
            <div className="data-actions"><button onClick={exportData}>↓ Download backup</button><label>↑ Import backup<input type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) importData(file); event.currentTarget.value = ""; }} /></label></div>
          </div><div className="settings-note"><span>i</span><p><strong>Moving to your Pi</strong>Download a backup here, open Kairos on the Pi, then import the same file. The Pi stores future changes in SQLite automatically.</p></div></>}
        </section> : currentView === "backlog" ? <section className="backlog-page">
          <div className="backlog-hero"><h2>Kairos</h2><form onSubmit={(event) => { event.preventDefault(); addBacklogTask(); }}><input className={formError ? "input-error" : ""} value={quickTitle} onChange={(event) => { setQuickTitle(event.target.value); setFormError(""); }} placeholder="What needs doing?" aria-label="Quick task name" aria-invalid={Boolean(formError)} autoComplete="off" data-1p-ignore="true" data-lpignore="true" data-bwignore="true"/><button className="new-btn backlog-new-btn" type="submit"><span className="new-btn-inner"><svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6.5 2v9M2 6.5h9"/></svg>New task</span></button></form>{formError && <p className="form-error" role="alert">{formError}</p>}</div>
          <div className="backlog-lists"><section className="backlog-list"><div className="backlog-list-head"><div><p className="eyebrow">ACTIVE LIST</p><h3>Open workstreams</h3></div><span>{tasks.filter((task) => !task.backlog && task.steps.some((step) => step.status !== "done")).length}</span></div>{tasks.filter((task) => !task.backlog && task.steps.some((step) => step.status !== "done")).map((task) => { const urgent = task.steps.some((step) => { const days = daysUntil(step.deadline, clock); return step.status !== "done" && days !== null && days < 3; }); return <article className={`backlog-row ${urgent ? "urgent" : ""}`} key={task.id}><div><strong>{task.title}{urgent && <span className="urgent-marker">URGENT</span>}</strong><small>{task.project} · {progress(task)}% complete</small></div><button className="save-btn" onClick={() => { setEditTaskId(task.id); setSelected(null); }}>Open</button></article>; })}{tasks.filter((task) => !task.backlog && task.steps.some((step) => step.status !== "done")).length === 0 && <p className="backlog-empty">No open workstreams.</p>}</section>
            <section className="backlog-list"><div className="backlog-list-head"><div><p className="eyebrow">UNCATEGORISED</p><h3>New tasks</h3></div><span>{tasks.filter((task) => task.backlog).length}</span></div>{tasks.filter((task) => task.backlog).map((task) => <article className="backlog-row" key={task.id}><div><strong>{task.title}</strong><small>Add a workspace and steps to move this into Workstreams.</small></div><button className="save-btn" onClick={() => { setEditTaskId(task.id); setSelected(null); }}>Shape</button></article>)}{tasks.filter((task) => task.backlog).length === 0 && <p className="backlog-empty">Your quick-captured tasks will appear here.</p>}</section>
          </div>
        </section> : currentView === "calendar" ? <section className="calendar-page">
          <div className="view-title"><div><p className="eyebrow">DEADLINES</p><h2>{calendarLabel}</h2><p>Milestones from every active workstream, organized by deadline.</p></div><div className="calendar-actions"><label className="calendar-workspace-filter"><span>Workspace</span><select value={calendarWorkspace} onChange={(event) => setCalendarWorkspace(event.target.value)}><option>All workspaces</option>{Object.entries(workspaces).filter(([, info]) => info.active).map(([name]) => <option key={name}>{name}</option>)}</select></label><button aria-label="Previous month" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>‹</button><button className="today" onClick={() => { const today = new Date(); setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1)); }}>Today</button><button aria-label="Next month" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>›</button></div></div>
          <div className="calendar-weekdays">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid">{calendarDates.map((date) => { const key = dateKey(date); const inMonth = date.getMonth() === calendarMonth.getMonth() && date.getFullYear() === calendarMonth.getFullYear(); const events = tasks.flatMap((task) => task.steps.filter((step) => normalizeDeadline(step.deadline) === key && (calendarWorkspace === "All workspaces" || task.project === calendarWorkspace)).map((step) => ({ task, step }))); return <div key={key} className={`calendar-day ${inMonth ? "" : "outside"} ${key === todayKey ? "today-cell" : ""}`}><span>{date.getDate()}</span>{events.map(({ task, step }) => <button key={`${task.id}-${step.id}`} className="calendar-event" style={{ borderLeftColor: workspaces[task.project]?.color ?? "#91a09a", background: `${workspaces[task.project]?.color ?? "#91a09a"}18` }} onClick={() => { setSelected({ taskId: task.id, stepId: step.id }); setEditTaskId(null); }}><i style={{ background: workspaces[task.project]?.color ?? "#91a09a" }}/><strong>{step.label}</strong><small>{task.title}</small></button>)}</div>; })}</div>
          <div className="calendar-legend">{Object.entries(workspaces).filter(([, info]) => info.active).map(([name, info]) => <span key={name}><i style={{ background: info.color }}/>{name}</span>)}</div>
        </section> : currentView === "my-tasks" ? <section className="my-tasks-page">
          <div className="view-title"><div><p className="eyebrow">YOUR NEXT ACTIONS</p><h2>My steps <span className="heading-count">{tasks.flatMap((task) => task.steps).filter((step) => step.status !== "done").length}</span></h2><p>Individual steps assigned to you across every workstream.</p></div><div className="view-title-actions"><label className="sort-control"><span>Sort by</span><select value={stepSortBy} onChange={(e) => setStepSortBy(e.target.value as typeof stepSortBy)}><option value="urgency">Urgency</option><option value="deadline">Deadline</option></select><button className="sort-direction" onClick={() => setStepSortDirection((value) => value === "asc" ? "desc" : "asc")} aria-label={`Sort ${stepSortDirection === "asc" ? "descending" : "ascending"}`}>{stepSortDirection === "asc" ? "↑" : "↓"}</button></label></div></div>
          <div className="action-list">{sortedOpenSteps.map(({ task, step }) => <article key={`${task.id}-${step.id}`}><button className={`action-check ${step.status}`} aria-label={`${statusLabel[step.status]}. Change status`} title="Change status" onClick={() => setStepStatus(task.id, step.id, step.status === "blocked" ? "in-progress" : step.status === "in-progress" ? "done" : "in-progress")}>{step.status === "blocked" ? "!" : step.status === "in-progress" ? "·" : ""}</button><div><button className="step-name-link" onClick={() => { setSelected({ taskId: task.id, stepId: step.id }); setEditTaskId(null); }}>{step.label}</button><p>{task.title}</p></div><span className="workspace-chip" style={{ color: workspaces[task.project]?.color, background: `${workspaces[task.project]?.color ?? "#91a09a"}18` }}><i style={{ background: workspaces[task.project]?.color }}/>{task.project}</span><time>{formatDeadline(step.deadline)}</time><button className="open-action" onClick={() => { setSelected({ taskId: task.id, stepId: step.id }); setEditTaskId(null); }}>Open</button></article>)}</div>
          {sortedOpenSteps.length === 0 && <div className="empty"><span>✓</span><h3>No open steps</h3><p>Every step is done. Capture the next thing to move.</p></div>}
        </section> : <>
        <section className="overview">
          <div className="urgent-focus"><span>NEXT STEPS</span><div className="urgent-step-list">{urgentSteps.map(({ task, step }) => <button key={`${task.id}-${step.id}`} onClick={() => setStepStatus(task.id, step.id, "done")}><span className={`action-check ${step.status}`} aria-hidden="true">{step.status === "blocked" ? "!" : ""}</span><span><b>{step.label}</b><small>{task.title} · {formatDeadline(step.deadline)}</small></span></button>)}</div></div>
          <div className="overview-metrics"><div className="momentum-head"><StatusLoadingState /><span className="momentum-status"><i /> Updated just now</span></div><div className="momentum-stats"><div className="overview-stat in-motion"><span>IN MOTION</span><strong>{inMotionCount}</strong>{closestStep ? <p>Closest <button onClick={() => viewStepInMySteps(closestStep.task, closestStep.step)}>step deadline</button> {closestDeadlineDays === 0 ? "today" : `in ${closestDeadlineDays} ${closestDeadlineDays === 1 ? "day" : "days"}`}.</p> : <p>No upcoming step deadlines.</p>}</div><div className="overview-stat blocked"><span>BLOCKED</span><strong>{blockedCount}</strong><p>{blockedCount === 1 ? "Step needs attention." : "Steps need attention."}</p></div></div><div className="mini-progress"><span>WEEKLY PROGRESS <b>{allSteps.filter((step) => step.status === "done").length} of {allSteps.length} steps complete</b></span><div className="progress-ring" aria-label={`${weeklyProgress}% weekly progress`}><svg width="58" height="58" viewBox="0 0 58 58" aria-hidden="true"><circle cx="29" cy="29" r="23"/><circle className="progress-ring-value" cx="29" cy="29" r="23" pathLength="100" style={{ strokeDashoffset: 100 - weeklyProgress }}/></svg><small>{weeklyProgress}%</small></div><svg className="completion-line" viewBox="0 0 280 72" role="img" aria-label="Steps completed per day over the last 14 days" preserveAspectRatio="none"><polyline points={completionHistory.map((day, index) => `${(index / 13) * 280},${68 - (day.count / completionMax) * 56}`).join(" ")} /><g>{completionHistory.map((day, index) => <circle key={day.key} cx={(index / 13) * 280} cy={68 - (day.count / completionMax) * 56} r="2.2" />)}</g></svg></div></div>
        </section>

        {activeWorkspace && <section className="workspace-context" style={{ borderColor: `${workspaces[activeWorkspace]?.color ?? "#91a09a"}66`, background: `${workspaces[activeWorkspace]?.color ?? "#91a09a"}18` }}><span className="project-dot" style={{ background: workspaces[activeWorkspace]?.color }} /><div><small>WORKSPACE / PROJECT</small><h2>{activeWorkspace}</h2><p>{workspaces[activeWorkspace]?.description}</p></div><div className="workspace-summary"><strong>{visibleTasks.length}</strong><span>tasks</span></div><button onClick={() => setActiveWorkspace(null)}>View all workspaces</button></section>}

        <div className="content-head">
          <div><h2>{activeWorkspace ? "Work in this workspace" : "Workstreams"}</h2><p>{activeWorkspace ? "Related work, milestones, and dependencies in one view." : "See every task from first thought to finish line."}</p></div>
          <div className="content-controls"><label className="sort-control"><span>Sort by</span><select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} aria-label="Sort workstreams"><option value="manual">Default order</option><option value="urgency">Urgency</option><option value="deadline">Deadline date</option></select><button className="sort-direction" onClick={() => setSortDirection((value) => value === "asc" ? "desc" : "asc")} aria-label={`Sort ${sortDirection === "asc" ? "descending" : "ascending"}`}>{sortDirection === "asc" ? "↑" : "↓"}</button></label><div className="filters">
            {['All work', 'In progress', 'Blocked', 'High'].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}{item === 'All work' && <em>{workspaceTaskCount}</em>}</button>)}
          </div></div>
        </div>

        <div className="task-list">
          {visibleTasks.map((task) => (
            <article className={`task-card ${selectedTask?.id === task.id ? "selected" : ""} ${collapsedTasks.includes(task.id) ? "is-collapsed" : ""}`} key={task.id} draggable onDragStart={() => setDragged(task.id)} onDragOver={(e) => { e.preventDefault(); reorder(task.id); }} onDragEnd={() => setDragged(null)}>
              <button className="drag" aria-label={`Drag ${task.title}`}>⠿</button>
              <button className="journey-collapse-toggle" aria-label={`${collapsedTasks.includes(task.id) ? "Expand" : "Collapse"} ${task.title}`} aria-expanded={!collapsedTasks.includes(task.id)} onClick={() => toggleTaskCollapsed(task.id)}>{collapsedTasks.includes(task.id) ? "›" : "⌄"}</button>
              <button className="task-meta" onClick={() => { setDetailsFullscreen(false); setEditTaskId(task.id); setSelected(null); }} aria-label={`Edit ${task.title}`}>
                <div className="task-title-row"><h3>{task.title}</h3><div className="task-head-meta">{(task.dependencies?.length ?? 0) > 0 && <span title={`${task.dependencies?.length} dependencies`}>↳ {task.dependencies?.length}</span>}{(task.links?.length ?? 0) > 0 && <span title={`${task.links?.length} reference links`}>↗ {task.links?.length}</span>}<span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span></div></div>
                <div className="task-subline"><span className="workspace-label" style={{ color: workspaces[task.project]?.color }}><i style={{ background: workspaces[task.project]?.color }}/>{task.project}</span></div>
                <div className="tags">{task.tags.map((tag) => <span key={tag} style={{ color: tagLibrary[tag] ?? "#66736b", background: `${tagLibrary[tag] ?? "#718096"}1c` }}>{tag}</span>)}<span className="task-progress">{progress(task)}%</span></div>
              </button>
              <div className="journey" style={{ gridTemplateColumns: `repeat(${task.steps.length + 1}, minmax(42px, 1fr))` }}>
                <div className="journey-line" style={{ left: `calc(50% / ${task.steps.length + 1})`, right: `calc(50% / ${task.steps.length + 1})` }}><i style={{ width: `${progress(task)}%` }} /></div>
                {task.steps.map((step) => (
                  <button key={step.id} className={`step ${step.status} ${selected?.taskId === task.id && selected.stepId === step.id ? "active" : ""}`} onClick={() => { setDetailsFullscreen(false); setSelected({ taskId: task.id, stepId: step.id }); setEditTaskId(null); }}>
                    <span className="step-dot">{step.status === "done" ? "✓" : step.status === "blocked" ? "!" : ""}</span>
                    <strong>{step.label}</strong><small>{formatDeadline(step.deadline)}</small>{step.note && <b className="note-mark">•</b>}
                  </button>
                ))}
                <button className="add-step" aria-label="Add step" onClick={() => {
                  addStep(task.id);
                }}>＋</button>
              </div>
              <div className="completion"><strong>{progress(task)}%</strong><span>complete</span></div>
            </article>
          ))}
          {visibleTasks.length === 0 && <div className="empty"><span>⌁</span><h3>No workstreams found</h3><p>Try another filter or search term.</p></div>}
        </div>
        </>}
      </section>

      {(taskToEdit || (selectedStep && selectedTask)) && <button className={`panel-scrim ${detailsFullscreen ? "panel-scrim-dark" : ""}`} onClick={() => { setEditTaskId(null); setSelected(null); setDetailsFullscreen(false); }} aria-label="Close details" />}

      {taskToEdit && (
        <aside className={`detail-panel task-editor ${detailsFullscreen ? "details-fullscreen" : ""}`}>
          <div className="panel-head"><div><span>TASK DETAILS</span><strong>Edit the task, relationships, and context</strong></div><div className="panel-head-actions"><button className="panel-expand" onClick={() => setDetailsFullscreen(true)}>Open full screen</button><button onClick={() => { setEditTaskId(null); setDetailsFullscreen(false); }} aria-label="Close task details">×</button></div></div>
          <div className="panel-body">
            <label className="field-label" htmlFor="task-name">Task name</label>
            <input id="task-name" className="title-input task-name-input" value={taskToEdit.title} onChange={(e) => updateTask(taskToEdit.id, { title: e.target.value })} />
            <div className="two-cols"><div><label className="field-label" htmlFor="task-workspace">Workspace / project</label><select id="task-workspace" value={taskToEdit.project} onChange={(e) => updateTask(taskToEdit.id, { project: e.target.value })}>{taskToEdit.backlog && <option value="Backlog">Backlog</option>}{Object.entries(workspaces).filter(([name, info]) => info.active || taskToEdit.project === name).map(([name]) => <option key={name}>{name}</option>)}</select></div><div><label className="field-label" htmlFor="task-priority">Priority</label><select id="task-priority" value={taskToEdit.priority} onChange={(e) => updateTask(taskToEdit.id, { priority: e.target.value as Priority })}><option>High</option><option>Medium</option><option>Low</option></select></div></div>
            {taskToEdit.backlog && <div className="backlog-panel-callout"><strong>Quick task</strong><span>Add at least one step and choose a workspace, then Done will move it into Workstreams.</span><button className="save-btn" onClick={() => addStep(taskToEdit.id)}>＋ Add step</button></div>}
            <p className="field-label">Tags</p>
            <div className="editable-tags">{taskToEdit.tags.map((tag) => <button key={tag} style={{ color: tagLibrary[tag], background: `${tagLibrary[tag]}1c` }} onClick={() => updateTask(taskToEdit.id, { tags: taskToEdit.tags.filter((item) => item !== tag) })}>{tag} ×</button>)}</div>
            <div className="inline-add"><input list="tag-library-options" value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { addTagToTask(taskToEdit, tagDraft); setTagDraft(""); } }} placeholder="Type or choose a tag"/><datalist id="tag-library-options">{Object.keys(tagLibrary).filter((tag) => !taskToEdit.tags.includes(tag)).map((tag) => <option key={tag} value={tag}/>)}</datalist><button onClick={() => { addTagToTask(taskToEdit, tagDraft); setTagDraft(""); }}>Add</button></div>
            <div className="tag-suggestions">{Object.keys(tagLibrary).filter((tag) => !taskToEdit.tags.includes(tag)).slice(0, 5).map((tag) => <button key={tag} onClick={() => addTagToTask(taskToEdit, tag)}><i style={{ background: tagLibrary[tag] }}/>{tag}</button>)}</div>
            <p className="field-label">Reference links</p>
            <div className="link-list">{(taskToEdit.links ?? []).map((link) => <div key={link}><a href={link} target="_blank" rel="noreferrer">↗ {link.replace(/^https?:\/\//, "")}</a><button onClick={() => updateTask(taskToEdit.id, { links: (taskToEdit.links ?? []).filter((item) => item !== link) })}>×</button></div>)}</div>
            <div className="inline-add"><input value={linkDraft} onChange={(e) => setLinkDraft(e.target.value)} placeholder="Paste a link" aria-label="Reference link"/><button onClick={() => { const value = normalizeLink(linkDraft); if (!value) { setFormError("Enter a valid http or https link."); return; } updateTask(taskToEdit.id, { links: [...(taskToEdit.links ?? []), value] }); setLinkDraft(""); setFormError(""); }}>Add</button></div>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <p className="field-label">Dependencies</p>
            <p className="field-help">Choose a task that must move first.</p>
            <div className="dependency-picker">
              <button className="dependency-picker-trigger" onClick={() => setDependencyPickerOpen((open) => !open)} aria-expanded={dependencyPickerOpen}>Select a task… <span>{dependencyPickerOpen ? "⌃" : "⌄"}</span></button>
              {dependencyPickerOpen && <div className="dependency-picker-menu">{tasks.filter((task) => task.id !== taskToEdit.id && !(taskToEdit.dependencies ?? []).includes(task.id)).map((task) => { const color = workspaces[task.project]?.color ?? "#91a09a"; return <button key={task.id} onClick={() => { updateTask(taskToEdit.id, { dependencies: [...(taskToEdit.dependencies ?? []), task.id] }); setDependencyPickerOpen(false); }}><strong>{task.title}</strong><span>—</span><em style={{ color }}><i style={{ background: color }}/>{task.project}</em></button>; })}{tasks.filter((task) => task.id !== taskToEdit.id && !(taskToEdit.dependencies ?? []).includes(task.id)).length === 0 && <p>All available tasks are already linked.</p>}</div>}
            </div>
            <ul className="selected-dependencies">{(taskToEdit.dependencies ?? []).map((id) => { const dependency = tasks.find((task) => task.id === id); if (!dependency) return null; const workspaceColor = workspaces[dependency.project]?.color ?? "#91a09a"; return <li key={id} style={{ borderLeftColor: workspaceColor }}><span><strong>{dependency.title}</strong><small><i style={{ background: workspaceColor }}/><em style={{ color: workspaceColor }}>{dependency.project}</em> · {progress(dependency)}% complete</small></span><button onClick={() => updateTask(taskToEdit.id, { dependencies: (taskToEdit.dependencies ?? []).filter((item) => item !== id) })} aria-label={`Remove ${dependency.title}`}>×</button></li>; })}</ul>
          </div>
          <div className={`panel-footer task-footer ${taskToEdit.backlog ? "backlog-task-footer" : ""}`}>{taskToEdit.backlog ? <span>Not in Journeys yet</span> : <button className="save-btn" onClick={() => viewTaskInJourneys(taskToEdit)}>View</button>}{!taskToEdit.backlog && (taskToEdit.project === ON_HOLD_WORKSPACE ? <button className="save-btn" onClick={() => resumeTask(taskToEdit)}>Resume</button> : <button className="save-btn" onClick={() => pauseTask(taskToEdit)}>Pause</button>)}<button className="save-btn" onClick={() => { if (window.confirm("Delete this task?")) deleteTask(taskToEdit.id); }}>Delete</button><button className="save-btn" onClick={() => finishTaskEdit(taskToEdit)}>Done</button></div>
        </aside>
      )}

      {!taskToEdit && selectedStep && selectedTask && (
        <aside className={`detail-panel ${detailsFullscreen ? "details-fullscreen" : ""}`}>
          <div className="panel-head"><div><span>STEP DETAILS</span><strong>{selectedTask.title}</strong></div><div className="panel-head-actions"><button className="panel-expand" onClick={() => setDetailsFullscreen(true)}>Open full screen</button><button onClick={() => { setSelected(null); setDetailsFullscreen(false); }} aria-label="Close details">×</button></div></div>
          <div className="panel-body">
            <label className="field-label" htmlFor="step-name">Step name</label>
            <input id="step-name" className="title-input" value={selectedStep.label} onChange={(e) => updateStep({ label: e.target.value })} />
            <p className="field-label">Status</p>
            <div className="status-grid">{(["todo", "in-progress", "done", "blocked"] as Status[]).map((status) => <button key={status} className={`${status} ${selectedStep.status === status ? "active" : ""}`} onClick={() => setStepStatus(selectedTask.id, selectedStep.id, status)}><i />{statusLabel[status]}</button>)}</div>
            <div className="two-cols"><div><label className="field-label" htmlFor="step-deadline">Deadline</label><input id="step-deadline" className="selectish" type="date" value={normalizeDeadline(selectedStep.deadline)} onChange={(e) => updateStep({ deadline: e.target.value })} /></div><div><label className="field-label" htmlFor="step-owner">Owner</label><button id="step-owner" className="selectish" onClick={() => updateStep({ owner: selectedStep.owner === "Christian" ? "" : "Christian" })}><b className="tiny-avatar">CS</b><span>{selectedStep.owner || "Assign to me"}</span>⌄</button></div></div>
            <label className="field-label" htmlFor="step-people">People</label>
            <p className="field-help">Who do you need to reach, hear from, or wait for?</p>
            <input id="step-people" className="people-input" value={selectedStep.people ?? ""} onChange={(e) => updateStep({ people: e.target.value })} placeholder="e.g. Alex, client legal team" />
            <label className="field-label" htmlFor="step-notes">Notes</label>
            <textarea id="step-notes" value={selectedStep.note} onChange={(e) => updateStep({ note: e.target.value })} placeholder="Add context, decisions, or links…" />
            <div className="attachments"><span>{selectedStep.attachment ? `Attached: ${selectedStep.attachment.name}` : "Attachments"}</span><label className="attachment-button">＋ Add file<input type="file" onChange={(e) => { const file = e.currentTarget.files?.[0]; if (file) uploadAttachment(file); e.currentTarget.value = ""; }} /></label>{selectedStep.attachment && <a className="attachment-download" href={`/api/attachments/${encodeURIComponent(selectedStep.attachment.id)}`} target="_blank" rel="noreferrer">Open</a>}</div>
            <div className="activity"><span className="tiny-avatar">CS</span><p><strong>{selectedStep.activity?.[0]?.message ?? "Step created"}</strong><small>{selectedStep.activity?.[0]?.timestamp ? formatRelativeDate(selectedStep.activity[0].timestamp.slice(0, 10)) : "No activity yet"}</small></p><i>{statusLabel[selectedStep.status]}</i></div>
          </div>
          <div className="panel-footer step-footer"><button className="save-btn" onClick={() => { setDetailsFullscreen(false); setEditTaskId(selectedTask.id); setSelected(null); }}>View full task →</button><button className="save-btn" onClick={() => { if (window.confirm("Delete this step?")) deleteSelectedStep(); }}>Delete step</button><button className="save-btn" onClick={() => { setDetailsFullscreen(false); setSelected(null); }}>Done</button></div>
        </aside>
      )}

      {showNew && <div className="modal-backdrop"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="new-task-heading"><button className="modal-close" onClick={() => setShowNew(false)} aria-label="Close modal">×</button><span className="eyebrow">START A WORKSTREAM</span><h2 id="new-task-heading">What are you moving forward?</h2><p>Create the task now. You can shape its steps as you go.</p><label htmlFor="new-task-title">Task name<input ref={newTitleRef} id="new-task-title" value={newTitle} onChange={(e) => { setNewTitle(e.target.value); setFormError(""); }} onKeyDown={(e) => e.key === "Enter" && addTask()} placeholder="e.g. Plan customer workshop" /></label><label htmlFor="new-task-workspace">Workspace<select id="new-task-workspace" value={newWorkspace} onChange={(e) => setNewWorkspace(e.target.value)}>{Object.entries(workspaces).filter(([, info]) => info.active).map(([name]) => <option key={name} value={name}>{name}</option>)}</select></label>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="modal-actions"><button className="save-btn" onClick={() => setShowNew(false)}>Cancel</button><button className="save-btn" onClick={addTask}>Create workstream</button></div></div></div>}
    </main>
  );
}
