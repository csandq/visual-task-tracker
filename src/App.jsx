  // For debugging purpose, log when modals open/close
  useEffect(() => {
    console.log("Modal state changed:", { 
      modalType, 
      currentTaskId, 
      taskExists: currentTaskId ? Boolean(tasks.find(t => t.id === currentTaskId)) : false
    });
  }, [modalType, currentTaskId, tasks]);import React, { useState, useEffect } from "react";

// Simple constants
const PRIORITY_COLORS = {
  High: "bg-red-600",
  Medium: "bg-gray-600",
  Low: "bg-green-600"
};

const TAG_COLORS = {
  Marketing: "bg-blue-100 text-blue-700",
  Design: "bg-pink-100 text-pink-700",
  Dev: "bg-green-100 text-green-700",
  Research: "bg-yellow-100 text-yellow-700"
};

// Load from localStorage or use defaults
function loadTasks() {
  try {
    const saved = localStorage.getItem("tasks");
    if (saved) return JSON.parse(saved);
  } catch (error) {
    console.error("Error loading tasks:", error);
  }
  
  return [
    {
      id: 1,
      title: "Launch Campaign",
      tags: ["Marketing"],
      priority: "Medium",
      steps: [
        { label: "Research", status: "done", note: "Checked competitors.", deadline: "2025-05-15" },
        { label: "Plan", status: "done", note: "Built outline.", deadline: "2025-05-18" },
        { label: "Build", status: "in-progress", note: "Wireframing ongoing.", deadline: "2025-05-22" }
      ]
    }
  ];
}

// Step component
function Step({ label, status, note, deadline, onClick }) {
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
}

// Main App
export default function App() {
  // State
  const [tasks, setTasks] = useState(loadTasks);
  const [newTitle, setNewTitle] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  
  // Modal state
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [stepIndex, setStepIndex] = useState(null);
  const [editingStep, setEditingStep] = useState({ label: "", status: "todo", note: "", deadline: "" });
  const [newStepName, setNewStepName] = useState("");
  
  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Helper functions
  const getCurrentTask = () => tasks.find(t => t.id === currentTaskId);
  
  const closeModal = () => {
    setModalType(null);
    setCurrentTaskId(null);
    setStepIndex(null);
  };

  // Task operations
  const addTask = () => {
    if (!newTitle.trim()) return;
    
    const tags = newTag ? newTag.split(",").map(t => t.trim()).filter(Boolean) : [];
    const newTaskId = Date.now();
    
    console.log("Creating task with ID:", newTaskId);
    
    // First update the state
    const newTask = { 
      id: newTaskId, 
      title: newTitle, 
      tags, 
      steps: [], 
      priority: newPriority 
    };
    
    // Update tasks state
    setTasks([newTask, ...tasks]);
    
    // Reset form fields
    setNewTitle("");
    setNewTag("");
    
    // IMPORTANT: Use setTimeout to make sure the task is added before opening modal
    setTimeout(() => {
      console.log("Now opening step modal for new task:", newTaskId);
      setCurrentTaskId(newTaskId);
      setStepIndex(-1);
      setModalType("step");
    }, 100); // Slightly longer timeout to ensure state updates
  };
  
  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  // Step operations  
  const addStep = () => {
    if (!newStepName.trim()) return;
    
    setTasks(tasks.map(task => 
      task.id === currentTaskId
        ? {
            ...task,
            steps: [...task.steps, { 
              label: newStepName, 
              status: "todo", 
              note: "", 
              deadline: "" 
            }]
          }
        : task
    ));
    
    setNewStepName("");
  };
  
  const openStepModal = (taskId, index) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    setCurrentTaskId(taskId);
    setStepIndex(index);
    setModalType("step");
    
    if (index >= 0 && task.steps[index]) {
      setEditingStep({
        label: task.steps[index].label || "",
        status: task.steps[index].status || "todo",
        note: task.steps[index].note || "",
        deadline: task.steps[index].deadline || ""
      });
    } else {
      setNewStepName("");
    }
  };
  
  const updateStep = () => {
    setTasks(tasks.map(task => 
      task.id === currentTaskId
        ? {
            ...task,
            steps: task.steps.map((step, i) => 
              i === stepIndex ? { ...editingStep } : step
            )
          }
        : task
    ));
    
    closeModal();
  };
  
  const deleteStep = () => {
    setTasks(tasks.map(task => 
      task.id === currentTaskId
        ? {
            ...task,
            steps: task.steps.filter((_, i) => i !== stepIndex)
          }
        : task
    ));
    
    closeModal();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-6">Task Tracker</h1>
      
      {/* Task Creation Form */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-gray-50 rounded">
        <input 
          type="text" 
          className="border px-3 py-2 rounded flex-grow" 
          placeholder="New task name..." 
          value={newTitle} 
          onChange={e => setNewTitle(e.target.value)} 
        />
        <div className="flex gap-2">
          <input 
            type="text" 
            className="border px-3 py-2 rounded w-40" 
            placeholder="Tags (comma-separated)" 
            value={newTag} 
            onChange={e => setNewTag(e.target.value)} 
          />
          <select 
            className="border px-3 py-2 rounded" 
            value={newPriority} 
            onChange={e => setNewPriority(e.target.value)}
          >
            <option value="Low">Low Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="High">High Priority</option>
          </select>
          <button 
            onClick={addTask} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Task
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No tasks yet. Add your first task above!
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="mb-6 p-3 border border-gray-200 rounded hover:shadow-md">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold">
                  {task.title} 
                  <span className={`text-xs text-white ${PRIORITY_COLORS[task.priority] || "bg-gray-600"} px-2 py-0.5 ml-2 rounded`}>
                    Priority: {task.priority || 'Medium'}
                  </span>
                </h2>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    {task.tags.map((tag, i) => (
                      <span 
                        key={i}
                        className={`text-xs px-2 py-0.5 rounded ${TAG_COLORS[tag] || "bg-gray-100 text-gray-700"}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTask(task.id);
                    }} 
                    className="text-gray-500 hover:text-red-600"
                    title="Delete Task"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-6 overflow-x-auto py-2">
                {task.steps.map((step, index) => (
                  <React.Fragment key={index}>
                    <Step 
                      {...step} 
                      onClick={() => openStepModal(task.id, index)} 
                    />
                    {index < task.steps.length - 1 && (
                      <div className="w-10 h-1 bg-gray-300 flex-shrink-0"></div>
                    )}
                  </React.Fragment>
                ))}
                <button 
                  onClick={() => openStepModal(task.id, -1)} 
                  className="ml-2 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"
                >
                  +
                </button>
              </div>
              <div className="flex justify-end mt-2">
                {/* Removed text delete button since we now have the icon */}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Step Modal */}
      {modalType === "step" && getCurrentTask() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {stepIndex === -1 ? "Add Steps" : "Edit Step"}
            </h2>
            
            {stepIndex === -1 ? (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Step Name
                </label>
                <input 
                  type="text"
                  className="w-full border p-2 rounded" 
                  value={newStepName} 
                  onChange={(e) => setNewStepName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newStepName.trim()) {
                      addStep();
                    }
                  }}
                />
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Step Name
                  </label>
                  <input 
                    type="text"
                    className="w-full border p-2 rounded" 
                    value={editingStep.label} 
                    onChange={(e) => setEditingStep({...editingStep, label: e.target.value})}
                  />
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea 
                    className="w-full border p-2 rounded" 
                    value={editingStep.note} 
                    onChange={(e) => setEditingStep({...editingStep, note: e.target.value})}
                  />
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deadline
                  </label>
                  <input 
                    type="date" 
                    className="w-full border p-2 rounded" 
                    value={editingStep.deadline || ""} 
                    onChange={(e) => setEditingStep({...editingStep, deadline: e.target.value})}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select 
                    className="w-full border p-2 rounded" 
                    value={editingStep.status} 
                    onChange={(e) => setEditingStep({...editingStep, status: e.target.value})}
                  >
                    <option value="todo">Not Started</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Complete</option>
                    <option value="on-hold">On Hold</option>
                  </select>
                </div>
              </>
            )}
            
            <div className="flex justify-between mt-4">
              {stepIndex === -1 ? (
                <>
                  <button 
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded" 
                    onClick={closeModal}
                  >
                    Done
                  </button>
                  <button 
                    className="bg-blue-500 text-white px-4 py-2 rounded" 
                    onClick={addStep}
                    disabled={!newStepName.trim()}
                  >
                    Add Step
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600" 
                    onClick={deleteStep}
                  >
                    Delete
                  </button>
                  <button 
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" 
                    onClick={updateStep}
                  >
                    Save
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}