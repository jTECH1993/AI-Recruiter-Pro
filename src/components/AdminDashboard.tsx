import React, { useState } from "react";
import { 
  Briefcase, Users, UserCheck, ShieldAlert, FileSpreadsheet, Star, 
  BarChart2, TrendingUp, Search, User, Mail, Shield, Filter, Database,
  ArrowRight, CheckCircle, XCircle, UserPlus, Eye, EyeOff, Lock, Key, RefreshCw
} from "lucide-react";
import { Job, Candidate, UserProfile } from "../types";

interface AdminDashboardProps {
  profile: UserProfile;
  jobs: Job[];
  candidates: Candidate[];
  users: UserProfile[];
  onCreateUser: (name: string, email: string, password: string, role: "hr" | "applicant") => Promise<void>;
  hrPasscode: string;
  onUpdatePasscode: (newPasscode: string) => Promise<void>;
}

export default function AdminDashboard({ 
  profile, 
  jobs, 
  candidates, 
  users,
  onCreateUser,
  hrPasscode,
  onUpdatePasscode
}: AdminDashboardProps) {
  const [selectedHRId, setSelectedHRId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // State for HR Passcode Management
  const [editingPasscode, setEditingPasscode] = useState(hrPasscode);
  const [passcodeSuccess, setPasscodeSuccess] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [updatingPasscode, setUpdatingPasscode] = useState(false);

  React.useEffect(() => {
    setEditingPasscode(hrPasscode);
  }, [hrPasscode]);

  const handleUpdatePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError("");
    setPasscodeSuccess("");
    
    if (!editingPasscode.trim()) {
      setPasscodeError("Passcode cannot be blank.");
      return;
    }

    setUpdatingPasscode(true);
    try {
      await onUpdatePasscode(editingPasscode.trim());
      setPasscodeSuccess("HR registration passcode successfully updated in database!");
    } catch (err: any) {
      console.error("Passcode update error:", err);
      setPasscodeError("Failed to update passcode in database.");
    } finally {
      setUpdatingPasscode(false);
    }
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "HR-";
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditingPasscode(result);
  };

  // State for Admin User Creation Form
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [newUserRole, setNewUserRole] = useState<"hr" | "applicant">("hr");
  const [createLoading, setCreateLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState("");
  const [createError, setCreateError] = useState("");

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");
    
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      setCreateError("All fields are required to create a new user.");
      return;
    }
    if (newUserPassword.length < 6) {
      setCreateError("Password must be at least 6 characters.");
      return;
    }

    setCreateLoading(true);
    try {
      await onCreateUser(newUserName, newUserEmail, newUserPassword, newUserRole);
      setCreateSuccess(`Successfully provisioned new ${newUserRole === "hr" ? "HR Recruiter" : "Job Candidate"} account for ${newUserName}!`);
      // Reset inputs
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
    } catch (err: any) {
      console.error("Admin user creation error:", err);
      let errMsg = "Failed to create user.";
      if (err.code === "auth/email-already-in-use") {
        errMsg = "This email is already in use by another account.";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "Please enter a valid email address.";
      } else if (err.message) {
        errMsg = err.message;
      }
      setCreateError(errMsg);
    } finally {
      setCreateLoading(false);
    }
  };

  const hrAccounts = users.filter(u => u.role === "hr");
  const candidateAccounts = users.filter(u => u.role === "applicant");

  // Filter jobs based on selected HR and search term
  const filteredJobs = jobs.filter(job => {
    const matchesHR = selectedHRId === "all" || job.hrId === selectedHRId;
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.hrName && job.hrName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesHR && matchesSearch;
  });

  // Analytics Calculations
  const totalJobs = jobs.length;
  const totalApplicants = candidates.length;
  const totalHRs = hrAccounts.length;
  const totalCandidates = candidateAccounts.length;

  const eligibleCandidates = candidates.filter(c => c.eligibilityStatus === "Eligible").length;
  const rejectedCandidates = candidates.filter(c => c.eligibilityStatus === "Rejected").length;
  const pendingCandidates = candidates.filter(c => c.eligibilityStatus === "Pending").length;

  const screenedCount = eligibleCandidates + rejectedCandidates;
  const conversionRate = screenedCount > 0 
    ? Math.round((eligibleCandidates / screenedCount) * 100) 
    : 0;

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header Banner */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
        <div className="space-y-2 max-w-xl text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/30 font-mono uppercase flex items-center gap-1">
              <Shield className="w-3 h-3" /> Root Administrator
            </span>
            <span className="text-slate-500 text-[10px] font-semibold font-mono">ID: {profile.accountNumber}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">
            System Administration Console
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            Oversee system-wide hiring activity. Audit which HR generated specific job listings, inspect incoming CV volumes, filter statistics by recruiter, and audit user directory credentials.
          </p>
        </div>
        
        {/* Connection health indicator */}
        <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl space-y-1.5 shrink-0 text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-300 font-mono uppercase">Database Synchronized</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Real-time isolation active</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* HR Count */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-3.5 shadow-sm">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">HR Recruiter Accounts</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 font-display">{totalHRs}</p>
          </div>
        </div>

        {/* Total Active Jobs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-3.5 shadow-sm">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Active Jobs</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 font-display">{totalJobs}</p>
          </div>
        </div>

        {/* Total CV Applications */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-3.5 shadow-sm">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Global Applications</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 font-display">{totalApplicants}</p>
          </div>
        </div>

        {/* Screening Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center space-x-3.5 shadow-sm">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Interview Pass Rate</p>
            <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 font-display">{conversionRate}%</p>
          </div>
        </div>
      </div>

      {/* NEW: Admin Multi-Color Performance & Demographics Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
        {/* Chart 1: Global Account Distribution Horizontal Stacked Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 shadow-sm text-left">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 font-display">
              <Users className="w-4 h-4 text-violet-500 animate-pulse" /> User Role Demographics
            </h3>
            <p className="text-xs text-slate-400">Proportional system-wide distribution of account profiles</p>
          </div>

          {(() => {
            const counts = {
              applicants: users.filter(u => u.role === "applicant").length,
              hr: users.filter(u => u.role === "hr").length,
              admin: users.filter(u => u.role === "admin").length,
            };
            const grandTotal = Math.max(counts.applicants + counts.hr + counts.admin, 1);
            const pct = {
              applicants: ((counts.applicants / grandTotal) * 100).toFixed(1),
              hr: ((counts.hr / grandTotal) * 100).toFixed(1),
              admin: ((counts.admin / grandTotal) * 100).toFixed(1),
            };

            return (
              <div className="space-y-6 pt-2">
                {/* Visual horizontal stacked bar */}
                <div className="h-6 w-full rounded-full overflow-hidden flex shadow-inner border border-slate-200/50 dark:border-slate-800">
                  <div 
                    title={`Candidates: ${counts.applicants}`}
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                    style={{ width: `${pct.applicants}%` }}
                  />
                  <div 
                    title={`HR Recruiters: ${counts.hr}`}
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
                    style={{ width: `${pct.hr}%` }}
                  />
                  <div 
                    title={`Managers: ${counts.admin}`}
                    className="h-full bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 transition-all duration-500"
                    style={{ width: `${pct.admin}%` }}
                  />
                </div>

                {/* Legend with Metrics Indicators */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-100/50 dark:border-emerald-900/50 text-left">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Applicants</span>
                    </div>
                    <p className="text-base font-extrabold text-slate-900 dark:text-white font-mono">{counts.applicants}</p>
                    <p className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{pct.applicants}% of database</p>
                  </div>

                  <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 rounded-xl border border-indigo-100/50 dark:border-indigo-900/50 text-left">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Recruiters</span>
                    </div>
                    <p className="text-base font-extrabold text-slate-900 dark:text-white font-mono">{counts.hr}</p>
                    <p className="text-[9px] font-semibold text-indigo-600 dark:text-indigo-400 font-mono">{pct.hr}% of database</p>
                  </div>

                  <div className="bg-fuchsia-50/50 dark:bg-fuchsia-950/20 p-2.5 rounded-xl border border-fuchsia-100/50 dark:border-fuchsia-900/50 text-left">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-fuchsia-500" />
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Managers</span>
                    </div>
                    <p className="text-base font-extrabold text-slate-900 dark:text-white font-mono">{counts.admin}</p>
                    <p className="text-[9px] font-semibold text-fuchsia-600 dark:text-fuchsia-400 font-mono">{pct.admin}% of database</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Chart 2: HR Recruiter Engagement Volumes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 shadow-sm text-left">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 font-display">
              <BarChart2 className="w-4 h-4 text-indigo-500" /> Recruiter Acquisition Indexes
            </h3>
            <p className="text-xs text-slate-400">Breakdown of job listings & applicant volume driven per recruiter profile</p>
          </div>

          <div className="space-y-3.5 max-h-40 overflow-y-auto pr-1">
            {(() => {
              const hrs = users.filter(u => u.role === "hr");
              if (hrs.length === 0) {
                return (
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium py-6 text-center">
                    * No registered recruiters found in system workspace.
                  </p>
                );
              }

              return hrs.slice(0, 3).map((hr) => {
                const hrJobs = jobs.filter(j => j.hrId === hr.uid || j.hrEmail === hr.email || j.hrName === hr.name);
                const hrJobsCount = hrJobs.length;
                const hrCandidatesCount = candidates.filter(c => hrJobs.some(j => j.id === c.jobId)).length;

                return (
                  <div key={hr.uid} className="space-y-1.5 border-b border-slate-50 dark:border-slate-800 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-800 dark:text-white font-display">{hr.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{hr.accountNumber}</span>
                      </div>
                      <div className="text-right text-[10px] font-mono">
                        <span className="text-indigo-600 font-bold dark:text-indigo-400">{hrJobsCount} Job Posts</span>
                        <span className="text-slate-300 mx-1">|</span>
                        <span className="text-emerald-600 font-bold dark:text-emerald-400">{hrCandidatesCount} CVs Ingested</span>
                      </div>
                    </div>
                    {/* Multi-Colored visual indicator representing volume ratio */}
                    <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700/40">
                      <div 
                        className="h-full bg-indigo-500 rounded-l-full"
                        style={{ width: `${Math.min((hrJobsCount / (totalJobs || 1)) * 100, 100)}%` }}
                      />
                      <div 
                        className="h-full bg-emerald-400 rounded-r-full"
                        style={{ width: `${Math.min((hrCandidatesCount / (totalApplicants || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Primary Analytics Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Jobs & Creators Table (Cols 8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight font-display flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Active Postings & Ingested Volumes ({filteredJobs.length})
            </h2>

            {/* HR Isolation Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedHRId}
                onChange={(e) => setSelectedHRId(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition shadow-sm cursor-pointer"
              >
                <option value="all">All HR Recruiter Accounts</option>
                {hrAccounts.map((hr) => (
                  <option key={hr.uid} value={hr.uid}>
                    {hr.name} ({hr.accountNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-150 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    <th className="px-5 py-3">Job Listing & Details</th>
                    <th className="px-5 py-3">Responsible HR / Generator</th>
                    <th className="px-5 py-3 text-center">Applications</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/85">
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-10 text-center text-xs text-slate-400 font-semibold">
                        No active jobs matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((job) => {
                      const associatedHR = users.find(u => u.uid === job.hrId);
                      const jobCandidates = candidates.filter(c => c.jobId === job.id);
                      const eligible = jobCandidates.filter(c => c.eligibilityStatus === "Eligible").length;

                      return (
                        <tr 
                          key={job.id} 
                          id={`admin-job-row-${job.id}`}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all duration-500"
                        >
                          <td className="px-5 py-4 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-950 dark:text-white text-xs font-display">{job.title}</span>
                              <span className="text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                                {job.type}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">{job.company} • {job.location}</p>
                            <p className="text-[10px] text-slate-400 font-mono">Department: {job.department}</p>
                          </td>
                          <td className="px-5 py-4 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {associatedHR?.name || job.hrName || "Legacy Recruiter"}
                              </span>
                              <span className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                                {associatedHR?.accountNumber || "HR-DEFAULT"}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono leading-none">
                              {associatedHR?.email || job.hrEmail || "no-email@hr.com"}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="text-sm font-extrabold text-slate-900 dark:text-white font-display">
                                {jobCandidates.length}
                              </span>
                              {eligible > 0 && (
                                <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-450 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.2 rounded mt-0.5">
                                  {eligible} interview ready
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Admin User Creation Form & Registered Accounts Directory (Cols 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* HR Registration Passcode Control Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-full blur-xl -z-10" />
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight font-display">
                  HR Registration Passkey
                </h2>
                <p className="text-[10px] text-slate-400">Manage dynamic access code for registering new recruiters</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePasscodeSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Passkey</label>
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-550 flex items-center gap-1 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Generate Random
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={editingPasscode}
                    onChange={(e) => setEditingPasscode(e.target.value)}
                    placeholder="e.g. HR999"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-950 dark:text-white focus:outline-none transition shadow-sm font-mono uppercase font-bold"
                  />
                </div>
              </div>

              {passcodeError && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 p-2.5 rounded-lg text-[10px] font-semibold flex items-start gap-1.5 leading-relaxed">
                  <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{passcodeError}</span>
                </div>
              )}

              {passcodeSuccess && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-450 p-2.5 rounded-lg text-[10px] font-semibold flex items-start gap-1.5 leading-relaxed">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{passcodeSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={updatingPasscode}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/10"
              >
                {updatingPasscode ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                {updatingPasscode ? "Saving Passkey..." : "Save Active Passkey"}
              </button>
            </form>
          </div>

          {/* Admin User Provisioning Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 text-left">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight font-display">
                  Provision User Account
                </h2>
                <p className="text-[10px] text-slate-400">Instantly register verified Candidates or HR Recruiter staff</p>
              </div>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-3.5">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Enter full display name"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-950 dark:text-white focus:outline-none transition shadow-sm font-sans"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Login Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-950 dark:text-white focus:outline-none transition shadow-sm font-sans"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Security Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type={showUserPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-8 pr-10 py-1.5 text-xs text-slate-950 dark:text-white focus:outline-none transition shadow-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none cursor-pointer"
                    title={showUserPassword ? "Hide password" : "Show password"}
                  >
                    {showUserPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Account Role Segmented Toggle */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Account Role Type</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200/40 dark:border-slate-850">
                  <button
                    type="button"
                    onClick={() => setNewUserRole("hr")}
                    className={`py-1 text-[10px] font-bold rounded transition-colors ${
                      newUserRole === "hr"
                        ? "bg-white dark:bg-slate-850 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    HR Recruiter
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUserRole("applicant")}
                    className={`py-1 text-[10px] font-bold rounded transition-colors ${
                      newUserRole === "applicant"
                        ? "bg-white dark:bg-slate-850 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    Candidate
                  </button>
                </div>
              </div>

              {/* Error & Success Messages */}
              {createError && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 p-2.5 rounded-lg text-[10px] font-semibold flex items-start gap-1.5 leading-relaxed">
                  <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              {createSuccess && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-450 p-2.5 rounded-lg text-[10px] font-semibold flex items-start gap-1.5 leading-relaxed">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{createSuccess}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={createLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/10"
              >
                {createLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                {createLoading ? "Provisioning..." : "Provision Auth Account"}
              </button>
            </form>
          </div>

          {/* Registered Users Directory */}
          <div className="space-y-4 text-left">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight font-display flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Users Directory ({users.length})
            </h2>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm max-h-[500px] overflow-y-auto">
              {users.map((u) => {
                const isAdmin = u.role === "admin";
                const isHR = u.role === "hr";

                return (
                  <div 
                    key={u.uid} 
                    className="p-3 border border-slate-150 dark:border-slate-800/80 hover:border-slate-250 dark:hover:border-slate-700/60 rounded-xl bg-slate-50/50 dark:bg-slate-950/10 space-y-2.5 transition"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5 text-left min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white font-display truncate">
                            {u.name}
                          </span>
                          {isAdmin ? (
                            <span className="text-[8px] font-mono font-bold uppercase bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 px-1.5 py-0.2 rounded">
                              Admin
                            </span>
                          ) : isHR ? (
                            <span className="text-[8px] font-mono font-bold uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 px-1.5 py-0.2 rounded">
                              HR
                            </span>
                          ) : (
                            <span className="text-[8px] font-mono font-bold uppercase bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 px-1.5 py-0.2 rounded">
                              Candidate
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">{u.email}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-[9px] font-mono font-extrabold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-700/50">
                          {u.accountNumber || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Masked Password Visual Indicator */}
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono pt-2 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <EyeOff className="w-3 h-3 text-slate-400" />
                        <span>Password: <span className="font-bold tracking-wider text-slate-350 dark:text-slate-600 select-none">••••••••</span></span>
                      </div>
                      <span className="text-[8px] bg-slate-100/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.2 rounded font-sans font-extrabold tracking-wide">SECURED / HIDDEN</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
