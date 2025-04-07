# KnowledgePlane AI - Data Model (v0.1)

**Status:** Work In Progress

This document outlines the core conceptual data entities and their relationships within KnowledgePlane AI. As the platform evolves, this model will become more detailed, reflecting the emergent structure and integrations.

## Core Entities (Initial)

*   **User:** Represents an individual within the organization.
    *   Key Attributes: `id`, `name`, `email`, `title`, `avatarUrl`, `teamId` (link), `managerId` (link), `onlineStatus`.
*   **Team:** A formal group of users, typically within a department.
    *   Key Attributes: `id`, `name`, `leadId` (link to User), `deptId` (link to Department), `description`.
*   **Department:** A higher-level organizational unit containing teams.
    *   Key Attributes: `id`, `name`, `leadId` (link to User), `description`.
*   **Project (Hub):** A specific initiative, project, or workspace.
    *   Key Attributes: `id`, `name`, `description`, `status`, `owningTeamId` (link), `goalId` (link).
*   **Goal (OKR):** A strategic objective at any level (Enterprise, Dept, Team).
    *   Key Attributes: `id`, `title`, `type` (Enterprise/Dept/Team), `parentId` (link), `status`, `progress`, `dueDate`.
*   **Knowledge Asset:** Represents a piece of information (e.g., document, note, message - to be refined).
    *   Key Attributes: `id`, `type`, `title`, `source` (e.g., Drive, Slack, Native), `link`, `relatedEntities` (links to Users, Projects, Teams etc.).

## Key Relationships (Conceptual)

*   User `belongs to` Team
*   User `reports to` User (Manager)
*   Team `belongs to` Department
*   User `leads` Team
*   User `leads` Department
*   Project `owned by` Team
*   Project `contributes to` Goal
*   Goal `aligned to` Goal (Parent/Child)
*   User `participates in` Project
*   Knowledge Asset `related to` User/Team/Project/Goal

*(Note: This model will expand to include custom entity types and relationships as defined by the platform's configuration capabilities.)*

## Database Implementation (Initial Plan)

*   **Primary Store:** PostgreSQL (using schema-per-tenant for multi-tenancy).
*   **Core Entities (User, Team, Department, Project, Goal):** Likely relational tables with foreign keys representing relationships.
*   **Org Structure (Future):** A dedicated Graph Database (e.g., Neptune, Neo4j) will likely be introduced later to efficiently query complex and emergent relationships.
*   **Knowledge Assets:** Data storage TBD (might involve relational tables, document stores, or pointers to external systems). 