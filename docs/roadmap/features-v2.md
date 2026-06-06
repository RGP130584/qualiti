# Feature Catalog V2 & Completeness Review — QualitiOS

Este documento apresenta a Revisão de Completude de Features (Feature Completeness Review) e o Catálogo de Features V2 do **QualitiOS** e do **TPM (Trusted Cognitive Platform)**, garantindo que 100% dos Épicos de Produto e Arquitetura mapeados no roadmap estejam cobertos de forma integral e sem lacunas operacionais.

---

## 1. EPIC COVERAGE ANALYSIS (Análise de Cobertura dos Épicos)

Após a revisão do catálogo de features anterior, todas as iniciativas foram expandidas para assegurar que cada um dos 36 Épicos oficiais possua representação funcional completa. **Nenhum Épico permanece classificado como Parcialmente Coberto ou Não Coberto.**

| Onda / Épico ID | Nome do Épico | Features Coadjuvantes | Status de Cobertura |
| :--- | :--- | :--- | :--- |
| **Wave 0 — ADR Governance (W0-01)** | ADR Governance | F-W0-01-01 (ADR Registry) | **Totalmente Coberto** |
| **Wave 0 — Principles Reg. (W0-02)** | Architecture Principles Registry | F-W0-02-01 (Principles Doc) | **Totalmente Coberto** |
| **Wave 0 — Domain Registry (W0-03)** | Domain Registry | F-W0-03-01 (Domain Schema Reg) | **Totalmente Coberto** |
| **Wave 0 — TPM Policies (W0-04)** | TPM Policies Registry | F-W0-04-01 (Policies Def) | **Totalmente Coberto** |
| **Wave 1 — Session Sec. (W1-01)** | Session Security | F-W1-01-01 (HttpOnly Token Storage) | **Totalmente Coberto** |
| **Wave 1 — Cookie Sec. (W1-02)** | Cookie Security | F-W1-02-01 (Secure Cookie Config) | **Totalmente Coberto** |
| **Wave 1 — CORS Hardening (W1-03)**| CORS Hardening | F-W1-03-01 (Restricted Access Domains)| **Totalmente Coberto** |
| **Wave 1 — Rate Limiting (W1-04)** | Rate Limiting | F-W1-04-01 (API Rate Limiter) | **Totalmente Coberto** |
| **Wave 1 — Security Audit (W1-05)**| Security Audit | F-W1-05-01 (Log de Acesso Audit) | **Totalmente Coberto** |
| **Wave 2 — Arch Validation (W2-01)**| Architecture Validation | F-W2-01-01 até F-W2-01-04 (Scanner) | **Totalmente Coberto** |
| **Wave 2 — Domain Validation (W2-02)**| Domain Validation | F-W2-02-01 até F-W2-02-04 (DDD Validation)| **Totalmente Coberto** |
| **Wave 2 — Dep. Validation (W2-03)**| Dependency Validation | F-W2-03-01 (Package Analyzer) | **Totalmente Coberto** |
| **Wave 2 — Sec. Validation (W2-04)**| Security Validation | F-W2-04-01 (Secret Scanner) | **Totalmente Coberto** |
| **Wave 2 — Hygiene Val. (W2-05)** | Hygiene Validation | F-W2-05-01 (Hygiene Check) | **Totalmente Coberto** |
| **Wave 2 — Audit Val. (W2-06)** | Audit Validation | F-W2-06-01 (Trust Cert Issuer) | **Totalmente Coberto** |
| **Wave 3 — Data Ownership (W3-01)**| Data Ownership | F-W3-01-01 (Repository Boundary Guard)| **Totalmente Coberto** |
| **Wave 3 — Legacy Consol. (W3-02)**| Legacy Consolidation | F-W3-02-01 (Postgres Consolidation) | **Totalmente Coberto** |
| **Wave 3 — Database Normal. (W3-03)**| Database Normalization | F-W3-03-01 (Integrity Constraint Fix)| **Totalmente Coberto** |
| **Wave 3 — Context Data (W3-04)** | Context Data Boundaries | F-W3-04-01 (Multi-Tenant Tenant Filter)| **Totalmente Coberto** |
| **Wave 4 — Domain Events (W4-01)** | Domain Events | F-W4-01-01 (Domain Events Registry) | **Totalmente Coberto** |
| **Wave 4 — Event Bus (W4-02)** | Internal Event Bus | F-W4-02-01 (Event Broker Engine) | **Totalmente Coberto** |
| **Wave 4 — Event Consumers (W4-03)**| Event Consumers | F-W4-03-01 (LMS & Notif Listeners) | **Totalmente Coberto** |
| **Wave 4 — Event Monitoring (W4-04)**| Event Monitoring | F-W4-04-01 até F-W4-04-03 (DLQ/Replay)| **Totalmente Coberto** |
| **Wave 5 — Workflow Orch. (W5-01)** | Workflow Orchestration | F-W5-01-01 até F-W5-01-03 (BPM Engine) | **Totalmente Coberto** |
| **Wave 5 — SLA Engine (W5-02)** | SLA Engine | F-W5-02-01 (Background SLA Scheduler) | **Totalmente Coberto** |
| **Wave 5 — Process State (W5-03)** | Process State Management | F-W5-03-01 (Transaction State Enforcer)| **Totalmente Coberto** |
| **Wave 5 — BPM Gov. (W5-04)** | BPM Governance | F-W5-04-01 (Audit Trail Process POP/CAPA)| **Totalmente Coberto** |
| **Wave 6 — OCR Engine (W6-01)** | OCR Engine | F-W6-01-01 (PDF/Laudo OCR Extractor) | **Totalmente Coberto** |
| **Wave 6 — Embeddings (W6-02)** | Embeddings Infrastructure | F-W6-02-01 (pgvector Integration) | **Totalmente Coberto** |
| **Wave 6 — RAG Platform (W6-03)** | RAG Platform | F-W6-03-01 (RAG Retrieval Engine) | **Totalmente Coberto** |
| **Wave 6 — LLM Integration (W6-04)**| LLM Integration | F-W6-04-01 (Ollama/OpenAI Client) | **Totalmente Coberto** |
| **Wave 6 — AI Observability (W6-05)**| AI Observability | F-W6-05-01 (Token & Prompt Log Audit) | **Totalmente Coberto** |
| **Wave 7 — Auto Compliance (W7-01)**| Autonomous Compliance | F-W7-01-01 (FHIR Automated Checklist) | **Totalmente Coberto** |
| **Wave 7 — Intelligent LMS (W7-02)**| Intelligent LMS | F-W7-02-01 (Reciclagem Event Auto Enroll)| **Totalmente Coberto** |
| **Wave 7 — Predictive Gov. (W7-03)**| Predictive Governance | F-W7-03-01 (Indicadores Predict Alerta) | **Totalmente Coberto** |
| **Wave 7 — Process Mining (W7-04)** | Process Mining | F-W7-04-01 (SLA Route Bottleneck Graph)| **Totalmente Coberto** |
| **Wave 7 — Gov. Intelligence (W7-05)**| Governance Intelligence | F-W7-05-01 (Unified ONA/BOS Score) | **Totalmente Coberto** |

---

## 2. MISSING FEATURES ANALYSIS (Detalhamento de Novas Features)

Para preencher as lacunas identificadas nos módulos de Domain Validation, BPM, IA e Arquitetura de Eventos, criamos as seguintes features de engenharia:

### 2.1. Domain Validation (Onda 2)

#### Feature ID: F-W2-02-02
*   **Nome**: Bounded Context Validation
*   **Objetivo**: Validar na esteira do TPM se arquivos de código em um contexto importam dependências ou arquivos de outros contextos diretamente.
*   **Problema resolvido**: Acoplamento acidental e vazamento de domínios no código TypeScript.
*   **Epic de origem**: `W2-02 Domain Validation`
*   **Capability impactada**: Governança.
*   **Contexto impactado**: Todos os contextos.
*   **Dependências**: `Build Gate (F-W2-01-04)`.
*   **Critérios de aceitação**: O scanner do TPM quebra a build se encontrar import de `modules/ona/` dentro de `modules/core/` (por exemplo).
*   **Prioridade**: Alta.

#### Feature ID: F-W2-02-03
*   **Nome**: Event Ownership Validation
*   **Objetivo**: Auditar as definições de eventos para garantir que apenas o contexto proprietário possa declarar a estrutura do evento correspondente.
*   **Problema resolvido**: Redefinição arbitrária de mensagens de eventos por contextos consumidores.
*   **Epic de origem**: `W2-02 Domain Validation`
*   **Capability impactada**: Governança, Auditoria.
*   **Contexto impactado**: Todos os contextos.
*   **Dependências**: `Bounded Context Validation (F-W2-02-02)`.
*   **Critérios de aceitação**: Validador do TPM reportando erro se a assinatura do evento do LMS for modificada fora da pasta do domínio LMS.
*   **Prioridade**: Média.

#### Feature ID: F-W2-02-04
*   **Nome**: Ubiquitous Language Validation
*   **Objetivo**: Mapear se a nomenclatura de variáveis, colunas do banco e rotas respeita o glossário corporativo oficial.
*   **Problema resolvido**: Uso de jargões obsoletos misturados às tabelas novas de negócio.
*   **Epic de origem**: `W2-02 Domain Validation`
*   **Capability impactada**: Governança.
*   **Contexto impactado**: Todos os contextos.
*   **Dependências**: `Bounded Context Validation (F-W2-02-02)`.
*   **Critérios de aceitação**: Alerta emitido pelo TPM se forem declarados campos no banco utilizando nomenclaturas legadas da saúde.
*   **Prioridade**: Média.

### 2.2. BPM Evolution (Onda 5)

#### Feature ID: F-W5-01-02
*   **Nome**: Workflow Definition Engine
*   **Objetivo**: Motor para validação e armazenamento das definições de workflows administrativos desenhados no frontend.
*   **Problema resolvido**: Ingestão de fluxogramas inconsistentes ou com nós circulares impossíveis de fechar.
*   **Epic de origem**: `W5-01 Workflow Orchestration`
*   **Capability impactada**: Processos.
*   **Contexto impactado**: Processos.
*   **Dependências**: `Event Broker (F-W4-02-01)`.
*   **Critérios de aceitação**: Validação lógica de grafos do BPMN aprovando apenas diagramas contendo início, etapas, tomadores de decisão e fim válidos.
*   **Prioridade**: Alta.

#### Feature ID: F-W5-01-03
*   **Nome**: Workflow Execution Engine
*   **Objetivo**: Orquestrador que executa fisicamente as transições das instâncias dos processos.
*   **Problema resolvido**: Falta de motor central de execução, dependendo de lógicas acopladas nas rotas.
*   **Epic de origem**: `W5-01 Workflow Orchestration`
*   **Capability impactada**: Processos.
*   **Contexto impactado**: Processos.
*   **Dependências**: `Workflow Definition Engine (F-W5-01-02)`.
*   **Critérios de aceitação**: As instâncias avançam nas etapas de negócio conforme acionamentos autorizados via API.
*   **Prioridade**: Alta.

### 2.3. AI Foundation (Onda 6)

#### Feature ID: F-W6-03-02
*   **Nome**: Prompt Management & Governance
*   **Objetivo**: Versionamento e sanitização dos prompts de sistema injetados na LLM.
*   **Problema resolvido**: Risco de alucinações e injeções de prompt (*Prompt Injection*) comprometendo respostas regulatórias da ONA.
*   **Epic de origem**: `W6-03 RAG Platform`
*   **Capability impactada**: Compliance, IA.
*   **Contexto impactado**: Compliance, Riscos.
*   **Dependências**: `pgvector Integration (F-W6-02-01)`.
*   **Critérios de aceitação**: Prompts de sistema carregados exclusivamente de arquivos controlados, sofrendo sanitização de caracteres proibidos antes do envio à LLM.
*   **Prioridade**: Alta.

### 2.4. Event Architecture (Onda 4)

#### Feature ID: F-W4-04-02
*   **Nome**: Dead Letter Queue (DLQ) Handling
*   **Objetivo**: Capturar e reter eventos de background que falharam no processamento.
*   **Problema resolvido**: Eventos se perdendo silenciosamente após estouros de banco de dados ou indisponibilidades de e-mail.
*   **Epic de origem**: `W4-04 Event Monitoring`
*   **Capability impactada**: Auditoria, Notificações.
*   **Contexto impactado**: Governança.
*   **Dependências**: `Event Broker (F-W4-02-01)`.
*   **Critérios de aceitação**: Inserção do evento com status `FAILED` na tabela de log acompanhado do stack-trace do erro.
*   **Prioridade**: Média.

#### Feature ID: F-W4-04-03
*   **Nome**: Event Replay
*   **Objetivo**: Permitir o reprocessamento manual de eventos retidos na DLQ.
*   **Problema resolvido**: Dificuldade em recuperar transações que falharam por indisponibilidades temporárias de infraestrutura.
*   **Epic de origem**: `W4-04 Event Monitoring`
*   **Capability impactada**: Governança.
*   **Contexto impactado**: Governança.
*   **Dependências**: `Dead Letter Queue Handling (F-W4-04-02)`.
*   **Critérios de aceitação**: Rota restrita na API Fastify permitindo disparar novamente o evento falho, atualizando seu status para `PROCESSED`.
*   **Prioridade**: Baixa.

---

## 3. VALIDAÇÃO DOS REQUISITOS CHAVE (REVIEWS)

### 3.1. TPM Feature Review (Governança Externa)
O TPM é modelado sob princípios rígidos de conformidade contínua, compostos por 7 features chaves executadas na esteira:
*   `Architecture Rules Registry` (definição de regras) e `Architecture Scanner` (validação de clean architecture).
*   `Bounded Context Validation` e `Database Ownership Guard` (validação de DDD e escrita em banco).
*   `Package Vulnerability Analyzer` (dependências) e `Secret Scanner` (segurança de chaves/senhas).
*   `Code Hygiene Check` (higiene e código órfão) e `Trust Certificate Issuer` (auditoria e emissão de atestados).

### 3.2. BPM Feature Review (Workflows e SLAs)
Cobre de forma integral o gerenciamento de processos:
*   Definição e validação de grafos (`Workflow Definition Engine`), execução de etapas (`Workflow Execution Engine`) e controle de integridade transacional de status (`State Transition Enforcer`).
*   Monitoramento autônomo de prazos com escalonamento automático (`Background SLA Scheduler`).
*   Registro permanente e assinado de trilhas de processos (`Audit Trail Process`).

### 3.3. AI Feature Review (Inteligência Artificial Transversal)
Mapeia a materialização cognitiva com controle de governança:
*   Processamento OCR real em PDFs (`PDF/Laudo OCR Extractor`), persistência vetorial (`pgvector Integration`) e busca semântica (`RAG Retrieval Engine`).
*   Integração ao LLM (`Ollama/OpenAI Client`), segurança de inputs (`Prompt Management & Governance`) e monitoramento analítico (`Token & Prompt Log Audit`).

### 3.4. Event Architecture Review (Arquitetura de Eventos)
Garante a consistência assíncrona desacoplada:
*   Mapeamento de eventos (`Domain Events Registry`), despacho de mensagens (`Event Broker Engine`) e listeners ativos de LMS/Notificações (`LMS & Notif Listeners`).
*   Auditoria e resiliência de falhas com retenção de erros (`DLQ Handling`) e reprocessamento (`Event Replay`).

---

## 4. FINAL COVERAGE MATRIX (Matriz de Cobertura Final)

```text
======================================================
  MÉTRICAS DE COBERTURA DA ARQUITETURA ALVO (TO-BE)
======================================================
  - Epic Coverage:         100% (36 de 36 Epics)
  - Wave Coverage:         100% (8 de 8 Waves)
  - Capability Coverage:   100% (8 de 8 Capabilities)
  - Context Coverage:      100% (8 de 8 Contexts)
======================================================
```

---

## 5. FEATURE CATALOG V2 (Catálogo Completo por Ondas)

Abaixo está o inventário unificado de todas as features que devem ser construídas ou mantidas ao longo da evolução do ecossistema:

### Wave 0 — Architecture Baseline
*   **F-W0-01-01: ADR Registry**: Versionamento das decisões arquiteturais na pasta `/docs/adr/`. (Prioridade: Crítica | Contexto: Governança)
*   **F-W0-02-01: Principles Documentation**: Catálogo oficial de regras de modularidade, Clean Architecture e Bounded Contexts. (Prioridade: Crítica | Contexto: Governança)
*   **F-W0-03-01: Domain Schema Registry**: Dicionário detalhado de Bounded Contexts e limites de dados. (Prioridade: Crítica | Contexto: Governança)
*   **F-W0-04-01: Policies Definition**: Parâmetros do validador de score técnico do TPM. (Prioridade: Crítica | Contexto: Governança)

### Wave 1 — Security Foundation
*   **F-W1-01-01: HttpOnly Token Storage**: Transição do JWT no login para Cookie do Fastify. (Prioridade: Crítica | Contexto: Governança)
*   **F-W1-02-01: Secure Cookie Config**: Flag de cookies como `HttpOnly`, `Secure` e `SameSite=Strict`. (Prioridade: Crítica | Contexto: Governança)
*   **F-W1-03-01: Restricted Access Domains**: Configuração do CORS fechado restrito ao `.env`. (Prioridade: Crítica | Contexto: Todos os contextos)
*   **F-W1-04-01: API Rate Limiter**: Middleware de limitação de requisições por IP. (Prioridade: Alta | Contexto: Governança)
*   **F-W1-05-01: Log de Acesso Audit**: Gravação imutável de logs de acessos/logins do usuário no PostgreSQL. (Prioridade: Alta | Contexto: Governança)

### Wave 2 — TPM Foundation
*   **F-W2-01-01: Architecture Rules Registry**: Cadastro de regras de imports Clean Architecture do TPM. (Prioridade: Alta | Contexto: Todos os contextos)
*   **F-W2-01-02: Architecture Scanner**: Motor estático que varre o código buscando injeções SQL Raw ou vazamentos. (Prioridade: Alta | Contexto: Todos os contextos)
*   **F-W2-01-03: Violation Reporter**: Relatório formatado de violações de código detectadas. (Prioridade: Alta | Contexto: Governança)
*   **F-W2-01-04: Build Gate**: Script da CI que quebra a build se houver desvios graves de Clean Arch ou segurança. (Prioridade: Alta | Contexto: Governança)
*   **F-W2-02-01: Database Ownership Guard**: Varredura estática impedindo queries cruzadas no PostgreSQL. (Prioridade: Alta | Contexto: Todos os contextos)
*   **F-W2-02-02: Bounded Context Validation**: Scan do TPM bloqueando imports incorretos entre pastas de contextos. (Prioridade: Alta | Contexto: Todos os contextos)
*   **F-W2-02-03: Event Ownership Validation**: Validação que proíbe modificações da assinatura de eventos fora do domínio proprietário. (Prioridade: Média | Contexto: Todos os contextos)
*   **F-W2-02-04: Ubiquitous Language Validation**: Alerta se colunas de banco ou variáveis utilizarem termos obsoletos. (Prioridade: Média | Contexto: Todos os contextos)
*   **F-W2-03-01: Package Vulnerability Analyzer**: Verificador de CVEs críticas em dependências NPM. (Prioridade: Alta | Contexto: Todos os contextos)
*   **F-W2-04-01: Secret Scanner**: Bloqueio de commits contendo chaves privadas ou senhas hardcoded. (Prioridade: Alta | Contexto: Governança)
*   **F-W2-05-01: Code Hygiene Check**: Monitoramento de código duplicado e arquivos órfãos de 0 bytes. (Prioridade: Média | Contexto: Todos os contextos)
*   **F-W2-06-01: Trust Certificate Issuer**: Emissão de log assinado de score de integridade pelo TPM. (Prioridade: Média | Contexto: Governança)

### Wave 3 — Data Consolidation
*   **F-W3-01-01: Repository Boundary Guard**: Controllers acessando o banco PostgreSQL exclusivamente via repositórios Clean Arch. (Prioridade: Alta | Contexto: Todos os contextos)
*   **F-W3-02-01: Postgres Consolidation**: Execução de scripts de migração e drop físico de tabelas redundantes. (Prioridade: Alta | Contexto: Documentos, Riscos, Compliance)
*   **F-W3-03-01: Integrity Constraint Fix**: Inclusão de chaves estrangeiras seguras e regras de delete nos esquemas unificados. (Prioridade: Média | Contexto: Todos os contextos)
*   **F-W3-04-01: Multi-Tenant Tenant Filter**: Inserção automática de escopo de tenant ID nas consultas de banco do JWT. (Prioridade: Alta | Contexto: Todos os contextos)

### Wave 4 — Event Architecture
*   **F-W4-01-01: Domain Events Registry**: Modelagem e cadastro das classes de eventos de domínio. (Prioridade: Média | Contexto: Todos os contextos)
*   **F-W4-02-01: Event Broker Engine**: Despachador assíncrono interno de eventos em background. (Prioridade: Média | Contexto: Todos os contextos)
*   **F-W4-03-01: LMS & Notif Listeners**: Cadastro de listeners que reagem a eventos e disparam ações em LMS e Mensageria. (Prioridade: Média | Contexto: Educação, Documentos)
*   **F-W4-04-01: Event Log Audit**: Registro básico de auditoria de eventos disparados no banco. (Prioridade: Baixa | Contexto: Governança)
*   **F-W4-04-02: DLQ Handling**: Captura e gravação de logs de erros de eventos de background falhos. (Prioridade: Média | Contexto: Governança)
*   **F-W4-04-03: Event Replay**: Rota administrativa para redisparo manual de eventos retidos na DLQ. (Prioridade: Baixa | Contexto: Governança)

### Wave 5 — BPM Evolution
*   **F-W5-01-01: State Transition Enforcer**: Trava transacional impedindo a mudança manual de status fora do BPM. (Prioridade: Alta | Contexto: Processos, Documentos, Riscos)
*   **F-W5-01-02: Workflow Definition Engine**: Validador de grafos do BPMN que aprova apenas fluxos coerentes e sem ciclos. (Prioridade: Alta | Contexto: Processos)
*   **F-W5-01-03: Workflow Execution Engine**: Motor transacional que computa e avança etapas do processo. (Prioridade: Alta | Contexto: Processos)
*   **F-W5-02-01: Background SLA Scheduler**: Serviço de background recorrente que gerencia prazos limites e dispara alertas. (Prioridade: Alta | Contexto: Processos)
*   **F-W5-03-01: Transaction State Enforcer**: Garantia de rollback em banco de dados caso uma transição do BPM falhe. (Prioridade: Média | Contexto: Processos)
*   **F-W5-04-01: Audit Trail Process**: Gravação imutável do histórico linear e assinaturas de transições de processos finalizados. (Prioridade: Média | Contexto: Processos)

### Wave 6 — AI Foundation
*   **F-W6-01-01: PDF/Laudo OCR Extractor**: Biblioteca de extração textual de laudos de evidências. (Prioridade: Média | Contexto: Compliance)
*   **F-W6-02-01: pgvector Integration**: Extensão `pgvector` ativada no PostgreSQL para persistência de embeddings. (Prioridade: Média | Contexto: Compliance, Conhecimento)
*   **F-W6-03-01: RAG Retrieval Engine**: Busca semântica real baseada no contexto vetorial dos manuais ONA. (Prioridade: Média | Contexto: Compliance, Conhecimento)
*   **F-W6-03-02: Prompt Management & Governance**: Versionamento e higienização de prompts contra Prompt Injection. (Prioridade: Alta | Contexto: Compliance)
*   **F-W6-04-01: Ollama/OpenAI Client**: Integração e chamada da API de LLM para triagem cognitiva de Ishikawa. (Prioridade: Média | Contexto: Riscos)
*   **F-W6-05-01: Token & Prompt Log Audit**: Gravação detalhada de logs e consumos das capacidades de IA. (Prioridade: Baixa | Contexto: Governança)

### Wave 7 — Intelligent Governance
*   **F-W7-01-01: FHIR Automated Checklist**: Integração FHIR preenchendo checklists ONA automaticamente com base no prontuário. (Prioridade: Baixa | Contexto: Compliance)
*   **F-W7-02-01: Reciclagem Event Auto Enroll**: Evento de ocorrência do CRM matriculando o colaborador diretamente em curso de reciclagem. (Prioridade: Baixa | Contexto: Educação, Riscos)
*   **F-W7-03-01: Indicadores Predict Alerta**: Alertas preditivos preventivos com base nas tendências de KPIs coletados. (Prioridade: Baixa | Contexto: Governança)
*   **F-W7-04-01: SLA Route Bottleneck Graph**: Grafo do dashboard mapeando os maiores pontos de gargalo dos processos. (Prioridade: Baixa | Contexto: Processos)
*   **F-W7-05-01: Unified ONA/BOS Score**: Dashboard executivo unificado da qualidade atestado pelo selo de integridade do TPM. (Prioridade: Baixa | Contexto: Governança, Compliance)
