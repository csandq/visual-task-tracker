import React, { useState } from "react";

const predefinedTags = ["Marketing", "Design", "Dev", "Research"];
const tagColors = {
  Marketing: "bg-blue-100 text-blue-700",
  Design: "bg-pink-100 text-pink-700",
  Dev: "bg-green-100 text-green-700",
  Research: "bg-yellow-100 text-yellow-700"
};

const initialTasks = [
  {
    id: 1,
    title: "Launch Campaign",
    tags: ["Marketing"],
    steps: [
      { label: "Research", status: "done", note: "Checked competitors.", deadline: "2025-05-15" },
      { label: "Plan", status: "done", note: "Built outline.", deadline: "2025-05-18" },
      { label: "Build", status: "in-progress", note: "Currently building wireframes.", deadline: "2025-05-22" },
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
      {note && (
        <span className="absolute -top-3 right-0 text-[10px] font-bold text-gray-800">1</span>
      )}
      <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center text-[10px] ${getColor()}`}></div>
      <span className="text-xs text-center whitespace-nowrap">{label}</span>
      {deadline && <span className="text-[10px] text-gray-500">{deadline}</span>}
    </div>
  );
};

const TaskRow = ({ task, onStepClick, onTitleClick, onTagEdit }) => (
  <div className="mb-6">
    <div className="flex items-center justify-between mb-1">
      <h2
        className="font-semibold cursor-pointer hover:underline"
        onClick={() => onTitleClick(task.id)}
      >
        {task.title}
      </h2>
      <div className="flex gap-2">
        {task.tags.map((tag, i) => (
          <span
            key={i}
            onClick={() => onTagEdit(task.id)}
            className={`text-xs px-2 py-0.5 rounded cursor-pointer ${tagColors[tag] || "bg-gray-100 text-gray-700"}`}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
    <div className="flex items-center space-x-6 overflow-x-auto">
      {task.steps.map((step, index) => (
        <React.Fragment key={index}>
          <Step {...step} onClick={() => onStepClick(task.id, index)} />
          {index < task.steps.length - 1 && (
            <div className="w-10 h-1 bg-gray-300 flex-shrink-0"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
);

export default function App() {
  const [tasks, setTasks] = useState(initialTasks);
  const [newTitle, setNewTitle] = useState("");
  const [newTag, setNewTag] = useState("");
  const [modal, setModal] = useState(null);
  const [stepModal, setStepModal] = useState(null);
  const [tagEditModal, setTagEditModal] = useState(null);
  const [titleEditModal, setTitleEditModal] = useState(null);

  const addTask = () => {
    if (!newTitle.trim()) return;
    const tags = newTag
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newTask = {
      id: tasks.length + 1,
      title: newTitle,
      tags,
      steps: []
    };
    setTasks([newTask, ...tasks]);
    setNewTitle("");
    setNewTag("");
    setModal(newTask.id);
  };

  const updateStep = (taskId, stepIndex, note, deadline, label, status) => {
    const updated = tasks.map((task) => {
      if (task.id === taskId) {
        const newSteps = [...task.steps];
        newSteps[stepIndex] = {
          ...newSteps[stepIndex],
          note,
          deadline,
          label,
          status
        };
        return { ...task, steps: newSteps };
      }
      return task;
    });
    setTasks(updated);
    setStepModal(null);
  };

  const updateTags = (taskId, selectedTags) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, tags: selectedTags } : task))
    );
    setTagEditModal(null);
  };

  const updateTaskTitle = (taskId, newTitle) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, title: newTitle } : task))
    );
    setTitleEditModal(null);
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-6">Your Tasks</h1>
      <div className="flex flex-wrap gap-2 mb-6">
        <input
          type="text"
          className="border border-gray-300 px-3 py-1 rounded flex-grow"
          placeholder="New task name..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <input
          type="text"
          className="border border-gray-300 px-3 py-1 rounded flex-grow"
          placeholder="Tags (comma separated)"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
        />
        <button
          onClick={addTask}
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
        >
          Add Task
        </button>
      </div>
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          onStepClick={(taskId, stepIndex) => setStepModal({ taskId, stepIndex })}
          onTitleClick={(taskId) => setTitleEditModal({ taskId })}
          onTagEdit={(taskId) => setTagEditModal({ taskId })}
        />
      ))}

      {stepModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Step</h2>
            <input
              type="text"
              className="w-full border p-2 mb-2"
              placeholder="Step title"
              value={tasks.find(t => t.id === stepModal.taskId).steps[stepModal.stepIndex].label}
              onChange={(e) => {
                const newTasks = [...tasks];
                newTasks.find(t => t.id === stepModal.taskId).steps[stepModal.stepIndex].label = e.target.value;
                setTasks(newTasks);
              }}
            />
            <textarea
              className="w-full border p-2 mb-2"
              rows={2}
              placeholder="Add a note..."
              value={tasks.find(t => t.id === stepModal.taskId).steps[stepModal.stepIndex].note}
              onChange={(e) => {
                const newTasks = [...tasks];
                newTasks.find(t => t.id === stepModal.taskId).steps[stepModal.stepIndex].note = e.target.value;
                setTasks(newTasks);
              }}
            ></textarea>
            <input
              type="date"
              className="w-full border p-2 mb-2"
              value={tasks.find(t => t.id === stepModal.taskId).steps[stepModal.stepIndex].deadline}
              onChange={(e) => {
                const newTasks = [...tasks];
                newTasks.find(t => t.id === stepModal.taskId).steps[stepModal.stepIndex].deadline = e.target.value;
                setTasks(newTasks);
              }}
            />
            <select
              className="w-full border p-2 mb-2"
              value={tasks.find(t => t.id === stepModal.taskId).steps[stepModal.stepIndex].status}
              onChange={(e) => {
                const newTasks = [...tasks];
                newTasks.find(t => t.id === stepModal.taskId).steps[stepModal.stepIndex].status = e.target.value;
                setTasks(newTasks);
              }}
            >
              <option value="todo">Not Started</option>
              <option value="in-progress">Ongoing</option>
              <option value="done">Complete</option>
              <option value="on-hold">On Hold</option>
            </select>
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-300 px-4 py-1 rounded"
                onClick={() => setStepModal(null)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-1 rounded"
                onClick={() => updateStep(
                  stepModal.taskId,
                  stepModal.stepIndex,
                  tasks.find(t => t.id === stepModal.taskId).steps[stepModal.stepIndex].note,
                  tasks.find(t => t.id === stepModal.taskId).steps[stepModal.stepIndex].deadline,
                  tasks.find(t => t.id === stepModal.taskId).steps[stepModal.stepIndex].label,
                  tasks.find(t => t.id === stepModal.taskId).steps[stepModal.stepIndex].status
                )}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {tagEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Tags</h2>
            <select
              multiple
              className="w-full border p-2 mb-4"
              defaultValue={tasks.find(t => t.id === tagEditModal.taskId).tags}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                updateTags(tagEditModal.taskId, selected);
              }}
            >
              {predefinedTags.map((tag, i) => (
                <option key={i} value={tag}>{tag}</option>
              ))}
            </select>
            <button
              className="bg-gray-300 px-4 py-1 rounded w-full"
              onClick={() => setTagEditModal(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {titleEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Task Title</h2>
            <input
              type="text"
              className="w-full border p-2 mb-4"
              placeholder="Enter new title"
              defaultValue={tasks.find(t => t.id === titleEditModal.taskId).title}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-300 px-4 py-1 rounded"
                onClick={() => setTitleEditModal(null)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-1 rounded"
                onClick={() => updateTaskTitle(titleEditModal.taskId, newTitle)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
