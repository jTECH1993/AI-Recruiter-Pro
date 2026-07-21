import React, { useState, useEffect, useRef } from "react";
import { Cpu, Briefcase, Users, Upload, LogOut, LogIn, Key, UserCheck, Shield, Sparkles, PlusCircle, LayoutDashboard, Database, Loader2, Sun, Moon, CheckCircle, Eye, EyeOff, Building2, Save } from "lucide-react";
import { Job, Candidate, EvaluationReport, UserProfile, AppNotification } from "./types";
import { PRELOADED_JOBS, PRELOADED_CANDIDATES } from "./data";
import { auth, db } from "./firebase";
import { initializeApp as initializeSecondaryApp, deleteApp as deleteSecondaryApp } from "firebase/app";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  getAuth as getSecondaryAuth,
  createUserWithEmailAndPassword as createSecondaryUser,
  signOut as signSecondaryOut,
  sendPasswordResetEmail,
  confirmPasswordReset
} from "firebase/auth";
import {
  collection,
  collectionGroup,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  onSnapshot,
  getDoc,
  query,
  where
} from "firebase/firestore";

// Component imports
import Dashboard from "./components/Dashboard";
import JobManager from "./components/JobManager";
import ResumeUploader from "./components/ResumeUploader";
import CandidateProfileView from "./components/CandidateProfileView";
import AgentBoardroom from "./components/AgentBoardroom";
import ApplicantDashboard from "./components/ApplicantDashboard";
import AdminDashboard from "./components/AdminDashboard";
import NotificationBell from "./components/NotificationBell";
import { AppLogo, JtechLogo, JtechBrandBanner } from "./components/BrandingLogo";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [candidateIdToDelete, setCandidateIdToDelete] = useState<string | null>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Dark Mode state (synchronized with localStorage)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // Toggle dark class on html tag
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Reset scroll to top on any view/tab changes
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    // Deep scroll-to-top across layout layers to address all browser engine quirks
    window.scrollTo({ top: 0, behavior: "instant" as any });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab, selectedCandidate, isEvaluating]);

  // Auth States (Now connected to real Firebase)
  const [user, setUser] = useState<{ uid: string; email: string; name: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authCompany, setAuthCompany] = useState("");
  const [authRole, setAuthRole] = useState<"hr" | "applicant" | "admin">("hr");
  const [authCode, setAuthCode] = useState("");
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSource, setRegistrationSource] = useState<"tab" | "link">("tab");
  const [authError, setAuthError] = useState("");
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [hrPasscode, setHrPasscode] = useState("HR999");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<"email" | "reset">("email");
  const [resetKey, setResetKey] = useState("");
  const [resetSuccessMessage, setResetSuccessMessage] = useState("");

  // User profile edit states
  const [profileNameInput, setProfileNameInput] = useState("");
  const [profileCompanyName, setProfileCompanyName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileLocation, setProfileLocation] = useState("");
  const [profileHeadline, setProfileHeadline] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileWebsite, setProfileWebsite] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Sync profile edit inputs whenever profile updates
  useEffect(() => {
    if (profile) {
      setProfileNameInput(profile.name || "");
      setProfileCompanyName(profile.companyName || "");
      setProfilePhone(profile.phone || "");
      setProfileLocation(profile.location || "");
      setProfileHeadline(profile.headline || "");
      setProfileBio(profile.bio || "");
      setProfileWebsite(profile.website || "");
    }
  }, [profile]);

  // Load & Sync from Firestore
  useEffect(() => {
    let unsubscribeJobs: (() => void) | null = null;
    let unsubscribeCandidates: (() => void) | null = null;
    let unsubscribeUsers: (() => void) | null = null;
    let unsubscribeNotifications: (() => void) | null = null;
    let unsubscribeConfig: (() => void) | null = null;

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
      if (unsubscribeUsers) {
        unsubscribeUsers();
        unsubscribeUsers = null;
      }
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
        unsubscribeNotifications = null;
      }
      if (unsubscribeConfig) {
        unsubscribeConfig();
        unsubscribeConfig = null;
      }

      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.displayName || firebaseUser.email!.split("@")[0],
        });

        try {
          // Fetch user profile from Firestore to determine their role
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          let userProfile: UserProfile;
          const isHardcodedAdmin = firebaseUser.email?.toLowerCase() === "mtalhajahangir@mnsuet.edu.pk" || firebaseUser.email?.toLowerCase() === "admin@recruiter.pro" || firebaseUser.email?.toLowerCase() === "admin@airecruiter.pro";
          const resolvedRole = isHardcodedAdmin ? "admin" : "hr";

          if (!userDocSnap.exists()) {
            // Default fallback if document doesn't exist yet
            const defaultAcct = isHardcodedAdmin
              ? `ADMIN-${Math.floor(100 + Math.random() * 900)}`
              : `HR-${Math.floor(100000 + Math.random() * 900000)}`;
            userProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email!.split("@")[0],
              email: firebaseUser.email!,
              role: resolvedRole,
              accountNumber: defaultAcct,
              companyName: "",
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, userProfile);
          } else {
            const data = userDocSnap.data();
            userProfile = {
              uid: data.uid,
              name: data.name || firebaseUser.displayName || firebaseUser.email!.split("@")[0],
              email: data.email || firebaseUser.email!,
              role: isHardcodedAdmin ? "admin" : (data.role || "hr"),
              accountNumber: data.accountNumber || (isHardcodedAdmin ? `ADMIN-${Math.floor(100 + Math.random() * 900)}` : `HR-${Math.floor(100000 + Math.random() * 900000)}`),
              companyName: data.companyName || "",
              phone: data.phone || "",
              location: data.location || "",
              headline: data.headline || "",
              bio: data.bio || "",
              website: data.website || "",
              createdAt: data.createdAt || new Date().toISOString(),
            };
            if (!data.role || !data.accountNumber || (isHardcodedAdmin && data.role !== "admin")) {
              await setDoc(userDocRef, userProfile, { merge: true });
            }
          }
          setProfile(userProfile);

          // Realtime sync of notifications for the authenticated user
          let notifQuery;
          if (userProfile.role === "admin") {
            notifQuery = collection(db, "notifications");
          } else {
            notifQuery = query(collection(db, "notifications"), where("userId", "==", firebaseUser.uid));
          }

          unsubscribeNotifications = onSnapshot(notifQuery, (snapshot) => {
            const list: AppNotification[] = [];
            snapshot.forEach((doc) => {
              list.push(doc.data() as AppNotification);
            });
            // Sort by newest first
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setNotifications(list);
          });

          // Now subscribe depending on the role!
          if (userProfile.role === "hr") {
            const userHasSeeded = (userDocSnap.data() as any)?.hasSeeded === true;

            // Seed initial sample jobs and candidates for HR users if their collection is empty
            if (!userHasSeeded) {
              try {
                const freshJobsSnapshot = await getDocs(collection(db, "users", firebaseUser.uid, "jobs"));
                if (freshJobsSnapshot.empty) {
                  console.log(`Seeding initial jobs for user ${firebaseUser.uid} into Firestore...`);
                  for (const job of PRELOADED_JOBS) {
                    const jobWithHR = {
                      ...job,
                      hrId: firebaseUser.uid,
                      hrName: userProfile.name,
                      hrEmail: userProfile.email
                    };
                    await setDoc(doc(db, "users", firebaseUser.uid, "jobs", job.id), jobWithHR);
                  }
                }

                const freshCandidatesSnapshot = await getDocs(collection(db, "users", firebaseUser.uid, "candidates"));
                if (freshCandidatesSnapshot.empty) {
                  console.log(`Seeding initial candidates for user ${firebaseUser.uid} into Firestore...`);
                  for (const cand of PRELOADED_CANDIDATES) {
                    const candWithHR = {
                      ...cand,
                      hrId: firebaseUser.uid
                    };
                    await setDoc(doc(db, "users", firebaseUser.uid, "candidates", cand.id), candWithHR);
                  }
                }
              } catch (seedErr) {
                console.error("Error seeding initial HR collections:", seedErr);
              } finally {
                await setDoc(userDocRef, { hasSeeded: true }, { merge: true });
              }
            }

            // Realtime sync HR-specific Jobs & Candidates
            unsubscribeJobs = onSnapshot(collection(db, "users", firebaseUser.uid, "jobs"), (snapshot) => {
              const jobsList: Job[] = [];
              snapshot.forEach((doc) => {
                jobsList.push(doc.data() as Job);
              });
              setJobs(jobsList);
            });

            unsubscribeCandidates = onSnapshot(collection(db, "users", firebaseUser.uid, "candidates"), (snapshot) => {
              const candidatesList: Candidate[] = [];
              snapshot.forEach((doc) => {
                candidatesList.push(doc.data() as Candidate);
              });
              setCandidates(candidatesList);
            });

          } else if (userProfile.role === "admin") {
            // Subscribe to dynamic HR Passcode system configuration
            unsubscribeConfig = onSnapshot(doc(db, "system", "config"), (docSnap) => {
              if (docSnap.exists()) {
                const data = docSnap.data();
                if (data && data.hrPasscode) {
                  setHrPasscode(data.hrPasscode);
                }
              }
            });

            // ADMIN logic: Realtime listeners for users, all jobs, and all candidates
            unsubscribeUsers = onSnapshot(collection(db, "users"), (usersSnap) => {
              const userList: UserProfile[] = [];
              usersSnap.forEach((doc) => {
                userList.push(doc.data() as UserProfile);
              });
              setAllUsers(userList);
            });

            // ADMIN Realtime sync for ALL jobs
            unsubscribeJobs = onSnapshot(collectionGroup(db, "jobs"), (snapshot) => {
              const jobsMap = new Map<string, Job>();
              snapshot.forEach((jDoc) => {
                const jData = jDoc.data() as Job;
                if (jData && jData.id) {
                  jobsMap.set(jData.id, jData);
                }
              });
              setJobs(Array.from(jobsMap.values()));
            });

            // ADMIN Realtime sync for ALL candidates
            unsubscribeCandidates = onSnapshot(collectionGroup(db, "candidates"), (snapshot) => {
              const candMap = new Map<string, Candidate>();
              snapshot.forEach((cDoc) => {
                const cData = cDoc.data() as Candidate;
                if (cData && cData.id) {
                  candMap.set(cData.id, cData);
                }
              });
              setCandidates(Array.from(candMap.values()));
            });

          } else {
            // APPLICANT / CANDIDATE logic: Realtime listeners for users, active jobs, and applicant's own applications
            unsubscribeUsers = onSnapshot(collection(db, "users"), (usersSnap) => {
              const userList: UserProfile[] = [];
              usersSnap.forEach((doc) => {
                userList.push(doc.data() as UserProfile);
              });
              setAllUsers(userList);
            });

            // CANDIDATE Realtime sync for ALL active jobs across HR postings
            unsubscribeJobs = onSnapshot(collectionGroup(db, "jobs"), (snapshot) => {
              const activeJobsMap = new Map<string, Job>();
              snapshot.forEach((jDoc) => {
                const jData = jDoc.data() as Job;
                if (jData && jData.id) {
                  activeJobsMap.set(jData.id, {
                    ...jData,
                    hrId: jData.hrId || jDoc.ref.parent.parent?.id || ""
                  });
                }
              });

              // Always include default preloaded vacancies (e.g., AI Architect) if not already present in Firestore
              for (const preJob of PRELOADED_JOBS) {
                if (!activeJobsMap.has(preJob.id)) {
                  activeJobsMap.set(preJob.id, preJob);
                }
              }

              setJobs(Array.from(activeJobsMap.values()));
            }, (error) => {
              console.error("Error subscribing to jobs for candidate:", error);
              setJobs(PRELOADED_JOBS);
            });

            // CANDIDATE Realtime sync for applicant's own applications
            const candQuery = query(collectionGroup(db, "candidates"), where("candidateUid", "==", firebaseUser.uid));
            unsubscribeCandidates = onSnapshot(candQuery, (snapshot) => {
              const myAppsMap = new Map<string, Candidate>();
              snapshot.forEach((cDoc) => {
                const cData = cDoc.data() as Candidate;
                if (cData && cData.id) {
                  myAppsMap.set(cData.id, cData);
                }
              });
              setCandidates(Array.from(myAppsMap.values()));
            });
          }

        } catch (err) {
          console.error("Error loading user profile or syncing:", err);
        }

        setFirebaseLoading(false);
      } else {
        setUser(null);
        setProfile(null);
        setJobs([]);
        setCandidates([]);
        setAllUsers([]);
        setFirebaseLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeJobs) unsubscribeJobs();
      if (unsubscribeCandidates) unsubscribeCandidates();
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeNotifications) unsubscribeNotifications();
      if (unsubscribeConfig) unsubscribeConfig();
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

  // Firestore update handlers (Fully isolated per user)
  const handleAddJob = async (newJob: Job) => {
    if (!user) return;
    try {
      const activeCompany = newJob.company || profile?.companyName || "Organization";
      const jobWithHR = {
        ...newJob,
        company: activeCompany,
        hrId: user.uid,
        hrName: profile?.name || user.name,
        hrEmail: profile?.email || user.email,
        hrCompany: profile?.companyName || activeCompany
      };
      await setDoc(doc(db, "users", user.uid, "jobs", newJob.id), jobWithHR);
    } catch (err) {
      console.error("Error adding job to Firestore:", err);
    }
  };

  const handleUpdateJob = async (updatedJob: Job) => {
    if (!user) return;
    try {
      const activeCompany = updatedJob.company || profile?.companyName || "Organization";
      const jobWithHR = {
        ...updatedJob,
        company: activeCompany,
        hrId: updatedJob.hrId || user.uid,
        hrName: updatedJob.hrName || profile?.name || user.name,
        hrEmail: updatedJob.hrEmail || profile?.email || user.email,
        hrCompany: profile?.companyName || activeCompany
      };
      await setDoc(doc(db, "users", user.uid, "jobs", updatedJob.id), jobWithHR);
    } catch (err) {
      console.error("Error updating job in Firestore:", err);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!user) return;

    const targetJob = jobs.find((j) => j.id === id);
    const targetHrId = targetJob?.hrId || user.uid;

    // Instantly filter out deleted job and associated candidates from React state
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setCandidates((prev) => prev.filter((c) => c.jobId !== id));

    if (selectedJob?.id === id) {
      const remaining = jobs.filter((j) => j.id !== id);
      setSelectedJob(remaining.length > 0 ? remaining[0] : null);
    }

    try {
      // 1. Delete job from target HR document location in Firestore
      await deleteDoc(doc(db, "users", targetHrId, "jobs", id));

      // 2. Fallback delete from current logged-in user doc location if different
      if (targetHrId !== user.uid) {
        try {
          await deleteDoc(doc(db, "users", user.uid, "jobs", id));
        } catch (_) {}
      }

      // 3. Delete from any other user's job collection where doc id === id or job.id === id
      try {
        const jobsGroupSnap = await getDocs(collectionGroup(db, "jobs"));
        for (const jDoc of jobsGroupSnap.docs) {
          if (jDoc.id === id || jDoc.data()?.id === id) {
            await deleteDoc(jDoc.ref);
          }
        }
      } catch (e) {
        console.error("Error purging duplicate job docs across collections:", e);
      }

      // 4. Delete candidates associated with this jobId in Firestore across all subcollections
      try {
        const candsGroupSnap = await getDocs(collectionGroup(db, "candidates"));
        for (const cDoc of candsGroupSnap.docs) {
          if (cDoc.data()?.jobId === id) {
            await deleteDoc(cDoc.ref);
          }
        }
      } catch (e) {
        console.error("Error purging candidates for deleted job:", e);
      }

      await setDoc(doc(db, "users", user.uid), { hasSeeded: true }, { merge: true });
    } catch (err) {
      console.error("Error deleting job in Firestore:", err);
    }
  };

  const handleAddCandidate = async (newCand: Candidate) => {
    if (!user) return;
    try {
      const candidateWithHR = {
        ...newCand,
        hrId: newCand.hrId || user.uid
      };
      await setDoc(doc(db, "users", user.uid, "candidates", newCand.id), candidateWithHR);
    } catch (err) {
      console.error("Error adding candidate in Firestore:", err);
    }
  };

  const handleUploadAndScreenCandidate = async (newCand: Candidate, targetJob: Job) => {
    if (!user) return;
    try {
      const candidateWithHR = {
        ...newCand,
        hrId: targetJob.hrId || user.uid
      };
      // 1. Add candidate to isolated Firestore store
      await setDoc(doc(db, "users", targetJob.hrId || user.uid, "candidates", newCand.id), candidateWithHR);
      
      // 2. State selection
      setSelectedJob(targetJob);
      setSelectedCandidate(candidateWithHR);
      
      // 3. Launch active multi-agent evaluation boardroom
      setIsEvaluating(true);
    } catch (err) {
      console.error("Error in direct upload and screen pipeline:", err);
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    if (!user) return;
    const cand = candidates.find((c) => c.id === id);
    const targetHrId = cand?.hrId || user.uid;
    try {
      await deleteDoc(doc(db, "users", targetHrId, "candidates", id));
      if (selectedCandidate?.id === id) setSelectedCandidate(null);
    } catch (err) {
      console.error("Error deleting candidate in Firestore:", err);
    }
  };

  const handleEvaluationComplete = async (report: EvaluationReport) => {
    if (!user || !selectedCandidate) return;

    let interviewMessage = "";
    if (report.eligibilityReport.status === "Eligible") {
      const score = report.hiringRecommendation?.match_score || 85;
      interviewMessage = `Congratulations! Our AI recruiting boardroom has reviewed your CV and qualifications. With a compatibility score of ${score}%, you have been selected for an interview! An HR representative from our team will contact you shortly via email (${selectedCandidate.email}) to coordinate dates.`;
    } else {
      interviewMessage = `Thank you for your interest. After conducting a screening using our multi-agent boardroom, we regret to inform you that your profile does not meet the necessary skills/experience thresholds for this specific vacancy. We will keep your CV in our database for future positions.`;
    }

    const freshCandidate = {
      ...selectedCandidate,
      matchScore: report.hiringRecommendation?.match_score || 0,
      eligibilityStatus: report.eligibilityReport.status,
      evaluatedAt: new Date().toISOString(),
      report,
      interviewMessage
    };

    const targetHrId = selectedCandidate.hrId || user.uid;

    try {
      await setDoc(doc(db, "users", targetHrId, "candidates", selectedCandidate.id), freshCandidate);
      setSelectedCandidate(freshCandidate);
    } catch (err) {
      console.error("Error updating candidate after evaluation in Firestore:", err);
    }
    setIsEvaluating(false);
  };

  const handleUpdateNotes = async (candId: string, notes: string) => {
    if (!user) return;
    const cand = candidates.find((c) => c.id === candId);
    if (!cand) return;
    const updatedCand = { ...cand, notes };
    const targetHrId = cand.hrId || user.uid;
    try {
      await setDoc(doc(db, "users", targetHrId, "candidates", candId), updatedCand);
      if (selectedCandidate?.id === candId) setSelectedCandidate(updatedCand);
    } catch (err) {
      console.error("Error updating candidate notes in Firestore:", err);
    }
  };

  const handleUpdateEmails = async (candId: string, emails: any) => {
    if (!user) return;
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
    const targetHrId = cand.hrId || user.uid;
    try {
      await setDoc(doc(db, "users", targetHrId, "candidates", candId), updatedCand);
      if (selectedCandidate?.id === candId) setSelectedCandidate(updatedCand);
    } catch (err) {
      console.error("Error updating candidate emails in Firestore:", err);
    }
  };

  // Candidate/Applicant Dashboard Interaction handlers
  const handleApplyJobByCandidate = async (newCand: Candidate, hrId: string) => {
    try {
      // Find the associated job posting
      const targetJob = jobs.find((j) => j.id === newCand.jobId);
      if (!targetJob) {
        throw new Error("Target job posting not found.");
      }

      const appliedAt = newCand.appliedAt || new Date().toISOString();
      const resultsAvailableAt = newCand.resultsAvailableAt || new Date(Date.now() + 5 * 60 * 1000).toISOString();

      const preparedCandidate = {
        ...newCand,
        appliedAt,
        resultsAvailableAt,
        eligibilityStatus: "Pending" as const, // Keep Pending initially in the UI
      };

      // 1. Save candidate to Firestore
      await setDoc(doc(db, "users", hrId, "candidates", preparedCandidate.id), preparedCandidate);

      // 2. Create notification for HR
      const hrNotificationId = "notif-" + Date.now() + "-hr";
      await setDoc(doc(db, "notifications", hrNotificationId), {
        id: hrNotificationId,
        userId: hrId,
        title: "New CV Submitted",
        message: `${preparedCandidate.name} has submitted a CV for your job posting "${targetJob.title}".`,
        type: "application_submitted",
        createdAt: new Date().toISOString(),
        isRead: false,
        jobId: targetJob.id,
        candidateId: preparedCandidate.id,
      });

      // 3. Create notification for the Candidate confirming submission
      const candNotificationId = "notif-" + Date.now() + "-cand";
      await setDoc(doc(db, "notifications", candNotificationId), {
        id: candNotificationId,
        userId: preparedCandidate.candidateUid || "",
        title: "Application Received",
        message: `Your application for "${targetJob.title}" was received. Our AI multi-agent boardroom is screening your CV. Results will be ready in 5 minutes.`,
        type: "application_submitted",
        createdAt: new Date().toISOString(),
        isRead: false,
        jobId: targetJob.id,
        candidateId: preparedCandidate.id,
      });

      // 4. Fire background screening immediately (non-blocking)
      (async () => {
        try {
          console.log(`Starting background screening for candidate: ${preparedCandidate.name}`);
          const response = await fetch("/api/evaluate-candidate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              job: targetJob,
              candidateName: preparedCandidate.name,
              resumeText: preparedCandidate.resumeText,
            }),
          });

          if (!response.ok) {
            throw new Error("Evaluation API returned error");
          }

          const report = await response.json();
          
          let interviewMessage = "";
          const score = report.hiringRecommendation?.match_score || 0;
          const status = report.eligibilityReport?.status || "Pending";

          if (status === "Eligible") {
            interviewMessage = `Congratulations! Our AI recruiting boardroom has reviewed your CV and qualifications. With a compatibility score of ${score}%, you have been selected for an interview! An HR representative from our team will contact you shortly via email (${preparedCandidate.email}) to coordinate dates.`;
          } else {
            interviewMessage = `Thank you for your interest. After conducting a screening using our multi-agent boardroom, we regret to inform you that your profile does not meet the necessary skills/experience thresholds for this specific vacancy. We will keep your CV in our database for future positions.`;
          }

          const evaluatedCandidate = {
            ...preparedCandidate,
            matchScore: score,
            eligibilityStatus: status,
            evaluatedAt: new Date().toISOString(),
            report,
            interviewMessage,
          };

          // Update candidate document in Firestore with screening results
          await setDoc(doc(db, "users", hrId, "candidates", preparedCandidate.id), evaluatedCandidate);
          console.log(`Background screening complete for candidate: ${preparedCandidate.name}. Score: ${score}%`);

          // Create screening complete notification for HR
          const hrCompleteId = "notif-" + Date.now() + "-hrc";
          await setDoc(doc(db, "notifications", hrCompleteId), {
            id: hrCompleteId,
            userId: hrId,
            title: "CV Screening Complete",
            message: `AI Boardroom has completed screening ${preparedCandidate.name} for "${targetJob.title}". Score: ${score}%.`,
            type: "screening_complete",
            createdAt: new Date().toISOString(),
            isRead: false,
            jobId: targetJob.id,
            candidateId: preparedCandidate.id,
          });

          // Create notification for Candidate
          const candCompleteId = "notif-" + Date.now() + "-candc";
          await setDoc(doc(db, "notifications", candCompleteId), {
            id: candCompleteId,
            userId: preparedCandidate.candidateUid || "",
            title: "AI Screening Complete",
            message: `Your AI screening results for "${targetJob.title}" are ready. They will unlock in your portal 5 minutes after submission.`,
            type: "screening_complete",
            createdAt: new Date().toISOString(),
            isRead: false,
            jobId: targetJob.id,
            candidateId: preparedCandidate.id,
          });

        } catch (bgErr) {
          console.error("Error in background candidate evaluation pipeline:", bgErr);
        }
      })();

    } catch (err) {
      console.error("Error submitting candidate CV as applicant:", err);
      throw err;
    }
  };

  const handleWithdrawJobByCandidate = async (cand: Candidate) => {
    if (!cand.hrId) return;
    try {
      const updatedCand = {
        ...cand,
        withdrawn: true,
        interviewMessage: "You have withdrawn your application for this job posting."
      };
      await setDoc(doc(db, "users", cand.hrId, "candidates", cand.id), updatedCand);
    } catch (err) {
      console.error("Error withdrawing application:", err);
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
      // Auto-provision admin if logging in with dynamic fallback
      const normEmail = authEmail.toLowerCase().trim();
      const isTargetAdmin = normEmail === "admin@recruiter.pro" || normEmail === "admin@airecruiter.pro" || normEmail === "mtalhajahangir@mnsuet.edu.pk";
      if (isTargetAdmin && authPassword === "Admin777!" && (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-disabled")) {
        try {
          // Attempt to register this admin account automatically
          const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
          await updateProfile(userCredential.user, { displayName: "System Administrator" });
          
          await setDoc(doc(db, "users", userCredential.user.uid), {
            uid: userCredential.user.uid,
            name: "System Administrator",
            email: normEmail,
            role: "admin",
            accountNumber: `ADMIN-${Math.floor(100 + Math.random() * 900)}`,
            createdAt: new Date().toISOString(),
          });
          
          setAuthEmail("");
          setAuthPassword("");
          return;
        } catch (createErr) {
          console.error("Auto-create admin error:", createErr);
        }
      }

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

    if (authRole === "hr" && !authCompany.trim()) {
      setAuthError("Please enter your Organization / Company Name.");
      return;
    }

    // Role authentication verification
    if (authRole === "hr") {
      let activeHrPasscode = "HR999";
      try {
        const configSnap = await getDoc(doc(db, "system", "config"));
        if (configSnap.exists()) {
          const configData = configSnap.data();
          if (configData && configData.hrPasscode) {
            activeHrPasscode = configData.hrPasscode.trim();
          }
        }
      } catch (e) {
        console.error("Error reading system passcode, falling back to default:", e);
      }
      
      if (authCode.trim() !== activeHrPasscode) {
        setAuthError("Unauthorized: Invalid HR Recruiter authorization passcode.");
        return;
      }
    }
    if (authRole === "admin" && authCode.trim() !== "ADMIN777") {
      setAuthError("Unauthorized: Invalid System Admin authorization passcode.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      await updateProfile(userCredential.user, { displayName: authName });

      const randNum = Math.floor(100000 + Math.random() * 900000);
      const accountNumber = authRole === "hr" 
        ? `HR-${randNum}` 
        : authRole === "applicant" 
        ? `CAND-${randNum}` 
        : `ADMIN-${Math.floor(100 + Math.random() * 900)}`;

      // Save user details to Firestore 'users' collection to fulfill "authentication using firestore"
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: authName,
        email: authEmail.trim().toLowerCase(),
        role: authRole,
        companyName: authRole === "hr" ? authCompany.trim() : "",
        accountNumber,
        createdAt: new Date().toISOString(),
      });

      // Reset inputs
      setAuthEmail("");
      setAuthPassword("");
      setAuthName("");
      setAuthCompany("");
      setAuthCode("");
      setIsRegistering(false);
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMsg = "Failed to register new account.";
      if (error.code === "auth/email-already-in-use") {
        errorMsg = "Email already registered. Please enter a different email address or sign in to your account.";
      } else if (error.code === "auth/weak-password") {
        errorMsg = "Password should be at least 6 characters.";
      } else if (error.code === "auth/invalid-email") {
        errorMsg = "Please enter a valid email address.";
      }
      setAuthError(errorMsg);
    }
  };

  const handleSaveUserProfile = async (e?: React.FormEvent, customFields?: Partial<UserProfile>) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!user || !profile) return;
    setIsSavingProfile(true);
    setProfileSaveSuccess(false);

    try {
      const updatedName = (customFields?.name !== undefined ? customFields.name : profileNameInput).trim() || profile.name;
      const updatedCompany = (customFields?.companyName !== undefined ? customFields.companyName : profileCompanyName).trim();
      const updatedPhone = (customFields?.phone !== undefined ? customFields.phone : profilePhone).trim();
      const updatedLocation = (customFields?.location !== undefined ? customFields.location : profileLocation).trim();
      const updatedHeadline = (customFields?.headline !== undefined ? customFields.headline : profileHeadline).trim();
      const updatedBio = (customFields?.bio !== undefined ? customFields.bio : profileBio).trim();
      const updatedWebsite = (customFields?.website !== undefined ? customFields.website : profileWebsite).trim();

      const updatedProfile: UserProfile = {
        ...profile,
        name: updatedName,
        companyName: updatedCompany,
        phone: updatedPhone,
        location: updatedLocation,
        headline: updatedHeadline,
        bio: updatedBio,
        website: updatedWebsite
      };

      // 1. Save to users/{uid} in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: updatedName,
        companyName: updatedCompany,
        phone: updatedPhone,
        location: updatedLocation,
        headline: updatedHeadline,
        bio: updatedBio,
        website: updatedWebsite
      }, { merge: true });

      setProfile(updatedProfile);

      // 2. Update displayName in Auth if changed
      if (auth.currentUser && updatedName !== user.name) {
        await updateProfile(auth.currentUser, { displayName: updatedName });
        setUser(prev => prev ? { ...prev, name: updatedName } : null);
      }

      // 3. Update all existing jobs posted by this Manager in Firestore
      if (profile.role === "hr" || profile.role === "admin") {
        try {
          const userJobsSnap = await getDocs(collection(db, "users", user.uid, "jobs"));
          for (const jDoc of userJobsSnap.docs) {
            const jData = jDoc.data() as Job;
            await setDoc(doc(db, "users", user.uid, "jobs", jDoc.id), {
              ...jData,
              hrName: updatedName,
              hrCompany: updatedCompany,
              company: jData.company || updatedCompany
            }, { merge: true });
          }
        } catch (errJobs) {
          console.error("Error updating manager jobs with new info:", errJobs);
        }
      }

      // 4. Update Candidate applications in Firestore if applicant
      if (profile.role === "applicant") {
        try {
          const candsGroupSnap = await getDocs(collectionGroup(db, "candidates"));
          for (const cDoc of candsGroupSnap.docs) {
            if (cDoc.data()?.candidateUid === user.uid) {
              await setDoc(cDoc.ref, {
                name: updatedName,
                phone: updatedPhone || cDoc.data().phone,
              }, { merge: true });
            }
          }
        } catch (errCands) {
          console.error("Error updating candidate submissions with new info:", errCands);
        }
      }

      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 4000);
    } catch (err) {
      console.error("Error updating user profile:", err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setResetSuccessMessage("");

    const targetEmail = authEmail.trim().toLowerCase();

    if (!targetEmail) {
      setAuthError("Email address is required.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setResetSuccessMessage(`A password reset link has been sent to ${targetEmail}. Please check your inbox and click the link in the email to update your password.`);
    } catch (error: any) {
      console.error("Forgot password request error:", error);
      let errorMsg = "Failed to send reset link. Please check your email.";
      if (error.code === "auth/user-not-found") {
        errorMsg = "Please enter the registered email address that you entered during registration of your account.";
      } else if (error.code === "auth/invalid-email") {
        errorMsg = "Please enter a valid registered email address.";
      } else if (error.message) {
        errorMsg = error.message;
      }
      setAuthError(errorMsg);
    }
  };

  const handleForgotPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setResetSuccessMessage("");

    if (!resetKey || !authPassword) {
      setAuthError("Reset key and new password are required.");
      return;
    }

    if (authPassword.length < 6) {
      setAuthError("New password must be at least 6 characters.");
      return;
    }

    try {
      await confirmPasswordReset(auth, resetKey, authPassword);
      setResetSuccessMessage("Password reset successful! You can now log in with your new password.");
      setResetKey("");
      setAuthPassword("");
      setForgotPasswordStep("email");
      setIsForgotPassword(false);
    } catch (error: any) {
      console.error("Forgot password reset error:", error);
      let errorMsg = "Invalid or expired security reset key. Please request a new one.";
      if (error.code === "auth/invalid-action-code") {
        errorMsg = "The reset key is invalid or has already been used.";
      } else if (error.code === "auth/expired-action-code") {
        errorMsg = "The reset key has expired. Please request a new one.";
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

  const handleNotificationClick = (notif: AppNotification) => {
    const role = profile?.role;
    if (!role) return;

    if (role === "applicant") {
      setTimeout(() => {
        const elementId = `cand-card-${notif.candidateId}`;
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-indigo-500", "ring-offset-2", "scale-[1.01]", "dark:ring-offset-slate-900");
          setTimeout(() => {
            el.classList.remove("ring-2", "ring-indigo-500", "ring-offset-2", "scale-[1.01]", "dark:ring-offset-slate-900");
          }, 3000);
        }
      }, 100);
    } else if (role === "hr") {
      if (notif.candidateId) {
        const matchedCandidate = candidates.find(c => c.id === notif.candidateId);
        if (matchedCandidate) {
          setActiveTab("candidates");
          setSelectedCandidate(matchedCandidate);
          const matchingJob = jobs.find(j => j.id === matchedCandidate.jobId);
          if (matchingJob) {
            setSelectedJob(matchingJob);
          }
          return;
        }
      }

      if (notif.jobId) {
        const matchingJob = jobs.find(j => j.id === notif.jobId);
        if (matchingJob) {
          setActiveTab("candidates");
          setSelectedCandidate(null);
          setSelectedJob(matchingJob);
        }
      }
    } else if (role === "admin") {
      if (notif.jobId) {
        setTimeout(() => {
          const elementId = `admin-job-row-${notif.jobId}`;
          const el = document.getElementById(elementId);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("bg-indigo-50", "dark:bg-indigo-950/40");
            setTimeout(() => {
              el.classList.remove("bg-indigo-50", "dark:bg-indigo-950/40");
            }, 3000);
          }
        }, 100);
      }
    }
  };

  // Admin User Creation via secondary firebase auth instance (avoids signing out the currently logged in admin)
  const handleCreateUserByAdmin = async (name: string, email: string, password: string, role: "hr" | "applicant") => {
    const tempAppName = `adminProvision-${Date.now()}`;
    const tempApp = initializeSecondaryApp({
      apiKey: "AIzaSyCOxfuY32fnlTpYdpp4DJT2CejWm7YMcvg",
      authDomain: "hrcv-2d7ce.firebaseapp.com",
      projectId: "hrcv-2d7ce",
      storageBucket: "hrcv-2d7ce.firebasestorage.app",
      messagingSenderId: "329377738233",
      appId: "1:329377738233:web:0171f48e40cd7571d36128",
    }, tempAppName);

    try {
      const tempAuth = getSecondaryAuth(tempApp);
      const userCredential = await createSecondaryUser(tempAuth, email, password);
      const uid = userCredential.user.uid;

      const randNum = Math.floor(100000 + Math.random() * 900000);
      const accountNumber = role === "hr" ? `HR-${randNum}` : `CAND-${randNum}`;

      // Create their Firestore profile doc to fulfill "authentication using firestore"
      await setDoc(doc(db, "users", uid), {
        uid,
        name,
        email,
        role,
        accountNumber,
        createdAt: new Date().toISOString()
      });

      // Sign out of the temporary auth session
      await signSecondaryOut(tempAuth);
    } finally {
      // Always delete secondary app to clean up memory
      await deleteSecondaryApp(tempApp);
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
    <div className={`min-h-screen bg-[#F8FAFC] dark:bg-[#070C15] text-slate-900 dark:text-slate-100 flex flex-col ${user && profile?.role === "hr" ? "md:flex-row" : ""} font-sans antialiased SelectionColor transition-colors duration-250`}>
      {user ? (
        profile?.role === "hr" ? (
          <>
            {/* LEFT SIDEBAR (Desktop Only) */}
            <aside className="hidden md:flex flex-col w-64 bg-[#0F172A] text-slate-300 border-r border-slate-800 shrink-0">
              {/* Sidebar Brand Header */}
              <div className="p-5 border-b border-slate-800/80 flex flex-col gap-3 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
                <div className="flex items-center justify-between">
                  <AppLogo size="sm" />
                  <span className="text-[9px] bg-indigo-500/30 text-indigo-200 font-bold px-1.5 py-0.5 rounded uppercase">
                    HR Portal
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                  <JtechLogo size="sm" showText={true} />
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

                <button
                  onClick={() => {
                    setActiveTab("profile");
                    setSelectedCandidate(null);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === "profile" ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/10" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  Recruiter Profile
                </button>
              </nav>

              {/* Sidebar User Info & Logout */}
              <div className="p-3.5 border-t border-slate-800/85 bg-[#09101D] flex flex-col gap-2.5">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 bg-indigo-600/25 border border-indigo-500/20 text-indigo-300 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-inner shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-white leading-tight truncate">{user.name}</p>
                    <p className="text-[9px] text-slate-400 font-medium font-mono leading-tight mt-0.5 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 text-xs">
                  <span className="text-[10px] text-slate-500 font-mono font-medium">Session Active</span>
                  <div className="flex items-center space-x-1">
                    <NotificationBell 
                      notifications={notifications} 
                      userId={user.uid} 
                      placement="sidebar" 
                      onNotificationClick={handleNotificationClick} 
                    />
                    <button
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                      className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
                    >
                      {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-300" />}
                    </button>
                    <button
                      onClick={handleLogout}
                      title="Logout"
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            {/* MOBILE HEADER (Mobile Only) */}
            <header className="md:hidden w-full bg-[#0F172A] text-slate-300 border-b border-slate-800 sticky top-0 z-50">
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2" onClick={() => setActiveTab("dashboard")}>
                  <AppLogo size="sm" />
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
                    onClick={() => { setActiveTab("profile"); setSelectedCandidate(null); }}
                    className={`p-1.5 rounded-lg text-xs transition ${activeTab === "profile" ? "text-indigo-400 bg-slate-800" : "text-slate-400"}`}
                    title="Recruiter Profile"
                  >
                    <UserCheck className="w-4 h-4" />
                  </button>
                  <NotificationBell 
                    notifications={notifications} 
                    userId={user.uid} 
                    onNotificationClick={handleNotificationClick} 
                  />
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-1.5 rounded-lg text-xs transition text-slate-400 hover:text-white"
                    title="Toggle Dark Mode"
                  >
                    {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-300" />}
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
        ) : (
          /* APPLICANT or ADMIN Top Header */
          <header className="w-full bg-[#0F172A] text-slate-300 border-b border-slate-800 py-3.5 px-6 md:px-8 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center space-x-4">
              <AppLogo size="md" />
              <div className="hidden sm:block h-6 w-px bg-slate-800" />
              <div className="hidden sm:block">
                <JtechLogo size="sm" showText={true} />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="hidden sm:inline text-xs font-medium text-slate-300 font-mono">
                {profile?.name} ({profile?.email})
              </span>
              <NotificationBell 
                notifications={notifications} 
                userId={user.uid} 
                onNotificationClick={handleNotificationClick} 
              />
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
              >
                {isDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-indigo-300" />}
              </button>
              <button
                onClick={handleLogout}
                title="Logout"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </header>
        )
      ) : null}

      {/* Main Container Workspace */}
      <div ref={mainContentRef} className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {!user ? (
            // AUTH MODULE (Interactive Form - Polished Light Theme Card)
            <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl space-y-6 shadow-md shadow-slate-100 dark:shadow-none relative text-slate-900 dark:text-slate-100">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-full blur-2xl -z-10" />
              
              {/* Jtech Solution's Developer Banner */}
              <div className="flex items-center justify-center pb-2">
                <JtechLogo size="md" showText={true} />
              </div>

              <div className="text-center space-y-2 animate-fade-in border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex justify-center mb-1">
                  <AppLogo size="lg" layout="vertical" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isForgotPassword ? "Verify your identity to update your platform password." : "AI-Powered Recruitment & Talent Acquisition Platform for HR Teams, Recruiters, Interviewers & Job Applicants"}
                </p>
              </div>

              {isForgotPassword ? (
                <div className="space-y-4 text-left animate-fade-in">
                  <div className="border-b border-slate-100 pb-2 mb-2 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Reset Password
                    </h3>
                  </div>

                  {resetSuccessMessage ? (
                    <div className="space-y-4">
                      <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl border border-emerald-200 dark:border-emerald-800/40 font-medium leading-relaxed font-sans shadow-xs flex items-start gap-2.5">
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-emerald-900 dark:text-emerald-200 mb-1">Email Sent!</p>
                          <p>{resetSuccessMessage}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(false);
                          setAuthError("");
                          setResetSuccessMessage("");
                        }}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
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
                        <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed font-sans">
                          Enter your registered email address to receive a password reset link directly in your inbox.
                        </p>
                      </div>

                      {authError && (
                        <p className="text-xs font-semibold text-rose-500 font-mono text-center">{authError}</p>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg transition shadow-md shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Key className="w-4 h-4" />
                        Send Password Reset Link
                      </button>

                      <div className="flex justify-center items-center pt-2 border-t border-slate-100 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgotPassword(false);
                            setAuthError("");
                            setResetSuccessMessage("");
                          }}
                          className="text-xs text-slate-500 hover:text-indigo-600 font-semibold transition cursor-pointer"
                        >
                          ← Cancel & Sign In
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <>
                  {/* Modern Auth Switcher Tabs at the top / upper side */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-150/60 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(false);
                        setRegistrationSource("tab");
                        setAuthError("");
                        setResetSuccessMessage("");
                      }}
                      className={`py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        !isRegistering
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(true);
                        setAuthRole("hr");
                        setRegistrationSource("tab");
                        setAuthError("");
                        setResetSuccessMessage("");
                      }}
                      className={`py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        isRegistering && registrationSource === "tab" && authRole === "hr"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Register HR
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(true);
                        setAuthRole("applicant");
                        setRegistrationSource("tab");
                        setAuthError("");
                        setResetSuccessMessage("");
                      }}
                      className={`py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        isRegistering && registrationSource === "tab" && authRole === "applicant"
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Register Candidate
                    </button>
                  </div>

                  {resetSuccessMessage && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl border border-emerald-150 dark:border-emerald-900/40 font-medium leading-relaxed font-sans text-center">
                      {resetSuccessMessage}
                    </div>
                  )}

                  <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4 text-left">
                    {isRegistering && (
                      <>
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

                        {authRole === "hr" && (
                          <div className="animate-fade-in">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                              Company / Organization Name
                            </label>
                            <input
                              type="text"
                              required
                              value={authCompany}
                              onChange={(e) => setAuthCompany(e.target.value)}
                              placeholder="e.g., Jtech Solutions, Synapse Corp"
                              className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none transition shadow-sm"
                            />
                          </div>
                        )}
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Select Account Type</label>
                          <select
                            value={authRole}
                            onChange={(e) => {
                              setAuthRole(e.target.value as "hr" | "applicant");
                              setAuthCode("");
                            }}
                            className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-950 focus:outline-none transition shadow-sm font-sans cursor-pointer"
                          >
                            {registrationSource === "tab" ? (
                              authRole === "hr" ? (
                                <option value="hr">Hiring Manager / HR Recruiter</option>
                              ) : (
                                <option value="applicant">Candidate / Job Applicant</option>
                              )
                            ) : (
                              <>
                                <option value="hr">Hiring Manager / HR Recruiter</option>
                                <option value="applicant">Candidate / Job Applicant</option>
                              </>
                            )}
                          </select>
                        </div>

                        {authRole !== "applicant" && (
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-150 dark:border-slate-800 space-y-1.5 animate-fade-in">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Role Authorization Code</label>
                            <input
                              type="text"
                              required
                              value={authCode}
                              onChange={(e) => setAuthCode(e.target.value)}
                              placeholder={authRole === "hr" ? "Enter HR passkey" : "Enter Admin passkey"}
                              className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none transition shadow-sm font-mono"
                            />
                            <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold leading-relaxed">
                              {authRole === "hr" ? (
                                <span>* Contact system administrator to obtain the HR authorization passkey.</span>
                              ) : (
                                <span>* Contact system administrator to obtain the Admin passkey.</span>
                              )}
                            </p>
                          </div>
                        )}
                      </>
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
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Password</label>
                        {!isRegistering && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsForgotPassword(true);
                              setForgotPasswordStep("email");
                              setAuthError("");
                              setResetSuccessMessage("");
                            }}
                            className="text-[10px] text-indigo-600 hover:text-indigo-550 font-bold transition cursor-pointer font-sans"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg pl-3 pr-10 py-2 text-sm text-slate-900 focus:outline-none transition shadow-sm font-mono"
                        />
                        <button
                          type="button"
                          id="toggle-auth-password"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-indigo-600 focus:outline-none cursor-pointer"
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {authError && (
                      <p className="text-xs font-semibold text-rose-500 font-mono text-center">{authError}</p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg transition shadow-md shadow-indigo-600/10 cursor-pointer animate-fade-in"
                    >
                      {isRegistering ? "Register New Account" : "Sign In to Platform"}
                    </button>
                  </form>

                  <div className="text-center pt-2 border-t border-slate-100 mt-2">
                    <button
                      onClick={() => {
                        if (!isRegistering) {
                          setIsRegistering(true);
                          setAuthRole("hr");
                          setRegistrationSource("link");
                        } else {
                          setIsRegistering(false);
                          setRegistrationSource("tab");
                        }
                        setAuthError("");
                        setResetSuccessMessage("");
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-500 font-semibold transition cursor-pointer"
                    >
                      {isRegistering ? "Already have an account? Sign In" : "Need Recruiter or Candidate Credentials? Register Now"}
                    </button>
                  </div>
                </>
              )}
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
              {profile?.role === "applicant" ? (
                <ApplicantDashboard
                  profile={profile!}
                  jobs={jobs}
                  candidates={candidates}
                  onApplyJob={handleApplyJobByCandidate}
                  onWithdrawJob={handleWithdrawJobByCandidate}
                  onUpdateProfile={handleSaveUserProfile}
                  isSavingProfile={isSavingProfile}
                  profileSaveSuccess={profileSaveSuccess}
                />
              ) : profile?.role === "admin" ? (
                <AdminDashboard
                  profile={profile!}
                  jobs={jobs}
                  candidates={candidates}
                  users={allUsers}
                  onCreateUser={handleCreateUserByAdmin}
                  hrPasscode={hrPasscode}
                  onUpdatePasscode={async (newPasscode) => {
                    try {
                      await setDoc(doc(db, "system", "config"), { hrPasscode: newPasscode }, { merge: true });
                    } catch (err) {
                      console.error("Error updating system HR passcode:", err);
                      throw err;
                    }
                  }}
                />
              ) : (
                <>
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
                  defaultCompany={profile?.companyName || ""}
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
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-left space-y-6 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                        <div className="space-y-1">
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight font-display">Active Applicants Stack</h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Select a target job and review matching ratings or trigger multi-agent evaluation.</p>
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
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-850 dark:text-slate-200 focus:outline-none transition max-w-xs shadow-sm cursor-pointer"
                          >
                            {jobs.map((j) => (
                              <option key={j.id} value={j.id} className="dark:bg-slate-900">{j.title}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Applicants Table */}
                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <table className="w-full text-xs text-left border-collapse bg-white dark:bg-slate-900">
                          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="p-4">Candidate</th>
                              <th className="p-4">Contact Details</th>
                              <th className="p-4">Compliance Status</th>
                              <th className="p-4">Hiring Recommendation</th>
                              <th className="p-4 text-center">Match Score</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {activeJobCandidates.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                                  No applicants registered for this job position. Click "Ingest Resumes" to add profiles.
                                </td>
                              </tr>
                            ) : (
                              activeJobCandidates.map((cand) => (
                                <tr key={cand.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition duration-150">
                                  <td className="p-4 font-bold text-slate-900 dark:text-white text-sm">{cand.name}</td>
                                  <td className="p-4 space-y-0.5 text-slate-500 dark:text-slate-400">
                                    <p>{cand.email}</p>
                                    <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500">{cand.phone}</p>
                                  </td>
                                  <td className="p-4">
                                    {cand.eligibilityStatus === "Pending" ? (
                                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">PENDING</span>
                                    ) : cand.eligibilityStatus === "Eligible" ? (
                                      <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">ELIGIBLE</span>
                                    ) : (
                                      <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">REJECTED</span>
                                    )}
                                  </td>
                                  <td className="p-4 font-medium">
                                    {cand.report?.hiringRecommendation?.recommendation ? (
                                      <span className={`font-bold tracking-tight ${
                                        cand.report.hiringRecommendation.recommendation === "Strong Hire" ? "text-emerald-600 dark:text-emerald-400" :
                                        cand.report.hiringRecommendation.recommendation === "Hire" ? "text-indigo-600 dark:text-indigo-400" :
                                        cand.report.hiringRecommendation.recommendation === "Consider" ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"
                                      }`}>
                                        {cand.report.hiringRecommendation.recommendation}
                                      </span>
                                    ) : cand.eligibilityStatus === "Rejected" ? (
                                      <span className="text-rose-600 dark:text-rose-400 font-bold">Rejected (Compliance)</span>
                                    ) : (
                                      <span className="text-slate-400 dark:text-slate-500 font-medium">Not Evaluated</span>
                                    )}
                                  </td>
                                  <td className="p-4 text-center font-bold text-sm font-mono text-indigo-650 dark:text-indigo-400">
                                    {cand.matchScore > 0 ? `${cand.matchScore}%` : "—"}
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => setSelectedCandidate(cand)}
                                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-[11px] rounded-lg transition shadow-sm cursor-pointer"
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
                                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold text-[10px] rounded-md border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setCandidateIdToDelete(cand.id);
                                          }}
                                          className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-lg transition text-[11px] font-semibold cursor-pointer"
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

              {/* Recruiter Profile Tab */}
              {activeTab === "profile" && (
                <div className="max-w-4xl mx-auto space-y-6 text-left animate-fade-in text-slate-900 dark:text-slate-100">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
                    {/* Header profile info */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-150 dark:border-slate-800 pb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-indigo-600/10 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center font-black text-2xl uppercase shadow-sm">
                          {user.name.charAt(0)}
                        </div>
                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{user.name}</h2>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium font-mono">{user.email}</span>
                            {profile?.companyName && (
                              <span className="bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono">
                                <Building2 className="w-3 h-3 text-indigo-500" /> {profile.companyName}
                              </span>
                            )}
                            <span className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Active Recruiter
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Account Isolation Status</p>
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono flex items-center sm:justify-end gap-1 mt-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Secure Multi-Tenant Isolated
                        </p>
                      </div>
                    </div>

                    {/* Editable Manager Profile & Organization Settings Form */}
                    <div className="space-y-4 pt-2 border-b border-slate-150 dark:border-slate-800 pb-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2 font-display">
                          <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          Organization & Manager Settings
                        </h3>
                        {profileSaveSuccess && (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 font-mono">
                            <CheckCircle className="w-3.5 h-3.5" /> Saved & Synchronized with Firestore
                          </span>
                        )}
                      </div>

                      <form onSubmit={(e) => handleSaveUserProfile(e)} className="bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block font-mono">
                              Full Name
                            </label>
                            <input
                              type="text"
                              required
                              value={profileNameInput}
                              onChange={(e) => setProfileNameInput(e.target.value)}
                              placeholder="e.g., Muhammad Talha Jahangir"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none transition shadow-sm"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block font-mono">
                              Organization / Company Name
                            </label>
                            <input
                              type="text"
                              required
                              value={profileCompanyName}
                              onChange={(e) => setProfileCompanyName(e.target.value)}
                              placeholder="e.g., Jtech Solutions, Synapse Corp"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none transition shadow-sm"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block font-mono">
                              Contact Phone Number
                            </label>
                            <input
                              type="tel"
                              value={profilePhone}
                              onChange={(e) => setProfilePhone(e.target.value)}
                              placeholder="+92 300 1234567"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none transition shadow-sm"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block font-mono">
                              Location / Office Headquarters
                            </label>
                            <input
                              type="text"
                              value={profileLocation}
                              onChange={(e) => setProfileLocation(e.target.value)}
                              placeholder="e.g., Lahore, Pakistan / Remote"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none transition shadow-sm"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block font-mono">
                              Role Title / Headline
                            </label>
                            <input
                              type="text"
                              value={profileHeadline}
                              onChange={(e) => setProfileHeadline(e.target.value)}
                              placeholder="e.g., Head of Talent Acquisition"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none transition shadow-sm"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block font-mono">
                              Website / Company URL
                            </label>
                            <input
                              type="url"
                              value={profileWebsite}
                              onChange={(e) => setProfileWebsite(e.target.value)}
                              placeholder="https://company.com"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none transition shadow-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block font-mono">
                            Bio / Professional Summary
                          </label>
                          <textarea
                            rows={3}
                            value={profileBio}
                            onChange={(e) => setProfileBio(e.target.value)}
                            placeholder="Brief executive overview or company hiring focus..."
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none transition shadow-sm resize-none"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            * Updates are synchronized directly with your Firestore user profile and job listings.
                          </p>
                          <button
                            type="submit"
                            disabled={isSavingProfile}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm shrink-0"
                          >
                            {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            <span>Save Profile to Firestore</span>
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Workspace statistics isolated to this user */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Isolated Workspace Metrics</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 p-4 rounded-xl space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Your Job Postings</p>
                          <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">{jobs.length}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-550">Positions owned by your account</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 p-4 rounded-xl space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Registered Applicants</p>
                          <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-display">{candidates.length}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-550">CV profiles ingested</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 p-4 rounded-xl space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Evaluated Profiles</p>
                          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-display">
                            {candidates.filter(c => c.matchScore > 0).length}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-550">Boardroom screened applicants</p>
                        </div>
                      </div>
                    </div>

                    {/* Workspace safety disclaimer */}
                    <div className="p-4 bg-indigo-50/50 dark:bg-slate-800/25 border border-indigo-100/40 dark:border-slate-800/80 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Zero-Trust Recruiter Isolation Model</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        This environment enforces secure data sandboxing. All candidates, jobs, resumes, notes, and multi-agent boardroom evaluation results are stored under your unique recruiter credential: <code className="font-mono bg-indigo-100/50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded text-[11px] font-semibold">{user.uid}</code>. No other recruiter accounts can access, modify, or view your metrics.
                      </p>
                    </div>

                    {/* Quick setting */}
                    <div className="flex items-center justify-between border-t border-slate-150 dark:border-slate-800 pt-5 text-xs text-slate-400">
                      <span>Authenticated via Google Firebase • Groq LLaMA 3.3 Multi-Agent Boardroom Node</span>
                      <button
                        onClick={handleLogout}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-550 text-white font-bold rounded-lg transition shadow-sm cursor-pointer"
                      >
                        Log Out of Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </main>

        {/* Corporate footer - Polished Light Theme */}
        <footer className="bg-white dark:bg-[#0A0F1D] border-t border-slate-200 dark:border-slate-800 py-5 text-slate-500 dark:text-slate-400 text-xs transition-colors overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col lg:flex-row items-center justify-between gap-4 text-center lg:text-left min-w-0 w-full">
            <div className="flex items-center gap-2.5 flex-wrap justify-center lg:justify-start">
              <AppLogo size="sm" />
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
              <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">© 2026 AI Recruiter Pro Platform.</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <JtechLogo size="sm" showText={true} />
            </div>

            <p className="flex items-center justify-center lg:justify-end gap-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500 break-words text-center">
              <Database className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Firebase Cloud Sync • Groq LLaMA 3.3 Multi-Agent Engine</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
