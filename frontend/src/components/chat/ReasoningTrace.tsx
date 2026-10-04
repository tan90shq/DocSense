import React, { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface ReasoningTraceProps {
  isGenerating: boolean;
  citationCount?: number;
}

export const ReasoningTrace: React.FC<ReasoningTraceProps> = ({
  isGenerating,
  citationCount = 0,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer while generating
  useEffect(() => {
    let timer: any;
    let stepTimer1: any;
    let stepTimer2: any;
    let stepTimer3: any;

    if (isGenerating) {
      setIsOpen(true);
      setCurrentStep(1);
      const startTime = Date.now();
      timer = setInterval(() => {
        setElapsedTime(Number(((Date.now() - startTime) / 1000).toFixed(1)));
      }, 100);

      // Simulate step progression
      stepTimer1 = setTimeout(() => setCurrentStep(2), 600);
      stepTimer2 = setTimeout(() => setCurrentStep(3), 1400);
      stepTimer3 = setTimeout(() => setCurrentStep(4), 2200);
    } else {
      setCurrentStep(4);
      if (timer) clearInterval(timer);
    }

    return () => {
      clearInterval(timer);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
    };
  }, [isGenerating]);

  return (
    <div className="max-w-2xl border border-nexus-violet/30 rounded-lg bg-nexus-panel/70 overflow-hidden shadow-neural-violet/20 transition-all duration-200">
      {/* Accordion Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-3.5 py-2 flex items-center justify-between cursor-pointer hover:bg-nexus-card/40 transition-colors select-none"
      >
        <div className="flex items-center space-x-2 text-xs font-mono text-nexus-violet-bright">
          <Sparkles className={`w-3.5 h-3.5 text-nexus-violet ${isGenerating ? "animate-spin" : "animate-pulse"}`} />
          <span className="tracking-wide">✦ NEURAL REASONING TRACE</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-nexus-violet/20 text-nexus-violet font-mono">
            {elapsedTime > 0 ? `${elapsedTime}s` : "0.9s"}
          </span>
          {!isGenerating && citationCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-nexus-cyan/20 text-nexus-cyan font-mono">
              {citationCount} Sources
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-nexus-muted" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-nexus-muted" />
        )}
      </div>

      {/* Accordion Content */}
      {isOpen && (
        <div className="px-3.5 pb-3 pt-1 space-y-2 font-mono text-[11px] border-t border-nexus-border/50 text-nexus-muted">
          {/* Step 1 */}
          <div
            className={`flex items-center space-x-2 transition-colors duration-150 ${
              currentStep >= 1 ? "text-nexus-emerald" : "text-nexus-muted opacity-50"
            }`}
          >
            {currentStep > 1 || !isGenerating ? (
              <CheckCircle2 className="w-3 h-3 text-nexus-emerald flex-shrink-0" />
            ) : (
              <Loader2 className="w-3 h-3 text-nexus-cyan animate-spin flex-shrink-0" />
            )}
            <span>Query Expansion: Multi-query search vectors synthesized</span>
          </div>

          {/* Step 2 */}
          <div
            className={`flex items-center space-x-2 transition-colors duration-150 ${
              currentStep >= 2 ? "text-nexus-emerald" : "text-nexus-muted opacity-50"
            }`}
          >
            {currentStep > 2 || !isGenerating ? (
              <CheckCircle2 className="w-3 h-3 text-nexus-emerald flex-shrink-0" />
            ) : currentStep === 2 ? (
              <Loader2 className="w-3 h-3 text-nexus-cyan animate-spin flex-shrink-0" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-nexus-border flex-shrink-0" />
            )}
            <span>Qdrant Vector Retrieval: Scanned collections across scoped documents</span>
          </div>

          {/* Step 3 */}
          <div
            className={`flex items-center space-x-2 transition-colors duration-150 ${
              currentStep >= 3 ? "text-nexus-emerald" : "text-nexus-muted opacity-50"
            }`}
          >
            {currentStep > 3 || !isGenerating ? (
              <CheckCircle2 className="w-3 h-3 text-nexus-emerald flex-shrink-0" />
            ) : currentStep === 3 ? (
              <Loader2 className="w-3 h-3 text-nexus-cyan animate-spin flex-shrink-0" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-nexus-border flex-shrink-0" />
            )}
            <span>Cross-Encoder Reranking: Scored top relevant chunks (ms-marco)</span>
          </div>

          {/* Step 4 */}
          <div
            className={`flex items-center space-x-2 transition-colors duration-150 ${
              !isGenerating ? "text-nexus-cyan font-medium" : "text-nexus-violet animate-pulse"
            }`}
          >
            {!isGenerating ? (
              <span className="w-2 h-2 rounded-full bg-nexus-cyan flex-shrink-0" />
            ) : (
              <Loader2 className="w-3 h-3 text-nexus-violet animate-spin flex-shrink-0" />
            )}
            <span>
              {!isGenerating
                ? "Neural Synthesis: Completed grounded response with citations"
                : "Neural Synthesis: Generating grounded response..."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
