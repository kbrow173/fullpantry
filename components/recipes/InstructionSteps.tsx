import { type RecipeInstruction } from "@/lib/types";

interface InstructionStepsProps {
  instructions: RecipeInstruction[];
}

export function InstructionSteps({ instructions }: InstructionStepsProps) {
  if (instructions.length === 0) {
    return (
      <p className="text-fp-text-muted text-sm italic">No instructions listed.</p>
    );
  }

  return (
    <ol className="space-y-5">
      {instructions.map((inst) => (
        <li key={inst.id} className="flex gap-4">
          {/* Step number circle */}
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-fp-accent text-white text-[11px] font-bold flex items-center justify-center mt-0.5 tabular-nums">
            {inst.step_number}
          </span>
          {/* Instruction text */}
          <p className="text-fp-text text-[15px] leading-relaxed flex-1">
            {inst.instruction}
          </p>
        </li>
      ))}
    </ol>
  );
}
