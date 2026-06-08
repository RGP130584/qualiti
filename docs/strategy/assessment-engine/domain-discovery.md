# Fase 01 — Descoberta de Domínio (Domain Discovery) — ATE

Este documento estabelece o escopo de negócios, o alinhamento estratégico, as personas e a Linguagem Ubíqua do módulo **Assessment & Transformation Engine (ATE)** do QualitiOS.

---

## 1. PROBLEMA DE NEGÓCIO (BUSINESS PROBLEM)

Organizações reguladas (como hospitais, laboratórios e indústrias) enfrentam desafios severos no gerenciamento de sua maturidade operacional e conformidade regulatória (ONA, ISO, ESG, etc.):

1.  **Diagnósticos Manuais Lentificados**: O processo atual de avaliação (assessments) depende de consultorias manuais caras, planilhas complexas desconectadas e entrevistas periódicas com alto viés subjetivo.
2.  **Lacuna entre Diagnóstico e Execução**: Quando um gap (lacuna de conformidade) é identificado, ele costuma ficar isolado em um relatório estático em PDF. Não existe um elo físico automático entre a detecção do problema e o disparo de planos de ação práticos (tarefas, responsáveis, prazos) no ambiente de trabalho das equipes.
3.  **Avaliação de Evidências Ineficiente**: Auditores perdem tempo substancial lendo manualmente dezenas de uploads, relatórios e POPs para verificar se uma capacidade organizacional está madura, gerando gargalos e falhas de amostragem.
4.  **Falta de Rastreabilidade Operacional**: A diretoria e os auditores não possuem visibilidade em tempo real sobre a evolução contínua da maturidade corporativa entre uma auditoria oficial e outra.

---

## 2. ATORES E PERSONAS (ACTORS & PERSONAS)

O ATE envolve os seguintes atores na plataforma:

*   **Diretoria Geral / Sponsor Executivo**:
    *   *Objetivo*: Visualizar o score consolidado de maturidade da organização, aprovar roadmaps estratégicos de transformação e acompanhar o retorno financeiro e operacional da qualidade.
*   **Gestor de Qualidade / Compliance**:
    *   *Objetivo*: Configurar questionários de diagnóstico, gerenciar playbooks setoriais, analisar lacunas sugeridas pelo sistema e supervisionar os projetos de transformação gerados.
*   **Responsável Técnico (RT) / Gestor de Setor**:
    *   *Objetivo*: Responder a avaliações específicas de sua área (ex: Enfermagem, Farmácia, TI), anexar evidências de conformidade e executar as tarefas corretivas do roadmap.
*   **Auditor Externo / Certificador (ex: ONA, ISO)**:
    *   *Objetivo*: Analisar de forma transparente o histórico de conformidade, consultar evidências classificadas por IA e verificar o progresso real dos planos de melhoria.
*   **Consultor Organizacional**:
    *   *Objetivo*: Customizar playbooks de transformação e modelar a jornada de evolução da maturidade dos clientes na plataforma.

---

## 3. OBJETIVOS E RESULTADOS ESPERADOS (OBJECTIVES & KEY RESULTS)

### Objetivos:
*   **Automatizar o Onboarding e Diagnóstico**: Permitir que novos clientes determinem de forma autônoma seu nível de conformidade no primeiro contato com a plataforma.
*   **Conectar Estratégia e Operação**: Vincular o score de maturidade organizacional diretamente a tarefas operacionais dinâmicas e gerenciadas.
*   **Implantar Auditoria Contínua**: Substituir a auditoria estática anual por um modelo reativo contínuo alimentado por evidências extraídas no dia a dia.

### Resultados Esperados:
*   **Redução de 80%** no tempo de preparação de evidências para auditorias formais.
*   **Tempo zero** entre o encerramento de um assessment e a geração de um cronograma/plano de transformação priorizado.
*   **Redução de falhas humanas** na verificação de conformidades através de análise de IA preliminar em documentos anexos.

---

## 4. LINGUAGEM UBÍQUA (UBIQUITOUS LANGUAGE)

Termos de domínio padronizados que devem ser respeitados em todas as especificações e bancos de dados:

*   **Assessment (Avaliação)**: Processo estruturado de auditoria e diagnóstico para aferir a maturidade e conformidade de um tenant em relação a um padrão de qualidade.
*   **Assessment Question (Questão de Avaliação)**: Pergunta específica mapeada a um critério de maturidade e associada a uma capability.
*   **Assessment Answer (Resposta de Avaliação)**: Resposta fornecida pelo avaliado contendo justificativa e links para evidências comprobatórias.
*   **Evidence (Evidência)**: Documento físico, indicador de sistema, ou registro de processo que comprova a veracidade de uma resposta.
*   **Capability Score (Pontuação de Capacidade)**: Nota final de maturidade (0 a 5) atribuída a um dos 8 pilares organizacionais do QualitiOS.
*   **Gap (Lacuna)**: Diferença negativa entre a maturidade atual calculada de uma capability e a maturidade alvo estabelecida no playbook.
*   **Recommendation (Recomendação)**: Orientação estratégica ou prática sugerida (frequentemente gerada por IA) para sanar um gap.
*   **Roadmap (Cronograma de Transformação)**: Sequenciamento lógico de fases (Waves) e projetos desenhado para levar a organização ao nível de maturidade desejado.
*   **Transformation Plan (Plano de Transformação)**: Instância ativa que agrupa o roadmap, orçamentos, cronogramas e responsabilidades de transformação de um tenant.
*   **Transformation Project (Projeto de Transformação)**: Projeto gerado automaticamente para sanar um grupo de gaps específicos, contendo tarefas associadas.
*   **Transformation Task (Tarefa de Transformação)**: Ação operacional unitária a ser realizada por um colaborador com prazo (SLA) e responsável.
