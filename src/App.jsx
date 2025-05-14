import React from "react";

const taskData = {
  title: "Launch Campaign",
  steps: [
    { label: "Research", status: "done" },
    { label: "Plan", status: "done" },
    { label: "Build", status: "in-progress" },
    { label: "Test", status: "todo" },
    { label: "Launch", status: "todo" }
  ]
};

const Step = ({ label, status }) => {
  const getColor = () => {
    if (status === "done") return "bg-green-500 border-green-500";
    if (status === "in-progress") return "bg-yellow-400 border-yellow-400";
    return "bg-white border-gray-400";
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-6 h-6 rounded-full border-4 ${getColor()}`}></div>
      <span className="text-sm">{label}</span>
    </div>
  );
};

export default function App() {
  return (
    <div className="max-w-4xl mx-auto mt-10 p-4 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-6">{taskData.title}</h1>
      <div className="flex items-center space-x-6 overflow-x-auto">
        {taskData.steps.map((step, index) => (
          <React.Fragment key={index}>
            <Step {...step} />
            {index < taskData.steps.length - 1 && (
              <div className="w-10 h-1 bg-gray-300 flex-shrink-0"></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}