"use client";
import React, { useState } from "react";
import { 
  requestPasswordReset, 
  verifyPasswordResetOTP, 
  resetForgottenPassword,
  validateEmail,
  validatePassword,
  validateOTP,
  getErrorMessage
} from "../utils/forgotPasswordApi";

const TestForgotPassword = () => {
  const [email, setEmail] = useState('popatjaydeep21@gmail.com');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testRequestOTP = async () => {
    setLoading(true);
    try {
      await requestPasswordReset(email);
      addResult(`✅ OTP requested successfully for ${email}`);
    } catch (error) {
      addResult(`❌ Failed to request OTP: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const testVerifyOTP = async () => {
    if (!validateOTP(otp)) {
      addResult(`❌ Invalid OTP format: ${otp}`);
      return;
    }

    setLoading(true);
    try {
      await verifyPasswordResetOTP(email, otp);
      addResult(`✅ OTP verified successfully: ${otp}`);
    } catch (error) {
      addResult(`❌ Failed to verify OTP: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const testResetPassword = async () => {
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      addResult(`❌ Password validation failed`);
      return;
    }

    setLoading(true);
    try {
      await resetForgottenPassword(email, newPassword);
      addResult(`✅ Password reset successfully`);
    } catch (error) {
      addResult(`❌ Failed to reset password: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Forgot Password API Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Test Controls</h2>
            
            <div className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email address"
                />
                <p className={`text-xs mt-1 ${validateEmail(email) ? 'text-green-600' : 'text-red-600'}`}>
                  {validateEmail(email) ? '✅ Valid email' : '❌ Invalid email'}
                </p>
              </div>

              {/* Request OTP */}
              <button
                onClick={testRequestOTP}
                disabled={loading || !validateEmail(email)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                1. Request Password Reset
              </button>

              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OTP Code (Check your email)
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                />
                <p className={`text-xs mt-1 ${validateOTP(otp) ? 'text-green-600' : 'text-red-600'}`}>
                  {validateOTP(otp) ? '✅ Valid OTP format' : '❌ Invalid OTP format (6 digits required)'}
                </p>
              </div>

              {/* Verify OTP */}
              <button
                onClick={testVerifyOTP}
                disabled={loading || !validateOTP(otp)}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                2. Verify OTP
              </button>

              {/* New Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new password"
                />
                
                {newPassword && (
                  <div className="mt-2 space-y-1 text-xs">
                    {Object.entries(validatePassword(newPassword)).map(([key, valid]) => {
                      if (key === 'isValid') return null;
                      const labels = {
                        minLength: 'At least 8 characters',
                        maxLength: 'Maximum 15 characters',
                        hasNumber: 'Contains number',
                        hasSpecialChar: 'Contains special character'
                      };
                      return (
                        <div key={key} className={`flex items-center ${valid ? 'text-green-600' : 'text-red-600'}`}>
                          <span className="mr-1">{valid ? '✅' : '❌'}</span>
                          {labels[key as keyof typeof labels]}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reset Password */}
              <button
                onClick={testResetPassword}
                disabled={loading || !validatePassword(newPassword).isValid}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                3. Reset Password
              </button>

              {/* Clear Results */}
              <button
                onClick={clearResults}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
              >
                Clear Results
              </button>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Test Results</h2>
            
            <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-gray-500">No test results yet. Run some tests to see results here.</p>
              ) : (
                results.map((result, index) => (
                  <div key={index} className="mb-1">
                    {result}
                  </div>
                ))
              )}
            </div>

            {loading && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-blue-600">Testing...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Testing Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Enter your email address and click &quot;Request Password Reset&quot;</li>
            <li>Check your email for the OTP code</li>
            <li>Enter the OTP code and click &quot;Verify OTP&quot;</li>
            <li>Enter a new password and click &quot;Reset Password&quot;</li>
            <li>Check the results panel for success/error messages</li>
          </ol>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> Make sure the backend server is running on port 8000 and email configuration is properly set up.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestForgotPassword;