/**
 * DemoPage.tsx
 * Page for showcasing various feature demonstrations
 */
import React from 'react';
import { 
  Box,
  Container,
  Heading,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Divider
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';

import MapAnalyticsDemo from '../components/demos/MapAnalyticsDemo';
import MainLayout from '../components/layout/MainLayout';

const DemoPage: React.FC = () => {
  return (
    <MainLayout>
      <Container maxW="container.xl" py={6}>
        {/* Breadcrumbs */}
        <Breadcrumb mb={4}>
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Demos</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        {/* Page header */}
        <Heading mb={6}>Feature Demonstrations</Heading>
        <Divider mb={6} />

        {/* Map Analytics Demo */}
        <Box mb={10}>
          <MapAnalyticsDemo />
        </Box>
      </Container>
    </MainLayout>
  );
};

export default DemoPage;