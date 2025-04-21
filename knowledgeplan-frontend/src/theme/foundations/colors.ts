// KnowledgePlane AI Color System
// A sophisticated enterprise color palette with visualization colors for the Living Map

const colors = {
  // Main brand colors
  brand: {
    50: '#E6F7FF',
    100: '#BAE3FF',
    200: '#7CC4FA',
    300: '#47A3F3',
    400: '#2186EB',
    500: '#0967D2', // Primary brand color
    600: '#0552B5',
    700: '#03449E',
    800: '#01337D',
    900: '#002159',
  },
  
  // Secondary palette - warm accent colors
  accent: {
    50: '#FFF5F5',
    100: '#FED7D7',
    200: '#FEB2B2',
    300: '#FC8181',
    400: '#F56565',
    500: '#E53E3E', // Secondary brand color
    600: '#C53030',
    700: '#9B2C2C',
    800: '#822727',
    900: '#63171B',
  },
  
  // Tertiary palette - complementary colors
  tertiary: {
    50: '#F0FFF4',
    100: '#C6F6D5',
    200: '#9AE6B4',
    300: '#68D391',
    400: '#48BB78',
    500: '#38A169', // Tertiary brand color
    600: '#2F855A',
    700: '#276749',
    800: '#22543D',
    900: '#1C4532',
  },
  
  // Neutral palette - grayscale
  neutral: {
    50: '#F7FAFC',
    100: '#EDF2F7',
    200: '#E2E8F0',
    300: '#CBD5E0',
    400: '#A0AEC0',
    500: '#718096',
    600: '#4A5568',
    700: '#2D3748',
    800: '#1A202C',
    900: '#171923',
  },
  
  // Map visualization entity colors
  entity: {
    user: '#0967D2',        // Users - blue
    team: '#805AD5',        // Teams - purple
    department: '#6B46C1',  // Departments - deeper purple
    project: '#DD6B20',     // Projects - orange
    goal: '#E53E3E',        // Goals - red
    knowledge: '#38A169',   // Knowledge assets - green
  },
  
  // Semantic colors for relationships/edges
  relationship: {
    reports: '#718096',      // Reporting line
    member: '#4299E1',       // Team membership
    contributes: '#DD6B20',  // Project contribution
    aligns: '#E53E3E',       // Goal alignment
    owns: '#38A169',         // Ownership
    depends: '#805AD5',      // Dependency
  },
  
  // Status colors
  status: {
    success: '#38A169',
    warning: '#DD6B20',
    error: '#E53E3E',
    info: '#4299E1',
    inactive: '#A0AEC0',
  },
};

export default colors; 