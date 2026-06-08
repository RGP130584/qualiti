# ADR-010: Design and Freeze of the Organization Management & Org Chart (OMOC) Domain

*   **Status**: Aprovada (Accepted)
*   **Data**: 2026-06-08
*   **Autor**: Antigravity (Advanced Agentic Coding)

---

## 1. CONTEXTO (CONTEXT)

Hospitais e indústrias reguladas operam sob estruturas de pessoal e cargos extremamente voláteis. Anteriormente, setores e cargos eram cadastrados individualmente e de forma duplicada em múltiplos módulos (LMS, BPM, ECM), gerando inconsistências graves em permissões de acessos (RBAC), estouros de SLAs de aprovações assistenciais por demissão de funcionários e perda de histórico de responsabilidades em auditorias externas.

Para prover uma Fonte Única de Verdade (SSoT) estruturada e resiliente para o QualitiOS, concebemos a especificação do domínio **Organization Management & Org Chart (OMOC)**.

---

## 2. DECISÃO DE DESIGN (DECISION)

Decidimos congelar oficialmente a arquitetura do domínio OMOC conforme especificado nas diretrizes lógicas e validado pelo review de conformidade:

1.  **Vínculo Baseado em Cargo (Position-Based Routing)**: Permissões de sistema, filas de tarefas de processos (BPM) e aprovações de documentos (ECM) são vinculados à entidade `Position` e não ao colaborador (`Employee`) diretamente.
2.  **Reporting Lines Relacionais**: As subordinações lógicas conectam `Position` a `Position`. O sistema suporta reportes diretos estruturados em árvore (solid lines) e reportes matriciais paralelos (dotted lines).
3.  **Redirecionamento Automático**: A demissão ou movimentação de um colaborador libera a vaga (`Position`) e redireciona automaticamente as pendências ativas de sua fila pessoal para o cargo do superior direto da `ReportingLine`.
4.  **Substituições e Interinidades Temporárias**: Entidades e regras temporais controlam a delegação de tarefas de aprovação de forma programada e o acúmulo de cargos de liderança com herança automática de permissões.
5.  **Multi-Tenancy Integrado**: Segregação de organogramas por tenant através do isolamento indexado por `tenant_id` atrelado aos tokens JWT de sessões.
6.  **Integração ACL via UIH**: Ingestão automática de colaboradores de ERPs de RH externos mapeados para schemas canônicos (`CanonicalEmployee`, `CanonicalPosition`).

---

## 3. CONSEQUÊNCIAS (CONSEQUENCES)

### Consequências Positivas:
*   **Continuidade Operacional**: Fim do travamento de workflows de BPM por demissão ou férias de coordenadores assistenciais.
*   **Higienização e Auditoria**: Rastreabilidade completa e unificada do histórico de ocupação de cargos por colaboradores, atendendo às fiscalizações ONA/ISO.
*   **Onboarding Veloz**: Matrícula automática de novos admitidos em trilhas regulatórias no LMS com SLA de 72h.

### Consequências Negativas:
*   **Recursividade em Consultas**: A varredura de chefias requer queries recursivas (Recursive CTEs) no PostgreSQL, exigindo otimização com cache em Redis.
*   **Grafo de Relacionamentos Complexo**: A prevenção de loops de dependências circulares de cargos exige validações extras em tempo de escrita na camada de persistência.
