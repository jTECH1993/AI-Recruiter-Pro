# AI Recruiter Pro - Multi-Agent Boardroom Screening Portal

AI Recruiter Pro is a cutting-edge, autonomous recruitment evaluation application powered by a real-time, 9-agent virtual boardroom pipeline. Built on a serverless React architecture with live Google Cloud Firestore synchronization, this system eliminates manual resume screening by putting candidates through sequential, highly specialized multi-agent analysis layers.

---

## 🗺️ Multi-Agent Boardroom Architecture

The screening engine simulates a corporate recruitment committee where **nine specialized AI agent nodes** collaborate in sequence to evaluate, grade, rank, and communicate with candidates.

```
                  ┌─────────────────────────────────┐
                  │      Candidate Resume (PDF/CV)  │
                  └────────────────┬────────────────┘
                                   │
                                   ▼
                   [Agent 1: Resume Text Parser]
                                   │
                                   ▼
                  [Agent 2: Contact Info Validator]
                                   │
                                   ▼
                  [Agent 3: Compliance Screener]  ──(Fails?)──► [Rejected Status]
                                   │                                    │
                              (Eligible)                                │
                                   │                                    │
                                   ▼                                    │
                   [Agent 4: Skill Match Specialist]                    │
                                   │                                    │
                                   ▼                                    │
                    [Agent 5: Senior HR Auditor]                        │
                                   │                                    │
                                   ▼                                    │
                   [Agent 6: Talent Pool Ranker]                        │
                                   │                                    │
                                   ▼                                    │
                  [Agent 7: Competency Assessor]                        │
                                   │                                    │
                                   ▼                                    │
                   [Agent 8: Hiring Decision Manager]                   │
                                   │                                    │
                                   ▼                                    │
                   [Agent 9: Email Communication Coordinator]           │
                                   │                                    │
                                   ▼                                    ▼
                  ┌─────────────────────────────────┐       ┌──────────────────┐
                  │  Full Talent Footprint Dossier  │       │ Rejection Drafts │
                  │  - Skills Gap Matrix            │       │ & Notification   │
                  │  - Target Interview Questions   │       │                  │
                  │  - Match & Confidence Indices   │       │                  │
                  └─────────────────────────────────┘       └──────────────────┘
```

### The 9-Agent Boardroom Roles
1. **Agent 1: Resume Text Parser** – Extracts structural unstructured texts, layouts, and filters out formatting noise.
2. **Agent 2: Contact Info Validator** – Confirms identity criteria, extracts phone formats, email endpoints, and online profiles.
3. **Agent 3: Compliance Screener** – Performs a binary sanity gate verifying legal, baseline experience, and absolute hard requisites. (If this gate fails, the candidate is flagged **Rejected** with full written justification).
4. **Agent 4: Skill Match Specialist** – Cross-references resume skill clusters against the job's mandatory and preferred skills to calculate a granular **Domain Expertise Percentage**.
5. **Agent 5: Senior HR Auditor** – Analyzes historical timeline alignment, tenure patterns, company pedigree, and flags potential career gaps or rapid transitions.
6. **Agent 6: Talent Pool Ranker** – Ranks the current candidate comparatively against the wider applicant pipeline pool to assign a **Comparative Talent Rank**.
7. **Agent 7: Competency Assessor** – Evaluates soft skills, leadership records, system architecture capability, and project scale experience.
8. **Agent 8: Hiring Decision Manager** – Consolidates upstream reviews, establishes the final recommendation (`Strong Hire`, `Hire`, `Proceed with Caution`, or `No Hire`), determines a calibrated confidence score, and designs hyper-targeted behavioral interview questions.
9. **Agent 9: Email Communication Coordinator** – Formulates highly customized corporate draft correspondences (Interview invitations, follow-ups, offer letters, or polite rejection emails) matched to the candidate's custom dossier results.

---

## 🗄️ Firestore Database Schema

The app is fully integrated with a scalable **Google Cloud Firestore** database setup. It uses two core synchronized collections:

### 1. `jobs` Collection
Stores comprehensive career advertisement specifications. Each document is keyed by `jobId`.

```json
{
  "id": "job-2",
  "title": "AI Engineer",
  "company": "Synapse Analytics",
  "department": "Engineering",
  "location": "San Francisco, CA (Hybrid)",
  "type": "Full-time",
  "salaryRange": "$140,000 - $185,000",
  "experienceRequired": "3+ years",
  "educationRequired": "Master's or Ph.D. in Computer Science, AI, or equivalent field",
  "mandatorySkills": "Python, PyTorch/TensorFlow, LLMs, Prompt Engineering, LangChain",
  "preferredSkills": "Vector Databases (Pinecone/Milvus), RAG, Cloud Deployments, Docker",
  "responsibilities": "- Develop and fine-tune large language models for production workflows\n- Design and implement Retrieval-Augmented Generation (RAG) backend structures\n- Collaborate with product to design conversational and generative user features\n- Build high-throughput inference endpoints using FastAPI",
  "benefits": "- Premium PPO medical, dental, and vision coverages\n- Generous equity package with early options allocation\n- $3,000 yearly training budget\n- Flexible work schedule and wellness allowance",
  "description": "We are seeking a dedicated AI Engineer to spearhead our Generative AI product integrations. You will architect robust, state-of-the-art systems utilizing proprietary data pipelines and advanced LLM orchestrations.",
  "createdAt": "2026-07-16T11:00:00Z",
  "analyzedRequirements": {
    "job_title": "AI Engineer",
    "mandatory_skills": ["Python", "PyTorch", "LLMs", "Prompt Engineering", "LangChain"],
    "preferred_skills": ["Vector Databases", "RAG", "Cloud Deployments", "Docker"],
    "minimum_experience": "3 years",
    "required_education": "Master's or Ph.D. in Computer Science",
    "certifications": [],
    "soft_skills": ["Problem Solving", "Collaboration", "System Design", "Communication"]
  }
}
```

### 2. `candidates` Collection
Tracks candidate profiles, recruiter notes, and the multi-agent screening output. Keyed by `candidateId`.

```json
{
  "id": "candidate-3",
  "jobId": "job-2",
  "name": "Dr. Vikram Chandra",
  "email": "vikram.chandra@synapsenet.org",
  "phone": "+1 (212) 808-4123",
  "resumeText": "DR. VIKRAM CHANDRA...",
  "matchScore": 94,
  "eligibilityStatus": "Eligible",
  "notes": "Excellent candidate with deep research background in generative systems.",
  "report": {
    "eligibilityReport": {
      "status": "Eligible",
      "justification": "Candidate has a PhD in CS and over 4 years of specialized research...",
      "missing_criteria": [],
      "flagged_concerns": []
    },
    "skillMatching": {
      "match_percentage": 95,
      "matched_skills": ["Python", "PyTorch", "LLMs", "RAG", "LangChain"],
      "missing_skills": [],
      "skill_gap_analysis": "Highly advanced competency detected across the entire core stack..."
    },
    "experienceEvaluation": {
      "score": 92,
      "years_found": "4+ years",
      "relevant_roles": [
        {
          "title": "Lead AI Scientist",
          "duration": "2024 - Present",
          "impact": "Architected conversational RAG architectures processing 2M+ daily active tokens."
        }
      ],
      "experience_gap_justification": "No notable work gaps. Steady progression in high-impact labs."
    },
    "candidateRanking": {
      "comparative_score": 96,
      "relative_tier": "Top 5%",
      "strengths": ["Strong theoretical foundation", "Proven systems-level execution"],
      "weaknesses": ["Limited classical corporate enterprise software experience"]
    },
    "hiringRecommendation": {
      "recommendation": "Strong Hire",
      "confidence_score": 95,
      "suggested_interview_questions": [
        "Explain your strategy for fine-tuning embeddings on specialized domain datasets.",
        "How do you address context length limits or high latency issues in production RAG systems?"
      ],
      "compensation_recommendation": "$175,000 starting base + full equity allocation"
    },
    "emails": {
      "interview_invitation": "Subject: Interview Schedule - Synapse Analytics...",
      "rejection_email": "Subject: Status Update...",
      "offer_letter": "Subject: Written Offer...",
      "follow_up": "Subject: Follow-up..."
    }
  }
}
```

---

## 🚀 Key Improvements & Visual Polishing

In accordance with strict visual craft and operational standards, the following enhancements have been seamlessly implemented:

1. **Robust Confirmation Modals (Anti-Iframe Blocks)**: Standard `window.confirm` dialogues fail silently in web viewports due to strict browser iframe sandboxing rules. We replaced all delete procedures with slick **inline-interactive confirmation panels** with micro-transitions (staggered fade-in) so that deleting jobs or applicants is 100% responsive, reliable, and smooth.
2. **Interactive Stats Cards**: The metrics dashboard cards (Total Jobs, Applicants, Eligible, Rejected, Avg Score, Strong Hire) are now fully clickable and styled with smooth hovering gradients. Clicking them dynamically routes users to their respective sub-views instantly.
3. **Clean & Lean Data Presets**: Removed all cluttered, irrelevant, or mock dataset entries, keeping only the highly refined **AI Engineer** role and its highly eligible lead candidate **Dr. Vikram Chandra** to present a pristine, polished initial product scope.
4. **Talent Footprint Alignment Panel**: Designed an elegant assessment visualization panel on the Candidate Profile Dossier page. It displays clean gradient progress trackers representing specialized agent evaluation domains (Domain Expertise, Experience Alignment, Decision Confidence, and Comparative Talent Rank).
5. **No Iframe Alerts**: Swapped browser-based `alert` alerts with stylish **inline action success toasts** when saving customized recruiter notes or modifying AI-formulated corporate email drafts.
