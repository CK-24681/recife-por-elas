# Arquitetura do Backend

Para garantir adesão a padrões internacionais (Separation of Concerns / Clean Architecture) de forma totalmente segura (sem quebrar a base instalada), o backend está organizado logicamente em **Camadas**.

Em vez de mover os arquivos originais (o que geraria risco de quebra de deploy e imports), utilizamos o padrão **Barrel (Índice)**. Cada subdiretório abaixo atua como a interface daquela camada, re-exportando os arquivos pertinentes.

## Camadas

### 1. `infra/` (Infraestrutura)
Lida com a fundação técnica do sistema.
- Conexão com Banco de Dados (`db.ts`)
- Health Checks para plataformas Cloud (`saude.ts`)
- Telemetria e Logs (`registros.ts`)

### 2. `domain/` (Domínio)
Contém as regras de negócio e integrações principais.
- Lógica de Autenticação Segura (`auth.ts`)
- Integrações de Oportunidades Externas (`integracoes.ts`, `integracoes_locais.ts`)
- Estruturação de dados da Rede de Apoio (`dados_rede_apoio.ts`)

### 3. `middleware/` (Middleware & Assets)
Lida com processamento de streams, uploads cru e formatação.
- Upload e parse de mídias pesadas (`arquivos.ts`)
- Upload de imagens leves (`uploads.ts`)
- Geração de PDF no servidor (`pdf.ts`)

### 4. `routes/` (Rotas e Controladores)
Camada de entrada REST.
- Autenticação e Gestão de Sessão (`auth_rotas.ts`)
- Endpoints de Oportunidades, Mural e Perfil (`rotas.ts`)

## Entry Point
O servidor centraliza tudo e faz o *wiring* no arquivo `server.ts`. 

> **Nota para desenvolvedores:** Você pode importar funcionalidades tanto dos arquivos flat em `src/` quanto das pastas de camada (`src/domain/`, `src/infra/`).
