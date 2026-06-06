# Gap Analysis — QualitiOS

Este documento apresenta a análise de lacunas (Gap Analysis) do **QualitiOS**, confrontando a realidade física e lógica do código atual (**AS-IS**) com a arquitetura alvo governada (**TO-BE V2**). O objetivo é identificar exatamente o que falta em nível estratégico, de dados, de segurança e de integração para alcançar o estado de conformidade do ecossistema.

---

## 1. EXECUTIVE SUMMARY (Resumo Executivo)

*   **Maturidade Atual**: **Média-Baixa (Nível 2 - Repetível com Mocks)**. O sistema possui as lógicas de negócios básicas implementadas (LMS, POPs, OKRs), mas carece de automação real de infraestrutura, operando com simulações completas de Inteligência Artificial e possuindo vulnerabilidades críticas de segurança (CORS aberto, localStorage exposto) e redundância de banco de dados.
*   **Maturidade Alvo**: **Alta (Nível 5 - Otimizado e Governado pelo TPM)**. Monolito modular desacoplado fisicamente, com dados unificados, barramento de eventos assíncronos, sessões em cookies HttpOnly, conector cognitivo real via Model Context Protocol (MCP) e validação de confiança externa operada de forma contínua pelo TPM.
*   **Principais Gaps**:
    1.  *IA Simulada*: Total ausência de LLMs e suporte a vetores, operando com mocks estáticos em TypeScript.
    2.  *Segurança de Sessão*: Tokens JWT salvos no localStorage (suscetíveis a XSS) e CORS wildcard configurado como `*`.
    3.  *Redundância no Banco*: Duplicação de tabelas legadas V1 e modulares V2 no mesmo PostgreSQL.
    4.  *Gargalo de Concorrencia*: Next.js e Fastify executando no mesmo contêiner físico.
    5.  *Ausência de Validação de Confiança*: Inexistência da esteira contínua de auditoria e validação de código externa do TPM.

---

## 2. CAPABILITY GAP ANALYSIS (Lacunas de Capacidades)

Abaixo está o mapeamento de lacunas das 8 capacidades principais de negócio da plataforma:

| Capacidade | Status Atual | Detalhamento do Gap | Impacto | Complexidade |
| :--- | :--- | :--- | :--- | :--- |
| **Governança** | **Parcial** | Falta consolidar scores automáticos e logs de auditoria de sistema integrados ao TPM. | Alto | Média |
| **Estratégia** | **Implementada** | Alinhada. OKRs e Key Results persistem e calculam progresso ponderado corretamente. | Baixo | Baixa |
| **Compliance** | **Parcial** | Falta OCR real para laudos, indexação vetorial de evidências e busca semântica do RAG. | Crítico | Alta |
| **Educação** | **Implementada** | LMS funcional, quizzes ativos e certificados criptográficos emitidos no SLA de 72h. | Baixo | Baixa |
| **Conhecimento** | **Parcial** | Biblioteca baseada em busca por palavra-chave básica. Falta busca semântica em linguagem natural. | Médio | Média |
| **Processos** | **Parcial** | O BPMN renderiza fluxos, mas falta o motor de orquestração de transição de status assíncrona. | Alto | Alta |
| **Documentos** | **Implementada** | Versionamento e fluxo linear de aprovação de POPs em conformidade com as regras vigentes. | Baixo | Baixa |
| **Riscos** | **Parcial** | Ocorrências funcionais, mas triagem de gravidade e geração de Ishikawa dependem de lógicas mockadas. | Alto | Média |

---

## 3. BPM GAP ANALYSIS (Orquestração de Processos)

*   **Estado Atual**: O frontend modela o JSON de BPMN e o envia para o backend. O backend salva em banco, mas as tarefas dependem de ações manuais do usuário na rota para avançar, sem validações rígidas de estados de outras entidades e sem controle assíncrono de prazos (SLA calculado síncrono na requisição).
*   **Arquitetura Alvo**: Engine de BPM como orquestradora de transições de status do sistema (ex: travar uso do POP se ele não estiver "Vigente" no BPM). Validação e disparos automáticos de tarefas executados por workers assíncronos.
*   **Limitações**: Processamento concorrente síncrono e ausência de bloqueios em cascata no banco de dados.

---

## 4. ECM GAP ANALYSIS (Gestão Documental)

*   **Versionamento**: Atendido e funcional (pops/pop_versoes).
*   **Aprovação**: Atendido. Edições pendentes são gravadas em separado até aprovação formal.
*   **Assinaturas**: Parcial. As assinaturas dos revisores são meros registros de strings textuais, carecendo de chaves criptográficas de conformidade legal.
*   **Gestão Documental**: Falta consolidar a exclusão da tabela duplicada `core_documentos` em favor das tabelas vigentes `pops`/`pop_versoes`.

---

## 5. LMS GAP ANALYSIS (Universidade Corporativa)

*   **Trilhas & Onboarding**: Atendido. O sistema cadastra trilhas obrigatórias e controla o SLA de 72 horas para novos funcionários.
*   **Certificações**: Atendido. Geração de certificados com assinaturas criptográficas de autenticidade.
*   **Reciclagens**: Parcial. As reciclagens são recomendadas de forma manual ou por lógica condicional simples. Falta a automação assíncrona baseada em eventos (ex: alteração de POP no ECM disparar imediatamente matrícula no LMS para o setor).

---

## 6. AI GAP ANALYSIS (Inteligência Artificial)

Comparativo entre a inteligência simulada (AS-IS) e a inteligência cognitiva integrada alvo (TO-BE):

| Recurso | Estado Atual (Simulado) | Estado Alvo (Real Planejado) | Gap de Engenharia |
| :--- | :--- | :--- | :--- |
| **OCR de Laudos** | Array mockado de texto. | Motor de extração real (Tesseract/LLM local). | Integração de biblioteca de PDF/OCR. |
| **RAG (Evidências)** | 4 strings de respostas estáticas baseadas em palavra-chave. | Busca semântica real baseada em embeddings vetoriais de manuais ONA. | Banco de dados vetorial (`pgvector`). |
| **Ishikawa (CAPA)** | Sugestões estáticas baseadas no termo "queda" ou "medicação". | Classificação de causa raiz gerada por LLM com base na descrição semântica do incidente. | Conexão API de LLM local (Ollama). |
| **Recomendação LMS**| Lógica condicional simples. | Agente analisando a recorrência de não conformidades do setor para inovar trilhas. | Agente de IA integrado ao LMS. |

---

## 7. SECURITY GAP ANALYSIS (Segurança da Informação)

*   **JWT & Cookies**: O JWT funciona, mas é guardado no localStorage (expondo a sessão a roubos via XSS). A arquitetura target exige **HttpOnly, Secure e SameSite=Strict Cookies**.
*   **CORS**: Configurado com wildcard `origin: '*'` (aberto). O target exige restrição rígida baseada em domínios confiáveis parametrizados no `.env`.
*   **Rate Limiting**: Totalmente ausente no login e rotas de IA do backend atual.
*   **RBAC & Auditoria**: A matriz de privilégios e os logs do banco funcionam, mas as rotas legadas (/routes) ignoram o middleware de RBAC avançado, criando brechas de segurança.

---

## 8. TPM GAP ANALYSIS (Governança de Confiança)

Mapeamento de conformidade em relação à camada externa de governança do TPM:

| Validação | Status Atual | Lacuna Identificada |
| :--- | :--- | :--- |
| **Architecture Validation** | **Ausente** | Não há análise automática de violações de Clean Architecture ou Bounded Contexts na CI. |
| **Security Validation** | **Parcial** | Há criptografia no seed de banco, mas não há scan contínuo de segredos e chaves expostas. |
| **Dependency Validation** | **Ausente** | Inexistência de varreduras na esteira de desenvolvimento contra pacotes com vulnerabilidades NPM. |
| **Hygiene Validation** | **Ausente** | Não há mapeamento contínuo de degradação arquitetural e arquivos órfãos (como o excluído iot.ts). |
| **AI Governance** | **Ausente** | Não há auditoria sobre segurança de prompts, acurácia de RAG ou chamadas via MCP. |
| **Compliance Validation** | **Ausente** | Nenhuma regra impede deploys sem a chancela de integridade do TPM. |
| **Audit Validation** | **Ausente** | Não há consolidação ou logs de evidências imutáveis gerados pela esteira de validação. |

---

## 9. DOMAIN GAP ANALYSIS (DDD e Bounded Contexts)

*   **Bounded Contexts**: Há vazamentos de limites. Controladores na camada legada (`app/backend/src/routes/`) consultam indistintamente tabelas de documentos, OKRs e auditorias em uma única rota sem respeitar as fronteiras de dados.
*   **Ownership de Dados**: Ocorre violação direta de propriedade de dados no banco. Lógicas do módulo de incidentes inserem dados diretamente em tabelas de auditoria regulatória de compliance, sem usar mensageria ou serviços desacoplados.
*   **Event Map**: Ausente. A comunicação entre os domínios é puramente síncrona e fortemente acoplada por chamadas de funções diretas na API.
*   **Ubiquitous Language**: Parcial. Termos como POP, CAPA e Acreditação estão presentes na interface, mas convivem no banco de dados com jargões legados.

---

## 10. ARCHITECTURE GAP ANALYSIS (Redundâncias e Acoplamentos)

*   **Duplicações**: Presença de tabelas equivalentes operando na mesma base de dados PostgreSQL (`pops` vs `core_documentos`; `incidentes` vs `core_ocorrencias`; `ona_requisitos` vs `ona_diagnosticos`).
*   **Acoplamento Físico**: Next.js e Fastify rodam no mesmo contêiner físico. Instabilidades de consumo de memória RAM do renderizador podem derrubar o backend HTTP Fastify instantaneamente.
*   **Dependências Proibidas**: As rotas legadas acessam o pool de banco PostgreSQL de forma direta e inline, ignorando as abstrações de repositórios e serviços de Clean Architecture.

---

## 11. DATA GAP ANALYSIS (Persistência e Integridade)

*   **Ownership de Escrita**: Múltiplos serviços escrevem nas mesmas tabelas de incidentes e documentos de qualidade de forma direta, ignorando o encapsulamento do repositório correspondente.
*   **Integridade Referencial**: Tabelas legadas possuem chaves estrangeiras mal mapeadas ou ausência de regras `ON DELETE` adequadas, gerando risco de registros órfãos em deletados físicos.
*   **Falta de Suporte Vetorial**: O PostgreSQL atual não possui a extensão `pgvector` ativa, inviabilizando o armazenamento real de assinaturas vetoriais (embeddings) dos POPs e laudos ONA.

---

## 12. EVENT ARCHITECTURE GAP ANALYSIS (Arquitetura de Eventos)

*   **Estado Atual (Forte Acoplamento)**: Quando um POP é aprovado, o controlador faz chamadas explícitas e síncronas de funções para criar registros na tabela de notificações e loops para enviar e-mails. Se a chamada falhar ou estourar o SLA, o processamento HTTP é abortado e retorna erro 500 para o usuário.
*   **Estado Alvo (Orientação a Eventos)**: O controlador do ECM publica o evento `NovaVersaoDocumentoVigente` no barramento assíncrono interno. O LMS, a Governança e o módulo de Mensageria consomem esse evento de forma independente e assíncrona, isolando falhas e otimizando a latência do cliente.

---

## 13. PRIORITIZATION MATRIX (Matriz de Priorização de Gaps)

Matriz para direcionamento tático das correções baseada em urgência, complexidade e dependências de negócio:

| Identificador | Gap de Negócio / Técnico | Prioridade | Complexidade | Pré-requisitos / Bloqueadores |
| :--- | :--- | :--- | :--- | :--- |
| **GAP-SEC-01** | CORS wildcard aberto (`*`) e JWT exposto no localStorage. | **Crítica** | Baixa | Nômades (nenhuma dependência). |
| **GAP-DB-01** | Unificação de tabelas duplicadas no PostgreSQL. | **Alta** | Média | Executar scripts de migração de dados antigos. |
| **GAP-TPM-01**| Criação da esteira contínua de scans de segurança/segredos. | **Alta** | Média | Configurar runner de validação integrado. |
| **GAP-BPM-01**| Engine de BPM como orquestrador ativo de transição de status. | **Alta** | Alta | Consolidação prévia das tabelas de POPs. |
| **GAP-AI-01**  | Configuração de RAG, pgvector e OCR real para evidências ONA. | **Média** | Alta | Ativação da extensão `pgvector` no PostgreSQL. |
| **GAP-EVT-01** | Barramento interno de eventos assíncronos (`Event Bus`). | **Média** | Média | Desacoplamento dos controladores legados. |
| **GAP-SCALE-01**| Separação física de contêineres entre Next.js e Fastify API. | **Média** | Baixa | Refatoração de caminhos no docker-compose. |
| **GAP-FHIR-01**| Conexão de endpoints FHIR às tabelas dinâmicas do banco. | **Baixa** | Baixa | Estabilização do esquema unificado de usuários. |

---

## 14. TRANSFORMATION MAP (Mapa de Transformação)

Classificação final das lacunas em rotas de evolução arquitetural para o time de engenharia:

### KEEP
*   Estrutura de regras de OKRs e KRs estratégicos.
*   Trilhas obrigatórias e lições de progresso do LMS.
*   Lógica criptográfica PBKDF2 de senhas dos seeds.

### EVOLVE
*   Autenticação JWT (migrar para cookies HttpOnly).
*   Configuração do docker-compose (separar contêineres do Next e Fastify).
*   Conector de interoperabilidade FHIR (conectar à base ativa).
*   Políticas CORS (bloquear wildcard).

### CONSOLIDATE
*   Unificar tabelas de incidentes legadas em `core_ocorrencias`.
*   Unificar checklists legados ONA em `ona_diagnosticos`.
*   Eliminar `core_documentos` concentrando a persistência em `pops`/`pop_versoes`.

### RETIRE
*   Rotinas TypeScript de mocks de IA baseadas em keywords estáticas.
*   Armazenamento do token de sessão no localStorage do frontend.
*   Consultas SQL bruto diretas inline de banco nas rotas.

### CREATE
*   Banco de dados vetorial (`pgvector` ativado no Postgres).
*   Barramento interno de eventos de domínio (`Internal Event Bus`).
*   Camada de IA integrada via LLM/MCP.
*   Esteira contínua de validação de conformidade de código do TPM.
