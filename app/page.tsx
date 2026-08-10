"use client";

import { useEffect, useMemo, useState } from "react";

type Status = "done" | "in-progress" | "blocked" | "todo";
type Priority = "High" | "Medium" | "Low";
type Step = { id: number; label: string; status: Status; note: string; deadline: string; people?: string };
type Task = { id: number; title: string; project: string; tags: string[]; priority: Priority; steps: Step[]; links?: string[]; dependencies?: number[] };
type KairosData = {
  version: 1;
  exportedAt?: string;
  tasks: Task[];
  tagLibrary: Record<string, string>;
  workspaces: Record<string, { description: string; color: string; active: boolean }>;
};

const defaultWorkspaces: Record<string, { description: string; color: string; active: boolean }> = {
  "Brand refresh": { description: "Campaigns, identity work, and how Kairos shows up in the world.", color: "#b89acb", active: true },
  "Product experience": { description: "Improvements to the product journey, research, and customer experience.", color: "#b6da78", active: true },
  "Content engine": { description: "Stories, editorial work, and reusable content for the business.", color: "#e9a66d", active: true },
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

function progress(task: Task) {
  return Math.round((task.steps.filter((step) => step.status === "done").length / Math.max(task.steps.length, 1)) * 100);
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [selected, setSelected] = useState<{ taskId: number; stepId: number } | null>({ taskId: 1, stepId: 13 });
  const [filter, setFilter] = useState("All work");
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [dragged, setDragged] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
  const [editTaskId, setEditTaskId] = useState<number | null>(null);
  const [tagDraft, setTagDraft] = useState("");
  const [linkDraft, setLinkDraft] = useState("");
  const [dependencyPickerOpen, setDependencyPickerOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"journeys" | "my-tasks" | "calendar" | "settings">("journeys");
  const [tagLibrary, setTagLibrary] = useState<Record<string, string>>(defaultTagColors);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#668d74");
  const [workspaces, setWorkspaces] = useState(defaultWorkspaces);
  const [settingsTab, setSettingsTab] = useState<"tags" | "workspaces" | "data">("tags");
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceColor, setNewWorkspaceColor] = useState("#7b9b88");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "local">("local");

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        setSidebarCollapsed(localStorage.getItem("kairos-sidebar-collapsed") === "true");
        const response = await fetch("/api/state", { headers: { Accept: "application/json" } });
        if (response.ok) {
          const payload = await response.json() as { data: KairosData | null };
          if (payload.data && !cancelled) {
            setTasks(payload.data.tasks);
            setTagLibrary(payload.data.tagLibrary);
            setWorkspaces(payload.data.workspaces);
            setSaveState("saved");
            setReady(true);
            return;
          }
        }
      } catch {}
      try {
        const saved = localStorage.getItem("kairos-tasks-v1");
        if (saved) setTasks(JSON.parse(saved));
        const savedTags = localStorage.getItem("kairos-tag-library-v1");
        if (savedTags) setTagLibrary(JSON.parse(savedTags));
        const savedWorkspaces = localStorage.getItem("kairos-workspaces-v1");
        if (savedWorkspaces) setWorkspaces(JSON.parse(savedWorkspaces));
      } catch {}
      if (!cancelled) { setSaveState("local"); setReady(true); }
    }
    loadData();
    return () => { cancelled = true; };
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
    if (!ready) return;
    const timer = window.setTimeout(async () => {
      const data: KairosData = { version: 1, tasks, tagLibrary, workspaces };
      setSaveState("saving");
      try {
        const response = await fetch("/api/state", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        });
        setSaveState(response.ok ? "saved" : "local");
      } catch { setSaveState("local"); }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [tasks, tagLibrary, workspaces, ready]);

  useEffect(() => {
    const missing = Array.from(new Set(tasks.flatMap((task) => task.tags))).filter((tag) => !tagLibrary[tag]);
    if (missing.length) setTagLibrary((current) => ({ ...current, ...Object.fromEntries(missing.map((tag) => [tag, "#718096"])) }));
  }, [tasks, tagLibrary]);

  useEffect(() => {
    const missing = Array.from(new Set(tasks.map((task) => task.project))).filter((name) => !workspaces[name]);
    if (missing.length) setWorkspaces((current) => ({ ...current, ...Object.fromEntries(missing.map((name) => [name, { description: "A collection of related tasks and journeys.", color: "#91a09a", active: true }])) }));
  }, [tasks, workspaces]);

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const matchesQuery = `${task.title} ${task.project} ${task.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "All work" || (filter === "In progress" && task.steps.some((s) => s.status === "in-progress")) || (filter === "Blocked" && task.steps.some((s) => s.status === "blocked")) || task.priority === filter;
    return matchesQuery && matchesFilter && (!activeWorkspace || task.project === activeWorkspace);
  }), [tasks, filter, query, activeWorkspace]);

  const selectedTask = selected ? tasks.find((task) => task.id === selected.taskId) : undefined;
  const selectedStep = selectedTask?.steps.find((step) => step.id === selected?.stepId);
  const taskToEdit = editTaskId ? tasks.find((task) => task.id === editTaskId) : undefined;

  function updateTask(taskId: number, patch: Partial<Task>) {
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, ...patch } : task));
  }

  function addTagToTask(task: Task, rawTag: string) {
    const tag = rawTag.trim();
    if (!tag || task.tags.includes(tag)) return;
    updateTask(task.id, { tags: [...task.tags, tag] });
    if (!tagLibrary[tag]) setTagLibrary((current) => ({ ...current, [tag]: "#718096" }));
  }

  function renameTag(oldName: string, nextName: string) {
    const name = nextName.trim();
    if (!name || name === oldName) return;
    setTagLibrary((current) => { const next = { ...current, [name]: current[oldName] }; delete next[oldName]; return next; });
    setTasks((current) => current.map((task) => ({ ...task, tags: task.tags.map((tag) => tag === oldName ? name : tag) })));
  }

  function deleteTag(tagName: string) {
    setTagLibrary((current) => { const next = { ...current }; delete next[tagName]; return next; });
    setTasks((current) => current.map((task) => ({ ...task, tags: task.tags.filter((tag) => tag !== tagName) })));
  }

  function renameWorkspace(oldName: string, nextName: string) {
    const name = nextName.trim();
    if (!name || name === oldName) return;
    setWorkspaces((current) => { const next = { ...current, [name]: current[oldName] }; delete next[oldName]; return next; });
    setTasks((current) => current.map((task) => task.project === oldName ? { ...task, project: name } : task));
    if (activeWorkspace === oldName) setActiveWorkspace(name);
  }

  function updateStep(patch: Partial<Step>) {
    if (!selected) return;
    setTasks((current) => current.map((task) => task.id !== selected.taskId ? task : {
      ...task,
      steps: task.steps.map((step) => step.id === selected.stepId ? { ...step, ...patch } : step),
    }));
  }

  function addTask() {
    if (!newTitle.trim()) return;
    const id = Date.now();
    setTasks((current) => [{
      id,
      title: newTitle.trim(),
      project: "New initiative",
      tags: ["Planning"],
      priority: "Medium",
      links: [],
      dependencies: [],
      steps: [
        { id: id + 1, label: "Define", status: "in-progress", note: "Clarify the desired outcome and owner.", deadline: "Aug 15" },
        { id: id + 2, label: "Plan", status: "todo", note: "", deadline: "Aug 18" },
        { id: id + 3, label: "Execute", status: "todo", note: "", deadline: "Aug 25" },
      ],
    }, ...current]);
    setNewTitle("");
    setShowNew(false);
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
    const data: KairosData = { version: 1, exportedAt: new Date().toISOString(), tasks, tagLibrary, workspaces };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `kairos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function importData(file: File) {
    try {
      const data = JSON.parse(await file.text()) as KairosData;
      if (data.version !== 1 || !Array.isArray(data.tasks) || !data.tagLibrary || !data.workspaces) throw new Error("Invalid backup");
      setTasks(data.tasks);
      setTagLibrary(data.tagLibrary);
      setWorkspaces(data.workspaces);
    } catch { window.alert("That file is not a valid Kairos backup."); }
  }

  return (
    <main className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand"><div><span className="brand-name">Kairos</span><small>Track what matters</small></div></div>
        <button className="collapse-toggle" onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>{sidebarCollapsed ? "›" : "‹"}</button>
        <nav aria-label="Primary navigation">
          <button className={`nav-item ${currentView === "journeys" ? "active" : ""}`} title="Journeys" onClick={() => setCurrentView("journeys")}><span>⌁</span><span className="nav-text">Journeys</span></button>
          <button className={`nav-item ${currentView === "my-tasks" ? "active" : ""}`} title="My tasks" onClick={() => setCurrentView("my-tasks")}><span>◫</span><span className="nav-text">My tasks</span><b>{tasks.flatMap((task) => task.steps).filter((step) => step.status !== "done").length}</b></button>
          <button className={`nav-item ${currentView === "calendar" ? "active" : ""}`} title="Calendar" onClick={() => setCurrentView("calendar")}><span>⌑</span><span className="nav-text">Calendar</span></button>
          <button className={`nav-item ${currentView === "settings" ? "active" : ""}`} title="Settings" onClick={() => setCurrentView("settings")}><span>⚙</span><span className="nav-text">Settings</span></button>
        </nav>
        <div className="nav-label">Workspace</div>
        <button className={`nav-item workspace-nav ${activeWorkspace === null ? "active" : ""}`} title="All workspaces" onClick={() => setActiveWorkspace(null)}><span>◎</span><span className="nav-text">All workspaces</span><b>{tasks.length}</b></button>
        {Object.entries(workspaces).filter(([, info]) => info.active).map(([name, info]) => <button key={name} className={`nav-item workspace-nav ${activeWorkspace === name ? "active" : ""}`} title={name} onClick={() => { setActiveWorkspace(name); setCurrentView("journeys"); }}><span className="project-dot" style={{ background: info.color }} /><span className="nav-text">{name}</span><b>{tasks.filter((task) => task.project === name).length}</b></button>)}
        <div className="sidebar-footer">
          <div className="avatar">CH</div><div className="profile-copy"><strong>Christian</strong><span>Personal workspace</span></div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><p className="eyebrow">MONDAY, AUGUST 10</p><h1>Good afternoon, Christian.</h1></div>
          <div className="top-actions"><label className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" aria-label="Search tasks"/><kbd>⌘K</kbd></label><button className="icon-btn" aria-label="Notifications">♧<i /></button><button className="new-btn" onClick={() => setShowNew(true)}>＋ New task</button></div>
        </header>

        {currentView === "settings" ? <section className="settings-page">
          <div className="settings-head"><div><p className="eyebrow">PERSONAL SETTINGS</p><h2>Organize your system</h2><p>Keep projects and vocabulary useful as your work changes.</p></div></div>
          <div className="settings-tabs"><button className={settingsTab === "tags" ? "active" : ""} onClick={() => setSettingsTab("tags")}>Tags <span>{Object.keys(tagLibrary).length}</span></button><button className={settingsTab === "workspaces" ? "active" : ""} onClick={() => setSettingsTab("workspaces")}>Workspaces <span>{Object.keys(workspaces).length}</span></button><button className={settingsTab === "data" ? "active" : ""} onClick={() => setSettingsTab("data")}>Data</button></div>
          {settingsTab === "tags" ? <><div className="settings-card">
            <div className="tag-table-head"><span>Tag</span><span>Color</span><span>Used on</span><span /></div>
            {Object.entries(tagLibrary).map(([tag, color]) => <div className="tag-setting-row" key={tag}>
              <div className="tag-name-edit"><i style={{ background: color }} /><input defaultValue={tag} onBlur={(e) => renameTag(tag, e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} aria-label={`Rename ${tag}`} /></div>
              <label className="color-picker"><input type="color" value={color} onChange={(e) => setTagLibrary((current) => ({ ...current, [tag]: e.target.value }))}/><span>{color.toUpperCase()}</span></label>
              <span className="usage-count">{tasks.filter((task) => task.tags.includes(tag)).length} tasks</span>
              <button className="delete-tag" onClick={() => deleteTag(tag)} aria-label={`Delete ${tag}`}>Delete</button>
            </div>)}
            <div className="new-tag-row"><input value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="New tag name"/><label className="color-picker"><input type="color" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)}/><span>{newTagColor.toUpperCase()}</span></label><button onClick={() => { const name = newTagName.trim(); if (name) { setTagLibrary((current) => ({ ...current, [name]: newTagColor })); setNewTagName(""); } }}>＋ Add tag</button></div>
          </div>
          <div className="settings-note"><span>i</span><p><strong>One shared vocabulary</strong>Tags created while editing a task are saved here automatically and suggested everywhere else.</p></div></> : settingsTab === "workspaces" ? <><div className="settings-card workspace-settings-card">
            <div className="workspace-table-head"><span>Workspace / project</span><span>Color</span><span>Tasks</span><span>Status</span></div>
            {Object.entries(workspaces).map(([name, info]) => <div className="workspace-setting-row" key={name}>
              <div className="workspace-name-edit"><i style={{ background: info.color }}/><div><input defaultValue={name} onBlur={(e) => renameWorkspace(name, e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}/><small>{info.description}</small></div></div>
              <label className="color-picker"><input type="color" value={info.color} onChange={(e) => setWorkspaces((current) => ({ ...current, [name]: { ...current[name], color: e.target.value } }))}/><span>{info.color.toUpperCase()}</span></label>
              <span className="usage-count">{tasks.filter((task) => task.project === name).length} tasks</span>
              <button className={`workspace-status ${info.active ? "open" : "closed"}`} onClick={() => setWorkspaces((current) => ({ ...current, [name]: { ...current[name], active: !current[name].active } }))}>{info.active ? "Open" : "Closed"}</button>
            </div>)}
            <div className="new-workspace-row"><input value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} placeholder="New workspace name"/><label className="color-picker"><input type="color" value={newWorkspaceColor} onChange={(e) => setNewWorkspaceColor(e.target.value)}/><span>{newWorkspaceColor.toUpperCase()}</span></label><button onClick={() => { const name = newWorkspaceName.trim(); if (name) { setWorkspaces((current) => ({ ...current, [name]: { description: "A collection of related tasks and journeys.", color: newWorkspaceColor, active: true } })); setNewWorkspaceName(""); } }}>＋ New workspace</button></div>
          </div><div className="settings-note"><span>i</span><p><strong>Projects without clutter</strong>Closing a workspace hides it from navigation without deleting its tasks. Reopen it here any time.</p></div></> : <><div className="settings-card data-settings-card">
            <div><p className="eyebrow">STORAGE</p><h3>Your Kairos data</h3><p>{saveState === "saved" ? "Saved securely to this Kairos server." : saveState === "saving" ? "Saving your latest changes…" : "Saved in this browser. Export a backup before moving to your Pi."}</p></div>
            <div className="data-actions"><button onClick={exportData}>↓ Download backup</button><label>↑ Import backup<input type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) importData(file); event.currentTarget.value = ""; }} /></label></div>
          </div><div className="settings-note"><span>i</span><p><strong>Moving to your Pi</strong>Download a backup here, open Kairos on the Pi, then import the same file. The Pi stores future changes in SQLite automatically.</p></div></>}
        </section> : currentView === "calendar" ? <section className="calendar-page">
          <div className="view-title"><div><p className="eyebrow">DEADLINES</p><h2>August 2026</h2><p>Milestones from every active journey, organized by deadline.</p></div><div className="calendar-actions"><button>‹</button><button className="today">Today</button><button>›</button></div></div>
          <div className="calendar-weekdays">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid">{Array.from({ length: 42 }, (_, index) => { const day = index < 5 ? 27 + index : index - 4; const inMonth = index >= 5 && day <= 31; const displayDay = day > 31 ? day - 31 : day; const events = inMonth ? tasks.flatMap((task) => task.steps.filter((step) => step.deadline === `Aug ${day}`).map((step) => ({ task, step }))) : []; return <div key={index} className={`calendar-day ${inMonth ? "" : "outside"} ${day === 10 && inMonth ? "today-cell" : ""}`}><span>{displayDay}</span>{events.map(({ task, step }) => <button key={`${task.id}-${step.id}`} className="calendar-event" style={{ borderLeftColor: workspaces[task.project]?.color ?? "#91a09a", background: `${workspaces[task.project]?.color ?? "#91a09a"}18` }} onClick={() => { setSelected({ taskId: task.id, stepId: step.id }); setEditTaskId(null); }}><i style={{ background: workspaces[task.project]?.color ?? "#91a09a" }}/><strong>{step.label}</strong><small>{task.title}</small></button>)}</div>; })}</div>
          <div className="calendar-legend">{Object.entries(workspaces).filter(([, info]) => info.active).map(([name, info]) => <span key={name}><i style={{ background: info.color }}/>{name}</span>)}</div>
        </section> : currentView === "my-tasks" ? <section className="my-tasks-page">
          <div className="view-title"><div><p className="eyebrow">YOUR NEXT ACTIONS</p><h2>My tasks</h2><p>Individual steps assigned to you across every journey.</p></div><span>{tasks.flatMap((task) => task.steps).filter((step) => step.status !== "done").length} open</span></div>
          <div className="action-list">{tasks.flatMap((task) => task.steps.filter((step) => step.status !== "done").map((step) => ({ task, step }))).map(({ task, step }) => <article key={`${task.id}-${step.id}`}><button className={`action-check ${step.status}`} onClick={() => { setSelected({ taskId: task.id, stepId: step.id }); setEditTaskId(null); }}>{step.status === "blocked" ? "!" : ""}</button><div><h3>{step.label}</h3><p>{task.title}</p></div><span className="workspace-chip" style={{ color: workspaces[task.project]?.color, background: `${workspaces[task.project]?.color ?? "#91a09a"}18` }}><i style={{ background: workspaces[task.project]?.color }}/>{task.project}</span><time>{step.deadline}</time><button className="open-action" onClick={() => { setSelected({ taskId: task.id, stepId: step.id }); setEditTaskId(null); }}>Open</button></article>)}</div>
        </section> : <>
        <section className="overview">
          <div className="ai-focus"><span><b>✦</b> LOCAL AI PREVIEW</span><strong>Focus your attention</strong><p><b>Start with:</b> unblock “Test” in onboarding, then finish the campaign assets due Aug 13. Customer story can wait; its draft is on track for Aug 14.</p></div>
          <div className="overview-stat"><span>IN MOTION</span><strong>{tasks.filter((t) => t.steps.some((s) => s.status === "in-progress")).length}</strong></div>
          <div className="overview-stat blocked"><span>BLOCKED</span><strong>{tasks.filter((t) => t.steps.some((s) => s.status === "blocked")).length}</strong></div>
          <div className="mini-progress"><span>WEEKLY PROGRESS</span><div><i style={{ width: "68%" }} /></div><small>68%</small></div>
        </section>

        {activeWorkspace && <section className="workspace-context" style={{ borderColor: `${workspaces[activeWorkspace]?.color ?? "#91a09a"}66`, background: `${workspaces[activeWorkspace]?.color ?? "#91a09a"}18` }}><span className="project-dot" style={{ background: workspaces[activeWorkspace]?.color }} /><div><small>WORKSPACE / PROJECT</small><h2>{activeWorkspace}</h2><p>{workspaces[activeWorkspace]?.description}</p></div><div className="workspace-summary"><strong>{visibleTasks.length}</strong><span>tasks</span></div><button onClick={() => setActiveWorkspace(null)}>View all workspaces</button></section>}

        <div className="content-head">
          <div><h2>{activeWorkspace ? "Tasks in this workspace" : "Task journeys"}</h2><p>{activeWorkspace ? "Related work, milestones, and dependencies in one view." : "See every task from first thought to finish line."}</p></div>
          <div className="filters">
            {['All work', 'In progress', 'Blocked', 'High'].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}{item === 'All work' && <em>{tasks.length}</em>}</button>)}
          </div>
        </div>

        <div className="task-list">
          {visibleTasks.map((task) => (
            <article className={`task-card ${selectedTask?.id === task.id ? "selected" : ""}`} key={task.id} draggable onDragStart={() => setDragged(task.id)} onDragOver={(e) => { e.preventDefault(); reorder(task.id); }} onDragEnd={() => setDragged(null)}>
              <button className="drag" aria-label={`Drag ${task.title}`}>⠿</button>
              <button className="task-meta" onClick={() => { setEditTaskId(task.id); setSelected(null); }} aria-label={`Edit ${task.title}`}>
                <div className="task-title-row"><h3>{task.title}</h3></div>
                <div className="task-subline"><span className="workspace-label" style={{ color: workspaces[task.project]?.color }}><i style={{ background: workspaces[task.project]?.color }}/>{task.project}</span>{(task.dependencies?.length ?? 0) > 0 && <span className="dependency-badge">↳ {task.dependencies?.length} dependenc{task.dependencies?.length === 1 ? "y" : "ies"}</span>}{(task.links?.length ?? 0) > 0 && <span>↗ {task.links?.length} link{task.links?.length === 1 ? "" : "s"}</span>}</div>
                <div className="tags"><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>{task.tags.map((tag) => <span key={tag} style={{ color: tagLibrary[tag] ?? "#66736b", background: `${tagLibrary[tag] ?? "#718096"}1c` }}>{tag}</span>)}</div>
              </button>
              <div className="journey" style={{ gridTemplateColumns: `repeat(${task.steps.length + 1}, minmax(42px, 1fr))` }}>
                <div className="journey-line" style={{ left: `calc(50% / ${task.steps.length + 1})`, right: `calc(50% / ${task.steps.length + 1})` }}><i style={{ width: `${progress(task)}%` }} /></div>
                {task.steps.map((step) => (
                  <button key={step.id} className={`step ${step.status} ${selected?.taskId === task.id && selected.stepId === step.id ? "active" : ""}`} onClick={() => { setSelected({ taskId: task.id, stepId: step.id }); setEditTaskId(null); }}>
                    <span className="step-dot">{step.status === "done" ? "✓" : step.status === "blocked" ? "!" : ""}</span>
                    <strong>{step.label}</strong><small>{step.deadline}</small>{step.note && <b className="note-mark">•</b>}
                  </button>
                ))}
                <button className="add-step" aria-label="Add step" onClick={() => {
                  const step: Step = { id: Date.now(), label: "Next step", status: "todo", note: "", deadline: "Aug 28" };
                  setTasks((current) => current.map((t) => t.id === task.id ? { ...t, steps: [...t.steps, step] } : t));
                  setSelected({ taskId: task.id, stepId: step.id });
                }}>＋</button>
              </div>
              <div className="completion"><strong>{progress(task)}%</strong><span>complete</span></div>
            </article>
          ))}
          {visibleTasks.length === 0 && <div className="empty"><span>⌁</span><h3>No journeys found</h3><p>Try another filter or search term.</p></div>}
        </div>
        </>}
      </section>

      {(taskToEdit || (selectedStep && selectedTask)) && <button className="panel-scrim" onClick={() => { setEditTaskId(null); setSelected(null); }} aria-label="Close details" />}

      {taskToEdit && (
        <aside className="detail-panel task-editor">
          <div className="panel-head"><div><span>TASK DETAILS</span><strong>Edit the task, relationships, and context</strong></div><button onClick={() => setEditTaskId(null)} aria-label="Close task details">×</button></div>
          <div className="panel-body">
            <label className="field-label">Task name</label>
            <textarea className="task-name-input" value={taskToEdit.title} onChange={(e) => updateTask(taskToEdit.id, { title: e.target.value })} />
            <div className="two-cols"><div><label className="field-label">Workspace / project</label><select value={taskToEdit.project} onChange={(e) => updateTask(taskToEdit.id, { project: e.target.value })}>{Object.entries(workspaces).filter(([name, info]) => info.active || taskToEdit.project === name).map(([name]) => <option key={name}>{name}</option>)}</select></div><div><label className="field-label">Priority</label><select value={taskToEdit.priority} onChange={(e) => updateTask(taskToEdit.id, { priority: e.target.value as Priority })}><option>High</option><option>Medium</option><option>Low</option></select></div></div>
            <label className="field-label">Tags</label>
            <div className="editable-tags">{taskToEdit.tags.map((tag) => <button key={tag} style={{ color: tagLibrary[tag], background: `${tagLibrary[tag]}1c` }} onClick={() => updateTask(taskToEdit.id, { tags: taskToEdit.tags.filter((item) => item !== tag) })}>{tag} ×</button>)}</div>
            <div className="inline-add"><input list="tag-library-options" value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { addTagToTask(taskToEdit, tagDraft); setTagDraft(""); } }} placeholder="Type or choose a tag"/><datalist id="tag-library-options">{Object.keys(tagLibrary).filter((tag) => !taskToEdit.tags.includes(tag)).map((tag) => <option key={tag} value={tag}/>)}</datalist><button onClick={() => { addTagToTask(taskToEdit, tagDraft); setTagDraft(""); }}>Add</button></div>
            <div className="tag-suggestions">{Object.keys(tagLibrary).filter((tag) => !taskToEdit.tags.includes(tag)).slice(0, 5).map((tag) => <button key={tag} onClick={() => addTagToTask(taskToEdit, tag)}><i style={{ background: tagLibrary[tag] }}/>{tag}</button>)}</div>
            <label className="field-label">Reference links</label>
            <div className="link-list">{(taskToEdit.links ?? []).map((link) => <div key={link}><a href={link} target="_blank" rel="noreferrer">↗ {link.replace(/^https?:\/\//, "")}</a><button onClick={() => updateTask(taskToEdit.id, { links: (taskToEdit.links ?? []).filter((item) => item !== link) })}>×</button></div>)}</div>
            <div className="inline-add"><input value={linkDraft} onChange={(e) => setLinkDraft(e.target.value)} placeholder="Paste a link"/><button onClick={() => { if (linkDraft.trim()) { const value = /^https?:\/\//.test(linkDraft.trim()) ? linkDraft.trim() : `https://${linkDraft.trim()}`; updateTask(taskToEdit.id, { links: [...(taskToEdit.links ?? []), value] }); setLinkDraft(""); } }}>Add</button></div>
            <label className="field-label">Dependencies</label>
            <p className="field-help">Choose a task that must move first.</p>
            <div className="dependency-picker">
              <button className="dependency-picker-trigger" onClick={() => setDependencyPickerOpen((open) => !open)} aria-expanded={dependencyPickerOpen}>Select a task… <span>{dependencyPickerOpen ? "⌃" : "⌄"}</span></button>
              {dependencyPickerOpen && <div className="dependency-picker-menu">{tasks.filter((task) => task.id !== taskToEdit.id && !(taskToEdit.dependencies ?? []).includes(task.id)).map((task) => { const color = workspaces[task.project]?.color ?? "#91a09a"; return <button key={task.id} onClick={() => { updateTask(taskToEdit.id, { dependencies: [...(taskToEdit.dependencies ?? []), task.id] }); setDependencyPickerOpen(false); }}><strong>{task.title}</strong><span>—</span><em style={{ color }}><i style={{ background: color }}/>{task.project}</em></button>; })}{tasks.filter((task) => task.id !== taskToEdit.id && !(taskToEdit.dependencies ?? []).includes(task.id)).length === 0 && <p>All available tasks are already linked.</p>}</div>}
            </div>
            <ul className="selected-dependencies">{(taskToEdit.dependencies ?? []).map((id) => { const dependency = tasks.find((task) => task.id === id); if (!dependency) return null; const workspaceColor = workspaces[dependency.project]?.color ?? "#91a09a"; return <li key={id} style={{ borderLeftColor: workspaceColor }}><span><strong>{dependency.title}</strong><small><i style={{ background: workspaceColor }}/><em style={{ color: workspaceColor }}>{dependency.project}</em> · {progress(dependency)}% complete</small></span><button onClick={() => updateTask(taskToEdit.id, { dependencies: (taskToEdit.dependencies ?? []).filter((item) => item !== id) })} aria-label={`Remove ${dependency.title}`}>×</button></li>; })}</ul>
          </div>
          <div className="panel-footer"><span>Changes save automatically</span><button onClick={() => setEditTaskId(null)}>Done</button></div>
        </aside>
      )}

      {!taskToEdit && selectedStep && selectedTask && (
        <aside className="detail-panel">
          <div className="panel-head"><div><span>STEP DETAILS</span><strong>{selectedTask.title}</strong></div><button onClick={() => setSelected(null)} aria-label="Close details">×</button></div>
          <div className="panel-body">
            <label className="field-label">Step name</label>
            <input className="title-input" value={selectedStep.label} onChange={(e) => updateStep({ label: e.target.value })} />
            <label className="field-label">Status</label>
            <div className="status-grid">{(["todo", "in-progress", "done", "blocked"] as Status[]).map((status) => <button key={status} className={`${status} ${selectedStep.status === status ? "active" : ""}`} onClick={() => updateStep({ status })}><i />{statusLabel[status]}</button>)}</div>
            <div className="two-cols"><div><label className="field-label">Deadline</label><button className="selectish">◫ <span>{selectedStep.deadline}</span>⌄</button></div><div><label className="field-label">Owner</label><button className="selectish"><b className="tiny-avatar">CS</b><span>You</span>⌄</button></div></div>
            <label className="field-label">People</label>
            <p className="field-help">Who do you need to reach, hear from, or wait for?</p>
            <input className="people-input" value={selectedStep.people ?? ""} onChange={(e) => updateStep({ people: e.target.value })} placeholder="e.g. Alex, client legal team" />
            <label className="field-label">Notes</label>
            <textarea value={selectedStep.note} onChange={(e) => updateStep({ note: e.target.value })} placeholder="Add context, decisions, or links…" />
            <div className="attachments"><span>Attachments</span><button>＋ Add file</button></div>
            <div className="activity"><span className="tiny-avatar">CS</span><p><strong>You moved this step</strong><small>Today at 11:42</small></p><i>In progress</i></div>
          </div>
          <div className="panel-footer step-footer"><button className="journey-link" onClick={() => { setEditTaskId(selectedTask.id); setSelected(null); }}>View full task →</button><span>Changes save automatically</span><button onClick={() => setSelected(null)}>Done</button></div>
        </aside>
      )}

      {showNew && <div className="modal-backdrop" onMouseDown={() => setShowNew(false)}><div className="modal" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setShowNew(false)}>×</button><span className="eyebrow">START A JOURNEY</span><h2>What are you moving forward?</h2><p>Create the task now. You can shape its steps as you go.</p><label>Task name<input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} placeholder="e.g. Plan customer workshop" /></label><div className="modal-actions"><button onClick={() => setShowNew(false)}>Cancel</button><button className="new-btn" onClick={addTask}>Create journey</button></div></div></div>}
    </main>
  );
}
