import React, { useState } from "react";
import { User, Mail, Phone, Calendar, CheckCircle2, XCircle, AlertCircle, Copy, Check, FileText, Send, Save, Cpu, Sparkles, MessageSquare, ChevronDown, ChevronUp, Award, BarChart2 } from "lucide-react";
import { Candidate, Job, EvaluationReport } from "../types";

interface CandidateProfileViewProps {
  candidate: Candidate;
  job: Job;
  onRunEvaluation: () => void;
  onUpdateNotes: (candidateId: string, notes: string) => void;
  onUpdateEmails: (candidateId: string, emails: any) => void;
}

export default function CandidateProfileView({ candidate, job, onRunEvaluation, onUpdateNotes, onUpdateEmails }: CandidateProfileViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"agents" | "interview" | "emails" | "resume">("agents");
  const [recruiterNotes, setRecruiterNotes] = useState(candidate.notes || "");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const [notesSaveSuccess, setNotesSaveSuccess] = useState(false);
  const [emailsSaveSuccess, setEmailsSaveSuccess] = useState(false);

  // Email draft state
  const [invitationDraft, setInvitationDraft] = useState(candidate.report?.emails?.interview_invitation || "");
  const [rejectionDraft, setRejectionDraft] = useState(candidate.report?.emails?.rejection_email || "");
  const [offerDraft, setOfferDraft] = useState(candidate.report?.emails?.offer_letter || "");
  const [followupDraft, setFollowupDraft] = useState(candidate.report?.emails?.follow_up || "");

  const handleSaveNotes = () => {
    onUpdateNotes(candidate.id, recruiterNotes);
    setNotesSaveSuccess(true);
    setTimeout(() => setNotesSaveSuccess(false), 3000);
  };

  const handleSaveEmails = () => {
    onUpdateEmails(candidate.id, {
      interview_invitation: invitationDraft,
      rejection_email: rejectionDraft,
      offer_letter: offerDraft,
      follow_up: followupDraft,
    });
    setEmailsSaveSuccess(true);
    setTimeout(() => setEmailsSaveSuccess(false), 3000);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const report = candidate.report;

  const skillMatch = report?.skillMatching?.match_percentage || 0;
  const experienceScore = report?.experienceEvaluation?.score || 0;
  const confidenceScore = report?.hiringRecommendation?.confidence_score || 0;
  const comparativeScore = report?.candidateRanking?.comparative_score || 0;

  const weights = job.criteriaWeights || {
    skillsWeight: 30,
    experienceWeight: 25,
    educationWeight: 20,
    softSkillsWeight: 15,
    bonusWeight: 10,
  };

  const weightedScore = report?.weightedCriteriaScore || {
    skillsScore: Math.round((skillMatch / 100) * (weights.skillsWeight ?? 30)),
    skillsMax: weights.skillsWeight ?? 30,
    experienceScore: Math.round((experienceScore / 100) * (weights.experienceWeight ?? 25)),
    experienceMax: weights.experienceWeight ?? 25,
    educationScore: report?.eligibilityReport?.status === "Eligible" ? (weights.educationWeight ?? 20) : Math.round((weights.educationWeight ?? 20) * 0.4),
    educationMax: weights.educationWeight ?? 20,
    softSkillsScore: Math.round(((report?.cultureFitEvaluation?.score || 85) / 100) * (weights.softSkillsWeight ?? 15)),
    softSkillsMax: weights.softSkillsWeight ?? 15,
    bonusScore: Math.min(weights.bonusWeight ?? 10, report?.extraAttributesEvaluation?.score_bonus_awarded || 0),
    bonusMax: weights.bonusWeight ?? 10,
    totalScore: 0,
    maxTotalScore: 0,
    grade: "A" as const,
  };

  const totalScoreVal = weightedScore.totalScore || (weightedScore.skillsScore + weightedScore.experienceScore + weightedScore.educationScore + weightedScore.softSkillsScore + weightedScore.bonusScore);
  const maxTotalVal = weightedScore.maxTotalScore || (weightedScore.skillsMax + weightedScore.experienceMax + weightedScore.educationMax + weightedScore.softSkillsMax + weightedScore.bonusMax);
  const totalPct = maxTotalVal > 0 ? Math.round((totalScoreVal / maxTotalVal) * 100) : 0;

  let candidateGrade = weightedScore.grade || "B";
  if (!weightedScore.grade) {
    if (totalPct >= 92) candidateGrade = "S";
    else if (totalPct >= 82) candidateGrade = "A";
    else if (totalPct >= 72) candidateGrade = "B";
    else if (totalPct >= 62) candidateGrade = "C";
    else candidateGrade = "F";
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in text-left">
      {/* Left Column: Candidate Core Card & Notes (Cols 4) */}
      <div className="lg:col-span-4 space-y-6">
        {/* Core Metadata Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-5">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
              <User className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight font-display truncate">{candidate.name}</h2>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold mt-0.5 truncate">{job.title}</p>
            </div>
          </div>

          <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate text-slate-700 dark:text-slate-200 font-mono">{candidate.email}</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-700 dark:text-slate-200 font-mono truncate">{candidate.phone}</span>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">Target: <span className="text-slate-800 dark:text-slate-100 font-extrabold">{job.company}</span></span>
            </div>
          </div>

          {/* Status Display */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Compliance</span>
              {candidate.eligibilityStatus === "Pending" ? (
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 font-bold px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">PENDING</span>
              ) : candidate.eligibilityStatus === "Eligible" ? (
                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/40">ELIGIBLE</span>
              ) : (
                <span className="text-[10px] bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold px-2.5 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/40">REJECTED</span>
              )}
            </div>

            {report?.hiringRecommendation && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Match Rating</span>
                <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                  {report.hiringRecommendation.match_score}%
                </span>
              </div>
            )}
          </div>

          {/* Run Evaluation Button */}
          {candidate.eligibilityStatus === "Pending" && (
            <button
              id="convene-agents-btn"
              onClick={onRunEvaluation}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              <Cpu className="w-4 h-4 animate-pulse" />
              <span>Convene Multi-Agent Team</span>
            </button>
          )}
        </div>

        {/* Notes Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 font-display">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Recruiter Audit Notes
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Add custom screening comments or interviewing schedules manually.</p>
          </div>

          <textarea
            rows={5}
            value={recruiterNotes}
            onChange={(e) => setRecruiterNotes(e.target.value)}
            placeholder="Add notes..."
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none transition leading-relaxed shadow-sm font-sans"
          />

          <button
            onClick={handleSaveNotes}
            className="w-full py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Save Recruiter Notes</span>
          </button>

          {notesSaveSuccess && (
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-150 dark:border-emerald-900/40 py-2 px-3 rounded-xl text-center font-bold animate-fade-in flex items-center justify-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Notes updated and synced!</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Multi-Agent Assessment Console (Cols 8) */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6 min-h-[500px] flex flex-col justify-between min-w-0">
        {candidate.eligibilityStatus === "Pending" ? (
          // Pending Screen
          <div className="flex flex-col items-center justify-center flex-1 space-y-4 py-16 text-center">
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 animate-pulse">
              <Cpu className="w-12 h-12" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-base font-bold text-slate-900 tracking-tight font-display">Recruitment Agents Standing By</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Specialized agents (Analyst, Compliance Officer, Technical Evaluator, Senior Reviewer, talent Ranker, Interviewer, Hiring Manager, Coordinator) are configured. Run the pipeline to deconstruct and score.
              </p>
            </div>
            <button
              onClick={onRunEvaluation}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              <Cpu className="w-4 h-4 animate-pulse" />
              <span>Initiate Sequential Multi-Agent Evaluation</span>
            </button>
          </div>
        ) : (
          // Evaluated Screen
          <div className="flex flex-col flex-1">
            {/* Tab Header */}
            <div className="flex border-b border-slate-100 mb-6 overflow-x-auto pb-px">
              <button
                onClick={() => setActiveSubTab("agents")}
                className={`pb-3 text-xs font-bold px-4 tracking-tight border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeSubTab === "agents"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Multi-Agent Findings
              </button>
              {candidate.eligibilityStatus === "Eligible" && (
                <>
                  <button
                    onClick={() => setActiveSubTab("interview")}
                    className={`pb-3 text-xs font-bold px-4 tracking-tight border-b-2 transition whitespace-nowrap cursor-pointer ${
                      activeSubTab === "interview"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Interview Preparation Script
                  </button>
                  <button
                    onClick={() => {
                      setActiveSubTab("emails");
                      // Initialize drafts on tab open
                      if (!invitationDraft) {
                        setInvitationDraft(candidate.report?.emails?.interview_invitation || "");
                        setRejectionDraft(candidate.report?.emails?.rejection_email || "");
                        setOfferDraft(candidate.report?.emails?.offer_letter || "");
                        setFollowupDraft(candidate.report?.emails?.follow_up || "");
                      }
                    }}
                    className={`pb-3 text-xs font-bold px-4 tracking-tight border-b-2 transition whitespace-nowrap cursor-pointer ${
                      activeSubTab === "emails"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    HR Emails Communications
                  </button>
                </>
              )}
              <button
                onClick={() => setActiveSubTab("resume")}
                className={`pb-3 text-xs font-bold px-4 tracking-tight border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeSubTab === "resume"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Raw Resume Text
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1">
              {/* Tab 1: Agent-by-Agent Report */}
              {activeSubTab === "agents" && report && (
                <div className="space-y-6">
                  {/* Summary Card (Agent 8 decision) */}
                  {report.hiringRecommendation ? (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-indigo-50/50 to-purple-50/30 border border-indigo-100 p-5 rounded-2xl flex flex-col md:flex-row gap-5 items-start justify-between shadow-inner">
                        <div className="space-y-2 text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-150 font-mono tracking-wider px-2.5 py-0.5 rounded-full uppercase">Hiring Manager Decision</span>
                            <span className="text-slate-400 font-mono text-[10px]">Confidence: {report.hiringRecommendation.confidence_score}%</span>
                          </div>
                          <h3 className="text-base font-extrabold text-slate-900 leading-tight font-display">
                            Final Assessment Recommendation:{" "}
                            <span className={`font-mono ${
                              report.hiringRecommendation.recommendation === "Strong Hire" ? "text-emerald-600" :
                              report.hiringRecommendation.recommendation === "Hire" ? "text-indigo-600" :
                              report.hiringRecommendation.recommendation === "Consider" ? "text-amber-600" : "text-rose-600"
                            }`}>
                              {report.hiringRecommendation.recommendation}
                            </span>
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed font-sans mt-2 font-medium">{report.hiringRecommendation.final_reasoning}</p>
                        </div>

                        <div className="bg-white border border-indigo-100 p-4 rounded-xl text-center min-w-[120px] self-stretch flex flex-col justify-center shadow-sm shrink-0">
                          <span className="text-3xl font-extrabold text-indigo-600 font-mono tracking-tight">{report.hiringRecommendation.match_score}%</span>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">ALIGNMENT INDEX</p>
                        </div>
                      </div>

                      {/* Threshold warning block */}
                      {report.hiringRecommendation.match_score < (job.thresholdScore !== undefined ? job.thresholdScore : 70) && (
                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex gap-3 text-left animate-fade-in">
                          <XCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider font-mono">Passing Score Threshold Breached</span>
                            <p className="text-xs text-rose-700 font-medium">This candidate's score (<strong className="font-extrabold">{report.hiringRecommendation.match_score}%</strong>) is lower than your configured job passing threshold of <strong className="font-extrabold">{job.thresholdScore !== undefined ? job.thresholdScore : 70}%</strong>. Consider rejecting or placing them on the secondary waitlist.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-rose-50 border border-rose-150 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
                      <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-rose-950">Compliance Check Halted: Candidate Rejected</h3>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {report.eligibilityReport.reason}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Intelligent Criteria Requirement Marks Matrix Card */}
                  {report.eligibilityReport.status === "Eligible" && (
                    <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 shadow-md space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-sm font-bold text-white tracking-tight font-display">
                              Weighted Requirement Marks Scorecard
                            </h3>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              candidateGrade === 'S' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                              candidateGrade === 'A' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                              candidateGrade === 'B' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' :
                              'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`}>
                              Grade {candidateGrade}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Evaluated against recruiter's custom assigned criteria marks for this job advertisement
                          </p>
                        </div>

                        <div className="bg-indigo-950/80 border border-indigo-800/80 px-3.5 py-2 rounded-xl text-right shrink-0">
                          <span className="text-xs font-mono text-slate-400 font-medium">Awarded Marks: </span>
                          <span className="text-lg font-mono font-extrabold text-indigo-300">
                            {totalScoreVal} <span className="text-xs text-slate-400">/ {maxTotalVal}</span>
                          </span>
                          <div className="text-[10px] font-mono text-emerald-400 font-bold">
                            ({totalPct}% Cumulative Score)
                          </div>
                        </div>
                      </div>

                      {/* 5 Marks Breakdown Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {/* Skills */}
                        <div className="bg-slate-800/70 border border-slate-700/80 p-3 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                            <span>Skills Criteria</span>
                            <span className="font-mono font-bold text-indigo-300">
                              {weightedScore.skillsScore} / {weightedScore.skillsMax} Marks
                            </span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                              style={{ width: `${weightedScore.skillsMax > 0 ? (weightedScore.skillsScore / weightedScore.skillsMax) * 100 : 0}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-slate-400 font-mono">
                            {Math.round(weightedScore.skillsMax > 0 ? (weightedScore.skillsScore / weightedScore.skillsMax) * 100 : 0)}% Section Score
                          </p>
                        </div>

                        {/* Experience */}
                        <div className="bg-slate-800/70 border border-slate-700/80 p-3 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                            <span>Experience Criteria</span>
                            <span className="font-mono font-bold text-teal-300">
                              {weightedScore.experienceScore} / {weightedScore.experienceMax} Marks
                            </span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full transition-all duration-500"
                              style={{ width: `${weightedScore.experienceMax > 0 ? (weightedScore.experienceScore / weightedScore.experienceMax) * 100 : 0}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-slate-400 font-mono">
                            {Math.round(weightedScore.experienceMax > 0 ? (weightedScore.experienceScore / weightedScore.experienceMax) * 100 : 0)}% Section Score
                          </p>
                        </div>

                        {/* Education */}
                        <div className="bg-slate-800/70 border border-slate-700/80 p-3 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                            <span>Education Criteria</span>
                            <span className="font-mono font-bold text-blue-300">
                              {weightedScore.educationScore} / {weightedScore.educationMax} Marks
                            </span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${weightedScore.educationMax > 0 ? (weightedScore.educationScore / weightedScore.educationMax) * 100 : 0}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-slate-400 font-mono">
                            {Math.round(weightedScore.educationMax > 0 ? (weightedScore.educationScore / weightedScore.educationMax) * 100 : 0)}% Section Score
                          </p>
                        </div>

                        {/* Culture & Soft Skills */}
                        <div className="bg-slate-800/70 border border-slate-700/80 p-3 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                            <span>Culture & Soft Skills</span>
                            <span className="font-mono font-bold text-purple-300">
                              {weightedScore.softSkillsScore} / {weightedScore.softSkillsMax} Marks
                            </span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full transition-all duration-500"
                              style={{ width: `${weightedScore.softSkillsMax > 0 ? (weightedScore.softSkillsScore / weightedScore.softSkillsMax) * 100 : 0}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-slate-400 font-mono">
                            {Math.round(weightedScore.softSkillsMax > 0 ? (weightedScore.softSkillsScore / weightedScore.softSkillsMax) * 100 : 0)}% Section Score
                          </p>
                        </div>

                        {/* Bonus Attributes */}
                        <div className="bg-slate-800/70 border border-slate-700/80 p-3 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                            <span>Bonus Attributes</span>
                            <span className="font-mono font-bold text-amber-300">
                              {weightedScore.bonusScore} / {weightedScore.bonusMax} Marks
                            </span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all duration-500"
                              style={{ width: `${weightedScore.bonusMax > 0 ? (weightedScore.bonusScore / weightedScore.bonusMax) * 100 : 0}%` }}
                            />
                          </div>
                          <p className="text-[9px] text-slate-400 font-mono">
                            {Math.round(weightedScore.bonusMax > 0 ? (weightedScore.bonusScore / weightedScore.bonusMax) * 100 : 0)}% Section Score
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Talent Footprint Alignment Index */}
                  {report.eligibilityReport.status === "Eligible" && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5 font-display">
                            <Sparkles className="w-4 h-4 text-indigo-600" /> Talent Footprint Alignment Index
                          </h3>
                          <p className="text-[11px] text-slate-400">Multi-agent competency scores extracted across key recruitment assessment dimensions</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Metric 1 */}
                        <div className="space-y-1.5 bg-slate-50/40 border border-slate-100 p-3.5 rounded-xl transition hover:border-slate-200">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-700">Domain Expertise (Skills)</span>
                            <span className="font-mono font-extrabold text-emerald-600">{skillMatch}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                              style={{ width: `${skillMatch}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">Evaluated by Agent 4 (Technical Skills Specialist)</p>
                        </div>

                        {/* Metric 2 */}
                        <div className="space-y-1.5 bg-slate-50/40 border border-slate-100 p-3.5 rounded-xl transition hover:border-slate-200">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-700">Experience Alignment</span>
                            <span className="font-mono font-extrabold text-indigo-600">{experienceScore}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                              style={{ width: `${experienceScore}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">Evaluated by Agent 5 (Senior HR Auditor)</p>
                        </div>

                        {/* Metric 3 */}
                        <div className="space-y-1.5 bg-slate-50/40 border border-slate-100 p-3.5 rounded-xl transition hover:border-slate-200">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-700">Cultural Fit Alignment</span>
                            <span className="font-mono font-extrabold text-cyan-600">{report.cultureFitEvaluation?.score || 85}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
                              style={{ width: `${report.cultureFitEvaluation?.score || 85}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">Evaluated by Agent 10 (Culture Fit Specialist)</p>
                        </div>

                        {/* Metric 4 */}
                        <div className="space-y-1.5 bg-slate-50/40 border border-slate-100 p-3.5 rounded-xl transition hover:border-slate-200">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-700">Custom Attribute Bonus</span>
                            <span className="font-mono font-extrabold text-orange-600">+{report.extraAttributesEvaluation?.score_bonus_awarded || 0} pts</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                              style={{ width: `${Math.min(100, ((report.extraAttributesEvaluation?.score_bonus_awarded || 0) / 15) * 100)}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">Evaluated by Agent 11 (Bonus Evaluator Specialist)</p>
                        </div>

                        {/* Metric 5 */}
                        <div className="space-y-1.5 bg-slate-50/40 border border-slate-100 p-3.5 rounded-xl transition hover:border-slate-200">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-700">Comparative Talent Rank</span>
                            <span className="font-mono font-extrabold text-pink-600">{comparativeScore}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                              style={{ width: `${comparativeScore}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">Evaluated by Agent 6 (Candidate Talent Pool Ranker)</p>
                        </div>

                        {/* Metric 6 */}
                        <div className="space-y-1.5 bg-slate-50/40 border border-slate-100 p-3.5 rounded-xl transition hover:border-slate-200">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-700">Hiring Decision Confidence</span>
                            <span className="font-mono font-extrabold text-purple-600">{confidenceScore}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                              style={{ width: `${confidenceScore}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">Evaluated by Agent 8 (Hiring Decision Manager)</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Agent Collapsible Sections */}
                  <div className="space-y-4">
                    {/* Agent 3: Compliance */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40">
                      <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5 font-display">
                          <span className="text-base">⚖️</span> Agent 3: Eligibility Verification (HR Compliance)
                        </span>
                        <span className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          report.eligibilityReport.status === "Eligible" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                        }`}>
                          {report.eligibilityReport.status}
                        </span>
                      </div>
                      <div className="p-4 space-y-3 text-xs leading-relaxed">
                        <p className="text-slate-600 font-medium"><span className="text-slate-400 font-bold font-mono uppercase tracking-wider text-[9px] mr-1">Reasoning:</span> {report.eligibilityReport.reason}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Passed Limits</span>
                            <ul className="space-y-1 list-disc pl-4 text-slate-500 font-medium text-[11px]">
                              {report.eligibilityReport.passed_requirements.map((p, idx) => <li key={idx}>{p}</li>)}
                            </ul>
                          </div>
                          {report.eligibilityReport.failed_requirements.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Failed Limits</span>
                              <ul className="space-y-1 list-disc pl-4 text-slate-500 font-medium text-[11px]">
                                {report.eligibilityReport.failed_requirements.map((f, idx) => <li key={idx}>{f}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Agent 4 & 5: Skills & Experience */}
                    {report.skillMatching && report.experienceEvaluation && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Agent 4: Skill Evaluator */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40 text-xs shadow-sm">
                          <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
                            <span className="font-bold text-slate-900 flex items-center gap-1 font-display">
                              <span className="text-sm">🧠</span> Agent 4: Technical Skills assessment
                            </span>
                            <span className="text-indigo-600 font-mono font-bold">{report.skillMatching.match_percentage}%</span>
                          </div>
                          <div className="p-3.5 space-y-3.5 text-left">
                            <div>
                              <span className="text-[9px] text-emerald-600 font-bold uppercase block mb-1">Matched Skills</span>
                              <div className="flex flex-wrap gap-1">
                                {report.skillMatching.matched_skills.map((s, idx) => (
                                  <span key={idx} className="bg-white text-emerald-800 border border-emerald-100 font-mono text-[10px] px-2 py-0.5 rounded shadow-sm">{s}</span>
                                ))}
                              </div>
                            </div>
                            {report.skillMatching.missing_skills.length > 0 && (
                              <div>
                                <span className="text-[9px] text-rose-600 font-bold uppercase block mb-1">Missing Skills</span>
                                <div className="flex flex-wrap gap-1">
                                  {report.skillMatching.missing_skills.map((s, idx) => (
                                    <span key={idx} className="bg-white text-rose-800 border border-rose-100 font-mono text-[10px] px-2 py-0.5 rounded shadow-sm">{s}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {report.skillMatching.additional_skills.length > 0 && (
                              <div>
                                <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Additional Skills</span>
                                <div className="flex flex-wrap gap-1">
                                  {report.skillMatching.additional_skills.map((s, idx) => (
                                    <span key={idx} className="bg-white text-slate-700 border border-slate-200 font-mono text-[10px] px-2 py-0.5 rounded shadow-sm">{s}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Agent 5: Experience Auditor */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40 text-xs shadow-sm">
                          <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
                            <span className="font-bold text-slate-900 flex items-center gap-1 font-display">
                              <span className="text-sm">👔</span> Agent 5: Experience Review
                            </span>
                            <span className="text-amber-600 font-mono font-bold">{report.experienceEvaluation.score}/100</span>
                          </div>
                          <div className="p-3.5 space-y-3 text-left">
                            <div className="space-y-1">
                              <span className="text-[9px] text-indigo-600 font-bold uppercase block">Core Strengths</span>
                              <ul className="list-disc pl-4 text-[11px] text-slate-500 font-medium space-y-0.5">
                                {report.experienceEvaluation.strengths.slice(0, 2).map((s, idx) => <li key={idx}>{s}</li>)}
                              </ul>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] text-amber-600 font-bold uppercase block">Recommendations</span>
                              <ul className="list-disc pl-4 text-[11px] text-slate-500 font-medium space-y-0.5">
                                {report.experienceEvaluation.recommendations.slice(0, 2).map((s, idx) => <li key={idx}>{s}</li>)}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Agent 6: Ranking Agent */}
                    {report.candidateRanking && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40 text-xs shadow-sm">
                        <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5 font-display">
                            <span className="text-base">📈</span> Agent 6: Candidate Talent Pool Ranking
                          </span>
                          <span className="text-indigo-600 font-mono font-bold">Index: {report.candidateRanking.comparative_score}/100</span>
                        </div>
                        <div className="p-4 leading-relaxed text-slate-600 text-xs font-mono bg-white font-semibold">
                          {report.candidateRanking.rank_explanation}
                        </div>
                      </div>
                    )}

                    {/* Agent 10: Culture Fit Specialist */}
                    {report.cultureFitEvaluation && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40 text-xs shadow-sm">
                        <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5 font-display">
                            <span className="text-base">🤝</span> Agent 10: Cultural Fit & Soft Skills Review
                          </span>
                          <span className="text-cyan-600 font-mono font-bold">Fit Score: {report.cultureFitEvaluation.score}/100</span>
                        </div>
                        <div className="p-4 space-y-3 bg-white">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] text-cyan-600 font-bold uppercase block mb-1">Soft Skills & Cultural Strengths</span>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {report.cultureFitEvaluation.soft_skills_match.map((skill, idx) => (
                                  <span key={idx} className="bg-cyan-50 text-cyan-800 border border-cyan-100 font-mono text-[10px] px-2 py-1 rounded shadow-sm">✓ {skill}</span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Emotional Intelligence & Team Alignment</span>
                              <p className="text-xs text-slate-600 leading-relaxed font-medium mt-1">{report.cultureFitEvaluation.alignment_reasons[0] || "Exhibits excellent communications, adaptive teamwork principles, and proactive technical execution."}</p>
                            </div>
                          </div>
                          
                          {report.cultureFitEvaluation.alignment_reasons.length > 1 && (
                            <div className="border-t border-slate-100 pt-3 mt-2">
                              <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Detailed Culture Assessment Commentary:</span>
                              <ul className="list-disc pl-4 text-slate-500 font-medium space-y-1 text-[11px]">
                                {report.cultureFitEvaluation.alignment_reasons.slice(1).map((reason, idx) => (
                                  <li key={idx}>{reason}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Agent 11: Bonus Evaluator Specialist */}
                    {report.extraAttributesEvaluation && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40 text-xs shadow-sm">
                        <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5 font-display">
                            <span className="text-base">🏅</span> Agent 11: Extra Attributes & Bonus points Scanner
                          </span>
                          <span className="text-orange-600 font-mono font-bold">Awarded: +{report.extraAttributesEvaluation.score_bonus_awarded} pts</span>
                        </div>
                        <div className="p-4 space-y-3 bg-white text-left">
                          <span className="text-[10px] text-orange-600 font-bold uppercase block mb-1">Recruiter Custom Attribute Evaluation</span>
                          {report.extraAttributesEvaluation.attributes_found && report.extraAttributesEvaluation.attributes_found.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-xs text-slate-600 font-medium leading-relaxed">Agent 11 scanned the candidate's professional resume files and successfully verified the following recruiter custom traits / qualifications:</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                {report.extraAttributesEvaluation.attributes_found.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-orange-50/50 border border-orange-100 rounded-lg p-2.5 font-sans">
                                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                                      {item.attribute}
                                    </span>
                                    <div className="text-right">
                                      <span className="bg-orange-100 text-orange-800 font-bold font-mono text-[10px] px-2 py-0.5 rounded">+{item.points} pts</span>
                                      <span className="block text-[8px] text-slate-400 mt-0.5 font-medium italic">{item.evidence}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 font-semibold italic">No custom recruiter attributes or optional high-bonus items were detected in this resume. Baseline scores were preserved with zero bonus additions.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Interview questions */}
              {activeSubTab === "interview" && report?.interviewQuestions && (
                <div className="space-y-5 text-xs text-left">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 font-display">Custom Interview Prep Script</h3>
                    <p className="text-[11px] text-slate-400">Custom tailored Easy, Medium, and Hard behavioral + technical questions drafted by Agent 7 based on candidate skill gaps.</p>
                  </div>

                  <div className="space-y-4">
                    {/* Easy */}
                    <div className="bg-slate-50/50 p-4 border border-slate-200/80 rounded-xl space-y-2">
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold font-mono px-2 py-0.5 rounded-full uppercase">Level: Easy / Warm-up</span>
                      <div className="space-y-3 pt-1">
                        {report.interviewQuestions.easy.map((q, idx) => (
                          <div key={idx} className="flex justify-between items-start gap-4">
                            <p className="text-slate-600 font-sans font-medium leading-relaxed">{idx + 1}. {q}</p>
                            <button
                              onClick={() => handleCopyText(q, `e-${idx}`)}
                              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                            >
                              {copiedIndex === `e-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Medium */}
                    <div className="bg-slate-50/50 p-4 border border-slate-200/80 rounded-xl space-y-2">
                      <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold font-mono px-2 py-0.5 rounded-full uppercase">Level: Medium / Tactical</span>
                      <div className="space-y-3 pt-1">
                        {report.interviewQuestions.medium.map((q, idx) => (
                          <div key={idx} className="flex justify-between items-start gap-4">
                            <p className="text-slate-600 font-sans font-medium leading-relaxed">{idx + 1}. {q}</p>
                            <button
                              onClick={() => handleCopyText(q, `m-${idx}`)}
                              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                            >
                              {copiedIndex === `m-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Hard */}
                    <div className="bg-slate-50/50 p-4 border border-slate-200/80 rounded-xl space-y-2">
                      <span className="text-[9px] bg-purple-50 text-purple-700 border border-purple-100 font-bold font-mono px-2 py-0.5 rounded-full uppercase">Level: Hard / Deep Architecture</span>
                      <div className="space-y-3 pt-1">
                        {report.interviewQuestions.hard.map((q, idx) => (
                          <div key={idx} className="flex justify-between items-start gap-4">
                            <p className="text-slate-600 font-sans font-medium leading-relaxed">{idx + 1}. {q}</p>
                            <button
                              onClick={() => handleCopyText(q, `h-${idx}`)}
                              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                            >
                              {copiedIndex === `h-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: HR Emails Drafts */}
              {activeSubTab === "emails" && report?.emails && (
                <div className="space-y-6 text-xs text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 font-display">Editable HR Candidate Emails</h3>
                      <p className="text-[11px] text-slate-400 font-medium">Formulated by Agent 9 (Coordinator). Modify them here to fit corporate brand tones, then save.</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {emailsSaveSuccess && (
                        <span className="text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-150 px-3 py-1.5 rounded-xl font-bold animate-fade-in flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Saved successfully
                        </span>
                      )}
                      <button
                        onClick={handleSaveEmails}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Modified Drafts
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email 1: Invitation */}
                    <div className="bg-slate-50/50 p-4 border border-slate-200/80 rounded-xl flex flex-col justify-between shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold text-indigo-600 font-mono uppercase">1. Interview Invitation</span>
                        <button onClick={() => handleCopyText(invitationDraft, "e1")} className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer">
                          {copiedIndex === "e1" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <textarea
                        rows={10}
                        value={invitationDraft}
                        onChange={(e) => setInvitationDraft(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded p-2 text-[11px] text-slate-700 font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Email 2: Offer Letter */}
                    <div className="bg-slate-50/50 p-4 border border-slate-200/80 rounded-xl flex flex-col justify-between shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold text-indigo-600 font-mono uppercase">2. Formal Offer Letter</span>
                        <button onClick={() => handleCopyText(offerDraft, "e2")} className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer">
                          {copiedIndex === "e2" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <textarea
                        rows={10}
                        value={offerDraft}
                        onChange={(e) => setOfferDraft(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded p-2 text-[11px] text-slate-700 font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Email 3: Rejection */}
                    <div className="bg-slate-50/50 p-4 border border-slate-200/80 rounded-xl flex flex-col justify-between shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold text-rose-600 font-mono uppercase">3. Rejection Template</span>
                        <button onClick={() => handleCopyText(rejectionDraft, "e3")} className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer">
                          {copiedIndex === "e3" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <textarea
                        rows={8}
                        value={rejectionDraft}
                        onChange={(e) => setRejectionDraft(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded p-2 text-[11px] text-slate-700 font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Email 4: Follow up */}
                    <div className="bg-slate-50/50 p-4 border border-slate-200/80 rounded-xl flex flex-col justify-between shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold text-indigo-600 font-mono uppercase">4. Follow-up Letter</span>
                        <button onClick={() => handleCopyText(followupDraft, "e4")} className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer">
                          {copiedIndex === "e4" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <textarea
                        rows={8}
                        value={followupDraft}
                        onChange={(e) => setFollowupDraft(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded p-2 text-[11px] text-slate-700 font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Raw Resume View */}
              {activeSubTab === "resume" && (
                <div className="bg-slate-50/50 border border-slate-200 p-5 rounded-xl text-left max-h-[500px] overflow-y-auto shadow-inner">
                  <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap leading-relaxed font-semibold">
                    {candidate.resumeText}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
