# Item 12 — Implementation Package — Platform Administration & Licensing (PAL)

Este documento especifica o pacote executável de engenharia e produto para o desenvolvimento do módulo **Platform Administration & Licensing (PAL)**. Ele estabelece Épicos, Features, Histórias de Usuário formatadas em critérios BDD (Gherkin) e a definição oficial de conclusão (Definition of Done - DoD).

---

## 1. MAPPING OF EPICS & FEATURES (ÉPICOS E FEATURES)

### Épico EP-PAL-01: SaaS Core & Catálogo de Produtos
*   **Descrição**: Implementação da estrutura de Tenants, Assinaturas, Catálogo global de produtos/módulos e herança lógica de acessos.
*   *Feature FE-PAL-01-01*: Modelagem física das entidades de faturamento (`Tenant`, `Subscription`, `Plan`, `License`, `Contract`) e isolamento lógico.
*   *Feature FE-PAL-01-02*: Engine de resolução de Tenant via subdomínio/cabeçalhos HTTP no API Gateway e injeção de `tenant_id`.

### Épico EP-PAL-02: Feature Flags & Orquestração Dinâmica
*   **Descrição**: Controle granular de funcionalidades em nível de interface e rotas do servidor baseadas no contrato ativo.
*   *Feature FE-PAL-02-01*: Motor de Feature Flags com suporte a herança do plano e overrides manuais por tenant.
*   *Feature FE-PAL-02-02*: Renderização dinâmica do menu lateral (Sidebar) e guarda de rotas física no Fastify Backend e Middleware Next.js.

### Épico EP-PAL-03: Rastreabilidade de Consumo & Billing
*   **Descrição**: Contabilização de ações de negócio em background, controle de limites e emissão de faturamento.
*   *Feature FE-PAL-03-01*: Background Workers (Usage Workers) para varredura e persistência de dados em `UsageMetric` e validação em semáforos de cotas.
*   *Feature FE-PAL-03-02*: Motor de billing mensal gerando faturamento (`Invoice`) e pipeline de suspensão automatizada de tenants inadimplentes.

---

## 2. USER STORIES & CRITÉRIOS DE ACEITE (BDD)

### História de Usuário US-PAL-01: Ativação Dinâmica de Módulos (Menu Dinâmico)
*   **Como** Platform Owner da Qualiti,
*   **Quero** ativar o módulo LMS (Educação Corporativa) para a assinatura do tenant "Santa Casa",
*   **Para** que os colaboradores desse tenant passem a visualizar imediatamente os menus de universidade e treinamentos.

#### Critérios de Aceite (BDD):
*   **Cenário 01: Ativação de módulo e atualização do menu lateral**
    *   **Dado** que o tenant "Santa Casa" possui uma assinatura ativa do plano "Essencial" (que não inclui o LMS por padrão);
    *   **Quando** o Platform Owner ativar a licença `mod:lms` com validade até "31/12/2026" para o tenant "Santa Casa";
    *   **Então** o endpoint `/api/auth/me` de qualquer usuário do tenant "Santa Casa" deve passar a incluir `"feature:lms:core"` na lista de `features_ativas`;
    *   **E** o componente de sidebar do frontend do usuário deve expor visualmente o grupo "Universidade Corporativa".

*   **Cenário 02: Bloqueio de ativação por dependência de módulo não atendida**
    *   **Dado** que o módulo "Compliance & Acreditação" possui pré-requisito lógico com o produto "ECM" (Gestão Documental);
    *   **Quando** o Platform Owner tentar ativar a licença do módulo "Compliance" para um tenant que não possui o módulo "ECM" ativo;
    *   **Então** o painel de administração deve emitir um alerta de erro de validação comercial, impedindo o salvamento e recomendando a venda conjunta do módulo ECM.

---

### História de Usuário US-PAL-02: Intercepção Física de Rotas Inativas (Feature Flags Guard)
*   **Como** Security Architect,
*   **Quero** que rotas do backend Fastify e URLs diretas do Next.js verifiquem a ativação de Feature Flags,
*   **Para** que usuários mal-intencionados não acessem recursos avançados digitando rotas diretamente no navegador.

#### Critérios de Aceite (BDD):
*   **Cenário 01: Bloqueio de acesso direto à rota inexistente na assinatura**
    *   **Dado** que o colaborador "Dr. Roberto" pertence ao tenant "Hospital A" (que possui a Feature Flag `feature:ai:ishikawa` desligada);
    *   **Quando** o "Dr. Roberto" digitar a URL `/app/riscos/causa-raiz/ishikawa` ou realizar uma requisição POST para `/api/v1/riscos/analysis/ishikawa-ai`;
    *   **Então** o Next.js Middleware ou o Interceptor Fastify deve capturar a requisição, validar a lista de flags do tenant e responder com `HTTP 403 Forbidden` (Acesso Negado/Recurso Não Contratado).

---

### História de Usuário US-PAL-03: Semáforo e Bloqueio de Cota de Uso (Usage Limits)
*   **Como** Tenant Admin do "Hospital São Lucas",
*   **Quero** ser notificado visualmente quando o volume de documentos digitais atingir 90% do contratado e ser bloqueado ao chegar a 100%,
*   **Para** que eu possa negociar uma expansão de plano antes de paralisar as operações.

#### Critérios de Aceite (BDD):
*   **Cenário 01: Disparo de Alerta nos 90% da cota contratada**
    *   **Dado** que o "Hospital São Lucas" contratou um limite de cota de 10.000 documentos do ECM;
    *   **Quando** o Usage Worker processar as métricas de consumo diárias e contabilizar 9.050 documentos ativos;
    *   **Então** o sistema deve disparar o evento `pal.usage.quota.warning` e apresentar um banner flutuante no topo do painel do Tenant Admin avisando sobre a proximidade do limite de cota.

*   **Cenário 02: Bloqueio rígido nos 100% de uso**
    *   **Dado** que a cota do "Hospital São Lucas" está em 10.000 documentos de 10.000 permitidos;
    *   **Quando** um colaborador tentar realizar o upload de mais um arquivo PDF;
    *   **Então** o backend deve recusar o upload retornando um erro de limite excedido e redirecionar o fluxo para a tela de upgrade de plano do marketplace.

---

### História de Usuário US-PAL-04: Suspensão Automática de Inadimplentes (Suspension Engine)
*   **Como** Diretor Financeiro da Qualiti,
*   **Quero** que o sistema bloqueie o acesso geral a tenants com faturas vencidas a mais de 5 dias,
*   **Para** mitigar riscos de inadimplência e custos de infraestrutura.

#### Critérios de Aceite (BDD):
*   **Cenário 01: Bloqueio automático de tenant inadimplente**
    *   **Dado** que a fatura com vencimento em "01/06/2026" do tenant "Clínica B" não foi liquidada;
    *   **Quando** o relógio do sistema de billing rodar a rotina diária em "07/06/2026" (D+6);
    *   **Então** o status da assinatura deve mudar para `SUSPENDED`;
    *   **E** qualquer tentativa de login de qualquer colaborador do tenant "Clínica B" deve ser interrompida na tela de autenticação com a mensagem informativa: "Assinatura suspensa por pendência financeira. Entre em contato com o administrador".

---

## 3. DEFINITION OF DONE (DoD)

Para que qualquer feature do PAL seja considerada concluída em ambiente de desenvolvimento:

1.  **Segregação Estrita de Multi-Tenant**: Toda query realizada pelos motores de Feature Flags, cotas e billing deve possuir o filtro `tenant_id` explicitado e indexado no banco PostgreSQL, sem risco de vazamento de dados cruzados.
2.  **Isolamento no API Gateway**: A resolução do identificador do tenant deve ocorrer exclusivamente na borda (API Gateway/Middleware), impedindo que clientes burlem os limites passando cabeçalhos manipulados diretamente ao backend.
3.  **Não Travamento Operacional (Circuit Breaker)**: O motor de verificação de Feature Flags `/api/auth/me` deve possuir um mecanismo de fail-safe/fallback. Caso a base de dados de licenciamento ou o cache Redis falhem, o sistema deve assumir a herança de licenças padrão de forma segura, registrando alertas internos no log corporativo.
4.  **Desempenho de Carga (Cache Latency)**: A consulta de Feature Flags ativas do usuário deve responder em menos de **10ms**, sendo obrigatoriamente cacheada em Redis com expiração atrelada ao ciclo de vida da sessão JWT ou invalidação por trigger de ativação.
5.  **Cobertura de Testes**: As regras de validação de dependência comercial, validação de limites de cotas e suspensão automática de inadimplência devem possuir cobertura de testes unitários superior a **95%**.
