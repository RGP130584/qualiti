# Epic Decomposition (V1) — QualitiOS

Este documento consolida a decomposição do Roadmap de Evolução em Épicos de Produto e Arquitetura para o **QualitiOS** e o **TPM (Trusted Cognitive Platform)**, mapeando os requisitos de conformidade, dependências e critérios de aceitação estratégica de cada iniciativa.

---

## 1. EPICS DECOMPOSITION BY WAVES (Épicos por Onda)

### 1.1. Wave 0 — Architecture Baseline (Alinhamento Inicial)

#### Epic W0-01: ADR Governance
*   **Objetivo**: Estabelecer o processo de registro de decisões arquiteturais (ADRs) do projeto.
*   **Problema resolvido**: Falta de rastreabilidade de por que escolhas técnicas foram tomadas.
*   **Capacidades impactadas**: Governança.
*   **Contextos impactados**: Governança.
*   **Dependências**: Nenhuma.
*   **Critérios de sucesso**: Repositório contendo pasta `/docs/adr/` com as primeiras ADRs estruturadas.
*   **Prioridade**: Crítica.

#### Epic W0-02: Architecture Principles Registry
*   **Objetivo**: Documentar as diretrizes oficiais de Clean Architecture, modularidade e acoplamento.
*   **Problema resolvido**: Código-fonte sofrendo degradação estrutural por falta de padrões escritos.
*   **Capacidades impactadas**: Governança.
*   **Contextos impactados**: Todos os contextos.
*   **Dependências**: `ADR Governance`.
*   **Critérios de sucesso**: Manual de princípios arquiteturais publicado no repositório.
*   **Prioridade**: Crítica.

#### Epic W0-03: Domain Registry
*   **Objetivo**: Mapear as fronteiras de Bounded Contexts, de propriedade de dados e fluxos de domínio.
*   **Problema resolvido**: Vazamento de escopo entre módulos da aplicação e banco de dados.
*   **Capacidades impactadas**: Governança.
*   **Contextos impactados**: Todos os contextos.
*   **Dependências**: `Architecture Principles Registry`.
*   **Critérios de sucesso**: Dicionário de domínios e contextos integrados em documento oficial do repositório.
*   **Prioridade**: Crítica.

#### Epic W0-04: TPM Policies Registry
*   **Objetivo**: Formalizar as políticas externas de conformidade que o TPM varrerá contínuamente.
*   **Problema resolvido**: Falta de clareza sobre quais regras a esteira do TPM deve impor.
*   **Capacidades impactadas**: Governança.
*   **Contextos impactados**: Governança.
*   **Dependências**: `Architecture Principles Registry`.
*   **Critérios de sucesso**: Arquivo de definição de regras e score do TPM criado no projeto.
*   **Prioridade**: Crítica.

---

### 1.2. Wave 1 — Security Foundation (Base de Segurança)

#### Epic W1-01: Session Security
*   **Objetivo**: Implementar o tráfego seguro de sessões de login na API.
*   **Problema resolvido**: Risco de sequestro de sessão e token de usuários.
*   **Capacidades impactadas**: RBAC, Governança.
*   **Contextos impactados**: Governança.
*   **Dependências**: `TPM Policies Registry`.
*   **Critérios de sucesso**: Token JWT armazenado exclusivamente em cabeçalhos HTTP de cookies protegidos.
*   **Prioridade**: Crítica.

#### Epic W1-02: Cookie Security
*   **Objetivo**: Configurar parâmetros de cookies de sessão HTTP.
*   **Problema resolvido**: Vulnerabilidade a roubo de cookies via scripts maliciosos (XSS).
*   **Capacidades impactadas**: RBAC, Governança.
*   **Contextos impactados**: Governança.
*   **Dependências**: `Session Security`.
*   **Critérios de sucesso**: Cookies de autenticação emitidos com as tags `HttpOnly`, `Secure` e `SameSite=Strict`.
*   **Prioridade**: Crítica.

#### Epic W1-03: CORS Hardening
*   **Objetivo**: Fechar as permissões abertas de chamadas cross-origin da API.
*   **Problema resolvido**: Risco de vazamento de dados confidenciais por requisições de origens não autorizadas.
*   **Capacidades impactadas**: Governança.
*   **Contextos impactados**: Todos os contextos.
*   **Dependências**: `Cookie Security`.
*   **Critérios de sucesso**: Remoção total do wildcard `*` nas configurações de CORS e restrição aos domínios do `.env`.
*   **Prioridade**: Crítica.

#### Epic W1-04: Rate Limiting
*   **Objetivo**: Implantar controle de limitação de requisições sequenciais.
*   **Problema resolvido**: Risco de indisponibilidade por ataques DoS e força bruta em formulários.
*   **Capacidades impactadas**: Governança.
*   **Contextos impactados**: Governança.
*   **Dependências**: `CORS Hardening`.
*   **Critérios de sucesso**: Middleware de limite de requisições por IP integrado ao Fastify e respondendo HTTP 429.
*   **Prioridade**: Alta.

#### Epic W1-05: Security Audit
*   **Objetivo**: Registrar logs indeléveis de auditoria de acessos e logins de sistema.
*   **Problema resolvido**: Falta de trilhas para investigações de vazamento de credenciais perante a LGPD.
*   **Capacidades impactadas**: Auditoria.
*   **Contextos impactados**: Governança.
*   **Dependências**: `Cookie Security`.
*   **Critérios de sucesso**: Logs de login (sucesso, falha, IP) gravados na tabela `auditoria_logs` sem possibilidade de alteração.
*   **Prioridade**: Alta.

---

### 1.3. Wave 2 — TPM Foundation (Fundações de Governança TPM)

#### Epic W2-01: Architecture Validation
*   **Objetivo**: Automatizar a validação estática de aderência à Clean Architecture e DDD.
*   **Problema resolvido**: Desrespeito a divisões de camadas e fronteiras de contextos nas integrações.
*   **Capacidades impactadas**: Governança.
*   **Contextos impactados**: Todos os contextos.
*   **Dependências**: `TPM Policies Registry`, `Security Audit`.
*   **Critérios de sucesso**: Script do TPM rodando e bloqueando builds se houver queries SQL Raw nas rotas/controllers.
*   **Prioridade**: Alta.

#### Epic W2-02: Domain Validation
*   **Objetivo**: Validar a propriedade de dados no banco por Bounded Context.
*   **Problema resolvido**: Lógicas de escrita cruzada em tabelas de terceiros de forma acoplada.
*   **Capacidades impactadas**: Governança.
*   **Contextos impactados**: Todos os contextos.
*   **Dependências**: `Architecture Validation`.
*   **Critérios de sucesso**: Validador do TPM bloqueando PRs que façam escrita direta em tabelas fora de seu domínio.
*   **Prioridade**: Alta.

#### Epic W2-03: Dependency Validation
*   **Objetivo**: Monitorar a árvore de dependências e vulnerabilidades NPM.
*   **Problema resolvido**: Introdução de pacotes inseguros ou com licenças proibidas.
*   **Capacidades impactadas**: Governança.
*   **Contextos impactados**: Todos os contextos.
*   **Dependências**: `Architecture Validation`.
*   **Critérios de sucesso**: Scan automatizado atestando 0% de pacotes com vulnerabilidades conhecidas críticas.
*   **Prioridade**: Alta.

#### Epic W2-04: Security Validation
*   **Objetivo**: Monitorar a exposição de secrets e credenciais sensíveis.
*   **Problema resolvido**: Vazamento de tokens, senhas ou chaves SSH no Git.
*   **Capacidades impactadas**: Governança.
*   **Contextos impactados**: Governança.
*   **Dependências**: `Architecture Validation`.
*   **Critérios de sucesso**: Esteira de Git Guardian configurada e impedindo PRs com segredos expostos.
*   **Prioridade**: Alta.

#### Epic W2-05: Hygiene Validation
*   **Objetivo**: Escanear código órfão, arquivos vazios e degradações arquiteturais.
*   **Problema resolvido**: Acúmulo de arquivos sem uso no repositório.
*   **Capacidades impactadas**: Governança.
*   **Contextos impactados**: Todos os contextos.
*   **Dependências**: `Architecture Validation`.
*   **Critérios de sucesso**: Scanner de código morto rodando na CI e sinalizando arquivos obsoletos.
*   **Prioridade**: Média.

#### Epic W2-06: Audit Validation
*   **Objetivo**: Produzir relatórios e logs de conformidade de código emitidos pelo TPM.
*   **Problema resolvido**: Falta de relatórios formais para auditoria externa.
*   **Capacidades impactadas**: Auditoria.
*   **Contextos impactados**: Governança.
*   **Dependências**: `Architecture Validation`.
*   **Critérios de sucesso**: Emissão automatizada de certificado de confiança técnica a cada commit de release.
*   **Prioridade**: Média.

---

### 1.4. Wave 3 — Data Consolidation (Consolidação de Dados)

#### Epic W3-01: Data Ownership
*   **Objetivo**: Encapsular acessos de gravação ao banco através de repositórios exclusivos de domínio.
*   **Problema resolvido**: Escrituras cruzadas descontroladas no banco PostgreSQL.
*   **Capacidades impactadas**: Governança.
*   **Contextos impactados**: Todos os contextos.
*   **Dependências**: `Domain Validation`.
*   **Critérios de sucesso**: 100% dos controllers acessando dados via repositórios específicos da camada de Clean Architecture.
*   **Prioridade**: Alta.

#### Epic W3-02: Legacy Consolidation
*   **Objetivo**: Executar a migração de dados e remoção de tabelas duplicadas.
*   **Problema resolvido**: Existência de base duplicada (tabelas legadas vs tabelas modularizadas V2).
*   **Capacidades impactadas**: Documentos, Riscos, Compliance.
*   **Contextos impactados**: Documentos, Riscos, Compliance.
*   **Dependências**: `Data Ownership`.
*   **Critérios de sucesso**: Dados legados migrados e tabelas obsoletas dropadas do banco PostgreSQL.
*   **Prioridade**: Alta.

#### Epic W3-03: Database Normalization
*   **Objetivo**: Corrigir restrições, integridades e chaves estrangeiras.
*   **Problema resolvido**: Risco de quebra de integridade e registros órfãos.
*   **Capacidades impactadas**: Governança.
*   **Contextos impactados**: Todos os contextos.
*   **Dependências**: `Legacy Consolidation`.
*   **Critérios de sucesso**: Script DDL de refatoração de FKs executado sem erros no PostgreSQL.
*   **Prioridade**: Média.

#### Epic W3-04: Context Data Boundaries
*   **Objetivo**: Assegurar isolamento de leitura e escrita por organização (Multi-Tenancy).
*   **Problema resolvido**: Risco de vazamento de dados entre diferentes tenants.
*   **Capacidades impactadas**: Governança, RBAC.
*   **Contextos impactados**: Todos os contextos.
*   **Dependências**: `Data Ownership`.
*   **Critérios de sucesso**: Validador JWT inserindo ID do tenant em 100% das queries de banco executadas.
*   **Prioridade**: Alta.

---

### 1.5. Wave 4 — Event Architecture (Arquitetura de Eventos)

#### Epic W4-01: Domain Events
*   **Objetivo**: Identificar e mapear os eventos de negócio das transições.
*   **Problema resolvido**: Acoplamento síncrono que bloqueia processamento por falhas em serviços secundários.
*   **Capacidades impactadas**: Governança.
*   **Contextos impactados**: Todos os contextos.
*   **Dependências**: `Context Data Boundaries`.
*   **Critérios de sucesso**: Classes de eventos mapeadas e testadas.
*   **Prioridade**: Média.

#### Epic W4-02: Internal Event Bus
*   **Objetivo**: Implementar o barramento assíncrono interno de distribuição de eventos.
*   **Problema resolvido**: Bloqueios e lentidão em transações de rotas da API Fastify.
*   **Capacidades impactadas**: Governança.
*   **Contextos impactados**: Todos os contextos.
*   **Dependências**: `Domain Events`.
*   **Critérios de sucesso**: Eventos despachados e distribuídos em threads/background sem reter a resposta da API HTTP.
*   **Prioridade**: Média.

#### Epic W4-03: Event Consumers
*   **Objetivo**: Inscrever os contextos de LMS e Mensageria no barramento.
*   **Problema resolvido**: Acoplamento de chamadas diretas de e-mails/matrículas no ECM.
*   **Capacidades impactadas**: Educação, Documentos, Notificações.
*   **Contextos impactados**: Educação, Documentos.
*   **Dependências**: `Internal Event Bus`.
*   **Critérios de sucesso**: LMS matriculando aluno ao receber `NovaVersaoDocumentoVigente` sem chamadas HTTP do ECM.
*   **Prioridade**: Média.

#### Epic W4-04: Event Monitoring
*   **Objetivo**: Criar painel básico de auditoria de status de processamento de eventos.
*   **Problema resolvido**: Falta de visibilidade se um evento de background falhou em sua execução.
*   **Capacidades impactadas**: Auditoria.
*   **Contextos impactados**: Governança.
*   **Dependências**: `Internal Event Bus`.
*   **Critérios de sucesso**: Tabela de log gravando status (processado, falhou, pendente) de eventos disparados.
*   **Prioridade**: Baixa.

---

### 1.6. Wave 5 — BPM Evolution (Evolução do BPM)

#### Epic W5-01: Workflow Orchestration
*   **Objetivo**: Ativar a transição automatizada de status de documentos/riscos baseada em grafos.
*   **Problema resolvido**: Usuários burlando fluxos de aprovação de POPs ou CAPAs.
*   **Capacidades impactadas**: Processos, Documentos, Riscos.
*   **Contextos impactados**: Processos, Documentos, Riscos.
*   **Dependências**: `Event Consumers`, `Legacy Consolidation`.
*   **Critérios de sucesso**: Bloqueio sistêmico impedindo alteração de status de POP sem transição correspondente no BPM.
*   **Prioridade**: Alta.

#### Epic W5-02: SLA Engine
*   **Objetivo**: Implementar monitoramento autônomo e assíncrono de prazos limites.
*   **Problema resolvido**: Estouros de prazo em planos CAPA e revisões sem alertas automáticos.
*   **Capacidades impactadas**: Processos, Notificações.
*   **Contextos impactados**: Processos.
*   **Dependências**: `Workflow Orchestration`.
*   **Critérios de sucesso**: Serviço agendado (background task) verificando prazos vencidos e disparando e-mails a cada 24 horas.
*   **Prioridade**: Alta.

#### Epic W5-03: Process State Management
*   **Objetivo**: Controlar o ciclo de vida transacional das instâncias ativas do BPM.
*   **Problema resolvido**: Inconsistências de dados se uma transição falha no meio do fluxo.
*   **Capacidades impactadas**: Processos.
*   **Contextos impactados**: Processos.
*   **Dependências**: `Workflow Orchestration`.
*   **Critérios de sucesso**: Transições de etapas executadas sob escopo de transação atômica do banco.
*   **Prioridade**: Média.

#### Epic W5-04: BPM Governance
*   **Objetivo**: Auditoria de conformidade de fluxos finalizados perante inspeções.
*   **Problema resolvido**: Dificuldade em provar que as regras de governança foram seguidas em um processo antigo.
*   **Capacidades impactadas**: Auditoria.
*   **Contextos impactados**: Processos, Governança.
*   **Dependências**: `Process State Management`.
*   **Critérios de sucesso**: Histórico permanente de autoria e transições gravado e assinado no banco.
*   **Prioridade**: Média.

---

### 1.7. Wave 6 — AI Foundation (Fundação de IA Real)

#### Epic W6-01: OCR Engine
*   **Objetivo**: Integrar biblioteca real de OCR e PDF no backend.
*   **Problema resolvido**: Simulação de OCR em laudos de evidências regulatórias.
*   **Capacidades impactadas**: Compliance.
*   **Contextos impactados**: Compliance.
*   **Dependências**: `Legacy Consolidation`.
*   **Critérios de sucesso**: Extração de texto de PDF no upload de evidência retornando o conteúdo real do laudo.
*   **Prioridade**: Média.

#### Epic W6-02: Embeddings Infrastructure
*   **Objetivo**: Configurar o suporte vetorial no PostgreSQL (`pgvector`).
*   **Problema resolvido**: Arrays vetoriais aleatórios simulados.
*   **Capacidades impactadas**: Compliance, Conhecimento.
*   **Contextos impactados**: Compliance, Conhecimento.
*   **Dependências**: `OCR Engine`.
*   **Critérios de sucesso**: PostgreSQL gerando e salvando embeddings vetoriais com a extensão `pgvector`.
*   **Prioridade**: Média.

#### Epic W6-03: RAG Platform
*   **Objetivo**: Implementar o fluxo de Retrieval-Augmented Generation para consultas.
*   **Problema resolvido**: Respostas do Copiloto ONA baseadas em buscas estáticas de keywords.
*   **Capacidades impactadas**: Compliance, Conhecimento.
*   **Contextos impactados**: Compliance, Conhecimento.
*   **Dependências**: `Embeddings Infrastructure`.
*   **Critérios de sucesso**: Respostas geradas injetando o contexto semântico correspondente via banco vetorial.
*   **Prioridade**: Média.

#### Epic W6-04: LLM Integration
*   **Objetivo**: Conectar a API Fastify a uma LLM local (Ollama) ou serviço de nuvem.
*   **Problema resolvido**: Ausência de inferência cognitiva real na triagem de ocorrências e Ishikawa.
*   **Capacidades impactadas**: Riscos, IA.
*   **Contextos impactados**: Riscos.
*   **Dependências**: `RAG Platform`.
*   **Critérios de sucesso**: Ishikawa preenchido sugestivamente com base em chamada HTTP bem-sucedida para a LLM.
*   **Prioridade**: Média.

#### Epic W6-05: AI Observability
*   **Objetivo**: Auditar logs de prompts, taxas de acerto e inputs de agentes de IA.
*   **Problema resolvido**: Risco de alucinação de dados e custos de API invisíveis.
*   **Capacidades impactadas**: Auditoria.
*   **Contextos impactados**: Governança.
*   **Dependências**: `LLM Integration`.
*   **Critérios de sucesso**: Tabela `core_ai_logs` registrando o consumo de tokens e prompts correspondentes.
*   **Prioridade**: Baixa.

---

### 1.8. Wave 7 — Intelligent Governance (Governança Inteligente)

#### Epic W7-01: Autonomous Compliance
*   **Objetivo**: Conectar o conector FHIR real para extração passiva de indicadores de leito.
*   **Problema resolvido**: Auditorias de leito demoradas e suscetíveis a preenchimentos manuais errados.
*   **Capacidades impactadas**: Compliance, Integrações.
*   **Contextos impactados**: Compliance.
*   **Dependências**: `LLM Integration`.
*   **Critérios de sucesso**: Autopreenchimento de checklists da ONA após consultas automatizadas de dados do prontuário externo.
*   **Prioridade**: Baixa.

#### Epic W7-02: Intelligent LMS
*   **Objetivo**: Automatizar a recomendação de trilhas com base no histórico de ocorrências.
*   **Problema resolvido**: Treinamentos gerais sem personalização, resultando em reincidência de erros.
*   **Capacidades impactadas**: Educação, Riscos.
*   **Contextos impactados**: Educação, Riscos.
*   **Dependências**: `LLM Integration`, `Event Consumers`.
*   **Critérios de sucesso**: Ocorrência de erro assistencial gerando microtreinamento obrigatório personalizado.
*   **Prioridade**: Baixa.

#### Epic W7-03: Predictive Governance
*   **Objetivo**: Monitorar streams de dados do prontuário para antecipar furos de compliance.
*   **Problema resolvido**: Tratativa puramente reativa após a ocorrência do evento adverso.
*   **Capacidades impactadas**: Governança, Riscos.
*   **Contextos impactados**: Governança.
*   **Dependências**: `Autonomous Compliance`.
*   **Critérios de sucesso**: Disparos de alertas preditivos a gestores se um indicador de leito demonstrar tendência de não conformidade.
*   **Prioridade**: Baixa.

#### Epic W7-04: Process Mining
*   **Objetivo**: Análise de rotas e gargalos reais de workflows finalizados.
*   **Problema resolvido**: Ausência de métricas de otimização de fluxos de processos assistenciais.
*   **Capacidades impactadas**: Processos, Analytics.
*   **Contextos impactados**: Processos.
*   **Dependências**: `BPM Governance`.
*   **Critérios de sucesso**: Dashboards gerando o fluxo real percorrido e detectando gargalos de SLA.
*   **Prioridade**: Baixa.

#### Epic W7-05: Governance Intelligence
*   **Objetivo**: Unificação final de auditorias, RAGs, BPM e a certificação técnica do TPM.
*   **Problema resolvido**: Fragmentação do controle regulatório e burocracia de certificação de auditoria.
*   **Capacidades impactadas**: Governança, Compliance, TPM.
*   **Contextos impactados**: Governança, Compliance.
*   **Dependências**: `Autonomous Compliance`, `AI Observability`.
*   **Critérios de sucesso**: Painel consolidado fornecendo o score de acreditação em tempo real, auditável e chancelado pelo TPM.
*   **Prioridade**: Baixa.

---

## 2. MATRICES DE RELACIONAMENTO (MATRICES)

### 2.1. Epic ➔ Capability Matrix

| Épico ID | Governança | Estratégia | Compliance | Educação | Conhecimento | Processos | Documentos | Riscos |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **ADR Governance** | X | | | | | | | |
| **Session Security** | X | | | | | | | |
| **CORS Hardening** | X | | | | | | | |
| **Legacy Consolidation**| | | X | | | | X | X |
| **Event Consumers** | | | | X | | | X | |
| **Workflow Orch.** | | | | | | X | X | X |
| **SLA Engine** | | | | | | X | | |
| **OCR Engine** | | | X | | | | | |
| **RAG Platform** | | | X | | X | | | |
| **LLM Integration** | | | | | | | | X |
| **Autonomous Comp.** | | | X | | | | | |
| **Intelligent LMS** | | | | X | | | | X |

---

### 2.2. Epic ➔ Context Matrix

| Épico ID | Gov. | Estrat. | Compl. | Educ. | Conhec. | Proc. | Docum. | Riscos |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Domain Registry** | X | X | X | X | X | X | X | X |
| **Cookie Security** | X | | | | | | | |
| **Security Audit** | X | | | | | | | |
| **Data Ownership** | X | X | X | X | X | X | X | X |
| **Internal Event Bus** | X | X | X | X | X | X | X | X |
| **Process State Mgmt** | | | | | | X | | |
| **BPM Governance** | X | | | | | X | | |
| **AI Observability** | X | | | | | | | |
| **Predictive Gov.** | X | | | | | | | X |
| **Process Mining** | | | | | | X | | |

---

### 2.3. Epic ➔ Wave Matrix

| Épico ID | Wave 0 | Wave 1 | Wave 2 | Wave 3 | Wave 4 | Wave 5 | Wave 6 | Wave 7 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **ADR Governance** | X | | | | | | | |
| **CORS Hardening** | | X | | | | | | |
| **Architecture Val.**| | | X | | | | | |
| **Data Ownership** | | | | X | | | | |
| **Domain Events** | | | | | X | | | |
| **SLA Engine** | | | | | | X | | |
| **LLM Integration** | | | | | | | X | |
| **Autonomous Comp.** | | | | | | | | X |

---

### 2.4. Epic Dependency Matrix (Matriz de Dependências)

| Épico Target | Épicos Bloqueantes / Pré-requisitos (Upstream) |
| :--- | :--- |
| **Architecture Principles**| `ADR Governance` |
| **Domain Registry** | `Architecture Principles Registry` |
| **Session Security** | `TPM Policies Registry` |
| **CORS Hardening** | `Cookie Security` |
| **Architecture Val.** | `TPM Policies Registry` |
| **Domain Validation** | `Architecture Validation` |
| **Data Ownership** | `Domain Validation` |
| **Legacy Consolidation**| `Data Ownership` |
| **Internal Event Bus** | `Domain Events` |
| **Event Consumers** | `Internal Event Bus` |
| **Workflow Orch.** | `Event Consumers`, `Legacy Consolidation` |
| **Embeddings Infra** | `OCR Engine` |
| **RAG Platform** | `Embeddings Infrastructure` |
| **LLM Integration** | `RAG Platform` |
| **Autonomous Comp.** | `LLM Integration` |
| **Predictive Gov.** | `Autonomous Compliance` |
| **Process Mining** | `BPM Governance` |
