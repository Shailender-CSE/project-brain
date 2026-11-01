# PRD.md

## 1. Document Information and Version History

* **Product Name:** Project Brain
* **Tagline:** The Delivery Memory Engine
* **Problem Statement ID & Title:** PS 06: INNOVISTA Hackathon – Delivery Memory Engine / Institutional Amnesia Tracker
* **Hackathon Name:** INNOVISTA Hackathon
* **Team Name:** Tech-Blitz
* **Document Version:** 1.0.0
* **Creation Date:** 2026-10-28
* **Document Status:** DRAFT - Approved for MVP Architecture & Prototype Development
* **Project Stakeholders:** INNOVISTA Hackathon Judges, Technical Architects, Software Engineering Teams, Product Managers

### Version History

| Version | Date | Author / Role | Change Description |
| :--- | :--- | :--- | :--- |
| v0.1.0 | 2026-10-24 | Tech-Blitz Product Manager | Initial PRD outline and scope definition |
| v0.8.0 | 2026-10-26 | Tech-Blitz Architect | Added System Architecture, Data Schemas and Functional Specs |
| v1.0.0 | 2026-10-28 | Tech-Blitz Team Lead | Finalized PRD for INNOVISTA Hackathon Submission |

---

## 2. Executive Summary

Modern software engineering organizations suffer from severe **Institutional Amnesia**. While traditional Version Control Systems (VCS) like GitHub track *WHAT* code was committed, they fail to capture *WHY* architectural decisions were made, *WHAT* alternative implementations were rejected, and *WHAT* unintended side effects (*Blast Radius*) a change might trigger. When key developers leave an organization, this unwritten context is lost forever.

**Project Brain** ("The Delivery Memory Engine") is an AI-powered project memory and knowledge management platform designed to eliminate institutional technical debt and developer context-switching. By ingesting commits, pull requests, issues, discussions, and code artifacts into a hybrid **Knowledge Graph** and **Vector Database**, Project Brain provides developers with immediate, source-backed answers to historical decision questions and deterministic impact analysis before code changes are merged.

> **Core Philosophy:** *GitHub tells you WHAT happened. Project Brain helps you understand WHY it happened – and what could happen next.*

---

## 3. Product Overview

Project Brain operates as an autonomous, contextual memory layer positioned above standard software engineering toolchains. It transforms fragmented engineering artifacts into a structured, searchable, and interconnected knowledge graph.

### Core Value Proposition
1. **Knowledge Preservation:** Automatically captures context during active development without requiring engineers to write separate, manual documentation.
2. **Contextual Retrieval:** Provides a natural-language AI Assistant capable of synthesizing answers rooted strictly in verifiable project history.
3. **Risk Mitigation (Blast Radius):** Visualizes code dependencies and alerts engineers to potential downstream side effects prior to code refactoring.

---

## 4. Problem Statement

* **Official Problem Statement:** PS 06 – INNOVISTA Hackathon: Resolving Institutional Amnesia in Software Engineering Teams.
* **Problem Context:** Consider a real-world enterprise situation: A retail website needs to add festive Diwali animations or promotional banners to its checkout flow. The task is assigned to a junior developer. However, the original developer who wrote that part of the codebase left the company six months prior.
* **Existing Gaps:** The junior developer can access the repository and review previous GitHub commits, but critical questions remain unanswered:
  * *Why was a particular commit made?*
  * *Why was a specific coding approach selected over alternatives?*
  * *Why was the state stored in Redis rather than LocalSession?*
  * *What problem was the original developer trying to solve?*
  * *What could break if line 142 of `order_processor.py` is modified?*
  * *Which other microservices or files depend on this component?*
* **Root Causes:** VCS commit logs emphasize diffs over intent. PR discussions, issue tickets, and developer chats are disconnected from raw source code files.
* **Affected Stakeholders:** Junior developers struggling with codebase onboarding; Senior developers interrupted by repetitive context questions; Engineering Leaders facing productivity drop-off during team transitions.
* **Consequences:** Wasted engineering hours reverse-engineering existing code, re-introducing previously resolved bugs, and accumulating technical debt.

---

## 5. Existing Solutions and Gaps

| Tool Category | Primary Strength | Critical Gap / Limitation | Project Brain Resolution |
| :--- | :--- | :--- | :--- |
| GitHub / Git Logs | Tracks exact line diffs and commit authors. | Captures WHAT changed; provides zero architectural rationale or business context. | Connects commits, PR comments, and issues to extract architectural intent. |
| Wikis / Notion / Confluence | Captures high-level documentation and specs. | Becomes stale within weeks; completely disconnected from live codebase changes. | Dynamically indexes live git events and codebase changes in real time. |
| Standard Code AI (Copilot) | Generates inline code snippets and syntax. | Lacks repository-wide historical decision context; prone to hallucinations without grounding. | Uses Knowledge Graph RAG with mandatory, clickable source traceability. |
| Static Analysis Tools | Identifies syntax errors and security bugs. | Fails to capture human operational context, historical PR discussions, or business rules. | Combines structural AST parsing with historical commit memory. |

---

## 6. Product Vision and Objectives

* **Product Vision:** To become the permanent delivery memory engine for software teams, ensuring enterprise technical knowledge compounds over time rather than decaying.
* **Primary Product Objectives:**
  * Build a searchable project memory engine connecting code, commits, PRs, and issue histories.
  * Reduce developer onboarding and context retrieval time by over 50%.
  * Provide deterministic Blast Radius / Impact Analysis prior to committing code modifications.
* **Measurable Business Outcomes (Proposed Metrics):**
  * **50% Reduction** in developer time spent reverse-engineering legacy code logic.
  * **35% Acceleration** in junior developer onboarding speed on complex codebases.
  * **25% Decrease** in unintended breaking changes during major refactoring sprints.
* **Explicit Non-Goals:**
  * We are not building a generic code autocomplete/copilot editor.
  * We are not guaranteeing 100% predictive certainty in impact analysis (it provides heuristic/AST-based impact risk mapping).

---

## 7. Target Audience and User Personas

| Persona / Role | Primary Goals | Key Pain Points | Project Brain Impact |
| :--- | :--- | :--- | :--- |
| Junior Developer (Alex, 1 yr exp) | Understand legacy code quickly; complete tickets safely without breaking production. | Intimidated by legacy code; lacks access to original authors; fears breaking production. | Ask natural-language questions to understand WHY code was written and see direct file dependencies. |
| Senior Developer (Sarah, 6 yrs exp) | Refactor core modules efficiently; perform fast code reviews; focus on complex architecture. | Constantly interrupted by team asking "Why did we write it this way?"; context loss when devs leave. | Offloads repetitive context queries to AI; uses Blast Radius to review risky PRs. |
| Tech Lead / Architect (Marcus, Lead) | Maintain architectural standards; mitigate technical debt; evaluate codebase stability. | Architectural drift; difficulty tracking historical decisions across multiple microservices. | Visualizes interconnected repository dependencies via the interactive Knowledge Graph. |
| Engineering Manager (Priya, EM) | Reduce team onboarding friction; ensure business continuity during developer turnover. | Project delays caused by knowledge silos and employee offboarding. | Preserves institutional technical capital across team transitions. |

---

## 8. Product Scope

| Scope Tier | Included Features and Capabilities | Strategic Rationale |
| :--- | :--- | :--- |
| MVP Scope (Hackathon Baseline) | GitHub Integration, Ingestion Pipeline, Knowledge Graph, AI Assistant, Impact Analysis, Knowledge Repository UI | Delivers the core end-to-end Delivery Memory Engine to prove Problem Statement 06. |
| Extended Scope (Post-Hackathon) | Slack and Teams Bot Integration, Jira and Confluence bidirectional sync, PR Context Comments in GitHub Actions | Extends memory capture beyond VCS into daily chat and project management tooling. |
| Future Scope (Enterprise) | Autonomous Code Refactoring proposals based on memory, On-premise LLM deployment, Semantic Architecture Drift Alerts | Scales product to enterprise security and autonomous governance. |

---

## 9. Core Features and Modules

1. **Project Memory Engine:** Continuous multi-source ETL pipeline indexing commits, PRs, issues, and code artifacts.
2. **AI-Powered Assistant:** Conversational RAG interface providing grounded answers with verifiable citation links.
3. **Interactive Knowledge Graph:** Node-edge visualizer mapping relationships between files, PRs, and architectural decisions.
4. **Impact Analysis / Blast Radius:** Dependency map highlighting affected code paths and risk levels prior to refactoring.
5. **Knowledge Repository:** Full-text and semantic search engine across all indexed project artifacts.
6. **Project Management Console:** Multi-repo management dashboard displaying synchronization status and memory health metrics.

---

## 10. Functional Requirements

| Req ID | Feature Name | Description | User Interaction | System Behavior | Input | Output | Preconditions | Acceptance Criteria | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| FR-MEM-001 | Repository Ingestion | System shall ingest GitHub commits, PRs, issues, and file tree upon connecting a repository. | Click "Connect Repo" button | Ingestion worker fetches metadata and constructs Graph and Vector DB | OAuth Token, Repo URL | Ingestion log, Indexed nodes | User authenticated via GitHub | 100% of commits and PRs indexed within 5m for a 1,000-commit repo. | Must Have |
| FR-MEM-002 | Incremental Ingestion | System shall update memory records upon receiving GitHub Webhook events. | Push commit to GitHub | Webhook triggers delta ingestion job | GitHub Webhook Payload | Updated Graph and Vector nodes | Repo connected | New commits searchable within 30s of webhook payload delivery. | Must Have |
| FR-AI-001 | Natural Language QA | AI Assistant shall answer questions regarding project decisions, history, and code rationale. | Type question in chat | System retrieves context via RAG and synthesizes answer | User query string | Source-backed Markdown answer | Repo ingested | Response returned in less than 4s with clickable source citations. | Must Have |
| FR-AI-002 | Source Traceability | System must provide exact source links (Commit SHA, PR #, File lines) for every claim made by AI. | Click source card under AI answer | Navigates to corresponding GitHub commit/PR or node view | Source Metadata ID | Redirect to source | AI answer rendered | 0 hallucinated sources; 100% of links lead to valid ingested records. | Must Have |
| FR-AI-003 | Context Fallback | System shall state lack of context rather than hallucinating if evidence is unavailable. | Ask out-of-scope question | Evaluates relevance score; triggers fallback response | Irrelevant Query | "Insufficient context in project memory." | Repo ingested | Fallback triggered when retrieval confidence score is below 0.65. | Must Have |
| FR-KG-001 | Graph Visualizer | System shall render an interactive 2D node-edge graph representing repository artifacts. | Click "Knowledge Graph" tab | Renders nodes (Files, Commits, PRs, Issues) and relationships | Repo ID | Interactive D3/Force graph UI | Repo ingested | Graph renders in less than 2s for up to 500 nodes; supports zoom and drag. | Must Have |
| FR-KG-002 | Node Inspector | User can click any node in graph to view detailed metadata and associated history. | Click node on canvas | Opens slide-over panel displaying metadata and context | Node ID click event | Side Panel UI with node details | Graph visible | Panel loads in less than 200ms showing commit diff log and author. | Should Have |
| FR-IMP-001 | Blast Radius Analysis | System shall calculate downstream affected files and risk levels for a target file or code change. | Select file/diff | Traverses Graph and AST call graph; calculates risk score | Target File / Code Diff | Ranked list of affected files and Risk Score | Repo ingested | Accurately identifies 1st and 2nd-degree structural and historical dependencies. | Must Have |
| FR-REP-001 | Knowledge Search | User can search indexed project memory using semantic or keyword filters. | Enter keyword in Search bar | Queries Hybrid Search (BM25 + Dense Vectors) | Query text, Filter tags | Paginated list of Memory Records | Project selected | Results returned in less than 500ms. | Must Have |
| FR-PRJ-001 | Project Console | User can view and manage multiple connected software projects. | Open Dashboard | Lists connected repos, sync status, commit count, and storage | User Session Token | Project Cards Grid UI | User logged in | Correctly lists all authorized user projects accurately. | Must Have |

---

## 11. User Stories and Acceptance Criteria

| ID | User Role | Action (I want to...) | Benefit (So that...) | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- |
| US-01 | Junior Developer | Ask AI why legacy code was written | Understand historical rationale without interrupting seniors | Given an indexed repo, when Alex asks "Why is Redis used for session locking?", AI answers citing Commit b7a9f2 and PR #42. |
| US-02 | Senior Developer | Run Impact Analysis before refactoring | Identify hidden downstream dependencies and avoid outages | Given a proposed change to auth_service.py, when Sarah runs Blast Radius, system highlights user_controller.py as high risk. |
| US-03 | Tech Lead | Explore the interactive Knowledge Graph | Visualize connections between decisions and code files | Given a project graph, when Marcus clicks order_processor.py, system highlights all connected PRs, Issues, and author commits. |
| US-04 | Engineering Manager | Onboard new developers via Knowledge Search | Reduce onboarding friction and minimize context loss | Given a newly connected project, when a new hire searches "Diwali animation setup", all historical promotional commits return within 500ms. |

---

## 12. User Flows

### Flow 1: Project Onboarding & Knowledge Ingestion
`[User Login via GitHub OAuth]` ➔ `[Dashboard: Select Repo]` ➔ `[Click 'Connect Repository']` ➔ `[ETL Worker Ingests Commits/PRs/Issues]` ➔ `[Build AST & Knowledge Graph]` ➔ `[Generate Dense Embeddings -> Vector Store]` ➔ `[Project Memory Ready]`

### Flow 2: AI Assistant Decision Retrieval
`[Open AI Chat]` ➔ `[Enter Query: 'Why was this commit made?']` ➔ `[Vector Search + Graph Traversal]` ➔ `[Check Confidence > 0.65]` ➔ `[LLM Context Synthesis]` ➔ `[Render Answer with Clickable Source Cards]`

### Flow 3: Blast Radius / Impact Analysis
`[Select Target File / Diff]` ➔ `[Click 'Analyze Impact']` ➔ `[Parse AST Imports & Commit Co-change Matrix]` ➔ `[Calculate Severity Score]` ➔ `[Render Color-Coded Blast Radius Graph UI]`

---

## 13. Non-Functional Requirements

| Category | Specification / Target | Detailed Requirement Description | Priority |
| :--- | :--- | :--- | :--- |
| Performance | Query Latency less than 4.0s, Graph Render less than 2.0s | AI Assistant response time must complete under 4s. Knowledge Graph UI must render up to 500 nodes within 2 seconds. | High *(Recommended)* |
| Scalability | Up to 50,000 Nodes, 100 Concurrent Users | Database architecture must scale to 50,000 nodes per project without degradation in search speed. | High |
| Security & Auth | OAuth 2.0 / JWT, AES-256 Encryption | Authentication handled via GitHub OAuth 2.0. Access tokens and repo data encrypted at rest (AES-256) and in transit (TLS 1.3). | Must Have |
| Data Privacy | Zero LLM Training Use | Code artifacts and embeddings must NEVER be used to train public LLM models. Strict multi-tenant isolation. | Must Have |
| Reliability | 99.5% Uptime Target | API gateway must maintain 99.5% uptime during hackathon testing. Fallback rate limits for external APIs. | Must Have |
| Traceability | 100% Citation Verifiability | 100% of AI answers must provide direct clickable links to verifiable GitHub commit SHAs or PR URLs. | Must Have |

---

## 14. System Architecture

Project Brain utilizes a modern microservices architecture designed for background ETL ingestion, graph rendering, and RAG retrieval: