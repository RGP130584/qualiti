# Item 11 — Roadmap — Platform Administration & Licensing (PAL)

Este documento define o Roadmap de Implantação do módulo **Platform Administration & Licensing (PAL)** dividindo seu desenvolvimento em seis ondas (Waves A a F) de entrega.

---

## 1. SEQUENCIAMENTO DAS ONDAS DO ROADMAP

A estruturação do PAL inicia-se pela base do multi-tenancy e gerenciamento de licenças de módulos para, posteriormente, acoplar controles finos de feature flags, rastreamento de consumo e o motor de faturamento automático:

```mermaid
gantt
    title Cronograma de Ondas de Desenvolvimento do PAL
    dateFormat  YYYY-MM
    section SaaS Core & Licenciamento
    Wave A: Tenant Management & Organização Base :active, waveA, 2026-06, 2026-08
    Wave B: Module Licensing & Sidebar Dinâmica : waveB, 2026-08, 2026-10
    section Features & Consumo
    Wave C: Feature Flags & Bloqueios : waveC, 2026-10, 2026-12
    Wave D: Usage Tracking & Quotas de Recursos : waveD, 2026-12, 2027-02
    section Billing & Self-Service
    Wave E: Billing & Faturamento Recorrente : waveE, 2027-02, 2027-04
    Wave F: Self-Service Marketplace de Add-ons : waveF, 2027-04, 2027-06
```

---

## 2. ESPECIFICAÇÃO DAS ONDAS DO ROADMAP

### Wave A: Tenant Management (Gestão de Clientes SaaS)
*   **Objetivo**: Estruturar a base do PostgreSQL para multi-tenancy dinâmico e criar as interfaces para ativação/desativação manual de tenants.
*   **Principais Entregáveis**:
    *   Tabelas para `Tenant`, `Subscription` e `Plan`.
    *   Roteamento do API Gateway resolvendo subdomínios (ex: `santarita.qualitios.com`).

### Wave B: Module Licensing (Licenciamento de Módulos)
*   **Objetivo**: Implementar o catálogo global de produtos, chaves de licenças ativas e a renderização dinâmica de menus no layout do frontend.
*   **Principais Entregáveis**:
    *   Tabela `License` e catálogo de módulos cadastrados.
    *   Reconstrução dinâmica do menu lateral (sidebar) baseado em metadados de licenças ativas.

### Wave C: Feature Flags (Controle de Funcionalidades)
*   **Objetivo**: Desenvolver o motor de Feature Flags com suporte a herança (plano base) e overrides (por assinatura), aplicando middleware de bloqueio no backend.
*   **Principais Entregáveis**:
    *   Verificador dinâmico `checkFeatureFlag`.
    *   Middleware Fastify bloqueando chamadas a rotas inativas (HTTP 403).

### Wave D: Usage Tracking (Coleta de Consumo)
*   **Objetivo**: Implementar tarefas em background (Workers) para monitorar cotas de uso de disco, usuários ativos, execuções de BPM e exames, emitindo alertas visuais.
*   **Principais Entregáveis**:
    *   Usage Workers persistindo dados na tabela `UsageMetric`.
    *   Semáforos de cotas e alertas visuais de aviso de limite no frontend (90% cota).

### Wave E: Billing (Faturamento Recorrente)
*   **Objetivo**: Automatizar a geração mensal de faturas baseadas no plano contratado e consumo de add-ons, integrando com gateways de pagamentos.
*   **Principais Entregáveis**:
    *   Motor de billing gerando `Invoice` mensais.
    *   Webhook de confirmação de pagamento do gateway.
    *   Rotina diária suspende assinaturas inadimplentes a mais de 5 dias (`status = SUSPENDED`).

### Wave F: Self-Service Marketplace (Portal do Cliente)
*   **Objetivo**: Desenvolver a loja interna self-service para que o Customer Admin gerencie a assinatura, contrate novos usuários ou ative add-ons de forma automática.
*   **Principais Entregáveis**:
    *   Portal de faturamento e marketplace de add-ons no frontend.
    *   Cálculo pró-rata automatizado para upgrades de licenças no meio do ciclo de faturamento.
