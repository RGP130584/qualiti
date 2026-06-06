# Implementation Packages v1 — QualitiOS & TPM

Este documento estabelece os Pacotes de Implementação Executáveis para as primeiras fases de transição evolutiva do ecossistema **QualitiOS** e **TPM (Trusted Cognitive Platform)**. Estes pacotes destinam-se a orientar a execução técnica, consolidando as features mapeadas nas ondas de transformação do roadmap oficial e fornecendo critérios de aceite claros, ordenamento lógico de implementação e definições de conclusão, sem a geração de código-fonte, histórias de usuário ou subtarefas específicas.

---

## 1. PACKAGE 01 — WAVE 0: ARCHITECTURE BASELINE (Alinhamento Inicial)

### Objetivo
Estabelecer e formalizar a fundação documental de governança, decisões arquiteturais (ADRs), manuais de Clean Architecture/DDD e a parametrização inicial das políticas que regerão a esteira de validação automática de código.

### Escopo
*   Estruturação física da pasta `/docs/adr/` na raiz do projeto com o registro oficial das primeiras 7 ADRs congeladas (ADR-001 a ADR-007).
*   Publicação do manual de princípios arquiteturais (regras de modularidade, Clean Architecture e Bounded Contexts).
*   Mapeamento detalhado de limites físicos de Bounded Contexts e propriedade de tabelas no banco de dados.
*   Criação e especificação do arquivo de parâmetros de regras de conformidade que serão verificadas pelo TPM.

### Features incluídas
*   **F-W0-01-01: ADR Registry** (Prioridade: Crítica | Contexto: Governança)
*   **F-W0-02-01: Principles Documentation** (Prioridade: Crítica | Contexto: Governança)
*   **F-W0-03-01: Domain Schema Registry** (Prioridade: Crítica | Contexto: Governança)
*   **F-W0-04-01: Policies Definition** (Prioridade: Crítica | Contexto: Governança)

### Dependências
*   Nenhuma. Este pacote serve como pré-requisito documental e de configuração de governança para todas as ondas subsequentes do ecossistema.

### Critérios de aceite
*   Diretório `/docs/adr/` inicializado no repositório de código contendo os arquivos individuais em formato Markdown para as ADR-001 a ADR-007.
*   Manual de princípios arquiteturais oficial publicado no repositório, especificando as camadas formais aceitas no backend Fastify (Controllers, Services, Repositories, Models) e proibindo Queries SQL Raw fora de Repositories de domínio.
*   Documento de mapeamento de domínios oficializado no repositório, discriminando o Bounded Context proprietário de cada tabela e o fluxo autorizado de comunicação entre eles.
*   Arquivo de parametrização de políticas do TPM (`tpm.yaml` ou similar) criado na raiz do repositório, contendo a lista oficial das regras que serão verificadas (como bloqueio de segredos hardcoded, imports cruzados e dependências vulneráveis) e seus pesos para cálculo do score.

### Ordem de implementação
1.  **Estruturação de ADRs (F-W0-01-01)**: Criar o diretório `/docs/adr/` e commitar as ADR-001 a ADR-007 aprovadas.
2.  **Redação dos Princípios Arquiteturais (F-W0-02-01)**: Publicar o manual de modularidade, Clean Architecture e Bounded Contexts no repositório.
3.  **Registro de Esquemas de Domínio (F-W0-03-01)**: Commitar o dicionário de domínios e a definição de propriedade de gravação de tabelas.
4.  **Especificação de Parâmetros TPM (F-W0-04-01)**: Criar e configurar o arquivo base de políticas de validação do TPM.

### Riscos
*   **Divergência conceitual na equipe de desenvolvimento**: A equipe de engenharia pode falhar em aplicar os padrões de Clean Architecture no dia a dia por falta de entendimento das regras.
    *   *Mitigação*: Realizar um alinhamento técnico síncrono e apresentar o manual de princípios arquiteturais logo após o commit do pacote.
*   **Políticas do TPM desalinhadas**: As políticas registradas no arquivo de configuração do TPM podem ser complexas demais ou subestimar desvios críticos.
    *   *Mitigação*: Revisar o arquivo de parâmetros com a liderança de engenharia antes de congelar a Wave 0.

### Definition of Done (DoD)
*   Todos os documentos de design, ADRs e o arquivo de parametrização de políticas do TPM estão criados, revisados no Git, integrados à branch principal e homologados pela governança de arquitetura.

---

## 2. PACKAGE 02 — WAVE 1: SECURITY FOUNDATION (Base de Segurança)

### Objetivo
Sanear e blindar a camada de segurança no Runtime do QualitiOS (Next.js e Fastify), eliminando vulnerabilidades críticas de vazamento de credenciais e cookies de sessão, restringindo origens no CORS, implementando limitação de requisições por IP e ativando trilha auditável de acessos para conformidade com a LGPD.

### Escopo
*   Migração do mecanismo de persistência de JWT de localStorage para cookies HTTP seguros no Server Engine.
*   Configuração e ativação de tags de segurança de cookies (`HttpOnly`, `Secure`, `SameSite=Strict`).
*   Configuração de CORS no runtime do backend Fastify e Caddy para desativar o wildcard `*`, limitando conexões a origens explícitas definidas via `.env`.
*   Implementação de middleware de Rate Limiting por IP para as rotas de autenticação (login) no runtime do backend.
*   Criação da tabela de logs de auditoria na Persistence Layer e inserção automática de registros para tentativas de login e acessos bem-sucedidos ou falhos.

### Features incluídas
*   **F-W1-01-01: HttpOnly Token Storage** (Prioridade: Crítica | Contexto: Governança)
*   **F-W1-02-01: Secure Cookie Config** (Prioridade: Crítica | Contexto: Governança)
*   **F-W1-03-01: Restricted Access Domains** (Prioridade: Crítica | Contexto: Todos os contextos)
*   **F-W1-04-01: API Rate Limiter** (Prioridade: Alta | Contexto: Governança)
*   **F-W1-05-01: Log de Acesso Audit** (Prioridade: Alta | Contexto: Governança)

### Dependências
*   `F-W0-04-01` (Policies Definition): A parametrização de políticas de conformidade do TPM é necessária para definir as auditorias estáticas de cookies e segurança que serão criadas na Wave 2.

### Critérios de aceite
*   Tokens JWT de login trafegam exclusivamente via cabeçalhos HTTP Cookie e não podem ser expostos a scripts cliente (`document.cookie` ou local storage no navegador permanecem limpos de segredos).
*   Os cookies de autenticação gerados pelo Fastify retornam com os cabeçalhos `HttpOnly`, `Secure` e `SameSite=Strict` ativados em todas as requisições de produção.
*   A API Fastify bloqueia requisições Cross-Origin de origens que não constem na lista parametrizada de domínios seguros nas variáveis de ambiente.
*   As rotas de login respondem com status HTTP 429 (Too Many Requests) caso um mesmo endereço de IP exceda o limite de requisições por minuto pré-definido em arquivo de configuração.
*   Logs de login contendo identificador de usuário, IP de origem, status da tentativa (sucesso/falha) e timestamp são inseridos no PostgreSQL sem que a API disponibilize rotas de modificação ou deleção destes registros.

### Ordem de implementação
1.  **Cookies HttpOnly para JWT (F-W1-01-01 e F-W1-02-01)**: Refatorar o fluxo de autenticação do backend Fastify para emitir tokens em cookies protegidos e ajustar o Next.js para repassar estes cookies no SSR.
2.  **Fechamento de CORS (F-W1-03-01)**: Configurar as origens de CORS no backend Fastify com base em array carregado da variável de ambiente, removendo as configurações que aceitem wildcard `*`.
3.  **Rate Limiting no Login (F-W1-04-01)**: Acoplar o plugin ou middleware de limitação de requisições por IP nas rotas de login do Fastify.
4.  **Trilha de Auditoria (F-W1-05-01)**: Criar o modelo, tabela e repositório de log de auditoria no PostgreSQL e acoplar a gravação nos handlers de autenticação.

### Riscos
*   **Erros de CORS e cookies em desenvolvimento local**: Ambientes de desenvolvimento utilizando IPs ou subdomínios locais diferentes podem sofrer bloqueios de CORS ou falhas na transmissão de cookies SameSite.
    *   *Mitigação*: Configurar variáveis de ambiente específicas para o ambiente de desenvolvimento e mapear domínios locais sob o Caddyfile para simular HTTPS e SameSite=Strict localmente.
*   **Bloqueios indesejados por Rate Limiting**: Usuários sob a mesma rede corporativa compartilhando o mesmo IP externo podem ser bloqueados em conjunto ao tentarem logar simultaneamente.
    *   *Mitigação*: Utilizar uma estratégia de chave de rate limit composta por IP e hash do e-mail do usuário para evitar bloqueios em lote.

### Definition of Done (DoD)
*   Código de autenticação, CORS e rate limit implementado no Fastify e no Next.js.
*   Tabela de logs criada e integrada na Persistence Layer.
*   Testes automatizados de integração validando login seguro, CORS restrito, limitação de taxa e gravação de logs rodando localmente com 100% de sucesso.
*   Nenhuma credencial ou token JWT armazenado em local storage ou impresso em logs de depuração.

---

## 3. PACKAGE 03 — WAVE 2: TPM FOUNDATION (Fundações de Governança TPM)

### Objetivo
Construir o motor utilitário de validação contínua externa do TPM (Trusted Cognitive Platform) e acoplá-lo ao Pipeline de Build (CI) para atuar como portão de bloqueio de commits e merges que infrinjam Clean Architecture, divisão de Bounded Contexts, segurança de secrets e integridade de pacotes de terceiros.

### Escopo
*   Criação da engine do validador estático (Rules Engine Core e Policy Evaluation Engine) para ler asserções do TPM.
*   Validação estática de aderência à Clean Architecture e DDD (proibindo Query SQL Raw fora de repositórios autorizados).
*   Validação estática de integridade de dados e limites de Bounded Context (Database Ownership Guard e Bounded Context Validation).
*   Validação estática de dependências entre Bounded Contexts de acordo com as regras do Context Map (Domain Dependency Validation).
*   Varredura estática de exposição de credenciais e senhas hardcoded (Secret Scanner).
*   Scanner de vulnerabilidades conhecidas em bibliotecas do ecossistema de pacotes NPM.
*   Scanner de higiene de código (arquivos vazios e arquivos sem uso).
*   Calculadora automática de score técnico (Trust Score Calculator) e gerador de relatórios assinados eletronicamente.
*   Configuração do Build Gate que falha o pipeline de CI do repositório principal se houver violações graves.

### Features incluídas
*   **F-W2-01-01: Architecture Rules Registry** (Prioridade: Alta | Contexto: Todos os contextos)
*   **F-W2-01-02: Architecture Scanner** (Prioridade: Alta | Contexto: Todos os contextos)
*   **F-W2-01-03: Violation Reporter** (Prioridade: Alta | Contexto: Governança)
*   **F-W2-01-04: Build Gate** (Prioridade: Alta | Contexto: Governança)
*   **F-W2-02-01: Database Ownership Guard** (Prioridade: Alta | Contexto: Todos os contextos)
*   **F-W2-02-02: Bounded Context Validation** (Prioridade: Alta | Contexto: Todos os contextos)
*   **F-W2-02-03: Event Ownership Validation** (Prioridade: Média | Contexto: Todos os contextos)
*   **F-W2-02-04: Ubiquitous Language Validation** (Prioridade: Média | Contexto: Todos os contextos)
*   **F-W2-02-05: Domain Dependency Validation** (Prioridade: Alta | Contexto: Todos os contextos)
*   **F-W2-03-01: Package Vulnerability Analyzer** (Prioridade: Alta | Contexto: Todos os contextos)
*   **F-W2-04-01: Secret Scanner** (Prioridade: Alta | Contexto: Governança)
*   **F-W2-05-01: Code Hygiene Check** (Prioridade: Média | Contexto: Todos os contextos)
*   **F-W2-06-01: Trust Certificate Issuer** (Prioridade: Média | Contexto: Governança)
*   **F-W2-07-01: Rules Engine Core** (Prioridade: Alta | Contexto: Governança)
*   **F-W2-07-02: Policy Evaluation Engine** (Prioridade: Alta | Contexto: Governança)
*   **F-W2-07-03: Trust Score Calculator** (Prioridade: Alta | Contexto: Governança)
*   **F-W2-07-04: Trust Report Generator** (Prioridade: Alta | Contexto: Governança)

### Dependências
*   `F-W0-04-01` (Policies Definition): A parametrização de regras e pesos definida na Wave 0 é o input para o Rules Engine Core.
*   `F-W1-05-01` (Security Audit): O log de auditoria é necessário para a persistência das violações de regras críticas no banco de dados.

### Critérios de aceite
*   O utilitário do TPM deve analisar de forma não-intrusiva os arquivos do repositório QualitiOS através do terminal de comandos na esteira de CI.
*   O Build Gate deve bloquear a conclusão da pipeline de CI (retornando status `exit 1`) se o validador encontrar:
    *   Arquivos fora da pasta de domínio apropriada importando ou acessando repositórios internos de outros domínios de forma síncrona.
    *   Imports diretos na aplicação que contrariem o mapa oficial de dependências de domínio (ex: dependências circulares de upstream/downstream desautorizadas).
    *   Instâncias de SQL Raw escritas diretamente dentro de controllers do runtime da API Fastify.
    *   Credenciais de API, tokens JWT ou senhas em texto puro expostos nos arquivos do Git.
    *   Dependências NPM que possuam falhas de segurança CVE com nível crítico listadas.
*   O TPM deve emitir um parecer em formato estruturado (JSON/Markdown) listando os erros, as linhas afetadas e o cálculo do Trust Score ponderado.
*   Se o build passar sem violações graves, o TPM gera um certificado eletrônico de conformidade (hash assinado com metadados do build) atestando o integridade da versão.

### Ordem de implementação
1.  **Núcleo do Validador (F-W2-07-01 e F-W2-07-02)**: Desenvolver o motor que interpreta as regras parametrizadas e faz o parser estático de arquivos TS/JS.
2.  **Regras de Clean Architecture e Bounded Contexts (F-W2-01-01, F-W2-01-02, F-W2-02-02 e F-W2-02-05)**: Implementar a checagem de regras de importação e acoplamento de diretórios contra o Context Map oficial.
3.  **Segurança de Banco e Secrets (F-W2-02-01 e F-W2-04-01)**: Mapear restrições de escrita cruzada no banco de dados e adicionar scanner estático contra credenciais hardcoded.
4.  **Auditoria de Eventos e Termos (F-W2-02-03 e F-W2-02-04)**: Adicionar regras que fiscalizam a imutabilidade de eventos de domínio e uso de linguagem ubíqua obsoleta.
5.  **Análise de Pacotes e Higiene (F-W2-03-01 e F-W2-05-01)**: Conectar ferramenta de análise de dependências vulneráveis do ecossistema de pacotes (NPM audit) e limpeza de código.
6.  **Cálculo e Relatórios (F-W2-07-03, F-W2-07-04, F-W2-01-03 e F-W2-06-01)**: Implementar a calculadora de score, emissão de relatórios de violações e do certificado eletrônico de atestado técnico.
7.  **Portão do Pipeline (F-W2-01-04)**: Configurar o script integrando as checagens do TPM como estágio impeditivo no Pipeline de CI.

### Riscos
*   **Sobrecarga e lentidão no build da CI**: O processamento de centenas de arquivos a cada commit pode aumentar o tempo de build e atrasar a equipe.
    *   *Mitigação*: Configurar o validador para filtrar e inspecionar apenas os arquivos TypeScript que sofreram modificações na Pull Request (via `git diff --name-only`).
*   **Quebra excessiva de builds legítimos por falsos positivos**: Regras estritas de Clean Arch ou de escrita no banco de dados podem parar entregas de hotfixes válidos por conta de desvios menores ou falsos positivos.
    *   *Mitigação*: Lançar as validações do TPM com nível de severidade `WARNING` no início, tornando-as bloqueantes (`ERROR`) de forma gradual e configurável após calibração das regras com a engenharia.

### Definition of Done (DoD)
*   O utilitário do validador TPM está implementado e testado.
*   Pipeline de CI configurado executando a suite do TPM a cada commit ou pull request.
*   Casos de teste garantem 100% de precisão nos bloqueios de imports proibidos, banco cruzado e secrets expostos.
*   Relatório de parecer estruturado e atestado eletrônico de integridade técnica sendo gerados com sucesso na pipeline do Git.
