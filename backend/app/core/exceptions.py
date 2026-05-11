class AppError(Exception):
    """Base exception for all application-level errors."""
    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

class NotFoundError(AppError):
    """Exception raised when a resource is not found."""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404)

class AuthenticationError(AppError):
    """Exception raised for authentication failures."""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status_code=401)

class AuthorizationError(AppError):
    """Exception raised for authorization failures."""
    def __init__(self, message: str = "Not authorized"):
        super().__init__(message, status_code=403)

class ValidationError(AppError):
    """Exception raised for validation errors."""
    def __init__(self, message: str = "Validation error"):
        super().__init__(message, status_code=422)

class SandboxError(AppError):
    """Exception raised for errors during sandbox execution."""
    def __init__(self, message: str = "Sandbox execution failed"):
        super().__init__(message, status_code=500)

class LLMError(AppError):
    """Exception raised for errors from LLM providers."""
    def __init__(self, message: str = "LLM generation failed"):
        super().__init__(message, status_code=502)
