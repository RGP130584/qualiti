export interface OmocCargo {
  id?: number;
  tenant_id: string;
  nome: string;
  descricao?: string;
  setor: string;
  limite_vagas: number;
  data_criacao?: string;
}

export interface OmocOcupacao {
  id?: number;
  tenant_id: string;
  usuario_id: number;
  cargo_id: number;
  data_inicio?: string;
  data_fim?: string;
  
  // Joins opcionais para exibição
  usuario_nome?: string;
  usuario_email?: string;
  cargo_nome?: string;
  cargo_setor?: string;
}

export interface OmocReporte {
  id?: number;
  tenant_id: string;
  cargo_subordinado_id: number;
  cargo_superior_id: number;
  tipo?: string; // 'direto', 'matricial'
  
  // Joins opcionais para exibição
  cargo_subordinado_nome?: string;
  cargo_superior_nome?: string;
}

export interface OmocSubstituto {
  id?: number;
  tenant_id: string;
  usuario_titular_id: number;
  usuario_substituto_id: number;
  data_inicio: string;
  data_fim: string;
  status?: string; // 'PENDENTE', 'ATIVA', 'INATIVA'
  data_criacao?: string;

  // Joins opcionais para exibição
  usuario_titular_nome?: string;
  usuario_substituto_nome?: string;
}
