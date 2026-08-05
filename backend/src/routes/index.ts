// CAMADA DE ROTAS — Re-exportações para navegabilidade por camadas.
// Os arquivos físicos estão em backend/src/. Este barrel torna a camada
// visível sem mover arquivos (backward compatible com todos os imports existentes).
//
// Responsabilidade: endpoints da API REST, controle de acesso e orquestração.
export * from '../rotas';
export * from '../auth_rotas';
