// Frontend API utility for forgot password functionality
import axios from 'axios';

const API_BASE_URL = '/api/users';

// Configure axios defaults
axios.defaults.withCredentials = true;

export interface ForgotPasswordResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: unknown;
}

export interface ApiError {
  response?: {
    data?: {
      message?: string;
      errors?: string[];
    };
    status?: number;
  };
  message?: string;
}

/**
 * Request password reset OTP
 */
export const requestPasswordReset = async (email: string): Promise<ForgotPasswordResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/forgot-password/request`, {
      email: email.toLowerCase().trim()
    });
    
    return {
      success: true,
      statusCode: response.status,
      message: response.data.message || 'OTP sent successfully',
      data: response.data.data
    };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.message || 
      apiError.message || 
      'Failed to send reset email. Please try again.'
    );
  }
};

/**
 * Verify OTP code
 */
export const verifyPasswordResetOTP = async (
  email: string, 
  otp: string
): Promise<ForgotPasswordResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/forgot-password/verify`, {
      email: email.toLowerCase().trim(),
      otp: otp.trim()
    });
    
    return {
      success: true,
      statusCode: response.status,
      message: response.data.message || 'OTP verified successfully',
      data: response.data.data
    };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.message || 
      apiError.message || 
      'Invalid OTP. Please try again.'
    );
  }
};

/**
 * Reset password with new password
 */
export const resetForgottenPassword = async (
  email: string, 
  newPassword: string
): Promise<ForgotPasswordResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/forgot-password/reset`, {
      email: email.toLowerCase().trim(),
      newPassword
    });
    
    return {
      success: true,
      statusCode: response.status,
      message: response.data.message || 'Password reset successfully',
      data: response.data.data
    };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.message || 
      apiError.message || 
      'Failed to reset password. Please try again.'
    );
  }
};

/**
 * Utility functions
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string) => {
  const minLength = password.length >= 8;
  const maxLength = password.length <= 15;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);

  return {
    minLength,
    maxLength,
    hasNumber,
    hasSpecialChar,
    isValid: minLength && maxLength && hasNumber && hasSpecialChar
  };
};

export const validateOTP = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};

/**
 * Error handling utility
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  const apiError = error as ApiError;
  return (
    apiError.response?.data?.message || 
    'An unexpected error occurred. Please try again.'
  );
};

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  OTP_SENT: 'Password reset code has been sent to your email',
  OTP_VERIFIED: 'Code verified successfully',
  PASSWORD_RESET: 'Your password has been reset successfully',
  EMAIL_RESENT: 'Reset code has been sent again'
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_OTP: 'Please enter a valid 6-digit code',
  OTP_EXPIRED: 'The code has expired. Please request a new one',
  OTP_ATTEMPTS_EXCEEDED: 'Too many failed attempts. Please request a new code',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  WEAK_PASSWORD: 'Password does not meet security requirements',
  NETWORK_ERROR: 'Network error. Please check your connection and try again',
  SERVER_ERROR: 'Server error. Please try again later'
} as const;