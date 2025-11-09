import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Briefcase, CheckCircle, XCircle, LogOut, FileText, Plus, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const CompletePortfolioApp = () => {
  // Auth States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState({ type: '', text: '' });

  // Auth Form States
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

  // Portfolio States
  const [dashboardView, setDashboardView] = useState('overview');
  const [portfolios, setPortfolios] = useState([]);
  const [portfolioForm, setPortfolioForm] = useState({
    title: '',
    summary: '',
    skills: '',
    experience: '',
    education: '',
    linkedin: '',
    github: '',
    phone: ''
  });
  const [editingPortfolio, setEditingPortfolio] = useState(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioMessage, setPortfolioMessage] = useState({ type: '', text: '' });

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(user));
      fetchUserPortfolios();
    }
  }, []);

  // Password validation
  const validatePassword = (password) => {
    const feedback = [];
    let score = 0;

    if (password.length >= 8) score++;
    else feedback.push('At least 8 characters');

    if (/[A-Z]/.test(password)) score++;
    else feedback.push('One uppercase letter');

    if (/[a-z]/.test(password)) score++;
    else feedback.push('One lowercase letter');

    if (/\d/.test(password)) score++;
    else feedback.push('One number');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    else feedback.push('One special character');

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

  // Register User
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthMessage({ type: '', text: '' });

    if (!registerForm.fullName || !registerForm.email || !registerForm.username || !registerForm.password) {
      setAuthMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setAuthMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (passwordStrength.score < 3) {
      setAuthMessage({ type: 'error', text: 'Password is too weak' });
      return;
    }

    setAuthLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        full_name: registerForm.fullName,
        email: registerForm.email,
        username: registerForm.username,
        password: registerForm.password,
        confirmPassword: registerForm.confirmPassword
      });

      if (response.data.success) {
        setAuthMessage({ type: 'success', text: 'Registration successful! Please login.' });
        setTimeout(() => {
          setAuthView('login');
          setRegisterForm({
            fullName: '',
            email: '',
            username: '',
            password: '',
            confirmPassword: ''
          });
          setAuthMessage({ type: '', text: '' });
        }, 2000);
      }
    } catch (error) {
      setAuthMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Registration failed' 
      });
    } finally {
      setAuthLoading(false);
    }
  };

  // Login User
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthMessage({ type: '', text: '' });

    if (!loginForm.identifier || !loginForm.password) {
      setAuthMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    setAuthLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        identifier: loginForm.identifier,
        password: loginForm.password
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        setCurrentUser(response.data.data.user);
        setIsAuthenticated(true);
        setAuthMessage({ type: 'success', text: 'Login successful!' });
        fetchUserPortfolios();
      }
    } catch (error) {
      setAuthMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Login failed' 
      });
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setPortfolios([]);
    setLoginForm({ identifier: '', password: '' });
    setAuthMessage({ type: '', text: '' });
  };

  // Fetch User Portfolios
  const fetchUserPortfolios = async () => {
    setPortfolioLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/portfolios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPortfolios(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
    } finally {
      setPortfolioLoading(false);
    }
  };

  // Create/Update Portfolio
  const handlePortfolioSubmit = async (e) => {
    e.preventDefault();
    
    if (!portfolioForm.title) {
      setPortfolioMessage({ type: 'error', text: 'Title is required' });
      setTimeout(() => setPortfolioMessage({ type: '', text: '' }), 3000);
      return;
    }

    setPortfolioLoading(true);

    try {
      const token = localStorage.getItem('token');
      let response;

      if (editingPortfolio) {
        response = await axios.put(
          `${API_URL}/portfolios/${editingPortfolio._id}`,
          portfolioForm,
          { headers: { Authorization: `Bearer ${token}` }}
        );
      } else {
        response = await axios.post(
          `${API_URL}/portfolios`,
          portfolioForm,
          { headers: { Authorization: `Bearer ${token}` }}
        );
      }

      if (response.data.success) {
        setPortfolioMessage({ 
          type: 'success', 
          text: editingPortfolio ? 'Portfolio updated!' : 'Portfolio created!' 
        });
        clearPortfolioForm();
        fetchUserPortfolios();
        setDashboardView('list');
      }
    } catch (error) {
      setPortfolioMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Operation failed' 
      });
    } finally {
      setPortfolioLoading(false);
      setTimeout(() => setPortfolioMessage({ type: '', text: '' }), 3000);
    }
  };

  // Delete Portfolio
  const handleDeletePortfolio = async (id) => {
    if (!window.confirm('Delete this portfolio?')) return;

    setPortfolioLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/portfolios/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPortfolioMessage({ type: 'success', text: 'Portfolio deleted!' });
        fetchUserPortfolios();
      }
    } catch (error) {
      setPortfolioMessage({ type: 'error', text: 'Delete failed' });
    } finally {
      setPortfolioLoading(false);
      setTimeout(() => setPortfolioMessage({ type: '', text: '' }), 3000);
    }
  };

  // Edit Portfolio
  const handleEditPortfolio = (portfolio) => {
    setEditingPortfolio(portfolio);
    setPortfolioForm({
      title: portfolio.title || '',
      summary: portfolio.summary || '',
      skills: portfolio.skills || '',
      experience: portfolio.experience || '',
      education: portfolio.education || '',
      linkedin: portfolio.linkedin || '',
      github: portfolio.github || '',
      phone: portfolio.phone || ''
    });
    setDashboardView('create');
  };

  const clearPortfolioForm = () => {
    setPortfolioForm({
      title: '',
      summary: '',
      skills: '',
      experience: '',
      education: '',
      linkedin: '',
      github: '',
      phone: ''
    });
    setEditingPortfolio(null);
  };

  const handlePortfolioFormChange = (e) => {
    const { name, value } = e.target;
    setPortfolioForm(prev => ({ ...prev, [name]: value }));
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

  // AUTH VIEW
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row">
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

          <div className="p-8 md:w-3/5">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => {
                  setAuthView('login');
                  setAuthMessage({ type: '', text: '' });
                }}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  authView === 'login'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => {
                  setAuthView('register');
                  setAuthMessage({ type: '', text: '' });
                }}
                className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                  authView === 'register'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Register
              </button>
            </div>

            {authMessage.text && (
              <div className={`mb-4 p-3 rounded-lg flex items-center ${
                authMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {authMessage.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                )}
                <span className="text-sm">{authMessage.text}</span>
              </div>
            )}

            {authView === 'login' ? (
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
                  disabled={authLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                >
                  {authLoading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Account</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={registerForm.fullName}
                    onChange={handleRegisterChange}
                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={registerForm.username}
                    onChange={handleRegisterChange}
                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="johndoe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Create strong password"
                  />
                  
                  {registerForm.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">Password Strength:</span>
                        <span className={`font-medium ${
                          passwordStrength.score <= 2 ? 'text-red-600' :
                          passwordStrength.score === 3 ? 'text-yellow-600' :
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
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterChange}
                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                >
                  {authLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Briefcase className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-800">Portfolio Builder</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {currentUser?.full_name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setDashboardView('overview')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              dashboardView === 'overview'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => {
              setDashboardView('create');
              clearPortfolioForm();
            }}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              dashboardView === 'create'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span>Create Portfolio</span>
          </button>
          <button
            onClick={() => {
              setDashboardView('list');
              fetchUserPortfolios();
            }}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              dashboardView === 'list'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>My Portfolios ({portfolios.length})</span>
          </button>
        </div>

        {portfolioMessage.text && (
          <div className={`mb-4 p-4 rounded-lg ${
            portfolioMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {portfolioMessage.text}
          </div>
        )}

        {dashboardView === 'overview' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Your Dashboard!</h2>
              <p className="text-gray-600">Start building your professional portfolio and resume</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
                <h3 className="font-semibold text-purple-700 mb-2 text-lg">Create Portfolio</h3>
                <p className="text-gray-600 mb-4">Build your professional resume with all your details</p>
                <button
                  onClick={() => setDashboardView('create')}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-all"
                >
                  Get Started
                </button>
              </div>
              <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                <h3 className="font-semibold text-blue-700 mb-2 text-lg">View Portfolios</h3>
                <p className="text-gray-600 mb-4">Access and manage all your created portfolios</p>
                <button
                  onClick={() => setDashboardView('list')}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all"
                >
                  View All
                </button>
              </div>
              <div className="p-6 bg-green-50 rounded-xl border-2 border-green-200">
                <h3 className="font-semibold text-green-700 mb-2 text-lg">Your Stats</h3>
                <p className="text-gray-600 mb-2">Total Portfolios: <strong>{portfolios.length}</strong></p>
                <p className="text-gray-600">Account: <strong>{currentUser?.username}</strong></p>
              </div>
            </div>
          </div>
        )}

        {dashboardView === 'create' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingPortfolio ? 'Edit Portfolio' : 'Create New Portfolio'}
            </h2>
            
            <form onSubmit={handlePortfolioSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Professional Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={portfolioForm.title}
                    onChange={handlePortfolioFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Full Stack Developer"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={portfolioForm.phone}
                    onChange={handlePortfolioFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Professional Summary</label>
                <textarea
                  name="summary"
                  value={portfolioForm.summary}
                  onChange={handlePortfolioFormChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Write a brief summary about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills & Technologies</label>
                <textarea
                  name="skills"
                  value={portfolioForm.skills}
                  onChange={handlePortfolioFormChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="JavaScript, React, Node.js, MongoDB..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Experience</label>
                <textarea
                  name="experience"
                  value={portfolioForm.experience}
                  onChange={handlePortfolioFormChange}
                  rows="5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="List your work experience..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                <textarea
                  name="education"
                  value={portfolioForm.education}
                  onChange={handlePortfolioFormChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="List your educational qualifications..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
                  <input
                    type="url"
                    name="linkedin"
                    value={portfolioForm.linkedin}
                    onChange={handlePortfolioFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GitHub Profile</label>
                  <input
                    type="url"
                    name="github"
                    value={portfolioForm.github}
                    onChange={handlePortfolioFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="https://github.com/yourusername"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={portfolioLoading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                >
                  {portfolioLoading ? 'Saving...' : editingPortfolio ? 'Update Portfolio' : 'Create Portfolio'}
                </button>
                <button
                  type="button"
                  onClick={clearPortfolioForm}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        )}

        {dashboardView === 'list' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">My Portfolios</h2>
              <button
                onClick={fetchUserPortfolios}
                disabled={portfolioLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50"
              >
                {portfolioLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {portfolios.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl text-gray-600 mb-2">No Portfolios Yet</h3>
                <p className="text-gray-500 mb-6">Create your first portfolio to get started</p>
                <button
                  onClick={() => setDashboardView('create')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
                >
                  Create Portfolio
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolios.map((portfolio) => (
                  <div key={portfolio._id} className="border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">{portfolio.title}</h3>
                        <p className="text-sm text-gray-500">
                          Created: {new Date(portfolio.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    {portfolio.summary && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {portfolio.summary}
                      </p>
                    )}

                    {portfolio.skills && (
                      <div className="mb-4">
                        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                          Skills: {portfolio.skills.substring(0, 30)}...
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditPortfolio(portfolio)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeletePortfolio(portfolio._id)}
                        disabled={portfolioLoading}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletePortfolioApp;