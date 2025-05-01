/**
 * Meeting workspace model definitions extending the base workspace model
 * For collaborative meeting preparation, execution, and follow-up
 */

import { Workspace, WorkspaceType, createWorkspace } from './Workspace';

export interface AgendaItem {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  presenter: string; // userId
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  notes: string;
  order: number;
  resources: AgendaItemResource[];
}

export interface AgendaItemResource {
  id: string;
  title: string;
  type: 'document' | 'link' | 'image' | 'presentation' | 'video';
  url: string;
  addedBy: string;
  addedAt: Date;
}

export interface MeetingParticipant {
  userId: string;
  role: 'organizer' | 'presenter' | 'attendee' | 'optional';
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
  joinedAt?: Date;
  leftAt?: Date;
}

export interface MeetingNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isPrivate: boolean;
  agendaItemId?: string; // Optional reference to an agenda item
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  assignee: string;
  dueDate: Date | null;
  status: 'open' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  completedBy?: string;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  createdAt: Date;
  isOpen: boolean;
  allowMultipleChoices: boolean;
  isAnonymous: boolean;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // array of userIds
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  agendaItemId?: string;
  supportingUsers: string[]; // array of userIds who support the decision
  opposingUsers: string[]; // array of userIds who oppose the decision
  tags: string[];
}

export type MeetingStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export interface Transcript {
  id: string;
  startTime: Date;
  endTime: Date;
  content: string;
  speaker?: string; // userId if speaker is identified
}

/**
 * Meeting workspace interface extending the base workspace
 */
export interface MeetingWorkspace extends Workspace {
  meetingType: 'regular' | 'one-time' | 'recurring' | 'workshop' | 'decision';
  startTime: Date | null;
  endTime: Date | null;
  location: string;
  virtualMeetingUrl?: string;
  status: MeetingStatus;
  agendaItems: AgendaItem[];
  participants: MeetingParticipant[];
  notes: MeetingNote[];
  actionItems: ActionItem[];
  polls: Poll[];
  decisions: Decision[];
  transcripts: Transcript[];
  recordingUrl?: string;
  previousMeetingId?: string; // For recurring meetings
  nextMeetingId?: string; // For recurring meetings
  reminderSent: boolean;
  summaryGenerated: boolean;
}

/**
 * Creates a new meeting workspace with default values
 * @param name Meeting name/title
 * @param description Meeting description
 * @param meetingType Type of meeting
 * @param startTime Scheduled start time
 * @param endTime Scheduled end time
 * @param location Meeting location or room
 * @param virtualMeetingUrl Optional URL for virtual meetings
 * @param organizerId User ID of the meeting organizer
 * @returns A new meeting workspace instance
 */
export function createMeetingWorkspace(
  name: string,
  description: string,
  meetingType: MeetingWorkspace['meetingType'],
  startTime: Date | null,
  endTime: Date | null,
  location: string,
  virtualMeetingUrl: string | undefined,
  organizerId: string
): MeetingWorkspace {
  const baseWorkspace = createWorkspace(
    name,
    description,
    WorkspaceType.MEETING,
    organizerId,
    organizerId
  );
  
  return {
    ...baseWorkspace,
    meetingType,
    startTime,
    endTime,
    location,
    virtualMeetingUrl,
    status: 'scheduled',
    agendaItems: [],
    participants: [{
      userId: organizerId,
      role: 'organizer',
      status: 'accepted'
    }],
    notes: [],
    actionItems: [],
    polls: [],
    decisions: [],
    transcripts: [],
    reminderSent: false,
    summaryGenerated: false
  };
}

/**
 * Adds an agenda item to the meeting
 * @param workspace Meeting workspace to modify
 * @param title Agenda item title
 * @param description Agenda item description
 * @param duration Duration in minutes
 * @param presenter User ID of the presenter
 * @returns Updated meeting workspace
 */
export function addAgendaItem(
  workspace: MeetingWorkspace,
  title: string,
  description: string,
  duration: number,
  presenter: string
): MeetingWorkspace {
  // Calculate the next order value
  const nextOrder = workspace.agendaItems.length > 0 
    ? Math.max(...workspace.agendaItems.map(item => item.order)) + 1 
    : 1;
  
  const agendaItem: AgendaItem = {
    id: `agenda-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title,
    description,
    duration,
    presenter,
    status: 'pending',
    notes: '',
    order: nextOrder,
    resources: []
  };
  
  return {
    ...workspace,
    agendaItems: [...workspace.agendaItems, agendaItem],
    updatedAt: new Date()
  };
}

/**
 * Adds a participant to the meeting
 * @param workspace Meeting workspace to modify
 * @param userId User ID to add as participant
 * @param role Role in the meeting
 * @returns Updated meeting workspace
 */
export function addParticipant(
  workspace: MeetingWorkspace,
  userId: string,
  role: MeetingParticipant['role']
): MeetingWorkspace {
  // Check if user is already a participant
  const existingParticipant = workspace.participants.find(p => p.userId === userId);
  if (existingParticipant) {
    // Update role if the user is already a participant
    const updatedParticipants = workspace.participants.map(p => {
      if (p.userId === userId) {
        return {
          ...p,
          role
        };
      }
      return p;
    });
    
    return {
      ...workspace,
      participants: updatedParticipants,
      updatedAt: new Date()
    };
  }
  
  // Add as new participant
  const participant: MeetingParticipant = {
    userId,
    role,
    status: 'pending'
  };
  
  return {
    ...workspace,
    participants: [...workspace.participants, participant],
    updatedAt: new Date()
  };
}

/**
 * Updates a participant's status for the meeting
 * @param workspace Meeting workspace to modify
 * @param userId User ID of the participant
 * @param status New status
 * @returns Updated meeting workspace
 */
export function updateParticipantStatus(
  workspace: MeetingWorkspace,
  userId: string,
  status: MeetingParticipant['status']
): MeetingWorkspace {
  const updatedParticipants = workspace.participants.map(p => {
    if (p.userId === userId) {
      return {
        ...p,
        status
      };
    }
    return p;
  });
  
  return {
    ...workspace,
    participants: updatedParticipants,
    updatedAt: new Date()
  };
}

/**
 * Adds a meeting note
 * @param workspace Meeting workspace to modify
 * @param content Note content
 * @param createdBy User ID creating the note
 * @param isPrivate Whether the note is private
 * @param agendaItemId Optional agenda item ID the note relates to
 * @returns Updated meeting workspace
 */
export function addMeetingNote(
  workspace: MeetingWorkspace,
  content: string,
  createdBy: string,
  isPrivate: boolean = false,
  agendaItemId?: string
): MeetingWorkspace {
  const note: MeetingNote = {
    id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    content,
    createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
    isPrivate,
    agendaItemId
  };
  
  return {
    ...workspace,
    notes: [...workspace.notes, note],
    updatedAt: new Date()
  };
}

/**
 * Adds an action item from the meeting
 * @param workspace Meeting workspace to modify
 * @param title Action item title
 * @param description Action item description
 * @param assignee User ID of the assignee
 * @param dueDate Due date for the action
 * @param priority Priority level
 * @param createdBy User ID creating the action item
 * @returns Updated meeting workspace
 */
export function addActionItem(
  workspace: MeetingWorkspace,
  title: string,
  description: string,
  assignee: string,
  dueDate: Date | null,
  priority: ActionItem['priority'],
  createdBy: string
): MeetingWorkspace {
  const actionItem: ActionItem = {
    id: `action-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title,
    description,
    assignee,
    dueDate,
    status: 'open',
    priority,
    createdBy,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  return {
    ...workspace,
    actionItems: [...workspace.actionItems, actionItem],
    updatedAt: new Date()
  };
}

/**
 * Updates the meeting status
 * @param workspace Meeting workspace to modify
 * @param status New meeting status
 * @returns Updated meeting workspace
 */
export function updateMeetingStatus(
  workspace: MeetingWorkspace,
  status: MeetingStatus
): MeetingWorkspace {
  const now = new Date();
  let updatedWorkspace = {
    ...workspace,
    status,
    updatedAt: now
  };
  
  // Add timestamps for participants when meeting starts or ends
  if (status === 'in-progress') {
    const updatedParticipants = workspace.participants.map(p => ({
      ...p,
      joinedAt: p.status === 'accepted' ? now : undefined
    }));
    
    updatedWorkspace = {
      ...updatedWorkspace,
      participants: updatedParticipants
    };
  } else if (status === 'completed') {
    const updatedParticipants = workspace.participants.map(p => ({
      ...p,
      leftAt: p.joinedAt ? now : undefined
    }));
    
    updatedWorkspace = {
      ...updatedWorkspace,
      participants: updatedParticipants
    };
  }
  
  return updatedWorkspace;
}

/**
 * Adds a decision made during the meeting
 * @param workspace Meeting workspace to modify
 * @param title Decision title
 * @param description Decision description
 * @param createdBy User ID creating the decision record
 * @param agendaItemId Optional agenda item ID the decision relates to
 * @param supportingUsers Array of user IDs supporting the decision
 * @returns Updated meeting workspace
 */
export function addDecision(
  workspace: MeetingWorkspace,
  title: string,
  description: string,
  createdBy: string,
  agendaItemId?: string,
  supportingUsers: string[] = []
): MeetingWorkspace {
  const decision: Decision = {
    id: `dec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title,
    description,
    createdBy,
    createdAt: new Date(),
    agendaItemId,
    supportingUsers,
    opposingUsers: [],
    tags: []
  };
  
  return {
    ...workspace,
    decisions: [...workspace.decisions, decision],
    updatedAt: new Date()
  };
}