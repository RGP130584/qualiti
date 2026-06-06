# Catálogo de Features — QualitiOS Backlog

Este documento detalha as **Features** que compõem o backlog de desenvolvimento do **QualitiOS**, obtidas a partir da decomposição dos 10 Épicos de Produto.

---

## 1. Módulo: BPM (Business Process Management)

### `FEAT-BPM-01`: Modelagem e Parse de Arquivos BPMN
*   **Descrição**: Implementar o motor de leitura e validação sintática (Parser) de arquivos XML do padrão BPMN 2.0 para estruturar o fluxo de processos na base do orquestrador (*Temporal.io* ou *Camunda*).
*   **Dependências**: Nenhuma.
*   **Critérios de aceite**:
    1.  O sistema realiza o upload de um arquivo `.bpmn` de processo hospitalar e valida sua estrutura XML sem erros.
    2.  O parser extrai com sucesso a lista de nós (atividades, gateways, início, fim) e arestas de transição, salvando os metadados do fluxo.

### `FEAT-BPM-02`: Inicialização e Instanciação de Processos
*   **Descrição**: Criar a API e os controllers responsáveis por iniciar uma nova execução de processo no motor BPM, vinculando a requisição ao usuário solicitante e ao Tenant correspondente.
*   **Dependências**: `FEAT-BPM-01`.
*   **Critérios de aceite**:
    1.  Chamadas ao endpoint `POST /api/bpm/execucoes` criam uma instância ativa do fluxo no orquestrador.
    2.  A execução é inicializada na primeira tarefa (nó) especificada pelo fluxo BPMN.

### `FEAT-BPM-03`: Transição e Acompanhamento de Estados
*   **Descrição**: Desenvolver o mecanismo de avanço de tarefas que permite mover o processo para a próxima fase do fluxo BPMN e gerar a trilha histórica (logs de auditoria).
*   **Dependências**: `FEAT-BPM-02`.
*   **Critérios de aceite**:
    1.  A API `POST /api/bpm/execucoes/:id/avancar` atualiza o estado atual do fluxo no orquestrador.
    2.  Tentativas de avançar para um nó inválido ou não conectado no BPMN são rejeitadas com erro 400.

---

## 2. Módulo: Forms (Motor de Formulários Low-Code)

### `FEAT-FRM-01`: Designer Visual de Formulários
*   **Descrição**: Criar a interface frontend drag-and-drop para modelagem visual de formulários, salvando a estrutura de campos parametrizada em tabelas JSONB.
*   **Dependências**: Nenhuma.
*   **Critérios de aceite**:
    1.  O usuário arrasta componentes de campo, edita labels, define formatos de validação e salva as configurações.
    2.  O JSON gerado descreve perfeitamente os campos do formulário na tabela `document_forms`.

### `FEAT-FRM-02`: API de Validação e Persistência de Payloads JSONB
*   **Descrição**: Desenvolver o validador de dados no backend que recebe o preenchimento do formulário e valida o payload contra as regras de obrigatoriedade e tipo definidas.
*   **Dependências**: `FEAT-FRM-01`.
*   **Critérios de aceite**:
    1.  O envio de um campo obrigatório em branco ou com tipo incorreto (ex: texto em campo numérico) retorna erro de validação.
    2.  Preenchimentos válidos são persistidos de forma segura no banco de dados do Tenant.

---

## 3. Módulo: Workflow (Orquestração e SLAs)

### `FEAT-WKF-01`: Acoplamento de Formulários a Etapas BPM
*   **Descrição**: Permitir que administradores vinculem formulários dinâmicos criados no *Forms Engine* a nós específicos de tarefas no fluxo BPMN.
*   **Dependências**: `FEAT-BPM-03`, `FEAT-FRM-02`.
*   **Critérios de aceite**:
    1.  A API bloqueia a transição de etapa do processo BPM caso os campos do formulário obrigatório atrelado à etapa atual não estejam preenchidos.
    2.  O formulário preenchido fica disponível para consulta histórica nos logs da execução do processo.

### `FEAT-WKF-02`: Worker de SLA e Escalonamento Assíncrono com BullMQ
*   **Descrição**: Implementar o processo worker em background que gerencia filas no Redis (BullMQ) para monitorar prazos de tarefas e disparar alertas automáticos ou reatribuições em caso de atraso.
*   **Dependências**: `FEAT-WKF-01`.
*   **Critérios de aceite**:
    1.  O worker atualiza o status de SLA para "escalonado" de forma autônoma na tabela `document_slas` assim que o prazo limite expira.
    2.  Um evento de notificação de SLA é gerado para o responsável técnico do setor afetado.

---

## 4. Módulo: ECM (Enterprise Content Management)

### `FEAT-ECM-01`: Upload Seguro com AWS S3 / MinIO
*   **Descrição**: Configurar o upload direto e seguro de arquivos PDF/imagens de evidências da ONA para buckets (Amazon S3 ou MinIO local) com assinatura temporária (Presigned URLs).
*   **Dependências**: Nenhuma.
*   **Critérios de aceite**:
    1.  A API gera URLs pré-assinadas seguras e o frontend realiza o upload do arquivo diretamente para o S3.
    2.  Os metadados do arquivo (tamanho, tipo, hash md5) são gravados com sucesso na tabela `ona_evidencias` vinculando ao Tenant correspondente.

### `FEAT-ECM-02`: Background Worker de Extração OCR
*   **Descrição**: Desenvolver o worker assíncrono que consome mensagens de uploads do RabbitMQ e extrai o texto do PDF usando *AWS Textract* ou *Tesseract.js*, salvando a transcrição no banco.
*   **Dependências**: `FEAT-ECM-01`.
*   **Critérios de aceite**:
    1.  O worker realiza o download temporário do S3, processa a extração e grava o texto na coluna `ocr_texto`.
    2.  O processamento OCR de arquivos grandes ocorre em segundo plano sem degradar as threads de requisições HTTP do backend.

---

## 5. Módulo: CRM (Patient Relationship Management)

### `FEAT-CRM-01`: Portal de Relato de Incidentes e Ouvidoria
*   **Descrição**: Criar a interface e a API para notificação de não conformidades operacionais e quase falhas (near misses) por colaboradores ou familiares de pacientes.
*   **Dependências**: Nenhuma.
*   **Critérios de aceite**:
    1.  O formulário permite relatar eventos de forma anônima ou identificada, anexando documentos como evidências.
    2.  O relato gera um registro na tabela `core_ocorrencias` com status inicial de "Pendente" e dispara notificações para a Comissão de Segurança do Paciente.

### `FEAT-CRM-02`: Agendamento e Disparo de Pesquisa NPS Pós-Alta
*   **Descrição**: Implementar o worker que escuta eventos de alta de pacientes e agenda o disparo de pesquisas de satisfação Net Promoter Score (NPS) por e-mail ou SMS após 24 horas.
*   **Dependências**: `FEAT-CRM-01`.
*   **Critérios de aceite**:
    1.  O recebimento do evento de alta hospitalar agenda uma tarefa de e-mail na fila assíncrona.
    2.  As respostas das pesquisas NPS recebidas alimentam diretamente a base analítica consolidada do setor correspondente.

---

## 6. Módulo: Analytics (BI & Indicadores ONA)

### `FEAT-ANC-01`: Motor de Recálculo Assíncrono de KPIs ONA
*   **Descrição**: Criar o serviço que processa e recalcula periodicamente (crontab) ou após novas coletas as métricas de performance globais e setoriais do hospital.
*   **Dependências**: Nenhuma.
*   **Critérios de aceite**:
    1.  Coletas inseridas na tabela `indicador_coletas` ativam o recálculo do KPI correspondente de forma reativa.
    2.  Os scores consolidados por setor e unidade do hospital são salvos na tabela `core_analytics` com histórico temporal de tendência.

### `FEAT-ANC-02`: Alertas Visuais e Painel de Semáforo de Desvio
*   **Descrição**: Desenvolver o painel executivo com semáforos visuais baseados na tolerância ONA e gerar alertas visuais imediatos no portal em caso de desvios.
*   **Dependências**: `FEAT-ANC-01`.
*   **Critérios de aceite**:
    1.  O painel exibe o status de conformidade do KPI em cor Vermelha (Crítico), Amarela (Atenção) ou Verde (Conforme) conforme regras de desvio parametrizadas.
    2.  Mudanças de status críticas disparam notificações prioritárias no feed de avisos dos administradores.

---

## 7. Módulo: AI Copilot (RAG & Agentes)

### `FEAT-COP-01`: Pipeline de Chunking e Indexação Vetorial no Qdrant
*   **Descrição**: Criar o serviço que divide os textos extraídos via OCR em chunks semânticos de 500 caracteres, gera vetores usando modelo de embeddings e os insere na coleção do Tenant no Qdrant.
*   **Dependências**: `FEAT-ECM-02`.
*   **Critérios de aceite**:
    1.  Os chunks são gerados respeitando o overlap de 10% para não fragmentar o contexto semântico.
    2.  Os vetores são inseridos no Qdrant com chaves de filtro de `tenant_id` indexados com sucesso.

### `FEAT-COP-02`: Chat Conversacional RAG com Contexto Dinâmico
*   **Descrição**: Desenvolver o endpoint de chat que recebe a pergunta do usuário, realiza a busca semântica KNN no Qdrant para extrair o contexto e envia o prompt contextualizado para a API do LLM.
*   **Dependências**: `FEAT-COP-01`.
*   **Critérios de aceite**:
    1.  O Copiloto responde a perguntas baseando-se estritamente nas evidências documentais retornadas pelo Qdrant.
    2.  O chat armazena o histórico recente da conversa (memória de curto prazo) em cache Redis para manter o fluxo do diálogo.

### `FEAT-COP-03`: Classificador Preditivo de Gravidade e Causa Raiz de Incidentes
*   **Descrição**: Implementar a funcionalidade que analisa a descrição de incidentes do CRM usando LLM, retornando a criticidade assistencial e sugestões de causa raiz estruturadas.
*   **Dependências**: `FEAT-COP-02`, `FEAT-CRM-01`.
*   **Critérios de aceite**:
    1.  O relato de uma ocorrência gera classificação automática nos campos de criticidade (Crítico, Alto, Médio, Baixo) de forma consistente.
    2.  A IA preenche sugestões de causa raiz no formato diagrama de Ishikawa (Método, Mão de Obra, etc.) na tabela `core_ocorrencias`.

---

## 8. Módulo: MCP Registry (Integrações MCP)

### `FEAT-MCP-01`: Dashboard de Cadastro e Autenticação de Servidores MCP
*   **Descrição**: Criar a interface de administração para registrar e autenticar servidores MCP locais, mapeando os schemas de ferramentas e os tokens de segurança.
*   **Dependências**: Nenhuma.
*   **Critérios de aceite**:
    1.  Cadastro de novo servidor MCP persiste dados de host, porta e schema JSON de ferramentas na tabela `mcp_servers`.
    2.  A validação da conexão realiza handshake JSON-RPC enviando ping para o servidor cadastrado.

### `FEAT-MCP-02`: Cliente JSON-RPC Executor de Contexto para a IA
*   **Descrição**: Desenvolver o cliente protocolar no backend do QualitiOS que gerencia conexões e roteia chamadas de ferramentas solicitadas pelo LLM para o servidor MCP local por meio de chamadas JSON-RPC.
*   **Dependências**: `FEAT-MCP-01`, `FEAT-COP-02`.
*   **Critérios de aceite**:
    1.  A IA identifica a necessidade de uma tool, o cliente MCP formata a requisição JSON-RPC e envia ao servidor de prontuários, capturando o retorno.
    2.  Chamadas de ferramentas para servidores inativos retornam erro sem travar a resposta do Copiloto.

---

## 9. Módulo: Marketplace (Marketplace & Extensions)

### `FEAT-MKT-01`: Catálogo Visual e Instalação Isolada de Plugins por Tenant
*   **Descrição**: Desenvolver o portal de catálogo de extensões funcionais homologadas e o fluxo de contratação e deploy isolado por banco do cliente.
*   **Dependências**: Nenhuma.
*   **Critérios de aceite**:
    1.  A contratação de uma extensão altera a coluna `modulos_ativos` na tabela `instituicao` do Tenant.
    2.  A interface do Service Portal expõe os links e componentes visuais do plugin contratado apenas para o Tenant comprador.

### `FEAT-MKT-02`: Sandbox de Segurança e Isolamento de Execução de Extensões
*   **Descrição**: Criar o sandbox de runtime que executa códigos e scripts de plugins de terceiros de forma isolada, prevenindo acesso a dados transacionais de outros Tenants.
*   **Dependências**: `FEAT-MKT-01`.
*   **Critérios de aceite**:
    1.  Tentativas de um plugin acessar tabelas fora do esquema de banco de dados do Tenant ativo são bloqueadas pelo banco.
    2.  Execuções com estouro de memória ou CPU na extensão são terminadas sem indisponibilizar a API principal.

---

## 10. Módulo: Contracts (Gestão de Contratos)

### `FEAT-CON-01`: Repositório de Versionamento de Contratos e Aditivos
*   **Descrição**: Desenvolver o repositório de gerenciamento de contratos de fornecedores de insumos hospitalares e prestadores de serviços, suportando versionamento e aditivos contratuais.
*   **Dependências**: `FEAT-ECM-01`.
*   **Critérios de aceite**:
    1.  Upload de um aditivo contratual cria uma nova versão associada ao documento de contrato pai na tabela `document_versions`.
    2.  A visualização permite comparar os aditivos e o contrato principal de forma linear.

### `FEAT-CON-02`: Assinatura Criptográfica ICP-Brasil e Validação de Chaves
*   **Descrição**: Integrar a API de assinatura eletrônica homologada perante o padrão nacional ICP-Brasil para assinatura de termos de responsabilidade técnica e contratos.
*   **Dependências**: `FEAT-CON-01`.
*   **Critérios de aceite**:
    1.  Documentos são assinados gerando metadados de assinaturas e carimbo do tempo válidos.
    2.  O sistema exibe o status de validação das assinaturas e a identificação do portador da chave ICP-Brasil.
