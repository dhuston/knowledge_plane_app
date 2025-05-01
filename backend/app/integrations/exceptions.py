"""Exception classes for the integration framework."""


class IntegrationError(Exception):
    """Base exception for all integration-related errors."""
    pass


class ConnectionError(IntegrationError):
    """Error establishing a connection to an external system."""
    pass


class AuthenticationError(IntegrationError):
    """Authentication error with an external system."""
    pass


class ProcessingError(IntegrationError):
    """Error processing data from an external system."""
    pass


class IntegrationNotFoundError(IntegrationError):
    """Integration configuration not found."""
    pass


class UnsupportedIntegrationTypeError(IntegrationError):
    """Unsupported integration type."""
    pass


class IntegrationConfigurationError(IntegrationError):
    """Invalid integration configuration."""
    pass