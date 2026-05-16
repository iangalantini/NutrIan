import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import { Search, Plus, User as UserIcon, ChevronRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDateBR } from '../lib/dateUtils';

interface Patient {
  id: string;
  nome: string;
  objetivos: string[];
  last_consultation?: string;
}

const Pacientes: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchPatients = async () => {
      setLoading(true);
      try {
        // Fetch patients
        const { data: patientsData, error: patientsError } = await supabase
          .from('pacientes')
          .select('id, nome, objetivos')
          .eq('nutricionista_id', user.id)
          .order('nome');

        if (patientsError) throw patientsError;

        if (patientsData && patientsData.length > 0) {
          const patientIds = patientsData.map(p => p.id);

          // Fetch last consultation for each patient
          const { data: consultations } = await supabase
            .from('consultas')
            .select('paciente_id, data_consulta')
            .in('paciente_id', patientIds)
            .order('data_consulta', { ascending: false });

          const combinedData = patientsData.map(patient => {
            const lastConsult = consultations?.find(c => c.paciente_id === patient.id);
            return {
              ...patient,
              last_consultation: lastConsult?.data_consulta
            };
          });

          setPatients(combinedData);
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [user]);

  const filteredPatients = patients.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content animate-in">
        <header className="dashboard-header flex-between">
          <div>
            <h1>Pacientes</h1>
            <p>Gerencie sua base de clientes e acompanhe progressos.</p>
          </div>
          <button onClick={() => navigate('/pacientes/novo')} className="btn-primary">
            <Plus size={20} /> Novo Paciente
          </button>
        </header>

        <section className="dashboard-section">
          <div className="search-bar">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar paciente por nome..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="list-card">
            {loading ? (
              <div className="flex-center py-5">
                <Loader2 className="spinner" size={32} color="#10b981" />
              </div>
            ) : filteredPatients.length > 0 ? (
              <ul className="patient-list">
                {filteredPatients.map(patient => (
                  <li key={patient.id}>
                    <Link to={`/pacientes/${patient.id}`} className="patient-item-detailed">
                      <div className="patient-main">
                        <div className="patient-avatar">
                          <UserIcon size={24} />
                        </div>
                        <div className="patient-info">
                          <span className="patient-name">{patient.nome}</span>
                          <span className="patient-objective">
                            {patient.objetivos && patient.objetivos.length > 0 
                              ? patient.objetivos.join(', ') 
                              : 'Sem objetivo definido'}
                          </span>
                        </div>
                      </div>
                      <div className="patient-stats">
                        <div className="patient-stat">
                          <span className="stat-label">Última Consulta</span>
                          <span className="stat-val">
                            {patient.last_consultation 
                              ? formatDateBR(patient.last_consultation) 
                              : 'Nunca consultou'}
                          </span>
                        </div>
                        <ChevronRight size={20} className="text-muted" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-list-state py-5">
                <p>{searchTerm ? 'Nenhum paciente encontrado com este nome.' : 'Nenhum paciente cadastrado ainda.'}</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Pacientes;
