# Feature Decomposition (V1) — QualitiOS

Este documento consolida o detalhamento das Features do **QualitiOS** e do **TPM (Trusted Cognitive Platform)**, mapeando os requisitos de conformidade, dependências e critérios de aceitação tática de cada componente para a materialização dos Épicos de Produto e Arquitetura.

---

## 1. FEATURES DECOMPOSITION BY WAVES (Features por Onda)

### 1.1. Wave 0 — Architecture Baseline (Alinhamento Inicial)

#### Feature ID: F-W0-02-01
*   **Nome**: Principles Documentation
*   **Objetivo**: Criar e versionar o catálogo de regras e princípios arquiteturais no repositório.
*   **Problema resolvido**: Falta de documentação para guiar refatorações modulares.
*   **Epic de origem**: `W0-02 Architecture Principles Registry`
*   **Capability impactada**: Governança.
*   **Contexto impactado**: Governança.
*   **Dependências**: `ADR Governance (Epic W0-01)`.
*   **Critérios de aceitação**: Documento markdown oficial presente e descrevendo as 3 camadas da Clean Architecture.
*   **Prioridade**: Crítica.

#### Feature ID: F-W0-04-01
*   **Nome**: Policies Definition
*   **Objetivo**: Definir o conjunto de asserções lógicas que a esteira do TPM executará.
*   **Problema resolvido**: Indefinição técnica sobre quais critérios atestam "confiança" no repositório.
*   **Epic de origem**: `W0-04 TPM Policies Registry`
*   **Capability impactada**: Governança.
*   **Contexto impactado**: Governança.
*   **Dependências**: `Principles Documentation (F-W0-02-01)`.
*   **Critérios de aceitação**: Arquivo de definição de score do TPM criado e mapeando regras de bloqueio.
*   **Prioridade**: Crítica.

---

### 1.2. Wave 1 — Security Foundation (Base de Segurança)

#### Feature ID: F-W1-01-01
*   **Nome**: HttpOnly Token Storage
*   **Objetivo**: Migrar o envio de tokens JWT no login de localStorage para Cookies no Fastify.
*   **Problema resolvido**: Risco de vazamento de sessões de usuários via scripts maliciosos (XSS).
*   **Epic de origem**: `W1-01 Session Security`
*   **Capability impactada**: RBAC, Governança.
*   **Contexto impactado**: Governança.
*   **Dependências**: `Policies Definition (F-W0-04-01)`.
*   **Critérios de aceitação**: Requisições de login retornando o token no cabeçalho `Set-Cookie` com a flag `HttpOnly` ativa.
*   **Prioridade**: Crítica.

#### Feature ID: F-W1-03-01
*   **Nome**: Restricted Access Domains
*   **Objetivo**: Substituir o CORS wildcard `*` por origens restritas parametrizadas no `.env`.
*   **Problema resolvido**: Chamadas cross-origin inseguras por qualquer domínio malicioso da internet.
*   **Epic de origem**: `W1-03 CORS Hardening`
*   **Capability impactada**: Governança.
*   **Contexto impactado**: Todos os contextos.
*   **Dependências**: `HttpOnly Token Storage (F-W1-01-01)`.
*   **Critérios de aceitação**: API rejeitando requisições com status HTTP 403 se a origem do cabeçalho não estiver cadastrada.
*   **Prioridade**: Crítica.

---

### 1.3. Wave 2 — TPM Foundation (Fundações de Governança TPM)

#### Feature ID: F-W2-01-01
*   **Nome**: Architecture Rules Registry
*   **Objetivo**: Cadastrar as regras de Clean Architecture que o validador deve impor.
*   **Problema resolvido**: Falta de assertiva para varredura contínua de pastas e imports.
*   **Epic de origem**: `W2-01 Architecture Validation`
*   **Capability impactada**: Governança.
*   **Contexto impactado**: Todos os contextos.
*   **Dependências**: `Policies Definition (F-W0-04-01)`.
*   **Critérios de aceitação**: Arquivo JSON/YAML mapeando os caminhos e restrições de imports válidos por camadas.
*   **Prioridade**: Alta.

#### Feature ID: F-W2-01-02
*   **Nome**: Architecture Scanner
*   **Objetivo**: Implementar o motor de varredura estática de imports e estruturas de código.
*   **Problema resolvido**: Código-fonte de novas branches quebrando as divisões de Bounded Contexts.
*   **Epic de origem**: `W2-01 Architecture Validation`
*   **Capability impactada**: Governança.
*   **Contexto impactado**: Todos os contextos.
*   **Dependências**: `Architecture Rules Registry (F-W2-01-01)`.
*   **Critérios de aceitação**: Execução local do scanner sinalizando erro se um Controller fizer requisição direta SQL Raw.
*   **Prioridade**: Alta.

#### Feature ID: F-W2-01-03
*   **Nome**: Violation Reporter
*   **Objetivo**: Formatar o relatório estruturado contendo os desvios de Clean Architecture encontrados.
*   **Problema resolvido**: Desenvolvedor sem visibilidade clara de onde e por que a build quebrou.
*   **Epic de origem**: `W2-01 Architecture Validation`
*   **Capability impactada**: Governança.
*   **Contexto impactado**: Governança.
*   **Dependências**: `Architecture Scanner (F-W2-01-02)`.
*   **Critérios de aceitação**: Relatório gerado no terminal listando arquivos, linhas e a regra violada.
*   **Prioridade**: Alta.

#### Feature ID: F-W2-01-04
*   **Nome**: Build Gate
*   **Objetivo**: Bloquear pipelines de CI ao identificar violações críticas.
*   **Problema resolvido**: Código com desvio arquitetural grave subindo para produção.
*   **Epic de origem**: `W2-01 Architecture Validation`
*   **Capability impactada**: Governança.
*   **Contexto impactado**: Governança.
*   **Dependências**: `Violation Reporter (F-W2-01-03)`.
*   **Critérios de aceitação**: Pipeline falhando e retornando status 1 se houver erros de segurança ou arquitetura críticos.
*   **Prioridade**: Alta.

#### Feature ID: F-W2-02-01
*   **Nome**: Database Ownership Guard
*   **Objetivo**: Varrer o código impedindo escritas cruzadas diretas em tabelas fora do contexto.
*   **Problema resolvido**: Violação de propriedade de dados entre Bounded Contexts.
*   **Epic de origem**: `W2-02 Domain Validation`
*   **Capability impactada**: Governança.
*   **Contexto impactado**: Todos os contextos.
*   **Dependências**: `Build Gate (F-W2-01-04)`.
*   **Critérios de aceitação**: Scanner bloqueando builds se detectar queries que tentem atualizar tabelas de outros contextos.
*   **Prioridade**: Alta.

#### Feature ID: F-W2-03-01
*   **Nome**: Package Vulnerability Analyzer
*   **Objetivo**: Varrer pacotes NPM na esteira de integração em busca de CVEs conhecidas.
*   **Problema resolvido**: Risco de ataques de cadeia de suprimentos de software por dependências desatualizadas.
*   **Epic de origem**: `W2-03 Dependency Validation`
*   **Capability impactada**: Governança.
*   **Contexto impactado**: Todos os contextos.
*   **Dependências**: `Build Gate (F-W2-01-04)`.
*   **Critérios de aceitação**: Integração de scanner de vulnerabilidade que quebra a build se houver pacotes com CVE crítica ou alta.
*   **Prioridade**: Alta.

#### Feature ID: F-W2-04-01
*   **Nome**: Secret Scanner
*   **Objetivo**: Rastrear commits em branches de desenvolvimento para impedir chaves privadas e senhas expostas.
*   **Problema resolvido**: Exposição de tokens sensíveis e senhas de banco de dados em repositórios.
*   **Epic de origem**: `W2-04 Security Validation`
*   **Capability impactada**: Governança.
*   **Contexto impactado**: Governança.
*   **Dependências**: `Build Gate (F-W2-01-04)`.
*   **Critérios de aceitação**: Commit abortado se for detectado padrão de chaves privadas ou senhas de banco.
*   **Prioridade**: Alta.

#### Feature ID: F-W2-05-01
*   **Nome**: Code Hygiene Check
*   **Objetivo**: Escanear branches em busca de código órfão ou duplicações lógicas.
*   **Problema resolvido**: Degradação contínua da base por acúmulo de arquivos legados ou duplicados.
*   **Epic de origem**: `W2-05 Hygiene Validation`
*   **Capability impactada**: Governança.
*   **Contexto impactado**: Todos os contextos.
*   **Dependências**: `Build Gate (F-W2-01-04)`.
*   **Critérios de aceitação**: Alerta emitido na revisão do PR se a taxa de código duplicado exceder 15%.
*   **Prioridade**: Média.

#### Feature ID: F-W2-06-01
*   **Nome**: Trust Certificate Issuer
*   **Objetivo**: Gerar o manifesto de integridade técnica assinado contendo os dados do TPM.
*   **Problema resolvido**: Ausência de comprovação de que o build foi governado e validado.
*   **Epic de origem**: `W2-06 Audit Validation`
*   **Capability impactada**: Auditoria.
*   **Contexto impactado**: Governança.
*   **Dependências**: `Build Gate (F-W2-01-04)`.
*   **Critérios de aceitação**: Arquivo de log JSON criptografado e emitido na pasta de artefatos a cada PR mergeado.
*   **Prioridade**: Média.

---

### 1.4. Wave 3 — Data Consolidation (Consolidação de Dados)

#### Feature ID: F-W3-02-01
*   **Nome**: Tabelas PostgreSQL Unificadas
*   **Objetivo**: Unificar dados de incidentes e checklists legados e dropar as tabelas redundantes.
*   **Problema resolvido**: Inconsistências de dados por replicação de banco de dados.
*   **Epic de origem**: `W3-02 Legacy Consolidation`
*   **Capability impactada**: Documentos, Riscos, Compliance.
*   **Contexto impactado**: Documentos, Riscos, Compliance.
*   **Dependências**: `Database Ownership Guard (F-W2-02-01)`.
*   **Critérios de aceitação**: 100% dos dados unificados e tabelas `ona_requisitos` e `incidentes` removidas fisicamente.
*   **Prioridade**: Alta.

---

### 1.5. Wave 4 — Event Architecture (Arquitetura de Eventos)

#### Feature ID: F-W4-02-01
*   **Nome**: Event Broker
*   **Objetivo**: Desenvolver o despachador assíncrono interno de eventos no Fastify.
*   **Problema resolvido**: Latência de requisições e acoplamento de código.
*   **Epic de origem**: `W4-02 Internal Event Bus`
*   **Capability impactada**: Governança.
*   **Contexto impactado**: Todos os contextos.
*   **Dependências**: `Tabelas PostgreSQL Unificadas (F-W3-02-01)`.
*   **Critérios de aceitação**: Lançamento de evento disparando listeners sem reter o ciclo de resposta HTTP da rota.
*   **Prioridade**: Média.

---

### 1.6. Wave 5 — BPM Evolution (Evolução do BPM)

#### Feature ID: F-W5-01-01
*   **Nome**: State Transition Enforcer
*   **Objetivo**: Bloquear transição de status no banco se ela não for chancelada pelo workflow BPM.
*   **Problema resolvido**: Burlar fluxos e SLAs de auditoria de POPs e CAPAs.
*   **Epic de origem**: `W5-01 Workflow Orchestration`
*   **Capability impactada**: Processos, Documentos, Riscos.
*   **Contexto impactado**: Processos, Documentos, Riscos.
*   **Dependências**: `Event Broker (F-W4-02-01)`.
*   **Critérios de aceitação**: Erro 400 retornado se o usuário tentar mover um POP diretamente para "Vigente" pulando aprovações.
*   **Prioridade**: Alta.

---

### 1.7. Wave 6 — AI Foundation (IA Real)

#### Feature ID: F-W6-02-01
*   **Nome**: pgvector Integration
*   **Objetivo**: Ativar a extensão `pgvector` no PostgreSQL e expor a tabela de embeddings.
*   **Problema resolvido**: Arrays vetoriais randômicos mockados em laudos de conformidade.
*   **Epic de origem**: `W6-02 Embeddings Infrastructure`
*   **Capability impactada**: Compliance, Conhecimento.
*   **Contexto impactado**: Compliance, Conhecimento.
*   **Dependências**: `Tabelas PostgreSQL Unificadas (F-W3-02-01)`.
*   **Critérios de aceitação**: Banco persistindo vetores e executando buscas por distância cosseno com sucesso.
*   **Prioridade**: Média.

---

### 1.8. Wave 7 — Intelligent Governance (Governança Inteligente)

#### Feature ID: F-W7-01-01
*   **Nome**: FHIR Automated Checklist
*   **Objetivo**: Integrar o conector FHIR real para autopreenchimento de checklists com base em logs de leito.
*   **Problema resolvido**: Preenchimento manual demorado e sujeito a fraude de evidências.
*   **Epic de origem**: `W7-01 Autonomous Compliance`
*   **Capability impactada**: Compliance, Integrações.
*   **Contexto impactado**: Compliance.
*   **Dependências**: `pgvector Integration (F-W6-02-01)`, `LLM Integration (Epic W6-04)`.
*   **Critérios de aceitação**: Coleta automática de exames e logs do prontuário preenchendo checklists ONA correspondentes.
*   **Prioridade**: Baixa.

---

## 2. MATRICES DE RELACIONAMENTO (MATRICES)

### 2.1. Feature ➔ Epic Matrix

| Feature ID | Epic de Origem | Relação de Valor |
| :--- | :--- | :--- |
| **F-W0-02-01** | `W0-02 Architecture Principles Registry` | Documenta as asserções de engenharia que o TPM fiscalizará. |
| **F-W0-04-01** | `W0-04 TPM Policies Registry` | Cria os parâmetros lógicos do score de confiança da esteira. |
| **F-W1-01-01** | `W1-01 Session Security` | Protege a sessão JWT contra XSS (requisito básico do TPM). |
| **F-W1-03-01** | `W1-03 CORS Hardening` | Impede o vazamento de requisições de origens não registradas. |
| **F-W2-01-01** | `W2-01 Architecture Validation` | Configura as regras Clean Architecture do scanner TPM. |
| **F-W2-01-02** | `W2-01 Architecture Validation` | Motor que varre código e imports impedindo acoplamento. |
| **F-W2-01-03** | `W2-01 Architecture Validation` | Emite no terminal os desvios de Clean Arch identificados. |
| **F-W2-01-04** | `W2-01 Architecture Validation` | Trava commits de deploy na CI se o score técnico falhar. |
| **F-W2-02-01** | `W2-02 Domain Validation` | Impede chamadas cruzadas de escrita de banco no QualitiOS. |
| **F-W2-03-01** | `W2-03 Dependency Validation` | Varre pacotes vulneráveis no package.json contra CVEs. |
| **F-W2-04-01** | `W2-04 Security Validation` | Impede a subida de chaves privadas e segredos de banco. |
| **F-W2-05-01** | `W2-05 Hygiene Validation` | Monitora a ocorrência de arquivos órfãos ou duplicados. |
| **F-W2-06-01** | `W2-06 Audit Validation` | Assina o manifesto contendo o log do score técnico do TPM. |
| **F-W3-02-01** | `W3-02 Legacy Consolidation` | Dropa fisicamente tabelas redundantes após migração. |
| **F-W4-02-01** | `W4-02 Internal Event Bus` | Viabiliza comunicação assíncrona desacoplada na API Fastify. |
| **F-W5-01-01** | `W5-01 Workflow Orchestration` | Força que transições de POPs e CAPAs passem pelo BPM. |
| **F-W6-02-01** | `W6-02 Embeddings Infrastructure` | Ativa a extensão pgvector e unifica a base com suporte a IA. |
| **F-W7-01-01** | `W7-01 Autonomous Compliance` | Conecta os endpoints FHIR ativos a checklists regulatórios. |

---

### 2.2. Feature ➔ Capability Matrix

| Feature ID | Governança | Compliance | Educação | Processos | Documentos | Riscos | RBAC | Auditoria |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **F-W0-02-01** | X | | | | | | | |
| **F-W1-01-01** | X | | | | | | X | |
| **F-W1-03-01** | X | | | | | | | |
| **F-W2-01-02** | X | | | | | | | |
| **F-W2-02-01** | X | | | | | | | |
| **F-W2-03-01** | X | | | | | | | |
| **F-W2-04-01** | X | | | | | | | |
| **F-W2-06-01** | | | | | | | | X |
| **F-W3-02-01** | | X | | | X | X | | |
| **F-W4-02-01** | X | | | | | | | |
| **F-W5-01-01** | | | | X | X | X | | |
| **F-W6-02-01** | | X | | | | | | |
| **F-W7-01-01** | | X | | | | | | |

---

### 2.3. Feature ➔ Context Matrix

| Feature ID | Gov. | Estrat. | Compl. | Educ. | Conhec. | Proc. | Docum. | Riscos |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **F-W0-04-01** | X | | | | | | | |
| **F-W1-01-01** | X | | | | | | | |
| **F-W2-01-02** | X | X | X | X | X | X | X | X |
| **F-W2-02-01** | X | X | X | X | X | X | X | X |
| **F-W2-03-01** | X | X | X | X | X | X | X | X |
| **F-W2-06-01** | X | | | | | | | |
| **F-W3-02-01** | | | X | | | | X | X |
| **F-W4-02-01** | X | X | X | X | X | X | X | X |
| **F-W5-01-01** | | | | | | X | X | X |
| **F-W6-02-01** | | | X | | X | | | |
| **F-W7-01-01** | | | X | | | | | |

---

### 2.4. Feature ➔ Wave Matrix

| Feature ID | Wave 0 | Wave 1 | Wave 2 | Wave 3 | Wave 4 | Wave 5 | Wave 6 | Wave 7 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **F-W0-02-01** | X | | | | | | | |
| **F-W0-04-01** | X | | | | | | | |
| **F-W1-01-01** | | X | | | | | | |
| **F-W1-03-01** | | X | | | | | | |
| **F-W2-01-02** | | | X | | | | | |
| **F-W2-02-01** | | | X | | | | | |
| **F-W2-03-01** | | | X | | | | | |
| **F-W2-06-01** | | | X | | | | | |
| **F-W3-02-01** | | | | X | | | | |
| **F-W4-02-01** | | | | | X | | | |
| **F-W5-01-01** | | | | | | X | | |
| **F-W6-02-01** | | | | | | | X | |
| **F-W7-01-01** | | | | | | | | X |

---

### 2.5. Feature Dependency Matrix (Matriz de Dependências)

| Feature ID Target | Features Bloqueantes / Pré-requisitos (Upstream) |
| :--- | :--- |
| **F-W0-04-01** | `F-W0-02-01` |
| **F-W1-01-01** | `F-W0-04-01` |
| **F-W1-03-01** | `F-W1-01-01` |
| **F-W2-01-01** | `F-W0-04-01` |
| **F-W2-01-02** | `F-W2-01-01` |
| **F-W2-01-03** | `F-W2-01-02` |
| **F-W2-01-04** | `F-W2-01-03` |
| **F-W2-02-01** | `F-W2-01-04` |
| **F-W2-03-01** | `F-W2-01-04` |
| **F-W2-04-01** | `F-W2-01-04` |
| **F-W2-05-01** | `F-W2-01-04` |
| **F-W2-06-01** | `F-W2-01-04` |
| **F-W3-02-01** | `F-W2-02-01` |
| **F-W4-02-01** | `F-W3-02-01` |
| **F-W5-01-01** | `F-W4-02-01` |
| **F-W6-02-01** | `F-W3-02-01` |
| **F-W7-01-01** | `F-W6-02-01` |
