import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { Save, User as UserIcon, Activity, Coffee, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { calculateAgeBR } from '../lib/dateUtils';

type Tab = 'pessoal' | 'clinico' | 'habitos';

const NovoPaciente: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('pessoal');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nome: '',
    data_nascimento: '',
    sexo: '',
    telefone: '',
    whatsapp: '',
    email: '',
    peso_inicial: '',
    altura: '',
    objetivos: [] as string[],
    objetivo_texto: '',
    nivel_atividade: '',
    patologias: [] as string[],
    patologias_adicionais: '',
    restricoes: [] as string[],
    restricoes_adicionais: '',
    alergias: [] as string[],
    alergias_adicionais: '',
    medicamentos: '',
    suplementos: '',
    refeicoes: '',
    acorda: '',
    dorme: '',
    agua: '',
    exercicio: false,
    exercicio_desc: '',
    observacoes: ''
  });

  // Derived Values
  const [idade, setIdade] = useState<number | null>(null);
  const [imc, setImc] = useState<number | null>(null);

  useEffect(() => {
    if (formData.data_nascimento) {
      setIdade(calculateAgeBR(formData.data_nascimento));
    }
  }, [formData.data_nascimento]);

  useEffect(() => {
    const peso = parseFloat(formData.peso_inicial);
    const altura = parseFloat(formData.altura) / 100;
    if (peso > 0 && altura > 0) {
      setImc(parseFloat((peso / (altura * altura)).toFixed(2)));
    } else {
      setImc(null);
    }
  }, [formData.peso_inicial, formData.altura]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMultiSelect = (field: 'objetivos' | 'patologias' | 'restricoes' | 'alergias', value: string) => {
    setFormData(prev => {
      const current = prev[field];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(v => v !== value) };
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .insert([{
          nutricionista_id: user.id,
          nome: formData.nome,
          data_nascimento: formData.data_nascimento || null,
          sexo: formData.sexo || null,
          telefone: formData.telefone || null,
          whatsapp: formData.whatsapp || null,
          email: formData.email || null,
          peso_inicial: formData.peso_inicial ? parseFloat(formData.peso_inicial) : null,
          altura: formData.altura ? parseFloat(formData.altura) : null,
          objetivos: formData.objetivos,
          objetivo_texto: formData.objetivo_texto || null,
          nivel_atividade: formData.nivel_atividade || null,
          patologias: [...formData.patologias, ...(formData.patologias_adicionais ? [formData.patologias_adicionais] : [])],
          restricoes_alimentares: [...formData.restricoes, ...(formData.restricoes_adicionais ? [formData.restricoes_adicionais] : [])],
          alergias: [...formData.alergias, ...(formData.alergias_adicionais ? [formData.alergias_adicionais] : [])],
          medicamentos: formData.medicamentos || null,
          suplementos: formData.suplementos || null,
          refeicoes_por_dia: formData.refeicoes ? parseInt(formData.refeicoes) : null,
          horario_acorda: formatTime(formData.acorda) || null,
          horario_dorme: formatTime(formData.dorme) || null,
          litros_agua: formData.agua ? parseFloat(formData.agua) : null,
          atividade_fisica: formData.exercicio,
          atividade_fisica_descricao: formData.exercicio_desc || null,
          observacoes: formData.observacoes || null
        }])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/pacientes/${data[0].id}`);
        }, 2000);
      }
    } catch (err) {
      console.error('Error saving patient:', err);
      alert('Erro ao salvar paciente. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content flex-center">
          <div className="auth-card animate-in text-center">
            <CheckCircle2 size={64} color="#10b981" style={{ marginBottom: '1.5rem' }} />
            <h2>Paciente Cadastrado!</h2>
            <p>Os dados de <strong>{formData.nome}</strong> foram salvos.</p>
            <p>Redirecionando para o perfil...</p>
          </div>
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
          <h1>Novo Paciente</h1>
          <p>Preencha os dados abaixo para iniciar o acompanhamento.</p>
        </header>

        <div className="form-container">
          <div className="tab-navigation">
            <button 
              className={`tab-btn ${activeTab === 'pessoal' ? 'active' : ''}`}
              onClick={() => setActiveTab('pessoal')}
            >
              <UserIcon size={20} /> Pessoal
            </button>
            <button 
              className={`tab-btn ${activeTab === 'clinico' ? 'active' : ''}`}
              onClick={() => setActiveTab('clinico')}
            >
              <Activity size={20} /> Clínico
            </button>
            <button 
              className={`tab-btn ${activeTab === 'habitos' ? 'active' : ''}`}
              onClick={() => setActiveTab('habitos')}
            >
              <Coffee size={20} /> Hábitos
            </button>
          </div>

          <form onSubmit={handleSubmit} className="premium-form">
            {activeTab === 'pessoal' && (
              <div className="form-section animate-in">
                <div className="form-grid">
                  <div className="form-group full">
                    <label>Nome Completo *</label>
                    <input name="nome" value={formData.nome} onChange={handleInputChange} required placeholder="Nome completo do paciente" />
                  </div>
                  <div className="form-group">
                    <label>Data de Nascimento</label>
                    <div className="input-with-label">
                      <input type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleInputChange} />
                      {idade !== null && <span className="input-badge">{idade} anos</span>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Sexo</label>
                    <select name="sexo" value={formData.sexo} onChange={handleInputChange}>
                      <option value="">Selecione</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Telefone</label>
                    <input name="telefone" value={formData.telefone} onChange={handleInputChange} placeholder="(00) 00000-0000" />
                  </div>
                  <div className="form-group">
                    <label>WhatsApp</label>
                    <input name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} placeholder="(00) 00000-0000" />
                  </div>
                  <div className="form-group full">
                    <label>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="paciente@exemplo.com" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'clinico' && (
              <div className="form-section animate-in">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Peso Atual (kg)</label>
                    <input type="number" name="peso_inicial" value={formData.peso_inicial} onChange={handleInputChange} placeholder="00.0" step="0.1" />
                  </div>
                  <div className="form-group">
                    <label>Altura (cm)</label>
                    <input type="number" name="altura" value={formData.altura} onChange={handleInputChange} placeholder="000" />
                  </div>
                  <div className="form-group">
                    <label>IMC</label>
                    <div className="imc-display">
                      <input readOnly value={imc || ''} placeholder="Calculado" />
                      {imc && <span className="imc-status">{imc < 18.5 ? 'Baixo peso' : imc < 25 ? 'Normal' : imc < 30 ? 'Sobrepeso' : 'Obesidade'}</span>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Nível de Atividade</label>
                    <select name="nivel_atividade" value={formData.nivel_atividade} onChange={handleInputChange}>
                      <option value="">Selecione</option>
                      <option value="Sedentário">Sedentário</option>
                      <option value="Levemente ativo">Levemente ativo</option>
                      <option value="Moderadamente ativo">Moderadamente ativo</option>
                      <option value="Muito ativo">Muito ativo</option>
                      <option value="Extremamente ativo">Extremamente ativo</option>
                    </select>
                  </div>
                  
                  <div className="form-group full">
                    <label>Objetivo</label>
                    <div className="checkbox-grid">
                      {['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'].map(obj => (
                        <label key={obj} className="checkbox-label">
                          <input type="checkbox" checked={formData.objetivos.includes(obj)} onChange={() => handleMultiSelect('objetivos', obj)} />
                          <span>{obj}</span>
                        </label>
                      ))}
                    </div>
                    <input name="objetivo_texto" value={formData.objetivo_texto} onChange={handleInputChange} placeholder="Outros detalhes sobre o objetivo..." className="mt-1" />
                  </div>

                  <div className="form-group full">
                    <label>Patologias ou Condições</label>
                    <div className="checkbox-grid">
                      {['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'].map(pat => (
                        <label key={pat} className="checkbox-label">
                          <input type="checkbox" checked={formData.patologias.includes(pat)} onChange={() => handleMultiSelect('patologias', pat)} />
                          <span>{pat}</span>
                        </label>
                      ))}
                    </div>
                    <input name="patologias_adicionais" value={formData.patologias_adicionais} onChange={handleInputChange} placeholder="Adicionar outra patologia..." className="mt-1" />
                  </div>

                  <div className="form-group full">
                    <label>Medicamentos Contínuos</label>
                    <textarea name="medicamentos" value={formData.medicamentos} onChange={handleInputChange} rows={2} placeholder="Ex: Metformina 500mg, Losartana 50mg..." />
                  </div>

                  <div className="form-group full">
                    <label>Suplementos em Uso</label>
                    <textarea name="suplementos" value={formData.suplementos} onChange={handleInputChange} rows={2} placeholder="Ex: Creatina, Whey Protein, Vitamina D..." />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'habitos' && (
              <div className="form-section animate-in">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Refeições por dia</label>
                    <input type="number" name="refeicoes" value={formData.refeicoes} onChange={handleInputChange} placeholder="Ex: 5" />
                  </div>
                  <div className="form-group">
                    <label>Ingestão de Água (L)</label>
                    <input type="number" name="agua" value={formData.agua} onChange={handleInputChange} placeholder="Ex: 2.5" step="0.1" />
                  </div>
                  <div className="form-group">
                    <label>Horário que acorda</label>
                    <input name="acorda" value={formData.acorda} onChange={handleInputChange} placeholder="Ex: 6 ou 0630" />
                    <span className="helper-text">Será convertido p/ {formatTime(formData.acorda) || '--:--'}</span>
                  </div>
                  <div className="form-group">
                    <label>Horário que dorme</label>
                    <input name="dorme" value={formData.dorme} onChange={handleInputChange} placeholder="Ex: 23 ou 2230" />
                    <span className="helper-text">Será convertido p/ {formatTime(formData.dorme) || '--:--'}</span>
                  </div>
                  <div className="form-group full">
                    <label className="checkbox-label">
                      <input type="checkbox" name="exercicio" checked={formData.exercicio} onChange={handleInputChange} />
                      <span>Pratica atividade física regularmente?</span>
                    </label>
                    {formData.exercicio && (
                      <textarea 
                        name="exercicio_desc" 
                        value={formData.exercicio_desc} 
                        onChange={handleInputChange} 
                        className="mt-1"
                        placeholder="Qual atividade e frequência semanal? Ex: Musculação 5x/semana"
                        rows={2}
                      />
                    )}
                  </div>
                  <div className="form-group full">
                    <label>Observações Gerais</label>
                    <textarea name="observacoes" value={formData.observacoes} onChange={handleInputChange} rows={4} placeholder="Informações relevantes adicionais..." />
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate('/pacientes')}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <Loader2 className="spinner" size={20} /> : <><Save size={20} /> Salvar Cadastro</>}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default NovoPaciente;
