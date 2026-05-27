import { User } from './types';

export const MINISTERIOS_OPTIONS: string[] = [
    'Acolhimento',
    'Áudio',
    'Bazar',
    'Boas-vindas',
    'Capacitação Destino',
    'Casais',
    'Coffee',
    'Cenografia',
    'Conectados',
    'Cozinha',
    'Dança',
    'Diaconato',
    'Eventos',
    'Homens',
    'Impulso',
    'Intercessão',
    'Invoxx',
    'Kids',
    'Louvor',
    'Mídias/Foto',
    'Mulheres',
    'Produção',
    'Salas de Cura',
    'Segurança',
    'Seja Luz',
    'Teatro',
    'UV',
    'Vídeo',
];

export const INITIAL_USERS: User[] = [
    { id: 1, name: 'Pastora Lucia', role: 'ADM', email: 'lucia@alianca.com', password: '123', pastorId: null, contato: '11999990000', ministerio: 'Pastoral', atividade: 5, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Concluído', sexo: 'F', nascimento: '1970-05-20' },
    { id: 2, name: 'Pastor Guilherme Haro', role: 'PASTOR', email: 'guilherme@alianca.com', password: '123', pastorId: 1, contato: '11999990001', ministerio: 'Pastoral', atividade: 5, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Concluído', sexo: 'M', nascimento: '1985-03-15' },
    { id: 3, name: 'Pastora Raquel Thomazi', role: 'PASTOR', email: 'raquel@alianca.com', password: '123', pastorId: 1, contato: '11999990002', ministerio: 'Pastoral', atividade: 5, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Concluído', sexo: 'F', nascimento: '1988-07-10' },
    { id: 4, name: 'Leonardo Macedo', role: 'DISCIPULADOR', email: 'leonardo@alianca.com', password: '123', pastorId: 2, contato: '11999990003', ministerio: 'Liderança', atividade: 5, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Concluído', sexo: 'M', nascimento: '1995-02-28' },
    { id: 5, name: 'Guilherme Carvalho', role: 'DISCIPULADOR', email: 'g.carvalho@alianca.com', password: '123', pastorId: 2, contato: '11999990004', ministerio: 'Liderança', atividade: 5, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Concluído', sexo: 'M', nascimento: '1998-11-12' },
    { id: 6, name: 'Agleston Teruo', role: 'DISCIPULADOR', email: 'agleston@alianca.com', password: '123', pastorId: 2, contato: '11999990005', ministerio: 'Liderança', atividade: 5, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Concluído', sexo: 'M', nascimento: '1992-06-30' },
    { id: 7, name: 'Bia Dias', role: 'DISCIPULADOR', email: 'bia.dias@alianca.com', password: '123', pastorId: 3, contato: '11999990006', ministerio: 'Liderança', atividade: 5, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Concluído', sexo: 'F', nascimento: '2000-01-15' },
    { id: 8, name: 'Juba', role: 'DISCIPULADOR', email: 'juba@alianca.com', password: '123', pastorId: 3, contato: '11999990007', ministerio: 'Liderança', atividade: 5, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Concluído', sexo: 'F', nascimento: '1999-09-09' },
    { id: 9, name: 'Lays', role: 'DISCIPULADOR', email: 'lays@alianca.com', password: '123', pastorId: 3, contato: '11999990008', ministerio: 'Liderança', atividade: 5, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Concluído', sexo: 'F', nascimento: '2001-04-20' },
    { id: 10, name: 'Giovanna Thomazi', role: 'DISCIPULADOR', email: 'giovanna@alianca.com', password: '123', pastorId: 3, contato: '11999990009', ministerio: 'Liderança', atividade: 5, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Concluído', sexo: 'F', nascimento: '2002-12-05' },
];

export const INITIAL_DISCIPLES: User[] = [
    // G12 Diretos (Pastor Guilherme)
    { id: 101, role: 'DISCIPULO', name: 'Pedro Castanho', discipuladorId: 2, ministerio: 'Louvor', atividade: 5, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Concluído', sexo: 'M', nascimento: '1990-05-15', email: 'pedro@email.com' },
    { id: 102, role: 'DISCIPULO', name: 'Otávio Santana', discipuladorId: 2, ministerio: 'Mídia', atividade: 4, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Nível 3', sexo: 'M', nascimento: '1994-08-20', email: 'otavio@email.com' },
    { id: 103, role: 'DISCIPULO', name: 'Lucas Stocco', discipuladorId: 2, ministerio: 'Recepção', atividade: 4, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Nível 2', sexo: 'M', nascimento: '2005-02-10', email: 'lucas@email.com' },
    { id: 104, role: 'DISCIPULO', name: 'Eduardo Pinheiro', discipuladorId: 2, ministerio: 'Jovens', atividade: 5, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Concluído', sexo: 'M', nascimento: '1997-03-01', email: 'eduardo@email.com' },
    { id: 105, role: 'DISCIPULO', name: 'Davi Fogaça', discipuladorId: 2, ministerio: 'Louvor', atividade: 3, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Nível 1', sexo: 'M', nascimento: '2008-06-15', email: 'davi@email.com' },
    { id: 106, role: 'DISCIPULO', name: 'Carlos Dias', discipuladorId: 2, ministerio: 'Consolidação', atividade: 4, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Concluído', sexo: 'M', nascimento: '1980-11-11', email: 'carlos@email.com' },
    { id: 107, role: 'DISCIPULO', name: 'Diogo Bento', discipuladorId: 2, ministerio: 'Teatro', atividade: 4, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Nível 2', sexo: 'M', nascimento: '1996-01-25', email: 'diogo@email.com' },
    { id: 108, role: 'DISCIPULO', name: 'Gabriel Chamacho', discipuladorId: 2, ministerio: 'Mídia', atividade: 5, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Nível 3', sexo: 'M', nascimento: '1999-07-07', email: 'gabriel@email.com' },
    { id: 109, role: 'DISCIPULO', name: 'Rafael Melo', discipuladorId: 2, ministerio: 'Jovens', atividade: 3, batizado: true, g12: true, universidadeDaVida: 'Cursando', capacitacaoDestino: 'Não Iniciou', sexo: 'M', nascimento: '2004-10-30', email: 'rafael@email.com' },
    { id: 110, role: 'DISCIPULO', name: 'Willian Diana', discipuladorId: 2, ministerio: 'Louvor', atividade: 5, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Concluído', sexo: 'M', nascimento: '1993-04-12', email: 'willian@email.com' },
    
    // Célula Leonardo Macedo (ID 4)
    { id: 201, role: 'DISCIPULO', name: 'Luis Furlan', discipuladorId: 4, ministerio: 'Nenhum', atividade: 3, batizado: true, g12: false, universidadeDaVida: 'Cursando', capacitacaoDestino: 'Não Iniciou', sexo: 'M', nascimento: '1995-05-05', email: 'luis@email.com' },
    
    // Célula Guilherme Carvalho (ID 5)
    { id: 301, role: 'DISCIPULO', name: 'Guilherme Diana', discipuladorId: 5, ministerio: 'Nenhum', atividade: 3, batizado: false, g12: false, universidadeDaVida: 'Não', capacitacaoDestino: 'Não Iniciou', sexo: 'M', nascimento: '2012-01-01', email: 'guilhermed@email.com' },
    { id: 302, role: 'DISCIPULO', name: 'Alexander Machado', discipuladorId: 5, ministerio: 'Nenhum', atividade: 4, batizado: true, g12: false, universidadeDaVida: 'Sim', capacitacaoDestino: 'Nível 1', sexo: 'M', nascimento: '1990-12-12', email: 'alexander@email.com' },
    { id: 303, role: 'DISCIPULO', name: 'Matheus Henrique', discipuladorId: 5, ministerio: 'Nenhum', atividade: 3, batizado: false, g12: false, universidadeDaVida: 'Não', capacitacaoDestino: 'Não Iniciou', sexo: 'M', nascimento: '2006-08-08', email: 'matheus@email.com' },
    { id: 304, role: 'DISCIPULO', name: 'Gustavo Cintra', discipuladorId: 5, ministerio: 'Nenhum', atividade: 4, batizado: true, g12: false, universidadeDaVida: 'Sim', capacitacaoDestino: 'Nível 1', sexo: 'M', nascimento: '1998-03-03', email: 'gustavo@email.com' },
    { id: 305, role: 'DISCIPULO', name: 'Carlos (Carlinhos)', discipuladorId: 5, ministerio: 'Nenhum', atividade: 5, batizado: true, g12: false, universidadeDaVida: 'Sim', capacitacaoDestino: 'Nível 2', sexo: 'M', nascimento: '2014-06-01', email: 'carlinhos@email.com' },
    { id: 306, role: 'DISCIPULO', name: 'Caio', discipuladorId: 5, ministerio: 'Nenhum', atividade: 3, batizado: false, g12: false, universidadeDaVida: 'Não', capacitacaoDestino: 'Não Iniciou', sexo: 'M', nascimento: '2000-09-09', email: 'caio@email.com' },

    // Célula Agleston Teruo (ID 6) - Novos
    { id: 401, role: 'DISCIPULO', name: 'Kaique Malta', discipuladorId: 6, ministerio: 'Nenhum', atividade: 3, batizado: false, g12: false, universidadeDaVida: 'Não', capacitacaoDestino: 'Não Iniciou', sexo: 'M', nascimento: '2002-03-10', email: 'kaique@email.com' },
    { id: 402, role: 'DISCIPULO', name: 'Lucas Antoniassi', discipuladorId: 6, ministerio: 'Nenhum', atividade: 4, batizado: true, g12: false, universidadeDaVida: 'Sim', capacitacaoDestino: 'Nível 1', sexo: 'M', nascimento: '1998-07-22', email: 'lucas2@email.com' },
    { id: 403, role: 'DISCIPULO', name: 'Arthur', discipuladorId: 6, ministerio: 'Nenhum', atividade: 3, batizado: false, g12: false, universidadeDaVida: 'Não', capacitacaoDestino: 'Não Iniciou', sexo: 'M', nascimento: '2005-11-05', email: 'arthur@email.com' },
    
    // REDE RAQUEL (Diretos - ID 3)
    { id: 501, role: 'DISCIPULO', name: 'Celine Mocarzel', discipuladorId: 3, ministerio: 'Dança', atividade: 5, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Concluído', sexo: 'F', nascimento: '1995-02-15', email: 'celine@email.com' },
    { id: 502, role: 'DISCIPULO', name: 'Cristine', discipuladorId: 3, ministerio: 'Intercessão', atividade: 4, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Nível 3', sexo: 'F', nascimento: '1985-05-20', email: 'cristine@email.com' },
    { id: 503, role: 'DISCIPULO', name: 'Leticia Dias', discipuladorId: 3, ministerio: 'Infantil', atividade: 5, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Concluído', sexo: 'F', nascimento: '1992-11-11', email: 'leticia@email.com' },
    { id: 504, role: 'DISCIPULO', name: 'Priscilla', discipuladorId: 3, ministerio: 'Recepção', atividade: 4, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Nível 2', sexo: 'F', nascimento: '1998-08-08', email: 'priscilla@email.com' },
    { id: 505, role: 'DISCIPULO', name: 'Bia Galindo', discipuladorId: 3, ministerio: 'Mídia', atividade: 5, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Concluído', sexo: 'F', nascimento: '2000-03-30', email: 'bia@email.com' },
    // Novos Diretos Raquel
    { id: 506, role: 'DISCIPULO', name: 'Coti', discipuladorId: 3, ministerio: 'Mulheres', atividade: 4, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Concluído', sexo: 'F', nascimento: '1990-05-15', email: 'coti@email.com' },
    { id: 507, role: 'DISCIPULO', name: 'Ana Julia Dias', discipuladorId: 3, ministerio: 'Dança', atividade: 5, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Nível 2', sexo: 'F', nascimento: '2003-09-20', email: 'ana@email.com' },
    { id: 508, role: 'DISCIPULO', name: 'Natalia Santana', discipuladorId: 3, ministerio: 'Intercessão', atividade: 4, batizado: true, g12: true, universidadeDaVida: 'Sim', capacitacaoDestino: 'Nível 1', sexo: 'F', nascimento: '1995-12-12', email: 'natalia@email.com' },
    
    // Célula Bia Dias (ID 7)
    { id: 601, role: 'DISCIPULO', name: 'Anny Lagos', discipuladorId: 7, ministerio: 'Nenhum', atividade: 4, batizado: true, g12: false, universidadeDaVida: 'Sim', capacitacaoDestino: 'Nível 1', sexo: 'F', nascimento: '2005-01-10', email: 'anny@email.com' },
    { id: 602, role: 'DISCIPULO', name: 'Daniella Rolim', discipuladorId: 7, ministerio: 'Nenhum', atividade: 3, batizado: true, g12: false, universidadeDaVida: 'Cursando', capacitacaoDestino: 'Não Iniciou', sexo: 'F', nascimento: '2007-07-07', email: 'daniella@email.com' },
    { id: 603, role: 'DISCIPULO', name: 'Laura Rolim', discipuladorId: 7, ministerio: 'Nenhum', atividade: 3, batizado: false, g12: false, universidadeDaVida: 'Não', capacitacaoDestino: 'Não Iniciou', sexo: 'F', nascimento: '2015-05-05', email: 'laura@email.com' },
    { id: 604, role: 'DISCIPULO', name: 'Duda Cintra', discipuladorId: 7, ministerio: 'Nenhum', atividade: 4, batizado: true, g12: false, universidadeDaVida: 'Sim', capacitacaoDestino: 'Nível 1', sexo: 'F', nascimento: '2006-02-14', email: 'duda@email.com' },
    { id: 605, role: 'DISCIPULO', name: 'Julia Oliveira', discipuladorId: 7, ministerio: 'Nenhum', atividade: 3, batizado: true, g12: false, universidadeDaVida: 'Cursando', capacitacaoDestino: 'Não Iniciou', sexo: 'F', nascimento: '2004-08-30', email: 'julia@email.com' },
    { id: 606, role: 'DISCIPULO', name: 'Duda Britto', discipuladorId: 7, ministerio: 'Nenhum', atividade: 3, batizado: false, g12: false, universidadeDaVida: 'Não', capacitacaoDestino: 'Não Iniciou', sexo: 'F', nascimento: '2005-06-18', email: 'duda2@email.com' },
    { id: 607, role: 'DISCIPULO', name: 'Rafaela Carvalho', discipuladorId: 7, ministerio: 'Nenhum', atividade: 4, batizado: true, g12: false, universidadeDaVida: 'Sim', capacitacaoDestino: 'Nível 1', sexo: 'F', nascimento: '2007-01-25', email: 'rafaela@email.com' },

    // Célula Juba (ID 8)
    { id: 701, role: 'DISCIPULO', name: 'Rebeca', discipuladorId: 8, ministerio: 'Nenhum', atividade: 3, batizado: true, g12: false, universidadeDaVida: 'Sim', capacitacaoDestino: 'Não Iniciou', sexo: 'F', nascimento: '2001-11-11', email: 'rebeca@email.com' },

    // Célula Lays (ID 9)
    { id: 801, role: 'DISCIPULO', name: 'Bruna', discipuladorId: 9, ministerio: 'Nenhum', atividade: 4, batizado: true, g12: false, universidadeDaVida: 'Sim', capacitacaoDestino: 'Nível 1', sexo: 'F', nascimento: '1999-09-19', email: 'bruna@email.com' },
    { id: 802, role: 'DISCIPULO', name: 'Yandra', discipuladorId: 9, ministerio: 'Nenhum', atividade: 4, batizado: true, g12: false, universidadeDaVida: 'Sim', capacitacaoDestino: 'Nível 1', sexo: 'F', nascimento: '1999-03-03', email: 'yandra@email.com' },
    { id: 803, role: 'DISCIPULO', name: 'Dani', discipuladorId: 9, ministerio: 'Nenhum', atividade: 3, batizado: true, g12: false, universidadeDaVida: 'Cursando', capacitacaoDestino: 'Não Iniciou', sexo: 'F', nascimento: '1997-07-07', email: 'dani2@email.com' },
    { id: 804, role: 'DISCIPULO', name: 'Cris', discipuladorId: 9, ministerio: 'Nenhum', atividade: 4, batizado: true, g12: false, universidadeDaVida: 'Sim', capacitacaoDestino: 'Nível 2', sexo: 'F', nascimento: '1988-04-20', email: 'cris@email.com' },
    { id: 805, role: 'DISCIPULO', name: 'Sarah', discipuladorId: 9, ministerio: 'Nenhum', atividade: 3, batizado: false, g12: false, universidadeDaVida: 'Não', capacitacaoDestino: 'Não Iniciou', sexo: 'F', nascimento: '2000-10-10', email: 'sarah@email.com' },

    // Célula Giovanna Thomazi (ID 10)
    { id: 901, role: 'DISCIPULO', name: 'Fabiana Ferrari', discipuladorId: 10, ministerio: 'Nenhum', atividade: 4, batizado: true, g12: false, universidadeDaVida: 'Sim', capacitacaoDestino: 'Nível 1', sexo: 'F', nascimento: '1982-02-22', email: 'fabiana@email.com' },
    { id: 902, role: 'DISCIPULO', name: 'Nadine', discipuladorId: 10, ministerio: 'Nenhum', atividade: 4, batizado: true, g12: false, universidadeDaVida: 'Sim', capacitacaoDestino: 'Nível 1', sexo: 'F', nascimento: '1996-09-09', email: 'nadine@email.com' },
    { id: 903, role: 'DISCIPULO', name: 'Giulie', discipuladorId: 10, ministerio: 'Nenhum', atividade: 4, batizado: true, g12: false, universidadeDaVida: 'Sim', capacitacaoDestino: 'Nível 1', sexo: 'F', nascimento: '2002-12-25', email: 'giulie@email.com' },
];