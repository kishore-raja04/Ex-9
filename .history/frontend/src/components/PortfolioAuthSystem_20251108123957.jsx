import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Briefcase, CheckCircle, XCircle } from 'lucide-react';

const PortfolioAuthSystem = () => {
  const [view, setView] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [loginForm, setLoginForm] = useState({
    identifier: '',
    password: ''
  });

  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });

  // Password validation
  const validatePassword = (password) => {
    const feedback = [];
    let score = 0;

    if (password.length >= 8) {
      score++;
    } else {
      feedback.push('At least 8 characters');
    }

    if (/[A-Z]/.test(password)) {
      score++;
    } else {
      feedback.push('One uppercase letter');
    }

    if (/[a-z]/.test(password)) {
      score++;
    } else {
      feedback.push('One lowercase letter');
    }

    if (/\d/.test(password)) {
      score++;
    } else {
      feedback.push('One number');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score++;
    } else {
      feedback.push('One special character');
    }

    return { score, feedback };
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));

    if (name === 'password') {
      setPasswordStrength(validatePassword(value));
    }
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
  };

  // Simulate API call for registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Front-end validation
    if (!registerForm.fullName || !registerForm.email || !registerForm.username || !registerForm.password) {
      setMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (passwordStrength.score < 3) {
      setMessage({ type: 'error', text: 'Password is too weak. Please meet the requirements.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.email)) {
      setMessage({ type: 'error', text: 'Invalid email format' });
      return;
    }

    if (registerForm.username.length < 3) {
      setMessage({ type: 'error', text: 'Username must be at least 3 characters' });
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setMessage({ 
        type: 'success', 
        text: 'Registration successful! You can now log in.' 
      });
      
      // Reset form and switch to login
      setTimeout(() => {
        setRegisterForm({
          fullName: '',
          email: '',
          username: '',
          password: '',
          confirmPassword: ''
        });
        setView('login');
        setMessage({ type: '', text: '' });
      }, 2000);
    }, 1500);
  };

  // Simulate API call for login
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!loginForm.identifier || !loginForm.password) {
      setMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      
      // Simulate successful login
      if (loginForm.password.length >= 6) {
        setMessage({ 
          type: 'success', 
          text: 'Login successful! Redirecting to dashboard...' 
        });
        
        setTimeout(() => {
          setView('dashboard');
        }, 1500);
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Invalid credentials. Please try again.' 
        });
      }
    }, 1500);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return 'bg-red-500';
    if (passwordStrength.score === 3) return 'bg-yellow-500';
    if (passwordStrength.score === 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score === 3) return 'Fair';
    if (passwordStrength.score === 4) return 'Good';
    return 'Strong';
  };

  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Your Dashboard!</h1>
            <p className="text-gray-600 mb-6">Start building your professional portfolio and resume</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
                <h3 className="font-semibold text-purple-700 mb-2">Create Portfolio</h3>
                <p className="text-sm text-gray-600">Showcase your work and projects</p>
              </div>
              <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                <h3 className="font-semibold text-blue-700 mb-2">Build Resume</h3>
                <p className="text-sm text-gray-600">Professional resume templates</p>
              </div>
              <div className="p-6 bg-green-50 rounded-xl border-2 border-green-200">
                <h3 className="font-semibold text-green-700 mb-2">Share & Export</h3>
                <p className="text-sm text-gray-600">Download or share your work</p>
              </div>
            </div>

            <button
              onClick={() => {
                setView('login');
                setLoginForm({ identifier: '', password: '' });
                setMessage({ type: '', text: '' });
              }}
              className="mt-8 text-purple-600 hover:text-purple-700 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row">
        {/* Left Side - Branding */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-8 md:w-2/5 flex flex-col justify-center text-white">
          <div className="mb-8">
            <Briefcase className="w-16 h-16 mb-4" />
            <h1 className="text-3xl font-bold mb-2">Portfolio Builder</h1>
            <p className="text-purple-100">Create stunning portfolios and professional resumes</p>
          </div>
          
          <div className="space-y-4 text-sm">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>Professional templates</span>
            </div>
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>Easy customization</span>
            </div>
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <span>Export and share instantly</span>
            </div>
          </div>
        </div>

        {/* Right Side - Forms */}
        <div className="p-8 md:w-3/5">
          {/* Toggle Buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setView('login');
                setMessage({ type: '', text: '' });
              }}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                view === 'login'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setView('register');
                setMessage({ type: '', text: '' });
              }}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                view === 'register'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Register
            </button>
          </div>

          {/* Message Display */}
          {message.text && (
            <div className={`mb-4 p-3 rounded-lg flex items-center ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Login Form */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Welcome Back</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username or Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="identifier"
                    value={loginForm.identifier}
                    onChange={handleLoginChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter username or email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div className="text-center mt-4">
                <a href="#" className="text-sm text-purple-600 hover:text-purple-700">
                  Forgot Password?
                </a>
              </div>
            </form>
          )}

          {/* Registration Form */}
          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Account</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={registerForm.fullName}
                    onChange={handleRegisterChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={registerForm.username}
                    onChange={handleRegisterChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="johndoe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Create strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {registerForm.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">Password Strength:</span>
                      <span className={`font-medium ${
                        passwordStrength.score <= 2 ? 'text-red-600' :
                        passwordStrength.score === 3 ? 'text-yellow-600' :
                        passwordStrength.score === 4 ? 'text-blue-600' :
                        'text-green-600'
                      }`}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600">
                        <span>Required: {passwordStrength.feedback.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioAuthSystem;