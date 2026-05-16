import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Mail, Lock, User as UserIcon, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      // 1. Sign up user in Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.user) {
        // 2. Insert nutritionist data into public.nutricionistas table
        // We use the same ID as the auth user
        const { error: insertError } = await supabase
          .from('nutricionistas')
          .insert([
            {
              id: data.user.id,
              nome: fullName,
              email: email,
            },
          ]);

        if (insertError) {
          setError('Erro ao salvar dados do perfil: ' + insertError.message);
          return;
        }

        setSuccess(true);
        // Automatically redirect after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado ao criar sua conta.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card animate-in text-center">
          <div className="success-icon-wrapper">
            <CheckCircle2 size={64} className="text-success pulse" />
          </div>
          <h2 className="logo-text">Conta criada!</h2>
          <p>Seja bem-vinda ao NutrIan, <strong>{fullName}</strong>.</p>
          <p>Redirecionando para o seu dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card animate-in">
        <div className="auth-header">
          <h1 className="logo-text">Nutr<span>Ian</span></h1>
          <p>Crie sua conta profissional</p>
        </div>

        <form onSubmit={handleRegister} className="auth-form">
          <div className="input-group">
            <label htmlFor="fullName">Nome Completo</label>
            <div className="input-wrapper">
              <UserIcon size={18} className="input-icon" />
              <input
                id="fullName"
                type="text"
                placeholder="Como deseja ser chamada?"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Senha (mín. 6 caracteres)</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                placeholder="Crie uma senha forte"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirmar Senha</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="confirmPassword"
                type="password"
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 className="spinner" size={20} /> : <><UserPlus size={20} /> Criar conta</>}
          </button>
        </form>

        <div className="auth-footer">
          <p>Já tem conta? <Link to="/login">Faça login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
