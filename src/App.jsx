import React, { useState, useEffect } from "react";

const predefinedTags = ["Marketing", "Design", "Dev", "Research"];
const tagColors = {
  Marketing: "bg-blue-100 text-blue-700",
  Design: "bg-pink-100 text-pink-700",
  Dev: "bg-green-100 text-green-700",
  Research: "bg-yellow-100 text-yellow-700"
};

const priorityColors = {
  High: "bg-red-600",
  Medium: "bg-gray-600",
  Low: "bg-green-600"
};

const loadTasks = () => {
  const saved = localStorage.getItem("tasks");
  if (saved) return JSON.parse(saved);
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
  <div className="mb-6 p-3 border border-gray-200 rounded hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-1">
      <h2 className="font-semibold cursor-pointer hover:underline" onClick={() => onTitleClick(task.id)}>
        {task.title} 
        <span className={`text-xs text-white ${priorityColors[task.priority] || "bg-gray-600"} px-2 py-0.5 ml-2 rounded`}>
          Priority: {task.priority || 'Medium'}
        </span>
      </h2>
      <div className="flex gap-2">
        {task.tags.map((tag, i) => (
          <span 
            key={i} 
            onClick={() => onTagClick(task.id)} 
            className={`text-xs px-2 py-0.5 rounded cursor-pointer ${tagColors[tag] || "bg-gray-100 text-gray-700"}`}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
    <div className="flex items-center space-x-6 overflow-x-auto py-2">
      {task.steps.map((step, index) => (
        <React.Fragment key={index}>
          <Step {...step} onClick={() => onStepClick(task.id, index)} />
          {index < task.steps.length - 1 && <div className="w-10 h-1 bg-gray-300 flex-shrink-0"></div>}
        </React.Fragment>
      ))}
      <button 
        onClick={() => onStepClick(task.id, -1)} 
        className="ml-2 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"
      >
        +
      </button>
    </div>
  </div>
);

export default function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [newTitle, setNewTitle] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [stepModal, setStepModal] = useState(null);
  const [titleModal, setTitleModal] = useState(null);
  const [tagModal, setTagModal] = useState(null);
  const [newStep, setNewStep] = useState("");
  const [filter, setFilter] = useState({ tag: "", status: "" });

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!newTitle.trim()) return;
    const tags = newTag ? newTag.split(",").map(t => t.trim()).filter(Boolean) : [];
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
    setStepModal({ taskId: newTask.id, stepIdx: -1 });
  };

  const addStepToTask = (taskId, label) => {
    if (!label.trim()) return;
    setTasks(tasks.map(task => task.id === taskId ? {
      ...task,
      steps: [...task.steps, { label, status: "todo", note: "", deadline: "" }]
    } : task));
    setNewStep("");
  };

  const updateStep = (taskId, index, updatedStep) => {
    setTasks(tasks.map(task => task.id === taskId ? {
      ...task,
      steps: task.steps.map((s, i) => i === index ? updatedStep : s)
    } : task));
    setStepModal(null);
  };

  const removeStep = (taskId, index) => {
    setTasks(tasks.map(task => task.id === taskId ? {
      ...task,
      steps: task.steps.filter((_, i) => i !== index)
    } : task));
    setStepModal(null);
  };

  const updateTitle = (taskId, newTitle, newPriority) => {
    setTasks(tasks.map(task => task.id === taskId ? { 
      ...task, 
      title: newTitle,
      priority: newPriority
    } : task));
    setTitleModal(null);
  };

  const updateTags = (taskId, newTags) => {
    setTasks(tasks.map(task => task.id === taskId ? { ...task, tags: newTags } : task));
    setTagModal(null);
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    setTitleModal(null);
  };

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
    <div className="max-w-4xl mx-auto mt-10 p-4 bg-white shadow rounded">
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

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select 
          className="border px-3 py-1 rounded" 
          value={filter.tag} 
          onChange={e => setFilter({...filter, tag: e.target.value})}
        >
          <option value="">All Tags</option>
          {predefinedTags.map(tag => (
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
              task={task}
              onStepClick={(taskId, stepIdx) => setStepModal({ taskId, stepIdx })}
              onTitleClick={(taskId) => setTitleModal(taskId)}
              onTagClick={(taskId) => setTagModal(taskId)}
            />
          ))
        )}
      </div>

      {/* Step Modal */}
      {stepModal && (() => {
        const task = tasks.find(t => t.id === stepModal.taskId);
        const isNewStep = stepModal.stepIdx === -1;
        const step = isNewStep ? { label: "", status: "todo", note: "", deadline: "" } : task.steps[stepModal.stepIdx];
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white p-6 rounded shadow w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">{isNewStep ? "Add New Step" : "Edit Step"}</h2>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Step Name</label>
                <input 
                  className="w-full border p-2 rounded" 
                  value={isNewStep ? newStep : step.label} 
                  onChange={(e) => isNewStep ? setNewStep(e.target.value) : step.label = e.target.value} 
                />
              </div>
              
              {!isNewStep && (
                <>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea 
                      className="w-full border p-2 rounded" 
                      value={step.note} 
                      onChange={(e) => step.note = e.target.value} 
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                    <input 
                      type="date" 
                      className="w-full border p-2 rounded" 
                      value={step.deadline} 
                      onChange={(e) => step.deadline = e.target.value} 
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select 
                      className="w-full border p-2 rounded" 
                      value={step.status} 
                      onChange={(e) => step.status = e.target.value}
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
                {isNewStep ? (
                  <>
                    <button 
                      className="bg-gray-300 text-gray-800 px-4 py-2 rounded" 
                      onClick={() => setStepModal(null)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="bg-blue-500 text-white px-4 py-2 rounded" 
                      onClick={() => {
                        addStepToTask(stepModal.taskId, newStep);
                        setStepModal(null);
                      }}
                    >
                      Add Step
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600" 
                      onClick={() => removeStep(stepModal.taskId, stepModal.stepIdx)}
                    >
                      Delete
                    </button>
                    <button 
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" 
                      onClick={() => updateStep(stepModal.taskId, stepModal.stepIdx, step)}
                    >
                      Save
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Title Modal */}
      {titleModal && (() => {
        const task = tasks.find(t => t.id === titleModal);
        const [editTitle, setEditTitle] = useState(task.title);
        const [editPriority, setEditPriority] = useState(task.priority);
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white p-6 rounded shadow w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Edit Task</h2>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input 
                  className="w-full border p-2 rounded mb-4" 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)} 
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
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
                  onClick={() => deleteTask(task.id)}
                >
                  Delete Task
                </button>
                <div>
                  <button 
                    className="bg-gray-300 text-gray-800 px-3 py-2 rounded mr-2" 
                    onClick={() => setTitleModal(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="bg-blue-500 text-white px-3 py-2 rounded" 
                    onClick={() => updateTitle(task.id, editTitle, editPriority)}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tag Modal */}
      {tagModal && (() => {
        const task = tasks.find(t => t.id === tagModal);
        const [selectedTags, setSelectedTags] = useState([...task.tags]);
        const [customTag, setCustomTag] = useState("");
        
        const handleTagToggle = (tag) => {
          if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
          } else {
            setSelectedTags([...selectedTags, tag]);
          }
        };
        
        const handleAddCustomTag = () => {
          if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
            setSelectedTags([...selectedTags, customTag.trim()]);
            setCustomTag("");
          }
        };
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white p-6 rounded shadow w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Edit Tags</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Predefined Tags</label>
                <div className="flex flex-wrap gap-2">
                  {predefinedTags.map((tag, i) => (
                    <div 
                      key={i}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 rounded cursor-pointer text-sm ${
                        selectedTags.includes(tag) 
                          ? tagColors[tag] || "bg-gray-300 text-gray-800" 
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Custom Tag</label>
                <div className="flex">
                  <input 
                    type="text" 
                    className="border rounded-l px-3 py-1 flex-grow" 
                    placeholder="Add custom tag..." 
                    value={customTag} 
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCustomTag()}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Selected Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag, i) => (
                      <div 
                        key={i}
                        className={`px-3 py-1 rounded text-sm flex items-center ${
                          tagColors[tag] || "bg-gray-200 text-gray-800"
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
                  onClick={() => setTagModal(null)}
                >
                  Cancel
                </button>
                <button 
                  className="bg-blue-500 text-white px-3 py-2 rounded" 
                  onClick={() => updateTags(task.id, selectedTags)}
                >
                  Save Tags
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}