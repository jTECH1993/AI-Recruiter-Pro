import React from "react";
import { Briefcase, Users, CheckCircle, XCircle, FileSpreadsheet, Calendar, TrendingUp, BarChart2, Star, ShieldAlert } from "lucide-react";
import { Job, Candidate } from "../types";
import { JtechBrandBanner, JtechLogo } from "./BrandingLogo";

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
        <div className="space-y-3 max-w-xl text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="text-[10px] font-mono tracking-widest text-indigo-400 font-bold uppercase bg-indigo-950/80 px-2.5 py-1 rounded-md border border-indigo-500/30">
              Enterprise Recruiting Hub
            </span>
            <JtechBrandBanner />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">
            Recruitment AI Agent Hub
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            Welcome to AI Recruiter Pro. Leverage a synchronized multi-agent team powered by Groq LLaMA 3.3 to deconstruct requirements, verify eligibility, audit work experience, and rank candidates with perfect transparency.
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
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-xl p-4 flex items-center space-x-3.5 shadow-sm cursor-pointer transition duration-200 active:scale-95"
        >
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Jobs</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 font-display">{totalJobs}</p>
          </div>
        </div>

        {/* Stat 2 */}
        <div
          onClick={() => onNavigate("candidates")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-xl p-4 flex items-center space-x-3.5 shadow-sm cursor-pointer transition duration-200 active:scale-95"
        >
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Applicants</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 font-display">{totalApplicants}</p>
          </div>
        </div>

        {/* Stat 3 */}
        <div
          onClick={() => onNavigate("candidates")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-xl p-4 flex items-center space-x-3.5 shadow-sm cursor-pointer transition duration-200 active:scale-95"
        >
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Eligible</p>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 font-display">{eligibleCandidates}</p>
          </div>
        </div>

        {/* Stat 4 */}
        <div
          onClick={() => onNavigate("candidates")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-md hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-xl p-4 flex items-center space-x-3.5 shadow-sm cursor-pointer transition duration-200 active:scale-95"
        >
          <div className="p-2.5 bg-rose-50 dark:bg-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Rejected</p>
            <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5 font-display">{rejectedCandidates}</p>
          </div>
        </div>

        {/* Stat 5 */}
        <div
          onClick={() => onNavigate("candidates")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-md hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-xl p-4 flex items-center space-x-3.5 shadow-sm cursor-pointer transition duration-200 active:scale-95"
        >
          <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg Score</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 font-display">{avgMatchScore}%</p>
          </div>
        </div>

        {/* Stat 6 */}
        <div
          onClick={() => onNavigate("candidates")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-xl p-4 flex items-center space-x-3.5 shadow-sm cursor-pointer transition duration-200 active:scale-95"
        >
          <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Strong Hire</p>
            <p className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-0.5 font-display">{strongHiresCount}</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Hiring Funnel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 mb-1 font-display">
              <BarChart2 className="w-4 h-4 text-indigo-600 dark:text-indigo-450" /> Hiring Funnel
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Applicant conversions from ingestion to offer</p>
          </div>

          <div className="my-6 space-y-4">
            {/* Funnel Level 1 */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="font-medium">1. Ingested Applications</span>
                <span className="font-bold text-slate-900 dark:text-white">{totalApplicants}</span>
              </div>
              <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden relative border border-slate-200/50 dark:border-slate-700/50">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-r"
                  style={{ width: totalApplicants > 0 ? "100%" : "0%" }}
                />
              </div>
            </div>

            {/* Funnel Level 2 */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="font-medium">2. Eligible Candidates</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{eligibleCandidates}</span>
              </div>
              <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden relative border border-slate-200/50 dark:border-slate-700/50">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-r"
                  style={{ width: totalApplicants > 0 ? `${(eligibleCandidates / totalApplicants) * 100}%` : "0%" }}
                />
              </div>
            </div>

            {/* Funnel Level 3 */}
            <div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="font-medium">3. Recommended / Strong Hire</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">{strongHiresCount}</span>
              </div>
              <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden relative border border-slate-200/50 dark:border-slate-700/50">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-purple-600 rounded-r"
                  style={{ width: totalApplicants > 0 ? `${(strongHiresCount / totalApplicants) * 100}%` : "0%" }}
                />
              </div>
            </div>
          </div>
          <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium">
            Eligibility checked by <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Agent 3 (Compliance Officer)</span>
          </p>
        </div>

        {/* Chart 2: Average Match Score Gauge */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 flex flex-col items-center justify-between shadow-sm">
          <div className="w-full text-left">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 mb-1 font-display">
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
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800"
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
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">{avgMatchScore}%</span>
              <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase mt-1">HEALTHY ALIGNMENT</p>
            </div>
          </div>

          <div className="w-full grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 text-center">
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Pending</p>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-350 mt-0.5">{pendingCandidates}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Eligible</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{eligibleCandidates}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Rejected</p>
              <p className="text-sm font-bold text-rose-500 dark:text-rose-450 mt-0.5">{rejectedCandidates}</p>
            </div>
          </div>
        </div>

        {/* Chart 3: Skills Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 mb-1 font-display">
              <Star className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Skills Alignment
            </h3>
            <p className="text-xs text-slate-400">Frequency of matched vs missing candidate skills</p>
          </div>

          <div className="my-4 space-y-4 flex-1">
            {/* Top Matched Skills */}
            <div>
              <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Top Matched Skills</h4>
              {topMatchedSkills.length === 0 ? (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">No data. Evaluate candidates to populate metrics.</p>
              ) : (
                <div className="space-y-1.5">
                  {topMatchedSkills.map(([skill, count]) => (
                    <div key={skill} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 dark:text-slate-300 font-mono font-medium">{skill}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full"
                            style={{ width: `${(count / totalApplicants) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold font-mono">{count} applicants</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Missing Skills */}
            <div>
              <h4 className="text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider mb-2">Top Missing Skills</h4>
              {topMissingSkills.length === 0 ? (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">No data. Evaluate candidates to populate metrics.</p>
              ) : (
                <div className="space-y-1.5">
                  {topMissingSkills.map(([skill, count]) => (
                    <div key={skill} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 dark:text-slate-300 font-mono font-medium">{skill}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-rose-500 h-full"
                            style={{ width: `${(count / totalApplicants) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold font-mono">{count} applicants</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Multi-Color Talent Insights Dashboard Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 4: Experience Seniority Matrix */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-sm text-left">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 font-display">
              <BarChart2 className="w-4 h-4 text-violet-600 animate-pulse" /> Candidate Experience Demographics
            </h3>
            <p className="text-xs text-slate-400">Distribution of applicant seniority tiers extracted from CV parsing</p>
          </div>

          {/* Bar Chart Graphics */}
          <div className="h-44 flex items-end justify-around border-b border-slate-150 dark:border-slate-800 pb-2 pt-4">
            {/* Junior Column */}
            <div className="flex flex-col items-center w-1/4 group">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 opacity-0 group-hover:opacity-100 transition duration-200">{expGroups.junior} candidates</span>
              <div 
                className="w-12 bg-gradient-to-t from-sky-400 to-sky-600 rounded-t-lg transition-all duration-500 hover:brightness-110 shadow-sm"
                style={{ height: `${totalApplicants > 0 ? Math.max((expGroups.junior / totalApplicants) * 120, 15) : 15}px` }}
              />
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2 font-mono uppercase">Junior</span>
              <span className="text-[9px] text-slate-400 font-mono">(&lt; 3 yrs)</span>
            </div>

            {/* Mid Column */}
            <div className="flex flex-col items-center w-1/4 group">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 opacity-0 group-hover:opacity-100 transition duration-200">{expGroups.mid} candidates</span>
              <div 
                className="w-12 bg-gradient-to-t from-indigo-500 to-indigo-700 rounded-t-lg transition-all duration-500 hover:brightness-110 shadow-sm"
                style={{ height: `${totalApplicants > 0 ? Math.max((expGroups.mid / totalApplicants) * 120, 15) : 15}px` }}
              />
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2 font-mono uppercase">Mid-Level</span>
              <span className="text-[9px] text-slate-400 font-mono">(3-5 yrs)</span>
            </div>

            {/* Senior Column */}
            <div className="flex flex-col items-center w-1/4 group">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 opacity-0 group-hover:opacity-100 transition duration-200">{expGroups.senior} candidates</span>
              <div 
                className="w-12 bg-gradient-to-t from-purple-500 to-purple-700 rounded-t-lg transition-all duration-500 hover:brightness-110 shadow-sm"
                style={{ height: `${totalApplicants > 0 ? Math.max((expGroups.senior / totalApplicants) * 120, 15) : 15}px` }}
              />
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2 font-mono uppercase">Senior</span>
              <span className="text-[9px] text-slate-400 font-mono">(5+ yrs)</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-mono pt-3">
            <span>* Segmented automatically by AI Parser Engine</span>
            <span className="font-bold text-indigo-500">Live Workspace Sync</span>
          </div>
        </div>

        {/* Chart 5: Multi-Color Quality Bands segmented chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 shadow-sm text-left">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 font-display">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Match Affinity Quality Bands
            </h3>
            <p className="text-xs text-slate-400">Distribution of candidate compatibility ratings across all positions</p>
          </div>

          {(() => {
            const bands = {
              elite: candidates.filter(c => c.matchScore >= 80).length,
              strong: candidates.filter(c => c.matchScore >= 60 && c.matchScore < 80).length,
              fair: candidates.filter(c => c.matchScore >= 40 && c.matchScore < 60).length,
              developing: candidates.filter(c => c.matchScore > 0 && c.matchScore < 40).length,
            };
            const totalEvaluated = bands.elite + bands.strong + bands.fair + bands.developing;

            return (
              <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
                {/* SVG Visual Segmented Donut Chart */}
                <div className="relative w-32 h-32 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
                    {/* Placeholder Base Ring */}
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="4.2" />
                    
                    {totalEvaluated === 0 ? (
                      /* Highlight empty placeholder segment */
                      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#a5b4fc" strokeWidth="4.5" strokeDasharray="100 0" strokeDashoffset="0" />
                    ) : (
                      <>
                        {/* Elite Segment (Emerald) */}
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="4.5" 
                          strokeDasharray={`${(bands.elite / totalEvaluated) * 100} ${100 - (bands.elite / totalEvaluated) * 100}`} 
                          strokeDashoffset="0" 
                        />
                        {/* Strong Segment (Blue) */}
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="4.5" 
                          strokeDasharray={`${(bands.strong / totalEvaluated) * 100} ${100 - (bands.strong / totalEvaluated) * 100}`} 
                          strokeDashoffset={`-${(bands.elite / totalEvaluated) * 100}`} 
                        />
                        {/* Fair Segment (Amber) */}
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4.5" 
                          strokeDasharray={`${(bands.fair / totalEvaluated) * 100} ${100 - (bands.fair / totalEvaluated) * 100}`} 
                          strokeDashoffset={`-${((bands.elite + bands.strong) / totalEvaluated) * 100}`} 
                        />
                        {/* Developing Segment (Rose) */}
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f43f5e" strokeWidth="4.5" 
                          strokeDasharray={`${(bands.developing / totalEvaluated) * 100} ${100 - (bands.developing / totalEvaluated) * 100}`} 
                          strokeDashoffset={`-${((bands.elite + bands.strong + bands.fair) / totalEvaluated) * 100}`} 
                        />
                      </>
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-slate-800 dark:text-white font-display">
                      {totalEvaluated}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Screened</span>
                  </div>
                </div>

                {/* Interactive Legends */}
                <div className="flex-1 space-y-2.5 w-full text-xs text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/85 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">Elite Match (80%+)</span>
                    </div>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">{bands.elite}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/85 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">Strong Match (60-79%)</span>
                    </div>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">{bands.strong}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/85 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">Fair Match (40-59%)</span>
                    </div>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">{bands.fair}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="font-medium text-slate-700 dark:text-slate-300">Developing (&lt; 40%)</span>
                    </div>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">{bands.developing}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Grid: Active Job Postings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight font-display">Active Job Opportunities</h2>
          <button
            onClick={() => onNavigate("jobs")}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-bold"
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
                className="bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 p-5 rounded-2xl cursor-pointer transition duration-200 flex justify-between items-start group shadow-sm hover:shadow-md"
              >
                <div className="space-y-2 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition font-display">
                      {job.title}
                    </h3>
                    <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 px-2.5 py-0.5 rounded-full font-bold font-mono">
                      {job.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    {job.company} • {job.location}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-2">
                    Required Exp: {job.experienceRequired}
                  </p>
                </div>

                <div className="text-right flex flex-col justify-between h-full space-y-4 shrink-0">
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">{job.salaryRange}</span>
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-semibold">
                    <span className="text-slate-900 dark:text-white font-extrabold">{jobCandidates.length}</span> Applicants
                    <span className="mx-1">•</span>
                    <span className="text-emerald-600 dark:text-emerald-450 font-extrabold">{reviewed}</span> Evaluated
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
