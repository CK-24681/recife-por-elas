// PUBLICAÇÃO ATÔMICA DO FRONTEND.
//
// O problema que isto resolve, visto em produção: o `vite build` APAGA a pasta
// `dist` antes de escrever a nova versão. Enquanto ele constrói — dezenas de
// segundos — a aplicação some do ar e o visitante recebe um "403 Forbidden" cru
// do Nginx (a pasta existe, o index.html ainda não, e listagem de diretório é
// proibida). E se o build FALHA no meio, a pasta fica vazia PARA SEMPRE: a
// aplicação de alguém morre por causa de um erro de compilação, e só volta
// quando alguém reconstrói.
//
// Aqui o build sai em `dist.novo` e só entra no lugar quando terminou inteiro.
// A troca são duas chamadas de rename (microssegundos), contra os ~30 segundos
// de antes. E build que falha não chega aqui: a versão anterior continua no ar.
//
// A versão trocada fica em `dist.antigo` — serve pra conferir o que mudou e pra
// voltar atrás na mão se precisar.
import { existsSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const raiz = process.cwd();
const novo = join(raiz, 'dist.novo');
const atual = join(raiz, 'dist');
const antigo = join(raiz, 'dist.antigo');

// Um build sem index.html não é build. Publicá-lo derrubaria a aplicação com a
// mesma cara de 403 que este arquivo existe pra evitar.
if (!existsSync(join(novo, 'index.html'))) {
  console.error('publicar: dist.novo não tem index.html — a versão anterior continua no ar.');
  process.exit(1);
}

rmSync(antigo, { recursive: true, force: true });
if (existsSync(atual)) {
  renameSync(atual, antigo);
}
renameSync(novo, atual);
console.log('publicar: nova versão no ar (a anterior ficou em dist.antigo).');
