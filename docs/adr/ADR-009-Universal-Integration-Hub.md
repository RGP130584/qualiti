# ADR-009: Design and Freeze of the Universal Integration Hub (UIH) Domain

*   **Status**: Aprovada (Accepted)
*   **Data**: 2026-06-08
*   **Autor**: Antigravity (Advanced Agentic Coding)

---

## 1. CONTEXTO (CONTEXT)

O QualitiOS opera sob requisitos dinâmicos e necessita importar/sincronizar continuamente dados estratégicos de colaboradores, ocorrências, indicadores e documentos gerados em sistemas legados proprietários de terceiros (HIS MV/Tasy, ERP SAP/TOTVS, CRM, etc.). 

A criação de conectores integrados diretamente nas rotas do Core Platform geraria acoplamento de código indesejado, alto custo de manutenção de software para cada novo cliente e riscos severos de vazamento de dados em ambiente multi-tenant.

Para mitigar estes problemas, desenhamos a especificação técnica e de negócios do **Universal Integration Hub (UIH)**.

---

## 2. DECISÃO DE DESIGN (DECISION)

Decidimos congelar oficialmente a arquitetura do módulo UIH conforme estruturada nas especificações e validada pelo review final:

1.  **Camada Anticorrupção (ACL)**: O UIH atua isolando os domínios do QualitiOS das lógicas proprietárias de terceiros. Todo tráfego externo é sanitizado e traduzido antes de ingressar no sistema.
2.  **Hexagonal Connector Framework**: Uso de portas e adaptadores abstratos estendendo a base comum de conectores (REST, Webhooks, JDBC, Buckets de arquivos planos).
3.  **Mapping Engine em Memória**: Regras lógicas de conversão JSONPath/XPath, lookups dinâmicos de enums e verificação rígida contra JSON Schemas Canônicos das entidades de negócio.
4.  **Sync Engine Diferencial**: Processamento de cargas em lotes (chunks) utilizando delta baseada no timestamp de última execução bem-sucedida (`last_sync_at`) e travas de Redis por tenant.
5.  **Ponte de Eventos (Event Bridge)**: Envelope canônico JSON de tráfego de mensagens assíncronas ligando brokers externos (RabbitMQ, SQS, Kafka) ao barramento interno de eventos.
6.  **Resiliência com DLQ**: Isolamento automático de falhas na Dead Letter Queue (`event_dlq`) e retentativas exponenciais com Jitter para erros de rede, com suporte a reprocessamento (replay) via console de TI.
7.  **Isolamento de Credenciais**: Armazenamento criptografado (AES-256-GCM) de chaves de conexão externas vinculadas a chaves exclusivas de derivação por tenant.
8.  **Vazão e Rate-Limiting**: Proteção contra saturação de recursos com rate-limiting de Webhooks por tenant e limites globais de concorrência de processamento.

---

## 3. CONSEQUÊNCIAS (CONSEQUENCES)

### Consequências Positivas:
*   **Desacoplamento e Independência de Fornecedor**: O QualitiOS aceita dados de qualquer ERP ou HIS, contanto que adaptados ao Modelo Canônico de dados.
*   **Segurança e Privacidade (LGPD)**: Proteção contra vazamento de dados multi-tenant e mascaramento automático de PII em logs de depuração.
*   **Resiliência Operacional**: Tratamento de timeouts de rede e erros sem corromper transações de banco ativas.

### Consequências Negativas:
*   **Processamento de CPU**: Mapeamento e validação de JSON em memória para cargas gigantescas exigirá controle e monitoramento de memória.
*   **Latência de Integração**: A reatividade de eventos inbound pode sofrer atraso devido às etapas consecutivas de validação, mapeamento e enfileiramento na Event Bridge.
*   **Complexidade de Rastreabilidade**: Diagnosticar falhas exige o acompanhamento de logs da DLQ em pipeline assíncrono.
