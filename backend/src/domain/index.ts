// CAMADA DE DOMÍNIO — Re-exportações para navegabilidade por camadas.
// Os arquivos físicos estão em backend/src/. Este barrel torna a camada
// visível sem mover arquivos (backward compatible com todos os imports existentes).
//
// Responsabilidade: regras de negócio centrais, criptografia de dados (auth),
// integrações com serviços externos.
export * from '../auth';
export * from '../integracoes';
export * from '../integracoes_locais';
export * from '../dados_rede_apoio';
