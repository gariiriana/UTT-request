import { RequestStatus, RequestType } from '../types';
import { Check, X } from 'lucide-react';

interface StepProgressProps {
  currentStatus: RequestStatus;
  requestType: RequestType;
}

export function StepProgress({ currentStatus, requestType }: StepProgressProps) {
  // Different steps for Borrowing vs Procurement
  const procurementSteps = [
    { id: 'created', label: 'Request Created', status: 'Pending - PMO Review' },
    { id: 'pmo-review', label: 'PMO Review', status: 'Pending - PMO Review' },
    { id: 'sales', label: 'Sales Verification', status: 'Pending - Sales Verification' },
    { id: 'pricing', label: 'Pricing', status: 'Pending - Purchasing Pricing' },
    { id: 'bod', label: 'BOD Approval', status: 'Pending - BOD Final Approval' },
    { id: 'processing', label: 'Processing', status: 'Approved - Purchasing Processing' },
    { id: 'delivered', label: 'Delivered', status: 'Delivered - Awaiting PM Confirmation' },
    { id: 'completed', label: 'Completed', status: 'Completed - Delivered' }
  ];

  const borrowingSteps = [
    { id: 'created', label: 'Request Created', status: 'Pending - PMO Review' },
    { id: 'pmo-review', label: 'PMO Review', status: 'Pending - PMO Review' },
    { id: 'sales', label: 'Sales Verification', status: 'Pending - Sales Verification' },
    { id: 'bod', label: 'BOD Approval', status: 'Pending - BOD Final Approval' },
    { id: 'processing', label: 'Processing', status: 'Approved - Purchasing Processing' },
    { id: 'delivered', label: 'Delivered', status: 'Delivered - Awaiting PM Confirmation' },
    { id: 'completed', label: 'Completed', status: 'Completed - Delivered' }
  ];

  const steps = requestType === 'Borrowing' ? borrowingSteps : procurementSteps;

  const isRejected = currentStatus === 'Rejected';
  const currentStepIndex = steps.findIndex(s => s.status === currentStatus);

  return (
    <div className="w-full">
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-slate-800">
          <div
            className={`h-full transition-all duration-500 ${
              isRejected ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{
              width: isRejected ? '100%' : `${(currentStepIndex / (steps.length - 1)) * 100}%`
            }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;

            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                {/* Circle */}
                <div
                  className={`
                    w-10 h-10 rounded-full border-2 flex items-center justify-center
                    transition-all duration-300 z-10
                    ${isRejected && isCurrent
                      ? 'bg-red-500 border-red-500 shadow-lg shadow-red-500/50'
                      : isCompleted || isCurrent
                      ? 'bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/50'
                      : 'bg-slate-800 border-slate-700'
                    }
                  `}
                >
                  {isRejected && isCurrent ? (
                    <X className="text-white" size={20} />
                  ) : isCompleted ? (
                    <Check className="text-white" size={20} />
                  ) : (
                    <span className={`text-sm ${isCurrent ? 'text-white' : 'text-slate-500'}`}>
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Label */}
                <p className={`
                  mt-2 text-xs text-center max-w-[80px]
                  ${isCurrent ? 'text-blue-400' : isPending ? 'text-slate-500' : 'text-slate-400'}
                `}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {isRejected && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-center">Request has been rejected</p>
        </div>
      )}
    </div>
  );
}