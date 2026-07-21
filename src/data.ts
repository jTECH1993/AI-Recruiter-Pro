import { Job, Candidate } from "./types";

export const PRELOADED_JOBS: Job[] = [
  {
    id: "job-2",
    title: "AI Engineer",
    company: "Synapse Analytics",
    department: "Artificial Intelligence",
    location: "New York, NY (Hybrid)",
    type: "Full-time",
    salaryRange: "$150,000 - $190,000",
    experienceRequired: "3+ years",
    educationRequired: "Bachelor's or Master's Degree in CS, Data Science, or equivalent",
    mandatorySkills: "Python, PyTorch, OpenAI API, LLMs, Vector Databases, Prompt Engineering",
    preferredSkills: "LangChain, CrewAI, FastAPI, Docker, RAG Systems, Model Fine-tuning",
    responsibilities: "- Design, build, and deploy high-performance LLM agents and multi-agent systems\n- Develop retrieval-augmented generation (RAG) pipelines over vector databases\n- Fine-tune and evaluate open-source transformer models (e.g., Llama, Mistral)\n- Optimize prompt engineering strategies and system instruction constraints",
    benefits: "- Premium health, dental, and vision insurance with 100% premiums covered\n- Hybrid schedule (2 days flexible in-office, 3 days remote)\n- $3,000 annual tech/learning stipend\n- Early-stage equity options",
    description: "Synapse Analytics is engineering the next generation of autonomous AI agent workflows. We are seeking an elite AI Engineer with a solid background in python development, Prompt Engineering, and RAG architectures to pioneer our agentic SaaS capabilities.",
    createdAt: "2026-07-18T09:30:00Z",
    thresholdScore: 75,
    extraAttributes: [
      { attribute: "Ph.D. in Computer Science", bonusScore: 10 },
      { attribute: "Docker or Kubernetes experience", bonusScore: 5 }
    ],
    analyzedRequirements: {
      job_title: "AI Engineer",
      mandatory_skills: ["Python", "PyTorch", "OpenAI API", "LLMs", "Vector Databases", "Prompt Engineering"],
      preferred_skills: ["LangChain", "CrewAI", "FastAPI", "Docker", "RAG Systems", "Model Fine-tuning"],
      minimum_experience: "3 years",
      required_education: "Bachelor's or Master's Degree in CS, Data Science, or equivalent",
      certifications: [],
      soft_skills: ["Creative Problem Solving", "Analytical Thinking", "Technical Leadership", "Team Collaboration"]
    }
  }
];

export const PRELOADED_CANDIDATES: Candidate[] = [
  {
    id: "candidate-3",
    jobId: "job-2",
    name: "Dr. Vikram Chandra",
    email: "vikram.chandra@synapsenet.org",
    phone: "+1 (212) 808-4123",
    resumeText: `DR. VIKRAM CHANDRA
New York, NY | vikram.chandra@synapsenet.org | +1 (212) 808-4123

SUMMARY
AI Research Scientist and Data Engineer with 4+ years of post-degree experience. Specializes in Deep Learning, Large Language Model fine-tuning, and Agentic Workflow design. Proven record of deploying production-grade AI microservices.

PROFESSIONAL EXPERIENCE
Lead AI Engineer | Cognition Corp (2023 - Present)
- Developed and deployed an internal LLM-powered legal research agent using LangChain, Vector Databases, and Python.
- Fine-tuned Llama-2-13B models for client specific terminology, increasing sentiment analysis accuracy by 14%.
- Developed real-time streaming APIs on FastAPI with Dockerized containers on GCP.
- Managed large SQL clusters containing millions of transactional search profiles.

Data Scientist | AlphaMetrics (2021 - 2023)
- Implemented deep learning classification pipelines on PyTorch for high-frequency financial signals.
- Configured complex data extraction pipelines for large-scale databases using Postgres and PySpark.

EDUCATION
Ph.D. in Computer Science (AI Specialization) | Columbia University (Graduated 2021)
M.S. in Mathematics | Columbia University (Graduated 2018)

SKILLS
- Programming: Python, SQL, C++, R, Bash
- AI/ML: PyTorch, Hugging Face, LLMs, LangChain, CrewAI, Pinecone, ChromaDB
- Platforms: Google Cloud (GCP), AWS, Docker, Kubernetes, Linux
- Data: Postgres, MongoDB, Apache Spark, Pandas`,
    matchScore: 0,
    eligibilityStatus: "Pending"
  }
];
