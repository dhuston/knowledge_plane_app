# KnowledgePlane AI - Data Model (v0.1)

**Status:** Work In Progress

This document outlines the core conceptual data entities and their relationships within KnowledgePlane AI. As the platform evolves, this model will become more detailed, reflecting the emergent structure and integrations.

## Core Entities (Initial)

* **User:** Represents an individual within the organization.
  * Key Attributes: `id` (PK, UUID), `tenant_id` (FK), `auth_provider_id` (e.g., Google sub), `name`, `email`, `title`, `avatarUrl`, `teamId` (FK to Team), `managerId` (FK to User, self-referencing), `onlineStatus` (Boolean), `created_at`, `updated_at`.
* **Team:** A formal group of users, typically within a department.
  * Key Attributes: `id` (PK, UUID), `tenant_id` (FK), `name`, `leadId` (FK to User), `deptId` (FK to Department), `description`, `created_at`, `updated_at`.
* **Department:** A higher-level organizational unit containing teams.
  * Key Attributes: `id` (PK, UUID), `tenant_id` (FK), `name`, `leadId` (FK to User), `description`, `created_at`, `updated_at`.
* **Project (Hub):** A specific initiative, project, or workspace.
  * Key Attributes: `id` (PK, UUID), `tenant_id` (FK), `name`, `description`, `status`, `owningTeamId` (FK to Team), `goalId` (FK to Goal), `created_at`, `updated_at`.
* **Goal (OKR):** A strategic objective at any level (Enterprise, Dept, Team).
  * Key Attributes: `id` (PK, UUID), `tenant_id` (FK), `title`, `type` (Enum: Enterprise/Dept/Team), `parentId` (FK to Goal, self-referencing), `status`, `progress` (Integer), `dueDate` (Date), `created_at`, `updated_at`.
* **Knowledge Asset:** Represents a piece of information (e.g., document, note, message - to be refined).
  * Key Attributes: `id`, `type`, `title`, `source` (e.g., Drive, Slack, Native), `link`, `relatedEntities` (links to Users, Projects, Teams etc.).
* **Tenant:** Represents a customer organization.
  * Key Attributes: `id` (PK, UUID), `name`, `domain` (e.g., company.com), `sso_config` (JSON/Text), `created_at`, `updated_at`.

## Key Relationships (Conceptual)

* User `belongs to` Team
* User `reports to` User (Manager)
* Team `belongs to` Department
* User `leads` Team
* User `leads` Department
* Project `owned by` Team
* Project `contributes to` Goal
* Goal `aligned to` Goal (Parent/Child)
* User `participates in` Project
* Knowledge Asset `related to` User/Team/Project/Goal

*(Note: This model will expand to include custom entity types and relationships as defined by the platform's configuration capabilities.)*

## Database Implementation (Initial Plan)

* **Primary Store:** PostgreSQL (via AWS RDS).
* **Multi-Tenancy:** Schema-per-Tenant approach strongly considered. A shared schema with `tenant_id` on every table is an alternative starting point if schema management proves complex initially.
* **ORM/Migrations:** Python SQLAlchemy Core/ORM with Alembic for migrations.
* **Initial Tables (Slice 1 Focus):** `tenants`, `users`. Foreign key relationships (`managerId`, `teamId`, etc.) will link users.
* **Org Structure (Future):** Graph Database.
* **Knowledge Assets:** TBD.
