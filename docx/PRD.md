PRODUCT REQUIREMENTS DOCUMENT (PRD)
PROJECT BRAIN: THE DELIVERY MEMORY ENGINE
Team Name: Tech-Blitz

Hackathon Track: Problem Statement 06 – INNOVISTA Hackathon

Document Version: v1.0 (Final Draft)

Date: November 2026

Status: Approved for Prototype / Hackathon Evaluation

1. Document Information and Version History
This document establishes the official product specification and architectural baseline for Project Brain, developed by Team Tech-Blitz for the INNOVISTA Hackathon.

Version	Date	Author / Role	Change Description
v0.1	Oct 24, 2026	Tech-Blitz PM	Initial PRD Outline & Scope Framing
v0.8	Oct 28, 2026	Tech-Blitz Lead Architect	Added Functional Specs, Architecture & Data Model
v1.0	Nov 01, 2026	Tech-Blitz Team Lead	Final Comprehensive Draft for INNOVISTA Evaluation
2. Executive Summary
Modern software engineering organizations suffer from severe Institutional Amnesia. While Version Control Systems (VCS) like GitHub excel at tracking WHAT code changed, they fail to preserve WHY those changes occurred, WHAT alternative architectures were rejected, and WHAT unintended downstream effects (Blast Radius) a modification might trigger.

Project Brain ("The Delivery Memory Engine") is an AI-powered project memory and knowledge management platform designed to eliminate institutional technical debt and developer context-switching. By ingesting commits, pull requests, issues, discussions, and code artifacts into a hybrid Knowledge Graph and Vector Database, Project Brain provides developers with immediate, source-backed answers to architectural questions and deterministic impact analysis before code changes are committed.

Core Philosophy: GitHub tells you WHAT happened. Project Brain helps you understand WHY it happened – and what could happen next.

3. Product Overview
Project Brain acts as an autonomous contextual memory layer sitting above standard software development toolchains. It transforms fragmented engineering artifacts into a structured, interconnected knowledge graph.

3.1 Core Value Proposition
Knowledge Preservation: Automatically captures context during active development without requiring manual documentation.

Contextual Retrieval: Provides an AI Assistant capable of synthesizing answers rooted strictly in verifiable project history.

Risk Reduction (Blast Radius): Visualizes dependencies and alerts engineers to potential side effects before code refactoring.

4. Problem Statement
Problem Statement PS 06 – INNOVISTA Hackathon addresses Institutional Amnesia in software engineering teams.

Consider a common enterprise scenario: A retail platform needs to add festive Diwali promotional banners and custom animations to its checkout flow. The task is assigned to a junior developer. However, the original author of the checkout module left the organization six months prior. Although git logs show commit e4f91b ("Refactor checkout pipeline"), critical context is missing:

Why was a specific thread-locking approach selected?

Why was the state stored in Redis rather than LocalSession?

What hidden dependencies link the payment gateway to the notification microservice?

What breaks if the junior developer modifies line 142 of order_processor.py?

The code remains available in GitHub, but the technical reasoning and architectural intent are lost forever, forcing developers to waste hundreds of hours reverse-engineering existing code or re-introducing previously resolved bugs.

5. Existing Solutions and Gaps
Tool Category	Primary Strength	Critical Gap / Limitation	Project Brain Resolution
GitHub / Git Logs	Tracks exact line changes and commit authors.	Shows WHAT changed; provides zero architectural rationale or business justification.	Extracts intent and connects PRs/Issues to commit rationale.
Wiki / Notion / Confluence	Captures high-level documentation and specs.	Stale within weeks; completely disconnected from live codebase changes.	Dynamically indexes live codebase changes and git events continuously.
Standard Code AI (Copilot)	Generates inline code snippets and syntax.	Lacks repository-wide historical context; prone to hallucinations without grounding.	Uses Knowledge Graph RAG with strict source traceability.
Static Analysis Tools	Identifies syntax errors and security vulnerabilities.	Fails to capture operational context, historical PR discussions, or business rules.	Combines structural AST parsing with historical git commit memory.
6. Product Vision and Objectives
6.1 Product Objectives
Eliminate Context Loss: Centralize project memory across code, commits, PRs, and issues.

Accelerate Developer Onboarding: Enable new engineers to self-serve historical decision context in seconds.

Prevent Refactoring Regression: Provide deterministic Blast Radius analysis prior to code merges.

6.2 Measurable Business Outcomes (Proposed Targets)
50% Reduction in developer time spent searching for legacy decision rationale.

35% Faster onboarding time for junior engineers joining legacy projects.

25% Decrease in unintended breaking changes during major refactoring sprints.

7. Target Audience and User Personas
Persona / Role	Primary Goals	Key Pain Points	Project Brain Impact
Junior Developer (e.g., Alex)	Understand legacy code, complete tasks safely without breaking production.	Fear of modifying legacy code; lack of senior mentor availability; opaque commit logs.	Instant AI queries explaining WHY code was written and what files it impacts.
Senior Developer (e.g., Sarah)	Architect complex features, perform code reviews, maintain system stability.	Interrupted constantly by team members asking about legacy decisions.	Offloads repetitive context questions to AI; provides visual Knowledge Graph.
Tech Lead / Architect (e.g., Marcus)	Ensure architectural standards, mitigate technical debt, evaluate refactoring risk.	Architectural drift; loss of key context when senior devs leave company.	Maintains continuous delivery memory and deterministic impact analysis.
Engineering Manager (e.g., Priya)	Maximize velocity, reduce onboarding friction, ensure business continuity.	Delayed timelines due to context loss and knowledge silos during turnover.	Preserves enterprise knowledge capital across team transitions.
8. Product Scope
Scope Tier	Included Features & Capabilities	Strategic Rationale
MVP Scope (Hackathon)	
• GitHub Integration (OAuth + GraphQL API)


• Ingestion Pipeline (Commits, PRs, Files, Issues)


• Knowledge Graph (Nodes: Commit, File, PR, Issue)


• AI Assistant (RAG over Graph + Vector Store)


• Impact Analysis / Blast Radius (AST + Commit graph)


• Knowledge Repository & Search UI

Delivers the core end-to-end Delivery Memory Engine to prove Problem Statement 06.
Extended Scope (Post-Hackathon)	
• Slack / Teams Bot Integration for decision capture


• Jira & Confluence full bidirectional sync


• Automatic PR Context Comments in GitHub Actions


• Multi-repository cross-dependency tracking

Extends memory capture beyond VCS into daily chat and project management tooling.
Future Scope (Enterprise)	
• Autonomous Code Refactoring proposals based on memory


• On-premise LLM deployment for strict data privacy


• Semantic Architecture Drift Alerts

Scales product to enterprise security and autonomous governance.
9. Core Features and Modules
Project Memory Engine: Continuous multi-source ETL pipeline indexing commits, PRs, issues, and code artifacts.

AI-Powered Assistant: Conversational RAG interface providing grounded answers with verifiable citation links.

Interactive Knowledge Graph: Node-edge visualizer mapping relationships between files, PRs, and architectural decisions.

Impact Analysis / Blast Radius: Dependency map highlighting affected code paths and risk levels prior to refactoring.

Knowledge Repository: Full-text and semantic search engine across all indexed project artifacts.

Project Management Console: Multi-repo management dashboard displaying synchronization status and memory health metrics.

10. Functional Requirements
Req ID	Feature Name	Description	Interaction	System Behavior	Input	Output	Preconditions	Acceptance Criteria	Priority
FR-MEM-001	Project Ingestion	Ingest GitHub commits, PRs, issues, and file tree upon connecting repo.	Click "Connect Repo"	Ingestion worker fetches metadata and builds Graph/Vector DB	OAuth Token, Repo URL	Indexed Status, Ingestion Log	User authenticated	100% of commits/PRs indexed within 5m for 1k-commit repo.	Must Have
FR-MEM-002	Incremental Ingestion	Listen to Webhooks to update memory upon new push or PR.	Push code to GitHub	Webhook triggers delta ingestion job	GitHub Webhook Payload	Updated Graph & Vector nodes	Repo connected	New commits searchable within 30s of webhook delivery.	Must Have
FR-AI-001	Natural Language QA	AI Assistant answers questions regarding code rationale and decisions.	Type question in chat	System retrieves context via RAG & synthesizes answer	User query string	Source-backed Markdown answer	Project indexed	Response returned < 4s with clickable source citations.	Must Have
FR-AI-002	Source Traceability	AI Assistant must cite exact Commit SHA, PR #, or File lines.	View AI answer	Displays clickable source cards beneath response	RAG context metadata	Clickable link cards to GitHub	AI answer rendered	0 hallucinated sources; all links point to valid GitHub nodes.	Must Have
FR-AI-003	Context Fallback	AI Assistant states lack of context if evidence is unavailable.	Ask out-of-scope question	Evaluates relevance score; triggers fallback response	Irrelevant query	"Insufficient context in project memory."	Project indexed	Rejection triggered when retrieval confidence < 0.65.	Must Have
FR-KG-001	Graph Visualizer	Render interactive 2D node-edge graph of repository artifacts.	Navigate to Graph View	Renders nodes (Files, Commits, PRs) and relationships	Repo ID	Interactive D3/Force graph UI	Repo ingested	Graph renders < 2s for up to 500 nodes; supports drag/zoom.	Must Have
FR-KG-002	Node Inspector	User clicks graph node to inspect metadata and AI summary.	Click node	Opens slide-over panel with metadata & context	Node ID click	Detail Panel with audit history	Graph visible	Panel loads instantly (<200ms) with commit diff log.	Should Have
FR-IMP-001	Blast Radius Analysis	Analyze proposed edit and highlight affected downstream files.	Select file/diff	Traverses Graph & AST call graph; calculates risk score	File path / Diff	List of affected files + Severity Score	Repo ingested	Identifies all 1st and 2nd-degree structural/historical dependencies.	Must Have
FR-REP-001	Knowledge Search	Search all indexed project memory via semantic/keyword filters.	Enter search term	Queries Hybrid Search (BM25 + Dense Vectors)	Search string, Filters	Paginated list of Memory Records	Project selected	Search results returned < 500ms.	Must Have
FR-PRJ-001	Project Console	View and manage multiple connected repositories.	Open Dashboard	Lists connected repos, sync status, commit count, & storage	User Session	Project Cards Grid	User logged in	Lists all authorized user projects accurately.	Must Have
11. User Stories
ID	User Role	Action (I want to...)	Benefit (So that...)	Acceptance Criteria
US-01	Junior Developer	Ask AI why legacy code was written	Understand historical rationale without interrupting seniors	Given an indexed repo, when Alex asks "Why is Redis used for session locking?", then AI answers citing Commit b7a9f2 & PR #42.
US-02	Senior Developer	Run Impact Analysis before refactoring	Identify hidden downstream dependencies and avoid outages	Given a proposed change to auth_service.py, when Sarah runs Blast Radius, then system highlights user_controller.py as high risk.
US-03	Tech Lead	Explore the interactive Knowledge Graph	Visualize connections between decisions and code files	Given a project graph, when Marcus clicks order_processor.py, system highlights all connected PRs, Issues, and author commits.
US-04	Engineering Manager	Onboard new developers via Knowledge Search	Reduce onboarding friction and minimize context loss	Given a newly connected project, when a new hire searches "Diwali animation setup", all historical promotional commits/docs return.
12. User Flows
12.1 Flow 1: Project Onboarding & Knowledge Ingestion
[User Login] ➔ [GitHub OAuth Auth] ➔ [Select Repository] ➔ [Trigger Connection] ➔ [ETL Ingest Commits/PRs/Issues] ➔ [Build AST & Knowledge Graph] ➔ [Generate Vector Embeddings] ➔ [Indexing Complete Dashboard]

12.2 Flow 2: AI Assistant Rationale Retrieval
[Open AI Chat] ➔ [Enter Query] ➔ [Vector Search + Graph Traversal] ➔ [LLM Context Synthesis] ➔ [Verify Citations] ➔ [Render Markdown Answer with Source Cards]

12.3 Flow 3: Blast Radius / Impact Analysis
[Select Target File] ➔ [Click 'Analyze Impact'] ➔ [System Parses Import AST & Commit Co-change Matrix] ➔ [Calculate Risk Score] ➔ [Render Color-Coded Blast Radius Graph] ➔ [Inspect Risk Warnings]

13. Non-Functional Requirements
Performance (Recommended Target): Query Response Time < 4.0 seconds. Graph rendering < 2.0 seconds for 500 nodes.

Scalability: System architecture must support up to 50,000 nodes per project without degradation in search speed.

Security & Authentication: OAuth 2.0 with GitHub provider. All data encrypted in transit (TLS 1.3) and at rest (AES-256).

Data Privacy: Code artifacts and embeddings must NEVER be used for training public LLM models. Strict tenant isolation.

Reliability: API target availability of 99.5% uptime during evaluation operations.

Traceability: 100% of AI answers must provide direct clickable links to verifiable GitHub commit SHAs or PR URLs.

14. System Architecture
Project Brain utilizes a modern, decoupled microservices architecture designed for high-throughput ingestion and rapid hybrid search retrieval:

+-----------------------------------------------------------------------+
|                            NEXT.JS FRONTEND                           |
|      (Dashboard, AI Chat UI, D3.js Knowledge Graph, Blast Radius)     |
+-----------------------------------------------------------------------+
                                   | (REST / GraphQL APIs)
                                   v
+-----------------------------------------------------------------------+
|                          FASTAPI BACKEND GATEWAY                      |
+-----------------------------------------------------------------------+
       |                           |                            |
       v                           v                            v
+--------------+        +--------------------+        +-----------------+
|  CELERY ETL  |        | LANGCHAIN RAG ENGINE|        | IMPACT ANALYSIS |
| (GitHub Sync)|        | (LLM Orchestration)|        |  (AST Analyzer) |
+--------------+        +--------------------+        +-----------------+
       |                           |                            |
       +-------------------+-------+----------------------------+
                           |
                           v
+-----------------------------------------------------------------------+
|                             DATA LAYER                                |
|   - Neo4j / NetworkX (Knowledge Graph: Files, Commits, PRs)           |
|   - Qdrant / Pinecone (Vector Database: Embeddings & Context)         |
|   - PostgreSQL (User Sessions, Projects Metadata, Auth Tokens)        |
+-----------------------------------------------------------------------+
15. Data Requirements & Knowledge Modeling
15.1 Graph Entities (Nodes)
Repository Node: (id, name, owner, url, created_at)

Commit Node: (sha, message, author, timestamp, diff_summary)

File Node: (path, language, ast_hash, last_modified)

Pull Request Node: (pr_id, title, body, state, merged_at)

Issue Node: (issue_id, title, body, status, closed_at)

15.2 Edge Relationships
(Commit)-[:MODIFIED]->(File)

(Commit)-[:ASSOCIATED_WITH]->(Pull Request)

(Pull Request)-[:RESOLVES]->(Issue)

(File)-[:DEPENDS_ON]->(File) (Derived from AST Import Analysis)

(Developer)-[:AUTHORED]->(Commit)

16. UI/UX Requirements
Executive Dashboard: Overview of connected repositories, ingestion status, sync health, and recent team questions.

AI Assistant Split View: Interactive chat interface on the left with dynamic source reference cards on the right.

Interactive Graph Workbench: Full-screen graph visualizer with color-coded node types (Blue=File, Green=Commit, Purple=PR, Yellow=Issue) and zoom/filter controls.

Blast Radius Heatmap: Code diff inspector highlighting high-risk impact paths in red and amber.

17. API and Integration Requirements
Endpoint	Method	Description	Payload / Response Summary
/api/v1/projects	GET / POST	List connected repositories or trigger new repository connection.	
Req: { repo_url: string }


Res: { project_id: string, status: "indexing" }

/api/v1/chat/query	POST	Submit natural language question to AI Assistant.	
Req: { project_id, query }


Res: { answer: string, sources: Array<Source> }

/api/v1/impact/analyze	POST	Run Blast Radius analysis for target file or commit diff.	
Req: { project_id, target_file }


Res: { impacted_nodes: Array, risk_score: float }

/api/v1/graph/nodes	GET	Fetch graph nodes and edges for visualizer.	
Params: ?project_id=123&depth=2


Res: { nodes: [], edges: [] }

18. Security, Governance, and Privacy
Role-Based Access Control (RBAC): Inherits repository access permissions directly from GitHub OAuth scopes. Users only see memory for repositories they have read access to.

Encryption Standards: AES-256 for data at rest (vector embeddings & cached metadata); TLS 1.3 for data in transit.

Data Isolation: Tenant-level vector collections and graph namespaces prevent cross-organization memory bleeding.

Compliance & Privacy: No code stored in public model training logs; strict opt-in data retention policies.

19. Acceptance Criteria Summary
To consider the Project Brain hackathon deliverable complete, the platform must satisfy:

✔ Successful OAuth login and repository connection flow.

✔ Ingestion of at least 50 commits and 10 PRs into a visible Knowledge Graph.

✔ Accurate AI Assistant answers for 3 complex architectural queries with verifiable links.

✔ Functional Blast Radius demonstration highlighting downstream dependencies for a selected file.

20. Risks and Mitigation Strategies
Risk Factor	Potential Impact	Mitigation Strategy	Owner
Incomplete GitHub Context	Poor AI answer quality if PR descriptions are sparse or empty.	Supplement git history with AST structural code parsing and issue comments.	AI Eng Lead
GitHub API Rate Limits	ETL ingestion failure on large repositories during demo.	Implement aggressive GraphQL pagination, local caching, and Webhook deltas.	Backend Lead
AI Hallucination	Developer receives incorrect technical guidance.	Strict RAG thresholding (min score 0.65) and mandatory source citation links.	AI Eng Lead
Large Repo Graph Overload	UI browser freezing when rendering 10,000+ nodes.	Implement WebGL graph rendering and dynamic node clustering at depth levels.	Frontend Lead
21. Proposed Success Metrics
Retrieval Accuracy: Precision@K and MRR (Mean Reciprocal Rank) > 0.85 for historical decision retrieval.

Time-to-Answer: Average time to resolve legacy code questions reduced from 45 minutes (manual search) to < 30 seconds.

Blast Radius Recall: > 90% accuracy in identifying broken import paths during simulated refactoring.

22. MVP Implementation Roadmap
Phase	Timeline	Key Deliverables	Milestone Target
Phase 1	Hackathon Day 1	
• Architecture & FastAPI Backend Setup


• GitHub OAuth & GraphQL Ingestion ETL


• Graph Schema Definition (Neo4j / NetworkX)

Ingestion Pipeline Operational
Phase 2	Hackathon Day 2	
• Vector Store & RAG Pipeline Integration


• Next.js Dashboard & AI Chat UI


• D3.js Knowledge Graph Rendering

Core AI & Graph Functional
Phase 3	Hackathon Day 3	
• AST Blast Radius Calculator


• End-to-End System Testing & Bug Fixes


• Final Demo Video & Pitch Deck Prep

MVP Ready for Evaluation
23. Future Scope & Research Directions
Autonomous Architecture Compliance: Real-time CI/CD bot rejecting PRs that violate established memory rules.

IDE Native Extensions: VS Code / JetBrains plugins delivering Blast Radius tooltips inline as developers type.

Voice-Activated Code Memory: Natural language audio queries during team standups and architecture reviews.

24. Glossary of Terms
Institutional Amnesia: The loss of underlying knowledge, technical context, and decision rationale when software developers leave an organization.

Blast Radius / Impact Analysis: The process of identifying all files, modules, and microservices affected by modifying a specific piece of code.

Knowledge Graph (KG): A graph-structured data model representing real-world entities (commits, PRs, files) and their relationships.

RAG (Retrieval-Augmented Generation): An AI technique combining external information retrieval with large language models to generate source-backed answers.

AST (Abstract Syntax Tree): A tree representation of the abstract syntactic structure of source code used for program analysis.
