# Feature Catalog V3 & TPM Finalization — QualitiOS

Este documento apresenta a versão final consolidada do Catálogo de Features V3 do **QualitiOS** em alinhamento completo com o **TPM (Trusted Cognitive Platform)**. As features de governança foram revisadas para remover dependências de frameworks, linguagens ou bancos de dados específicos, assegurando que o TPM seja baseado em princípios e domínios independentes de stack técnica.

---

## 1. AJUSTES DA VERSÃO V3 (Ajustes de Governança TPM)

### 1.1. Novo Épico Adicionado: W2-07 TPM Rules Engine
*   **Objetivo**: Executar políticas de validação arquitetural e segurança de forma totalmente parametrizável e configurável no ecossistema de governança de código.
*   **Responsabilidades**: Carregar arquivos de asserções, avaliar o repositório contra regras ativas, quantificar o nível de confiança (score) e emitir os pareceres consolidados.

### 1.2. Nova Feature Adicionada: F-W2-02-05 Domain Dependency Validation
*   **Epic de Origem**: `W2-02 Domain Validation`
*   **Objetivo**: Validar dependências e fluxos entre Bounded Contexts.
*   **Problema resolvido**: Criação de relações e dependências de domínio não autorizadas que violem o Context Map oficial.
*   **Critério de Aceitação**: O scanner do TPM deve analisar as importações e dependências lógicas da camada de aplicação e sinalizar erro se detectar relações de upstream/downstream que contradigam o Context Map.

### 1.3. Generalização Técnica do TPM
Todas as referências a stacks de tecnologia específicas foram generalizadas para termos abstratos e portáveis:
*   *Fastify* ➔ **Runtime / Server Engine / Application Layer**
*   *PostgreSQL* ➔ **Persistence Layer**
*   *NPM / package.json* ➔ **Package Ecosystem**
*   *GitHub CI / Pipeline* ➔ **Build Pipeline**

---

## 2. METRICAS DE COBERTURA CONSOLIDADAS

```text
======================================================
  MÉTRICAS DE COBERTURA INTEGRAL DO ECOSSISTEMA (V3)
======================================================
  - Epic Coverage:         100% (37 de 37 Epics)
  - Wave Coverage:         100% (8 de 8 Waves)
  - Capability Coverage:   100% (8 de 8 Capabilities)
  - Context Coverage:      100% (8 de 8 Contexts)
======================================================
```

---

## 3. CATALOGO DE FEATURES V3 (Consolidado por Wave)

### Wave 0 — Architecture Baseline
*   **F-W0-01-01: ADR Registry**: Versionamento das decisões arquiteturais na pasta de documentação `/docs/adr/`. (Prioridade: Crítica | Contexto: Governança)
*   **F-W0-02-01: Principles Documentation**: Catálogo oficial de regras de modularidade, Clean Architecture e Bounded Contexts. (Prioridade: Crítica | Contexto: Governança)
*   **F-W0-03-01: Domain Schema Registry**: Dicionário de Bounded Contexts e limites de propriedade de dados. (Prioridade: Crítica | Contexto: Governança)
*   **F-W0-04-01: Policies Definition**: Parâmetros e especificações do validador de score técnico do TPM. (Prioridade: Crítica | Contexto: Governança)

### Wave 1 — Security Foundation
*   **F-W1-01-01: HttpOnly Token Storage**: Transição do envio de tokens JWT no login para cookies protegidos no Server Engine. (Prioridade: Crítica | Contexto: Governança)
*   **F-W1-02-01: Secure Cookie Config**: Flag de cookies de sessão configurados como `HttpOnly`, `Secure` e `SameSite=Strict`. (Prioridade: Crítica | Contexto: Governança)
*   **F-W1-03-01: Restricted Access Domains**: CORS restrito aos domínios autorizados parametrizados no arquivo de ambiente. (Prioridade: Crítica | Contexto: Todos os contextos)
*   **F-W1-04-01: API Rate Limiter**: Middleware de limitação de requisições por IP nas rotas de login do Runtime. (Prioridade: Alta | Contexto: Governança)
*   **F-W1-05-01: Log de Acesso Audit**: Registro imutável de acessos e logins de sistema na tabela de logs da Persistence Layer. (Prioridade: Alta | Contexto: Governança)

### Wave 2 — TPM Foundation
*   **F-W2-01-01: Architecture Rules Registry**: Cadastro de regras de imports Clean Architecture do validador do TPM. (Prioridade: Alta | Contexto: Todos os contextos)
*   **F-W2-01-02: Architecture Scanner**: Motor estático que varre o repositório buscando queries brutas ou dependências proibidas na Application Layer. (Prioridade: Alta | Contexto: Todos os contextos)
*   **F-W2-01-03: Violation Reporter**: Relatório formatado de desvios e inconformidades detectados pelo scanner. (Prioridade: Alta | Contexto: Governança)
*   **F-W2-01-04: Build Gate**: Script do Build Pipeline que impede builds e merges se houver desvios graves de Clean Arch ou segurança. (Prioridade: Alta | Contexto: Governança)
*   **F-W2-02-01: Database Ownership Guard**: Varredura estática impedindo queries cruzadas e garantindo propriedade exclusiva de escrita na Persistence Layer. (Prioridade: Alta | Contexto: Todos os contextos)
*   **F-W2-02-02: Bounded Context Validation**: Scan do TPM bloqueando imports incorretos entre diretórios de contextos. (Prioridade: Alta | Contexto: Todos os contextos)
*   **F-W2-02-03: Event Ownership Validation**: Validação que proíbe modificações da assinatura de eventos fora do domínio proprietário. (Prioridade: Média | Contexto: Todos os contextos)
*   **F-W2-02-04: Ubiquitous Language Validation**: Alerta se tabelas ou código utilizarem jargões obsoletos que desviem do glossário oficial. (Prioridade: Média | Contexto: Todos os contextos)
*   **F-W2-02-05: Domain Dependency Validation**: Validador de dependências entre Bounded Contexts, identificando e quebrando builds se as relações violarem o Context Map oficial. (Prioridade: Alta | Contexto: Todos os contextos)
*   **F-W2-03-01: Package Vulnerability Analyzer**: Verificador contínuo de CVEs em bibliotecas do Package Ecosystem. (Prioridade: Alta | Contexto: Todos os contextos)
*   **F-W2-04-01: Secret Scanner**: Bloqueio de commits no Build Pipeline se forem detectadas chaves privadas ou senhas hardcoded. (Prioridade: Alta | Contexto: Governança)
*   **F-W2-05-01: Code Hygiene Check**: Monitoramento de código duplicado e arquivos órfãos de 0 bytes na Application Layer. (Prioridade: Média | Contexto: Todos os contextos)
*   **F-W2-06-01: Trust Certificate Issuer**: Emissão de log assinado contendo o atestado de score de integridade emitido pelo TPM na pipeline. (Prioridade: Média | Contexto: Governança)
*   **F-W2-07-01: Rules Engine Core**: Carregador e executor das asserções e regras de validação cadastradas no TPM. (Prioridade: Alta | Contexto: Governança)
*   **F-W2-07-02: Policy Evaluation Engine**: Motor de avaliação de regras contra artefatos físicos do projeto no Build Pipeline. (Prioridade: Alta | Contexto: Governança)
*   **F-W2-07-03: Trust Score Calculator**: Algoritmo que calcula dinamicamente o score de confiança técnica com base nas conformidades e falhas encontradas. (Prioridade: Alta | Contexto: Governança)
*   **F-W2-07-04: Trust Report Generator**: Emissor de parecer de conformidade e governança para auditorias. (Prioridade: Alta | Contexto: Governança)

### Wave 3 — Data Consolidation
*   **F-W3-01-01: Repository Boundary Guard**: Controllers acessando a Persistence Layer exclusivamente via repositórios Clean Arch. (Prioridade: Alta | Contexto: Todos os contextos)
*   **F-W3-02-01: Postgres Consolidation**: Execução de scripts de migração e drop físico de tabelas redundantes. (Prioridade: Alta | Contexto: Documentos, Riscos, Compliance)
*   **F-W3-03-01: Integrity Constraint Fix**: Inclusão de chaves estrangeiras seguras e regras de delete nos esquemas unificados da Persistence Layer. (Prioridade: Média | Contexto: Todos os contextos)
*   **F-W3-04-01: Multi-Tenant Tenant Filter**: Inserção automática de escopo de tenant ID nas consultas de banco do JWT. (Prioridade: Alta | Contexto: Todos os contextos)

### Wave 4 — Event Architecture
*   **F-W4-01-01: Domain Events Registry**: Modelagem e cadastro das classes de eventos de domínio. (Prioridade: Média | Contexto: Todos os contextos)
*   **F-W4-02-01: Event Broker Engine**: Despachador assíncrono interno de eventos em background na Application Layer. (Prioridade: Média | Contexto: Todos os contextos)
*   **F-W4-03-01: LMS & Notif Listeners**: Cadastro de listeners que reagem a eventos e disparam ações em LMS e Mensageria. (Prioridade: Média | Contexto: Educação, Documentos)
*   **F-W4-04-01: Event Log Audit**: Registro básico de auditoria de eventos disparados no banco. (Prioridade: Baixa | Contexto: Governança)
*   **F-W4-04-02: DLQ Handling**: Captura e gravação de logs de erros de eventos de background falhos. (Prioridade: Média | Contexto: Governança)
*   **F-W4-04-03: Event Replay**: Rota administrativa para redisparo manual de eventos retidos na DLQ. (Prioridade: Baixa | Contexto: Governança)

### Wave 5 — BPM Evolution
*   **F-W5-01-01: State Transition Enforcer**: Trava transacional impedindo a mudança manual de status fora do BPM na Persistence Layer. (Prioridade: Alta | Contexto: Processos, Documentos, Riscos)
*   **F-W5-01-02: Workflow Definition Engine**: Validador de grafos do BPMN que aprova apenas fluxos coerentes e sem ciclos. (Prioridade: Alta | Contexto: Processos)
*   **F-W5-01-03: Workflow Execution Engine**: Motor transacional que computa e avança etapas do processo. (Prioridade: Alta | Contexto: Processos)
*   **F-W5-02-01: Background SLA Scheduler**: Serviço de background recorrente que gerencia prazos limites e dispara alertas. (Prioridade: Alta | Contexto: Processos)
*   **F-W5-03-01: Transaction State Enforcer**: Garantia de rollback em banco de dados caso uma transição do BPM falhe. (Prioridade: Média | Contexto: Processos)
*   **F-W5-04-01: Audit Trail Process**: Gravação imutável do histórico linear e assinaturas de transições de processos finalizados. (Prioridade: Média | Contexto: Processos)

### Wave 6 — AI Foundation
*   **F-W6-01-01: PDF/Laudo OCR Extractor**: Biblioteca de extração textual de laudos de evidências. (Prioridade: Média | Contexto: Compliance)
*   **F-W6-02-01: pgvector Integration**: Extensão de vetorização ativada na Persistence Layer para armazenamento de embeddings. (Prioridade: Média | Contexto: Compliance, Conhecimento)
*   **F-W6-03-01: RAG Retrieval Engine**: Busca semântica real baseada no contexto vetorial de conformidade. (Prioridade: Média | Contexto: Compliance, Conhecimento)
*   **F-W6-03-02: Prompt Management & Governance**: Versionamento e higienização de prompts contra Prompt Injection. (Prioridade: Alta | Contexto: Compliance)
*   **F-W6-04-01: Ollama/OpenAI Client**: Integração e chamada da API de LLM para triagem cognitiva. (Prioridade: Média | Contexto: Riscos)
*   **F-W6-05-01: Token & Prompt Log Audit**: Gravação detalhada de logs e consumos das capacidades de IA na Persistence Layer. (Prioridade: Baixa | Contexto: Governança)

### Wave 7 — Intelligent Governance
*   **F-W7-01-01: FHIR Automated Checklist**: Integração FHIR preenchendo checklists automaticamente com base no prontuário. (Prioridade: Baixa | Contexto: Compliance)
*   **F-W7-02-01: Reciclagem Event Auto Enroll**: Evento de ocorrência do CRM matriculando o colaborador diretamente em curso de reciclagem no LMS. (Prioridade: Baixa | Contexto: Educação, Riscos)
*   **F-W7-03-01: Indicadores Predict Alerta**: Alertas preditivos preventivos com base nas tendências de KPIs. (Prioridade: Baixa | Contexto: Governança)
*   **F-W7-04-01: SLA Route Bottleneck Graph**: Grafo do dashboard mapeando os maiores pontos de gargalo dos processos. (Prioridade: Baixa | Contexto: Processos)
*   **F-W7-05-01: Unified ONA/BOS Score**: Dashboard executivo unificado da qualidade atestado pelo selo de integridade do TPM. (Prioridade: Baixa | Contexto: Governança, Compliance)

---

## 4. MATRIZES DE RELACIONAMENTO V3 (Rastreabilidade)

### 4.1. Feature ➔ Epic Matrix V3 (Novas Adições)

| Feature ID | Epic de Origem | Relação de Valor |
| :--- | :--- | :--- |
| **F-W2-07-01** | `W2-07 TPM Rules Engine` | Core de leitura das regras parametrizadas. |
| **F-W2-07-02** | `W2-07 TPM Rules Engine` | Validador ativo dos arquivos físicos. |
| **F-W2-07-03** | `W2-07 TPM Rules Engine` | Medidor do score técnico de confiança. |
| **F-W2-07-04** | `W2-07 TPM Rules Engine` | Emissor do relatório de conformidade. |
| **F-W2-02-05** | `W2-02 Domain Validation` | Impede violações do Context Map no código. |

### 4.2. Feature ➔ Capability Matrix V3 (Novas Adições)

| Feature ID | Governança | Compliance | Processos | Documentos | Riscos | RBAC | Auditoria |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **F-W2-07-01** | X | | | | | | |
| **F-W2-07-02** | X | | | | | | |
| **F-W2-07-03** | X | | | | | | |
| **F-W2-07-04** | | | | | | | X |
| **F-W2-02-05** | X | | | | | | |

### 4.3. Feature Dependency Matrix V3 (Novas Adições)

| Feature ID Target | Features Bloqueantes / Pré-requisitos (Upstream) |
| :--- | :--- |
| **F-W2-07-01** | `F-W0-04-01` (Policies Definition) |
| **F-W2-07-02** | `F-W2-07-01` (Rules Engine Core) |
| **F-W2-07-03** | `F-W2-07-02` (Policy Evaluation Engine) |
| **F-W2-07-04** | `F-W2-07-03` (Trust Score Calculator) |
| **F-W2-02-05** | `F-W2-02-02` (Bounded Context Validation) |
