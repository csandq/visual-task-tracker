import React, { useState } from "react";

const initialTasks = [
  {
    id: 1,
    title: "Launch Campaign",
    steps: [
      { label: "Research", status: "done", note: "Checked competitors.", deadline: "2025-05-15" },
      { label: "Plan", status: "done", note: "Built outline.", deadline: "2025-05-18" },
      { label: "Build", status: "in-progress", note: "Currently building wireframes.", deadline: "2025-05-22" },
      { label: "Test", status: "todo", note: "", deadline: "2025-05-28" },
      { label: "Launch", status: "todo", note: "", deadline: "2025-06-01" }
    ]
  }
];

const Step = ({ label, status, note, deadline, onClick }) => {
  const getColor = () => {
    if (status === "done") return "bg-green-500 border-green-500";
    if (status === "in-progress") return "bg-yellow-400 border-yellow-400";
    return "bg-white border-gray-400";
  };

  return (
    <div className="flex flex-col items-center space-y-1 cursor-pointer" onClick={onClick}>
      <div className={`w-6 h-6 rounded-full border-4 ${getColor()}`}></div>
      <span className="text-xs text-center whitespace-nowrap">{label}</span>
      {deadline && <span className="text-[10px] text-gray-500">{deadline}</span>}
    </div>
  );
};

const TaskRow = ({ task, onStepClick }) => (
  <div className="mb-6">
    <h2 className="font-semibold mb-2">{task.title}</h2>
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
  const [modal, setModal] = useState(null);

  const addTask = () => {
    if (!newTitle.trim()) return;
    const newTask = {
      id: tasks.length + 1,
      title: newTitle,
      steps: [
        { label: "Step 1", status: "todo", note: "", deadline: "" },
        { label: "Step 2", status: "todo", note: "", deadline: "" },
        { label: "Step 3", status: "todo", note: "", deadline: "" }
      ]
    };
    setTasks([newTask, ...tasks]);
    setNewTitle("");
  };

  const updateStep = (taskId, stepIndex, note, deadline) => {
    const updated = tasks.map((task) => {
      if (task.id === taskId) {
        const newSteps = [...task.steps];
        newSteps[stepIndex] = {
          ...newSteps[stepIndex],
          note,
          deadline
        };
        return { ...task, steps: newSteps };
      }
      return task;
    });
    setTasks(updated);
    setModal(null);
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-6">Your Tasks</h1>
      <div className="flex mb-6">
        <input
          type="text"
          className="border border-gray-300 px-3 py-1 mr-2 flex-grow rounded"
          placeholder="New task name..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button
          onClick={addTask}
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
        >
          Add Task
        </button>
      </div>
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} onStepClick={(taskId, stepIndex) => setModal({ taskId, stepIndex })} />
      ))}

      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Step</h2>
            <textarea
              className="w-full border p-2 mb-4"
              rows={3}
              placeholder="Add a note..."
              value={tasks.find(t => t.id === modal.taskId).steps[modal.stepIndex].note}
              onChange={(e) => {
                const newTasks = [...tasks];
                newTasks.find(t => t.id === modal.taskId).steps[modal.stepIndex].note = e.target.value;
                setTasks(newTasks);
              }}
            ></textarea>
            <input
              type="date"
              className="w-full border p-2 mb-4"
              value={tasks.find(t => t.id === modal.taskId).steps[modal.stepIndex].deadline}
              onChange={(e) => {
                const newTasks = [...tasks];
                newTasks.find(t => t.id === modal.taskId).steps[modal.stepIndex].deadline = e.target.value;
                setTasks(newTasks);
              }}
            />
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-300 px-4 py-1 rounded"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-1 rounded"
                onClick={() => updateStep(
                  modal.taskId,
                  modal.stepIndex,
                  tasks.find(t => t.id === modal.taskId).steps[modal.stepIndex].note,
                  tasks.find(t => t.id === modal.taskId).steps[modal.stepIndex].deadline
                )}
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
