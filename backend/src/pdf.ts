// PDF embutido — gera PDF REAL a partir de HTML usando o Chrome headless que a
// VPS da Alfaia já tem instalado. Zero dependência (pdfkit/puppeteer NÃO existem
// no node_modules compartilhado — não instale nada).
//
// USO (numa rota sua):
//   import { htmlParaPdf } from './pdf';
//   app.get('/api/relatorios/vendas.pdf', async (_req, res) => {
//     const html = `<!doctype html><meta charset="utf-8"><h1>Relatório</h1>…`;
//     const pdf = await htmlParaPdf(html);
//     res.type('application/pdf').send(pdf);
//   });
// Dica: estilize o HTML com CSS inline/<style> (o Chrome imprime fiel). Use
// @page { size: A4; margin: 18mm } pra controlar página/margem.
//
// Fila de 1 por processo: exports são esporádicos e o Chrome é pesado — nunca
// rode vários em paralelo. Sem Chrome no ambiente (export/Docker), o erro é
// claro ("PDF indisponível") em vez de quebrar o app.
import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CANDIDATOS = [
  process.env.CHROME_BIN || '',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

let fila: Promise<unknown> = Promise.resolve();

export function htmlParaPdf(html: string): Promise<Buffer> {
  const trabalho = fila.then(() => gerar(html));
  // A fila nunca "quebra": erro de um export não trava o próximo.
  fila = trabalho.catch(() => undefined);
  return trabalho;
}

function gerar(html: string): Promise<Buffer> {
  return new Promise((resolver, rejeitar) => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'pdf-'));
    const pagina = path.join(dir, `p-${randomBytes(4).toString('hex')}.html`);
    const saida = path.join(dir, 'saida.pdf');
    const limpar = () => {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        /* tmp é limpo pelo sistema de qualquer forma */
      }
    };
    try {
      writeFileSync(pagina, html);
    } catch (e) {
      limpar();
      rejeitar(new Error('não foi possível preparar o PDF'));
      return;
    }
    tentar(0);

    function tentar(i: number): void {
      if (i >= CANDIDATOS.length) {
        limpar();
        rejeitar(new Error('PDF indisponível neste ambiente (navegador não encontrado)'));
        return;
      }
      execFile(
        CANDIDATOS[i],
        [
          '--headless=new',
          '--no-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          // o app roda como usuário SEM home (alfaiapps): sem estas flags o
          // crashpad tenta escrever em /home e o Chrome MORRE sem gerar o PDF
          // (bug pego pelo gate E2E no pernambuco-drive). Tudo aponta pro tmp.
          '--no-first-run',
          '--disable-crash-reporter',
          `--crash-dumps-dir=${dir}`,
          `--user-data-dir=${path.join(dir, 'perfil')}`,
          '--no-pdf-header-footer',
          `--print-to-pdf=${saida}`,
          `file://${pagina}`,
        ],
        {
          timeout: 30000,
          env: { ...process.env, HOME: dir, XDG_CONFIG_HOME: dir, XDG_CACHE_HOME: dir },
        },
        (err) => {
          if (err) {
            // binário ausente → tenta o próximo candidato; outro erro → falha.
            if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
              tentar(i + 1);
              return;
            }
            limpar();
            rejeitar(new Error('falha ao gerar o PDF'));
            return;
          }
          try {
            const buf = readFileSync(saida);
            limpar();
            if (buf.length < 100) {
              rejeitar(new Error('PDF vazio'));
              return;
            }
            resolver(buf);
          } catch {
            limpar();
            rejeitar(new Error('falha ao ler o PDF gerado'));
          }
        },
      );
    }
  });
}
