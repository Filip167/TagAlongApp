import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import SignUp from './components/auth/SignUp';
import HomePage from './components/columns/HomePage';
import VisitHomePage from './components/visit columns/VisitHomePage';
import NavbarCustom from './components/NavbarCustom'; // Import the NavbarCustom component

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
        <Route path="/signup" element={<MainLayout><SignUp /></MainLayout>} />

        {/* Protected Routes */}
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/dashboard/:username" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        
        {/* Route for visiting another user's profile */}
        <Route path="/visit/:username" element={<ProtectedRoute><VisitHomePage /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
};

// Main layout for login and signup pages
const MainLayout = ({ children }) => (
  <div className="outermost-container">
    <div className="inner-container">
      <div className="image-side">
        <img src={`${process.env.PUBLIC_URL}/womanrun.png`} alt="woman running" className="woman-image" />
      </div>
      <div className="form-side">
        <div className="logo-container">
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="TAGALONG" className="login-signup-logo" />
        </div>
        <div className="content-container">
          {children}
        </div>
      </div>
    </div>
  </div>
);

// Protected route wrapper to ensure user is authenticated
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? (
    <>
      <NavbarCustom />
      {children}
    </>
  ) : (
    <Navigate to="/login" replace />
  );
};

export default App;