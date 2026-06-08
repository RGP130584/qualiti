# Item 10 — Implementation Package — Organization Management & Org Chart (OMOC)

Este documento especifica o pacote executável de engenharia e produto para o desenvolvimento do módulo **Organization Management & Org Chart (OMOC)**. Ele estabelece Épicos, Features, Histórias de Usuário formatadas em critérios BDD (Gherkin) e a definição oficial de conclusão (Definition of Done - DoD).

---

## 1. MAPPING OF EPICS & FEATURES (ÉPICOS E FEATURES)

### Épico EP-OMOC-01: Persistência & Core Cadastros
*   **Descrição**: Implementação de tabelas base da estrutura corporativa e interfaces de visualização tabular.
*   *Feature FE-OMOC-01-01*: Modelos e migrações SQL das tabelas do organograma.
*   *Feature FE-OMOC-01-02*: CRUD de Colaboradores e controle de ocupação de vagas.

### Épico EP-OMOC-02: Hierarquia & Árvore Visual
*   **Descrição**: Modelagem de reportes diretos/matriciais e renderização interativa do organograma.
*   *Feature FE-OMOC-02-01*: Estruturação de `ReportingLine` e validações de ciclo (prevenção de loop hierárquico).
*   *Feature FE-OMOC-02-02*: Componente gráfico de organograma Notion-style.

### Épico EP-OMOC-03: Integração BPM & LMS
*   **Descrição**: Roteamento dinâmico de tarefas do BPM, matrículas no LMS e redirecionamentos automáticos por desligamento.
*   *Feature FE-OMOC-03-01*: Regras de reatribuição de pendências em workflows (vacância de cargo).
*   *Feature FE-OMOC-03-02*: Matrícula automática de trilhas LMS baseada em cargos.

---

## 2. USER STORIES & CRITÉRIOS DE ACEITE (BDD)

### História de Usuário US-OMOC-01: Cadastro de Cargo e Ocupação
*   **Como** Administrador de RH,
*   **Quero** criar uma vaga de cargo associada a um setor e vincular um colaborador a ela,
*   **Para** que o colaborador possa iniciar suas atividades no sistema e herdar permissões.

#### Critérios de Aceite (BDD):
*   **Cenário 01: Vinculação de colaborador a cargo com limite vago**
    *   **Dado** que o Administrador está na tela de contratação de colaboradores;
    *   **Quando** selecionar o colaborador "Maria Souza", vinculá-la ao cargo "Enfermeiro Assistencial" (que possui limite de 5 vagas e apenas 2 ocupadas) e salvar;
    *   **Então** o sistema deve registrar a ocupação (`PositionAssignment`), criar o usuário no IAM/RBAC e disparar o evento `omoc.employee.hired`.

*   **Cenário 02: Bloqueio de vinculação por limite de vagas esgotado**
    *   **Dado** que o Administrador está na tela de contratação;
    *   **Quando** tentar vincular um novo colaborador ao cargo "Coordenador de UTI" (que possui limite de 1 vaga e já está ocupada por outro funcionário);
    *   **Então** o sistema deve emitir um alerta de erro de validação, bloqueando o salvamento e sugerindo abrir vaga adicional ou realizar transferência do titular.

---

### História de Usuário US-OMOC-02: Substituição Temporária de Cargo
*   **Como** Gestor de Qualidade,
*   **Quero** configurar um substituto temporário para o cargo de Coordenador de UTI durante minhas férias,
*   **Para** que os fluxos de aprovação de POPs do setor não fiquem paralisados.

#### Critérios de Aceite (BDD):
*   **Cenário 01: Ativação de substituição programada**
    *   **Dado** que o Gestor cadastrou o "Enfermeiro Assistencial A" como seu substituto de "10/12/2026" a "20/12/2026";
    *   **Quando** o relógio de sistema atingir a data de início da substituição;
    *   **Então** o sistema deve mudar o status para `ATIVA` e encaminhar todas as notificações e tarefas de aprovação de POPs para a fila do substituto.

---

### História de Usuário US-OMOC-03: Redirecionamento de Tarefas por Desligamento
*   **Como** Diretor Geral,
*   **Quero** que as tarefas pendentes de um colaborador demitido sejam transferidas ao seu chefe direto da Reporting Line,
*   **Para** garantir a continuidade operacional.

#### Critérios de Aceite (BDD):
*   **Cenário 01: Transferência automática de pendências**
    *   **Dado** que o colaborador "Maria" (Técnica de Enfermagem) possui 5 checklists pendentes no BPM e foi desligada no RH via UIH;
    *   **Quando** o evento `omoc.employee.terminated` for processado;
    *   **Então** o sistema deve suspender o login de "Maria", vagar o cargo correspondente e transferir os 5 checklists para a fila de trabalho do "Coordenador de UTI" (superior imediato).

---

## 3. DEFINITION OF DONE (DoD)

Para que qualquer feature do OMOC seja considerada concluída:

1.  **Isolamento de Domínio**: Toda regra hierárquica e cálculo de reporting lines deve estar contida na Domain Layer do OMOC, livre de dependências de banco ou frameworks de renderização visual.
2.  **Prevenção de Loops Hierárquicos**: O algoritmo de gravação de `ReportingLine` deve validar e bloquear qualquer salvamento de subordinação circular (ex: Cargo A reporta a Cargo B, que reporta a Cargo A).
3.  **Segurança e Tenant**: Toda query SQL gerada para obter o organograma deve respeitar a restrição lógica do `tenant_id` atrelado ao JWT do usuário logado.
4.  **Cobertura de Testes**: A lógica de herança de permissões, prevenção de loops e redirecionamento de tarefas BPM por demissão devem possuir no mínimo **90% de cobertura de testes unitários**.
