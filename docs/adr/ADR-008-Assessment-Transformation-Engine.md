# ADR-008: Design and Freeze of the Assessment & Transformation Engine (ATE) Module

*   **Status**: Aprovada (Accepted)
*   **Data**: 2026-06-08
*   **Autor**: Antigravity (Advanced Agentic Coding)

---

## 1. CONTEXTO (CONTEXT)

O QualitiOS opera como um Sistema Operacional Corporativo (BOS) com 8 capabilities essenciais. Havia a necessidade estratégica de conceber um domínio unificado para receber o estado atual do cliente, diagnosticar sua maturidade operacional de forma autônoma, identificar lacunas (gaps) de conformidade e gerar um roadmap dinâmico de projetos e tarefas de melhoria.

Para atender esta necessidade sem poluir ou acoplar o runtime existente do QualitiOS, projetamos a especificação estratégica e arquitetural do módulo **Assessment & Transformation Engine (ATE)**.

---

## 2. DECISÃO DE DESIGN (DECISION)

Decidimos congelar oficialmente a arquitetura do módulo ATE conforme estruturada nas especificações das 13 fases e validada pela auditoria executiva:

1.  **Bounded Context Isolado**: O ATE é um Bounded Context de suporte com escrita restrita no banco de dados e comunicação assíncrona baseada no barramento de eventos interno (`Internal Event Bus`).
2.  **Agregados e Entidades**: Estruturação lógica sob os agregados de `Assessment` (diagnósticos, scores, gaps e recomendações) e `TransformationPlan` (roadmaps, projetos e tarefas de mitigação).
3.  **Scoring Engine e Gaps**: Fórmulas matemáticas ponderadas de cálculo de notas baseadas em evidências de conformidade verificadas, mapeamento em BPM e indicadores ativos, ajustadas pela eficiência de execução de tarefas ($TRS$).
4.  **Multi-Tenancy Estrito**: Isolamento lógico por tenant via injeção automática de cláusulas `tenant_id` na Persistence Layer a partir do token JWT (`HttpOnly Cookie`).
5.  **Arquitetura Multiagente Cognitiva (MCP)**: Execução de diagnósticos documentais, triagem de compliance, scoring e planejamento por agentes de IA especializados (OCR, Compliance, Assessment, Gap, Roadmap, PMO) comunicando via barramento de mensagens sob o Model Context Protocol (MCP).
6.  **Governança de IA com Validação Humana**: Imposição de sandboxes de prompts estáticos, filtros contra injeções e aprovação humana obrigatória (*Human-in-the-loop*) antes de instanciar roadmaps e tarefas operacionais de colaboradores.

---

## 3. CONSEQUÊNCIAS (CONSEQUENCES)

### Consequências Positivas:
*   **Desacoplamento e Resiliência**: Mudanças ou expansões no ATE não quebram o código do core de governança ou LMS do QualitiOS.
*   **Qualidade e Rastreabilidade**: Auditorias contínuas baseadas em evidências auditáveis e logs de alteração imutáveis monitorados pelo TPM.
*   **Escalabilidade Multissetorial**: Suporte simples a novos segmentos regulados via Playbooks e parametrização regulatória sem reescritas de código.

### Consequências Negativas:
*   **Complexidade de Mensageria**: Necessidade de garantir a consistência eventual de dados devido à comunicação assíncrona por eventos.
*   **Overhead de Persistência**: Adoção de triggers detalhados em JSONB para auditorias pode exigir dimensionamento de hardware no banco em picos de concorrência.
*   **Dependência Cognitiva**: O funcionamento completo das Waves E e F requer suporte ativo a bancos vetoriais (`pgvector`) e conexões a LLM via protocolo MCP.
