// EXPORTAR embutido — planilha (CSV que o Excel abre direto) e download de
// arquivos. Zero dependência (exceljs/xlsx NÃO existem — não instale nada).
//
// PLANILHA (Excel): exportarPlanilha('vendas', ['Data','Cliente','Total'], linhas)
//   → baixa vendas.csv com BOM UTF-8 e separador ';' (padrão do Excel pt-BR:
//   acentos certos e colunas separadas, sem passo de importação).
// PDF: quem gera é o BACKEND (backend/src/pdf.ts, htmlParaPdf) numa rota sua —
//   aqui use baixar('/api/relatorios/vendas.pdf', 'Relatório de vendas.pdf').

function celula(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  // aspas quando tem separador/aspas/quebra; aspas internas dobradas (RFC 4180)
  return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function exportarPlanilha(
  nomeArquivo: string,
  cabecalho: string[],
  linhas: Array<Array<string | number | null | undefined>>,
): void {
  const corpo = [cabecalho, ...linhas].map((l) => l.map(celula).join(';')).join('\r\n');
  // BOM → o Excel reconhece UTF-8 (acentos certos, sem tela de importação).
  const blob = new Blob(['﻿' + corpo], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const nome = nomeArquivo.toLowerCase().endsWith('.csv') ? nomeArquivo : nomeArquivo + '.csv';
  dispararDownload(url, nome);
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

// Baixa uma URL (ex.: um PDF gerado pelo backend, ou /api/arquivos/x?baixar=1).
export function baixar(url: string, nomeArquivo?: string): void {
  dispararDownload(url, nomeArquivo || '');
}

function dispararDownload(url: string, nome: string): void {
  const a = document.createElement('a');
  a.href = url;
  if (nome) a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
