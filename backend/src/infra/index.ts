// CAMADA DE INFRAESTRUTURA — Re-exportações para navegabilidade por camadas.
// Os arquivos físicos estão em backend/src/. Este barrel torna a camada
// visível sem mover arquivos (backward compatible com todos os imports existentes).
//
// Responsabilidade: conexão com banco, observabilidade e health checks.
export { criarPool } from '../db';
export { estadoDeSaude, registrarInicializacao, inicializando, falhasDeInicializacao } from '../saude';
export { inicializarRegistros, registrarTelemetria, registrarLog } from '../registros';
