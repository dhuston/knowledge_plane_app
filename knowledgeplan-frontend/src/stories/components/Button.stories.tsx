import React from 'react';
import { Button, VStack, HStack, Text, Heading } from '@chakra-ui/react';
import type { Meta, StoryObj } from '@storybook/react';

// Define the metadata for this story
const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'outline', 'danger', 'success', 'ghost', 'mapControl'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    isLoading: {
      control: 'boolean',
    },
    isDisabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// Primary Button
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

// Secondary Button
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

// Tertiary Button
export const Tertiary: Story = {
  args: {
    variant: 'tertiary',
    children: 'Tertiary Button',
  },
};

// Outline Button
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

// Danger Button
export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger Button',
  },
};

// Success Button
export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success Button',
  },
};

// Ghost Button
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

// Map Control Button
export const MapControl: Story = {
  args: {
    variant: 'mapControl',
    children: 'Map Control',
  },
};

// Button Sizes
export const Sizes: Story = {
  render: () => (
    <VStack spacing={4} align="start">
      <Heading size="md">Button Sizes</Heading>
      <VStack spacing={4} align="start">
        <HStack>
          <Button size="xs">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
        </HStack>
      </VStack>
    </VStack>
  ),
};

// Button States
export const States: Story = {
  render: () => (
    <VStack spacing={6} align="start">
      <Heading size="md">Button States</Heading>
      
      <VStack spacing={4} align="start">
        <Text fontWeight="bold">Normal</Text>
        <HStack>
          <Button>Default</Button>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
        </HStack>
      </VStack>
      
      <VStack spacing={4} align="start">
        <Text fontWeight="bold">Disabled</Text>
        <HStack>
          <Button isDisabled>Default</Button>
          <Button isDisabled variant="primary">Primary</Button>
          <Button isDisabled variant="secondary">Secondary</Button>
          <Button isDisabled variant="danger">Danger</Button>
        </HStack>
      </VStack>
      
      <VStack spacing={4} align="start">
        <Text fontWeight="bold">Loading</Text>
        <HStack>
          <Button isLoading>Default</Button>
          <Button isLoading variant="primary">Primary</Button>
          <Button isLoading variant="secondary">Secondary</Button>
          <Button isLoading variant="danger">Danger</Button>
        </HStack>
      </VStack>
    </VStack>
  ),
}; 