import React, { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

// Simple constants
const PRIORITY_COLORS = {
  High: "bg-red-600",
  Medium: "bg-gray-600",
  Low: "bg-green-600"
};

const TAG_COLORS = {
  Marketing: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  Design: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  Dev: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  Research: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
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

// Get user preference for dark mode
function getInitialDarkMode() {
  // Check localStorage
  const savedMode = localStorage.getItem("darkMode");
  if (savedMode !== null) {
    return JSON.parse(savedMode);
  }
  // Check system preference
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// Step component
function Step({ label, status, note, deadline, onClick }) {
  const getColor = () => {
    if (status === "done") return "bg-green-500 border-green-500";
    if (status === "in-progress") return "bg-yellow-400 border-yellow-400";
    if (status === "on-hold") return "bg-purple-400 border-purple-400";
    return "bg-white dark:bg-gray-700 border-gray-400 dark:border-gray-500";
  };
  
  return (
    <div className="flex flex-col items-center space-y-1 relative cursor-pointer" onClick={onClick}>
      {note && <span className="absolute -top-3 right-0 text-[10px] font-bold text-gray-800 dark:text-gray-200">1</span>}
      <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center text-[10px] ${getColor()}`}></div>
      <span className="text-xs text-center whitespace-nowrap dark:text-gray-200">{label}</span>
      {deadline && <span className="text-[10px] text-gray-500 dark:text-gray-400">{deadline}</span>}
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
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  
  // Modal state
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [stepIndex, setStepIndex] = useState(null);
  const [editingStep, setEditingStep] = useState({ label: "", status: "todo", note: "", deadline: "" });
  const [newStepName, setNewStepName] = useState("");
  
  // Task editing state
  const [editingTask, setEditingTask] = useState({
    title: "",
    tags: [],
    priority: "Medium"
  });
  const [editTagInput, setEditTagInput] = useState("");
  
  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);
  
  // Apply dark mode
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

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
    
    const newTask = { 
      id: newTaskId, 
      title: newTitle, 
      tags, 
      steps: [], 
      priority: newPriority 
    };
    
    setTasks([newTask, ...tasks]);
    setNewTitle("");
    setNewTag("");
    
    // Open step modal with delay
    setTimeout(() => {
      setCurrentTaskId(newTaskId);
      setStepIndex(-1);
      setModalType("step");
    }, 50);
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

  // New Task editing functions
  const openTaskEditModal = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    setCurrentTaskId(taskId);
    setModalType("task");
    setEditingTask({
      title: task.title,
      tags: [...task.tags], // Create a copy of the tags array
      priority: task.priority
    });
    setEditTagInput("");
  };
  
  const updateTask = () => {
    if (!editingTask.title.trim()) return;
    
    setTasks(tasks.map(task => 
      task.id === currentTaskId
        ? {
            ...task,
            title: editingTask.title,
            tags: editingTask.tags,
            priority: editingTask.priority
          }
        : task
    ));
    
    closeModal();
  };
  
  const addTagToEditingTask = () => {
    if (!editTagInput.trim()) return;
    
    const newTags = editTagInput
      .split(",")
      .map(tag => tag.trim())
      .filter(Boolean);
    
    setEditingTask({
      ...editingTask,
      tags: [...editingTask.tags, ...newTags]
    });
    
    setEditTagInput("");
  };
  
  const removeTagFromEditingTask = (tagIndex) => {
    setEditingTask({
      ...editingTask,
      tags: editingTask.tags.filter((_, i) => i !== tagIndex)
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-4xl mx-auto p-4 bg-white dark:bg-gray-800 shadow rounded transition-colors duration-200">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold dark:text-white">Task Tracker</h1>
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      
      {/* Task Creation Form */}
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded transition-colors duration-200">
        <input 
          type="text" 
          className="border px-3 py-2 rounded flex-grow bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600" 
          placeholder="New task name..." 
          value={newTitle} 
          onChange={e => setNewTitle(e.target.value)} 
        />
        <div className="flex gap-2">
          <input 
            type="text" 
            className="border px-3 py-2 rounded w-40 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600" 
            placeholder="Tags (comma-separated)" 
            value={newTag} 
            onChange={e => setNewTag(e.target.value)} 
          />
          <select 
            className="border px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600" 
            value={newPriority} 
            onChange={e => setNewPriority(e.target.value)}
          >
            <option value="Low">Low Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="High">High Priority</option>
          </select>
          <button 
            onClick={addTask} 
            className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors duration-200"
          >
            Add Task
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No tasks yet. Add your first task above!
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="mb-6 p-3 border border-gray-200 dark:border-gray-700 rounded hover:shadow-md bg-white dark:bg-gray-800 transition-colors duration-200">
              <div className="flex items-center justify-between mb-1">
                <h2 
                  className="font-semibold cursor-pointer hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                  onClick={() => openTaskEditModal(task.id)}
                >
                  {task.title} 
                  <span className={`text-xs text-white ${PRIORITY_COLORS[task.priority] || "bg-gray-600"} px-2 py-0.5 ml-2 rounded`}>
                    Priority: {task.priority || 'Medium'}
                  </span>
                </h2>
                <div className="flex gap-2">
                  {task.tags.map((tag, i) => (
                    <span 
                      key={i}
                      className={`text-xs px-2 py-0.5 rounded ${TAG_COLORS[tag] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}
                    >
                      {tag}
                    </span>
                  ))}
                  <button
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    onClick={() => openTaskEditModal(task.id)}
                  >
                    Edit
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
                      <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 flex-shrink-0"></div>
                    )}
                  </React.Fragment>
                ))}
                <button 
                  onClick={() => openStepModal(task.id, -1)} 
                  className="ml-2 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  +
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <button 
                  onClick={() => deleteTask(task.id)} 
                  className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  Delete Task
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Step Modal */}
      {modalType === "step" && getCurrentTask() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow w-full max-w-md transition-colors duration-200">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">
              {stepIndex === -1 ? "Add Steps" : "Edit Step"}
            </h2>
            
            {stepIndex === -1 ? (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Step Name
                </label>
                <input 
                  type="text"
                  className="w-full border p-2 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600" 
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Step Name
                  </label>
                  <input 
                    type="text"
                    className="w-full border p-2 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600" 
                    value={editingStep.label} 
                    onChange={(e) => setEditingStep({...editingStep, label: e.target.value})}
                  />
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea 
                    className="w-full border p-2 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600" 
                    value={editingStep.note} 
                    onChange={(e) => setEditingStep({...editingStep, note: e.target.value})}
                  />
                </div>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deadline
                  </label>
                  <input 
                    type="date" 
                    className="w-full border p-2 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600" 
                    value={editingStep.deadline || ""} 
                    onChange={(e) => setEditingStep({...editingStep, deadline: e.target.value})}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select 
                    className="w-full border p-2 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600" 
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
                    className="bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200" 
                    onClick={closeModal}
                  >
                    Done
                  </button>
                  <button 
                    className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors duration-200" 
                    onClick={addStep}
                    disabled={!newStepName.trim()}
                  >
                    Add Step
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="bg-red-500 dark:bg-red-600 text-white px-4 py-2 rounded hover:bg-red-600 dark:hover:bg-red-700 transition-colors duration-200" 
                    onClick={deleteStep}
                  >
                    Delete
                  </button>
                  <button 
                    className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors duration-200" 
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

      {/* Task Edit Modal */}
      {modalType === "task" && getCurrentTask() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow w-full max-w-md transition-colors duration-200">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">
              Edit Task
            </h2>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Task Title
              </label>
              <input 
                type="text"
                className="w-full border p-2 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600" 
                value={editingTask.title} 
                onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select 
                className="w-full border p-2 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600" 
                value={editingTask.priority} 
                onChange={(e) => setEditingTask({...editingTask, priority: e.target.value})}
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editingTask.tags.map((tag, index) => (
                  <div 
                    key={index} 
                    className={`text-xs px-2 py-1 rounded flex items-center ${TAG_COLORS[tag] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}
                  >
                    {tag}
                    <button 
                      className="ml-1 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                      onClick={() => removeTagFromEditingTask(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text"
                  className="border p-2 rounded flex-grow bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600" 
                  placeholder="Add tags (comma-separated)" 
                  value={editTagInput} 
                  onChange={(e) => setEditTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editTagInput.trim()) {
                      addTagToEditingTask();
                    }
                  }}
                />
                <button 
                  className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200" 
                  onClick={addTagToEditingTask}
                >
                  Add
                </button>
              </div>
            </div>
            
            <div className="flex justify-between mt-4">
              <button 
                className="bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200" 
                onClick={closeModal}
              >
                Cancel
              </button>
              <button 
                className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors duration-200" 
                onClick={updateTask}
                disabled={!editingTask.title.trim()}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )} rounded" 
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