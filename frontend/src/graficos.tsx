// GRÁFICOS — kit de visualização da Alfaia, sem nenhuma dependência.
//
// Por que existe: o template tem só react e react-dom, e o agente é proibido de
// instalar pacote. Sem este arquivo, um pedido de "dashboard com gráficos" acaba
// de um jeito ruim — ou o agente importa uma biblioteca que não existe e o build
// quebra, ou ele monta barras com <div> e altura em porcentagem, que é o que se
// vê quando ninguém pensou no assunto.
//
// Tudo aqui é SVG. Não pesa no bundle, respeita a Content-Security-Policy (que
// proíbe CDN), imprime bem e escala em qualquer tela.
//
// ——— AS REGRAS QUE ESTE ARQUIVO SEGUE ———
//
// 1. COR TEM FUNÇÃO, NÃO É ENFEITE. Série única usa a cor da marca do cliente —
//    com uma cor só não existe confusão possível. Várias séries usam a paleta
//    CATEGÓRICA abaixo, na ordem fixa: ela foi validada para daltonismo (a
//    separação mínima entre cores vizinhas passa nos três tipos), e a cor da
//    marca não tem como oferecer isso. Cor por identidade é acessibilidade, não
//    gosto.
//
// 2. NUNCA DOIS EIXOS Y. Duas medidas de escalas diferentes viram dois
//    gráficos. Eixo duplo é o erro mais comum de dashboard: ele deixa o autor
//    escolher onde as linhas se cruzam.
//
// 3. IDENTIDADE NUNCA É SÓ COR. Com duas ou mais séries há sempre legenda, e a
//    tabela de dados fica a um clique — quem não distingue as cores continua
//    lendo o gráfico.
//
// 4. O DADO É A ÚNICA COISA QUE PODE SER FORTE. Grade fina e cinza, sem
//    tracejado; texto em tom de texto, nunca na cor da série; rótulo só onde
//    ajuda (a ponta, o extremo), nunca em cima de todo ponto.
import { useId, useMemo, useState } from 'react';

// ——— PALETA CATEGÓRICA ———
// Ordem FIXA e validada: as cores vizinhas se distinguem em protanopia,
// deuteranopia e tritanopia. Nunca embaralhe nem cicle — a 9ª série não ganha
// uma cor nova, ela vira "Outros".
export const CORES_SERIE = [
  '#2a78d6', // azul
  '#eb6834', // laranja
  '#1baf7a', // água
  '#eda100', // amarelo
  '#e87ba4', // magenta
  '#008300', // verde
  '#4a3aa7', // violeta
  '#e34948', // vermelho
] as const;

// Cores de ESTADO. Reservadas: nunca viram "série 4".
export const CORES_ESTADO = {
  bom: '#0ca30c',
  atencao: '#fab219',
  serio: '#ec835a',
  critico: '#d03b3b',
} as const;

const TINTA_FRACA = 'var(--muted, #5f5e5a)';
const GRADE = 'var(--border, rgba(12,12,17,.1))';
const SUPERFICIE = 'var(--surface, #fff)';
const MARCA = 'var(--brand-1, #2a78d6)';

export type Ponto = { rotulo: string; valor: number };
export type Serie = { nome: string; pontos: Ponto[]; cor?: string };

/** Cor da série: uma só usa a marca do cliente; várias usam a paleta validada. */
function corDaSerie(series: Serie[], i: number): string {
  if (series[i].cor) return series[i].cor as string;
  return series.length === 1 ? MARCA : CORES_SERIE[i % CORES_SERIE.length];
}

/** Números legíveis: 1.2 mil, 3,4 mi — eixo cheio de zeros não se lê. */
export function abreviar(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_000_000) return (n / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mi';
  if (a >= 1_000) return (n / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil';
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

export function dinheiro(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

/** Escala "bonita": o topo do eixo vira 100, 250, 500, 1000… e não 987. */
function tetoRedondo(max: number): number {
  if (max <= 0) return 1;
  const ordem = Math.pow(10, Math.floor(Math.log10(max)));
  for (const p of [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]) {
    if (max <= ordem * p) return ordem * p;
  }
  return ordem * 10;
}

// ————————————————————————————————————————————————————————————
// LEGENDA — obrigatória com 2+ séries. Com uma só, o título já diz o que é;
// uma caixa com um quadradinho repetiria o título e ocuparia espaço à toa.
// ————————————————————————————————————————————————————————————
function Legenda({ series }: { series: Serie[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="g-legenda">
      {series.map((s, i) => (
        <li key={s.nome}>
          <span className="g-chave" style={{ background: corDaSerie(series, i) }} aria-hidden="true" />
          {s.nome}
        </li>
      ))}
    </ul>
  );
}

// ————————————————————————————————————————————————————————————
// TABELA DOS DADOS — a via de acesso que nunca depende de cor. Fica fechada
// para não competir com o gráfico, mas existe sempre.
// ————————————————————————————————————————————————————————————
function TabelaDados({ series, formatar }: { series: Serie[]; formatar: (n: number) => string }) {
  const rotulos = series[0]?.pontos.map((p) => p.rotulo) ?? [];
  return (
    <details className="g-tabela">
      <summary>Ver os números</summary>
      <div className="g-tabela-rolagem">
        <table>
          <thead>
            <tr>
              <th scope="col"> </th>
              {series.map((s) => (
                <th key={s.nome} scope="col">{s.nome}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rotulos.map((r, li) => (
              <tr key={r}>
                <th scope="row">{r}</th>
                {series.map((s) => (
                  <td key={s.nome}>{formatar(s.pontos[li]?.valor ?? 0)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

type PropsComuns = {
  titulo: string;
  descricao?: string;
  /** Como escrever os valores (eixo, rótulo e dica). Padrão: número abreviado. */
  formatar?: (n: number) => string;
  altura?: number;
};

// ————————————————————————————————————————————————————————————
// LINHA / ÁREA — para MUDANÇA AO LONGO DO TEMPO.
// Traço de 2px, área a 10% (um véu, nunca um bloco), ponto na ponta com anel da
// cor do fundo, e mira que segue o mouse com a dica dos valores.
// ————————————————————————————————————————————————————————————
export function GraficoLinha({
  titulo,
  descricao,
  series,
  formatar = abreviar,
  altura = 260,
  area = true,
}: PropsComuns & { series: Serie[]; area?: boolean }) {
  const id = useId();
  const [ativo, setAtivo] = useState<number | null>(null);
  const L = 48, R = 16, T = 14, B = 30; // margens: eixo à esquerda, rótulos embaixo
  const W = 720, H = altura;
  const largura = W - L - R, alturaUtil = H - T - B;

  const n = series[0]?.pontos.length ?? 0;
  const maximo = useMemo(
    () => tetoRedondo(Math.max(1, ...series.flatMap((s) => s.pontos.map((p) => p.valor)))),
    [series],
  );
  const x = (i: number) => L + (n <= 1 ? largura / 2 : (i * largura) / (n - 1));
  const y = (v: number) => T + alturaUtil - (v / maximo) * alturaUtil;
  const marcas = [0, 0.25, 0.5, 0.75, 1].map((f) => maximo * f);

  if (n === 0) return <SemDados titulo={titulo} descricao={descricao} altura={altura} />;

  return (
    <figure className="g-fig">
      <figcaption>
        <strong>{titulo}</strong>
        {descricao && <span>{descricao}</span>}
      </figcaption>
      <Legenda series={series} />
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="g-svg"
        role="img"
        aria-label={`${titulo}. ${descricao ?? ''} Os números estão na tabela abaixo do gráfico.`}
        onMouseLeave={() => setAtivo(null)}
      >
        {/* grade: fina, sólida, recuada — ela orienta, não compete */}
        {marcas.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={GRADE} strokeWidth={1} />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" className="g-eixo">{formatar(v)}</text>
          </g>
        ))}

        {series.map((s, si) => {
          const cor = corDaSerie(series, si);
          const d = s.pontos.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.valor)}`).join(' ');
          return (
            <g key={s.nome}>
              {area && (
                <path
                  d={`${d} L${x(n - 1)},${T + alturaUtil} L${x(0)},${T + alturaUtil} Z`}
                  fill={cor}
                  opacity={0.1}
                />
              )}
              <path d={d} fill="none" stroke={cor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {/* ponto só na PONTA: um marcador em cada valor vira ruído */}
              <circle cx={x(n - 1)} cy={y(s.pontos[n - 1].valor)} r={4.5} fill={cor} stroke={SUPERFICIE} strokeWidth={2} />
            </g>
          );
        })}

        {/* mira + faixas de captura (largas, pra o mouse acertar sem precisão) */}
        {ativo !== null && (
          <line x1={x(ativo)} x2={x(ativo)} y1={T} y2={T + alturaUtil} stroke={TINTA_FRACA} strokeWidth={1} opacity={0.35} />
        )}
        {series[0].pontos.map((_, i) => (
          <rect
            key={i}
            x={x(i) - largura / Math.max(1, n * 2)}
            y={T}
            width={largura / Math.max(1, n)}
            height={alturaUtil}
            fill="transparent"
            onMouseEnter={() => setAtivo(i)}
          />
        ))}
        {ativo !== null &&
          series.map((s, si) => (
            <circle
              key={s.nome}
              cx={x(ativo)}
              cy={y(s.pontos[ativo].valor)}
              r={4.5}
              fill={corDaSerie(series, si)}
              stroke={SUPERFICIE}
              strokeWidth={2}
            />
          ))}

        {series[0].pontos.map((p, i) => (
          <text key={p.rotulo + i} x={x(i)} y={H - 10} textAnchor="middle" className="g-eixo">
            {n > 8 && i % 2 ? '' : p.rotulo}
          </text>
        ))}
      </svg>

      {ativo !== null && (
        <div className="g-dica" role="status">
          <strong>{series[0].pontos[ativo].rotulo}</strong>
          {series.map((s, si) => (
            <span key={s.nome}>
              <i style={{ background: corDaSerie(series, si) }} aria-hidden="true" />
              {s.nome}: <b>{formatar(s.pontos[ativo].valor)}</b>
            </span>
          ))}
        </div>
      )}
      <TabelaDados series={series} formatar={formatar} />
      <span hidden id={id} />
    </figure>
  );
}

// ————————————————————————————————————————————————————————————
// COLUNAS — para COMPARAR GRANDEZAS entre categorias.
// Barra de no máximo 24px (o resto da faixa é ar), ponta arredondada em 4px e
// quadrada na base, e 2px de respiro entre vizinhas.
// ————————————————————————————————————————————————————————————
export function GraficoBarras({
  titulo,
  descricao,
  series,
  formatar = abreviar,
  altura = 260,
}: PropsComuns & { series: Serie[] }) {
  const [ativo, setAtivo] = useState<{ i: number; s: number } | null>(null);
  const L = 48, R = 16, T = 14, B = 32;
  const W = 720, H = altura;
  const largura = W - L - R, alturaUtil = H - T - B;

  const n = series[0]?.pontos.length ?? 0;
  const maximo = useMemo(
    () => tetoRedondo(Math.max(1, ...series.flatMap((s) => s.pontos.map((p) => p.valor)))),
    [series],
  );
  if (n === 0) return <SemDados titulo={titulo} descricao={descricao} altura={altura} />;

  const faixa = largura / n;
  const grossuraMax = 24;
  const grossura = Math.min(grossuraMax, (faixa - 12) / series.length);
  const y = (v: number) => T + alturaUtil - (v / maximo) * alturaUtil;
  const marcas = [0, 0.25, 0.5, 0.75, 1].map((f) => maximo * f);

  return (
    <figure className="g-fig">
      <figcaption>
        <strong>{titulo}</strong>
        {descricao && <span>{descricao}</span>}
      </figcaption>
      <Legenda series={series} />
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="g-svg"
        role="img"
        aria-label={`${titulo}. ${descricao ?? ''} Os números estão na tabela abaixo do gráfico.`}
        onMouseLeave={() => setAtivo(null)}
      >
        {marcas.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={GRADE} strokeWidth={1} />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" className="g-eixo">{formatar(v)}</text>
          </g>
        ))}

        {series.map((s, si) =>
          s.pontos.map((p, i) => {
            const total = grossura * series.length + 2 * (series.length - 1);
            const x0 = L + faixa * i + (faixa - total) / 2 + si * (grossura + 2);
            const alt = Math.max(0, (p.valor / maximo) * alturaUtil);
            const destaque = ativo && ativo.i === i;
            return (
              <rect
                key={s.nome + i}
                x={x0}
                y={y(p.valor)}
                width={grossura}
                height={alt}
                rx={Math.min(4, grossura / 2)}
                fill={corDaSerie(series, si)}
                opacity={ativo && !destaque ? 0.45 : 1}
                onMouseEnter={() => setAtivo({ i, s: si })}
              />
            );
          }),
        )}

        {series[0].pontos.map((p, i) => (
          <text key={p.rotulo + i} x={L + faixa * i + faixa / 2} y={H - 10} textAnchor="middle" className="g-eixo">
            {p.rotulo}
          </text>
        ))}
      </svg>

      {ativo && (
        <div className="g-dica" role="status">
          <strong>{series[0].pontos[ativo.i].rotulo}</strong>
          {series.map((s, si) => (
            <span key={s.nome}>
              <i style={{ background: corDaSerie(series, si) }} aria-hidden="true" />
              {s.nome}: <b>{formatar(s.pontos[ativo.i].valor)}</b>
            </span>
          ))}
        </div>
      )}
      <TabelaDados series={series} formatar={formatar} />
    </figure>
  );
}

// ————————————————————————————————————————————————————————————
// ROSCA — para PARTE DO TODO, e só quando as partes são poucas (até 5) e a
// pergunta é mesmo "que fatia cada um representa". Com mais que isso, ou quando
// a pergunta é "qual o maior", colunas leem melhor.
// ————————————————————————————————————————————————————————————
export function GraficoRosca({
  titulo,
  descricao,
  dados,
  formatar = abreviar,
  altura = 240,
}: PropsComuns & { dados: Ponto[] }) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const total = dados.reduce((s, d) => s + d.valor, 0);
  if (total <= 0) return <SemDados titulo={titulo} descricao={descricao} altura={altura} />;

  const R = 78, r = 50, cx = 110, cy = 110;
  let acumulado = 0;
  const fatias = dados.map((d, i) => {
    const inicio = (acumulado / total) * Math.PI * 2 - Math.PI / 2;
    acumulado += d.valor;
    const fim = (acumulado / total) * Math.PI * 2 - Math.PI / 2;
    // 2px de respiro entre fatias: é o vão que separa, não um contorno.
    const folga = 0.012;
    const a0 = inicio + folga, a1 = Math.max(a0 + 0.001, fim - folga);
    const grande = a1 - a0 > Math.PI ? 1 : 0;
    const p = (raio: number, a: number) => `${cx + raio * Math.cos(a)},${cy + raio * Math.sin(a)}`;
    return {
      d: `M${p(R, a0)} A${R},${R} 0 ${grande} 1 ${p(R, a1)} L${p(r, a1)} A${r},${r} 0 ${grande} 0 ${p(r, a0)} Z`,
      cor: dados[i].valor && CORES_SERIE[i % CORES_SERIE.length],
      pct: (d.valor / total) * 100,
    };
  });

  return (
    <figure className="g-fig">
      <figcaption>
        <strong>{titulo}</strong>
        {descricao && <span>{descricao}</span>}
      </figcaption>
      <div className="g-rosca">
        <svg viewBox="0 0 220 220" className="g-svg-rosca" role="img" aria-label={`${titulo}. Os números estão na tabela abaixo.`} onMouseLeave={() => setAtivo(null)}>
          {fatias.map((f, i) => (
            <path
              key={dados[i].rotulo}
              d={f.d}
              fill={String(f.cor)}
              opacity={ativo !== null && ativo !== i ? 0.4 : 1}
              onMouseEnter={() => setAtivo(i)}
            />
          ))}
          <text x={cx} y={cy - 2} textAnchor="middle" className="g-rosca-num">
            {ativo !== null ? formatar(dados[ativo].valor) : formatar(total)}
          </text>
          <text x={cx} y={cy + 18} textAnchor="middle" className="g-eixo">
            {ativo !== null ? dados[ativo].rotulo : 'total'}
          </text>
        </svg>
        <ul className="g-legenda g-legenda-lista">
          {dados.map((d, i) => (
            <li key={d.rotulo}>
              <span className="g-chave" style={{ background: CORES_SERIE[i % CORES_SERIE.length] }} aria-hidden="true" />
              {d.rotulo}
              <b>{fatias[i].pct.toFixed(0)}%</b>
            </li>
          ))}
        </ul>
      </div>
      <TabelaDados series={[{ nome: titulo, pontos: dados }]} formatar={formatar} />
    </figure>
  );
}

// ————————————————————————————————————————————————————————————
// FAÍSCA — a linha miúda que mora dentro de um cartão de número. Sem eixo, sem
// grade, sem dica: ela mostra o FORMATO da série, e o número ao lado é o valor.
// ————————————————————————————————————————————————————————————
export function Faisca({ pontos, cor = MARCA }: { pontos: number[]; cor?: string }) {
  if (pontos.length < 2) return null;
  const W = 120, H = 32;
  const max = Math.max(...pontos), min = Math.min(...pontos);
  const faixa = max - min || 1;
  const d = pontos
    .map((v, i) => `${i ? 'L' : 'M'}${(i / (pontos.length - 1)) * W},${H - ((v - min) / faixa) * (H - 4) - 2}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="g-faisca" aria-hidden="true">
      <path d={`${d} L${W},${H} L0,${H} Z`} fill={cor} opacity={0.1} />
      <path d={d} fill="none" stroke={cor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ————————————————————————————————————————————————————————————
// NÚMERO — quando a resposta é UM valor, um cartão lê melhor que um gráfico.
// A variação vem com sinal e palavra, nunca só com a cor da seta.
// ————————————————————————————————————————————————————————————
export function Numerao({
  rotulo,
  valor,
  variacao,
  bom = 'maior',
  serie,
}: {
  rotulo: string;
  valor: string;
  /** Variação percentual contra o período anterior. */
  variacao?: number;
  /** Para este indicador, subir é bom ou ruim? */
  bom?: 'maior' | 'menor';
  serie?: number[];
}) {
  const subiu = (variacao ?? 0) > 0;
  const positivo = bom === 'maior' ? subiu : !subiu;
  const cor = variacao === undefined || Math.abs(variacao) < 1 ? TINTA_FRACA : positivo ? CORES_ESTADO.bom : CORES_ESTADO.critico;
  return (
    <article className="g-numerao">
      <span className="g-numerao-rotulo">{rotulo}</span>
      <strong className="g-numerao-valor">{valor}</strong>
      <div className="g-numerao-pe">
        {variacao !== undefined && (
          <span style={{ color: cor }}>
            {subiu ? '↑' : '↓'} {Math.abs(variacao).toFixed(0)}%{' '}
            <span className="g-numerao-nota">{subiu ? 'a mais' : 'a menos'} que no período anterior</span>
          </span>
        )}
        {serie && <Faisca pontos={serie} />}
      </div>
    </article>
  );
}

function SemDados({ titulo, descricao, altura }: { titulo: string; descricao?: string; altura: number }) {
  return (
    <figure className="g-fig">
      <figcaption>
        <strong>{titulo}</strong>
        {descricao && <span>{descricao}</span>}
      </figcaption>
      <div className="g-vazio" style={{ height: altura - 60 }}>
        Ainda não há dados para este período.
      </div>
    </figure>
  );
}
