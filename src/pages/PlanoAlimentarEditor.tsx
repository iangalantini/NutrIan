import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';
import { 
  Save, ArrowLeft, Loader2, Sparkles, 
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
  Apple, Utensils, Sandwich, Moon, Coffee, CloudSun
} from 'lucide-react';
import './PlanoAlimentarEditor.css';

interface DayPlan {
  dia: string;
  refeicoes: {
    cafe_da_manha: string[];
    lanche_manha: string[];
    almoco: string[];
    lanche_tarde: string[];
    jantar: string[];
  };
}

const PlanoAlimentarEditor: React.FC = () => {
  const { id } = useParams(); // patient_id
  const navigate = useNavigate();
  
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [weeklyPlan, setWeeklyPlan] = useState<DayPlan[] | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>("Segunda-feira");
  
  // Estados para o Modal de Edição de Refeição
  const [editingMeal, setEditingMeal] = useState<{ dayIdx: number, mealKey: string } | null>(null);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPatient();
    }
  }, [id]);

  const fetchPatient = async () => {
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setPatient(data);
    } catch (err) {
      console.error('Error fetching patient:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    setGenerating(true);
    setError(null);
    try {
      const response = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dados_do_paciente: patient }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar o plano com a IA.');
      }

      const data = await response.json();
      setWeeklyPlan(data.plano_semanal);
    } catch (err: any) {
      console.error('Error generating plan:', err);
      setError(err.message || 'Falha ao gerar o plano com a IA.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!weeklyPlan) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('planos_alimentares')
        .insert([{
          paciente_id: id,
          conteudo: { plano_semanal: weeklyPlan }
        }]);

      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        navigate(`/pacientes/${id}`);
      }, 2000);
    } catch (err) {
      console.error('Error saving plan:', err);
      alert('Erro ao salvar plano alimentar.');
    } finally {
      setSaving(false);
    }
  };

  const updateMealOption = (dayIndex: number, mealKey: string, optionIndex: number, value: string) => {
    if (!weeklyPlan) return;
    
    const newPlan = [...weeklyPlan];
    const day = newPlan[dayIndex];
    const meals = { ...day.refeicoes };
    const options = [...(meals as any)[mealKey]];
    options[optionIndex] = value;
    (meals as any)[mealKey] = options;
    day.refeicoes = meals as any;
    
    setWeeklyPlan(newPlan);
  };

  const renderMealIcon = (mealKey: string) => {
    const iconSize = 20;
    switch (mealKey) {
      case 'cafe_da_manha': return <Coffee size={iconSize} style={{ color: '#f59e0b' }} />;
      case 'lanche_manha': 
      case 'lanche_da_manha': return <Apple size={iconSize} style={{ color: '#10b981' }} />;
      case 'almoco': return <Utensils size={iconSize} style={{ color: '#ef4444' }} />;
      case 'lanche_tarde':
      case 'lanche_da_tarde': return <Sandwich size={iconSize} style={{ color: '#8b5cf6' }} />;
      case 'jantar': return <Moon size={iconSize} style={{ color: '#3b82f6' }} />;
      case 'ceia': return <CloudSun size={iconSize} style={{ color: '#6366f1' }} />;
      default: return <Sparkles size={iconSize} />;
    }
  };

  const mealLabels: Record<string, string> = {
    cafe_da_manha: "Café da manhã",
    lanche_manha: "Lanche da manhã",
    lanche_da_manha: "Lanche da manhã",
    almoco: "Almoço",
    lanche_tarde: "Lanche da tarde",
    lanche_da_tarde: "Lanche da tarde",
    jantar: "Jantar",
    ceia: "Ceia"
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content flex-center">
          <Loader2 className="spinner" size={48} color="#10b981" />
        </main>
      </div>
    );
  }

  if (success) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content flex-center">
          <div className="auth-card animate-in text-center">
            <CheckCircle2 size={64} color="#10b981" style={{ marginBottom: '1.5rem' }} />
            <h2>Plano Salvo!</h2>
            <p>O plano semanal para <strong>{patient?.nome}</strong> foi registrado.</p>
            <p>Redirecionando...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content animate-in">
        <header className="dashboard-header flex-between">
          <div>
            <button onClick={() => navigate(`/pacientes/${id}`)} className="btn-back">
              <ArrowLeft size={20} /> Voltar
            </button>
            <h1>Gerador de Plano IA</h1>
            <p>Paciente: <strong>{patient?.nome}</strong></p>
          </div>
          
          <div className="header-actions">
            {!weeklyPlan && (
              <button 
                className="btn-primary btn-sparkle" 
                onClick={handleGenerateAI}
                disabled={generating}
              >
                {generating ? <Loader2 className="spinner" size={20} /> : <><Sparkles size={20} /> Gerar Plano com IA</>}
              </button>
            )}
            {weeklyPlan && (
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="spinner" size={20} /> : <><Save size={20} /> Salvar no Prontuário</>}
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="error-alert animate-in">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {generating && (
          <div className="loading-area animate-in">
            <div className="ai-loader">
              <Sparkles size={48} className="sparkle-icon" />
              <h2>Gemini está montando o plano ideal...</h2>
              <p>Analisando restrições, objetivos e preferências de {patient?.nome}.</p>
            </div>
          </div>
        )}

        {weeklyPlan && (
          <div className="weekly-plan-container animate-in">
            <div className="editor-controls-bar flex-between" style={{ marginBottom: '1.5rem' }}>
              <span className="text-muted">Dica: Você pode editar qualquer sugestão da IA diretamente nos campos abaixo.</span>
              <button className="btn-secondary btn-sm" onClick={() => setExpandedDay(null)}>Recolher Todos</button>
            </div>

            {weeklyPlan.map((day, dIdx) => (
              <div key={day.dia} className={`day-accordion ${expandedDay === day.dia ? 'active' : ''}`}>
                <div className="day-header" onClick={() => setExpandedDay(expandedDay === day.dia ? null : day.dia)}>
                  <div className="day-title-group">
                    <CheckCircle2 size={20} className="text-primary" />
                    <h3>{day.dia}</h3>
                    <span className="badge-count">5 Refeições</span>
                  </div>
                  {expandedDay === day.dia ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
 
                {expandedDay === day.dia && (
                  <div className="day-content">
                    <div className="meals-grid">
                      {Object.keys(day.refeicoes).map((mealKey) => (
                        <button 
                          key={mealKey} 
                          className="meal-btn-trigger"
                          onClick={() => {
                            setEditingMeal({ dayIdx: dIdx, mealKey });
                            setIsMealModalOpen(true);
                          }}
                        >
                          <div className="meal-btn-icon">
                            {renderMealIcon(mealKey)}
                          </div>
                          <div className="meal-btn-text">
                            <strong>{mealLabels[mealKey] || mealKey}</strong>
                            <span>Clique para ver as 5 opções</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* MODAL DE EDIÇÃO DA REFEIÇÃO */}
        {isMealModalOpen && editingMeal && weeklyPlan && (
          <div className="modal-overlay" onClick={() => setIsMealModalOpen(false)}>
            <div className="modal-content meal-edit-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="flex-start" style={{ gap: '1rem' }}>
                  {renderMealIcon(editingMeal.mealKey)}
                  <div>
                    <h2 style={{ margin: 0 }}>{mealLabels[editingMeal.mealKey]}</h2>
                    <p style={{ margin: 0, opacity: 0.7 }}>{weeklyPlan[editingMeal.dayIdx].dia}</p>
                  </div>
                </div>
              </div>

              <div className="meal-options-edit">
                {(weeklyPlan[editingMeal.dayIdx].refeicoes as any)[editingMeal.mealKey].map((option: string, oIdx: number) => (
                  <div key={oIdx} className="edit-option-row">
                    <label>Opção {oIdx + 1}</label>
                    <textarea 
                      value={option}
                      onChange={(e) => updateMealOption(editingMeal.dayIdx, editingMeal.mealKey, oIdx, e.target.value)}
                      placeholder="Descreva a refeição aqui..."
                      rows={2}
                    />
                  </div>
                ))}
              </div>

              <div className="modal-footer">
                <button className="btn-primary" onClick={() => setIsMealModalOpen(false)}>Concluir Edição</button>
              </div>
            </div>
          </div>
        )}

        {!weeklyPlan && !generating && (
          <div className="empty-state-editor animate-in">
            <Sparkles size={64} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
            <h3>Nenhum plano gerado</h3>
            <p>Clique no botão acima para que a inteligência artificial crie um plano alimentar completo de 7 dias com base no perfil do paciente.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PlanoAlimentarEditor;
