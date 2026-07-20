import React, { useState } from "react";
import { Upload, FileText, Clipboard, Check, Users, HelpCircle, FileCheck, ArrowRight, ArrowLeft, Loader2, AlertCircle, Briefcase, MapPin, DollarSign, Sparkles } from "lucide-react";
import { Job, Candidate } from "../types";
import { PRELOADED_CANDIDATES } from "../data";

interface ResumeUploaderProps {
  jobs: Job[];
  onUploadCandidate: (candidate: Candidate) => void;
  onNavigate: (tab: string) => void;
  onUploadAndScreen?: (candidate: Candidate, job: Job) => void;
}

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
    // Dynamic load PDF.js from Cloudflare CDN
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
    
    // Auto-name extraction guess
    const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    return { text: text.trim(), name: cleanName };
  } else if (extension === "docx") {
    // Dynamic load Mammoth.js from Cloudflare CDN
    await loadExternalScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");
    const mammoth = (window as any).mammoth;
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    return { text: result.value.trim(), name: cleanName };
  } else {
    // Fallback standard text file reader
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

export default function ResumeUploader({ jobs, onUploadCandidate, onNavigate, onUploadAndScreen }: ResumeUploaderProps) {
  const [step, setStep] = useState<"category" | "upload">("category");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [candidateName, setCandidateName] = useState("");
  const [pastedResume, setPastedResume] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsingError, setParsingError] = useState("");

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
        throw new Error("No readable text could be extracted from the document.");
      }
      setPastedResume(parsed.text);
      if (!candidateName) {
        setCandidateName(parsed.name);
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

  const processText = () => {
    if (!selectedJobId) {
      alert("Please select a target job position first.");
      return;
    }

    const targetJob = jobs.find((j) => j.id === selectedJobId);
    if (!targetJob) {
      alert("Target job listing not found.");
      return;
    }

    const emailMatch = pastedResume.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = pastedResume.match(/[\+]?[0-9\s-\(\)]{9,15}/);

    const newCandidate: Candidate = {
      id: "candidate-" + Date.now(),
      jobId: selectedJobId,
      name: candidateName || "Applicant " + Math.floor(Math.random() * 1000),
      email: emailMatch ? emailMatch[0] : "manual@example.com",
      phone: phoneMatch ? phoneMatch[0] : "Not Specified",
      resumeText: pastedResume,
      matchScore: 0,
      eligibilityStatus: "Pending",
    };

    if (onUploadAndScreen) {
      // Instantly start screening in Groq multi-agent room
      onUploadAndScreen(newCandidate, targetJob);
    } else {
      onUploadCandidate(newCandidate);
      alert(`Successfully ingested resume for ${newCandidate.name}!`);
      onNavigate("candidates");
    }

    // Reset Form
    setCandidateName("");
    setPastedResume("");
    setFileName("");
  };

  const loadPreloadedCandidate = (preset: typeof PRELOADED_CANDIDATES[0]) => {
    if (!selectedJobId) {
      alert("Please select a target job position first.");
      return;
    }

    const targetJob = jobs.find((j) => j.id === selectedJobId);
    if (!targetJob) return;

    const emailMatch = preset.resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = preset.resumeText.match(/[\+]?[0-9\s-\(\)]{9,15}/);

    const newCandidate: Candidate = {
      ...preset,
      id: "candidate-" + Date.now() + "-" + Math.floor(Math.random() * 100),
      jobId: selectedJobId,
      email: emailMatch ? emailMatch[0] : preset.email,
      phone: phoneMatch ? phoneMatch[0] : preset.phone,
    };

    if (onUploadAndScreen) {
      onUploadAndScreen(newCandidate, targetJob);
    } else {
      onUploadCandidate(newCandidate);
      alert(`Loaded preloaded resume profile: ${newCandidate.name}`);
      onNavigate("candidates");
    }
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  // STEP 1: SELECT CATEGORY SCREEN
  if (step === "category") {
    return (
      <div id="upload-tab" className="space-y-6 animate-fade-in text-left">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight font-display flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              Step 1: Select Application Position Category
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              To begin the AI-powered candidate screening, choose the active job category this applicant is applying for. 
              Our multi-agent system screens and indexes their credentials specifically against these metrics.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.length === 0 ? (
              <div className="col-span-2 py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-4">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">No Job Postings Available</h4>
                  <p className="text-xs text-slate-400">You must create at least one job posting before ingesting candidates.</p>
                </div>
                <button
                  onClick={() => onNavigate("jobs")}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Go to Job Postings Manager
                </button>
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => {
                    setSelectedJobId(job.id);
                    setStep("upload");
                  }}
                  className="p-5 border border-slate-200 rounded-xl bg-white hover:border-indigo-500 hover:bg-slate-50/40 transition cursor-pointer flex flex-col justify-between group shadow-sm relative overflow-hidden"
                >
                  <div className="space-y-3.5 relative z-10">
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-[10px] font-bold uppercase font-mono tracking-wider bg-slate-100 text-slate-600 border border-slate-200/60 px-2 py-0.5 rounded-md">
                        {job.department}
                      </span>
                      <span className="text-[10px] font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {job.type}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition font-display uppercase tracking-tight">
                        {job.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">{job.company}</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.mandatorySkills.split(",").slice(0, 3).map((skill) => (
                        <span key={skill} className="text-[10px] bg-white text-slate-600 border border-slate-200 px-2 py-0.5 rounded font-mono font-medium">
                          {skill.trim()}
                        </span>
                      ))}
                      {job.mandatorySkills.split(",").length > 3 && (
                        <span className="text-[10px] text-slate-400 font-mono font-bold self-center">
                          +{job.mandatorySkills.split(",").length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 mt-4 pt-3 flex justify-between items-center text-[10px] font-bold font-mono text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.location}</span>
                    </div>
                    <span className="text-indigo-600 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition duration-300">
                      Select Listing <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: RESUME UPLOAD SCREEN
  return (
    <div id="upload-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in text-left">
      {/* Left: Ingestion Form (Cols 7) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-5">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <button
              onClick={() => {
                setStep("category");
                setFileName("");
                setPastedResume("");
                setCandidateName("");
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Categories
            </button>
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider font-mono">
              Step 2 of 2
            </span>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest font-mono">Target Position</p>
              <h4 className="text-sm font-extrabold text-indigo-950 font-display uppercase tracking-tight">
                {selectedJob?.title}
              </h4>
              <p className="text-xs text-slate-500 font-medium">{selectedJob?.company} • {selectedJob?.location}</p>
            </div>
            <button
              onClick={() => setStep("category")}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[10px] rounded-lg transition shadow-sm cursor-pointer"
            >
              Change
            </button>
          </div>

          <div className="space-y-4">
            {/* Candidate Name */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Candidate Full Name</label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Auto-extracted or enter name e.g. Alex Mercer"
                className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none transition shadow-sm"
              />
            </div>

            {/* Drag & Drop File */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
                dragActive
                  ? "border-indigo-500 bg-indigo-50/50 text-indigo-600"
                  : "border-slate-200 bg-slate-50/50 text-slate-400 hover:border-slate-300"
              }`}
            >
              <input
                id="file-upload-input"
                type="file"
                multiple={false}
                accept=".pdf,.docx,.txt,.md,.json"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload-input" className="cursor-pointer space-y-2.5 block">
                {parsing ? (
                  <Loader2 className="w-8 h-8 text-indigo-500 mx-auto animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-indigo-500 mx-auto" />
                )}
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    {parsing ? "Parsing Resume Document..." : "Drag and drop resume here"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {parsing ? "Extracting CV text contents completely in-browser" : "Supports PDF (.pdf), Word (.docx), and text files"}
                  </p>
                </div>
                {fileName && !parsing && (
                  <span className="inline-block text-[11px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-mono truncate max-w-xs border border-slate-200">
                    {fileName}
                  </span>
                )}
              </label>
            </div>

            {parsingError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{parsingError}</span>
              </div>
            )}

            {/* Pasted Resume Text Area */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Extracted Resume Text</label>
                {pastedResume && (
                  <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-wider">
                    {pastedResume.split(/\s+/).length} Words Extracted
                  </span>
                )}
              </div>
              <textarea
                rows={8}
                value={pastedResume}
                onChange={(e) => setPastedResume(e.target.value)}
                placeholder="Pasted or extracted text contents of the resume will appear here..."
                className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none transition font-mono leading-relaxed shadow-sm"
              />
            </div>

            {/* Submit */}
            <button
              id="submit-resume-btn"
              onClick={processText}
              disabled={!pastedResume || parsing}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Ingest & Run Groq AI Agent Screening</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right: Sandbox / Preloads (Cols 5) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5 font-display">
              <Clipboard className="w-4 h-4 text-indigo-600" /> Preloaded Candidate Profiles
            </h3>
            <p className="text-xs text-slate-400">Select one of our meticulously designed resume mock profiles to instantly test the 9-agent pipeline orchestration.</p>
          </div>

          <div className="space-y-3 pt-2">
            {PRELOADED_CANDIDATES.map((cand) => (
              <div
                key={cand.id}
                onClick={() => loadPreloadedCandidate(cand)}
                className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-500/50 hover:bg-slate-50/50 transition cursor-pointer flex justify-between items-center group shadow-sm"
              >
                <div className="text-left space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition font-display">{cand.name}</h4>
                  <p className="text-[10px] text-indigo-600 font-mono font-bold">
                    {cand.jobId === "job-2" ? "AI Engineer" : "AI & Data Engineer"}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-relaxed truncate max-w-[250px] font-medium">
                    {cand.resumeText.split("\n")[2]}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition transform group-hover:translate-x-1" />
              </div>
            ))}
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl text-left space-y-1">
            <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1 font-display">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" /> Testing Recommendations:
            </h4>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              1. Choose a target category first.<br />
              2. Select <strong>Dr. Vikram Chandra</strong> (AI Research Scientist, 4+ yrs exp, PhD in CS, PyTorch/LLMs).<br />
              3. Run the 9-agent boardroom screening pipeline to analyze alignment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
