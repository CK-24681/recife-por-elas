// SAÚDE DE VERDADE — o /api/health precisa responder "esta app está pronta pra
// usar", não "o processo está vivo".
//
// O que aconteceu sem isto: a criação de uma tabela falhou no boot (uma chave
// estrangeira TEXT apontando pra um id UUID). O `.catch(console.error)` engoliu
// o erro, o Express subiu normalmente, o /api/health devolveu 200, a plataforma
// deu a fase por publicada — e a app foi pro ar com a tela principal quebrada.
// O dono descobriu usando.
//
// Erro engolido mente. Aqui ele passa a ter consequência: enquanto uma
// inicialização essencial estiver falhada, o health responde 503 com o motivo, e
// é isso que a plataforma checa depois de todo deploy.

type Falha = { nome: string; erro: string; em: string };

const falhas: Falha[] = [];
let pendentes = 0;

/**
 * Registra uma inicialização ESSENCIAL (criar tabelas, migrar, abrir conexão).
 *
 * Use em tudo que, se falhar, deixa a app inútil:
 *   registrarInicializacao('produtos', inicializarProdutos(pool));
 *
 * Não engula o erro com .catch: passe a promise inteira pra cá.
 */
export function registrarInicializacao(nome: string, p: Promise<unknown>): Promise<void> {
  pendentes++;
  return p.then(
    () => {
      pendentes--;
    },
    (e: unknown) => {
      pendentes--;
      const erro = e instanceof Error ? e.message : String(e);
      falhas.push({ nome, erro, em: new Date().toISOString() });
      // Log alto: é a primeira coisa que alguém procura no journalctl.
      console.error(`INICIALIZAÇÃO FALHOU [${nome}]: ${erro}`);
    },
  );
}

/** true enquanto alguma inicialização essencial ainda não terminou. */
export function inicializando(): boolean {
  return pendentes > 0;
}

/** As inicializações que falharam (vazio = tudo certo). */
export function falhasDeInicializacao(): Falha[] {
  return falhas;
}

/**
 * O corpo e o status do /api/health.
 *
 * 200 = pronta. 503 = subiu, mas quebrada (ou ainda subindo) — e diz o quê.
 * A plataforma trata qualquer coisa ≠ 200 como app não publicada, que é
 * exatamente o efeito desejado: a fase não passa com a app assim.
 */
export function estadoDeSaude(): { status: number; corpo: Record<string, unknown> } {
  if (falhas.length > 0) {
    return {
      status: 503,
      corpo: {
        status: 'erro',
        motivo: 'a aplicação subiu, mas uma inicialização essencial falhou',
        falhas,
      },
    };
  }
  if (pendentes > 0) {
    return { status: 503, corpo: { status: 'iniciando' } };
  }
  return { status: 200, corpo: { status: 'ok' } };
}
