export interface JobAnalysis {
  job_title: string;
  mandatory_skills: string[];
  preferred_skills: string[];
  minimum_experience: string;
  required_education: string;
  certifications: string[];
  soft_skills: string[];
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: "hr" | "applicant" | "admin";
  accountNumber: string;
  createdAt: string;
  companyName?: string;
  phone?: string;
  location?: string;
  headline?: string;
  bio?: string;
  website?: string;
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
  thresholdScore?: number;
  criteriaWeights?: CriteriaWeights;
  extraAttributes?: { attribute: string; bonusScore: number; }[];
  hrId?: string; // HR ID who created the job
  hrName?: string; // HR name
  hrEmail?: string; // HR email
  hrCompany?: string; // HR company / organization name
  endDate?: string; // Job posting end date
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

export interface CultureFitEvaluation {
  score: number; // 0 to 100
  alignment_reasons: string[];
  soft_skills_match: string[];
}

export interface ExtraAttributesEvaluation {
  score_bonus_awarded: number;
  attributes_found: {
    attribute: string;
    points: number;
    evidence: string;
  }[];
}

export interface CriteriaWeights {
  skillsWeight: number;      // e.g. 30
  experienceWeight: number;  // e.g. 25
  educationWeight: number;   // e.g. 20
  softSkillsWeight: number;  // e.g. 15
  bonusWeight: number;       // e.g. 10
}

export interface WeightedCriteriaScore {
  skillsScore: number;
  skillsMax: number;
  experienceScore: number;
  experienceMax: number;
  educationScore: number;
  educationMax: number;
  softSkillsScore: number;
  softSkillsMax: number;
  bonusScore: number;
  bonusMax: number;
  totalScore: number;
  maxTotalScore: number;
  grade: "S" | "A" | "B" | "C" | "F";
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
  cultureFitEvaluation?: CultureFitEvaluation;
  extraAttributesEvaluation?: ExtraAttributesEvaluation;
  weightedCriteriaScore?: WeightedCriteriaScore;
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
  hrId?: string; // HR ID who owns the job
  candidateUid?: string; // If submitted by candidate
  interviewMessage?: string; // Feedback or invitation text
  withdrawn?: boolean; // Flag if candidate withdrew
  appliedAt?: string; // When candidate applied
  resultsAvailableAt?: string; // When the 5-minute processing delay is over
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: "job_created" | "job_analyzed" | "candidate_uploaded" | "candidate_evaluated" | "note_added" | "email_edited";
  message: string;
}

export interface AppNotification {
  id: string;
  userId: string; // The recipient of the notification
  title: string;
  message: string;
  type: "application_submitted" | "screening_complete" | "status_update";
  createdAt: string;
  isRead: boolean;
  jobId?: string;
  candidateId?: string;
}
