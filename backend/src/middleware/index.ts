// CAMADA DE MIDDLEWARE — Re-exportações para navegabilidade por camadas.
// Os arquivos físicos estão em backend/src/. Este barrel torna a camada
// visível sem mover arquivos (backward compatible com todos os imports existentes).
//
// Responsabilidade: upload de mídia, processamento de arquivos e exportação de PDF.
export * from '../uploads';
export * from '../arquivos';
export * from '../pdf';
