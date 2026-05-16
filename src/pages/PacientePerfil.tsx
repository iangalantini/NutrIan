import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';
import { 
  Save, User as UserIcon, Activity, ArrowLeft, 
  CheckCircle2, Loader2, Plus, FileText, 
  TrendingUp, X, ChevronRight, Clock
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { formatDateBR, formatDateTimeBR, getTodayBR } from '../lib/dateUtils';
import './PacientePerfil.css';

type Tab = 'pessoal' | 'clinico' | 'habitos';
type Section = 'dados' | 'consultas' | 'planos';

const PacientePerfil: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('dados');
  const [activeTab, setActiveTab] = useState<Tab>('pessoal');
  
  // Data State
  const [patient, setPatient] = useState<any>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  
  // Form State for Patient Data
  const [formData, setFormData] = useState<any>({});
  
  // Consultation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Meal Plan Modal State
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  const [newConsultation, setNewConsultation] = useState({
    data_consulta: getTodayBR(),
    peso: '',
    cintura: '',
    quadril: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: ''
  });

  useEffect(() => {
    if (id) {
      fetchPatientData();
    }
  }, [id]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Patient
      const { data: patientData, error: pError } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (pError) throw pError;
      
      setPatient(patientData);
      setFormData({
        ...patientData,
        patologias_adicionais: '', // Logic to split arrays if needed, but keeping it simple for now
        restricoes_adicionais: '',
        alergias_adicionais: '',
        refeicoes: patientData.refeicoes_por_dia?.toString() || '',
        acorda: patientData.horario_acorda || '',
        dorme: patientData.horario_dorme || '',
        agua: patientData.litros_agua?.toString() || '',
        exercicio: patientData.atividade_fisica,
        exercicio_desc: patientData.atividade_fisica_descricao || ''
      });

      // 2. Fetch Consultations
      const { data: consultationsData, error: cError } = await supabase
        .from('consultas')
        .select('*')
        .eq('paciente_id', id)
        .order('data_consulta', { ascending: false });
      
      if (cError) throw cError;
      setConsultations(consultationsData || []);

      // 3. Fetch Meal Plans
      const { data: plansData, error: plError } = await supabase
        .from('planos_alimentares')
        .select('*')
        .eq('paciente_id', id)
        .order('created_at', { ascending: false });
      
      if (plError) throw plError;
      setMealPlans(plansData || []);

    } catch (err) {
      console.error('Error fetching data:', err);
      alert('Erro ao carregar dados do paciente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData((prev: any) => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleMultiSelect = (field: string, value: string) => {
    setFormData((prev: any) => {
      const current = prev[field] || [];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((v: string) => v !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const formatTime = (val: string) => {
    if (!val) return '';
    let digits = val.replace(/\D/g, '');
    if (digits.length === 1 || digits.length === 2) {
      return digits.padStart(2, '0') + ':00';
    }
    if (digits.length === 3) {
      return digits[0].padStart(2, '0') + ':' + digits.slice(1);
    }
    if (digits.length >= 4) {
      return digits.slice(0, 2) + ':' + digits.slice(2, 4);
    }
    return val;
  };

  const handleSavePatient = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('pacientes')
        .update({
          nome: formData.nome,
          data_nascimento: formData.data_nascimento,
          sexo: formData.sexo,
          telefone: formData.telefone,
          whatsapp: formData.whatsapp,
          email: formData.email,
          peso_inicial: formData.peso_inicial ? parseFloat(formData.peso_inicial) : null,
          altura: formData.altura ? parseFloat(formData.altura) : null,
          objetivos: formData.objetivos,
          objetivo_texto: formData.objetivo_texto,
          nivel_atividade: formData.nivel_atividade,
          patologias: formData.patologias,
          restricoes_alimentares: formData.restricoes_alimentares,
          alergias: formData.alergias,
          medicamentos: formData.medicamentos,
          suplementos: formData.suplementos,
          refeicoes_por_dia: formData.refeicoes ? parseInt(formData.refeicoes) : null,
          horario_acorda: formatTime(formData.acorda),
          horario_dorme: formatTime(formData.dorme),
          litros_agua: formData.agua ? parseFloat(formData.agua) : null,
          atividade_fisica: formData.exercicio,
          atividade_fisica_descricao: formData.exercicio_desc,
          observacoes: formData.observacoes
        })
        .eq('id', id);

      if (error) throw error;
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      fetchPatientData(); // Refresh
    } catch (err) {
      console.error('Error updating patient:', err);
      alert('Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('consultas')
        .insert([{
          paciente_id: id,
          data_consulta: newConsultation.data_consulta,
          peso: newConsultation.peso ? parseFloat(newConsultation.peso) : null,
          cintura: newConsultation.cintura ? parseFloat(newConsultation.cintura) : null,
          quadril: newConsultation.quadril ? parseFloat(newConsultation.quadril) : null,
          percentual_gordura: newConsultation.percentual_gordura ? parseFloat(newConsultation.percentual_gordura) : null,
          observacoes: newConsultation.observacoes,
          proximo_retorno: newConsultation.proximo_retorno || null
        }]);

      if (error) throw error;

      setIsModalOpen(false);
      setNewConsultation({
        data_consulta: getTodayBR(),
        peso: '',
        cintura: '',
        quadril: '',
        percentual_gordura: '',
        observacoes: '',
        proximo_retorno: ''
      });
      fetchPatientData(); // Refresh chart and list
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving consultation:', err);
      alert('Erro ao salvar consulta.');
    } finally {
      setSaving(false);
    }
  };

  // Prepare chart data
  const chartData = [...consultations]
    .sort((a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime())
    .map(c => ({
      data: formatDateBR(c.data_consulta),
      peso: c.peso
    }));

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

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content animate-in">
        <header className="dashboard-header">
          <button onClick={() => navigate('/pacientes')} className="btn-back">
            <ArrowLeft size={20} /> Voltar para lista
          </button>
          <h1>{patient?.nome}</h1>
          <p>Acompanhamento e evolução do paciente</p>
        </header>

        {/* Global Success Toast */}
        {showSuccess && (
          <div className="success-toast">
            <CheckCircle2 size={24} />
            <span>Alterações salvas com sucesso!</span>
          </div>
        )}

        {/* Section Navigation */}
        <div className="tab-navigation" style={{ marginBottom: '3rem' }}>
          <button 
            className={`tab-btn ${activeSection === 'dados' ? 'active' : ''}`}
            onClick={() => setActiveSection('dados')}
          >
            <UserIcon size={20} /> Dados do Paciente
          </button>
          <button 
            className={`tab-btn ${activeSection === 'consultas' ? 'active' : ''}`}
            onClick={() => setActiveSection('consultas')}
          >
            <TrendingUp size={20} /> Consultas
          </button>
          <button 
            className={`tab-btn ${activeSection === 'planos' ? 'active' : ''}`}
            onClick={() => setActiveSection('planos')}
          >
            <FileText size={20} /> Planos Alimentares
          </button>
        </div>

        <div className="profile-container">
          
          {/* SECTION 1: DADOS DO PACIENTE */}
          {activeSection === 'dados' && (
            <div className="profile-section-card animate-in">
              <div className="tab-navigation" style={{ marginBottom: '2rem' }}>
                <button className={`tab-btn ${activeTab === 'pessoal' ? 'active' : ''}`} onClick={() => setActiveTab('pessoal')}>Pessoal</button>
                <button className={`tab-btn ${activeTab === 'clinico' ? 'active' : ''}`} onClick={() => setActiveTab('clinico')}>Clínico</button>
                <button className={`tab-btn ${activeTab === 'habitos' ? 'active' : ''}`} onClick={() => setActiveTab('habitos')}>Hábitos</button>
              </div>

              <div className="premium-form">
                {activeTab === 'pessoal' && (
                  <div className="form-grid animate-in">
                    <div className="form-group full">
                      <label>Nome Completo</label>
                      <input name="nome" value={formData.nome} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Data de Nascimento</label>
                      <input type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Sexo</label>
                      <select name="sexo" value={formData.sexo} onChange={handleInputChange}>
                        <option value="Feminino">Feminino</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Telefone</label>
                      <input name="telefone" value={formData.telefone} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>WhatsApp</label>
                      <input name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} />
                    </div>
                    <div className="form-group full">
                      <label>Email</label>
                      <input name="email" value={formData.email} onChange={handleInputChange} />
                    </div>
                  </div>
                )}

                {activeTab === 'clinico' && (
                  <div className="form-grid animate-in">
                    <div className="form-group">
                      <label>Peso Inicial (kg)</label>
                      <input type="number" name="peso_inicial" value={formData.peso_inicial} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Altura (cm)</label>
                      <input type="number" name="altura" value={formData.altura} onChange={handleInputChange} />
                    </div>
                    <div className="form-group full">
                      <label>Objetivos</label>
                      <div className="checkbox-grid">
                        {['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva'].map(obj => (
                          <label key={obj} className="checkbox-label">
                            <input type="checkbox" checked={formData.objetivos?.includes(obj)} onChange={() => handleMultiSelect('objetivos', obj)} />
                            <span>{obj}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="form-group full">
                      <label>Medicamentos</label>
                      <textarea name="medicamentos" value={formData.medicamentos} onChange={handleInputChange} rows={2} />
                    </div>
                  </div>
                )}

                {activeTab === 'habitos' && (
                  <div className="form-grid animate-in">
                    <div className="form-group">
                      <label>Água (L/dia)</label>
                      <input type="number" name="agua" value={formData.agua} onChange={handleInputChange} step="0.1" />
                    </div>
                    <div className="form-group">
                      <label>Refeições/dia</label>
                      <input type="number" name="refeicoes" value={formData.refeicoes} onChange={handleInputChange} />
                    </div>
                    <div className="form-group full">
                      <label>Observações</label>
                      <textarea name="observacoes" value={formData.observacoes} onChange={handleInputChange} rows={4} />
                    </div>
                  </div>
                )}

                <div className="form-actions">
                  <button className="btn-primary" onClick={handleSavePatient} disabled={saving}>
                    {saving ? <Loader2 className="spinner" size={20} /> : <><Save size={20} /> Salvar Alterações</>}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: CONSULTAS */}
          {activeSection === 'consultas' && (
            <div className="animate-in">
              <div className="profile-section-card" style={{ marginBottom: '2rem' }}>
                <div className="profile-section-header">
                  <h2><TrendingUp size={24} /> Evolução de Peso</h2>
                  <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} /> Nova Consulta
                  </button>
                </div>
                
                <div className="chart-container">
                  {consultations.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="data" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 12 }} 
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 12 }}
                          unit=" kg"
                        />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '16px', 
                            border: 'none', 
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="peso" 
                          stroke="var(--primary)" 
                          strokeWidth={4} 
                          dot={{ r: 6, fill: 'var(--primary)', strokeWidth: 3, stroke: '#fff' }}
                          activeDot={{ r: 8, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="chart-empty-message">
                      <Activity size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                      <p>Nenhuma consulta registrada ainda.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="consultations-list">
                {consultations.map((c) => (
                  <div key={c.id} className="consultation-card animate-in">
                    <div className="consultation-header">
                      <div className="consultation-date">
                        {formatDateBR(c.data_consulta)}
                      </div>
                      <div className="metric-value" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>
                        {c.peso} kg
                      </div>
                    </div>
                    
                    <div className="consultation-metrics">
                      <div className="metric-item">
                        <span className="metric-label">Cintura</span>
                        <span className="metric-value">{c.cintura ? `${c.cintura} cm` : '--'}</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Quadril</span>
                        <span className="metric-value">{c.quadril ? `${c.quadril} cm` : '--'}</span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">% Gordura</span>
                        <span className="metric-value">{c.percentual_gordura ? `${c.percentual_gordura}%` : '--'}</span>
                      </div>
                    </div>

                    {c.observacoes && (
                      <div className="consultation-obs">
                        <strong>Observações:</strong> {c.observacoes}
                      </div>
                    )}

                    {c.proximo_retorno && (
                      <div className="consultation-next">
                        <Clock size={16} /> Próximo retorno: {formatDateBR(c.proximo_retorno)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: PLANOS ALIMENTARES */}
          {activeSection === 'planos' && (
            <div className="profile-section-card animate-in">
              <div className="profile-section-header">
                <h2><FileText size={24} /> Planos Alimentares</h2>
                <button className="btn-primary" onClick={() => navigate(`/pacientes/${id}/plano/novo`)}>
                  <Plus size={20} /> Gerar Plano Alimentar
                </button>
              </div>

              {mealPlans.length > 0 ? (
                <div className="plans-list">
                  {mealPlans.map((plan) => (
                    <div 
                      key={plan.id} 
                      className="plan-item"
                      onClick={() => {
                        setSelectedPlan(plan);
                        setIsPlanModalOpen(true);
                      }}
                    >
                      <div className="plan-info">
                        <FileText size={20} color="var(--primary)" />
                        <span>Plano Alimentar</span>
                        <span className="plan-date">
                          {formatDateBR(plan.created_at)}
                        </span>
                      </div>
                      <ChevronRight size={20} color="var(--text-muted)" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="chart-empty-message">
                  <p>Nenhum plano alimentar gerado ainda.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* NEW CONSULTATION MODAL */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
              <h2 className="modal-title">Nova Consulta</h2>
              
              <form onSubmit={handleSaveConsultation} className="premium-form">
                <div className="form-grid">
                  <div className="form-group full">
                    <label>Data da Consulta</label>
                    <input 
                      type="date" 
                      required 
                      value={newConsultation.data_consulta} 
                      onChange={e => setNewConsultation({...newConsultation, data_consulta: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Peso Atual (kg)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      required 
                      placeholder="00.0"
                      value={newConsultation.peso} 
                      onChange={e => setNewConsultation({...newConsultation, peso: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>% Gordura</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      placeholder="0.0"
                      value={newConsultation.percentual_gordura} 
                      onChange={e => setNewConsultation({...newConsultation, percentual_gordura: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Cintura (cm)</label>
                    <input 
                      type="number" 
                      placeholder="00"
                      value={newConsultation.cintura} 
                      onChange={e => setNewConsultation({...newConsultation, cintura: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Quadril (cm)</label>
                    <input 
                      type="number" 
                      placeholder="00"
                      value={newConsultation.quadril} 
                      onChange={e => setNewConsultation({...newConsultation, quadril: e.target.value})}
                    />
                  </div>
                  <div className="form-group full">
                    <label>Observações</label>
                    <textarea 
                      rows={3} 
                      placeholder="Evolução, dificuldades, etc..."
                      value={newConsultation.observacoes} 
                      onChange={e => setNewConsultation({...newConsultation, observacoes: e.target.value})}
                    />
                  </div>
                  <div className="form-group full">
                    <label>Próximo Retorno</label>
                    <input 
                      type="date" 
                      value={newConsultation.proximo_retorno} 
                      onChange={e => setNewConsultation({...newConsultation, proximo_retorno: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? <Loader2 className="spinner" size={20} /> : 'Salvar Consulta'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW MEAL PLAN MODAL */}
        {isPlanModalOpen && selectedPlan && (
          <div className="modal-overlay" onClick={() => setIsPlanModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setIsPlanModalOpen(false)}><X size={24} /></button>
              <h2 className="modal-title">Plano Alimentar</h2>
              <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>
                Gerado em {formatDateTimeBR(selectedPlan.created_at)}
              </p>

              <div className="view-plan-content">
                {/* Suporte ao formato novo (Semanal IA) */}
                {selectedPlan.conteudo?.plano_semanal?.map((day: any) => (
                  <div key={day.dia} className="view-day-section">
                    <h3 className="view-day-title">{day.dia}</h3>
                    <div className="view-meals-list">
                      {Object.entries(day.refeicoes).map(([key, options]: [string, any]) => (
                        <div key={key} className="view-meal-summary">
                          <strong>{key.replace(/_/g, ' ').toUpperCase()}:</strong>
                          <ul className="view-options-list">
                            {options.map((opt: string, i: number) => (
                              <li key={i}>{opt}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Suporte ao formato antigo (Lista Simples) */}
                {selectedPlan.conteudo?.meals?.map((meal: any) => (
                  <div key={meal.id} className="view-meal-item">
                    <div className="view-meal-header">
                      <span className="view-meal-time">{meal.time}</span>
                      <span>{meal.name}</span>
                    </div>
                    <div className="view-meal-desc">
                      {meal.content || 'Nenhuma descrição informada.'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-actions" style={{ marginTop: '3rem' }}>
                <button className="btn-primary" onClick={() => setIsPlanModalOpen(false)}>Fechar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PacientePerfil;

