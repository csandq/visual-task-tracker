      {/* Tag Modal */}
      {modalType === "tag" && getCurrentTask() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Tags</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tagSettings.tags.map((tag, i) => (
                  <div 
                      // Tag Management Functions
  const addTag = () => {
    if (!newTagName.trim() || tagSettings.tags.includes(newTagName.trim())) {
      return;
    }
    
    const tag = newTagName.trim();
    const colorClass = `${COLOR_OPTIONS[selectedColorIndex].bg} ${COLOR_OPTIONS[selectedColorIndex].text}`;
    
    setTagSettings({
      tags: [...tagSettings.tags, tag],
      colors: {
        ...tagSettings.colors,
        [tag]: colorClass
      }
    });
    
    setNewTagName("");
    setSelectedColorIndex(0);
  };
  
  const updateTag = () => {
    if (!editingTag || !newTagName.trim()) return;
    
    const oldTag = editingTag;
    const newTag = newTagName.trim();
    const colorClass = `${COLOR_OPTIONS[selectedColorIndex].bg} ${COLOR_OPTIONS[selectedColorIndex].text}`;
    
    // Update tag settings
    const newColors = {...tagSettings.colors};
    delete newColors[oldTag];
    newColors[newTag] = colorClass;
    
    // Update all tasks using this tag
    const updatedTasks = tasks.map(task => ({
      ...task,
      tags: task.tags.map(tag => tag === oldTag ? newTag : tag)
    }));
    
    setTagSettings({
      tags: tagSettings.tags.map(tag => tag === oldTag ? newTag : tag),
      colors: newColors
    });
    
    setTasks(updatedTasks);
    setEditingTag(null);
    setNewTagName("");
  };
  
  const deleteTag = (tag) => {
    // Update tag settings
    const newColors = {...tagSettings.colors};
    delete newColors[tag];
    
    // Update all tasks using this tag
    const updatedTasks = tasks.map(task => ({
      ...task,
      tags: task.tags.filter(t => t !== tag)
    }));
    
    setTagSettings({
      tags: tagSettings.tags.filter(t => t !== tag),
      colors: newColors
    });
    
    setTasks(updatedTasks);
    
    if (editingTag === tag) {
      setEditingTag(null);
      setNewTagName("");
    }
  };
  
  const startEditingTag = (tag) => {
    setEditingTag(tag);
    setNewTagName(tag);
    
    // Find current color index
    const currentColor = tagSettings.colors[tag];
    const colorIndex = COLOR_OPTIONS.findIndex(
      color => `${color.bg} ${color.text}` === currentColor
    );
    
    setSelectedColorIndex(colorIndex >= 0 ? colorIndex : 0);
  };import React, { useState, useEffect } from "react";

// Constants for task statuses and priorities
const PRIORITY_COLORS = {
  High: "bg-red-600",
  Medium: "bg-gray-600",
  Low: "bg-green-600"
};

// Available color options for tag customization
const COLOR_OPTIONS = [
  { name: "Blue", bg: "bg-blue-100", text: "text-blue-700" },
  { name: "Green", bg: "bg-green-100", text: "text-green-700" },
  { name: "Red", bg: "bg-red-100", text: "text-red-700" },
  { name: "Yellow", bg: "bg-yellow-100", text: "text-yellow-700" },
  { name: "Purple", bg: "bg-purple-100", text: "text-purple-700" },
  { name: "Pink", bg: "bg-pink-100", text: "text-pink-700" },
  { name: "Indigo", bg: "bg-indigo-100", text: "text-indigo-700" },
  { name: "Teal", bg: "bg-teal-100", text: "text-teal-700" },
  { name: "Orange", bg: "bg-orange-100", text: "text-orange-700" },
  { name: "Gray", bg: "bg-gray-100", text: "text-gray-700" }
];

// Load custom tag settings from localStorage or use defaults
const loadTagSettings = () => {
  try {
    const saved = localStorage.getItem("tagSettings");
    if (saved) return JSON.parse(saved);
  } catch (error) {
    console.error("Error loading tag settings:", error);
  }
  
  return {
    tags: ["Marketing", "Design", "Dev", "Research"],
    colors: {
      Marketing: "bg-blue-100 text-blue-700",
      Design: "bg-pink-100 text-pink-700",
      Dev: "bg-green-100 text-green-700",
      Research: "bg-yellow-100 text-yellow-700"
    }
  };
};

// Load tasks from localStorage or use default
const loadTasks = () => {
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
        { label: "Build", status: "in-progress", note: "Wireframing ongoing.", deadline: "2025-05-22" },
        { label: "Test", status: "todo", note: "", deadline: "2025-05-28" },
        { label: "Launch", status: "on-hold", note: "", deadline: "2025-06-01" }
      ]
    }
  ];
};

// Step Component
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

// Task Row Component
const TaskRow = ({ task, onStepClick, onTitleClick, onTagClick }) => {
  // Get tag colors from the passed task
  const getTagColor = (tag) => {
    // This will be passed from the parent component
    return task.tagColors?.[tag] || "bg-gray-100 text-gray-700";
  };
  
  return (
    <div className="mb-6 p-3 border border-gray-200 rounded hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold cursor-pointer hover:underline" onClick={onTitleClick}>
          {task.title} 
          <span className={`text-xs text-white ${PRIORITY_COLORS[task.priority] || "bg-gray-600"} px-2 py-0.5 ml-2 rounded`}>
            Priority: {task.priority || 'Medium'}
          </span>
        </h2>
        <div className="flex gap-2">
          {task.tags.map((tag, i) => (
            <span 
              key={i} 
              onClick={onTagClick} 
              className={`text-xs px-2 py-0.5 rounded cursor-pointer ${getTagColor(tag)}`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center space-x-6 overflow-x-auto py-2">
        {task.steps.map((step, index) => (
          <React.Fragment key={index}>
            <Step 
              {...step} 
              onClick={() => onStepClick(index)} 
            />
            {index < task.steps.length - 1 && <div className="w-10 h-1 bg-gray-300 flex-shrink-0"></div>}
          </React.Fragment>
        ))}
        <button 
          onClick={() => onStepClick(-1)} 
          className="ml-2 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"
        >
          +
        </button>
      </div>
    </div>
  );
};

// Main App Component
export default function App() {
  // Core state
  const [tasks, setTasks] = useState(loadTasks());
  const [filter, setFilter] = useState({ tag: "", status: "" });
  
  // Tag management state
  const [tagSettings, setTagSettings] = useState(loadTagSettings());
  const [showTagManager, setShowTagManager] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [editingTag, setEditingTag] = useState(null);
  
  // Form state
  const [newTitle, setNewTitle] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  
  // Modal state
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [stepIndex, setStepIndex] = useState(null);
  
  // Editing state
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState("Medium");
  const [selectedTags, setSelectedTags] = useState([]);
  const [editingStep, setEditingStep] = useState({ label: "", status: "todo", note: "", deadline: "" });
  const [newStepName, setNewStepName] = useState("");

  // Save tasks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("tasks", JSON.stringify(tasks));
    } catch (error) {
      console.error("Error saving tasks:", error);
    }
  }, [tasks]);
  
  // Save tag settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("tagSettings", JSON.stringify(tagSettings));
    } catch (error) {
      console.error("Error saving tag settings:", error);
    }
  }, [tagSettings]);

  // Get current task
  const getCurrentTask = () => tasks.find(t => t.id === currentTaskId);

  // Task Functions
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
    
    // Open add step modal
    openStepModal(newTaskId, -1);
  };

  const updateTaskTitle = () => {
    if (!editTitle.trim()) return;
    
    setTasks(tasks.map(task => 
      task.id === currentTaskId 
        ? { ...task, title: editTitle, priority: editPriority }
        : task
    ));
    
    closeModal();
  };

  const updateTaskTags = () => {
    setTasks(tasks.map(task => 
      task.id === currentTaskId 
        ? { ...task, tags: selectedTags }
        : task
    ));
    
    closeModal();
  };

  const deleteTask = () => {
    setTasks(tasks.filter(task => task.id !== currentTaskId));
    closeModal();
  };

  // Step Functions
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

  // Tag Functions
  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const customTag = document.getElementById("customTagInput")?.value?.trim();
    if (customTag && !selectedTags.includes(customTag)) {
      // If tag doesn't exist in settings, add it
      if (!tagSettings.tags.includes(customTag)) {
        // Pick a random color for the new tag
        const randomIndex = Math.floor(Math.random() * COLOR_OPTIONS.length);
        const colorClass = `${COLOR_OPTIONS[randomIndex].bg} ${COLOR_OPTIONS[randomIndex].text}`;
        
        setTagSettings({
          tags: [...tagSettings.tags, customTag],
          colors: {
            ...tagSettings.colors,
            [customTag]: colorClass
          }
        });
      }
      
      setSelectedTags([...selectedTags, customTag]);
      if (document.getElementById("customTagInput")) {
        document.getElementById("customTagInput").value = "";
      }
    }
  };

  // Modal Functions
  const openTitleModal = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    setCurrentTaskId(taskId);
    setModalType("title");
    setEditTitle(task.title);
    setEditPriority(task.priority || "Medium");
  };

  const openTagModal = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    setCurrentTaskId(taskId);
    setModalType("tag");
    setSelectedTags([...task.tags]);
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

  const closeModal = () => {
    setModalType(null);
    setCurrentTaskId(null);
    setStepIndex(null);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // Filter by tag
    if (filter.tag && !task.tags.includes(filter.tag)) return false;
    
    // Filter by status
    if (filter.status) {
      const hasMatchingStep = task.steps.some(step => step.status === filter.status);
      if (!hasMatchingStep) return false;
    }
    
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto mt-10 p-4 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-6">Task Tracker</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Main section - Task Creation */}
        <div className="lg:col-span-2">
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
          
          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-3">
            <select 
              className="border px-3 py-1 rounded" 
              value={filter.tag} 
              onChange={e => setFilter({...filter, tag: e.target.value})}
            >
              <option value="">All Tags</option>
              {tagSettings.tags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            
            <select 
              className="border px-3 py-1 rounded" 
              value={filter.status} 
              onChange={e => setFilter({...filter, status: e.target.value})}
            >
              <option value="">All Statuses</option>
              <option value="todo">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>
            
            {(filter.tag || filter.status) && (
              <button 
                onClick={() => setFilter({ tag: "", status: "" })} 
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
          
          {/* Task List */}
          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {tasks.length === 0 ? 
                  "No tasks yet. Add your first task above!" : 
                  "No tasks match your current filters."}
              </div>
            ) : (
              filteredTasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={{
                    ...task,
                    // Ensure we use the latest tag colors
                    tagColors: tagSettings.colors
                  }}
                  onStepClick={(index) => openStepModal(task.id, index)}
                  onTitleClick={() => openTitleModal(task.id)}
                  onTagClick={() => openTagModal(task.id)}
                />
              ))
            )}
          </div>
        </div>
        
        {/* Tag Manager Panel */}
        <div className="bg-gray-50 p-4 rounded h-fit sticky top-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Tag Manager</h2>
            <button
              className="text-sm text-blue-600 hover:underline"
              onClick={() => setShowTagManager(!showTagManager)}
            >
              {showTagManager ? "Hide" : "Show"}
            </button>
          </div>
          
          {showTagManager && (
            <>
              <div className="mb-4 p-3 border border-gray-200 bg-white rounded">
                <h3 className="text-sm font-medium mb-2">
                  {editingTag ? "Edit Tag" : "Create New Tag"}
                </h3>
                
                <div className="mb-2">
                  <input
                    type="text"
                    className="w-full border px-2 py-1 rounded text-sm"
                    placeholder="Tag name"
                    value={newTagName}
                    onChange={e => setNewTagName(e.target.value)}
                  />
                </div>
                
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">Color</label>
                  <div className="flex flex-wrap gap-1">
                    {COLOR_OPTIONS.map((color, index) => (
                      <div
                        key={index}
                        className={`w-6 h-6 rounded cursor-pointer ${color.bg} ${color.text} flex items-center justify-center ${
                          selectedColorIndex === index ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => setSelectedColorIndex(index)}
                      >
                        {selectedColorIndex === index && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">Preview</label>
                  <div className={`inline-block px-2 py-1 rounded text-xs ${COLOR_OPTIONS[selectedColorIndex].bg} ${COLOR_OPTIONS[selectedColorIndex].text}`}>
                    {newTagName || "Tag Preview"}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  {editingTag && (
                    <button
                      className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                      onClick={() => deleteTag(editingTag)}
                    >
                      Delete
                    </button>
                  )}
                  
                  <div className="ml-auto">
                    {editingTag && (
                      <button
                        className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 mr-2"
                        onClick={() => {
                          setEditingTag(null);
                          setNewTagName("");
                        }}
                      >
                        Cancel
                      </button>
                    )}
                    
                    <button
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      onClick={editingTag ? updateTag : addTag}
                      disabled={!newTagName.trim()}
                    >
                      {editingTag ? "Update" : "Create"}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="max-h-60 overflow-y-auto">
                <h3 className="text-sm font-medium mb-2">Your Tags</h3>
                <div className="space-y-2">
                  {tagSettings.tags.map(tag => (
                    <div
                      key={tag}
                      className="flex items-center justify-between p-1.5 bg-white border border-gray-200 rounded text-sm"
                    >
                      <div className={`px-2 py-0.5 rounded ${tagSettings.colors[tag]}`}>
                        {tag}
                      </div>
                      <button
                        className="text-blue-600 hover:text-blue-800 text-xs"
                        onClick={() => startEditingTag(tag)}
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                  
                  {tagSettings.tags.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-2">
                      No tags created yet
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {tasks.length === 0 ? 
              "No tasks yet. Add your first task above!" : 
              "No tasks match your current filters."}
          </div>
        ) : (
          filteredTasks.map(task => (
            <TaskRow
              key={task.id}
              task={{
                ...task,
                // Ensure we use the latest tag colors
                tagColors: tagSettings.colors
              }}
              onStepClick={(index) => openStepModal(task.id, index)}
              onTitleClick={() => openTitleModal(task.id)}
              onTagClick={() => openTagModal(task.id)}
            />
          ))
        )}
      </div>

      {/* Title Modal */}
      {modalType === "title" && getCurrentTask() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Task</h2>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title
              </label>
              <input 
                type="text"
                className="w-full border p-2 rounded mb-4" 
                value={editTitle} 
                onChange={(e) => setEditTitle(e.target.value)} 
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select 
                className="w-full border p-2 rounded" 
                value={editPriority} 
                onChange={(e) => setEditPriority(e.target.value)}
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>
            
            <div className="flex justify-between mt-4">
              <button 
                className="bg-red-500 text-white px-3 py-2 rounded" 
                onClick={deleteTask}
              >
                Delete Task
              </button>
              <div>
                <button 
                  className="bg-gray-300 text-gray-800 px-3 py-2 rounded mr-2" 
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button 
                  className="bg-blue-500 text-white px-3 py-2 rounded" 
                  onClick={updateTaskTitle}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {modalType === "tag" && getCurrentTask() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Tags</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tagSettings.tags.map((tag, i) => (
                  <div 
                    key={i}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded cursor-pointer text-sm ${
                      selectedTags.includes(tag) 
                        ? tagSettings.colors[tag] || "bg-gray-300 text-gray-800" 
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Custom Tag
              </label>
              <div className="flex">
                <input 
                  id="customTagInput"
                  type="text"
                  className="border rounded-l px-3 py-1 flex-grow" 
                  placeholder="New tag name..." 
                  autoFocus
                />
                <button 
                  onClick={handleAddCustomTag}
                  className="bg-blue-500 text-white px-3 py-1 rounded-r"
                >
                  Add
                </button>
              </div>
            </div>
            
            {selectedTags.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag, i) => (
                    <div 
                      key={i}
                      className={`px-3 py-1 rounded text-sm flex items-center ${
                        tagSettings.colors[tag] || "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {tag}
                      <span 
                        className="ml-2 cursor-pointer" 
                        onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                      >
                        ×
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              <button 
                className="bg-gray-300 text-gray-800 px-3 py-2 rounded mr-2" 
                onClick={closeModal}
              >
                Cancel
              </button>
              <button 
                className="bg-blue-500 text-white px-3 py-2 rounded" 
                onClick={updateTaskTags}
              >
                Save Tags
              </button>
            </div>
          </div>
        </div>
      )}

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
                  autoFocus
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
                    autoFocus
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag, i) => (
                    <div 
                      key={i}
                      className={`px-3 py-1 rounded text-sm flex items-center ${
                        tagSettings.colors[tag] || "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {tag}
                      <span 
                        className="ml-2 cursor-pointer" 
                        onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                      >
                        ×
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              <button 
                className="bg-gray-300 text-gray-800 px-3 py-2 rounded mr-2" 
                onClick={closeModal}
              >
                Cancel
              </button>
              <button 
                className="bg-blue-500 text-white px-3 py-2 rounded" 
                onClick={updateTaskTags}
              >
                Save Tags
              </button>
            </div>
          </div>
        </div>
      )}

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
                  autoFocus
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
                    autoFocus
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
}d-l px-3 py-1 flex-grow" 
                  placeholder="New tag name..." 
                />
                <button 
                  onClick={handleAddCustomTag}
                  className="bg-blue-500 text-white px-3 py-1 rounded-r"
                >
                  Add
                </button>
              </div>
            </div>
            
            {selectedTags.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag, i) => (
                    <div 
                      key={i}
                      className={`px-3 py-1 rounded text-sm flex items-center ${
                        tagSettings.colors[tag] || "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {tag}
                      <span 
                        className="ml-2 cursor-pointer" 
                        onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                      >
                        ×
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              <button 
                className="bg-gray-300 text-gray-800 px-3 py-2 rounded mr-2" 
                onClick={closeModal}
              >
                Cancel
              </button>
              <button 
                className="bg-blue-500 text-white px-3 py-2 rounded" 
                onClick={updateTaskTags}
              >
                Save Tags
              </button>
            </div>
          </div>
        </div>
      )}

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
                  autoFocus
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
                    autoFocus
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
}={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                      >
                        ×
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              <button 
                className="bg-gray-300 text-gray-800 px-3 py-2 rounded mr-2" 
                onClick={closeModal}
              >
                Cancel
              </button>
              <button 
                className="bg-blue-500 text-white px-3 py-2 rounded" 
                onClick={updateTaskTags}
              >
                Save Tags
              </button>
            </div>
          </div>
        </div>
      )}

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
