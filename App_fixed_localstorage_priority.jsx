import React, { useState, useEffect } from "react";

const predefinedTags = ["Marketing", "Design", "Dev", "Research"];
const tagColors = {
  Marketing: "bg-blue-100 text-blue-700",
  Design: "bg-pink-100 text-pink-700",
  Dev: "bg-green-100 text-green-700",
  Research: "bg-yellow-100 text-yellow-700"
};

const defaultTasks = [
  {
    id: 1,
    title: "Launch Campaign",
    priority: "High",
    tags: ["Marketing"],
    steps: [
      { label: "Research", status: "done", note: "Checked competitors.", deadline: "2025-05-15" },
      { label: "Plan", status: "done", note: "Built outline.", deadline: "2025-05-18" },
      { label: "Build", status: "in-progress", note: "Wireframing ongoing.", deadline: "2025-05-22" },
      { label: "Test", status: "todo", note: "", deadline: "2025-05-28" },
      { label: "Launch", status: "on-hold", note: "", deadline: "2025-06-01" }
    ]
  }
];

const Step = ({ label, status, note, deadline, onClick }) => {
  const getColor = () => {
    if (status === "done") return "bg-green-500 border-green-500";
    if (status === "in-progress") return "bg-yellow-400 border-yellow-400";
    if (status === "on-hold") return "bg-purple-400 border-purple-400";
    return "bg-white border-gray-400";
  };
  return (
    <div className="flex flex-col items-center space-y-1 relative cursor-pointer" onClick={onClick}>
      {note && <span className="absolute -top-3 right-0 text-[10px] font-bold text-gray-800">1</span>}
      <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center text-[10px] ${getColor()}`}></div>
      <span className="text-xs text-center whitespace-nowrap">{label}</span>
      {deadline && <span className="text-[10px] text-gray-500">{deadline}</span>}
    </div>
  );
};

const TaskRow = ({ task, onStepClick, onTitleClick, onTagClick }) => (
  <div className="mb-6">
    <div className="flex items-center justify-between mb-1">
      <h2 className="font-semibold cursor-pointer hover:underline" onClick={() => onTitleClick(task.id)}>
        {task.title}
        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
          task.priority === "High" ? "bg-red-200 text-red-800" :
          task.priority === "Low" ? "bg-green-100 text-green-700" :
          "bg-yellow-100 text-yellow-700"
        }`}>
          {task.priority || "Medium"}
        </span>
      </h2>
      <div className="flex gap-2">
        {task.tags.map((tag, i) => (
          <span key={i} onClick={() => onTagClick(task.id)} className={`text-xs px-2 py-0.5 rounded cursor-pointer ${tagColors[tag] || "bg-gray-100 text-gray-700"}`}>{tag}</span>
        ))}
      </div>
    </div>
    <div className="flex items-center space-x-6 overflow-x-auto">
      {task.steps.map((step, index) => (
        <React.Fragment key={index}>
          <Step {...step} onClick={() => onStepClick(task.id, index)} />
          {index < task.steps.length - 1 && <div className="w-10 h-1 bg-gray-300 flex-shrink-0"></div>}
        </React.Fragment>
      ))}
    </div>
  </div>
);

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [stepModal, setStepModal] = useState(null);
  const [titleModal, setTitleModal] = useState(null);
  const [tagModal, setTagModal] = useState(null);
  const [addStepModal, setAddStepModal] = useState(null);
  const [newStep, setNewStep] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("tasks");
    if (saved) {
      setTasks(JSON.parse(saved));
    } else {
      setTasks(defaultTasks);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!newTitle.trim()) return;
    const tags = newTag.split(",").map(t => t.trim()).filter(Boolean);
    const newTask = {
      id: Date.now(),
      title: newTitle,
      tags,
      steps: [],
      priority: newPriority
    };
    setTasks([newTask, ...tasks]);
    setNewTitle("");
    setNewTag("");
    setNewPriority("Medium");
    setAddStepModal(newTask.id);
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-6">Your Tasks</h1>
      <div className="flex flex-wrap gap-2 mb-6">
        <input type="text" className="border px-3 py-1 rounded flex-grow" placeholder="New task name..." value={newTitle} onChange={e => setNewTitle(e.target.value)} />
        <input type="text" className="border px-3 py-1 rounded flex-grow" placeholder="Tags (comma-separated)" value={newTag} onChange={e => setNewTag(e.target.value)} />
        <select className="border px-3 py-1 rounded" value={newPriority} onChange={e => setNewPriority(e.target.value)}>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <button onClick={addTask} className="bg-blue-500 text-white px-4 py-1 rounded">Add Task</button>
      </div>

      {tasks.map(task => (
        <TaskRow
          key={task.id}
          task={task}
          onStepClick={(taskId, stepIdx) => setStepModal({ taskId, stepIdx })}
          onTitleClick={(taskId) => setTitleModal(taskId)}
          onTagClick={(taskId) => setTagModal(taskId)}
        />
      ))}
    </div>
  );
}