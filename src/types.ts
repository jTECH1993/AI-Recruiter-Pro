export interface JobAnalysis {
  job_title: string;
  mandatory_skills: string[];
  preferred_skills: string[];
  minimum_experience: string;
  required_education: string;
  certifications: string[];
  soft_skills: string[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  department: string;
  location: string;
  type: string; // "Full-time" | "Part-time" | "Contract" | "Remote"
  salaryRange: string;
  experienceRequired: string;
  educationRequired: string;
  mandatorySkills: string;
  preferredSkills: string;
  responsibilities: string;
  benefits: string;
  description: string;
  analyzedRequirements?: JobAnalysis;
  createdAt: string;
}

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  education: string[];
  experience: string[];
  skills: string[];
  projects: string[];
  certifications: string[];
  languages: string[];
  employmentHistory: {
    role: string;
    company: string;
    duration: string;
    description: string;
  }[];
}

export interface EligibilityReport {
  status: "Eligible" | "Rejected";
  failed_requirements: string[];
  passed_requirements: string[];
  reason: string;
}

export interface SkillMatching {
  matched_skills: string[];
  missing_skills: string[];
  additional_skills: string[];
  match_percentage: number;
}

export interface ExperienceEvaluation {
  score: number; // 0 to 100
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface CandidateRanking {
  rank_explanation: string;
  comparative_score: number; // 0 to 100
}

export interface InterviewQuestions {
  easy: string[];
  medium: string[];
  hard: string[];
}

export interface HiringRecommendation {
  match_score: number; // 0 to 100
  recommendation: "Strong Hire" | "Hire" | "Consider" | "Reject";
  confidence_score: number; // 0 to 100
  strengths: string[];
  weaknesses: string[];
  final_reasoning: string;
}

export interface GeneratedEmails {
  interview_invitation: string;
  rejection_email: string;
  offer_letter: string;
  follow_up: string;
}

export interface EvaluationReport {
  parsedResume: ParsedResume;
  eligibilityReport: EligibilityReport;
  skillMatching?: SkillMatching;
  experienceEvaluation?: ExperienceEvaluation;
  candidateRanking?: CandidateRanking;
  interviewQuestions?: InterviewQuestions;
  hiringRecommendation?: HiringRecommendation;
  emails?: GeneratedEmails;
}

export interface Candidate {
  id: string;
  jobId: string;
  name: string;
  email: string;
  phone: string;
  resumeText: string;
  matchScore: number; // 0 initially or updated after evaluation
  eligibilityStatus: "Pending" | "Eligible" | "Rejected";
  evaluatedAt?: string;
  notes?: string;
  report?: EvaluationReport;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: "job_created" | "job_analyzed" | "candidate_uploaded" | "candidate_evaluated" | "note_added" | "email_edited";
  message: string;
}
