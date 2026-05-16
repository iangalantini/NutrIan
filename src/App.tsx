import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Pacientes from './pages/Pacientes';
import NovoPaciente from './pages/NovoPaciente';
import PacientePerfil from './pages/PacientePerfil';
import PlanoAlimentarEditor from './pages/PlanoAlimentarEditor';
import './index.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pacientes" 
            element={
              <ProtectedRoute>
                <Pacientes />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pacientes/novo" 
            element={
              <ProtectedRoute>
                <NovoPaciente />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pacientes/:id" 
            element={
              <ProtectedRoute>
                <PacientePerfil />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pacientes/:id/plano/novo" 
            element={
              <ProtectedRoute>
                <PlanoAlimentarEditor />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
