# Fase 09 — Pacote de Trabalho de Execução (Execution Package) — ATE

Este documento especifica o pacote executável de engenharia e produto para o desenvolvimento do módulo **Assessment & Transformation Engine (ATE)**. Ele estabelece Épicos, Features, Histórias de Usuário formatadas em critérios BDD (Gherkin) e a definição oficial de conclusão (Definition of Done - DoD).

---

## 1. MAPPING OF EPICS & FEATURES (MAPEAMENTO DE ÉPICOS)

O escopo do módulo está decomposto nos seguintes Épicos de engenharia:

### Épico EP-ATE-01: Core Architecture & Persistência
*   **Descrição**: Criação do esquema de banco de dados no PostgreSQL, modelos conceituais, infraestrutura de repositórios e barramento interno de eventos de domínio.
*   *Feature FE-ATE-01-01*: Modelagem Canônica de Dados e migrações do PostgreSQL.
*   *Feature FE-ATE-01-02*: Publicador e Assinante de Eventos de Domínio do ATE.

### Épico EP-ATE-02: Motor de Avaliação (Assessment Engine)
*   **Descrição**: Implementação de questionários de diagnóstico, respostas e controle de evidências associadas.
*   *Feature FE-ATE-02-01*: Interface de Questionários e Respostas no Frontend.
*   *Feature FE-ATE-02-02*: Uploader e Vinculador de Evidências.

### Épico EP-ATE-03: Motor de Scoring & Gaps
*   **Descrição**: Algoritmo de cálculo de scores de capabilities, identificação e priorização de lacunas organizacionais.
*   *Feature FE-ATE-03-01*: Motor Matemático de Scoring de Maturidade.
*   *Feature FE-ATE-03-02*: Gap Priority Engine.

### Épico EP-ATE-04: Planejador de Roadmap
*   **Descrição**: Geração do plano de transformação, Waves e integração ao módulo de projetos.
*   *Feature FE-ATE-04-01*: Wave & Roadmap Generator.
*   *Feature FE-ATE-04-02*: PMO Task Linker (criação de projetos e tarefas).

---

## 2. USER STORIES & CRITÉRIOS DE ACEITE (BDD)

### História de Usuário US-ATE-01: Autoavaliação de Maturidade
*   **Como** Gestor de Qualidade do Hospital,
*   **Quero** preencher um questionário de maturidade baseado no Playbook ONA Nível 1 e anexar os POPs correspondentes como evidências,
*   **Para** obter um diagnóstico preliminar do nível operacional do meu hospital.

#### Critérios de Aceite (BDD):
*   **Cenário 01: Preenchimento de resposta com sucesso**
    *   **Dado** que o Gestor de Qualidade abriu a tela de autoavaliação do Playbook ONA;
    *   **Quando** selecionar a opção "Nível 3 - Gerenciado" na pergunta de "Gestão de Documentos", anexar o arquivo PDF do POP de enfermagem e clicar em "Salvar";
    *   **Então** o sistema deve registrar a resposta, armazenar a evidência no repositório, associá-la à pergunta e exibir a mensagem de confirmação.

*   **Cenário 02: Bloqueio de envio sem justificativa para nota não-conforme**
    *   **Dado** que o Gestor de Qualidade está respondendo a uma pergunta de conformidade mandatória;
    *   **Quando** marcar a resposta como "Nível 0 - Inexistente" e tentar salvar sem preencher a justificativa de gap;
    *   **Então** o sistema deve emitir um alerta de impedimento, exigindo a descrição detalhada da lacuna antes de permitir o salvamento.

---

### História de Usuário US-ATE-02: Diagnóstico e Visualização de Gaps
*   **Como** Diretor Geral do Hospital,
*   **Quero** visualizar o gráfico de teia de aranha (Radar Chart) das capabilities e a lista de gaps priorizados por urgência,
*   **Para** entender onde investir recursos e esforços para obter a certificação.

#### Critérios de Aceite (BDD):
*   **Cenário 01: Geração de score de capability**
    *   **Dado** que o Gestor de Qualidade finalizou e enviou o assessment completo;
    *   **Quando** o motor de cálculo processar os dados das respostas e evidências;
    *   **Então** o sistema deve persistir as notas de `CapabilityScore`, identificar quais áreas estão abaixo da meta do Playbook e gerar os respectivos registros de `Gap` com seu respectivo `Priority Score`.

---

### História de Usuário US-ATE-03: Geração de Planos de Trabalho
*   **Como** Gestor de Qualidade,
*   **Quero** aprovar o roadmap sugerido pela IA e gerar automaticamente projetos com tarefas detalhadas para os setores,
*   **Para** colocar o plano de mitigação de gaps em execução imediata.

#### Critérios de Aceite (BDD):
*   **Cenário 01: Geração de tarefas a partir de gaps**
    *   **Dado** que o roadmap sugeriu mitigar o gap de Governança na Wave A;
    *   **Quando** o Gestor clicar em "Aprovar e Ativar Plano de Transformação";
    *   **Então** o sistema deve criar o `TransformationPlan`, disparar o evento `ProjectCreated`, instanciar o `TransformationProject` correspondente e popular a fila de trabalho do setor afetado com as respectivas `TransformationTask` configuradas com SLAs adequados.

---

## 3. DEFINITION OF DONE (DoD)

Para que qualquer feature do ATE seja considerada concluída, ela deve cumprir:

1.  **Arquitetura Limpa (Clean Architecture)**: O código deve estar rigidamente desacoplado, respeitando as camadas conceituais:
    *   *Domain*: Modelos e lógica de agregados livres de dependências externas.
    *   *Application*: Casos de uso controlando o fluxo e disparando eventos de domínio.
    *   *Presentation/Persistence/Infrastructure*: Controladores Fastify, consultas de banco e conectores isolados.
2.  **Segurança (Security Gates)**:
    *   Toda consulta e inserção de banco deve passar pelo filtro de tenant ativo via JWT HttpOnly Cookie.
    *   Nenhum dado sensível de outro tenant pode ser exposto em APIs públicas.
3.  **Higiene & Testes**:
    *   Cobertura mínima de **85% de testes unitários** nas regras de cálculo matemáticos de scores e algoritmos de gaps.
    *   Ausência de erros críticos ou warnings nos linting de build do frontend/backend.
4.  **Integração do TPM (Build Gates)**:
    *   Validação estrita de Clean Architecture na pipeline de CI: importações proibidas entre Bounded Contexts bloqueiam o build.
    *   Emissão do relatório de conformidade técnica assinado (Trust Report) com score técnico mínimo de 85 pontos.
