import React, { useState } from "react";
import { Plus, Sparkles, Cpu, Edit, Trash2, Check, ArrowRight, ChevronDown, ListFilter, AlertCircle, FileText, Image, Award, Brain, Download, Share2 } from "lucide-react";
import { Job, JobAnalysis } from "../types";

interface JobManagerProps {
  jobs: Job[];
  onAddJob: (job: Job) => void;
  onUpdateJob: (job: Job) => void;
  onDeleteJob: (id: string) => void;
}

export default function JobManager({ jobs, onAddJob, onUpdateJob, onDeleteJob }: JobManagerProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [improvingAI, setImprovingAI] = useState(false);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [activeJobTab, setActiveJobTab] = useState<"specs" | "promo">("specs");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("Full-time");
  const [salaryRange, setSalaryRange] = useState("");
  const [experienceRequired, setExperienceRequired] = useState("");
  const [educationRequired, setEducationRequired] = useState("");
  const [mandatorySkills, setMandatorySkills] = useState("");
  const [preferredSkills, setPreferredSkills] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [benefits, setBenefits] = useState("");
  const [description, setDescription] = useState("");
  const [thresholdScore, setThresholdScore] = useState<number>(70);
  const [extraAttributes, setExtraAttributes] = useState<{ attribute: string; bonusScore: number; }[]>([]);
  const [newAttributeName, setNewAttributeName] = useState("");
  const [newAttributeScore, setNewAttributeScore] = useState<number>(5);
  const [endDate, setEndDate] = useState("");

  const resetForm = () => {
    setTitle("");
    setCompany("");
    setDepartment("");
    setLocation("");
    setType("Full-time");
    setSalaryRange("");
    setExperienceRequired("");
    setEducationRequired("");
    setMandatorySkills("");
    setPreferredSkills("");
    setResponsibilities("");
    setBenefits("");
    setDescription("");
    setThresholdScore(70);
    setExtraAttributes([]);
    setNewAttributeName("");
    setNewAttributeScore(5);
    setEndDate("");
  };

  const loadForm = (job: Job) => {
    setTitle(job.title);
    setCompany(job.company);
    setDepartment(job.department);
    setLocation(job.location);
    setType(job.type);
    setSalaryRange(job.salaryRange);
    setExperienceRequired(job.experienceRequired);
    setEducationRequired(job.educationRequired);
    setMandatorySkills(job.mandatorySkills);
    setPreferredSkills(job.preferredSkills);
    setResponsibilities(job.responsibilities);
    setBenefits(job.benefits);
    setDescription(job.description);
    setThresholdScore(job.thresholdScore !== undefined ? job.thresholdScore : 70);
    setExtraAttributes(job.extraAttributes || []);
    setNewAttributeName("");
    setNewAttributeScore(5);
    setEndDate(job.endDate || "");
  };

  const handleCreate = () => {
    if (!title || !company || !description) {
      alert("Please enter Job Title, Company and Description.");
      return;
    }

    const newJob: Job = {
      id: "job-" + Date.now(),
      title,
      company,
      department,
      location,
      type,
      salaryRange,
      experienceRequired,
      educationRequired,
      mandatorySkills,
      preferredSkills,
      responsibilities,
      benefits,
      description,
      thresholdScore,
      extraAttributes,
      endDate,
      createdAt: new Date().toISOString(),
    };

    onAddJob(newJob);
    resetForm();
    setIsAdding(false);
    setSelectedJob(newJob);
  };

  const handleUpdate = () => {
    if (!selectedJob) return;

    const updatedJob: Job = {
      ...selectedJob,
      title,
      company,
      department,
      location,
      type,
      salaryRange,
      experienceRequired,
      educationRequired,
      mandatorySkills,
      preferredSkills,
      responsibilities,
      benefits,
      description,
      thresholdScore,
      extraAttributes,
      endDate,
    };

    onUpdateJob(updatedJob);
    setIsEditing(false);
    setSelectedJob(updatedJob);
  };

  // AI Assist: Improve Job Description
  const handleImproveWithAI = async () => {
    if (!title || !description) {
      alert("Please enter a Job Title and current Description text first.");
      return;
    }

    setImprovingAI(true);
    try {
      const response = await fetch("/api/improve-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          company,
          description,
          requirements: mandatorySkills,
        }),
      });

      if (!response.ok) throw new Error("Failed to optimize job posting.");
      const data = await response.json();
      if (data.success) {
        setDescription(data.improvedText);
        alert("Job posting optimized successfully with AI copywriter assistance!");
      }
    } catch (e: any) {
      alert("AI Improvement failed: " + e.message);
    } finally {
      setImprovingAI(false);
    }
  };

  // AI Assist: Analyze Job Advertisement (Agent 1)
  const handleAnalyzeJob = async (job: Job) => {
    setAnalyzingAI(true);
    try {
      const response = await fetch("/api/analyze-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(job),
      });

      if (!response.ok) throw new Error("Failed to perform Job compliance analysis.");
      const data = await response.json();
      if (data.success && data.analysis) {
        const updatedJob = { ...job, analyzedRequirements: data.analysis };
        onUpdateJob(updatedJob);
        setSelectedJob(updatedJob);
        alert("Agent 1 successfully extracted strict compliance limits from your job specifications!");
      }
    } catch (e: any) {
      alert("Agent Analysis failed: " + e.message);
    } finally {
      setAnalyzingAI(false);
    }
  };

  return (
    <div id="jobs-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in text-left">
      {/* Left: Job Listings Panel (Cols 4) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight font-display">Active Job Posts ({jobs.length})</h2>
          <button
            id="add-job-btn"
            onClick={() => {
              resetForm();
              setIsAdding(true);
              setIsEditing(false);
              setSelectedJob(null);
              setShowConfirmDelete(false);
            }}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center space-x-1.5 transition text-xs font-bold shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Job</span>
          </button>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {jobs.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 text-xs font-semibold">
              No jobs created yet. Click "Create Job" to define criteria.
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => {
                  setSelectedJob(job);
                  setIsAdding(false);
                  setIsEditing(false);
                  setActiveJobTab("specs");
                  setShowConfirmDelete(false);
                }}
                className={`p-4 rounded-xl border text-left cursor-pointer transition ${
                  selectedJob?.id === job.id
                    ? "bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-500 dark:border-indigo-800 shadow-sm"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/30 dark:hover:bg-slate-850/40"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1 font-display">{job.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{job.company}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1.5">{job.location} • {job.type}</p>
                  </div>
                  {job.analyzedRequirements && (
                    <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950/45 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 uppercase shrink-0">
                      <Cpu className="w-2.5 h-2.5" /> Analyzed
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Job Detail / Form Panel (Cols 8) */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-6 min-h-[500px] flex flex-col transition-colors duration-250">
        {isAdding || isEditing ? (
          // Create / Edit Form
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight font-display mb-4">
                {isAdding ? "Create New Job Post" : `Modify: ${selectedJob?.title}`}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Job Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Senior Full-Stack Engineer"
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none transition shadow-sm"
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Company Name *</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. TechNexus Corp"
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none transition shadow-sm"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Engineering"
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none transition shadow-sm"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. New York, NY (Hybrid)"
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none transition shadow-sm"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Employment Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none transition shadow-sm"
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Remote</option>
                  </select>
                </div>

                {/* Salary */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Salary Range</label>
                  <input
                    type="text"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    placeholder="e.g. $120,000 - $150,000"
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none transition shadow-sm"
                  />
                </div>

                {/* Experience */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Minimum Experience Required *</label>
                  <input
                    type="text"
                    value={experienceRequired}
                    onChange={(e) => setExperienceRequired(e.target.value)}
                    placeholder="e.g. 5+ years"
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none transition shadow-sm"
                  />
                </div>

                {/* Education */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Education Requirement *</label>
                  <input
                    type="text"
                    value={educationRequired}
                    onChange={(e) => setEducationRequired(e.target.value)}
                    placeholder="e.g. Bachelor's Degree in CS"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none transition shadow-sm"
                  />
                </div>

                {/* Job End Date */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Job Posting End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none transition shadow-sm"
                  />
                </div>
              </div>

              {/* Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Mandatory Skills (Comma separated) *</label>
                  <input
                    type="text"
                    value={mandatorySkills}
                    onChange={(e) => setMandatorySkills(e.target.value)}
                    placeholder="React, Node.js, TypeScript"
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none transition shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Preferred Skills (Comma separated)</label>
                  <input
                    type="text"
                    value={preferredSkills}
                    onChange={(e) => setPreferredSkills(e.target.value)}
                    placeholder="Docker, Kubernetes, GCP"
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none transition shadow-sm"
                  />
                </div>
              </div>

              {/* Textareas */}
              <div className="space-y-4 mt-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Job Description *</label>
                    <button
                      type="button"
                      onClick={handleImproveWithAI}
                      disabled={improvingAI}
                      className="text-xs text-indigo-600 hover:text-indigo-500 font-bold flex items-center gap-1 transition disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {improvingAI ? "Optimizing with Copywriter AI..." : "Optimize Description with AI"}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Write a summary describing the company vision, culture, and high-level project goals..."
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none transition font-sans shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Responsibilities</label>
                  <textarea
                    rows={3}
                    value={responsibilities}
                    onChange={(e) => setResponsibilities(e.target.value)}
                    placeholder="Enter responsibilities, one per line..."
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none transition font-sans shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Benefits</label>
                  <textarea
                    rows={2}
                    value={benefits}
                    onChange={(e) => setBenefits(e.target.value)}
                    placeholder="Enter company perks and benefits..."
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none transition font-sans shadow-sm"
                  />
                </div>

                {/* Advanced Threshold & Bonus Evaluation Rules */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                    <Award className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-display">Evaluation Standards & Bonus Rules</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Passing Score Threshold */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Passing Score Threshold (%)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={thresholdScore}
                          onChange={(e) => setThresholdScore(Number(e.target.value))}
                          className="w-32 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-1.5 text-sm text-slate-900 font-bold focus:outline-none transition shadow-sm"
                        />
                        <span className="text-[11px] text-slate-400 font-medium">Candidates below this are flagged as Reject/Consider.</span>
                      </div>
                    </div>
                  </div>

                  {/* Extra Bonus Attributes */}
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Custom Bonus Attributes (Optional)</label>
                      <p className="text-[10px] text-slate-400 mb-2">Define custom traits or academic degrees (e.g. "Ph.D. in CS", "Stripe payment integration"). If Agent 11 finds them, they award the bonus points.</p>
                    </div>

                    {/* Added List */}
                    {extraAttributes.length > 0 && (
                      <div className="space-y-1.5 bg-white border border-slate-200 rounded-lg p-2.5 max-h-40 overflow-y-auto shadow-inner">
                        {extraAttributes.map((attr, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-100 text-xs text-slate-700">
                            <span className="font-semibold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              {attr.attribute}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="bg-emerald-50 text-emerald-700 font-bold font-mono px-2 py-0.5 rounded text-[10px]">+{attr.bonusScore} pts</span>
                              <button
                                type="button"
                                onClick={() => setExtraAttributes(extraAttributes.filter((_, i) => i !== idx))}
                                className="text-slate-400 hover:text-rose-600 font-bold transition text-[11px]"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Input to Add */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={newAttributeName}
                        onChange={(e) => setNewAttributeName(e.target.value)}
                        placeholder="e.g. Docker and Kubernetes expertise"
                        className="flex-1 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none transition shadow-sm"
                      />
                      <div className="flex items-center gap-2">
                        <select
                          value={newAttributeScore}
                          onChange={(e) => setNewAttributeScore(Number(e.target.value))}
                          className="bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-bold focus:outline-none transition shadow-sm"
                        >
                          <option value="3">3 pts</option>
                          <option value="5">5 pts</option>
                          <option value="10">10 pts</option>
                          <option value="15">15 pts</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newAttributeName.trim()) return;
                            setExtraAttributes([...extraAttributes, { attribute: newAttributeName.trim(), bonusScore: newAttributeScore }]);
                            setNewAttributeName("");
                          }}
                          className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-150 transition text-xs shrink-0"
                        >
                          Add Rule
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-slate-100 pt-6 mt-6">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setIsEditing(false);
                  if (jobs.length > 0) setSelectedJob(jobs[0]);
                }}
                className="px-4.5 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                id="save-job-btn"
                onClick={isAdding ? handleCreate : handleUpdate}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                Save Job Listing
              </button>
            </div>
          </div>
        ) : selectedJob ? (
          // View Job Details
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight font-display">{selectedJob.title}</h1>
                    <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {selectedJob.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold">
                    {selectedJob.company} • {selectedJob.location} • {selectedJob.department || "N/A"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      loadForm(selectedJob);
                      setIsEditing(true);
                    }}
                    className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg flex items-center space-x-1.5 transition text-xs font-bold shadow-sm"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  {showConfirmDelete ? (
                    <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 p-1 rounded-lg animate-fade-in">
                      <span className="text-[10px] text-rose-700 font-bold px-1.5">Delete job & applicants?</span>
                      <button
                        onClick={() => {
                          onDeleteJob(selectedJob.id);
                          setSelectedJob(jobs.length > 1 ? jobs[0] : null);
                          setShowConfirmDelete(false);
                        }}
                        className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-md transition cursor-pointer shadow-sm"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setShowConfirmDelete(false)}
                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] rounded-md transition cursor-pointer shadow-sm"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setShowConfirmDelete(true);
                      }}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg flex items-center transition shadow-sm cursor-pointer"
                      title="Delete Job Posting"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
              </div>

              {/* Inner Tab Bar */}
              <div className="flex border-b border-slate-100 pb-px gap-6 mb-4">
                <button
                  onClick={() => setActiveJobTab("specs")}
                  className={`pb-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeJobTab === "specs"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Job Requirements Specs
                </button>
                <button
                  onClick={() => setActiveJobTab("promo")}
                  className={`pb-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeJobTab === "promo"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  Visual Advertisement & Candidate Persona Blueprint
                </button>
              </div>
            </div>

            {activeJobTab === "specs" ? (
              <div className="space-y-5 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
                  {/* Salary */}
                  <div className="bg-slate-50/50 border border-slate-200/60 p-3.5 rounded-xl shadow-inner">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Salary Range</p>
                    <p className="text-sm font-extrabold text-slate-900 mt-1 font-display">{selectedJob.salaryRange || "Not Specified"}</p>
                  </div>
                  {/* Exp Required */}
                  <div className="bg-slate-50/50 border border-slate-200/60 p-3.5 rounded-xl shadow-inner">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Experience Minimum</p>
                    <p className="text-sm font-extrabold text-slate-900 mt-1 font-display">{selectedJob.experienceRequired}</p>
                  </div>
                  {/* Education */}
                  <div className="bg-slate-50/50 border border-slate-200/60 p-3.5 rounded-xl shadow-inner">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Education Required</p>
                    <p className="text-sm font-extrabold text-slate-900 mt-1 truncate font-display">{selectedJob.educationRequired}</p>
                  </div>
                  {/* End Date */}
                  <div className="bg-slate-50/50 border border-slate-200/60 p-3.5 rounded-xl shadow-inner">
                    <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Application End Date</p>
                    <p className="text-sm font-extrabold text-slate-900 mt-1 font-display">{selectedJob.endDate ? selectedJob.endDate : "No End Date Set"}</p>
                  </div>
                </div>

                {/* Skills */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="bg-[#ECFDF5]/50 border border-[#A7F3D0]/60 p-4 rounded-xl">
                    <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-3.5">Mandatory Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedJob.mandatorySkills.split(",").map((s) => (
                        <span key={s} className="text-xs bg-white text-emerald-800 border border-[#A7F3D0] px-2.5 py-0.5 rounded-full font-mono font-medium shadow-sm">
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#EEF2FF]/50 border border-[#C7D2FE]/60 p-4 rounded-xl">
                    <h4 className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-3.5">Preferred Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedJob.preferredSkills ? (
                        selectedJob.preferredSkills.split(",").map((s) => (
                          <span key={s} className="text-xs bg-white text-indigo-800 border border-[#C7D2FE] px-2.5 py-0.5 rounded-full font-mono font-medium shadow-sm">
                            {s.trim()}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold italic">None Specified</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Decrypted / Description */}
                <div className="space-y-4 text-left">
                  <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Role Overview</h4>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-sans font-medium">{selectedJob.description}</p>
                  </div>

                  {selectedJob.responsibilities && (
                    <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Key Responsibilities</h4>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-sans font-medium">{selectedJob.responsibilities}</p>
                    </div>
                  )}

                  {/* Standards & Extra Attribute rules */}
                  <div className="bg-slate-50/50 border border-slate-200/60 p-4 rounded-xl space-y-4">
                    <h4 className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5 font-display">
                      <Award className="w-3.5 h-3.5 text-indigo-600" /> Recruiter Passing Standards & Bonus Rules
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Threshold Box */}
                      <div className="bg-white border border-slate-200/80 rounded-lg p-3 text-left">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Candidate Passing Threshold</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-lg font-black text-indigo-600 font-display">{selectedJob.thresholdScore !== undefined ? selectedJob.thresholdScore : 70}%</span>
                          <span className="text-[10px] text-slate-400 font-semibold font-sans">minimum evaluation score</span>
                        </div>
                      </div>

                      {/* Attributes Box */}
                      <div className="bg-white border border-slate-200/80 rounded-lg p-3 text-left">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Custom Bonus Rules Configured</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-lg font-black text-indigo-600 font-display">{selectedJob.extraAttributes?.length || 0}</span>
                          <span className="text-[10px] text-slate-400 font-semibold font-sans">bonus verification attribute{selectedJob.extraAttributes?.length === 1 ? '' : 's'}</span>
                        </div>
                      </div>
                    </div>

                    {selectedJob.extraAttributes && selectedJob.extraAttributes.length > 0 && (
                      <div className="pt-1 space-y-1.5 text-left">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Configured Attributes:</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedJob.extraAttributes.map((attr, i) => (
                            <div key={i} className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-lg px-2.5 py-1 text-xs shadow-sm">
                              <span className="font-semibold text-slate-700">{attr.attribute}</span>
                              <span className="bg-indigo-100 text-indigo-800 font-bold font-mono text-[9px] px-1.5 py-0.5 rounded">+{attr.bonusScore} pts</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in text-left flex-1">
                {/* Visual Poster Card */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-2xl border border-indigo-500/30 p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[360px]">
                  
                  {/* Subtle decorative glows */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
                    {/* Poster Left */}
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase font-mono">{selectedJob.company} is hiring</span>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[11px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-md font-mono">
                          OPPORTUNITY
                        </span>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight pt-1 font-display uppercase">
                          {selectedJob.title}
                        </h2>
                      </div>

                      <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold text-slate-300">
                        <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded">{selectedJob.location}</span>
                        <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded">{selectedJob.type}</span>
                        <span className="bg-indigo-500/20 border border-indigo-500/20 text-indigo-200 px-2 py-0.5 rounded">{selectedJob.salaryRange || "Competitive"}</span>
                      </div>

                      <div className="pt-2 text-xs text-slate-400 font-medium leading-relaxed max-w-md">
                        "{selectedJob.description.split(".")[0]}."
                      </div>
                    </div>

                    {/* Poster Right: Interactive Neural Brain Canvas / SVG simulation */}
                    <div className="w-full md:w-48 h-44 border border-white/10 rounded-2xl bg-slate-900/40 relative flex items-center justify-center p-4 shadow-inner overflow-hidden shrink-0">
                      <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px]"></div>
                      
                      {/* Floating glowing orbs and lines to represent AI neural net */}
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <div className="absolute w-24 h-24 rounded-full border border-indigo-500/10 animate-spin" style={{ animationDuration: '8s' }}></div>
                        <div className="absolute w-16 h-16 rounded-full border border-purple-500/20 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}></div>
                        
                        {/* Core Glowing Node */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/40 z-10 animate-bounce">
                          <Cpu className="w-5 h-5 text-white" />
                        </div>

                        {/* Satellite Nodes */}
                        <span className="absolute top-2 left-2 w-3.5 h-3.5 bg-indigo-400 rounded-full flex items-center justify-center text-[7px] text-slate-900 font-bold font-mono">LLM</span>
                        <span className="absolute bottom-2 right-2 w-3.5 h-3.5 bg-purple-400 rounded-full flex items-center justify-center text-[7px] text-slate-900 font-bold font-mono">RAG</span>
                        <span className="absolute top-16 right-1 w-3 h-3 bg-emerald-400 rounded-full flex items-center justify-center text-[7px] text-slate-900 font-bold font-mono">PY</span>

                        {/* Simulated connection lines */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 100 100">
                          <line x1="20" y1="20" x2="50" y2="50" stroke="#818cf8" strokeWidth="0.75" strokeDasharray="2 2" />
                          <line x1="80" y1="80" x2="50" y2="50" stroke="#c084fc" strokeWidth="0.75" strokeDasharray="2 2" />
                          <line x1="85" y1="65" x2="50" y2="50" stroke="#34d399" strokeWidth="0.75" />
                        </svg>
                      </div>

                      <div className="absolute bottom-2 text-[8px] font-mono text-indigo-300 font-bold uppercase tracking-widest">
                        AI Agent Blueprint
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 mt-6 pt-4 flex flex-wrap justify-between items-center gap-4 text-[10px] text-slate-400 font-mono">
                    <div className="flex gap-4">
                      <span>Exp: <strong className="text-white">{selectedJob.experienceRequired}</strong></span>
                      <span>Degree: <strong className="text-white">{selectedJob.educationRequired}</strong></span>
                    </div>
                    <div className="text-indigo-400 font-bold">
                      Scan or Apply via AI Screener Panel
                    </div>
                  </div>
                </div>

                {/* Candidate Persona Blueprint Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Skills & Competency Matrix */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5 font-display">
                      <Brain className="w-4 h-4 text-indigo-600" /> Target Competencies Matrix
                    </h4>
                    <div className="space-y-3.5">
                      {/* Skill 1 */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono font-bold">
                          <span className="text-slate-600">LLM Orchestration & Agents (CrewAI/LangChain)</span>
                          <span className="text-indigo-600">95%</span>
                        </div>
                        <div className="w-full bg-slate-200/60 rounded-full h-2 overflow-hidden shadow-inner">
                          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                        </div>
                      </div>
                      
                      {/* Skill 2 */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono font-bold">
                          <span className="text-slate-600">Advanced Vector DBs & RAG Architecture</span>
                          <span className="text-indigo-600">92%</span>
                        </div>
                        <div className="w-full bg-slate-200/60 rounded-full h-2 overflow-hidden shadow-inner">
                          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                      </div>

                      {/* Skill 3 */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono font-bold">
                          <span className="text-slate-600">Core Python, PyTorch & Model Evaluation</span>
                          <span className="text-indigo-600">88%</span>
                        </div>
                        <div className="w-full bg-slate-200/60 rounded-full h-2 overflow-hidden shadow-inner">
                          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full" style={{ width: '88%' }}></div>
                        </div>
                      </div>

                      {/* Skill 4 */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono font-bold">
                          <span className="text-slate-600">Prompt Engineering & Guardrails</span>
                          <span className="text-indigo-600">90%</span>
                        </div>
                        <div className="w-full bg-slate-200/60 rounded-full h-2 overflow-hidden shadow-inner">
                          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Ideal Persona Attributes */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5 font-display">
                        <Award className="w-4 h-4 text-amber-500" /> Ideal Candidate Persona Attributes
                      </h4>
                      
                      <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                        <div className="flex items-start gap-2">
                          <span className="text-indigo-600 mt-0.5">🚀</span>
                          <p className="font-medium"><strong className="text-slate-800">Agent Architect:</strong> Experienced in managing autonomous state loops, feedback networks, and tool execution boundaries.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-indigo-600 mt-0.5">🧠</span>
                          <p className="font-medium"><strong className="text-slate-800">RAG Pioneer:</strong> Mastery over embeddings, semantic similarity search thresholds, metadata indexing, and hybrid retrievers.</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-indigo-600 mt-0.5">⚡</span>
                          <p className="font-medium"><strong className="text-slate-800">Production Optimizer:</strong> Focuses on sub-second execution speeds, token count reduction, cache reuse, and asynchronous stream handling.</p>
                        </div>
                      </div>
                    </div>

                    {/* Copy and Export tools */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => {
                          const promoText = `📢 WE ARE HIRING at ${selectedJob.company}!\n\n🚀 Role: ${selectedJob.title}\n📍 Location: ${selectedJob.location} (${selectedJob.type})\n💰 Salary: ${selectedJob.salaryRange}\n\n🎯 Experience required: ${selectedJob.experienceRequired}\n📚 Education: ${selectedJob.educationRequired}\n\nMandatory skills:\n${selectedJob.mandatorySkills.split(',').map(s => `• ${s.trim()}`).join('\n')}\n\nApply now by uploading your resume directly to our automated AI recruiting agent console!`;
                          navigator.clipboard.writeText(promoText);
                          alert("A sleek, professionally formatted text advertisement has been copied to your clipboard!");
                        }}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Copy LinkedIn Post
                      </button>

                      <button
                        onClick={() => {
                          window.print();
                        }}
                        className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                        title="Download Poster as PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>

            {/* Agent 1 Section */}
            <div className="border-t border-slate-100 pt-6 mt-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <div className="space-y-1 text-left">
                <h4 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 font-display">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" /> Agent 1: Job Intelligence Analyst
                </h4>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  {selectedJob.analyzedRequirements
                    ? "Hiring criteria has been analyzed and stored in structural compliance blocks."
                    : "Extract structured compliance limits (education levels, years of experience, mandatory skill list) prior to matching resumes."}
                </p>
              </div>

              <button
                id="analyze-job-btn"
                onClick={() => handleAnalyzeJob(selectedJob)}
                disabled={analyzingAI}
                className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-indigo-600/10 cursor-pointer shrink-0"
              >
                <Cpu className="w-3.5 h-3.5" />
                {analyzingAI ? "Extracting Criteria..." : selectedJob.analyzedRequirements ? "Re-analyze Job" : "Run Agent Analysis"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
            <FileText className="w-16 h-16 text-slate-200 mb-2" />
            <p className="text-sm font-bold font-display">No Job Selected</p>
            <p className="text-xs mt-1">Please select or create a job posting from the left list.</p>
          </div>
        )}
      </div>
    </div>
  );
}
