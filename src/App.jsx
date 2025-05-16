        {/* Tag Editor Modal */}
        {isTagEditorOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white dark:bg-gray-800 p-6 rounded shadow w-full max-w-md transition-colors duration-200">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">
                Manage Tags
              </h2>
              
              <div className="mb-4">
                <div className="mb-2 font-medium text-gray-700 dark:text-gray-300">
                  Current Tags
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.keys(customTags).map((tagName) => (
                    <div 
                      key={tagName} 
                      className={`text-xs px-2 py-1 rounded flex items-center ${customTags[tagName]}`}
                    >
                      {tagName}
                      <button 
                        className="ml-1 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        onClick={() => removeCustomTag(tagName)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {Object.keys(customTags).length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No custom tags yet. Create one below.</p>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="mb-2 font-medium text-gray-700 dark:text-gray-300">
                  Add New Tag
                </div>
                <div className="flex flex-col gap-2">
                  <input 
                    type="text"
                    className="border p-2 rounded w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                    placeholder="Tag name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                  />
                  
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Select Color
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {['blue', 'green', 'red', 'yellow', 'purple', 'pink', 'indigo', 'gray'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-full p-2 rounded text-center text-xs capitalize ${
                            selectedColor === color 
                              ? BUTTON_COLOR_CLASSES[color].selected
                              : BUTTON_COLOR_CLASSES[color].default
                          }`}
                          onClick={() => setSelectedColor(color)}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                                      <div className="mt-2">
                    <div className="text-sm mb-1 text-gray-700 dark:text-gray-300">Preview:</div>
                    <div className={`inline-block text-xs px-2 py-1 rounded ${COLOR_CLASSES[selectedColor]}`}>
                      {newTagName || "Tag Preview"}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-4">
                <button 
                  className="bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200" 
                  onClick={() => setIsTagEditorOpen(false)}
                >
                  Close
                </button>
                <button 
                  className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors duration-200" 
                  onClick={addCustomTag}
                  disabled={!newTagName.trim()}
                >
                  Add Tag
                </button>
              </div>
            </div>
          </div>
        )}  // Add a new custom tag
  const addCustomTag = () => {
    if (!newTagName.trim()) return;
    
    // Use the predefined color class instead of dynamic string concatenation
    const colorClass = COLOR_CLASSES[selectedColor];
    
    setCustomTags({
      ...customTags,
      [newTagName]: colorClass
    });
    
    setNewTagName("");
  };
  
  // Remove a custom tag
  const removeCustomTag = (tagName) => {
    const updatedTags = { ...customTags };
    delete updatedTags[tagName];
    setCustomTags(updatedTags);
  };  // Task editing state
  const [editingTask, setEditingTask] = useState({
    title: "",
    tags: [],
    priority: "Medium"
  });
  const [editTagInput, setEditTagInput] = useState("");import React, { useState, useEffect } from "react";
// Import CSS from the correct location
import "./styles/index.css";

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

// Pre-defined color classes for tag editor
const COLOR_CLASSES = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  green: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  red: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  pink: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  gray: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
};

// Button color classes for the color selector
const BUTTON_COLOR_CLASSES = {
  blue: {
    selected: "bg-blue-500 text-white",
    default: "bg-blue-100 text-blue-700 hover:bg-blue-200"
  },
  green: {
    selected: "bg-green-500 text-white",
    default: "bg-green-100 text-green-700 hover:bg-green-200"
  },
  red: {
    selected: "bg-red-500 text-white",
    default: "bg-red-100 text-red-700 hover:bg-red-200"
  },
  yellow: {
    selected: "bg-yellow-500 text-white",
    default: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
  },
  purple: {
    selected: "bg-purple-500 text-white",
    default: "bg-purple-100 text-purple-700 hover:bg-purple-200"
  },
  pink: {
    selected: "bg-pink-500 text-white",
    default: "bg-pink-100 text-pink-700 hover:bg-pink-200"
  },
  indigo: {
    selected: "bg-indigo-500 text-white",
    default: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
  },
  gray: {
    selected: "bg-gray-500 text-white",
    default: "bg-gray-100 text-gray-700 hover:bg-gray-200"
  }
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

// Custom icons
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

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
  
  // State for custom tags management
  const [customTags, setCustomTags] = useState(() => {
    try {
      const saved = localStorage.getItem("customTags");
      return saved ? JSON.parse(saved) : TAG_COLORS;
    } catch (error) {
      console.error("Error loading custom tags:", error);
      return TAG_COLORS;
    }
  });
  const [isTagEditorOpen, setIsTagEditorOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState("blue");
  
  // Save custom tags to localStorage
  useEffect(() => {
    localStorage.setItem("customTags", JSON.stringify(customTags));
  }, [customTags]);
  
  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);
  
  // Apply dark mode directly on mount
  useEffect(() => {
    // Check if dark mode is enabled in localStorage
    const savedMode = localStorage.getItem("darkMode");
    const isDarkMode = savedMode !== null ? JSON.parse(savedMode) : 
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    // Apply dark mode immediately
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.querySelector('html')?.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.querySelector('html')?.classList.remove('dark');
    }
    
    // Initialize state
    setDarkMode(isDarkMode);
    
    console.log("Initial dark mode set to:", isDarkMode);
    console.log("HTML classes:", document.querySelector('html')?.classList.value);
  }, []);
  
  // Effect to update when darkMode state changes
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    
    // Update class on html element
    const htmlElement = document.querySelector('html');
    if (htmlElement) {
      if (darkMode) {
        htmlElement.classList.add('dark');
      } else {
        htmlElement.classList.remove('dark');
      }
    }
    
    // Also update documentElement
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    console.log("Dark mode updated to:", darkMode);
  }, [darkMode]);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Apply to HTML element - explicitly target the html element
    const htmlElement = document.querySelector('html');
    if (htmlElement) {
      if (newDarkMode) {
        htmlElement.classList.add('dark');
        // Force a style reload by adding and removing a class
        htmlElement.classList.add('dark-mode-enabled');
        setTimeout(() => htmlElement.classList.remove('dark-mode-enabled'), 10);
      } else {
        htmlElement.classList.remove('dark');
      }
    }
    
    // Also manipulate documentElement as a fallback
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Force style recalculation
    document.body.style.display = 'none';
    document.body.offsetHeight; // Trigger a reflow
    document.body.style.display = '';
    
    // Save to localStorage
    localStorage.setItem("darkMode", JSON.stringify(newDarkMode));
    
    console.log("Dark mode toggled to:", newDarkMode);
    console.log("HTML classes:", htmlElement ? htmlElement.classList.value : "No HTML element found");
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTagEditorOpen(true)}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              aria-label="Manage Tags"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
            </button>
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
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
                        className={`text-xs px-2 py-0.5 rounded ${customTags[tag] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}
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
                      className={`text-xs px-2 py-1 rounded flex items-center ${customTags[tag] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}
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
        )}

        {/* Tag Editor Modal */}
        {isTagEditorOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white dark:bg-gray-800 p-6 rounded shadow w-full max-w-md transition-colors duration-200">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">
                Manage Tags
              </h2>
              
              <div className="mb-4">
                <div className="mb-2 font-medium text-gray-700 dark:text-gray-300">
                  Current Tags
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.keys(customTags).map((tagName) => (
                    <div 
                      key={tagName} 
                      className={`text-xs px-2 py-1 rounded flex items-center ${customTags[tagName]}`}
                    >
                      {tagName}
                      <button 
                        className="ml-1 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                        onClick={() => removeCustomTag(tagName)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {Object.keys(customTags).length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No custom tags yet. Create one below.</p>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="mb-2 font-medium text-gray-700 dark:text-gray-300">
                  Add New Tag
                </div>
                <div className="flex flex-col gap-2">
                  <input 
                    type="text"
                    className="border p-2 rounded w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                    placeholder="Tag name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                  />
                  
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Select Color
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {['blue', 'green', 'red', 'yellow', 'purple', 'pink', 'indigo', 'gray'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-full p-2 rounded text-center text-xs capitalize ${
                            selectedColor === color 
                              ? BUTTON_COLOR_CLASSES[color].selected
                              : BUTTON_COLOR_CLASSES[color].default
                          }`}
                          onClick={() => setSelectedColor(color)}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="text-sm mb-1 text-gray-700 dark:text-gray-300">Preview:</div>
                    <div className={`inline-block text-xs px-2 py-1 rounded ${COLOR_CLASSES[selectedColor]}`}>
                      {newTagName || "Tag Preview"}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-4">
                <button 
                  className="bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200" 
                  onClick={() => setIsTagEditorOpen(false)}
                >
                  Close
                </button>
                <button 
                  className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors duration-200" 
                  onClick={addCustomTag}
                  disabled={!newTagName.trim()}
                >
                  Add Tag
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
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
                      className={`text-xs px-2 py-1 rounded flex items-center ${customTags[tag] || "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}
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
        )}
      </div>
    </div>
  );
}