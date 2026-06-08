# Item 09 — Roadmap — Organization Management & Org Chart (OMOC)

Este documento define o Roadmap de Implantação do módulo **Organization Management & Org Chart (OMOC)** dividindo seu desenvolvimento em seis ondas (Waves A a F) de entrega.

---

## 1. SEQUENCIAMENTO DAS ONDAS DO ROADMAP

A estruturação do OMOC inicia-se pela modelagem física e cadastros básicos para, nas etapas seguintes, renderizar organogramas interativos e acoplar as regras de IAM e integrações externas:

```mermaid
gantt
    title Cronograma de Ondas de Desenvolvimento do OMOC
    dateFormat  YYYY-MM
    section Estrutura & Visual
    Wave A: Estrutura Organizacional Básica :active, waveA, 2026-06, 2026-08
    Wave B: Organograma Visual Interativo : waveB, 2026-08, 2026-10
    section Integrações & IAM
    Wave C: Integração IAM & RBAC : waveC, 2026-10, 2026-12
    Wave D: Ingestão UIH (ERP/RH/HIS) : waveD, 2026-12, 2027-02
    section Governança Avançada
    Wave E: Assessment Organizacional ATE : waveE, 2027-02, 2027-04
    Wave F: Governança Organizacional Inteligente : waveF, 2027-04, 2027-06
```

---

## 2. ESPECIFICAÇÃO DAS ONDAS DO ROADMAP

### Wave A: Estrutura Organizacional Básica (Cadastro e CRUDs)
*   **Objetivo**: Implementar as tabelas base de banco e as interfaces administrativas para cadastro de unidades, departamentos, cargos e colaboradores.
*   **Principais Entregáveis**:
    *   Tabelas PostgreSQL para `Organization`, `BusinessUnit`, `Department`, `Position` e `Employee`.
    *   Tela no painel administrativo do QualitiOS para cadastro manual e controle de vagas por cargo.

### Wave B: Organograma Visual Interativo (Visualização Gráfica)
*   **Objetivo**: Desenvolver o componente dinâmico de organograma na interface, renderizando a árvore hierárquica baseada nos nós e nas linhas de reporte.
*   **Principais Entregáveis**:
    *   Mapeamento de relacionamentos `ReportingLine` (reporte direto e matricial).
    *   Painel visual interativo com suporte a busca de cargos, expansão/retração de nós e sinalização de vagas em aberto.

### Wave C: Integração IAM & RBAC (Herança e SoD)
*   **Objetivo**: Vincular as credenciais de usuários e perfis de segurança aos cargos do organograma, ativando a herança de acessos de supervisores e regras de segregação de funções.
*   **Principais Entregáveis**:
    *   Recálculo de permissões baseado na ocupação de cargo (`PositionAssignment`).
    *   Motor de validação de SoD (impedimento de aprovação de POP pelo criador).

### Wave D: Ingestão UIH (Automação de RH)
*   **Objetivo**: Conectar o UIH ao banco de dados do RH para sincronizar colaboradores e cargos de forma automatizada, disparando criação/suspensão de acessos.
*   **Principais Entregáveis**:
    *   Pipeline de Ingestão Inbound mapeado aos schemas canônicos `CanonicalEmployee` e `CanonicalPosition`.
    *   Gatilhos automatizados de desativação de login para demissões.

### Wave E: Assessment Organizacional ATE (Auditoria e Escalonamento)
*   **Objetivo**: Integrar o ATE para que tarefas e questionários de auditorias de qualidade sejam endereçados a cargos e departamentos específicos.
*   **Principais Entregáveis**:
    *   Vinculação de checklists a departamentos e cargos do organograma.
    *   Serviço de escalonamento de SLA estourado para o superior direto da `ReportingLine`.

### Wave F: Governança Organizacional Inteligente (Inteligência Organizacional)
*   **Objetivo**: Utilizar inteligência artificial para recomendar reorganizações estruturais, mapear desvios de SoD e prever necessidades de treinamento baseadas no LMS.
*   **Principais Entregáveis**:
    *   IA recomenda caminhos de carreira sugerindo trilhas LMS complementares.
    *   Auditoria automática contra vazamentos de privilégios acumulados em cargos de interinidade expirados.
