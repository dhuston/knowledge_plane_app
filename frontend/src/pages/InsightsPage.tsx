import React from 'react';
import { Box } from '@chakra-ui/react';
import { InsightsProvider } from '../context/InsightsContext';
import InsightsDashboard from '../components/insights/InsightsDashboard';

/**
 * Page component that displays the insights dashboard with provider context
 */
const InsightsPage: React.FC = () => (
  <Box width="100%" height="100vh">
    <InsightsProvider>
      <InsightsDashboard />
    </InsightsProvider>
  </Box>
);

export default InsightsPage;