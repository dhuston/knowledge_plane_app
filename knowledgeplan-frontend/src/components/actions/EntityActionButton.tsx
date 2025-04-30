import React from 'react';
import {
    Box,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Portal,
    useDisclosure,
    Icon,
    Text,
    HStack,
    useColorModeValue,
} from '@chakra-ui/react';
import { FiPlus, FiLink, FiFolder, FiTarget, FiFileText, FiUser } from 'react-icons/fi';
import CreateProjectModal from '../modals/CreateProjectModal';
import { GoalFormModal } from '../modals/GoalFormModal';
import EntityLinkingModal from '../modals/EntityLinkingModal';
import KnowledgeAssetForm from '../forms/KnowledgeAssetForm';
import UserForm from '../forms/UserForm';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, ModalFooter } from '@chakra-ui/react';

interface EntityActionButtonProps {
    onEntityCreated?: (entityType: string, entity: any) => void;
    onEntityLinked?: () => void;
}

const EntityActionButton: React.FC<EntityActionButtonProps> = ({
    onEntityCreated,
    onEntityLinked
}) => {
    // Project modal
    const {
        isOpen: isProjectModalOpen,
        onOpen: onProjectModalOpen,
        onClose: onProjectModalClose
    } = useDisclosure();

    // Goal modal
    const {
        isOpen: isGoalModalOpen,
        onOpen: onGoalModalOpen,
        onClose: onGoalModalClose
    } = useDisclosure();

    // Knowledge asset modal
    const {
        isOpen: isKnowledgeModalOpen,
        onOpen: onKnowledgeModalOpen,
        onClose: onKnowledgeModalClose
    } = useDisclosure();

    // Person modal
    const {
        isOpen: isPersonModalOpen,
        onOpen: onPersonModalOpen,
        onClose: onPersonModalClose
    } = useDisclosure();

    // Linking modal
    const {
        isOpen: isLinkingModalOpen,
        onOpen: onLinkingModalOpen,
        onClose: onLinkingModalClose
    } = useDisclosure();

    // Theme colors
    const menuBg = useColorModeValue('white', 'gray.800');
    const menuBorder = useColorModeValue('gray.200', 'gray.700');
    const hoverBg = useColorModeValue('gray.100', 'gray.700');

    return (
        <>
            <Box position="fixed" bottom="24px" right="24px" zIndex={10}>
                <Menu placement="top-end">
                    <MenuButton
                        as={IconButton}
                        aria-label="Create or link entities"
                        icon={<FiPlus />}
                        colorScheme="blue"
                        size="lg"
                        borderRadius="full"
                        boxShadow="lg"
                    />
                    <Portal>
                        <MenuList
                            bg={menuBg}
                            borderColor={menuBorder}
                            boxShadow="lg"
                            width="250px"
                            py={2}
                        >
                            <MenuItem
                                onClick={onProjectModalOpen}
                                _hover={{ bg: hoverBg }}
                                py={3}
                            >
                                <HStack spacing={3}>
                                    <Icon as={FiFolder} boxSize={5} />
                                    <Box>
                                        <Text fontWeight="medium">Create Project</Text>
                                        <Text fontSize="sm" color="gray.500">
                                            Add a new project
                                        </Text>
                                    </Box>
                                </HStack>
                            </MenuItem>
                            <MenuItem
                                onClick={onGoalModalOpen}
                                _hover={{ bg: hoverBg }}
                                py={3}
                            >
                                <HStack spacing={3}>
                                    <Icon as={FiTarget} boxSize={5} />
                                    <Box>
                                        <Text fontWeight="medium">Create Goal</Text>
                                        <Text fontSize="sm" color="gray.500">
                                            Add a new goal or objective
                                        </Text>
                                    </Box>
                                </HStack>
                            </MenuItem>
                            <MenuItem
                                onClick={onKnowledgeModalOpen}
                                _hover={{ bg: hoverBg }}
                                py={3}
                            >
                                <HStack spacing={3}>
                                    <Icon as={FiFileText} boxSize={5} />
                                    <Box>
                                        <Text fontWeight="medium">Create Knowledge Asset</Text>
                                        <Text fontSize="sm" color="gray.500">
                                            Add a document or resource
                                        </Text>
                                    </Box>
                                </HStack>
                            </MenuItem>
                            <MenuItem
                                onClick={onPersonModalOpen}
                                _hover={{ bg: hoverBg }}
                                py={3}
                            >
                                <HStack spacing={3}>
                                    <Icon as={FiUser} boxSize={5} />
                                    <Box>
                                        <Text fontWeight="medium">Add Person</Text>
                                        <Text fontSize="sm" color="gray.500">
                                            Add a team member
                                        </Text>
                                    </Box>
                                </HStack>
                            </MenuItem>
                            <MenuItem
                                onClick={onLinkingModalOpen}
                                _hover={{ bg: hoverBg }}
                                py={3}
                            >
                                <HStack spacing={3}>
                                    <Icon as={FiLink} boxSize={5} />
                                    <Box>
                                        <Text fontWeight="medium">Link Entities</Text>
                                        <Text fontSize="sm" color="gray.500">
                                            Create connections between entities
                                        </Text>
                                    </Box>
                                </HStack>
                            </MenuItem>
                        </MenuList>
                    </Portal>
                </Menu>
            </Box>

            {/* Direct modals for each entity type */}
            <CreateProjectModal
                isOpen={isProjectModalOpen}
                onClose={onProjectModalClose}
                onProjectCreated={(project) => onEntityCreated?.('project', project)}
            />

            <GoalFormModal
                isOpen={isGoalModalOpen}
                onClose={onGoalModalClose}
                onSuccess={(goal) => onEntityCreated?.('goal', goal)}
            />

            {/* Knowledge Asset Modal */}
            <Modal isOpen={isKnowledgeModalOpen} onClose={onKnowledgeModalClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Create Knowledge Asset</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <KnowledgeAssetForm
                            onSubmit={(asset) => {
                                onEntityCreated?.('knowledge', asset);
                                onKnowledgeModalClose();
                            }}
                        />
                    </ModalBody>
                    <ModalFooter>
                        {/* Footer is empty as the form has its own buttons */}
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Person Modal */}
            <Modal isOpen={isPersonModalOpen} onClose={onPersonModalClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Add Person</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <UserForm
                            onSubmit={(user) => {
                                onEntityCreated?.('person', user);
                                onPersonModalClose();
                            }}
                        />
                    </ModalBody>
                    <ModalFooter>
                        {/* Footer is empty as the form has its own buttons */}
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Entity Linking Modal */}
            <EntityLinkingModal
                isOpen={isLinkingModalOpen}
                onClose={onLinkingModalClose}
                onLinkCreated={onEntityLinked}
            />
        </>
    );
};

export default EntityActionButton;
