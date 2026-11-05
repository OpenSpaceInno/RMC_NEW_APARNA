import { cn } from "@/lib/utils";
import { Check, Circle } from "lucide-react";

interface Step {
  id: string;
  label: string;
  completed: boolean;
  active: boolean;
}

interface VerificationStepsProps {
  steps: Step[];
}

const VerificationSteps = ({ steps }: VerificationStepsProps) => {
  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                step.completed
                  ? "bg-primary border-primary text-primary-foreground"
                  : step.active
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-muted border-muted-foreground/30 text-muted-foreground"
              )}
            >
              {step.completed ? (
                <Check className="h-5 w-5" />
              ) : (
                <Circle className="h-3 w-3" fill={step.active ? "currentColor" : "none"} />
              )}
            </div>
            <span
              className={cn(
                "mt-2 text-xs font-medium text-center max-w-[80px]",
                step.completed || step.active
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "flex-1 h-1 mx-2 rounded-full transition-all",
                step.completed ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default VerificationSteps;
