# Item 01 — Domain Discovery — Universal Integration Hub (UIH)

Este documento estabelece o escopo de negócios, o alinhamento estratégico, as personas e a Linguagem Ubíqua do módulo **Universal Integration Hub (UIH)** do QualitiOS.

---

## 1. PROBLEMA DE NEGÓCIO (BUSINESS PROBLEM)

Organizações que implementam o QualitiOS já utilizam uma ampla variedade de sistemas legados de terceiros, como ERPs (SAP, TOTVS), HIS (Tasy, Soul MV), CRMs, plataformas de RH, BPMs e ECMs. A integração com esses sistemas apresenta as seguintes dores críticas:

1.  **Acoplamento e Vendor Lock-in**: Cada novo cliente exige código customizado para mapear dados específicos de seu HIS ou ERP para as tabelas do QualitiOS. Isso gera alto custo de engenharia de software e dependência crônica do fornecedor.
2.  **Fragmentação de Dados**: Sem uma camada de transformação comum, a integridade referencial dos dados assistenciais (colaboradores, ocorrências, indicadores) é frequentemente violada, gerando duplicidades e relatórios discrepantes.
3.  **Processos de Sincronismo Frágeis**: Falhas temporárias de rede em conexões a APIs externas interrompem o fluxo de atualizações de dados. Não existem políticas padronizadas de retentativa, filas de erros ou resiliência.
4.  **Ineficiência Operacional de TI**: O time de tecnologia do cliente gasta semanas configurando portas de firewall, tokens de API e adaptadores personalizados para cada fluxo de dados.

---

## 2. ATORES E PERSONAS (ACTORS & PERSONAS)

*   **Administrador de TI / Arquiteto de Integração (Cliente)**:
    *   *Objetivo*: Configurar conexões, chaves de autenticação, schemas canônicos e monitorar a saúde física das integrações.
*   **Analista de Negócios / Qualidade (Cliente)**:
    *   *Objetivo*: Mapear graficamente os campos do sistema de origem para o modelo canônico do QualitiOS, sem necessidade de programar.
*   **Gestor de Segurança / DPO**:
    *   *Objetivo*: Garantir o isolamento de dados no multi-tenancy e auditar quais credenciais e conexões externas estão ativas.

---

## 3. OBJETIVOS E RESULTADOS ESPERADOS (OBJECTIVES & KEY RESULTS)

### Objetivos:
*   **Desacoplar a Integração**: Prover uma camada intermediária que isola o QualitiOS dos detalhes proprietários de terceiros.
*   **Padronizar a Entrada (Modelo Canônico)**: Exigir que sistemas de origem exportem ou se adaptem a um modelo de dados padronizado do QualitiOS.
*   **Fornecer Conectividade Universal**: Oferecer drivers abstratos para consumo de dados via REST API, Webhooks, JDBC/ODBC e Arquivos Planos.

### Resultados Esperados:
*   **Redução de 90%** no tempo gasto no onboarding de novos clientes com sistemas legados integrados.
*   **Zero código customizado** para novas integrações no core do backend.
*   **Garantia total** de isolamento lógico de multi-tenancy de cargas de dados.

---

## 4. LINGUAGEM UBÍQUA (UBIQUITOUS LANGUAGE)

*   **Universal Integration Hub (UIH)**: Camada de software desacoplada encarregada de gerenciar a ingestão, tradução e tráfego de dados com o exterior.
*   **Connector (Conector)**: Driver abstrato de conexão física (REST, Webhook, banco de dados ou arquivo).
*   **Inbound Connector (Conector de Entrada)**: Canal que recebe dados do exterior e os ingere no QualitiOS.
*   **Outbound Connector (Conector de Saída)**: Canal que envia eventos ou dados do QualitiOS para sistemas externos.
*   **Canonical Model (Modelo Canônico)**: Especificação padronizada e imutável de dados do QualitiOS para entidades de negócios (ex: Colaborador, Ocorrência, Indicador).
*   **Mapping Engine (Motor de Mapeamento)**: Componente que traduz um payload proprietário de origem para a estrutura do Modelo Canônico.
*   **Sync Engine (Motor de Sincronismo)**: Componente que orquestra a frequência e concorrência das cargas (Realtime, Batch, Delta).
*   **Event Bridge (Ponte de Eventos)**: Roteador de mensagens assíncronas que liga o Event Bus interno a barramentos de mensageria de terceiros.
*   **Dead Letter Queue (DLQ)**: Fila para reter payloads que falharam na validação ou processamento, permitindo auditoria e replay.
