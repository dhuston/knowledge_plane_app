/**
 * Research workspace model definitions extending the base workspace model
 */

import { Workspace, WorkspaceType, createWorkspace } from './Workspace';

export interface ResearchSource {
  id: string;
  title: string;
  url: string | null;
  authors: string[];
  publishedDate: Date | null;
  addedBy: string;
  addedAt: Date;
  notes: string;
  tags: string[];
}

export interface Hypothesis {
  id: string;
  statement: string;
  description: string;
  status: 'proposed' | 'testing' | 'validated' | 'invalidated';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  supportingEvidenceIds: string[];
  opposingEvidenceIds: string[];
}

export interface Evidence {
  id: string;
  title: string;
  description: string;
  sourceId: string | null;
  strength: 'weak' | 'moderate' | 'strong';
  addedBy: string;
  addedAt: Date;
  type: 'qualitative' | 'quantitative' | 'anecdotal' | 'experimental';
}

export interface ResearchQuestion {
  id: string;
  question: string;
  description: string;
  status: 'open' | 'in-progress' | 'answered';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  answerIds: string[];
}

export interface Answer {
  id: string;
  content: string;
  evidenceIds: string[];
  confidenceLevel: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Experiment {
  id: string;
  title: string;
  description: string;
  methodology: string;
  status: 'planned' | 'in-progress' | 'completed' | 'abandoned';
  startDate: Date | null;
  endDate: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  results: string;
  conclusion: string;
}

/**
 * Research workspace interface extending the base workspace
 */
export interface ResearchWorkspace extends Workspace {
  sources: ResearchSource[];
  hypotheses: Hypothesis[];
  evidence: Evidence[];
  questions: ResearchQuestion[];
  answers: Answer[];
  experiments: Experiment[];
  primaryResearchArea: string;
  tags: string[];
}

/**
 * Creates a new research workspace with default values
 * @param name Workspace name
 * @param description Workspace description
 * @param primaryResearchArea Primary area of research
 * @param createdBy User ID of creator
 * @param ownerId User or team ID of the owner
 * @returns A new research workspace instance
 */
export function createResearchWorkspace(
  name: string,
  description: string,
  primaryResearchArea: string,
  createdBy: string,
  ownerId: string
): ResearchWorkspace {
  const baseWorkspace = createWorkspace(
    name,
    description,
    WorkspaceType.RESEARCH,
    createdBy,
    ownerId
  );
  
  return {
    ...baseWorkspace,
    sources: [],
    hypotheses: [],
    evidence: [],
    questions: [],
    answers: [],
    experiments: [],
    primaryResearchArea,
    tags: []
  };
}

/**
 * Adds a research source to the workspace
 * @param workspace Research workspace to modify
 * @param title Source title
 * @param url Source URL (optional)
 * @param authors Array of author names
 * @param publishedDate Publication date (optional)
 * @param notes Notes about the source
 * @param tags Tags for categorizing the source
 * @param addedBy User ID of who added the source
 * @returns Updated research workspace
 */
export function addResearchSource(
  workspace: ResearchWorkspace,
  title: string,
  url: string | null,
  authors: string[],
  publishedDate: Date | null,
  notes: string,
  tags: string[],
  addedBy: string
): ResearchWorkspace {
  const source: ResearchSource = {
    id: `src-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title,
    url,
    authors,
    publishedDate,
    addedBy,
    addedAt: new Date(),
    notes,
    tags
  };
  
  return {
    ...workspace,
    sources: [...workspace.sources, source],
    updatedAt: new Date()
  };
}

/**
 * Adds a hypothesis to the research workspace
 * @param workspace Research workspace to modify
 * @param statement The hypothesis statement
 * @param description Detailed description of the hypothesis
 * @param createdBy User ID of who created the hypothesis
 * @returns Updated research workspace
 */
export function addHypothesis(
  workspace: ResearchWorkspace,
  statement: string,
  description: string,
  createdBy: string
): ResearchWorkspace {
  const hypothesis: Hypothesis = {
    id: `hyp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    statement,
    description,
    status: 'proposed',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy,
    supportingEvidenceIds: [],
    opposingEvidenceIds: []
  };
  
  return {
    ...workspace,
    hypotheses: [...workspace.hypotheses, hypothesis],
    updatedAt: new Date()
  };
}

/**
 * Adds evidence to the research workspace
 * @param workspace Research workspace to modify
 * @param title Evidence title
 * @param description Evidence description
 * @param sourceId Source ID this evidence is from (optional)
 * @param strength Strength of the evidence
 * @param type Type of evidence
 * @param addedBy User ID of who added the evidence
 * @returns Updated research workspace
 */
export function addEvidence(
  workspace: ResearchWorkspace,
  title: string,
  description: string,
  sourceId: string | null,
  strength: Evidence['strength'],
  type: Evidence['type'],
  addedBy: string
): ResearchWorkspace {
  const evidence: Evidence = {
    id: `evi-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title,
    description,
    sourceId,
    strength,
    type,
    addedBy,
    addedAt: new Date()
  };
  
  return {
    ...workspace,
    evidence: [...workspace.evidence, evidence],
    updatedAt: new Date()
  };
}

/**
 * Links evidence to a hypothesis
 * @param workspace Research workspace to modify
 * @param hypothesisId ID of the hypothesis
 * @param evidenceId ID of the evidence
 * @param supports Whether the evidence supports or opposes the hypothesis
 * @returns Updated research workspace
 */
export function linkEvidenceToHypothesis(
  workspace: ResearchWorkspace,
  hypothesisId: string,
  evidenceId: string,
  supports: boolean
): ResearchWorkspace {
  const updatedHypotheses = workspace.hypotheses.map(hypothesis => {
    if (hypothesis.id === hypothesisId) {
      if (supports) {
        return {
          ...hypothesis,
          supportingEvidenceIds: [...hypothesis.supportingEvidenceIds, evidenceId]
        };
      } else {
        return {
          ...hypothesis,
          opposingEvidenceIds: [...hypothesis.opposingEvidenceIds, evidenceId]
        };
      }
    }
    return hypothesis;
  });
  
  return {
    ...workspace,
    hypotheses: updatedHypotheses,
    updatedAt: new Date()
  };
}

/**
 * Adds a research question to the workspace
 * @param workspace Research workspace to modify
 * @param question The research question
 * @param description Detailed description of the question
 * @param createdBy User ID of who created the question
 * @returns Updated research workspace
 */
export function addResearchQuestion(
  workspace: ResearchWorkspace,
  question: string,
  description: string,
  createdBy: string
): ResearchWorkspace {
  const researchQuestion: ResearchQuestion = {
    id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    question,
    description,
    status: 'open',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy,
    answerIds: []
  };
  
  return {
    ...workspace,
    questions: [...workspace.questions, researchQuestion],
    updatedAt: new Date()
  };
}