# Wave Specifications v1 — QualitiOS & TPM

Este documento estabelece as especificações executáveis de engenharia para as ondas iniciais de evolução do ecossistema **QualitiOS** e da plataforma **TPM (Trusted Cognitive Platform)**. A especificação orienta a implementação técnica, os entregáveis, as restrições de governança, os critérios de aceite e o modelo de entrega para o agente de desenvolvimento.

---

# WAVE 0 SPECIFICATION: Architecture Baseline (Alinhamento Inicial)

## Objetivo
Formalizar, registrar e congelar a fundação de governança do repositório, contendo as decisões de design arquitetural (ADRs), manuais de Clean Architecture e de Domain-Driven Design (DDD), limites de propriedade de dados no banco relacional e os parâmetros iniciais das políticas de validação técnica do TPM.

## Problema Resolvido
Desalinhamento técnico da equipe de desenvolvimento decorrente da falta de regras escritas, vazamento de lógica de negócio e queries cruzadas entre diferentes módulos da aplicação no banco de dados, ausência de rastreabilidade sobre decisões estruturais anteriores e falta de parametrização formal das asserções de qualidade que a esteira automática do TPM deve impor.

## Escopo
*   Estruturação física da pasta de decisões arquiteturais na raiz do projeto e commitar as primeiras 7 ADRs estruturadas (ADR-001 a ADR-007).
*   Publicação do manual de diretrizes de Clean Architecture no repositório de documentação, regulando a organização de pastas e a divisão estrita de camadas.
*   Publicação do dicionário de domínios contendo as definições formais de Bounded Contexts, suas respectivas responsabilidades de negócio e a atribuição de propriedade de dados no PostgreSQL.
*   Criação e comissão do arquivo base de definições de regras de validação do TPM na raiz do projeto.

## Features Incluídas
*   **F-W0-01-01: ADR Registry** (Decisão: Aprovada | Contexto: Governança)
*   **F-W0-02-01: Principles Documentation** (Decisão: Aprovada | Contexto: Governança)
*   **F-W0-03-01: Domain Schema Registry** (Decisão: Aprovada | Contexto: Governança)
*   **F-W0-04-01: Policies Definition** (Decisão: Aprovada | Contexto: Governança)

## Dependências
*   Nenhuma. É a fase de inicialização de governança que fundamenta todas as demais ondas.

## Entregáveis
*   Diretório `/docs/adr/` na raiz do projeto preenchido com as ADR-001 a ADR-007 individuais em formato Markdown.
*   Arquivo de manual de Clean Architecture e modularidade no caminho `docs/architecture/clean-architecture-principles.md`.
*   Arquivo de dicionário de domínios e fronteiras de dados no caminho `docs/strategy/domain-dictionary.md`.
*   Arquivo `tpm.yaml` gravado na raiz do projeto com o esquema de asserções configuráveis e pesos correspondentes.

## Critérios de Aceite
*   Os arquivos das ADRs devem representar exatamente as decisões congeladas (ADR-001 a ADR-007) no formato padrão ADR Markdown.
*   O manual de Clean Architecture deve exigir a separação de código em camadas lógicas e proibir queries em banco de dados ou acoplamento direto fora das camadas permitidas.
*   O dicionário de domínios deve delimitar individualmente as tabelas do banco de dados relacional para cada um dos 8 contextos de negócios da aplicação, proibindo escrita cruzada direta.
*   O arquivo `tpm.yaml` deve conter parâmetros válidos contendo chaves para as regras de Clean Architecture, segredos expostos, CORS restrito, dependências de pacotes e higiene, atribuindo pesos (0 a 100) para cada severidade.

## Definition of Done (DoD)
*   Todos os entregáveis de documentação e parametrização de políticas do TPM criados, integrados à branch principal do Git, validados sintaticamente e aprovados pela governança de arquitetura.

## Evidências Esperadas
*   Diretórios e arquivos criados commitados no Git na branch `main`.

## Riscos
*   **Desalinhamento conceitual sobre a rigidez das regras**: A equipe técnica pode subestimar as definições de Clean Architecture devido à abstração dos termos documentados.
    *   *Mitigação*: Realizar reuniões rápidas de esclarecimento sobre a divisão lógica de pastas logo após a comissão dos entregáveis.

## Exclusões de Escopo
*   Implementação de código utilitário de validação automatizada de PRs, criação de workflows de CI, refatoração de banco de dados ou refatoração física de qualquer endpoint de API do Runtime.

---

# WAVE 1 SPECIFICATION: Security Foundation (Base de Segurança)

## Objetivo
Blindar a segurança das sessões de login, limitar furos de comunicação Cross-Origin, atenuar ataques de força bruta no Runtime e implementar a trilha permanente de auditoria de acessos para conformidade legal.

## Problema Resolvido
Vulnerabilidade crítica de sequestro de sessão devido a tokens JWT armazenados no localStorage do cliente (expostos a ataques XSS), risco de requisições cross-origin não autorizadas devido a wildcard de CORS aberto, exposição de rotas de login a negação de serviço e força bruta, e ausência de logs de auditoria imutáveis exigidos pela regulação.

## Escopo
*   Migração da persistência e tráfego de tokens JWT do frontend para cookies de sessão trafegados via cabeçalhos HTTP.
*   Configuração de tags e atributos de segurança de cookies no backend do Runtime.
*   Restrição de CORS no backend para rejeitar wildcard e aceitar apenas origens parametrizadas.
*   Ativação de middleware de Rate Limiting por IP para as rotas críticas de login.
*   Criação da tabela de auditoria de acessos no banco relacional e gravação automática de logs de login ativos (sucesso e falha).

## Features Incluídas
*   **F-W1-01-01: HttpOnly Token Storage**
*   **F-W1-02-01: Secure Cookie Configuration**
*   **F-W1-03-01: Restricted Access Domains**
*   **F-W1-04-01: API Rate Limiter**
*   **F-W1-05-01: Audit Access Log**

## Dependências
*   `F-W0-04-01: Policies Definition` (Wave 0): Exige a especificação de parâmetros de conformidade que regulam os testes estáticos de segurança que serão acoplados na Wave 2.

## Entregáveis
*   Refatoração do mecanismo de autenticação e controllers de login no backend Fastify.
*   Refatoração do Next.js para repassar cookies de sessão em requisições de renderização no lado do servidor (SSR).
*   Configuração do middleware de CORS no Fastify e no arquivo Caddyfile com array de origens carregado a partir do `.env`.
*   Middleware de rate limiting integrado nas rotas de autenticação da API.
*   Script de migração SQL DDL de criação da tabela `auditoria_logs` no PostgreSQL e desenvolvimento do respectivo modelo na Persistence Layer.

## Critérios de Aceite
*   Os tokens de autenticação não devem estar presentes no localStorage ou cookies legíveis por scripts client-side (`document.cookie` retorna vazio para o JWT).
*   Os cookies de autenticação emitidos no login retornam com atributos `HttpOnly`, `Secure` e `SameSite=Strict` ativados nas respostas HTTP.
*   Chamadas vindas de origens cross-origin que não estejam explicitadas na variável de ambiente do CORS devem ser bloqueadas no navegador.
*   Requisições de login em rajada que excedam o limite por IP configurado (ex: mais de 10 tentativas por minuto) são bloqueadas temporariamente e recebem status HTTP 429 (Too Many Requests).
*   Toda tentativa de login registra no banco PostgreSQL o e-mail, IP, status (sucesso/falha) e timestamp, sem disponibilização de rotas de alteração ou deleção na aplicação.

## Definition of Done (DoD)
*   Código de autenticação, CORS e rate limiting implementado, com cobertura de testes unitários e de integração de segurança acima de 85% rodando localmente sem erros, e alterações commitadas na branch principal.

## Evidências Esperadas
*   Relatório de testes automatizados e logs de requisições demonstrando respostas com cabeçalhos HTTP corretos, erro de CORS para origens invasoras e status HTTP 429 para rajadas de requisições.

## Riscos
*   **Erros de transmissão de cookies SameSite=Strict em desenvolvimento**: Em desenvolvimento local usando HTTP comum (sem SSL), alguns navegadores podem bloquear cookies SameSite=Strict.
    *   *Mitigação*: Configurar o Caddy local para expor a aplicação em HTTPS autoassinado ou flexibilizar temporariamente a flag `Secure` apenas em ambiente local via variável `NODE_ENV`.

## Exclusões de Escopo
*   Configuração de esteira de CI com validações automatizadas de código do TPM, refatoração de banco de dados para unificação de domínios ou persistência de barramento de eventos assíncronos.

---

# WAVE 2 SPECIFICATION: TPM Foundation (Fundações do TPM)

## Objetivo
Desenvolver o validador utilitário externo do TPM e integrá-lo ao Pipeline de Build (CI) para realizar auditoria estática automatizada e impedir a integração de modificações de código que violem Clean Architecture, acoplamentos do Context Map, segurança de secrets e integridade de pacotes de terceiros.

## Problema Resolvido
Degradação silenciosa da modularidade e Clean Architecture por imports cruzados ou SQL Raw no código, commits contendo secrets expostas na base do Git, introdução de pacotes NPM vulneráveis de terceiros sem análise prévia e falta de atestado e visibilidade sobre o score técnico de confiança do projeto.

## Escopo
*   Desenvolvimento do motor de regras (Rules Engine Core) e interpretador de asserções do TPM.
*   Desenvolvimento do motor de escaneamento de arquivos TypeScript (Policy Evaluation Engine).
*   Codificação dos validadores de arquitetura e DDD (Clean Architecture e proibição de SQL Raw em controllers).
*   Codificação dos validadores de propriedade de dados no banco PostgreSQL por domínio.
*   Codificação do validador de acoplamento de diretórios de Bounded Contexts.
*   Codificação da validação de dependências entre Bounded Contexts de acordo com o Context Map.
*   Codificação do scanner estático contra credenciais expostas no Git.
*   Codificação do analisador de vulnerabilidades conhecidas em bibliotecas do NPM.
*   Codificação do validador de imutabilidade de eventos de domínio e linguagem ubíqua no código.
*   Codificação do verificador de arquivos vazios e código morto.
*   Desenvolvimento do calculador de Score de Confiança técnica e do gerador de relatórios e relatórios assinados eletronicamente.
*   Configuração do Build Gate que falha o pipeline de CI do repositório se houver desvios graves.

## Features Incluídas
*   **Architecture Validation** (F-W2-01-01, F-W2-01-02, F-W2-01-03, F-W2-01-04)
*   **Domain Validation** (F-W2-02-01, F-W2-02-02, F-W2-02-03, F-W2-02-04, F-W2-02-05)
*   **Dependency Validation** (F-W2-03-01)
*   **Security Validation** (F-W2-04-01)
*   **Hygiene Validation** (F-W2-05-01)
*   **Audit Validation** (F-W2-06-01, F-W2-07-04)
*   **TPM Rules Engine** (F-W2-07-01, F-W2-07-02, F-W2-07-03)

## Dependências
*   `F-W0-04-01: Policies Definition` (Wave 0): Fornece o arquivo de configurações de asserções lidas pelo motor de regras.
*   `F-W1-05-01: Log de Acesso Audit` (Wave 1): Fornece os esquemas e modelos de log de auditoria no banco PostgreSQL.

## Entregáveis
*   Aplicação CLI utilitária executável do TPM em TypeScript (`/tpm/...`).
*   Arquivo de script de workflow de integração contínua (ex: `.github/workflows/tpm-pipeline.yml`).
*   Calculador e formatador de relatórios (JSON/Markdown) e gerador de certificado eletrônico assinado com metadados do build.

## Critérios de Aceite
*   O utilitário do TPM deve analisar estaticamente todos os arquivos do repositório modificados na pull request a partir do terminal da CI.
*   O pipeline de CI deve quebrar e falhar (`exit 1`) caso o validador identifique:
    *   Arquivos fora das pastas de persistência contendo queries SQL brutas.
    *   Imports síncronos de repositórios/entidades de terceiros que violem o Context Map.
    *   Instâncias de gravação direta em tabelas fora do domínio do módulo chamador.
    *   Chaves de criptografia, tokens ou senhas hardcoded em arquivos rastreados pelo Git.
    *   Vulnerabilidades graves (CVEs críticas) nas bibliotecas NPM importadas no `package.json`.
*   O validador deve emitir parecer detalhado em formato JSON/Markdown especificando arquivo, número da linha e severidade de cada desvio técnico.
*   Em execuções limpas (sem erros graves), deve ser gerado o certificado de confiança contendo o hash assinado da conformidade.

## Definition of Done (DoD)
*   Utilitário do TPM implementado, com testes automatizados de comportamento cobrindo 100% de detecção de erros intencionais e cobertura de sucesso, e pipeline de CI configurado com o TPM atuando como portão impeditivo de merges.

## Evidências Esperadas
*   Workflow de CI ativo no Git e relatórios de execução de pipeline evidenciando o bloqueio de commits contendo falhas de Clean Arch ou secrets expostas.

## Riscos
*   **Lentidão no build da CI**: O processamento em massa de arquivos de código a cada push pode atrasar o ciclo de entrega.
    *   *Mitigação*: Configurar o validador para realizar varreduras diferenciais, processando apenas os arquivos modificados em comparação com a branch de destino via `git diff --name-only`.
*   **Falsos positivos quebrando entregas válidas**: Regras excessivamente rígidas podem inviabilizar correções rápidas de bugs.
    *   *Mitigação*: Lançar inicialmente as checagens com nível de severidade WARNING por 15 dias, tornando-as bloqueantes (ERROR) de forma incremental.

## Exclusões de Escopo
*   Refatoração física do banco de dados, migrações de dados, orquestração de workflows do BPM, desenvolvimento de RAG/pgvector ou chamadas reais a LLMs.

---

# ENGINEERING EXECUTION MODEL (Modelo de Execução de Engenharia)

## Ordem Recomendada de Implementação

### Wave 0 — Architecture Baseline
1.  **Pasta e Arquivos ADR (F-W0-01-01)**: Criar o diretório `/docs/adr/` e commitar as ADR-001 a ADR-007.
2.  **Manuais Arquiteturais (F-W0-02-01 e F-W0-03-01)**: Publicar o manual de Clean Architecture e de propriedade de dados por domínio.
3.  **Configurações do TPM (F-W0-04-01)**: Criar e comitar o arquivo de políticas configuráveis `tpm.yaml` na raiz do projeto.

### Wave 1 — Security Foundation
1.  **Tokens em Cookies (F-W1-01-01 e F-W1-02-01)**: Refatorar o tráfego do token JWT para cookies de sessão no Fastify e Next.js.
2.  **Políticas de CORS (F-W1-03-01)**: Remover wildcards de CORS e configurar domínios parametrizados na API e no Caddyfile.
3.  **Limitação de Taxa (F-W1-04-01)**: Configurar middleware de rate limiting na rota de login do backend Fastify.
4.  **Tabela de Auditoria (F-W1-05-01)**: Criar tabela e modelo de logs de auditoria de acessos no PostgreSQL.

### Wave 2 — TPM Foundation
1.  **Núcleo da Engine (F-W2-07-01 e F-W2-07-02)**: Desenvolver o motor do parser de regras e scanner de arquivos TS/JS do TPM.
2.  **Scanners de DDD e Clean Arch (F-W2-01-01, F-W2-01-02, F-W2-02-02, F-W2-02-05 e F-W2-02-01)**: Implementar as validações de divisões de pastas, acoplamentos de domínios e bloqueio de queries raw e escrita cruzada no banco.
3.  **Scanners de Segurança e Dependências (F-W2-03-01 e F-W2-04-01)**: Acoplar as validações de secrets expostos no Git e análise de CVEs críticas em bibliotecas NPM.
4.  **Higiene e Auditoria (F-W2-02-03, F-W2-02-04, F-W2-05-01, F-W2-07-03, F-W2-07-04, F-W2-01-03 e F-W2-06-01)**: Adicionar scanners de higiene, imutabilidade de eventos, termos ubíquos, calculadora de score técnico e emissor de pareceres e certificados assinados.
5.  **Build Gate na CI (F-W2-01-04)**: Integrar o script bloqueante ao arquivo de configuração de workflow de CI.

---

## Estratégia de Testes

### Wave 0 — Architecture Baseline
*   Validação estática de formato Markdown das ADRs.
*   Validação sintática do arquivo de esquema das políticas base `tpm.yaml` (utilizando Markdown linters e YAML parsers).

### Wave 1 — Security Foundation
*   **Testes Unitários**: Testar a codificação e decodificação do JWT a partir de cookies HTTP.
*   **Testes de Integração**: Simular requisições de origens cross-origin invasoras para verificar o bloqueio de CORS. Enviar requisições em rajada (acima do limite) nas rotas de login para verificar o retorno de HTTP 429. Inspecionar o banco relacional para garantir a gravação do log de auditoria.

### Wave 2 — TPM Foundation
*   **Testes Unitários**: Criar suíte de testes unitários isolada na aplicação do TPM para testar o parser de regras e os cálculos de pontuação técnica.
*   **Testes de Integração**: Criar cenários de testes locais (arquivos mockados contendo SQL Raw em controllers, chaves privadas e imports desautorizados) para certificar o correto acionamento do scanner estático e a quebra do processo da pipeline com status de erro.

---

## Estratégia de Validação TPM

### Wave 0 — Architecture Baseline
*   Revisão por pares para atestar a consistência do dicionário de domínios e do manual de Clean Architecture contra a linguagem ubíqua oficial.

### Wave 1 — Security Foundation
*   Auditoria manual de cookies e conexões no console de rede do navegador.
*   O utilitário do TPM (assim que ativado na Wave 2) executa uma varredura estática retroativa em busca de segredos expostos e flags de cookies ausentes no código do QualitiOS.

### Wave 2 — TPM Foundation
*   Auto-validação: O utilitário do TPM executa suas próprias asserções e regras de Clean Architecture sobre si mesmo no pipeline, garantindo conformidade.

---

## Critérios de Go/No-Go

### Wave 0 — Architecture Baseline
*   **Go**: Todos os 4 arquivos de baseline criados, semanticamente corretos, commitados na branch principal e aprovados.
*   **No-Go**: Qualquer pendência conceitual de propriedade de dados ou desacordo de decisões arquiteturais chaves (ADRs).

### Wave 1 — Security Foundation
*   **Go**: Autenticação via cookies seguros funcionando com SSR do Next.js, rate limit bloqueando rajadas de requisições e logs gravando no banco sem vulnerabilidades aparentes.
*   **No-Go**: Falha na persistência de cookies no SSR do Next.js ou token JWT vazado no client-side.

### Wave 2 — TPM Foundation
*   **Go**: A esteira de CI quebra pull requests contendo falhas críticas ou segredos expostos, e emite com sucesso o relatório e certificado eletrônico assinado para pull requests limpas.
*   **No-Go**: Tempo de execução da esteira do TPM na CI superior a 3 minutos ou excesso de falsos positivos quebrando builds corretas do time.

---

# JULES HANDOFF (Passagem para Desenvolvimento)

## Wave 0 — Architecture Baseline

### Contexto
Estabelecer as diretrizes e regras que orientarão toda a engenharia de software e validações automáticas de qualidade do ecossistema QualitiOS + TPM.

### Objetivo
Commitar na branch principal a infraestrutura documental de governança técnica (ADRs, manual Clean Arch/DDD, dicionário de tabelas e arquivo de políticas do TPM).

### Entradas
*   Especificações de domínios e a relação de 7 ADRs mapeadas na baseline.

### Saídas Esperadas
*   Diretório `/docs/adr/` preenchido.
*   Manuais de Clean Architecture e DDD publicados.
*   Arquivo de configurações base `tpm.yaml` gravado na raiz do projeto.

### Restrições Arquiteturais
*   As especificações devem respeitar o desacoplamento de camadas conceituais e os limites físicos de domínios definidos na baseline.

### Restrições TPM
*   O arquivo `tpm.yaml` deve respeitar o esquema de regras e pesos parametrizados, pronto para ser lido pelo motor do validador na Wave 2.

### Critérios de Aprovação
*   100% dos documentos commitados na branch principal, semanticamente corretos e integrados, sem termos tecnologicamente acoplados nas definições teóricas.

---

## Wave 1 — Security Foundation

### Contexto
Blindagem de segurança imediata de tempo de execução (Runtime Security) do QualitiOS no frontend (Presentation Layer) e backend (Application Layer).

### Objetivo
Substituir o localStorage por cookies seguros, fechar furos de CORS no arquivo de ambiente, limitar taxa de acessos por IP e gravar logs imutáveis de logins no PostgreSQL.

### Entradas
*   Variáveis de ambiente do `.env.example`, base PostgreSQL ativa e endpoints de login vigentes.

### Saídas Esperadas
*   Autenticação JWT trafegada por cookies HttpOnly, Secure e SameSite=Strict.
*   CORS configurado sem wildcards.
*   Rate limiting ativo na rota `/auth/login`.
*   Tabela `auditoria_logs` populada automaticamente a cada login ou tentativa falha.

### Restrições Arquiteturais
*   Tokens JWT de sessão não devem estar acessíveis de forma alguma no frontend do client-side via JavaScript.

### Restrições TPM
*   O código de segurança desenvolvido deve estar em conformidade com as regras estáticas de segurança parametrizadas no `tpm.yaml` da Wave 0.

### Critérios de Aprovação
*   Navegador bloqueando conexões cross-origin não listadas, requisições repetidas de login recebendo HTTP 429 e tentativas de login gerando registros indeléveis no PostgreSQL.

---

## Wave 2 — TPM Foundation

### Contexto
Construção do validador contínuo automatizado do TPM integrado à esteira de CI do repositório.

### Objetivo
Codificar o motor de regras estáticas, scanners de arquitetura, domínio, segurança, dependências e higiene, calculadora de pontuação de integridade e o portão bloqueante na CI (Build Gate).

### Entradas
*   Arquivo de políticas base `tpm.yaml` (Wave 0) e repositório de código ativo do QualitiOS.

### Saídas Esperadas
*   Aplicação CLI utilitária do TPM (`/tpm/...`) ativa.
*   Pipeline de CI configurado acionando o validador.
*   Relatórios de desvios e certificado eletrônico assinado com metadados do build gerados com sucesso.

### Restrições Arquiteturais
*   O TPM deve validar conformidade com base em divisões lógicas conceituais da Clean Architecture e limites de domínios, de forma portável e agnóstica de frameworks.

### Restrições TPM
*   O próprio código do TPM deve passar na sua esteira de auto-validação de Clean Architecture no pipeline.

### Critérios de Aprovação
*   O Pipeline de CI falha obrigatoriamente caso um commit contenha queries raw SQL no controller, escrita cruzada no banco de dados, imports proibidos, chaves privadas expostas ou CVEs críticas em pacotes do NPM; commits limpos geram certificado digital assinado de score técnico com sucesso.

---

# EXECUTION CHECKLIST (Checklist de Execução)

### Wave 0 — Architecture Baseline
*   `[ ]` Criar o diretório `/docs/adr/` na raiz do projeto.
*   `[ ]` Criar e comitar os arquivos de ADR-001 a ADR-007 em formato Markdown padrão.
*   `[ ]` Publicar o manual de diretrizes de Clean Architecture no repositório.
*   `[ ]` Publicar a documentação de domínios, Bounded Contexts e propriedade de dados.
*   `[ ]` Criar o arquivo `tpm.yaml` de políticas e pesos do validador.

### Wave 1 — Security Foundation
*   `[ ]` Alterar o fluxo de autenticação para trafegar tokens JWT via HTTP Cookies.
*   `[ ]` Adicionar as tags `HttpOnly`, `Secure` e `SameSite=Strict` aos cookies de sessão.
*   `[ ]` Remover CORS wildcard `*` e configurar domínios autorizados via `.env`.
*   `[ ]` Configurar middleware de Rate Limiting por IP para as rotas de login no backend.
*   `[ ]` Criar tabela e modelo de logs de auditoria de acessos no PostgreSQL.
*   `[ ]` Validar localmente o bloqueio de CORS e o retorno de HTTP 429 em ataques de rajada.

### Wave 2 — TPM Foundation
*   `[ ]` Desenvolver o Rules Engine Core e Policy Evaluation Engine do TPM.
*   `[ ]` Codificar os scanners estáticos de Clean Architecture e banco de dados (SQL Raw).
*   `[ ]` Codificar a validação estática de Bounded Contexts e dependências de domínio contra o Context Map.
*   `[ ]` Codificar os scanners de vulnerabilidades em dependências NPM e de segredos expostos no Git.
*   `[ ]` Codificar o calculador de Trust Score e os emissores de relatórios e certificados.
*   `[ ]` Configurar e integrar o Build Gate bloqueante na pipeline de CI.
*   `[ ]` Habilitar as regras inicialmente em modo WARNING para calibração.
