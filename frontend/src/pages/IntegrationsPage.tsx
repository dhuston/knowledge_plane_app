import React from 'react';
import { Container } from '@chakra-ui/react';
import IntegrationsPage from '../components/integrations/IntegrationsPage';

/**
 * Page that renders the integrations interface
 */
const IntegrationsPageContainer: React.FC = () => {
  return (
    <Container maxW="container.xl" py={4}>
      <IntegrationsPage />
    </Container>
  );
};

export default IntegrationsPageContainer;