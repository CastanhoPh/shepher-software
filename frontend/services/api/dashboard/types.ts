export interface DashboardEstatisticas {
  totais: {
    discipulos: number;
    g12_diretos: number;
    celula: number;
    rede_completa: number;
  };
  espirituais: {
    batizados: number;
    universidade_vida: number;
    capacitacao_destino_1: number;
    capacitacao_destino_2: number;
    capacitacao_destino_3: number;
  };
  demograficos: {
    homens: number;
    mulheres: number;
    faixas_etarias: Record<string, number>;
  };
}

export interface HierarquiaNode {
  id: number;
  nome: string;
  role: string;
  email: string;
  children?: HierarquiaNode[];
}
