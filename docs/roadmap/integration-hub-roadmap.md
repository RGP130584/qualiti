# Item 12 — Roadmap — Universal Integration Hub (UIH)

Este documento define o Roadmap de Desenvolvimento do módulo **Universal Integration Hub (UIH)** em seis ondas (Waves A a F).

---

## 1. SEQUENCIAMENTO DAS ONDAS DE ENTREGA

A construção do UIH inicia-se pela base estrutural e regras de transformação de dados (ACL) para, nas fases avançadas, integrar brokers assíncronos e políticas de segurança e isolamento robustas:

```mermaid
gantt
    title Cronograma de Ondas de Desenvolvimento do UIH
    dateFormat  YYYY-MM
    section Core & Mapeamento
    Wave A: Schemas & Conectores Básicos :active, waveA, 2026-06, 2026-08
    Wave B: Mapping Engine & Lookups : waveB, 2026-08, 2026-10
    section Sincronismo & Eventos
    Wave C: Sync Engine & Cargas Delta : waveC, 2026-10, 2026-12
    Wave D: Event Bridge & Brokers : waveD, 2026-12, 2027-02
    section Segurança & Multi-Tenant
    Wave E: Credential Vault & mTLS : waveE, 2027-02, 2027-04
    Wave F: Multi-Tenant Throttling & DLQ : waveF, 2027-04, 2027-06
```

---

## 2. ESPECIFICAÇÃO DAS ONDAS DO ROADMAP

### Wave A: Schemas & Conectores Básicos (Conectividade Inicial)
*   **Objetivo**: Estabelecer a infraestrutura de tabelas de conexão no PostgreSQL e drivers básicos de entrada via REST API e arquivos planos.
*   **Principais Entregáveis**:
    *   Tabelas do banco para `IntegrationPipeline`, `Connection` e `CanonicalSchema`.
    *   REST API Connector básico para chamadas HTTPS.
    *   Uploader de arquivos CSV na biblioteca central.

### Wave B: Mapping Engine & Lookups (Camada de Tradução - ACL)
*   **Objetivo**: Implementar a engine em memória para mapeamento JSONPath/XPath e tabelas de tradução de enums de fornecedores externos.
*   **Principais Entregáveis**:
    *   Serviço de transformação de dados (`MappingEngine`) com suporte a conversão de tipos de dados.
    *   Tabela de lookups e equivalências para enums de terceiros.
    *   Validador de schemas canônicos contra especificações JSON Schema.

### Wave C: Sync Engine & Cargas Delta (Controle de Sincronismo)
*   **Objetivo**: Desenvolver o agendamento em lote de cargas delta de alto volume baseado no timestamp da última execução bem-sucedida, com suporte a limites de chunks.
*   **Principais Entregáveis**:
    *   Agendador de cron jobs integrado ao Sync Engine.
    *   Gravação de estado do timestamp incremental (`last_sync_at`) por pipeline.
    *   Mecanismo de concorrência com travas de exclusão mútua (`tenant_lock`) no Redis.

### Wave D: Event Bridge & Brokers (Integração de Mensageria)
*   **Objetivo**: Mapear e conectar o barramento de eventos interno do QualitiOS a brokers externos assíncronos (AWS SQS, RabbitMQ, Webhooks de saída).
*   **Principais Entregáveis**:
    *   Event Router escutando e envelopando eventos internos no padrão canônico de integração.
    *   Conector RabbitMQ e SQS ativo.
    *   Tabela de gravação física da Dead Letter Queue (`event_dlq`).

### Wave E: Credential Vault & mTLS (Blindagem de Conexões)
*   **Objetivo**: Implementar criptografia de dados em repouso de credenciais externas e autenticação mútua TLS (mTLS) de cliente.
*   **Principais Entregáveis**:
    *   Integração do backend com cofre de chaves (HashiCorp Vault ou AWS KMS) usando criptografia AES-256-GCM.
    *   Parametrização de mTLS com suporte a carregamento de certificados por pipeline.

### Wave F: Multi-Tenant Throttling & DLQ (Resiliência & Governança)
*   **Objetivo**: Implementar rate-limiting de Webhooks por tenant e console de administração gráfica para edição e reprocessamento (replay) de mensagens da DLQ.
*   **Principais Entregáveis**:
    *   Filtro de Rate-Limiting por tenant no gateway (HTTP 429).
    *   Interface no painel administrativo para edição manual de mensagens e acionamento de replay da DLQ.
    *   Rotinas automáticas de limpeza de logs excedentes.
