import React from 'react';
import { 
  Box, Text, Heading, Button, HStack, VStack, 
  useStyleConfig, Avatar, AvatarGroup, Tag
} from '@chakra-ui/react';
import type { Meta, StoryObj } from '@storybook/react';

// Type definition for Card props
interface CardProps {
  variant?: string;
  size?: string;
  header?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  [key: string]: React.ReactNode | string | undefined;
}

// Custom Card component using the Card styles
const Card = (props: CardProps) => {
  const { variant, size, ...rest } = props;
  
  const styles = useStyleConfig('Card', { variant, size }) as {
    container: Record<string, unknown>;
    header: Record<string, unknown>;
    body: Record<string, unknown>;
    footer: Record<string, unknown>;
  };
  
  return (
    <Box sx={styles.container} {...rest}>
      {props.header && <Box sx={styles.header}>{props.header}</Box>}
      <Box sx={styles.body}>{props.children}</Box>
      {props.footer && <Box sx={styles.footer}>{props.footer}</Box>}
    </Box>
  );
};

// Define the metadata for this story
const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['elevated', 'outline', 'filled', 'unstyled', 'user', 'team', 'department', 'project', 'goal', 'knowledge'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

// Default Card
export const Default: Story = {
  args: {
    variant: 'elevated',
    size: 'md',
    header: <Heading size="md">Card Title</Heading>,
    children: (
      <Text>This is the card content area. You can put any content here.</Text>
    ),
    footer: (
      <Button size="sm" variant="primary">Action</Button>
    ),
    width: '350px',
  },
};

// Card Variants
export const CardVariants: Story = {
  render: () => (
    <VStack spacing={8} align="start">
      <Heading size="lg">Card Variants</Heading>
      
      <HStack spacing={4} alignItems="flex-start">
        <Card variant="elevated" width="250px" header={<Heading size="sm">Elevated</Heading>}>
          <Text fontSize="sm">Card with shadow elevation</Text>
        </Card>
        
        <Card variant="outline" width="250px" header={<Heading size="sm">Outline</Heading>}>
          <Text fontSize="sm">Card with border outline</Text>
        </Card>
        
        <Card variant="filled" width="250px" header={<Heading size="sm">Filled</Heading>}>
          <Text fontSize="sm">Card with background fill</Text>
        </Card>
      </HStack>
    </VStack>
  ),
};

// Entity Cards
export const EntityCards: Story = {
  render: () => (
    <VStack spacing={8} align="start">
      <Heading size="lg">Entity Cards</Heading>
      
      <HStack spacing={4} alignItems="flex-start">
        <Card 
          variant="user" 
          width="250px" 
          header={
            <HStack>
              <Avatar size="sm" name="John Doe" src="https://bit.ly/dan-abramov" />
              <VStack align="start" spacing={0}>
                <Heading size="sm">User Card</Heading>
                <Text fontSize="xs">John Doe</Text>
              </VStack>
            </HStack>
          }
        >
          <Text fontSize="sm">Card for user profiles</Text>
        </Card>
        
        <Card 
          variant="team" 
          width="250px" 
          header={
            <HStack>
              <AvatarGroup size="sm" max={3}>
                <Avatar name="John Doe" />
                <Avatar name="Jane Smith" />
                <Avatar name="Bob Johnson" />
                <Avatar name="Alice Williams" />
              </AvatarGroup>
              <Heading size="sm">Team Card</Heading>
            </HStack>
          }
        >
          <Text fontSize="sm">Card for team information</Text>
        </Card>
        
        <Card 
          variant="project" 
          width="250px" 
          header={
            <VStack align="start" spacing={1}>
              <Heading size="sm">Project Card</Heading>
              <Tag size="sm" variant="project">Active</Tag>
            </VStack>
          }
        >
          <Text fontSize="sm">Card for project details</Text>
        </Card>
      </HStack>

      <HStack spacing={4} alignItems="flex-start">
        <Card 
          variant="goal" 
          width="250px" 
          header={
            <VStack align="start" spacing={1}>
              <Heading size="sm">Goal Card</Heading>
              <Tag size="sm" variant="goal">Q3 2023</Tag>
            </VStack>
          }
        >
          <Text fontSize="sm">Card for goal tracking</Text>
        </Card>
        
        <Card 
          variant="knowledge" 
          width="250px" 
          header={
            <VStack align="start" spacing={1}>
              <Heading size="sm">Knowledge Card</Heading>
              <Tag size="sm" variant="knowledge">Documentation</Tag>
            </VStack>
          }
        >
          <Text fontSize="sm">Card for knowledge assets</Text>
        </Card>
        
        <Card 
          variant="department" 
          width="250px" 
          header={
            <VStack align="start" spacing={1}>
              <Heading size="sm">Department Card</Heading>
              <Text fontSize="xs">Engineering</Text>
            </VStack>
          }
        >
          <Text fontSize="sm">Card for department information</Text>
        </Card>
      </HStack>
    </VStack>
  ),
};

// Card Sizes
export const CardSizes: Story = {
  render: () => (
    <VStack spacing={8} align="start">
      <Heading size="lg">Card Sizes</Heading>
      
      <HStack spacing={4} alignItems="flex-start">
        <Card 
          size="sm" 
          width="200px" 
          header={<Heading size="xs">Small Card</Heading>}
          footer={<Button size="xs">Action</Button>}
        >
          <Text fontSize="xs">Small sized card with compact spacing</Text>
        </Card>
        
        <Card 
          size="md" 
          width="300px" 
          header={<Heading size="md">Medium Card</Heading>}
          footer={<Button size="sm">Action</Button>}
        >
          <Text fontSize="sm">Medium sized card with standard spacing</Text>
        </Card>
        
        <Card 
          size="lg" 
          width="400px" 
          header={<Heading size="lg">Large Card</Heading>}
          footer={<Button size="md">Action</Button>}
        >
          <Text>Large sized card with generous spacing</Text>
        </Card>
      </HStack>
    </VStack>
  ),
}; 