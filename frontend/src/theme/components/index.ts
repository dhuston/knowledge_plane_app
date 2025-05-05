// KnowledgePlane AI Components
// Export all custom themed components

import Button from './button';
import Card from './Card';
import Input from './Input';
import Modal from './modal';
import Tag from './Tag';
import Badge from './Badge';
import Map from './map';
import Tooltip from './tooltip';

const components = {
  Button,
  Card,
  Input,
  Modal,
  Tag,
  Badge,
  Tooltip,
  ...Map, // Spread map components
};

export default components;