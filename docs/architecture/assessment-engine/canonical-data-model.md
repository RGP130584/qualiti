# Fase 10 — Modelo Canônico de Dados (Canonical Data Model) — ATE

Este documento especifica a modelagem relacional lógica, o zoneamento de agregados, a propriedade de leitura/escrita e as regras de multi-tenancy do domínio **Assessment & Transformation Engine (ATE)**.

---

## 1. ZONEAMENTO DE AGREGADOS (AGGREGATE BOUNDARIES)

O modelo de dados do ATE divide-se em dois agregados principais, cada um possuindo um Aggregate Root responsável por manter a integridade transacional das entidades filhas.

```text
Agregado: Assessment (Aggregate Root)
├── AssessmentQuestion (Entidade)
├── AssessmentAnswer (Entidade)
├── Evidence (Entidade)
├── CapabilityScore (Entidade)
├── Gap (Entidade)
└── Recommendation (Entidade)

Agregado: TransformationPlan (Aggregate Root)
├── Roadmap (Entidade)
├── TransformationProject (Entidade)
└── TransformationTask (Entidade)
```

---

## 2. RELACIONAMENTOS E INTEGRIDADE DE CHAVES

### 2.1. Hierarquia Relacional do Assessment
*   Um `Assessment` possui cardinalidade 1-para-N com `AssessmentQuestion`.
*   Uma `AssessmentQuestion` possui cardinalidade 1-para-1 com `AssessmentAnswer`.
*   Uma `AssessmentAnswer` possui cardinalidade 1-para-N com `Evidence`.
*   Um `Assessment` possui cardinalidade 1-para-N com `CapabilityScore`.
*   Um `Assessment` possui cardinalidade 1-para-N com `Gap`.
*   Um `Gap` possui cardinalidade 1-para-N com `Recommendation`.

### 2.2. Hierarquia Relacional do TransformationPlan
*   Um `TransformationPlan` é criado a partir de um `Assessment` (cardinalidade 1-para-1).
*   Um `TransformationPlan` possui cardinalidade 1-para-N com `Roadmap` (um registro por Wave de transformação ativa).
*   Um `TransformationPlan` possui cardinalidade 1-para-N com `TransformationProject`.
*   Um `TransformationProject` possui cardinalidade 1-para-N com `TransformationTask`.

---

## 3. OWNERSHIP E FRONTEIRAS DE ESCRITA (DATA OWNERSHIP)

Para respeitar os limites de Bounded Contexts em DDD e impedir o acoplamento do banco de dados:

### 3.1. Escrita (Write Permissions)
*   **ATE Backend Services**: Exclusivo detentor do direito de escrita (INSERT, UPDATE, DELETE) em todas as tabelas prefixadas com `ate_*` (ex: `ate_assessment`, `ate_gap`, `ate_transformation_plan`).
*   **Outros Contextos**: Proibidos de realizar inserções ou modificações diretas nas tabelas de ATE. A alteração de estados externos (ex: conclusão de uma tarefa de transformação no setor assistencial) deve publicar um evento no barramento, o qual é capturado pelo serviço do ATE para atualizar seu próprio estado.

### 3.2. Leitura (Read Permissions)
*   **Frontend (Next.js SSR)**: Permissão de leitura via rotas seguras de API RESTful expostas pelo Fastify Backend do ATE.
*   **Contexto de Estratégia (OKRs)**: Lê os registros de `CapabilityScore` para recalcular KRs estratégicos associados à maturidade operacional.
*   **Contexto de Compliance**: Lê dados de `Gap` e `Evidence` para gerar relatórios consolidados de conformidade para certificadoras.

### 3.3. Eventos Emitidos (Domain Events)
As transições críticas do modelo geram os eventos:
*   `ate.assessment.started` ➔ Ao instanciar `Assessment`.
*   `ate.assessment.completed` ➔ Ao finalizar `Assessment`.
*   `ate.capability.scored` ➔ Ao inserir registros em `CapabilityScore`.
*   `ate.gap.identified` ➔ Ao gerar um `Gap`.
*   `ate.roadmap.generated` ➔ Ao salvar o `TransformationPlan`.
*   `ate.project.created` ➔ Ao abrir um `TransformationProject`.

---

## 4. MULTI-TENANCY LÓGICO & ISOLAMENTO DE DADOS

O QualitiOS opera sob uma arquitetura de banco de dados único com segregação lógica por tenant (Multi-Tenancy lógico):

*   **Identificador de Escopo**: Todas as tabelas raiz de agregados (`ate_assessment` e `ate_transformation_plan`) contêm obrigatoriamente a coluna `tenant_id: UUID` com restrição `NOT NULL` e chave estrangeira para a tabela de tenants globais.
*   **Filtro Automático de Consultas**: A camada de persistência (Persistence Layer) implementa um wrapper global nas consultas SQL do ATE. Toda cláusula `WHERE` de leitura ou escrita anexa automaticamente a condição:
    $$\text{WHERE tenant\_id} = \text{session.tenant\_id}$$
    Onde `session.tenant_id` é extraído do token JWT verificado pelo gateway do Fastify.
*   **Ownership das Evidências**: Arquivos anexados às entidades `Evidence` são salvos em um bucket de armazenamento compartilhado (ex: S3 ou MinIO), organizados sob pastas nomeadas com o UUID do tenant correspondente (`/buckets/evidences/{tenant_id}/{evidence_id}.pdf`). O uploader valida as permissões de acesso ao diretório do bucket contra as credenciais da sessão.
*   **Trilha de Auditoria (Audit Log)**: Toda operação de mutação (criação, edição e exclusão) nas tabelas do ATE dispara um trigger de banco de dados que escreve no log de auditoria global imutável (`audit_logs`), registrando:
    *   `timestamp` da operação.
    *   `tenant_id` e `usuario_id` executor.
    *   `tipo_operacao` (INSERT, UPDATE, DELETE).
    *   `tabela_afetada` e `uuid_registro`.
    *   `estado_anterior` e `novo_estado` (payload em JSONB para rastreabilidade de diffs).
