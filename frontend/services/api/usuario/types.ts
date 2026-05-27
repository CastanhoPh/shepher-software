export interface UpdateSenhaRequest {
  senhaAtual: string;
  novaSenha: string;
}

export interface PromoverUsuarioRequest {
  novaFuncao: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ImportacaoExcelErro {
  linha: number;
  motivo: string;
}

export interface ImportacaoExcelResponse {
  totalLinhas: number;
  criados: number;
  erros: ImportacaoExcelErro[];
}
