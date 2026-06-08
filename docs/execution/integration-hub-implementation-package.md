# Item 13 — Implementation Package — Universal Integration Hub (UIH)

Este documento especifica o pacote executável de engenharia e produto para o desenvolvimento do módulo **Universal Integration Hub (UIH)**. Ele estabelece Épicos, Features, Histórias de Usuário formatadas em critérios BDD (Gherkin) e a definição oficial de conclusão (Definition of Done - DoD).

---

## 1. MAPPING OF EPICS & FEATURES (ÉPICOS E FEATURES)

O desenvolvimento do UIH está dividido nos seguintes Épicos de engenharia:

### Épico EP-UIH-01: Core Ingestão & Conectores
*   **Descrição**: Implementação de tabelas base de pipelines e conexões no banco, drivers REST API e importadores de arquivos CSV.
*   *Feature FE-UIH-01-01*: Esquema de dados canônico e tabelas de configuração do hub.
*   *Feature FE-UIH-01-02*: Adaptador REST Inbound/Outbound.

### Épico EP-UIH-02: Mapping Engine (ACL Tradução)
*   **Descrição**: Motor em memória de mapeamento JSONPath/XPath, lookups de enums de fornecedores externos e validador de JSON Schema Canônicos.
*   *Feature FE-UIH-02-01*: Motor de Mapeamento JSONPath.
*   *Feature FE-UIH-02-02*: Tabela de tradução e mapeamento de enums.

### Épico EP-UIH-03: Sincronismo & Resiliência
*   **Descrição**: Agendador de sincronismo em lote delta, controle de concorrência com travas Redis e gerenciamento da Dead Letter Queue (DLQ).
*   *Feature FE-UIH-03-01*: Agendador de Sincronismo Delta em Lote.
*   *Feature FE-UIH-03-02*: Dead Letter Queue (DLQ) persistida no Postgres.

---

## 2. USER STORIES & CRITÉRIOS DE ACEITE (BDD)

### História de Usuário US-UIH-01: Configuração de Mapeamento Canônico
*   **Como** Arquiteto de Integração do Cliente,
*   **Quero** criar uma regra de mapeamento associando campos de funcionários do meu ERP ao Modelo Canônico de Colaboradores,
*   **Para** que os registros sejam importados corretamente sem precisar alterar o código do QualitiOS.

#### Critérios de Aceite (BDD):
*   **Cenário 01: Mapeamento de campo com sucesso**
    *   **Dado** que o Arquiteto de Integração está na tela de configuração do Pipeline;
    *   **Quando** configurar a regra associando o caminho `$.data.matricula` da origem ao campo canônico `codigo` do QualitiOS e clicar em "Salvar";
    *   **Então** o sistema deve registrar e validar a regra de mapeamento no banco, aplicando-a nas próximas importações de dados.

---

### História de Usuário US-UIH-02: Execução de Sincronismo Delta em Lote
*   **Como** Administrador de TI,
*   **Quero** que o sincronizador execute cargas periódicas buscando apenas registros modificados desde a última execução de sucesso,
*   **Para** economizar banda, memória de servidor e manter o banco de dados atualizado.

#### Critérios de Aceite (BDD):
*   **Cenário 01: Carga Delta de dados**
    *   **Dado** que o Sync Engine disparou a execução cron de um pipeline de indicadores;
    *   **Quando** o job ler o timestamp de sucesso da última execução (`last_sync_at`) e buscar os novos dados;
    *   **Então** o sistema deve realizar a consulta enviando o timestamp no filtro, processar os registros novos em lotes (chunks) e atualizar o timestamp de referência.

---

### História de Usuário US-UIH-03: Roteamento de Erros para a DLQ
*   **Como** Administrador de TI,
*   **Quero** que qualquer payload que falhar na validação sintática do Schema Canônico seja isolado na DLQ,
*   **Para** que eu possa auditar e reprocessá-lo sem abortar o sincronismo dos outros dados corretos da carga.

#### Critérios de Aceite (BDD):
*   **Cenário 01: Mensagem enviada à DLQ por tipo incompatível**
    *   **Dado** que um pipeline de incidentes recebeu um payload com o campo `severidade` contendo `"URGENTE"` (inválido frente ao enum canônico);
    *   **Quando** o Mapping Engine rodar a validação de Schema;
    *   **Então** o sistema deve abortar a persistência desse registro, salvá-lo na tabela `event_dlq` com a mensagem de erro sintático correspondente e prosseguir com os outros itens válidos do lote.

---

## 3. DEFINITION OF DONE (DoD)

Para que qualquer feature do UIH seja considerada concluída:

1.  **Segregação de Camadas (Clean Architecture)**: O código deve respeitar a separação lógica, sem acoplamento entre regras de negócio da Mapping Engine e drivers físicos.
2.  **Isolamento Multi-Tenant**: Toda consulta de leitura ou gravação de banco ou Redis do UIH deve conter o filtro dinâmico de `tenant_id` atrelado ao JWT do usuário ativo, impedindo cruzamento de dados.
3.  **Segurança e Criptografia**: As chaves e tokens de conexão armazenados no banco devem ser criptografados usando chaves de criptografia exclusivas no Credential Vault.
4.  **Cobertura de Testes**: Mapeadores, validadores de schemas canônicos e o motor de retentativas do Sync Engine devem possuir cobertura mínima de **90% de testes unitários**.
