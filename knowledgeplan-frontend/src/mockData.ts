import { 
  InfoIcon, 
  WarningIcon, 
  CheckCircleIcon, 
  SettingsIcon, 
  SearchIcon, 
  QuestionOutlineIcon, 
  EditIcon, 
  AddIcon, 
  ViewIcon 
} from '@chakra-ui/icons';

// --- Types (Centralized) ---
export type Goal = {
  id: string;
  type: 'Enterprise' | 'Department' | 'Team' | 'Project';
  title: string;
  children?: Goal[];
};

export type User = {
  id: string;
  name: string;
  teamId: string | null; // Allow null for top-level?
  manager: string | null; // Allow null for top-level
  title: string;
  email: string;
  avatar: string;
  online?: boolean;
};

export type Team = {
  id: string;
  name: string;
  lead: string | null; // User ID of lead
  deptId: string | null; // Department ID
};

export type Department = {
  id: string;
  name: string;
  lead: string | null; // User ID of lead
};

export type Project = {
  id: string;
  name: string;
  goalId?: string;
  teamId?: string;
  status: string;
  statusColorScheme: string;
  statusIcon: React.ElementType; // Component type for icon
  subtext?: string;
};

// --- Expanded Mock Data ---

export const mockGoals: Goal = {
  id: 'ent-1', type: 'Enterprise', title: 'Increase Market Share by 10% (FY2024)', 
  children: [
    {
      id: 'dept-rd', type: 'Department', title: 'Launch 3 New Product Features (R&D)', 
      children: [
        {
          id: 'team-platform', type: 'Team', title: 'Deliver Project Phoenix by Q4 (Platform Team)', 
          children: [
            { id: 'phoenix', type: 'Project', title: 'Project Phoenix' }
          ]
        },
        {
          id: 'team-ml', type: 'Team', title: 'Develop New Recommendation Algorithm (ML Team)', 
          children: [
            { id: 'reco-engine', type: 'Project', title: 'Recommendation Engine V3'}
          ]
        },
        {
          id: 'team-research', type: 'Team', title: 'Publish 2 Papers on AI Ethics (Research Team)', 
          children: []
        }
      ]
    },
    {
      id: 'dept-sales', type: 'Department', title: 'Expand into APAC Market (Sales)', 
      children: [
         {
          id: 'team-apac-sales', type: 'Team', title: 'Achieve $1M ARR in APAC (Sales APAC Team)', 
          children: []
        }
      ]
    },
     {
      id: 'dept-product', type: 'Department', title: 'Improve User Retention by 5% (Product)', 
      children: [
        {
          id: 'team-growth', type: 'Team', title: 'Increase Feature Adoption by 15% (Growth Team)', 
          children: []
        },
        {
          id: 'team-design', type: 'Team', title: 'Complete UI Refresh (Design Team)', 
          children: [
             { id: 'ui-refresh', type: 'Project', title: 'UI Refresh 2024'}
          ]
        }
      ]
    }
  ]
};

export const mockDepartments: Record<string, Department> = {
  'rd': { id: 'rd', name: 'Research & Development', lead: 'david' },
  'leadership': { id: 'leadership', name: 'Executive Leadership', lead: 'ceo' },
  'product': { id: 'product', name: 'Product & Design', lead: 'emily' },
  'sales': { id: 'sales', name: 'Global Sales', lead: 'grace' }
};

export const mockTeams: Record<string, Team> = {
  'team-platform': { id: 'team-platform', name: 'R&D Platform Team', lead: 'alice', deptId: 'rd' },
  'team-ml': { id: 'team-ml', name: 'Machine Learning Team', lead: 'bob', deptId: 'rd' },
  'team-research': { id: 'team-research', name: 'Research Team', lead: 'frank', deptId: 'rd' },
  'team-apac-sales': { id: 'team-apac-sales', name: 'APAC Sales', lead: 'hannah', deptId: 'sales' },
  'team-growth': { id: 'team-growth', name: 'Growth Team', lead: 'ivy', deptId: 'product' },
  'team-design': { id: 'team-design', name: 'Product Design Team', lead: 'charlie', deptId: 'product' },
  'leadership': { id: 'leadership', name: 'Leadership Team', lead: 'ceo', deptId: 'leadership' },
};

export const mockUsers: Record<string, User> = {
  // Leadership
  'ceo': { id: 'ceo', name: "Sarah CEO", teamId: 'leadership', manager: null, title: 'Chief Executive Officer', email: 'ceo@example.com', avatar: '', online: true },
  'david': { id: 'david', name: "David Lee", teamId: 'leadership', manager: 'ceo', title: 'Head of R&D', email: 'david@example.com', avatar: '', online: false },
  'emily': { id: 'emily', name: "Emily Carter", teamId: 'leadership', manager: 'ceo', title: 'Head of Product', email: 'emily@example.com', avatar: '', online: true },
  'grace': { id: 'grace', name: "Grace Khan", teamId: 'leadership', manager: 'ceo', title: 'Head of Sales', email: 'grace@example.com', avatar: '', online: true },
  
  // R&D Teams
  'alice': { id: 'alice', name: "Alice Adams", teamId: 'team-platform', manager: 'david', title: 'Lead Researcher', email: 'alice@example.com', avatar: '', online: true },
  'bob': { id: 'bob', name: "Bob Brown", teamId: 'team-ml', manager: 'david', title: 'Lead ML Engineer', email: 'bob@example.com', avatar: '', online: false },
  'frank': { id: 'frank', name: "Frank Foster", teamId: 'team-research', manager: 'david', title: 'Senior Scientist', email: 'frank@example.com', avatar: '', online: true },
  'demo-user': { id: 'demo-user', name: "Demo User", teamId: 'team-platform', manager: 'alice', title: 'Software Engineer', email: 'demo.user@example.com', avatar: '', online: true },
  'user-p1': { id: 'user-p1', name: "Platform Eng 1", teamId: 'team-platform', manager: 'alice', title: 'Engineer II', email: 'p1@example.com', avatar: '', online: false },
  'user-p2': { id: 'user-p2', name: "Platform Eng 2", teamId: 'team-platform', manager: 'alice', title: 'Senior Engineer', email: 'p2@example.com', avatar: '', online: true },
  'user-m1': { id: 'user-m1', name: "ML Eng 1", teamId: 'team-ml', manager: 'bob', title: 'ML Engineer', email: 'm1@example.com', avatar: '', online: true },
  'user-r1': { id: 'user-r1', name: "Researcher 1", teamId: 'team-research', manager: 'frank', title: 'Researcher', email: 'r1@example.com', avatar: '', online: false },

  // Product Teams
  'charlie': { id: 'charlie', name: "Charlie Chen", teamId: 'team-design', manager: 'emily', title: 'Lead Designer', email: 'charlie@example.com', avatar: '', online: true },
  'ivy': { id: 'ivy', name: "Ivy Iris", teamId: 'team-growth', manager: 'emily', title: 'Growth Lead', email: 'ivy@example.com', avatar: '', online: false },
  'user-d1': { id: 'user-d1', name: "Designer 1", teamId: 'team-design', manager: 'charlie', title: 'UX Designer', email: 'd1@example.com', avatar: '', online: true },
  'user-g1': { id: 'user-g1', name: "Growth PM", teamId: 'team-growth', manager: 'ivy', title: 'Product Manager', email: 'g1@example.com', avatar: '', online: true },

  // Sales Teams
  'hannah': { id: 'hannah', name: "Hannah Hughes", teamId: 'team-apac-sales', manager: 'grace', title: 'APAC Sales Lead', email: 'hannah@example.com', avatar: '', online: true },
  'user-s1': { id: 'user-s1', name: "Sales Rep APAC", teamId: 'team-apac-sales', manager: 'hannah', title: 'Account Executive', email: 's1@example.com', avatar: '', online: false },
};

export const currentUser = mockUsers['demo-user'];

export const mockProjects: Record<string, Project> = {
  'phoenix': { 
    id: 'phoenix', 
    name: 'Project Phoenix', 
    goalId: 'team-platform', 
    teamId: 'team-platform',
    status: 'In Progress', 
    statusColorScheme: 'blue', 
    statusIcon: InfoIcon,
    subtext: 'Next step: Integration testing • Due EOW' 
  },
  'reco-engine': {
    id: 'reco-engine',
    name: 'Recommendation Engine V3',
    goalId: 'team-ml',
    teamId: 'team-ml',
    status: 'Planning',
    statusColorScheme: 'gray',
    statusIcon: SettingsIcon,
    subtext: 'Defining V3 architecture' 
  },
  'ui-refresh': {
    id: 'ui-refresh',
    name: 'UI Refresh 2024',
    goalId: 'team-design',
    teamId: 'team-design',
    status: 'Blocked',
    statusColorScheme: 'red',
    statusIcon: WarningIcon,
    subtext: 'Blocked on component library update' 
  },
  'q3-strategy': { 
    id: 'q3-strategy', 
    name: 'Q3 Strategy Hub', 
    goalId: 'dept-sales', 
    teamId: 'leadership',
    status: 'Needs Review', 
    statusColorScheme: 'orange', 
    statusIcon: WarningIcon,
    subtext: 'Awaiting feedback on draft proposal' 
  },
  'apac-expansion': {
    id: 'apac-expansion',
    name: 'APAC Market Entry',
    goalId: 'team-apac-sales',
    teamId: 'team-apac-sales',
    status: 'On Track',
    statusColorScheme: 'green',
    statusIcon: CheckCircleIcon,
    subtext: 'Initial partner outreach complete' 
  }
};

export const mockActionButtons = [
  { label: "Find Data", icon: SearchIcon, tooltip: "Search through your data sources" },
  { label: "Search Literature", icon: QuestionOutlineIcon, tooltip: "Find relevant research papers" },
  { label: "Design Experiment", icon: EditIcon, tooltip: "Create a new experiment" },
  { label: "Create Project", icon: AddIcon, tooltip: "Start a new project" },
  { label: "Search Knowledgebase", icon: ViewIcon, tooltip: "Browse the knowledge base" },
];

// Recursive helper to find a goal by ID
export const findGoalById = (id: string | undefined | null, goal: Goal): Goal | null => {
  if (!id || !goal) return null;
  if (goal.id === id) return goal;
  if (goal.children) {
    for (const child of goal.children) {
      const found = findGoalById(id, child);
      if (found) return found;
    }
  }
  return null;
}; 