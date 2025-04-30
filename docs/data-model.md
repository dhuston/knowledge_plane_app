# KnowledgePlane AI - Data Model (v0.1)

**Status:** Work In Progress

This document outlines the core conceptual data entities and their relationships within KnowledgePlane AI. As the platform evolves, this model will become more detailed, reflecting the emergent structure and integrations required to **power the Living Map visualization**. The goal is to represent the organization as a rich graph of interconnected entities.

## Core Entities (Initial)

* **User:** Represents an individual within the organization.
  * Key Attributes: `id` (PK, UUID), `tenant_id` (FK), `auth_provider_id` (e.g., Google sub), `name`, `email`, `title`, `avatarUrl`, `teamId` (FK to Team), `managerId` (FK to User, self-referencing), `onlineStatus` (Boolean), `created_at`, `updated_at`, **`properties` (JSONB for flexible attributes)**.
* **Team:** A formal group of users, typically within a department.
  * Key Attributes: `id` (PK, UUID), `tenant_id` (FK), `name`, `leadId` (FK to User), `deptId` (FK to Department), `description`, `created_at`, `updated_at`, **`properties` (JSONB)**.
* **Department:** A higher-level organizational unit containing teams.
  * Key Attributes: `id` (PK, UUID), `tenant_id` (FK), `name`, `leadId` (FK to User), `description`, `created_at`, `updated_at`, **`properties` (JSONB)**.
* **Project (Hub):** A specific initiative, project, or workspace.
  * Key Attributes: `id` (PK, UUID), `tenant_id` (FK), `name`, `description`, `status`, `owningTeamId` (FK to Team), `goalId` (FK to Goal), `created_at`, `updated_at`, **`properties` (JSONB, e.g., budget, risk level, progress %)**.
* **Goal (OKR):** A strategic objective at any level (Enterprise, Dept, Team).
  * Key Attributes: `id` (PK, UUID), `tenant_id` (FK), `title`, `type` (Enum: Enterprise/Dept/Team), `parentId` (FK to Goal, self-referencing), `status`, `progress` (Integer), `dueDate` (Date), `created_at`, `updated_at`, **`properties` (JSONB)**.
* **Knowledge Asset:** Represents a piece of information (e.g., document, note, message, meeting, experiment finding - to be refined). **Visualized as nodes on the Living Map.**
  * Key Attributes: `id` (PK, UUID), `tenant_id` (FK), `type` (Enum: Document, Note, SlackMsg, Meeting, etc.), `title`, `source` (e.g., Drive, Slack, Native), `link`, `created_at`, `updated_at`, **`properties` (JSONB)**.
* **Tenant:** Represents a customer organization.
  * Key Attributes: `id` (PK, UUID), `name`, `domain` (e.g., company.com), `sso_config` (JSON/Text), `created_at`, `updated_at`.
* **(Future) Relationship/Edge:** Represents the connection between two entities (nodes) on the Living Map. While often implicit via FKs initially, may become explicit entities.
  * Key Attributes: `id`, `tenant_id`, `source_node_id`, `target_node_id`, `type` (Enum: ReportsTo, MemberOf, CollaboratesOn, DependsOn, AlignsTo, Contains, LinksTo, etc.), `created_at`, `updated_at`, **`properties` (JSONB, e.g., interaction frequency, dependency status)**.

## Key Relationships (Conceptual - Visualized on Living Map)

* User `belongs to` Team
* User `reports to` User (Manager)
* Team `belongs to` Department
* User `leads` Team
* User `leads` Department
* Project `owned by` Team
* Project `contributes to` / `aligned to` Goal
* Goal `aligned to` Goal (Parent/Child)
* User `participates in` / `collaborates on` Project
* Knowledge Asset `related to` / `linked to` User/Team/Project/Goal
* **(Future) Team `collaborates with` Team**
* **(Future) Project `depends on` Project**

*(Note: This model will expand significantly. The **Living Map requires robust modeling of diverse relationships**. Custom entity and relationship types will be crucial.)*

## Database Implementation (Initial Plan)

* **Primary Store:** PostgreSQL (via AWS RDS). Relational structure is suitable for core entities initially.
* **Multi-Tenancy:** Schema-per-Tenant approach strongly considered. A shared schema with `tenant_id` on every table is an alternative starting point if schema management proves complex initially.
* **ORM/Migrations:** Python SQLAlchemy Core/ORM with Alembic for migrations.
* **Initial Tables (Slice 1 Focus):** `tenants`, `users`, `teams`. Foreign key relationships (`managerId`, `teamId`, etc.) will link users/teams. API will synthesize basic node/edge data for the map.
* **Handling Relationships:** Start with Foreign Keys. Consider explicit join tables for many-to-many relationships (e.g., `project_participants`).
* **Flexibility:** Use JSONB `properties` columns extensively to allow adding flexible attributes without schema changes, supporting diverse node types on the map.
* **Historical Data (Time Machine):** Need strategy for tracking changes over time. Options include:
  * Slowly Changing Dimensions (SCD Type 2) approach in relational tables (complex).
  * Separate audit log tables capturing changes.
  * Event Sourcing pattern.
  * **Leveraging Graph Database features later (some support temporal queries).** This is a post-MVP consideration.
* **Org Structure (Future):** **Graph Database (e.g., AWS Neptune) is the target.** Essential for efficient querying of complex, multi-hop relationships required for advanced Living Map features, ONA, and the Scenario Simulator.
* **Knowledge Assets:** TBD - May involve relational tables initially, potentially moving towards document or graph stores depending on type and query patterns.
