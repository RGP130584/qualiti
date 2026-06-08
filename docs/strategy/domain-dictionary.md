# Dicionário de Domínios e Fronteiras de Dados — QualitiOS

Este documento descreve formalmente as fronteiras dos **Bounded Contexts** do ecossistema QualitiOS, delimitando a propriedade de gravação de tabelas físicas no PostgreSQL e regulando a integração entre os domínios.

---

## 1. Mapeamento de Domínios e Tabelas PostgreSQL

A persistência do QualitiOS está dividida em fronteiras estritas. Cada tabela do banco de dados relacional é de propriedade única de um Bounded Context. Apenas o contexto proprietário tem permissão para realizar escritas (`INSERT`, `UPDATE`, `DELETE`) em suas tabelas.

```text
 ┌─────────────────────────────────────────────────────────────┐
 │                         GOVERNANÇA                          │
 │  (usuarios, instituicao, funcoes_cadastradas, cargos_config) │
 └──────────────┬──────────────────────────────┬───────────────┘
                │                              │
 ┌──────────────▼──────────────┐┌──────────────▼──────────────┐
 │         DOCUMENTOS          ││            RISCOS           │
 │ (pops, pop_versoes, reviews)││         (incidentes)         │
 └─────────────────────────────┘└─────────────────────────────┘
```

### 1.1. Contexto: Governança (Core Domain)
*   **Responsabilidade**: Controle administrativo geral do sistema, inquilinos (wizard), RBAC (cargos e permissões) e gerenciamento de usuários.
*   **Tabelas de Propriedade**:
    *   `instituicao`
    *   `usuarios`
    *   `funcoes_cadastradas`
    *   `setores_config`
    *   `cargos_config`

### 1.2. Contexto: Estratégia (Supporting Domain)
*   **Responsabilidade**: Gestão de metas institucionais (OKRs), ciclos de resultados-chave (Key Results) e coleta periódica de KPIs operacionais (Indicadores).
*   **Tabelas de Propriedade**:
    *   `okrs`
    *   `key_results`
    *   `okr_cycles`
    *   `okr_progress`
    *   `indicadores`
    *   `indicador_coletas`

### 1.3. Contexto: Compliance (Supporting Domain)
*   **Responsabilidade**: Avaliação contínua de requisitos para acreditação (ONA e normas ISO), evidências físicas de conformidade e notas.
*   **Tabelas de Propriedade**:
    *   `ona_requisitos` (e sub-tabelas do módulo ona)

### 1.4. Contexto: Educação (Supporting Domain)
*   **Responsabilidade**: Universidade corporativa, cursos LMS obrigatórios (com prazos de SLA), lições em vídeo, testes rápidos (quizzes), gamificação de badges, certificados digitais e matriz de competências por papel técnico.
*   **Tabelas de Propriedade**:
    *   `education_courses`, `education_modules`, `education_lessons`
    *   `education_quizzes`, `education_progress`, `education_certificates`
    *   `education_tracks`, `education_competencies`, `education_badges`
    *   `education_library`, `education_notifications`

### 1.5. Contexto: Conhecimento (Supporting Domain)
*   **Responsabilidade**: Criação de formulários estruturados, templates em rich-text e placeholders para padronização documental.
*   **Tabelas de Propriedade**:
    *   `document_templates`
    *   `document_categories`
    *   `document_forms`
    *   `document_fields`

### 1.6. Contexto: Processos (Supporting Domain)
*   **Responsabilidade**: Orquestração BPMN, SLA de fluxo em horas e controle de fluxos de trabalho (workflow).
*   **Tabelas de Propriedade**:
    *   `bpm_fluxos`
    *   `bpm_execucoes`
    *   `document_workflows`

### 1.7. Contexto: Documentos (Supporting Domain)
*   **Responsabilidade**: Controle eletrônico de documentos (POPs e protocolos clínicos), controle de revisão periódica de versões, aprovações formais e prazos de SLA de revisão.
*   **Tabelas de Propriedade**:
    *   `pops`
    *   `pop_versoes`
    *   `document_versions`
    *   `document_permissions`
    *   `document_status`
    *   `document_slas`
    *   `document_reviews`

### 1.8. Contexto: Riscos (Supporting Domain)
*   **Responsabilidade**: Relato de eventos adversos (incidentes), investigação de causa-raiz (Ishikawa) e elaboração de planos de ação (CAPA).
*   **Tabelas de Propriedade**:
    *   `incidentes`

### 1.9. Contexto Genérico: IAM / Notificações / Auditoria
*   **Responsabilidade**: Serviços transversais compartilhados.
*   **Tabelas de Propriedade**:
    *   `auditoria_logs`
    *   `notificacoes`

---

## 2. Regra Geral de Proibição de Escrita Cruzada Directa

*   **A Regra**: Sob nenhuma circunstância o controller, service ou repositório de um Bounded Context está autorizado a efetuar escritas diretamente nas tabelas pertencentes a outro Bounded Context.
*   *Exemplo*: Ao registrar um incidente no `RiscosContext`, o código não pode inserir uma notificação diretamente na tabela `notificacoes`. O registro do incidente deve publicar um evento `IncidenteRegistrado` no barramento assíncrono interno, e o `NotificacoesContext` (que escuta o evento) deve efetuar a inserção na tabela `notificacoes` a partir de seu próprio manipulador.
*   **O que o TPM audita**: O motor de avaliação estática da Wave 2 inspeciona os repositórios e queries SQL geradas, disparando erros de compilação/CI se encontrar chamadas que editem tabelas de outros contextos a partir de diretórios não proprietários.
