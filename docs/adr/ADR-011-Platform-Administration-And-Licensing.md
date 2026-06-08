# ADR-011: Design and Freeze of the Platform Administration & Licensing (PAL) Domain

*   **Status**: Aprovada (Accepted)
*   **Data**: 2026-06-08
*   **Autor**: Antigravity (Advanced Agentic Coding)

---

## 1. CONTEXTO (CONTEXT)

O QualitiOS precisava evoluir de um produto comercializado em modelo on-premises e monolítico para uma plataforma SaaS modularizada e faturável sob assinaturas corporativas. Anteriormente, novos módulos de negócio eram entregues a todos os clientes sem controle de licenciamento granular, impedindo estratégias de upselling (como cobrança por add-ons de Inteligência Artificial ou pacotes de integração FHIR) e aumentando o esforço operacional de faturamento, faturando-se de forma manual.

Para solucionar a necessidade de monetização modular, controle estrito de cotas de recursos e isolamento lógico seguro, concebemos a especificação do domínio **Platform Administration & Licensing (PAL)**.

---

## 2. DECISÃO DE DESIGN (DECISION)

Decidimos congelar oficialmente a arquitetura do domínio PAL conforme especificado nas diretrizes lógicas e validado pelo review de conformidade:

1.  **Hierarquia do Catálogo de Produtos**: A comercialização é estruturada na taxonomia de `Product` -> `Module` -> `Feature` / `Add-on`. As dependências e pré-requisitos entre módulos são validados em tempo de ativação.
2.  **Isolamento Baseado em Subdomínio**: O API Gateway resolve o tenant a partir do subdomínio da requisição HTTP (ex: `unidade1.qualitios.com`) ou cabeçalhos de contexto, injetando o `tenant_id` e isolando as bases lógica e transacional.
3.  **Sidebar Metadata-Driven (Orquestração de Menu)**: A barra de navegação lateral do frontend renderiza ou oculta opções a partir da lista de Feature Flags autorizadas na chamada de autenticação `/api/auth/me`.
4.  **Guarda Física de Rotas**: O acesso a endpoints de API de backend no Fastify e URLs diretas no Next.js é verificado por interceptores baseados no token JWT do tenant logado contra a lista de licenças ativas, respondendo com HTTP 403 em acessos indevidos.
5.  **Usage Worker e Semáforos de Cotas**: Background workers contabilizam o consumo físico e geram alertas lógicos ao atingir 90% do limite de cota, com bloqueio operacional síncrono em 100%.
6.  **Suspensão Automatizada de Inadimplência**: Contratos com faturas em atraso há mais de 5 dias mudam o status da assinatura de forma automática para `SUSPENDED` no processamento diário de faturamento (D+6), suspendendo a autenticação de logins na borda.
7.  **Cacheamento de Feature Flags no Redis**: O tempo de verificação de permissões do usuário é otimizado para menos de 10ms utilizando cache persistente no Redis, invalidado automaticamente por triggers de mutação de licenças.

---

## 3. CONSEQUÊNCIAS (CONSEQUENCES)

### Consequências Positivas:
*   **Aceleração de Negócios (SaaS High-Speed)**: Criação de planos complexos e pacotes de add-ons sob demanda sem necessidade de implantar novo código.
*   **Redução de Custos de Infraestrutura**: Prevenção ativa de estouro de custos de hardware através de limites estritos de cotas (ex: armazenamento de arquivos ECM).
*   **Segurança e LGPD Compliance**: Garantia de isolamento multi-tenant robusto através de validação na camada do API Gateway.

### Consequências Negativas:
*   **Complexidade de Circuit Breaker**: Exigência de infraestrutura resiliente de cache (Redis) e estratégia de contingência local para evitar travamento em caso de indisponibilidade externa das bases de billing.
*   **Gerenciamento Concorrente de Workers**: Necessidade de conciliação distribuída no banco PostgreSQL para evitar concorrência em contagens volumosas de recursos por múltiplos workers simultâneos.
