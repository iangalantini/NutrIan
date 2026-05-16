import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { Users, Calendar, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDateBR, getTodayBR } from '../lib/dateUtils';

interface StatData {
  totalPatients: number;
  weekConsultations: number;
  patientsWithoutReturn: { id: string; nome: string; lastConsultation: string }[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatData>({
    totalPatients: 0,
    weekConsultations: 0,
    patientsWithoutReturn: []
  });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        // 1. Total de Pacientes
        const { count: patientCount } = await supabase
          .from('pacientes')
          .select('*', { count: 'exact', head: true })
          .eq('nutricionista_id', user.id);

        // 2. Buscar IDs de pacientes para filtros subsequentes
        const { data: patients } = await supabase
          .from('pacientes')
          .select('id, nome')
          .eq('nutricionista_id', user.id);

        const patientIds = patients?.map(p => p.id) || [];

        // 3. Consultas da Semana
        let weekCount = 0;
        if (patientIds.length > 0) {
          const now = new Date();
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay()); // Domingo
          startOfWeek.setHours(0, 0, 0, 0);
          
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6); // Sábado
          endOfWeek.setHours(23, 59, 59, 999);

          const { count } = await supabase
            .from('consultas')
            .select('*', { count: 'exact', head: true })
            .in('paciente_id', patientIds)
            .gte('data_consulta', startOfWeek.toISOString().split('T')[0])
            .lte('data_consulta', endOfWeek.toISOString().split('T')[0]);
          
          weekCount = count || 0;
        }

        // 4. Pacientes sem retorno
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
        const todayStr = getTodayBR();

        const withoutReturn: { id: string; nome: string; lastConsultation: string }[] = [];

        if (patientIds.length > 0) {
          const { data: consultations } = await supabase
            .from('consultas')
            .select('paciente_id, data_consulta, proximo_retorno')
            .in('paciente_id', patientIds)
            .order('data_consulta', { ascending: false });

          patients?.forEach(patient => {
            const patientConsults = consultations?.filter(c => c.paciente_id === patient.id) || [];
            
            if (patientConsults.length > 0) {
              const latest = patientConsults[0];
              const nextReturn = latest.proximo_retorno;
              
              if (latest.data_consulta < thirtyDaysAgoStr) {
                if (!nextReturn || nextReturn < todayStr) {
                  withoutReturn.push({
                    id: patient.id,
                    nome: patient.nome,
                    lastConsultation: latest.data_consulta
                  });
                }
              }
            }
          });
        }

        setStats({
          totalPatients: patientCount || 0,
          weekConsultations: weekCount,
          patientsWithoutReturn: withoutReturn
        });

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content flex-center">
          <Loader2 className="spinner" size={48} color="#2ecc71" />
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content animate-in">
        <header className="dashboard-header">
          <div>
            <h1>Olá, Nutricionista</h1>
            <p>Aqui está o resumo do seu consultório hoje.</p>
          </div>
        </header>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper blue">
              <Users size={24} />
            </div>
            <div className="stat-details">
              <span className="stat-label">Total de Pacientes</span>
              <span className="stat-value">{stats.totalPatients}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper green">
              <Calendar size={24} />
            </div>
            <div className="stat-details">
              <span className="stat-label">Consultas da Semana</span>
              <span className="stat-value">{stats.weekConsultations}</span>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon-wrapper orange">
              <AlertCircle size={24} />
            </div>
            <div className="stat-details">
              <span className="stat-label">Sem Retorno</span>
              <span className="stat-value">{stats.patientsWithoutReturn.length}</span>
            </div>
          </div>
        </div>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Pacientes sem retorno</h2>
            <p>Última consulta há mais de 30 dias e sem agendamento futuro.</p>
          </div>

          <div className="list-card">
            {stats.patientsWithoutReturn.length > 0 ? (
              <ul className="patient-list">
                {stats.patientsWithoutReturn.map(patient => (
                  <li key={patient.id}>
                    <Link to={`/pacientes/${patient.id}`} className="patient-item">
                      <div className="patient-info">
                        <span className="patient-name">{patient.nome}</span>
                        <span className="patient-meta">Última consulta: {formatDateBR(patient.lastConsultation)}</span>
                      </div>
                      <ChevronRight size={18} className="text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-list-state">
                <p>Nenhum paciente sem retorno no momento</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
