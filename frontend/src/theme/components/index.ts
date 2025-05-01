// KnowledgePlane AI Components
// Export all custom themed components

import Button from './button';
import Card from './Card';
import Input from './Input';
import Modal from './modal';
import Tag from './Tag';
import Badge from './Badge';
import Map from './map';

const components = {
  Button,
  Card,
  Input,
  Modal,
  Tag,
  Badge,
  ...Map, // Spread map components
};

export default components;