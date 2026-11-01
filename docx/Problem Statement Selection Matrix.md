# Problem Statement Selection Matrix
## Project Brain AI — The Memory Layer for Software Engineering

## 1. Purpose

The purpose of this selection matrix is to identify and evaluate potential problems in software engineering and select the most relevant problem for Project Brain AI.

Instead of directly choosing a solution, we first examine the challenges developers face while working with large and evolving codebases.

The selected problem should:

- Address a genuine developer pain point.
- Have practical value in real-world software development.
- Be technically feasible to demonstrate.
- Offer meaningful differentiation from existing developer tools.
- Support future expansion into a complete engineering intelligence platform.

---

## 2. Identified Problem Areas

After examining common software development workflows, we identified five potential problem areas.

### Problem 1: Difficulty Understanding Existing Codebases

Developers joining an existing project often struggle to understand:

- How different modules work together.
- Where important functions and components are located.
- How data flows through the application.
- Why a particular implementation was chosen.
- Which files are responsible for specific functionality.

**Core issue:** Understanding an unfamiliar codebase requires significant manual exploration and developer effort.

### Problem 2: Lack of Change Impact Visibility

Developers frequently modify existing code without having a complete understanding of its dependencies.

This can lead to:

- Unexpected side effects.
- Breaking dependent modules.
- Missed test cases.
- Regression bugs.
- Additional debugging and maintenance effort.

**Core issue:** Developers lack a unified view of what could be affected before making a code change.

### Problem 3: Loss of Engineering Decisions and Project Knowledge

Important engineering knowledge is often scattered across:

- Documentation.
- Commit messages.
- Issue discussions.
- Technical notes.
- Team conversations.
- Source code comments.

When developers leave or project ownership changes, understanding the reasons behind previous decisions becomes difficult.

**Core issue:** Projects preserve source code, but the reasoning and historical context behind that code are not always preserved in an accessible form.

### Problem 4: Difficulty Tracking Previous Bugs

Developers may encounter bugs similar to previously resolved issues.

However, the information needed to understand past incidents is often distributed across different files and records.

This makes it difficult to:

- Identify recurring problems.
- Understand previous fixes.
- Trace related modules.
- Learn from past debugging efforts.

**Core issue:** Historical bug knowledge is difficult to retrieve and connect with the current codebase.

### Problem 5: Fragmented Engineering Knowledge

A software project contains more than source code. It also contains architectural decisions, documentation, dependencies, test information, and bug history.

When these elements are disconnected, developers must manually combine information from multiple sources.

**Core issue:** There is no unified engineering memory connecting what the code does, why it exists, what happened previously, and what might be affected by future changes.

---

## 3. Evaluation Criteria

We use six criteria to evaluate the identified problem statements.

| Evaluation Criterion | Weight | Explanation |
|---|---:|---|
| Developer Impact | 25% | How significantly does the problem affect developers? |
| Problem Frequency | 20% | How frequently can this problem occur? |
| Technical Feasibility | 20% | Can the problem be addressed with available technologies and resources? |
| Differentiation | 15% | Does the proposed direction offer a meaningful distinction? |
| Demo Potential | 10% | Can the solution be demonstrated clearly during a hackathon? |
| Data Availability | 10% | Can the system obtain sufficient project information to address the problem? |
| **Total** | **100%** | |

### Scoring Method

Each problem is evaluated on a scale of 1 to 5.

- 1 — Very Low
- 2 — Low
- 3 — Moderate
- 4 — High
- 5 — Very High

Weighted Score Formula:

**Weighted Score = Σ (Criterion Weight × Score / 5)**

The scores below are preliminary team-assessment estimates. They are not results of a user survey or empirical experiment.

---

## 4. Problem Statement Comparison Matrix

| Problem Area | Impact (25) | Frequency (20) | Feasibility (20) | Differentiation (15) | Demo (10) | Data (10) | Total |
|---|---:|---:|---:|---:|---:|---:|---:|
| Codebase Understanding | 4 | 5 | 5 | 2 | 5 | 5 | 86 |
| Change Impact Visibility | 5 | 4 | 3 | 4 | 5 | 4 | 83 |
| Engineering Decision Memory | 4 | 3 | 4 | 5 | 3 | 3 | 75 |
| Historical Bug Tracking | 4 | 3 | 3 | 4 | 4 | 3 | 70 |
| Unified Engineering Memory | 5 | 4 | 3 | 5 | 5 | 4 | 86 |

<small>Scores are out of 100 and reflect preliminary internal prioritization.</small>

---

## 5. Selection Analysis

### 1. Codebase Understanding

This problem has high frequency and feasibility. Existing AI coding tools already provide code search, repository context, and code explanations.

It is a useful starting point, but a standalone code-understanding assistant may not sufficiently distinguish Project Brain AI.

### 2. Change Impact Visibility

This problem has significant developer impact. Understanding dependencies before modifying code can help developers identify potentially affected modules and tests.

It is a strong candidate for a practical demonstration using dependency analysis and graph traversal.

### 3. Engineering Decision Memory

This problem addresses an important gap in project knowledge preservation.

However, decision history may not always be available in structured form, making reliable extraction and linking more challenging.

### 4. Historical Bug Tracking

Historical bug information can help developers understand previous incidents and fixes.

Its effectiveness depends on the availability and quality of issue records, commit history, and debugging documentation.

### 5. Unified Engineering Memory

This problem connects several related engineering challenges instead of addressing only one isolated activity.

It combines:

- Codebase understanding.
- Engineering decision history.
- Change impact analysis.
- Historical bug knowledge.
- Project documentation.
- Dependency and test information.

Although it has a broader implementation scope, it offers a stronger foundation for the overall Project Brain AI vision.

---

## 6. Selected Problem Statement

<mark>Selected Direction: Unified Engineering Memory for Software Projects</mark>

### Final Problem Statement

Modern software development projects continuously evolve, but important engineering knowledge remains scattered across source code, documentation, architectural decisions, dependencies, test cases, and historical bug records.

As a result, developers often struggle to understand why specific code exists, how different components are connected, what decisions influenced the current architecture, and what might be affected when existing code is modified.

Existing development workflows often require developers to manually collect and interpret this information from multiple sources, increasing the effort required for onboarding, debugging, maintenance, and safe code changes.

**The problem is to develop an AI-powered Engineering Memory and Code Intelligence Platform that connects a software project's code, documentation, engineering decisions, dependencies, and historical issues to provide contextual, evidence-backed answers and help developers understand the potential impact of changes.**

---

## 7. How Project Brain AI Addresses the Selected Problem

Project Brain AI approaches this problem through interconnected capabilities.

| Feature | Problem Addressed | Proposed Functionality |
|---|---|---|
| Project Explorer | Difficulty understanding codebases | Helps developers explore project structure and source files. |
| Ask Brain | Scattered project information | Answers project-specific questions using retrieved project context. |
| Decision DNA | Loss of engineering decisions | Connects documented decisions with relevant code and project context. |
| Change Impact Radar | Unclear change consequences | Uses dependency relationships to identify potentially affected components. |
| Bug DNA | Loss of historical bug knowledge | Connects previous bug records, fixes, and related project components. |
| Dependency Map | Complex module relationships | Visualizes relationships between project components. |
| Test Intelligence | Unclear test coverage and impact | Identifies potentially relevant tests for affected components. |
| Knowledge Health | Fragmented or outdated information | Highlights missing, outdated, or disconnected project knowledge. |

The platform should distinguish between facts found in project sources, inferred relationships, and AI-generated explanations. Answers should include supporting file references wherever possible.

---

## 8. Proposed Scope and Boundaries

### Initial Implementation Scope

The first implementation phase will focus on:

1. Uploading project documents and supported source-code files.
2. Extracting and processing their contents.
3. Building searchable project knowledge.
4. Answering questions using Retrieval-Augmented Generation (RAG).
5. Identifying source-code dependencies.
6. Generating a dependency map.
7. Performing preliminary change-impact analysis.
8. Connecting available decision and bug information to relevant project context.

### Future Scope

The platform can later be extended with:

- GitHub repository integration.
- Automated commit and pull-request analysis.
- Issue tracker integration.
- Continuous knowledge updates.
- Team collaboration and access management.
- Advanced test impact analysis.

### Non-Goals for the Initial Version

- Replacing developers or software engineers.
- Guaranteeing that a code change will never introduce bugs.
- Automatically modifying production code without developer approval.
- Claiming complete project knowledge when source information is unavailable.
- Presenting AI-generated assumptions as verified engineering facts.

---

## 9. Expected Impact

If implemented effectively, Project Brain AI aims to:

- Reduce the manual effort involved in understanding unfamiliar projects.
- Make important engineering knowledge easier to retrieve.
- Help developers understand relationships between project components.
- Improve visibility into potential change impacts.
- Make historical decisions and bug information more accessible.
- Support better-informed software maintenance and development decisions.

These are intended outcomes that should be validated through practical testing and user feedback.

---

## 10. Final Selection Justification

Unified Engineering Memory is selected because it brings together several connected challenges faced during software development and maintenance.

Rather than building another standalone code explanation chatbot, Project Brain AI aims to connect project history, technical decisions, source code, dependencies, and bug knowledge into one contextual system.

The platform's core value is not simply explaining what the code does, but helping developers understand:

- **WHY** the code exists.
- **WHAT** happened in the project previously.
- **HOW** different components are connected.
- **WHAT COULD BE AFFECTED** when a change is introduced.

This direction provides a clear foundation for Project Brain AI's identity as an Engineering Memory and Code Intelligence Platform.

---

## 11. Conclusion

The selection process identifies fragmented engineering knowledge as the central problem worth addressing.

By connecting source code, documentation, historical decisions, dependencies, and bug records, Project Brain AI aims to make software projects easier to understand, maintain, and evolve.

**Project Brain AI — Don't just understand what the code does. Understand why it exists, what depends on it, and what could break if it changes.**
