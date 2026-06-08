# PAL 01 — Domain Discovery — Platform Administration & Licensing

Este documento estabelece o escopo de negócios, o alinhamento estratégico, as personas e a Linguagem Ubíqua do módulo **Platform Administration & Licensing (PAL)** do QualitiOS.

---

## 1. PROBLEMA DE NEGÓCIO (BUSINESS PROBLEM)

Para escalar comercialmente o QualitiOS como um Software como Serviço (SaaS) robusto no modelo de assinaturas, a plataforma precisa ir além do multi-tenancy simples de dados:

1.  **Rigidez Comercial**: Atualmente, o QualitiOS é comercializado de forma monolítica. Não existe suporte para vendas modulares, onde um cliente possa assinar apenas o LMS (Educação) e o ECM (POPs), ou adquirir add-ons específicos de IA (Ishikawa / pgvector) e integrações (FHIR).
2.  **Dificuldade de Atração (Trial e Beta)**: Vendas SaaS de alta performance dependem da capacidade de disponibilizar demonstrações (Trials) ou programas de teste (Beta/Freemium) autônomos com limites de uso rigorosos e automáticos (ex: limite de 5 usuários ou 20 documentos).
3.  **Falta de Monitoramento de Consumo (Billing)**: O QualitiOS carece de um motor para contar transações de negócios (processos executados, relatórios de riscos abertos, auditorias de ATE finalizadas), impedindo a cobrança por consumo e o faturamento dinâmico.
4.  **Operação de Catálogo Complexa**: Alterar o escopo de um plano ou criar um novo pacote exige intervenção manual de código e banco de dados pela engenharia de software, aumentando o time-to-market.

---

## 2. ATORES E PERSONAS (ACTORS & PERSONAS)

O PAL envolve os seguintes atores operacionais:

*   **Platform Owner (Dono da Plataforma - Qualiti)**:
    *   *Objetivo*: Gerenciar o catálogo global de planos, criar novos módulos e add-ons, cadastrar clientes institucionais e visualizar métricas globais de MRR/ARR.
*   **Partner (Parceiros e Revendas)**:
    *   *Objetivo*: Licenciar e ativar playbooks de transformação de qualidade para carteiras específicas de hospitais.
*   **Customer Admin (Administrador da Holding/Cliente)**:
    *   *Objetivo*: Comprar pacotes, expandir planos de licenças por usuários e contratar novos módulos ativamente na loja self-service.
*   **Tenant Admin (Administrador da Unidade/Hospital)**:
    *   *Objetivo*: Configurar colaboradores locais e monitorar o uso da cota contratada.
*   **Support Analyst (Analista de Suporte Qualiti)**:
    *   *Objetivo*: Visualizar logs de erros e depurar configurações de pipelines autorizados.
*   **Billing Manager (Gestor Financeiro Qualiti)**:
    *   *Objetivo*: Emitir faturas de cobrança mensais, rastrear pagamentos e gerenciar inadimplências de clientes.

---

## 3. OBJETIVOS E RESULTADOS ESPERADOS (OBJECTIVES & KEY RESULTS)

### Objetivos:
*   **Modularização do Portfólio**: Habilitar a venda individual de módulos e recursos adicionais (Add-ons).
*   **Gestão de Ciclo de Assinaturas**: Controlar trial, suspensão automática por inadimplência, upgrades de planos e cancelamentos.
*   **Monitoramento de Métricas de Consumo**: Contabilizar as ações transacionais de negócios para billing.
*   **Orquestração de Sidebar Dinâmica**: Renderizar itens de navegação do menu lateral estritamente conforme a licença ativa.

### Resultados Esperados:
*   **Time-to-market zero** para criação e ativação de novos pacotes comerciais na plataforma.
*   **Redução de 95%** no esforço operacional de cobrança e faturamento por meio de automação de billing.
*   **Bloqueio instantâneo** e automático de recursos expirados ou não contratados por tenants.

---

## 4. LINGUAGEM UBÍQUA (UBIQUITOUS LANGUAGE)

*   **Platform Administration & Licensing (PAL)**: O domínio SaaS de administração, catalogação e faturamento de licenças do QualitiOS.
*   **Product Catalog (Catálogo de Produtos)**: Definição estruturada de todos os produtos, módulos, features e add-ons comercializáveis.
*   **Plan (Plano)**: Pacote comercial que agrupa determinados módulos, limites e precificação (ex: Plano Standard, Premium).
*   **Subscription (Assinatura)**: O contrato ativo de relacionamento comercial entre um cliente e o plano escolhido.
*   **License (Licença)**: A permissão ativa concedida a um tenant para operar módulos específicos na plataforma.
*   **Feature Flag (Flag de Funcionalidade)**: Parâmetro dinâmico binário (true/false) que habilita ou oculta um recurso específico no código (ex: `feature.ai.ishikawa = true`).
*   **UsageMetric (Métrica de Consumo)**: Registro de contagem de transações de negócios por tenant para fins de billing (ex: total de POPs criados no mês).
*   **Invoice (Fatura)**: Documento de cobrança emitido mensalmente baseado na assinatura e consumo do tenant.
