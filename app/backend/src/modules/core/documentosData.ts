export interface DocumentoWorkflow {
  numero: number;
  codigo: string;
  documento: string;
  area: string;
  descricao: string;
  responsavel: string;
  tipoDocumento: string;
}

export const TODOS_DOCUMENTOS_69: DocumentoWorkflow[] = [
  {
    numero: 1,
    codigo: 'MAN-ASSIST',
    documento: 'Manual Assistencial',
    area: 'Enfermagem',
    descricao: "Documento institucional que estabelece diretrizes, estrutura organizacional, responsabilidades e funcionamento do sistema assistencial relacionado a 'Manual Assistencial'. Serve como referência principal para padronização de processos, governança clínica, integração multiprofissional e conformidade com normas regulatórias.",
    responsavel: 'Direção Clínica',
    tipoDocumento: 'Manual'
  },
  {
    numero: 2,
    codigo: 'MAN-GOV',
    documento: 'Manual de Governança',
    area: 'Governança',
    descricao: "Documento institucional que estabelece diretrizes, estrutura organizacional, responsabilidades e funcionamento do sistema assistencial relacionado a 'Manual de Governança'. Serve como referência principal para padronização de processos, governança clínica, integração multiprofissional e conformidade com normas regulatórias.",
    responsavel: 'Direção',
    tipoDocumento: 'Manual'
  },
  {
    numero: 3,
    codigo: 'MAP-ASSIST-001',
    documento: 'Mapa de Riscos Assistenciais',
    area: 'Assistencial',
    descricao: "Documento de gestão que apresenta visão estruturada do sistema relacionado a 'Mapa de Riscos Assistenciais', organizando processos, documentos, riscos assistenciais e fluxos operacionais para facilitar governança, auditoria e tomada de decisão.",
    responsavel: 'Comitê da Qualidade',
    tipoDocumento: 'Mapa'
  },
  // POPs Enfermagem (4 a 20)
  ...Array.from({ length: 17 }, (_, i) => {
    const num = i + 1;
    const codNum = num.toString().padStart(3, '0');
    return {
      numero: i + 4,
      codigo: `POP-ENF-${codNum}`,
      documento: `Procedimento Operacional Enfermagem ${codNum}`,
      area: 'Enfermagem',
      descricao: `Procedimento Operacional Padrão que define passo a passo como deve ser executada a atividade 'Procedimento Operacional Enfermagem ${codNum}' na rotina assistencial. Estabelece responsabilidades da equipe, critérios de execução, registros obrigatórios, integração com formulários e protocolos clínicos, garantindo segurança do paciente e padronização do cuidado.`,
      responsavel: 'RT Enfermagem',
      tipoDocumento: 'POP'
    };
  }),
  // Protocolos Assistenciais (21 a 40)
  ...Array.from({ length: 20 }, (_, i) => {
    const num = i + 1;
    const codNum = num.toString().padStart(3, '0');
    return {
      numero: i + 21,
      codigo: `PROT-ENF-${codNum}`,
      documento: `Protocolo Assistencial Enfermagem ${codNum}`,
      area: 'Enfermagem',
      descricao: `Protocolo clínico que orienta a tomada de decisão e a conduta da equipe diante da situação clínica 'Protocolo Assistencial Enfermagem ${codNum}'. Define critérios de identificação, avaliação do paciente, intervenções recomendadas, monitoramento e registros assistenciais necessários.`,
      responsavel: 'RT Enfermagem',
      tipoDocumento: 'Protocolo'
    };
  }),
  // Formulários Assistenciais (41 a 53)
  ...Array.from({ length: 13 }, (_, i) => {
    const num = i + 1;
    const codNum = num.toString().padStart(3, '0');
    return {
      numero: i + 41,
      codigo: `FORM-ENF-${codNum}`,
      documento: `Formulário Assistencial ${codNum}`,
      area: 'Enfermagem',
      descricao: `Documento estruturado utilizado para registro formal das informações relacionadas ao processo 'Formulário Assistencial ${codNum}'. Permite rastreabilidade das ações assistenciais, suporte à auditoria clínica, análise de indicadores e integração com prontuário do paciente.`,
      responsavel: 'Enfermagem',
      tipoDocumento: 'Formulário'
    };
  }),
  {
    numero: 54,
    codigo: 'CONT-INT',
    documento: 'Contrato de Internação',
    area: 'Administrativo',
    descricao: 'Documento contratual de internação do paciente',
    responsavel: 'Administrativo',
    tipoDocumento: 'Contrato'
  },
  {
    numero: 55,
    codigo: 'TERMO-ADM-001',
    documento: 'Termo de Confidencialidade do Colaborador',
    area: 'Gestão Administrativa / RH',
    descricao: 'Estabelece obrigação de sigilo sobre informações institucionais acessadas pelos colaboradores.',
    responsavel: 'Gestão Administrativa / RH',
    tipoDocumento: 'Termo'
  },
  {
    numero: 56,
    codigo: 'TERMO-ADM-002',
    documento: 'Termo de Responsabilidade sobre Informações de Pacientes (LGPD)',
    area: 'Gestão Administrativa / RH',
    descricao: 'Define responsabilidade dos colaboradores quanto ao uso e proteção de dados pessoais e sensíveis de pacientes.',
    responsavel: 'Gestão Administrativa / RH',
    tipoDocumento: 'Termo'
  },
  {
    numero: 57,
    codigo: 'TERMO-ADM-003',
    documento: 'Termo de Conduta Ética da Equipe',
    area: 'Gestão Administrativa / RH',
    descricao: 'Estabelece princípios de conduta profissional, respeito aos pacientes, equipe e normas institucionais.',
    responsavel: 'Gestão Administrativa / RH',
    tipoDocumento: 'Termo'
  },
  {
    numero: 58,
    codigo: 'POL-ADM-001',
    documento: 'Política de Confidencialidade Institucional',
    area: 'Gestão Administrativa / RH',
    descricao: 'Define diretrizes para proteção e uso adequado das informações institucionais da clínica.',
    responsavel: 'Gestão Administrativa / RH',
    tipoDocumento: 'Política'
  },
  {
    numero: 59,
    codigo: 'POL-ADM-002',
    documento: 'Política de Proteção de Dados (LGPD)',
    area: 'Gestão Administrativa / RH',
    descricao: 'Estabelece diretrizes institucionais para tratamento e proteção de dados pessoais e sensíveis.',
    responsavel: 'Gestão Administrativa / RH',
    tipoDocumento: 'Política'
  },
  {
    numero: 60,
    codigo: 'POL-ADM-003',
    documento: 'Política de Conduta e Ética Institucional',
    area: 'Gestão Administrativa / RH',
    descricao: 'Define princípios éticos institucionais e diretrizes de comportamento organizacional.',
    responsavel: 'Gestão Administrativa / RH',
    tipoDocumento: 'Política'
  },
  {
    numero: 61,
    codigo: 'POL-ASSIST-001',
    documento: 'Política de Segurança do Paciente',
    area: 'Gestão Administrativa / RH',
    descricao: 'Diretrizes de segurança do paciente',
    responsavel: 'Gestão Administrativa / RH',
    tipoDocumento: 'Política'
  },
  {
    numero: 62,
    codigo: 'POL-ASSIST-002',
    documento: 'Política de Gestão de Riscos Assistenciais',
    area: 'Gestão Administrativa / RH',
    descricao: 'Gestão e mitigação de riscos assistenciais',
    responsavel: 'Gestão Administrativa / RH',
    tipoDocumento: 'Política'
  },
  {
    numero: 63,
    codigo: 'POL-ASSIST-003',
    documento: 'Política de Notificação de Eventos Adversos',
    area: 'Gestão Administrativa / RH',
    descricao: 'Notificação e análise de incidentes assistenciais',
    responsavel: 'Gestão Administrativa / RH',
    tipoDocumento: 'Política'
  },
  {
    numero: 64,
    codigo: 'MAN-GOV-001',
    documento: 'Manual de Governança Institucional',
    area: 'Gestão Administrativa / RH',
    descricao: "Documento institucional que estabelece diretrizes, estrutura organizacional, responsabilidades e funcionamento do sistema assistencial relacionado a 'Manual de Governança Institucional'. Serve como referência principal para padronização de processos, governança clínica, integração multiprofissional e conformidade com normas regulatórias.",
    responsavel: 'Gestão Administrativa / RH',
    tipoDocumento: 'Manual'
  },
  {
    numero: 65,
    codigo: 'POP-ENF-TRE-001',
    documento: 'Programa de Educação Continuada da Enfermagem',
    area: 'Enfermagem',
    descricao: 'Define a política institucional de capacitação e educação continuada da equipe de enfermagem.',
    responsavel: 'RT Enfermagem',
    tipoDocumento: 'POP'
  },
  {
    numero: 66,
    codigo: 'DOC-ENF-TRE-001',
    documento: 'Matriz Institucional de Treinamentos da Enfermagem',
    area: 'Enfermagem',
    descricao: 'Matriz oficial de treinamentos obrigatórios da equipe de enfermagem e suas periodicidades.',
    responsavel: 'RT Enfermagem',
    tipoDocumento: 'Documento'
  },
  {
    numero: 67,
    codigo: 'PLAN-ENF-TRE-001',
    documento: 'Plano Anual de Treinamentos da Enfermagem',
    area: 'Enfermagem',
    descricao: 'Planejamento anual dos treinamentos definidos na matriz institucional de capacitação.',
    responsavel: 'RT Enfermagem',
    tipoDocumento: 'Plano'
  },
  {
    numero: 68,
    codigo: 'FORM-ENF-TRE-001',
    documento: 'Registro de Treinamento da Enfermagem',
    area: 'Enfermagem',
    descricao: 'Formulário de registro institucional dos treinamentos realizados com a equipe.',
    responsavel: 'Enfermeiro Responsável',
    tipoDocumento: 'Formulário'
  },
  {
    numero: 69,
    codigo: 'FORM-ENF-INT-001',
    documento: 'Checklist de Integração da Enfermagem',
    area: 'Enfermagem',
    descricao: 'Checklist utilizado para registrar o treinamento inicial e integração de novos profissionais.',
    responsavel: 'RT Enfermagem',
    tipoDocumento: 'Formulário'
  }
];
