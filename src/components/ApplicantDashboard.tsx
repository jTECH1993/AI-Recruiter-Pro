import React, { useState, useEffect } from "react";
import { 
  Briefcase, Users, FileText, Upload, Trash2, Send, CheckCircle2, XCircle, 
  Clock, AlertCircle, HelpCircle, Loader2, ArrowRight, UserCheck, Shield,
  Search, MapPin, DollarSign, Calendar, Sparkles, LogOut, ArrowLeft, X
} from "lucide-react";
import { Job, Candidate, UserProfile } from "../types";

// Helper to dynamically load external parser scripts safely
async function loadExternalScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script ${src}`));
    document.head.appendChild(script);
  });
}

// Extract text from PDF, DOCX, or text files directly in-browser
const parseFileContent = async (file: File): Promise<{ text: string; name: string }> => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  
  if (extension === "pdf") {
    await loadExternalScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js");
    const pdfjsLib = (window as any)["pdfjs-dist/build/pdf"];
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      text += pageText + "\n";
    }
    const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    return { text: text.trim(), name: cleanName };
  } else if (extension === "docx") {
    await loadExternalScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");
    const mammoth = (window as any).mammoth;
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    return { text: result.value.trim(), name: cleanName };
  } else {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const firstLine = text.split("\n")[0].trim();
        const name = firstLine.length < 30 && firstLine.length > 2 ? firstLine : file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
        resolve({ text: text.trim(), name });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    });
  }
};

function CountdownTimer({ targetDate, onComplete }: { targetDate: string; onComplete?: () => void }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - Date.now();
      if (difference <= 0) {
        if (onComplete) onComplete();
        return "0s";
      }
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      return `${minutes}m ${seconds}s`;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      const t = calculateTimeLeft();
      setTimeLeft(t);
      if (t === "0s") {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  return (
    <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 px-2 py-0.5 rounded-full animate-pulse">
      Screening Ends in: {timeLeft}
    </span>
  );
}

interface ApplicantDashboardProps {
  profile: UserProfile;
  jobs: Job[];
  candidates: Candidate[];
  onApplyJob: (candidate: Candidate, hrId: string) => Promise<void>;
  onWithdrawJob: (candidate: Candidate) => Promise<void>;
}

export default function ApplicantDashboard({ 
  profile, 
  jobs, 
  candidates, 
  onApplyJob, 
  onWithdrawJob 
}: ApplicantDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [tick, setTick] = useState(0);
  const forceUpdate = () => setTick((prev) => prev + 1);

  // Application form states
  const [applicantName, setApplicantName] = useState(profile.name);
  const [applicantEmail, setApplicantEmail] = useState(profile.email);
  const [applicantPhone, setApplicantPhone] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsingError, setParsingError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const myApplications = candidates.filter(c => c.candidateUid === profile.uid);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleFileProcess = async (file: File) => {
    setParsing(true);
    setParsingError("");
    setFileName(file.name);
    try {
      const parsed = await parseFileContent(file);
      if (!parsed.text) {
        throw new Error("No readable text could be extracted from this document.");
      }
      setResumeText(parsed.text);
      if (!applicantName) {
        setApplicantName(parsed.name);
      }
    } catch (err: any) {
      console.error("Error parsing resume document:", err);
      setParsingError(err.message || "Failed to parse document. Please check the file format.");
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileProcess(e.target.files[0]);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !selectedJob.hrId) {
      alert("Invalid job posting target.");
      return;
    }

    const alreadyApplied = myApplications.some(c => c.jobId === selectedJob.id);
    if (alreadyApplied) {
      alert("You have already applied for this job and can only submit your CV once per position.");
      return;
    }

    if (!resumeText.trim()) {
      alert("Please upload or paste your CV/Resume details.");
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const resultsAvailable = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

      const newCandidate: Candidate = {
        id: "cand-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
        jobId: selectedJob.id,
        name: applicantName,
        email: applicantEmail,
        phone: applicantPhone || "Not Specified",
        resumeText: resumeText,
        matchScore: 0,
        eligibilityStatus: "Pending",
        candidateUid: profile.uid,
        hrId: selectedJob.hrId,
        interviewMessage: "Your CV application has been registered. Our multi-agent boardroom is currently awaiting HR review to screen your credentials.",
        appliedAt: now.toISOString(),
        resultsAvailableAt: resultsAvailable.toISOString()
      };

      await onApplyJob(newCandidate, selectedJob.hrId);
      
      setSuccessMsg(`Successfully applied for the ${selectedJob.title} position!`);
      setIsApplying(false);
      setSelectedJob(null);
      // reset fields
      setResumeText("");
      setFileName("");
      setApplicantPhone("");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      console.error("Error submitting application:", err);
      alert("Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header Banner */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
        <div className="space-y-2 max-w-xl text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/30 font-mono uppercase">
              Applicant Workspace
            </span>
            <span className="text-slate-500 text-[10px] font-semibold font-mono">ID: {profile.accountNumber}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">
            Welcome, {profile.name}
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            Submit your resume, track recruitment evaluations in real-time, and check whether our automated Gemini multi-agent boardroom selected your credentials for the interview round.
          </p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-indigo-600/20 text-indigo-400 rounded-lg flex items-center justify-center font-bold">
            {myApplications.length}
          </div>
          <div className="text-left">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Applied Posts</p>
            <p className="text-xs font-bold text-white">Active CV Trackers</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* NEW: Applicant Multi-Color Insights & Performance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
        {/* Chart 1: Applications Status Distribution Donut */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 font-display">
              <Clock className="w-4 h-4 text-indigo-500 animate-pulse" /> Application Pipeline Summary
            </h3>
            <p className="text-xs text-slate-400">Real-time status tracking of all your submitted credentials</p>
          </div>

          {(() => {
            const stats = {
              pending: myApplications.filter(c => c.eligibilityStatus === "Pending" && !c.withdrawn).length,
              eligible: myApplications.filter(c => c.eligibilityStatus === "Eligible" && !c.withdrawn).length,
              rejected: myApplications.filter(c => c.eligibilityStatus === "Rejected" && !c.withdrawn).length,
              withdrawn: myApplications.filter(c => c.withdrawn).length,
            };
            const total = myApplications.length;

            return (
              <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                <div className="relative w-28 h-28 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="4.5" />
                    {total === 0 ? (
                      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e2e8f0" strokeWidth="4.5" strokeDasharray="100 0" strokeDashoffset="0" />
                    ) : (
                      <>
                        {/* Pending Segment (Amber) */}
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4.5" 
                          strokeDasharray={`${(stats.pending / total) * 100} ${100 - (stats.pending / total) * 100}`} 
                          strokeDashoffset="0" 
                        />
                        {/* Eligible Segment (Emerald) */}
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="4.5" 
                          strokeDasharray={`${(stats.eligible / total) * 100} ${100 - (stats.eligible / total) * 100}`} 
                          strokeDashoffset={`-${(stats.pending / total) * 100}`} 
                        />
                        {/* Rejected Segment (Rose) */}
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f43f5e" strokeWidth="4.5" 
                          strokeDasharray={`${(stats.rejected / total) * 100} ${100 - (stats.rejected / total) * 100}`} 
                          strokeDashoffset={`-${((stats.pending + stats.eligible) / total) * 100}`} 
                        />
                        {/* Withdrawn Segment (Slate) */}
                        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#64748b" strokeWidth="4.5" 
                          strokeDasharray={`${(stats.withdrawn / total) * 100} ${100 - (stats.withdrawn / total) * 100}`} 
                          strokeDashoffset={`-${((stats.pending + stats.eligible + stats.rejected) / total) * 100}`} 
                        />
                      </>
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-extrabold text-slate-800 dark:text-white font-display">{total}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                  </div>
                </div>

                <div className="flex-1 space-y-2 w-full text-xs text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/85 pb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="font-medium text-slate-600 dark:text-slate-400">Awaiting Screen</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">{stats.pending}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/85 pb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-medium text-slate-600 dark:text-slate-400">Interview Ready</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">{stats.eligible}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/85 pb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="font-medium text-slate-600 dark:text-slate-400">Not Selected</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">{stats.rejected}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                      <span className="font-medium text-slate-600 dark:text-slate-400">Withdrawn</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">{stats.withdrawn}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Chart 2: Match Score Affinity Bars */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 font-display">
              <Sparkles className="w-4 h-4 text-violet-500" /> AI Compatibility Affinities
            </h3>
            <p className="text-xs text-slate-400">Your custom match score percentage as analyzed by the boardroom agents</p>
          </div>

          <div className="space-y-3 pt-4 flex-1 flex flex-col justify-center">
            {myApplications.filter(c => c.matchScore > 0).length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium py-4 text-center">
                * No compatibility rankings evaluated yet. Submit your CV and let HR initialize boardroom multi-agent screening!
              </p>
            ) : (
              myApplications.filter(c => c.matchScore > 0).slice(0, 3).map((cand) => {
                const job = jobs.find(j => j.id === cand.jobId);
                const score = cand.matchScore;
                
                // Determine color gradients
                const gradient = score >= 80 
                  ? "from-emerald-400 to-emerald-600" 
                  : score >= 60 
                  ? "from-blue-400 to-blue-600" 
                  : score >= 40 
                  ? "from-amber-400 to-amber-600" 
                  : "from-rose-400 to-rose-600";

                return (
                  <div key={cand.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[180px] font-display">
                        {job?.title || "Evaluating Position"}
                      </span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{score}% Match</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                      <div 
                        className={`h-full bg-gradient-to-r ${gradient} rounded-full`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Applications / Right Job Finder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: My Applications Stack */}
        <div className="lg:col-span-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight font-display flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Your Job Applications ({myApplications.length})
          </h2>

          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
            {myApplications.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 space-y-3">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold">You haven't applied to any job positions yet.</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Explore the active job listings panel on the right side and submit your resume!</p>
              </div>
            ) : (
              myApplications.map((cand) => {
                const associatedJob = jobs.find(j => j.id === cand.jobId);
                const isWithdrawn = cand.withdrawn;

                // 5-minute viewing delay lock
                const nowTime = Date.now();
                const releaseTime = cand.resultsAvailableAt ? new Date(cand.resultsAvailableAt).getTime() : 0;
                const isLocked = !isWithdrawn && releaseTime > nowTime;

                return (
                  <div 
                    key={cand.id} 
                    id={`cand-card-${cand.id}`}
                    className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 shadow-sm transition-all duration-500"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base font-display">
                          {associatedJob?.title || "Unknown Job Role"}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                          {associatedJob?.company || "Company Office"} • {associatedJob?.location || "Remote"}
                        </p>
                      </div>

                      {/* Role-Based Badges */}
                      <div>
                        {isWithdrawn ? (
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Withdrawn
                          </span>
                        ) : isLocked ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 animate-pulse">
                              <Loader2 className="w-3 h-3 animate-spin text-amber-500" /> Screening
                            </span>
                            <CountdownTimer targetDate={cand.resultsAvailableAt!} onComplete={forceUpdate} />
                          </div>
                        ) : cand.eligibilityStatus === "Pending" ? (
                          <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Awaiting Screen
                          </span>
                        ) : cand.eligibilityStatus === "Eligible" ? (
                          <span className="bg-emerald-50 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Accepted for Interview
                          </span>
                        ) : (
                          <span className="bg-rose-50 dark:bg-rose-950/45 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Not Selected
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Screening Results / Interview Invitation Message */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 space-y-2">
                      <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        AI Boardroom Screening Notice
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed">
                        {isLocked 
                          ? "Our multi-agent recruiting courtroom is actively assessing your qualifications. To preserve accuracy and allow full deliberation, results will be securely unlocked in your portal 5 minutes after submission."
                          : (cand.interviewMessage || "Your profile is successfully submitted. No decision has been made yet.")}
                      </p>

                      {!isLocked && cand.matchScore > 0 && !isWithdrawn && (
                        <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[11px] font-bold font-mono">
                          <span className="text-slate-400">Match Affinity Rank:</span>
                          <span className="text-indigo-600 dark:text-indigo-400">{cand.matchScore}% Compatibility</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                      <span>Applied via CV Portal</span>
                      {!isWithdrawn && (
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to withdraw your application for this position? This action is irreversible.")) {
                              onWithdrawJob(cand);
                            }
                          }}
                          className="text-rose-600 dark:text-rose-400 hover:text-rose-500 hover:underline font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Withdraw CV
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Browse and Filter Vacancies */}
        <div className="lg:col-span-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight font-display flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Active Job Opportunities ({filteredJobs.length})
          </h2>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, skills, location..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-150 focus:outline-none focus:border-indigo-500 transition shadow-sm"
            />
          </div>

          <div className="space-y-3 max-h-[720px] overflow-y-auto pr-2">
            {filteredJobs.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 font-semibold text-xs">
                No matching active job postings found.
              </div>
            ) : (
              filteredJobs.map((job) => {
                const alreadyApplied = myApplications.some(c => c.jobId === job.id);
                const isSelected = selectedJob?.id === job.id;

                return (
                  <div
                    key={job.id}
                    onClick={() => {
                      if (!alreadyApplied) {
                        setSelectedJob(isSelected ? null : job);
                        setIsApplying(false);
                      }
                    }}
                    className={`p-5 rounded-2xl border text-left cursor-pointer transition ${
                      alreadyApplied 
                        ? "bg-slate-50/50 dark:bg-slate-950/20 border-slate-150 dark:border-slate-850 opacity-75 cursor-not-allowed"
                        : isSelected
                        ? "bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-500 dark:border-indigo-800 shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/30"
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 px-2.5 py-0.5 rounded-full font-bold font-mono uppercase tracking-wider">
                            {job.type}
                          </span>
                          <h3 className="font-bold text-slate-900 dark:text-white text-base line-clamp-1 font-display mt-1.5">{job.title}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{job.company}</p>
                        </div>

                        <div className="text-right font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 shrink-0">
                          {job.salaryRange || "Competitive"}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {job.mandatorySkills.split(",").slice(0, 4).map((skill) => (
                          <span key={skill} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded font-mono font-medium">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>

                      <div className="border-t border-slate-150 dark:border-slate-800 pt-3 flex justify-between items-center text-[10px] font-bold font-mono text-slate-400">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{job.location} • Experience: {job.experienceRequired}</span>
                          </div>
                          {job.endDate && (
                            <div className="flex items-center gap-1 text-rose-500 font-bold">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Ends: {job.endDate}</span>
                            </div>
                          )}
                        </div>

                        {alreadyApplied ? (
                          <span className="text-emerald-600 dark:text-emerald-450 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Applied
                          </span>
                        ) : isSelected ? (
                          <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1 animate-pulse">
                            Close details <X className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition duration-200">
                            View details & Apply →
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expanded Job Detail & Apply panel */}
                    {isSelected && !alreadyApplied && (
                      <div className="mt-5 border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4 text-slate-750 dark:text-slate-300 animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono block">Required Education:</span>
                            <p className="font-semibold">{job.educationRequired}</p>
                          </div>
                          {job.preferredSkills && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono block">Preferred Skills:</span>
                              <p className="font-semibold">{job.preferredSkills}</p>
                            </div>
                          )}
                          {job.responsibilities && (
                            <div className="space-y-1 col-span-2">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono block">Key Responsibilities:</span>
                              <p className="text-xs leading-relaxed">{job.responsibilities}</p>
                            </div>
                          )}
                        </div>

                        {/* Apply Trigger/Form */}
                        {!isApplying ? (
                          <button
                            onClick={() => setIsApplying(true)}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                          >
                            <Send className="w-3.5 h-3.5" /> Prepare Application
                          </button>
                        ) : (
                          <form onSubmit={handleApplySubmit} className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-4">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
                              Submit Resume Application
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono mb-1 block">Full Name</label>
                                <input
                                  type="text"
                                  required
                                  value={applicantName}
                                  onChange={(e) => setApplicantName(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono mb-1 block">Email Address</label>
                                <input
                                  type="email"
                                  required
                                  value={applicantEmail}
                                  onChange={(e) => setApplicantEmail(e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono mb-1 block">Phone Number</label>
                                <input
                                  type="text"
                                  required
                                  value={applicantPhone}
                                  onChange={(e) => setApplicantPhone(e.target.value)}
                                  placeholder="+1 (555) 019-2834"
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                            </div>

                            {/* CV Parser Drop area */}
                            <div
                              onDragEnter={handleDrag}
                              onDragOver={handleDrag}
                              onDragLeave={handleDrag}
                              onDrop={handleDrop}
                              className={`border-2 border-dashed rounded-lg p-4 text-center transition ${
                                dragActive
                                  ? "border-indigo-500 bg-indigo-50/20 text-indigo-600"
                                  : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 hover:border-slate-300"
                              }`}
                            >
                              <input
                                id="candidate-file-upload"
                                type="file"
                                accept=".pdf,.docx,.txt"
                                onChange={handleFileChange}
                                className="hidden"
                              />
                              <label htmlFor="candidate-file-upload" className="cursor-pointer space-y-1 block">
                                {parsing ? (
                                  <Loader2 className="w-5 h-5 text-indigo-500 mx-auto animate-spin" />
                                ) : (
                                  <Upload className="w-5 h-5 text-indigo-500 mx-auto" />
                                )}
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-300">
                                  {parsing ? "Parsing Resume..." : "Upload CV Document (.pdf, .docx, .txt)"}
                                </p>
                                {fileName && !parsing && (
                                  <span className="inline-block text-[10px] bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded font-mono border border-slate-200 dark:border-slate-800">
                                    {fileName}
                                  </span>
                                )}
                              </label>
                            </div>

                            {parsingError && (
                              <p className="text-[10px] font-semibold text-rose-500">{parsingError}</p>
                            )}

                            <div>
                              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono mb-1 block">Paste CV Details / Summary</label>
                              <textarea
                                rows={6}
                                required
                                value={resumeText}
                                onChange={(e) => setResumeText(e.target.value)}
                                placeholder="Summary of your qualifications, technologies, projects, and work history..."
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                              />
                            </div>

                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => setIsApplying(false)}
                                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-lg transition"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={submitting || parsing}
                                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-sm"
                              >
                                {submitting ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-3.5 h-3.5" /> Apply Now
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
