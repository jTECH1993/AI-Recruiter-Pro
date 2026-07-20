import React, { useState, useEffect } from "react";
import { Cpu, Briefcase, Users, Upload, LogOut, LogIn, Key, UserCheck, Shield, Sparkles, PlusCircle, LayoutDashboard, Database, Loader2 } from "lucide-react";
import { Job, Candidate, EvaluationReport } from "./types";
import { PRELOADED_JOBS, PRELOADED_CANDIDATES } from "./data";
import { auth, db } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";

// Component imports
import Dashboard from "./components/Dashboard";
import JobManager from "./components/JobManager";
import ResumeUploader from "./components/ResumeUploader";
import CandidateProfileView from "./components/CandidateProfileView";
import AgentBoardroom from "./components/AgentBoardroom";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [candidateIdToDelete, setCandidateIdToDelete] = useState<string | null>(null);

  // Auth States (Now connected to real Firebase)
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState("");
  const [firebaseLoading, setFirebaseLoading] = useState(true);

  // Load & Sync from Firestore
  useEffect(() => {
    let unsubscribeJobs: (() => void) | null = null;
    let unsubscribeCandidates: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clear previous Firestore subscriptions
      if (unsubscribeJobs) {
        unsubscribeJobs();
        unsubscribeJobs = null;
      }
      if (unsubscribeCandidates) {
        unsubscribeCandidates();
        unsubscribeCandidates = null;
      }

      if (firebaseUser) {
        setUser({
          email: firebaseUser.email!,
          name: firebaseUser.displayName || firebaseUser.email!.split("@")[0],
        });

        try {
          // Deleting old dummy data from Firestore to keep only AI Engineer and its candidate
          const jobsSnapshot = await getDocs(collection(db, "jobs"));
          let foundOldData = false;
          for (const docObj of jobsSnapshot.docs) {
            if (docObj.id === "job-1") {
              foundOldData = true;
              await deleteDoc(doc(db, "jobs", "job-1"));
            }
          }

          if (foundOldData) {
            const candidatesSnapshot = await getDocs(collection(db, "candidates"));
            for (const docObj of candidatesSnapshot.docs) {
              const data = docObj.data();
              if (data.jobId === "job-1" || data.id === "candidate-1" || data.id === "candidate-2") {
                await deleteDoc(doc(db, "candidates", docObj.id));
              }
            }
          }

          // Seed fresh database collections if empty
          const freshJobsSnapshot = await getDocs(collection(db, "jobs"));
          if (freshJobsSnapshot.empty) {
            console.log("Seeding initial jobs into Firestore...");
            for (const job of PRELOADED_JOBS) {
              await setDoc(doc(db, "jobs", job.id), job);
            }
          }

          const freshCandidatesSnapshot = await getDocs(collection(db, "candidates"));
          if (freshCandidatesSnapshot.empty) {
            console.log("Seeding initial candidates into Firestore...");
            for (const cand of PRELOADED_CANDIDATES) {
              await setDoc(doc(db, "candidates", cand.id), cand);
            }
          }
        } catch (err) {
          console.error("Error seeding or cleaning initial data in Firestore:", err);
        }

        // Setup real-time listeners
        unsubscribeJobs = onSnapshot(collection(db, "jobs"), (snapshot) => {
          const jobsList: Job[] = [];
          snapshot.forEach((doc) => {
            jobsList.push(doc.data() as Job);
          });
          setJobs(jobsList);
        });

        unsubscribeCandidates = onSnapshot(collection(db, "candidates"), (snapshot) => {
          const candidatesList: Candidate[] = [];
          snapshot.forEach((doc) => {
            candidatesList.push(doc.data() as Candidate);
          });
          setCandidates(candidatesList);
        });

        setFirebaseLoading(false);
      } else {
        setUser(null);
        setJobs([]);
        setCandidates([]);
        setFirebaseLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeJobs) unsubscribeJobs();
      if (unsubscribeCandidates) unsubscribeCandidates();
    };
  }, []);

  // Sync selected job with jobs array
  useEffect(() => {
    if (jobs.length > 0) {
      if (!selectedJob || !jobs.some((j) => j.id === selectedJob.id)) {
        setSelectedJob(jobs[0]);
      }
    } else {
      setSelectedJob(null);
    }
  }, [jobs, selectedJob]);

  // Firestore update handlers
  const handleAddJob = async (newJob: Job) => {
    try {
      await setDoc(doc(db, "jobs", newJob.id), newJob);
    } catch (err) {
      console.error("Error adding job to Firestore:", err);
    }
  };

  const handleUpdateJob = async (updatedJob: Job) => {
    try {
      await setDoc(doc(db, "jobs", updatedJob.id), updatedJob);
    } catch (err) {
      console.error("Error updating job in Firestore:", err);
    }
  };

  const handleDeleteJob = async (id: string) => {
    try {
      await deleteDoc(doc(db, "jobs", id));
      // Also delete candidates associated with this jobId
      const associated = candidates.filter((c) => c.jobId === id);
      for (const cand of associated) {
        await deleteDoc(doc(db, "candidates", cand.id));
      }
    } catch (err) {
      console.error("Error deleting job in Firestore:", err);
    }
  };

  const handleAddCandidate = async (newCand: Candidate) => {
    try {
      await setDoc(doc(db, "candidates", newCand.id), newCand);
    } catch (err) {
      console.error("Error adding candidate in Firestore:", err);
    }
  };

  const handleUploadAndScreenCandidate = async (newCand: Candidate, targetJob: Job) => {
    try {
      // 1. Add candidate to Firestore
      await setDoc(doc(db, "candidates", newCand.id), newCand);
      
      // 2. State selection
      setSelectedJob(targetJob);
      setSelectedCandidate(newCand);
      
      // 3. Launch active multi-agent evaluation boardroom
      setIsEvaluating(true);
    } catch (err) {
      console.error("Error in direct upload and screen pipeline:", err);
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    try {
      await deleteDoc(doc(db, "candidates", id));
      if (selectedCandidate?.id === id) setSelectedCandidate(null);
    } catch (err) {
      console.error("Error deleting candidate in Firestore:", err);
    }
  };

  const handleEvaluationComplete = async (report: EvaluationReport) => {
    if (!selectedCandidate) return;

    const freshCandidate = {
      ...selectedCandidate,
      matchScore: report.hiringRecommendation?.match_score || 0,
      eligibilityStatus: report.eligibilityReport.status,
      evaluatedAt: new Date().toISOString(),
      report,
    };

    try {
      await setDoc(doc(db, "candidates", selectedCandidate.id), freshCandidate);
      setSelectedCandidate(freshCandidate);
    } catch (err) {
      console.error("Error updating candidate after evaluation in Firestore:", err);
    }
    setIsEvaluating(false);
  };

  const handleUpdateNotes = async (candId: string, notes: string) => {
    const cand = candidates.find((c) => c.id === candId);
    if (!cand) return;
    const updatedCand = { ...cand, notes };
    try {
      await setDoc(doc(db, "candidates", candId), updatedCand);
      if (selectedCandidate?.id === candId) setSelectedCandidate(updatedCand);
    } catch (err) {
      console.error("Error updating candidate notes in Firestore:", err);
    }
  };

  const handleUpdateEmails = async (candId: string, emails: any) => {
    const cand = candidates.find((c) => c.id === candId);
    if (!cand || !cand.report) return;
    const updatedCand = {
      ...cand,
      report: {
        ...cand.report,
        emails: {
          ...cand.report.emails,
          ...emails,
        },
      },
    };
    try {
      await setDoc(doc(db, "candidates", candId), updatedCand);
      if (selectedCandidate?.id === candId) setSelectedCandidate(updatedCand);
    } catch (err) {
      console.error("Error updating candidate emails in Firestore:", err);
    }
  };

  // Auth Callbacks
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!authEmail || !authPassword) {
      setAuthError("Email and password are required.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
      // Reset inputs
      setAuthEmail("");
      setAuthPassword("");
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMsg = "Failed to sign in. Please check your credentials.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMsg = "Invalid email or password security key.";
      } else if (error.code === "auth/invalid-email") {
        errorMsg = "Please enter a valid email address.";
      }
      setAuthError(errorMsg);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!authEmail || !authPassword || !authName) {
      setAuthError("All fields are required.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      await updateProfile(userCredential.user, { displayName: authName });

      // Save user details to Firestore 'users' collection to fulfill "authentication using firestore"
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: authName,
        email: authEmail,
        createdAt: new Date().toISOString(),
      });

      // Reset inputs
      setAuthEmail("");
      setAuthPassword("");
      setAuthName("");
      setIsRegistering(false);
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMsg = "Failed to register new account.";
      if (error.code === "auth/email-already-in-use") {
        errorMsg = "This email is already in use by another recruiter.";
      } else if (error.code === "auth/weak-password") {
        errorMsg = "Security key should be at least 6 characters.";
      } else if (error.code === "auth/invalid-email") {
        errorMsg = "Please enter a valid email address.";
      }
      setAuthError(errorMsg);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err: any) {
      console.error("Logout error:", err);
    }
  };

  // Setup active job to display in Applicants Tab
  useEffect(() => {
    if (jobs.length > 0 && !selectedJob) {
      setSelectedJob(jobs[0]);
    }
  }, [jobs, selectedJob]);

  const activeJobCandidates = candidates.filter((c) => c.jobId === selectedJob?.id);

  if (firebaseLoading) {
    return (
      <div className="min-h-screen w-screen bg-[#F8FAFC] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold text-slate-500 font-mono tracking-widest uppercase animate-pulse">Connecting with Firestore...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col md:flex-row font-sans antialiased SelectionColor">
      {user ? (
        <>
          {/* LEFT SIDEBAR (Desktop Only) */}
          <aside className="hidden md:flex flex-col w-64 bg-[#0F172A] text-slate-300 border-r border-slate-800 shrink-0">
            {/* Sidebar Brand Header */}
            <div className="p-6 border-b border-slate-800/80 flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
              <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/20">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-wider uppercase text-white font-display flex items-center gap-1">
                  AI Recruiter <span className="text-[9px] bg-indigo-500/30 text-indigo-200 font-bold px-1.5 py-0.5 rounded">v2.0</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium">Multi-Agent HR System</p>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1">
              <button
                onClick={() => {
                  setActiveTab("dashboard");
                  setSelectedCandidate(null);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "dashboard" ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/10" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>

              <button
                onClick={() => {
                  setActiveTab("jobs");
                  setSelectedCandidate(null);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "jobs" ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/10" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Job Postings
              </button>

              <button
                onClick={() => {
                  setActiveTab("candidates");
                  setSelectedCandidate(null);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "candidates" ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/10" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Users className="w-4 h-4" />
                Applicant Tracker
              </button>

              <button
                onClick={() => {
                  setActiveTab("upload");
                  setSelectedCandidate(null);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "upload" ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/10" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Upload className="w-4 h-4" />
                Ingest Resumes
              </button>
            </nav>

            {/* Sidebar User Info & Logout */}
            <div className="p-4 border-t border-slate-800/85 bg-[#09101D] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 bg-indigo-600/25 border border-indigo-500/20 text-indigo-300 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-inner">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-white leading-none truncate max-w-[110px]">{user.name}</p>
                  <p className="text-[9px] text-slate-500 font-medium font-mono leading-none mt-1 truncate max-w-[110px]">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </aside>

          {/* MOBILE HEADER (Mobile Only) */}
          <header className="md:hidden w-full bg-[#0F172A] text-slate-300 border-b border-slate-800 sticky top-0 z-50">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2" onClick={() => setActiveTab("dashboard")}>
                <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                  <Cpu className="w-4 h-4" />
                </div>
                <h1 className="text-xs font-black tracking-wider uppercase text-white font-display">
                  AI Recruiter Pro
                </h1>
              </div>

              {/* Mobile Quick Navigation */}
              <nav className="flex items-center space-x-0.5">
                <button
                  onClick={() => { setActiveTab("dashboard"); setSelectedCandidate(null); }}
                  className={`p-1.5 rounded-lg text-xs transition ${activeTab === "dashboard" ? "text-indigo-400 bg-slate-800" : "text-slate-400"}`}
                  title="Dashboard"
                >
                  <LayoutDashboard className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setActiveTab("jobs"); setSelectedCandidate(null); }}
                  className={`p-1.5 rounded-lg text-xs transition ${activeTab === "jobs" ? "text-indigo-400 bg-slate-800" : "text-slate-400"}`}
                  title="Jobs"
                >
                  <Briefcase className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setActiveTab("candidates"); setSelectedCandidate(null); }}
                  className={`p-1.5 rounded-lg text-xs transition ${activeTab === "candidates" ? "text-indigo-400 bg-slate-800" : "text-slate-400"}`}
                  title="Applicants"
                >
                  <Users className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setActiveTab("upload"); setSelectedCandidate(null); }}
                  className={`p-1.5 rounded-lg text-xs transition ${activeTab === "upload" ? "text-indigo-400 bg-slate-800" : "text-slate-400"}`}
                  title="Upload"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-white"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </nav>
            </div>
          </header>
        </>
      ) : null}

      {/* Main Container Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {!user ? (
            // AUTH MODULE (Interactive Form - Polished Light Theme Card)
            <div className="max-w-md mx-auto my-12 bg-white border border-slate-200 p-8 rounded-2xl space-y-6 shadow-md shadow-slate-100 relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/50 rounded-full blur-2xl -z-10" />
              <div className="text-center space-y-2">
                <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mx-auto shadow-sm">
                  <Cpu className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight font-display">Access AI Recruiter Pro</h2>
                <p className="text-xs text-slate-500">Collaborative Multi-Agent platform for hiring managers.</p>
              </div>

              <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4 text-left">
                {isRegistering && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Muhammad Talha Jahangir"
                      className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none transition shadow-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none transition shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Security Key</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none transition shadow-sm"
                  />
                </div>

                {authError && (
                  <p className="text-xs font-semibold text-rose-500 font-mono text-center">{authError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg transition shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  {isRegistering ? "Register New Account" : "Sign In to Platform"}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setAuthError("");
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-500 font-semibold transition"
                >
                  {isRegistering ? "Already have an account? Sign In" : "Need recruiter credentials? Register Now"}
                </button>
              </div>
            </div>
          ) : isEvaluating && selectedCandidate && selectedJob ? (
            // BOARDROOM PIPELINE MODULE (Active Multi-Agent Screening Room)
            <div className="max-w-5xl mx-auto">
              <AgentBoardroom
                job={selectedJob}
                candidate={selectedCandidate}
                onEvaluationComplete={handleEvaluationComplete}
                onCancel={() => setIsEvaluating(false)}
              />
            </div>
          ) : (
            // MAIN APPLICATION CONTENT
            <div className="space-y-6">
              {/* Dashboard Tab */}
              {activeTab === "dashboard" && (
                <Dashboard
                  jobs={jobs}
                  candidates={candidates}
                  onNavigate={(tab) => {
                    setActiveTab(tab);
                    setSelectedCandidate(null);
                  }}
                  onSelectJob={(j) => {
                    setSelectedJob(j);
                    setSelectedCandidate(null);
                  }}
                />
              )}

              {/* Job Manager Tab */}
              {activeTab === "jobs" && (
                <JobManager
                  jobs={jobs}
                  onAddJob={handleAddJob}
                  onUpdateJob={handleUpdateJob}
                  onDeleteJob={handleDeleteJob}
                />
              )}

              {/* Ingest Tab */}
              {activeTab === "upload" && (
                <ResumeUploader
                  jobs={jobs}
                  onUploadCandidate={handleAddCandidate}
                  onUploadAndScreen={handleUploadAndScreenCandidate}
                  onNavigate={(t) => {
                    setActiveTab(t);
                    if (jobs.length > 0) setSelectedJob(jobs[0]);
                  }}
                />
              )}

              {/* Candidate List & Detailed Analysis Tab */}
              {activeTab === "candidates" && (
                <div className="space-y-6">
                  {selectedCandidate ? (
                    // Deep Profile view
                    <div className="space-y-4 text-left">
                      <button
                        onClick={() => setSelectedCandidate(null)}
                        className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 transition"
                      >
                        ← Back to Applicants Table
                      </button>
                      <CandidateProfileView
                        candidate={selectedCandidate}
                        job={jobs.find((j) => j.id === selectedCandidate.jobId) || selectedJob!}
                        onRunEvaluation={() => setIsEvaluating(true)}
                        onUpdateNotes={handleUpdateNotes}
                        onUpdateEmails={handleUpdateEmails}
                      />
                    </div>
                  ) : (
                    // Candidates list - Polished Light Theme Card
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-left space-y-6 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                        <div className="space-y-1">
                          <h2 className="text-lg font-bold text-slate-900 tracking-tight font-display">Active Applicants Stack</h2>
                          <p className="text-xs text-slate-500">Select a target job and review matching ratings or trigger multi-agent evaluation.</p>
                        </div>

                        {/* Job selector */}
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Filter Job:</span>
                          <select
                            id="active-job-filter"
                            value={selectedJob?.id || ""}
                            onChange={(e) => {
                              const j = jobs.find((jb) => jb.id === e.target.value);
                              if (j) setSelectedJob(j);
                            }}
                            className="bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none transition max-w-xs shadow-sm"
                          >
                            {jobs.map((j) => (
                              <option key={j.id} value={j.id}>{j.title}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Applicants Table */}
                      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                        <table className="w-full text-xs text-left border-collapse bg-white">
                          <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="p-4">Candidate</th>
                              <th className="p-4">Contact Details</th>
                              <th className="p-4">Compliance Status</th>
                              <th className="p-4">Hiring Recommendation</th>
                              <th className="p-4 text-center">Match Score</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {activeJobCandidates.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400 text-xs font-medium">
                                  No applicants registered for this job position. Click "Ingest Resumes" to add profiles.
                                </td>
                              </tr>
                            ) : (
                              activeJobCandidates.map((cand) => (
                                <tr key={cand.id} className="hover:bg-slate-50/50 transition duration-150">
                                  <td className="p-4 font-bold text-slate-900 text-sm">{cand.name}</td>
                                  <td className="p-4 space-y-0.5 text-slate-500">
                                    <p>{cand.email}</p>
                                    <p className="font-mono text-[10px] text-slate-400">{cand.phone}</p>
                                  </td>
                                  <td className="p-4">
                                    {cand.eligibilityStatus === "Pending" ? (
                                      <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">PENDING</span>
                                    ) : cand.eligibilityStatus === "Eligible" ? (
                                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">ELIGIBLE</span>
                                    ) : (
                                      <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">REJECTED</span>
                                    )}
                                  </td>
                                  <td className="p-4 font-medium">
                                    {cand.report?.hiringRecommendation?.recommendation ? (
                                      <span className={`font-bold tracking-tight ${
                                        cand.report.hiringRecommendation.recommendation === "Strong Hire" ? "text-emerald-600" :
                                        cand.report.hiringRecommendation.recommendation === "Hire" ? "text-indigo-600" :
                                        cand.report.hiringRecommendation.recommendation === "Consider" ? "text-amber-600" : "text-rose-600"
                                      }`}>
                                        {cand.report.hiringRecommendation.recommendation}
                                      </span>
                                    ) : cand.eligibilityStatus === "Rejected" ? (
                                      <span className="text-rose-600 font-bold">Rejected (Compliance)</span>
                                    ) : (
                                      <span className="text-slate-400 font-medium">Not Evaluated</span>
                                    )}
                                  </td>
                                  <td className="p-4 text-center font-bold text-sm font-mono text-indigo-600">
                                    {cand.matchScore > 0 ? `${cand.matchScore}%` : "—"}
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => setSelectedCandidate(cand)}
                                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[11px] rounded-lg transition shadow-sm"
                                      >
                                        {cand.eligibilityStatus === "Pending" ? "Run Audit" : "View Report"}
                                      </button>
                                      {candidateIdToDelete === cand.id ? (
                                        <div className="flex items-center gap-1.5 animate-fade-in">
                                          <button
                                            onClick={() => {
                                              handleDeleteCandidate(cand.id);
                                              setCandidateIdToDelete(null);
                                            }}
                                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-md transition shadow-sm cursor-pointer"
                                          >
                                            Confirm
                                          </button>
                                          <button
                                            onClick={() => setCandidateIdToDelete(null)}
                                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] rounded-md border border-slate-200 transition cursor-pointer"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setCandidateIdToDelete(cand.id);
                                          }}
                                          className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 rounded-lg transition text-[11px] font-semibold cursor-pointer"
                                        >
                                          Delete
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Corporate footer - Polished Light Theme */}
        <footer className="bg-white border-t border-slate-200 py-6 text-slate-400 text-xs">
          <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4 font-mono">
            <p>© 2026 AI Recruiter Pro Platform. Muhammad Talha Jahangir.</p>
            <p className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-slate-300" /> Client Storage Persistence • Gemini Server Node 3000
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
