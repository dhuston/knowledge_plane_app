import React, { useState } from 'react';
import {
  Box,
  Flex,
  useDisclosure,
  Spinner,
  Center,
  Drawer, DrawerBody, DrawerOverlay, DrawerContent
} from "@chakra-ui/react";
import { useAuth } from '../../context/AuthContext';
import CreateProjectModal from '../modals/CreateProjectModal';
import LivingMapWrapper from '../map/LivingMap';
import BriefingPanel from '../panels/BriefingPanel';
import DailyBriefingPanel from '../panels/DailyBriefingPanel';
import { MapNode, MapNodeTypeEnum } from '../../types/map';
import Header from './Header';
import { useApiClient } from '../../hooks/useApiClient';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function MainLayout() {
  const navigate = useNavigate();
  // Only get used properties from useAuth
  const { isLoading, setToken } = useAuth(); 
  const { isOpen: isCreateProjectOpen, onOpen: onCreateProjectOpen, onClose: onCreateProjectClose } = useDisclosure();
  const { isOpen: isBriefingOpen, onOpen: onBriefingOpen, onClose: onBriefingClose } = useDisclosure();
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [isFetchingNodeDetails, setIsFetchingNodeDetails] = useState<boolean>(false);
  const apiClient = useApiClient();

  const handleLogout = () => {
    setToken(null);
    navigate('/login', { replace: true });
  };

  const handleMapNodeClick = (node: MapNode | null) => {
    console.log("Map node clicked:", node);
    setSelectedNode(node);
  };

  const handleCreateProjectClick = () => {
    console.log("Create Project button clicked!");
    onCreateProjectOpen();
  };

  const handleSelectNodeFromPanel = async (nodeId: string, nodeType: MapNodeTypeEnum) => {
    console.log(`Link clicked in panel - Attempting to select node: ID=${nodeId}, Type=${nodeType}`);
    setIsFetchingNodeDetails(true);
    setSelectedNode(null);
    try {
      const response = await apiClient.get<MapNode>(`/map/node/${nodeType}/${nodeId}`);
      const mapNodeData = response.data;

      if (mapNodeData) {
        setSelectedNode(mapNodeData);
      } else {
        toast.error("Node Not Found (Empty Response Data)");
      }
    } catch (error: unknown) {
      console.error("Error fetching node from panel link:", error);
      let detail = "Could not load linked item details.";
      let message: string | undefined;

      if (error instanceof Error) {
        message = error.message;
      }

      if (typeof error === 'object' && error !== null && 'response' in error) {
        const responseError = error.response as { data?: { detail?: string } };
        detail = responseError.data?.detail || message || detail;
      } else if (message) {
        detail = message;
      } else {
        detail = String(error);
      }
      
      toast.error(`Error: ${detail}`);
      setSelectedNode(null);
    } finally {
      setIsFetchingNodeDetails(false);
    }
  };

  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box w="100vw" h="100vh" display="flex" flexDirection="column" overflow="hidden">
      <Header 
        onCreateProjectClick={handleCreateProjectClick}
        onLogout={handleLogout} 
        onOpenBriefing={onBriefingOpen}
      />
      <Flex flex={1} position="relative" overflow="hidden">
        <Box flex={1} w="100%" h="100%" position="relative">
          <LivingMapWrapper onNodeClick={handleMapNodeClick} /> 
        </Box>

        {(selectedNode || isFetchingNodeDetails) && (
          <Box
            position="absolute"
            right="0"
            top="0"
            bottom="0"
            width={{ base: "90%", md: "450px", lg: "500px" }}
            bg="white"
            borderLeftWidth="1px"
            borderColor="gray.200"
            boxShadow="lg"
            zIndex={10}
            display="flex"
            flexDirection="column"
            overflowY="auto"
          >
            <BriefingPanel 
              node={selectedNode}
              onSelectNode={handleSelectNodeFromPanel}
            />
          </Box>
        )}

        <Drawer isOpen={isBriefingOpen} placement="left" onClose={onBriefingClose} size="md">
          <DrawerOverlay />
          <DrawerContent>
            <DrawerBody p={0}>
              <DailyBriefingPanel isOpen={isBriefingOpen} onClose={onBriefingClose} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Flex>

      <CreateProjectModal 
        isOpen={isCreateProjectOpen}
        onClose={onCreateProjectClose}
      />
    </Box>
  );
} 