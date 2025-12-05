import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

// Configure axios
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
axios.defaults.baseURL = API_URL;

// Auth Context
const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post('/api/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    return user;
  };

  const register = async (userData) => {
    const response = await axios.post('/api/auth/register', userData);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    
      {children}
    
  );
};

const useAuth = () => React.useContext(AuthContext);

// Login Page Component
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    
      
        
          
            
          
          Alumni Network
          Welcome back! Please login to continue
        
        
        
          
            
              Email Address
            
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="your.email@college.edu"
              required
            />
          
          
          
            
              Password
            
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Enter your password"
              required
            />
          
          
          
            {loading ? (
              <>Logging in...</>
            ) : (
              <>Login</>
            )}
          
        
        
        
          
            Don't have an account?{' '}
            
              Register here
            
          
        
      
    
  );
};

// Register Page Component
const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    passoutYear: new Date().getFullYear()
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters!');
      return;
    }
    
    setLoading(true);
    try {
      await register(formData);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    
      
        
          
            
          
          Join Alumni Network
          Create your account and connect with alumni
        
        
        
          
            
              
                First Name
              
              
            
            
            
              
                Last Name
              
              
            
          
          
          
            
              Email Address
            
            
          
          
          
            
              
                Password
              
              
            
            
            
              
                Confirm Password
              
              
            
          
          
          
            
              Passout Year
            
            
          
          
          
            {loading ? (
              <>Creating Account...</>
            ) : (
              <>Create Account</>
            )}
          
        
        
        
          
            Already have an account?{' '}
            
              Login here
            
          
        
      
    
  );
};

// Dashboard Page Component
const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [alumni, setAlumni] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [alumniRes, jobsRes] = await Promise.all([
        axios.get('/api/users/directory?limit=10'),
        axios.get('/api/jobs')
      ]);
      setAlumni(alumniRes.data.users || []);
      setJobs(jobsRes.data.jobs || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    try {
      const response = await axios.get(`/api/users/directory?search=${searchTerm}`);
      setAlumni(response.data.users || []);
      toast.success(`Found ${response.data.users?.length || 0} alumni`);
    } catch (error) {
      toast.error('Search failed');
    }
  };

  return (
    
      {/* Navigation */}
      
        
          
            
              
                
              
              
                Alumni Network
              
            
            
            
              
                Welcome, {user?.first_name}!
              
              
                
                Logout
              
            
          
        
      

      {/* Main Content */}
      
        {/* Stats Cards */}
        
          
            
              
                Total Alumni
                {alumni.length}
              
              
                
              
            
          
          
          
            
              
                Active Jobs
                {jobs.length}
              
              
                
              
            
          
          
          
            
              
                Your Profile
                {user?.headline || 'Complete your profile'}
              
              
                
              
            
          
        

        {/* Search Bar */}
        
          
            
              
                
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search alumni by name or email..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              
            
            
              Search
            
          
        

        {/* Content Grid */}
        
          {/* Alumni Directory */}
          
            
              
                
                Recent Alumni
              
            
            
            
              {loading ? (
                
                  
                  Loading alumni...
                
              ) : alumni.length === 0 ? (
                
                  
                  No alumni found
                
              ) : (
                
                  {alumni.map(person => (
                    
                      
                        
                          
                            {person.first_name?.[0]}{person.last_name?.[0]}
                          
                        
                        
                          
                            {person.first_name} {person.last_name}
                          
                          {person.headline || 'Alumni Member'}
                          
                            
                              
                              Class of {person.passout_year}
                            
                            {person.current_company && (
                              
                                
                                {person.current_company}
                              
                            )}
                          
                        
                      
                    
                  ))}
                
              )}
            
          

          {/* Job Board */}
          
            
              
                
                Latest Jobs
              
            
            
            
              {loading ? (
                
                  
                  Loading jobs...
                
              ) : jobs.length === 0 ? (
                
                  
                  No jobs available
                
              ) : (
                
                  {jobs.slice(0, 10).map(job => (
                    
                      {job.title}
                      {job.company}
                      
                        {job.location && (
                          
                            
                            {job.location}
                          
                        )}
                        {job.job_type && (
                          
                            {job.job_type}
                          
                        )}
                        {job.salary_range && (
                          
                            {job.salary_range}
                          
                        )}
                      
                    
                  ))}
                
              )}
            
          
        
      
    
  );
};

// Protected Route
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      
        
          
          Loading...
        
      
    );
  }
  
  return user ? children : ;
};

// Main App
function App() {
  return (
    
      
        
          } />
          } />
          
              
            
          } />
        
        
      
    
  );
}

export default App;
