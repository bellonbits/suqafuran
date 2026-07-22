import React from 'react';

interface Step {
  key: string;
  number: string;
  title: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: string;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, idx) => (
        <div key={step.key} className="flex items-center flex-1">
          {/* Step Circle */}
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition ${
                idx <= currentIndex
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step.number.substring(0, 2)}
            </div>
            <p
              className={`text-xs font-semibold mt-2 ${
                idx <= currentIndex ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {step.title}
            </p>
          </div>

          {/* Connector Line */}
          {idx < steps.length - 1 && (
            <div
              className={`flex-1 h-1 mx-2 transition ${
                idx < currentIndex ? 'bg-gray-900' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default StepIndicator;
