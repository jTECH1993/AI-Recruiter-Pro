import React from "react";
import { Briefcase, Users, CheckCircle, XCircle, FileSpreadsheet, Calendar, TrendingUp, BarChart2, Star, ShieldAlert } from "lucide-react";
import { Job, Candidate } from "../types";

interface DashboardProps {
  jobs: Job[];
  candidates: Candidate[];
  onNavigate: (tab: string) => void;
  onSelectJob: (job: Job) => void;
}

export default function Dashboard({ jobs, candidates, onNavigate, onSelectJob }: DashboardProps) {
  // Compute analytics metrics
  const totalJobs = jobs.length;
  const totalApplicants = candidates.length;
  const eligibleCandidates = candidates.filter((c) => c.eligibilityStatus === "Eligible").length;
  const rejectedCandidates = candidates.filter((c) => c.eligibilityStatus === "Rejected").length;
  const pendingCandidates = candidates.filter((c) => c.eligibilityStatus === "Pending").length;

  const evaluatedCandidates = candidates.filter((c) => c.matchScore > 0);
  const avgMatchScore = evaluatedCandidates.length > 0
    ? Math.round(evaluatedCandidates.reduce((acc, c) => acc + c.matchScore, 0) / evaluatedCandidates.length)
    : 0;

  const strongHiresCount = candidates.filter(
    (c) => c.report?.hiringRecommendation?.recommendation === "Strong Hire"
  ).length;

  // Compute skill frequencies (Top matched & Top missing)
  const skillMatchMap: Record<string, number> = {};
  const skillMissingMap: Record<string, number> = {};

  candidates.forEach((c) => {
    if (c.report?.skillMatching) {
      c.report.skillMatching.matched_skills.forEach((skill) => {
        skillMatchMap[skill] = (skillMatchMap[skill] || 0) + 1;
      });
      c.report.skillMatching.missing_skills.forEach((skill) => {
        skillMissingMap[skill] = (skillMissingMap[skill] || 0) + 1;
      });
    }
  });

  const topMatchedSkills = Object.entries(skillMatchMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const topMissingSkills = Object.entries(skillMissingMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Experience distributions
  const expGroups = {
    junior: 0, // < 3 years
    mid: 0,    // 3 - 5 years
    senior: 0, // 5+ years
  };

  candidates.forEach((c) => {
    if (c.report?.parsedResume) {
      const expText = c.report.parsedResume.experience.join(" ").toLowerCase();
      const hasFivePlus = expText.includes("5+") || expText.includes("6") || expText.includes("7") || expText.includes("8") || expText.includes("senior");
      const hasThreePlus = expText.includes("3") || expText.includes("4");

      if (hasFivePlus) expGroups.senior += 1;
      else if (hasThreePlus) expGroups.mid += 1;
      else expGroups.junior += 1;
    }
  });

  return (
    <div id="dashboard-tab" className="space-y-8 animate-fade-in text-left">
      {/* Banner */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
        <div className="space-y-2 max-w-xl text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">
            Recruitment AI Agent Hub
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            Welcome to AI Recruiter Pro. Leverage a synchronized multi-agent team powered by Gemini to deconstruct requirements, verify eligibility, audit work experience, and rank candidates with perfect transparency.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => onNavigate("jobs")}
            className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            Manage Jobs
          </button>
          <button
            onClick={() => onNavigate("upload")}
            className="px-4.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-750 rounded-xl transition cursor-pointer"
          >
            Upload CV & Screen
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Stat 1 */}
        <div
          onClick={() => onNavigate("jobs")}
          className="bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md hover:bg-slate-50/50 rounded-xl p-4 flex items-center space-x-3.5 shadow-sm cursor-pointer transition duration-200 active:scale-95"
        >
          <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Jobs</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5 font-display">{totalJobs}</p>
          </div>
        </div>

        {/* Stat 2 */}
        <div
          onClick={() => onNavigate("candidates")}
          className="bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md hover:bg-slate-50/50 rounded-xl p-4 flex items-center space-x-3.5 shadow-sm cursor-pointer transition duration-200 active:scale-95"
        >
          <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Applicants</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5 font-display">{totalApplicants}</p>
          </div>
        </div>

        {/* Stat 3 */}
        <div
          onClick={() => onNavigate("candidates")}
          className="bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md hover:bg-slate-50/50 rounded-xl p-4 flex items-center space-x-3.5 shadow-sm cursor-pointer transition duration-200 active:scale-95"
        >
          <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Eligible</p>
            <p className="text-xl font-extrabold text-emerald-600 mt-0.5 font-display">{eligibleCandidates}</p>
          </div>
        </div>

        {/* Stat 4 */}
        <div
          onClick={() => onNavigate("candidates")}
          className="bg-white border border-slate-200 hover:border-rose-400 hover:shadow-md hover:bg-slate-50/50 rounded-xl p-4 flex items-center space-x-3.5 shadow-sm cursor-pointer transition duration-200 active:scale-95"
        >
          <div className="p-2.5 bg-rose-50 rounded-lg text-rose-600">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rejected</p>
            <p className="text-xl font-extrabold text-rose-600 mt-0.5 font-display">{rejectedCandidates}</p>
          </div>
        </div>

        {/* Stat 5 */}
        <div
          onClick={() => onNavigate("candidates")}
          className="bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md hover:bg-slate-50/50 rounded-xl p-4 flex items-center space-x-3.5 shadow-sm cursor-pointer transition duration-200 active:scale-95"
        >
          <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Score</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5 font-display">{avgMatchScore}%</p>
          </div>
        </div>

        {/* Stat 6 */}
        <div
          onClick={() => onNavigate("candidates")}
          className="bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md hover:bg-slate-50/50 rounded-xl p-4 flex items-center space-x-3.5 shadow-sm cursor-pointer transition duration-200 active:scale-95"
        >
          <div className="p-2.5 bg-purple-50 rounded-lg text-purple-600">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Strong Hire</p>
            <p className="text-xl font-extrabold text-purple-600 mt-0.5 font-display">{strongHiresCount}</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Hiring Funnel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5 mb-1 font-display">
              <BarChart2 className="w-4 h-4 text-indigo-600" /> Hiring Funnel
            </h3>
            <p className="text-xs text-slate-400">Applicant conversions from ingestion to offer</p>
          </div>

          <div className="my-6 space-y-4">
            {/* Funnel Level 1 */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span className="font-medium">1. Ingested Applications</span>
                <span className="font-bold text-slate-900">{totalApplicants}</span>
              </div>
              <div className="h-6 bg-slate-100 rounded-md overflow-hidden relative border border-slate-200/50">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-r"
                  style={{ width: totalApplicants > 0 ? "100%" : "0%" }}
                />
              </div>
            </div>

            {/* Funnel Level 2 */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span className="font-medium">2. Eligible Candidates</span>
                <span className="font-bold text-emerald-600">{eligibleCandidates}</span>
              </div>
              <div className="h-6 bg-slate-100 rounded-md overflow-hidden relative border border-slate-200/50">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-r"
                  style={{ width: totalApplicants > 0 ? `${(eligibleCandidates / totalApplicants) * 100}%` : "0%" }}
                />
              </div>
            </div>

            {/* Funnel Level 3 */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span className="font-medium">3. Recommended / Strong Hire</span>
                <span className="font-bold text-purple-600">{strongHiresCount}</span>
              </div>
              <div className="h-6 bg-slate-100 rounded-md overflow-hidden relative border border-slate-200/50">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-purple-600 rounded-r"
                  style={{ width: totalApplicants > 0 ? `${(strongHiresCount / totalApplicants) * 100}%` : "0%" }}
                />
              </div>
            </div>
          </div>
          <p className="text-[10px] text-center text-slate-400 font-medium">
            Eligibility checked by <span className="text-indigo-600 font-semibold">Agent 3 (Compliance Officer)</span>
          </p>
        </div>

        {/* Chart 2: Average Match Score Gauge */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-between shadow-sm">
          <div className="w-full text-left">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5 mb-1 font-display">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Avg Match Score
            </h3>
            <p className="text-xs text-slate-400">Aggregate matching quality index of candidates</p>
          </div>

          <div className="relative my-4 flex items-center justify-center">
            {/* SVG Arc Gauge */}
            <svg className="w-44 h-24" viewBox="0 0 100 50">
              {/* Background Arc */}
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* Active Progress Arc */}
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="url(#matchGradLight)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 - (125.6 * avgMatchScore) / 100}
              />
              <defs>
                <linearGradient id="matchGradLight" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute bottom-1 text-center">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">{avgMatchScore}%</span>
              <p className="text-[9px] font-bold text-emerald-600 tracking-wider uppercase mt-1">HEALTHY ALIGNMENT</p>
            </div>
          </div>

          <div className="w-full grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Pending</p>
              <p className="text-sm font-bold text-slate-600 mt-0.5">{pendingCandidates}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Eligible</p>
              <p className="text-sm font-bold text-emerald-600 mt-0.5">{eligibleCandidates}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Rejected</p>
              <p className="text-sm font-bold text-rose-500 mt-0.5">{rejectedCandidates}</p>
            </div>
          </div>
        </div>

        {/* Chart 3: Skills Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5 mb-1 font-display">
              <Star className="w-4 h-4 text-purple-600" /> Skills Alignment
            </h3>
            <p className="text-xs text-slate-400">Frequency of matched vs missing candidate skills</p>
          </div>

          <div className="my-4 space-y-4 flex-1">
            {/* Top Matched Skills */}
            <div>
              <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Top Matched Skills</h4>
              {topMatchedSkills.length === 0 ? (
                <p className="text-[11px] text-slate-400 font-medium">No data. Evaluate candidates to populate metrics.</p>
              ) : (
                <div className="space-y-1.5">
                  {topMatchedSkills.map(([skill, count]) => (
                    <div key={skill} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-mono font-medium">{skill}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full"
                            style={{ width: `${(count / totalApplicants) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold font-mono">{count} applicants</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Missing Skills */}
            <div>
              <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-2">Top Missing Skills</h4>
              {topMissingSkills.length === 0 ? (
                <p className="text-[11px] text-slate-400 font-medium">No data. Evaluate candidates to populate metrics.</p>
              ) : (
                <div className="space-y-1.5">
                  {topMissingSkills.map(([skill, count]) => (
                    <div key={skill} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-mono font-medium">{skill}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-rose-500 h-full"
                            style={{ width: `${(count / totalApplicants) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold font-mono">{count} applicants</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Active Job Postings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight font-display">Active Job Opportunities</h2>
          <button
            onClick={() => onNavigate("jobs")}
            className="text-xs text-indigo-600 hover:text-indigo-500 font-bold"
          >
            View all jobs →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.slice(0, 4).map((job) => {
            const jobCandidates = candidates.filter((c) => c.jobId === job.id);
            const reviewed = jobCandidates.filter((c) => c.matchScore > 0).length;

            return (
              <div
                key={job.id}
                onClick={() => {
                  onSelectJob(job);
                  onNavigate("candidates");
                }}
                className="bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-slate-300 p-5 rounded-2xl cursor-pointer transition duration-200 flex justify-between items-start group shadow-sm hover:shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition font-display">
                      {job.title}
                    </h3>
                    <span className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-2.5 py-0.5 rounded-full font-bold font-mono">
                      {job.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold">
                    {job.company} • {job.location}
                  </p>
                  <p className="text-xs text-slate-400 font-mono mt-2">
                    Required Exp: {job.experienceRequired}
                  </p>
                </div>

                <div className="text-right flex flex-col justify-between h-full space-y-4 shrink-0">
                  <span className="text-xs font-mono font-bold text-indigo-600">{job.salaryRange}</span>
                  <div className="text-xs text-slate-400 font-semibold">
                    <span className="text-slate-900 font-extrabold">{jobCandidates.length}</span> Applicants
                    <span className="mx-1">•</span>
                    <span className="text-emerald-600 font-extrabold">{reviewed}</span> Evaluated
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
