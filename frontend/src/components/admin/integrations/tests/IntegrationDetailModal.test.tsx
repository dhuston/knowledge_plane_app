import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { IntegrationDetailModal } from "../IntegrationDetailModal";
import { ChakraProvider } from "@chakra-ui/react";
import { IntegrationType, IntegrationStatus } from "../models/IntegrationModels";
import userEvent from "@testing-library/user-event";

const mockOnClose = jest.fn();
const mockOnSave = jest.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onSave: mockOnSave,
  integration: {
    id: "test-id",
    name: "Test Integration",
    description: "A test integration",
    type: IntegrationType.CALENDAR,
    status: IntegrationStatus.INACTIVE,
    authTypes: ["oauth2"],
    logoUrl: "test-logo.png",
    version: "1.0.0",
    lastSync: null,
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z"
  },
};

describe("IntegrationDetailModal", () => {
  beforeEach(() => {
    mockOnClose.mockReset();
    mockOnSave.mockReset();
  });

  test("renders modal with integration details", () => {
    render(
      <ChakraProvider>
        <IntegrationDetailModal {...defaultProps} />
      </ChakraProvider>
    );
    
    // Check for the modal title
    expect(screen.getByText("Configure Integration")).toBeInTheDocument();
    // Check for the integration name
    expect(screen.getByText("Test Integration")).toBeInTheDocument();
    // Check for the integration description
    expect(screen.getByText("A test integration")).toBeInTheDocument();
  });
  
  test("closes modal when Cancel button is clicked", async () => {
    render(
      <ChakraProvider>
        <IntegrationDetailModal {...defaultProps} />
      </ChakraProvider>
    );
    
    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  test("calls onSave when Save button is clicked with valid data", async () => {
    render(
      <ChakraProvider>
        <IntegrationDetailModal {...defaultProps} />
      </ChakraProvider>
    );
    
    // Fill in form fields
    const nameInput = screen.getByLabelText("Display Name");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Updated Integration Name");
    
    // Save the form
    const saveButton = screen.getByText("Save Configuration");
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Updated Integration Name",
        })
      );
    });
  });
  
  test("displays validation errors for required fields", async () => {
    render(
      <ChakraProvider>
        <IntegrationDetailModal {...defaultProps} />
      </ChakraProvider>
    );
    
    // Clear required fields
    const nameInput = screen.getByLabelText("Display Name");
    await userEvent.clear(nameInput);
    
    // Try to save the form
    const saveButton = screen.getByText("Save Configuration");
    fireEvent.click(saveButton);
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText("Display name is required")).toBeInTheDocument();
    });
    expect(mockOnSave).not.toHaveBeenCalled();
  });
  
  test("renders the appropriate auth configuration based on integration type", () => {
    const integration = {
      ...defaultProps.integration,
      authTypes: ["oauth2", "apiKey"]
    };
    
    render(
      <ChakraProvider>
        <IntegrationDetailModal 
          {...defaultProps}
          integration={integration}
        />
      </ChakraProvider>
    );
    
    // Check for auth selector component
    expect(screen.getByText("Authentication Method")).toBeInTheDocument();
    // Check for auth type tabs
    expect(screen.getByRole("tab", { name: /OAuth 2.0/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /API Key/i })).toBeInTheDocument();
  });
  
  test("includes sync settings for configurable integrations", () => {
    render(
      <ChakraProvider>
        <IntegrationDetailModal {...defaultProps} />
      </ChakraProvider>
    );
    
    // Check for sync settings section
    expect(screen.getByText("Sync Settings")).toBeInTheDocument();
    expect(screen.getByLabelText("Sync Frequency (minutes)")).toBeInTheDocument();
  });
  
  test("displays advanced settings when Advanced button is clicked", async () => {
    render(
      <ChakraProvider>
        <IntegrationDetailModal {...defaultProps} />
      </ChakraProvider>
    );
    
    // Click on Advanced Settings toggle
    const advancedButton = screen.getByText("Advanced Settings");
    fireEvent.click(advancedButton);
    
    // Check that advanced settings are displayed
    await waitFor(() => {
      expect(screen.getByText("Custom Endpoint URL")).toBeInTheDocument();
      expect(screen.getByText("Timeout (seconds)")).toBeInTheDocument();
    });
  });
});