import { describe, it, expect } from 'vitest';
import {
  ProjectWorkspace,
  createProjectWorkspace,
  addTimelineItem,
  addTask,
  updateTaskStatus,
  addDiscussion,
  updateProjectStatus
} from '../../frontend/src/models/workspace/ProjectWorkspace';
import { WorkspaceType } from '../../frontend/src/models/workspace/Workspace';

describe('Project Workspace Model', () => {
  let testProjectWorkspace: ProjectWorkspace;
  
  beforeEach(() => {
    testProjectWorkspace = createProjectWorkspace(
      'Product Launch',
      'Workspace for the new product launch',
      'project-123',
      'user-123'
    );
  });
  
  it('should create a valid project workspace with required properties', () => {
    expect(testProjectWorkspace).toBeDefined();
    expect(testProjectWorkspace.id).toBeDefined();
    expect(testProjectWorkspace.name).toBe('Product Launch');
    expect(testProjectWorkspace.description).toBe('Workspace for the new product launch');
    expect(testProjectWorkspace.type).toBe(WorkspaceType.PROJECT);
    expect(testProjectWorkspace.createdBy).toBe('user-123');
    expect(testProjectWorkspace.projectId).toBe('project-123');
    expect(testProjectWorkspace.status).toBe('planning');
    expect(testProjectWorkspace.timeline).toEqual([]);
    expect(testProjectWorkspace.tasks).toEqual([]);
    expect(testProjectWorkspace.discussions).toEqual([]);
    expect(testProjectWorkspace.documents).toEqual([]);
    expect(testProjectWorkspace.goals).toEqual([]);
  });
  
  describe('addTimelineItem', () => {
    it('should add a timeline item to the project workspace', () => {
      const startDate = new Date(2023, 0, 15);
      const endDate = new Date(2023, 1, 15);
      
      const updatedWorkspace = addTimelineItem(
        testProjectWorkspace,
        'Research Phase',
        'Initial market research and competitive analysis',
        startDate,
        endDate,
        'in-progress'
      );
      
      expect(updatedWorkspace.timeline.length).toBe(1);
      expect(updatedWorkspace.timeline[0].title).toBe('Research Phase');
      expect(updatedWorkspace.timeline[0].description).toBe('Initial market research and competitive analysis');
      expect(updatedWorkspace.timeline[0].startDate).toBe(startDate);
      expect(updatedWorkspace.timeline[0].endDate).toBe(endDate);
      expect(updatedWorkspace.timeline[0].status).toBe('in-progress');
    });
    
    it('should allow timeline items with no end date', () => {
      const startDate = new Date();
      
      const updatedWorkspace = addTimelineItem(
        testProjectWorkspace,
        'Ongoing Support',
        'Continuous product support',
        startDate,
        null,
        'planned'
      );
      
      expect(updatedWorkspace.timeline[0].endDate).toBeNull();
    });
  });
  
  describe('addTask', () => {
    it('should add a task to the project workspace', () => {
      const dueDate = new Date(2023, 1, 28);
      
      const updatedWorkspace = addTask(
        testProjectWorkspace,
        'Create marketing materials',
        'Design brochures, social media posts and website content',
        ['user-456', 'user-789'],
        'high',
        dueDate
      );
      
      expect(updatedWorkspace.tasks.length).toBe(1);
      expect(updatedWorkspace.tasks[0].title).toBe('Create marketing materials');
      expect(updatedWorkspace.tasks[0].description).toBe('Design brochures, social media posts and website content');
      expect(updatedWorkspace.tasks[0].assignees).toEqual(['user-456', 'user-789']);
      expect(updatedWorkspace.tasks[0].status).toBe('todo');
      expect(updatedWorkspace.tasks[0].priority).toBe('high');
      expect(updatedWorkspace.tasks[0].dueDate).toBe(dueDate);
      expect(updatedWorkspace.tasks[0].completedAt).toBeNull();
    });
  });
  
  describe('updateTaskStatus', () => {
    it('should update the status of a task', () => {
      let workspace = testProjectWorkspace;
      
      // Add a task first
      workspace = addTask(
        workspace,
        'Write documentation',
        'Create user guides and API documentation',
        ['user-123'],
        'medium',
        new Date(2023, 2, 15)
      );
      
      const taskId = workspace.tasks[0].id;
      
      // Update the task status to 'in-progress'
      workspace = updateTaskStatus(workspace, taskId, 'in-progress');
      expect(workspace.tasks[0].status).toBe('in-progress');
      expect(workspace.tasks[0].completedAt).toBeNull();
      
      // Update the task status to 'done'
      workspace = updateTaskStatus(workspace, taskId, 'done');
      expect(workspace.tasks[0].status).toBe('done');
      expect(workspace.tasks[0].completedAt).toBeDefined();
      expect(workspace.tasks[0].completedAt instanceof Date).toBeTruthy();
    });
    
    it('should not modify other tasks when updating one task', () => {
      let workspace = testProjectWorkspace;
      
      // Add two tasks
      workspace = addTask(
        workspace,
        'Task 1',
        'Description 1',
        ['user-123'],
        'medium',
        new Date()
      );
      
      workspace = addTask(
        workspace,
        'Task 2',
        'Description 2',
        ['user-456'],
        'high',
        new Date()
      );
      
      const task1Id = workspace.tasks[0].id;
      
      // Update the first task
      workspace = updateTaskStatus(workspace, task1Id, 'done');
      
      // Check that only the first task was updated
      expect(workspace.tasks[0].status).toBe('done');
      expect(workspace.tasks[1].status).toBe('todo');
    });
  });
  
  describe('addDiscussion', () => {
    it('should add a discussion to the project workspace', () => {
      const updatedWorkspace = addDiscussion(
        testProjectWorkspace,
        'Launch Strategy',
        'Let\'s discuss the product launch strategy and timing.',
        'user-123',
        ['strategy', 'launch', 'marketing']
      );
      
      expect(updatedWorkspace.discussions.length).toBe(1);
      expect(updatedWorkspace.discussions[0].title).toBe('Launch Strategy');
      expect(updatedWorkspace.discussions[0].content).toBe('Let\'s discuss the product launch strategy and timing.');
      expect(updatedWorkspace.discussions[0].createdBy).toBe('user-123');
      expect(updatedWorkspace.discussions[0].participants).toEqual(['user-123']);
      expect(updatedWorkspace.discussions[0].tags).toEqual(['strategy', 'launch', 'marketing']);
      expect(updatedWorkspace.discussions[0].commentCount).toBe(0);
    });
    
    it('should allow discussions without tags', () => {
      const updatedWorkspace = addDiscussion(
        testProjectWorkspace,
        'Quick Question',
        'When is our next meeting?',
        'user-456'
      );
      
      expect(updatedWorkspace.discussions[0].tags).toEqual([]);
    });
  });
  
  describe('updateProjectStatus', () => {
    it('should update the project status', () => {
      const updatedWorkspace = updateProjectStatus(testProjectWorkspace, 'active');
      
      expect(updatedWorkspace.status).toBe('active');
      expect(updatedWorkspace.updatedAt).not.toBe(testProjectWorkspace.updatedAt);
    });
    
    it('should allow changing status to different values', () => {
      let workspace = testProjectWorkspace;
      
      workspace = updateProjectStatus(workspace, 'active');
      expect(workspace.status).toBe('active');
      
      workspace = updateProjectStatus(workspace, 'on-hold');
      expect(workspace.status).toBe('on-hold');
      
      workspace = updateProjectStatus(workspace, 'completed');
      expect(workspace.status).toBe('completed');
      
      workspace = updateProjectStatus(workspace, 'planning');
      expect(workspace.status).toBe('planning');
    });
  });
});