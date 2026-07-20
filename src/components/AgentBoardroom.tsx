import React, { useState, useEffect, useRef } from "react";
import { Play, CheckCircle, XCircle, AlertCircle, Cpu, FileText, Sparkles, Terminal, ChevronRight, MessageSquare } from "lucide-react";
import { Job, Candidate, EvaluationReport } from "../types";

interface AgentBoardroomProps {
  job: Job;
  candidate: Candidate;
  onEvaluationComplete: (report: EvaluationReport) => void;
  onCancel: () => void;
}

interface ChatMessage {
  agentName: string;
  role: string;
  avatarColor: string;
  message: string;
  timestamp: string;
  isJson?: boolean;
  jsonData?: any;
}

export default function AgentBoardroom({ job, candidate, onEvaluationComplete, onCancel }: AgentBoardroomProps) {
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [logs, setLogs] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const agents = [
    {
      id: "agent-parser",
      name: "Resume Intelligence Agent",
      role: "Resume Parser",
      avatar: "🤖",
      color: "bg-blue-600 text-white",
      borderColor: "border-blue-500",
      description: "Converts uploaded resumes into structured candidate JSON profiles.",
    },
    {
      id: "agent-compliance",
      name: "Eligibility Verification Agent",
      role: "HR Compliance Officer",
      avatar: "⚖️",
      color: "bg-emerald-600 text-white",
      borderColor: "border-emerald-500",
      description: "Verifies mandatory requirements such as education, experience, and core skills.",
    },
    {
      id: "agent-evaluator",
      name: "Skill Assessment Agent",
      role: "Technical Evaluator",
      avatar: "🧠",
      color: "bg-purple-600 text-white",
      borderColor: "border-purple-500",
      description: "Measures technical and soft-skill alignment with the job description.",
    },
    {
      id: "agent-reviewer",
      name: "Experience Assessment Agent",
      role: "Senior HR Reviewer",
      avatar: "👔",
      color: "bg-amber-600 text-white",
      borderColor: "border-amber-500",
      description: "Evaluates the relevance, tenure, and quality of work history & projects.",
    },
    {
      id: "agent-ranker",
      name: "Candidate Ranking Agent",
      role: "Talent Ranking Specialist",
      avatar: "📈",
      color: "bg-indigo-600 text-white",
      borderColor: "border-indigo-500",
      description: "Ranks eligible candidates objectively using synthesized metrics.",
    },
    {
      id: "agent-interviewer",
      name: "Interview Preparation Agent",
      role: "Technical Interviewer",
      avatar: "🎤",
      color: "bg-pink-600 text-white",
      borderColor: "border-pink-500",
      description: "Generates tailored technical and behavioral interview questions.",
    },
    {
      id: "agent-manager",
      name: "Hiring Decision Agent",
      role: "Hiring Manager",
      avatar: "👑",
      color: "bg-rose-600 text-white",
      borderColor: "border-rose-500",
      description: "Produces the final hiring recommendation with confidence metrics.",
    },
    {
      id: "agent-coordinator",
      name: "HR Communication Agent",
      role: "HR Coordinator",
      avatar: "✉️",
      color: "bg-teal-600 text-white",
      borderColor: "border-teal-500",
      description: "Drafts interview invitations, rejection emails, and offer letters.",
    },
  ];

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const addLog = (agentName: string, role: string, avatarColor: string, message: string, isJson = false, jsonData?: any) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs((prev) => [
      ...prev,
      {
        agentName,
        role,
        avatarColor,
        message,
        timestamp: time,
        isJson,
        jsonData,
      },
    ]);
  };

  const startPipeline = async () => {
    setPipelineRunning(true);
    setCurrentStep(0);
    setError(null);
    setLogs([]);

    addLog(
      "CrewAI Orchestrator",
      "System",
      "bg-slate-700 text-white",
      `Initializing Multi-Agent Recruitment Pipeline for Candidate: ${candidate.name} and Job: ${job.title}.`
    );

    try {
      // API call to evaluate candidate
      const response = await fetch("/api/evaluate-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job,
          candidateName: candidate.name,
          resumeText: candidate.resumeText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to evaluate candidate via Gemini server.");
      }

      const data = await response.json();
      const report: EvaluationReport = data.simulation ? data : data; // Handle both types

      // Now we run a beautifully timed simulated discussion that matches the actual backend data!
      // This bridges the API results with a high-fidelity "boardroom meeting" presentation!

      // Step 1: Resume Parser
      await sleep(1500);
      setCurrentStep(1);
      addLog(
        "Resume Intelligence Agent",
        "Resume Parser",
        "bg-blue-600 text-white",
        `Scanning resume of ${candidate.name}. Attempting structured extraction...`
      );
      await sleep(1200);
      addLog(
        "Resume Intelligence Agent",
        "Resume Parser",
        "bg-blue-600 text-white",
        `Parsed successfully! Extracted standard fields, ${report.parsedResume.skills.length} skills, and ${report.parsedResume.employmentHistory.length} employment periods. Schema logged below:`,
        true,
        report.parsedResume
      );

      // Step 2: Compliance Checking
      await sleep(1500);
      setCurrentStep(2);
      addLog(
        "Eligibility Verification Agent",
        "HR Compliance Officer",
        "bg-emerald-600 text-white",
        `Received parsed candidate data. Commencing strict eligibility verification against job rules...\n- Minimum Exp required: ${job.experienceRequired}\n- Required Education: ${job.educationRequired}`
      );
      await sleep(1800);

      const statusColor = report.eligibilityReport.status === "Eligible" ? "text-emerald-400" : "text-rose-400";
      addLog(
        "Eligibility Verification Agent",
        "HR Compliance Officer",
        "bg-emerald-600 text-white",
        `Eligibility decision: ${report.eligibilityReport.status.toUpperCase()}.\nReason: ${report.eligibilityReport.reason}`
      );
      addLog(
        "Eligibility Verification Agent",
        "HR Compliance Officer",
        "bg-emerald-600 text-white",
        `Compliance matrix checked. passed: ${report.eligibilityReport.passed_requirements.length}, failed: ${report.eligibilityReport.failed_requirements.length}`,
        true,
        report.eligibilityReport
      );

      if (report.eligibilityReport.status === "Rejected") {
        await sleep(1000);
        addLog(
          "CrewAI Orchestrator",
          "System",
          "bg-slate-700 text-white",
          "🛑 Candidate failed eligibility checks. Sequential multi-agent workflow aborted to save resources. Marking applicant as Rejected."
        );
        setPipelineRunning(false);
        setCurrentStep(-2); // Special status for early stop
        setTimeout(() => {
          onEvaluationComplete(report);
        }, 2000);
        return;
      }

      // Step 3: Skill Evaluator
      await sleep(1500);
      setCurrentStep(3);
      addLog(
        "Skill Assessment Agent",
        "Technical Evaluator",
        "bg-purple-600 text-white",
        `Analyzing skill profiles. Overlapping candidate keywords against Job mandatory skills: [${job.mandatorySkills}]...`
      );
      await sleep(1500);
      addLog(
        "Skill Assessment Agent",
        "Technical Evaluator",
        "bg-purple-600 text-white",
        `Finished matching. Match rating: ${report.skillMatching?.match_percentage}%. Identified matched skills: [${report.skillMatching?.matched_skills.join(", ")}].`,
        true,
        report.skillMatching
      );

      // Step 4: Senior HR Reviewer (Experience)
      await sleep(1500);
      setCurrentStep(4);
      addLog(
        "Experience Assessment Agent",
        "Senior HR Reviewer",
        "bg-amber-600 text-white",
        `Reviewing candidate professional timeline quality, technical depth, and specific projects...`
      );
      await sleep(1800);
      addLog(
        "Experience Assessment Agent",
        "Senior HR Reviewer",
        "bg-amber-600 text-white",
        `Completed review. Experience Quality Score: ${report.experienceEvaluation?.score}/100. Strengths identified: ${report.experienceEvaluation?.strengths.length}.`,
        true,
        report.experienceEvaluation
      );

      // Step 5: Talent Ranking
      await sleep(1500);
      setCurrentStep(5);
      addLog(
        "Candidate Ranking Agent",
        "Talent Ranking Specialist",
        "bg-indigo-600 text-white",
        `Ranking applicant ${candidate.name} relative to typical pool distributions...`
      );
      await sleep(1500);
      addLog(
        "Candidate Ranking Agent",
        "Talent Ranking Specialist",
        "bg-indigo-600 text-white",
        `Calculated comparative index: ${report.candidateRanking?.comparative_score}/100. Reasoning: ${report.candidateRanking?.rank_explanation}`,
        true,
        report.candidateRanking
      );

      // Step 6: Interview Questions
      await sleep(1500);
      setCurrentStep(6);
      addLog(
        "Interview Preparation Agent",
        "Technical Interviewer",
        "bg-pink-600 text-white",
        `Designing custom-tailored interviewing scripts based on missing skills: [${report.skillMatching?.missing_skills.join(", ")}] and experience record...`
      );
      await sleep(1500);
      addLog(
        "Interview Preparation Agent",
        "Technical Interviewer",
        "bg-pink-600 text-white",
        `Structured list of Easy, Medium, and Hard behavioral + technical questions compiled successfully.`,
        true,
        report.interviewQuestions
      );

      // Step 7: Hiring Manager
      await sleep(1500);
      setCurrentStep(7);
      addLog(
        "Hiring Decision Agent",
        "Hiring Manager",
        "bg-rose-600 text-white",
        `Taking the final review stand. Combining assessments to frame hiring conclusion...`
      );
      await sleep(1800);
      addLog(
        "Hiring Decision Agent",
        "Hiring Manager",
        "bg-rose-600 text-white",
        `RECOMMENDATION: ${report.hiringRecommendation?.recommendation.toUpperCase()} (Score: ${report.hiringRecommendation?.match_score}/100). Confidence: ${report.hiringRecommendation?.confidence_score}%.`,
        true,
        report.hiringRecommendation
      );

      // Step 8: HR Coordinator
      await sleep(1500);
      setCurrentStep(8);
      addLog(
        "HR Communication Agent",
        "HR Coordinator",
        "bg-teal-600 text-white",
        `Generating automated, personalized candidate communications: Invitation letter, rejection template, and offer documents...`
      );
      await sleep(1500);
      addLog(
        "HR Communication Agent",
        "HR Coordinator",
        "bg-teal-600 text-white",
        `Finished drafting templates. Prepared drafts are now ready in Candidate files.`,
        true,
        report.emails
      );

      await sleep(1000);
      addLog(
        "CrewAI Orchestrator",
        "System",
        "bg-slate-700 text-white",
        "🚀 Multi-Agent execution completed. Integrating report modules into HR database... Done."
      );

      setPipelineRunning(false);
      setTimeout(() => {
        onEvaluationComplete(report);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during multi-agent orchestration.");
      setPipelineRunning(false);
    }
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  return (
    <div id="agent-boardroom-stage" className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[700px]">
      {/* Header */}
      <div className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              CrewAI Active Boardroom <span className="text-xs bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded-full">v2.0</span>
            </h2>
            <p className="text-xs text-slate-400">
              Evaluating <span className="text-slate-200 font-semibold">{candidate.name}</span> for <span className="text-indigo-400 font-semibold">{job.title}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!pipelineRunning && currentStep === -1 && (
            <button
              id="start-pipeline-btn"
              onClick={startPipeline}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition"
            >
              <Play className="w-4 h-4" />
              <span>Convene Agents</span>
            </button>
          )}

          <button
            onClick={onCancel}
            className="px-3 py-2 text-slate-400 hover:text-white text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            disabled={pipelineRunning}
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Agents Panel */}
        <div className="w-80 bg-slate-950/60 border-r border-slate-800 p-4 overflow-y-auto hidden md:block">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Orchestrated Agents ({agents.length})</h3>
          <div className="space-y-3">
            {agents.map((agent, index) => {
              const isCurrent = currentStep === index + 1;
              const isDone = currentStep > index + 1 || currentStep === 9;
              const isSkipped = currentStep === -2 && index + 1 > 2; // Compliance rejected, rest skipped

              return (
                <div
                  key={agent.id}
                  className={`p-3 rounded-lg border transition ${
                    isCurrent
                      ? "bg-slate-800 border-indigo-500/50 shadow-md shadow-indigo-500/5"
                      : isDone
                      ? "bg-slate-900/40 border-emerald-500/30"
                      : isSkipped
                      ? "bg-slate-900/20 border-slate-800/40 opacity-40"
                      : "bg-slate-900/20 border-slate-800"
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <span className="text-xl">{agent.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-white truncate">{agent.name}</h4>
                        {isCurrent && (
                          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                        )}
                        {isDone && (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                        {isSkipped && (
                          <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </div>
                      <p className="text-[10px] text-indigo-300 font-mono mt-0.5">{agent.role}</p>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{agent.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Boardroom Terminal Logs */}
        <div className="flex-1 bg-slate-950 flex flex-col overflow-hidden">
          {/* Terminal Title */}
          <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-slate-500" />
              agent-boardroom-terminal.log
            </span>
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${pipelineRunning ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'}`} />
              {pipelineRunning ? 'PROCESSING' : 'STANDBY'}
            </span>
          </div>

          {/* Terminal Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs text-slate-300">
            {logs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <MessageSquare className="w-12 h-12 text-slate-700 mb-2" />
                <p className="text-sm">Agent discussion log is empty.</p>
                <p className="text-[11px] mt-1">Click "Convene Agents" above to start the sequential execution pipeline.</p>
              </div>
            )}

            {logs.map((log, i) => (
              <div key={i} className="flex flex-col space-y-1.5 border-l-2 border-slate-800 pl-3">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${log.avatarColor}`}>
                    {log.agentName}
                  </span>
                  <span className="text-[10px] text-indigo-400 font-semibold">[{log.role}]</span>
                  <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                </div>

                {!log.isJson ? (
                  <p className="text-slate-300 leading-relaxed whitespace-pre-line">{log.message}</p>
                ) : (
                  <div className="mt-2 bg-slate-900/80 border border-slate-800/80 rounded-lg p-3 max-w-full overflow-x-auto">
                    <pre className="text-blue-300 text-[11px]">
                      {JSON.stringify(log.jsonData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}

            {error && (
              <div className="p-3 bg-rose-950/40 border border-rose-900/50 rounded-lg text-rose-300 flex items-start space-x-2">
                <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold">Execution Error</p>
                  <p className="text-[11px] mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <div ref={terminalEndRef} />
          </div>

          {/* Prompt Simulation Box */}
          <div className="p-4 bg-slate-900/40 border-t border-slate-800/60 flex items-center space-x-3 text-xs">
            <span className="text-indigo-400 font-bold font-mono">CrewAI &gt;_</span>
            <div className="flex-1 text-slate-400 font-mono truncate">
              {pipelineRunning ? (
                <span>
                  Agent {currentStep} of 8 executing...{" "}
                  <span className="inline-block w-2 h-4 bg-indigo-400 animate-pulse align-middle ml-1" />
                </span>
              ) : currentStep === 9 ? (
                <span className="text-emerald-400 font-bold">✓ Multi-agent assessment successfully completed!</span>
              ) : currentStep === -2 ? (
                <span className="text-rose-400 font-bold">🛑 Compliance check failed. Process halted.</span>
              ) : (
                <span>Idle. Waiting to convene specialized agents...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
