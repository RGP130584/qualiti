# Planejamento de Tarefas Executáveis para Agente Jules — QualitiOS

Este documento apresenta a quebra do backlog do **QualitiOS** em **Tarefas Técnicas Executáveis** por agentes de codificação automatizados como o **Jules**. Cada tarefa é mapeada com dependências, arquivos afetados, critérios de aceitação, estimativas e o prompt de execução recomendado.

---

## 1. Módulo: BPM (Business Process Management)

### `TSK-BPM-01` (Origem: `US-BPM-01`)
*   **Objetivo**: Implementar o parseador nativo de XML no formato BPMN 2.0 e validar as tags estruturais contra o esquema oficial.
*   **Arquivos Afetados**:
    *   `[NEW] app/backend/src/utils/bpmnParser.ts`
    *   `[MODIFY] app/backend/src/routes/bpm.ts`
*   **Dependências**: Nenhuma.
*   **Critérios de Aceite**:
    1.  Parseador identifica nós de início (`startEvent`), fim (`endEvent`), tarefas (`userTask`) e rotas (`gateway`).
    2.  Tentativas de realizar upload de XML mal-formados retornam erro 400.
*   **Estimativa**: 4 horas.
*   **Prompt Recomendado para Jules**:
    > Crie o arquivo `app/backend/src/utils/bpmnParser.ts` para realizar o parse e validação de arquivos XML BPMN 2.0 utilizando uma biblioteca nativa ou sax-parser. Extraia a árvore de nós e as arestas de conexão dos fluxos. Em `app/backend/src/routes/bpm.ts`, crie um endpoint `POST /bpm/fluxos/upload` que receba o arquivo XML, execute o parser e salve o JSON da estrutura na tabela `bpm_fluxos`. Adicione tratamento de erros para retornar 400 em caso de XML inválido.
*   **Saída Esperada**: Código do parser e endpoint de upload funcional gravando a estrutura BPMN em JSONB no banco de dados.

### `TSK-BPM-02` (Origem: `US-BPM-02`)
*   **Objetivo**: Implementar a rota de instanciação real de processos no banco de dados.
*   **Arquivos Afetados**:
    *   `[MODIFY] app/backend/src/routes/bpm.ts`
*   **Dependências**: `TSK-BPM-01`.
*   **Critérios de Aceite**:
    1.  Inserção consistente de novo registro na tabela `bpm_execucoes`.
    2.  Atribuição automática do `tenant_id` e a primeira etapa ativa pós-inicialização.
*   **Estimativa**: 2 horas.
*   **Prompt Recomendado para Jules**:
    > Altere o endpoint `POST /bpm/execucoes` em `app/backend/src/routes/bpm.ts`. O endpoint deve receber o `fluxo_id` e o `solicitante`. A lógica deve validar a existência do fluxo no banco, identificar o Tenant ativo a partir do token de sessão do usuário, encontrar a primeira tarefa ativa (userTask) no BPMN do fluxo e salvar o registro na tabela `bpm_execucoes` com `status = 'Em Andamento'`.
*   **Saída Esperada**: Endpoint atualizado e registrando novas instâncias vinculadas a Tenants e à etapa inicial de forma real.

### `TSK-BPM-03` (Origem: `US-BPM-03`)
*   **Objetivo**: Desenvolver o avanço lógico de etapas do processo no orquestrador BPM.
*   **Arquivos Afetados**:
    *   `[MODIFY] app/backend/src/routes/bpm.ts`
*   **Dependências**: `TSK-BPM-02`.
*   **Critérios de Aceite**:
    1.  Avanço correto de nós salvando logs de transição no banco de dados.
    2.  Encerramento do processo ao atingir um `endEvent`.
*   **Estimativa**: 4 horas.
*   **Prompt Recomendado para Jules**:
    > Modifique o endpoint `POST /bpm/execucoes/:id/avancar` em `app/backend/src/routes/bpm.ts`. O endpoint deve receber o ID da execução, a próxima etapa desejada e o usuário executor. Valide se a etapa existe no BPMN cadastrado e se o fluxo de arestas permite essa transição. Atualize a etapa atual, persista os logs das etapas concluídas na coluna `log_execucao` e, caso a próxima etapa seja o término, altere o status para "Concluído" com data de finalização.
*   **Saída Esperada**: Lógica de transição de nós BPM robusta com gravação histórica de logs de auditoria assistencial.

---

## 2. Módulo: Forms (Motor de Formulários Dinâmicos)

### `TSK-FRM-01` (Origem: `US-FRM-01`)
*   **Objetivo**: Criar a API de cadastro e persistência de estruturas de formulários JSONB.
*   **Arquivos Afetados**:
    *   `[NEW] app/backend/src/routes/forms.ts`
    *   `[MODIFY] app/backend/src/index.ts`
*   **Dependências**: Nenhuma.
*   **Critérios de Aceite**:
    1.  Gravação estruturada dos metadados de formulários na tabela `document_forms`.
    2.  Validação de chaves internas repetidas de variáveis no mesmo formulário.
*   **Estimativa**: 3 horas.
*   **Prompt Recomendado para Jules**:
    > Crie as rotas de gerenciamento de formulários dinâmicos em `app/backend/src/routes/forms.ts` e registre o arquivo no `index.ts`. Implemente a rota `POST /documents/forms` para cadastrar formulários dinâmicos. A API deve receber nome, tipo e um array de campos. Valide se há chaves internas (`field_key`) duplicadas na requisição. Insira os dados na tabela `document_forms` e os campos na tabela `document_fields` em uma única transação SQL.
*   **Saída Esperada**: Rotas CRUD de criação de formulários e campos criadas e integradas ao indexador Fastify.

### `TSK-FRM-02` (Origem: `US-FRM-02`)
*   **Objetivo**: Implementar a validação do payload de respostas contra o schema JSONB do formulário.
*   **Arquivos Afetados**:
    *   `[MODIFY] app/backend/src/routes/forms.ts`
*   **Dependências**: `TSK-FRM-01`.
*   **Critérios de Aceite**:
    1.  API recusa payloads contendo campos obrigatórios nulos.
    2.  O sistema valida tipos primitivos recebidos de forma estrita.
*   **Estimativa**: 4 horas.
*   **Prompt Recomendado para Jules**:
    > Em `app/backend/src/routes/forms.ts`, crie a rota `POST /documents/forms/:id/responses` para persistir as respostas coletadas. Antes de salvar no banco, consulte os campos cadastrados para o formulário. Implemente uma função validadora em TypeScript que compara o payload de entrada com as definições de campos: retorne erro 400 se algum campo configurado como obrigatório estiver ausente, ou se houver incompatibilidade de tipos de dados.
*   **Saída Esperada**: Middleware validador de payloads de formulários dinâmicos operacional no backend.

---

## 3. Módulo: Workflow (Orquestração e SLAs)

### `TSK-WKF-01` (Origem: `US-WKF-01`)
*   **Objetivo**: Desenvolver o bloqueio de transição BPM baseado no preenchimento de formulários obrigatórios.
*   **Arquivos Afetados**:
    *   `[MODIFY] app/backend/src/routes/bpm.ts`
*   **Dependências**: `TSK-BPM-03`, `TSK-FRM-02`.
*   **Critérios de Aceite**:
    1.  Impedimento do avanço de estado caso a tarefa tenha formulário vinculado não enviado.
*   **Estimativa**: 3 horas.
*   **Prompt Recomendado para Jules**:
    > Altere a rota de avanço de etapa `POST /bpm/execucoes/:id/avancar` em `app/backend/src/routes/bpm.ts` para acoplar a validação de formulários dinâmicos. Consulte se a tarefa atual possui algum formulário obrigatório vinculado (tabela `document_forms`). Se sim, verifique se existe um registro de envio de resposta correspondente a esta instância de processo. Caso não exista, retorne erro 428 (Precondition Required) informando que o formulário da etapa deve ser preenchido antes do envio.
*   **Saída Esperada**: Interceptor de validação de formulários operando no motor de workflow BPM.

### `TSK-WKF-02` (Origem: `US-WKF-02`)
*   **Objetivo**: Configurar o processo worker em segundo plano com BullMQ para monitoramento e escalonamento de SLAs expirados.
*   **Arquivos Afetados**:
    *   `[NEW] app/backend/src/workers/slaWorker.ts`
*   **Dependências**: `TSK-WKF-01`.
*   **Critérios de Aceite**:
    1.  Worker monitora e atualiza SLAs vencidos em background de forma autônoma.
    2.  Disparo de eventos de notificação assistencial de estouro de SLA.
*   **Estimativa**: 6 horas.
*   **Prompt Recomendado para Jules**:
    > Crie o worker em background `app/backend/src/workers/slaWorker.ts` utilizando a biblioteca BullMQ. O worker deve consultar de forma periódica ou reagir a eventos de agendamento na tabela `document_slas`. Ao detectar que o prazo limite (`data_limite`) expirou e o status está pendente, execute uma transação SQL para atualizar o status para "escalonado" no banco, grave um log de auditoria e insira uma notificação na tabela `notificacoes` para alertar o gestor do setor.
*   **Saída Esperada**: Worker de SLA inicializado e operando sobre filas do Redis em background de forma isolada.

---

## 4. Módulo: ECM (Enterprise Content Management)

### `TSK-ECM-01` (Origem: `US-ECM-01`)
*   **Objetivo**: Implementar o upload de evidências diretamente para o Amazon S3/MinIO via Presigned URLs.
*   **Arquivos Afetados**:
    *   `[NEW] app/backend/src/utils/s3.ts`
    *   `[NEW] app/backend/src/routes/ecm.ts`
    *   `[MODIFY] app/backend/src/index.ts`
*   **Dependências**: Nenhuma.
*   **Critérios de Aceite**:
    1.  URLs pré-assinadas com expiração de 15 minutos geradas pela API.
    2.  Validação de extensões restritas a PDF, PNG, JPG, DOCX, XLSX.
*   **Estimativa**: 4 horas.
*   **Prompt Recomendado para Jules**:
    > Instale a biblioteca do cliente SDK S3 da AWS e crie o arquivo `app/backend/src/utils/s3.ts`. Implemente a função `generatePresignedUrl(key: string, contentType: string)` configurando expiração de 900 segundos. Em `app/backend/src/routes/ecm.ts`, crie a rota `POST /documents/upload-request` para retornar a URL pré-assinada de upload de evidências ONA. Valide no backend se a extensão do arquivo solicitada é permitida (PDF, imagens, planilhas). Salve o registro inicial na tabela `ona_evidencias`.
*   **Saída Esperada**: Endpoint gerador de URLs seguras para upload direto no storage de arquivos.

### `TSK-ECM-02` (Origem: `US-ECM-02`)
*   **Objetivo**: Criar o worker assíncrono de OCR integrado ao RabbitMQ para extração de texto em background.
*   **Arquivos Afetados**:
    *   `[NEW] app/backend/src/workers/ocrWorker.ts`
*   **Dependências**: `TSK-ECM-01`.
*   **Critérios de Aceite**:
    1.  Extração de texto via *Tesseract.js* ou *AWS Textract* sem concorrer com a API HTTP.
    2.  Atualização da coluna `ocr_texto` no banco do Tenant correspondente.
*   **Estimativa**: 6 horas.
*   **Prompt Recomendado para Jules**:
    > Crie o worker assíncrono `app/backend/src/workers/ocrWorker.ts`. O worker deve escutar a fila `ocr_jobs` do RabbitMQ. Ao receber uma mensagem contendo o ID da evidência e a key do arquivo no S3, faça o download do arquivo em memória, execute a extração de caracteres usando a API *AWS Textract* (ou *Tesseract.js* localmente se em ambiente dev) e persista o texto obtido na coluna `ocr_texto` da tabela `ona_evidencias` após sanitização.
*   **Saída Esperada**: Worker de processamento de imagem/PDF decodificando e salvando texto OCR de forma assíncrona.

---

## 5. Módulo: AI Copilot (RAG & Agentes)

### `TSK-COP-01` (Origem: `US-COP-01`)
*   **Objetivo**: Implementar o indexador vetorial de chunks de documentos no Qdrant/pgvector.
*   **Arquivos Afetados**:
    *   `[NEW] app/backend/src/utils/vectorDb.ts`
    *   `[NEW] app/backend/src/workers/vectorWorker.ts`
*   **Dependências**: `TSK-ECM-02`.
*   **Critérios de Aceite**:
    1.  Divisão semântica de textos em blocos com overlap de 10%.
    2.  Vetores indexados com metadados do ID do Tenant.
*   **Estimativa**: 6 horas.
*   **Prompt Recomendado para Jules**:
    > Crie os utilitários de banco vetorial em `app/backend/src/utils/vectorDb.ts` para se conectar ao Qdrant. Em `app/backend/src/workers/vectorWorker.ts`, crie um worker que escute a fila `vector_indexing`. Ao receber um documento processado pelo OCR, execute a divisão do texto em chunks de 500 caracteres com overlap de 50 caracteres. Gere o vetor de embeddings (usando o SDK da OpenAI com modelo `text-embedding-3-small` ou localmente no Ollama) e grave os pontos no Qdrant associando o `tenant_id` nos metadados de filtragem payload.
*   **Saída Esperada**: Pipeline de geração e armazenamento de embeddings vetoriais ativo e isolado por Tenant.

### `TSK-COP-02` (Origem: `US-COP-02`)
*   **Objetivo**: Criar a API de chat RAG com contexto de busca semântica no banco de vetores.
*   **Arquivos Afetados**:
    *   `[NEW] app/backend/src/routes/copilot.ts`
    *   `[MODIFY] app/backend/src/index.ts`
*   **Dependências**: `TSK-COP-01`.
*   **Critérios de Aceite**:
    1.  Pesquisa vetorial restrita aos dados do Tenant do usuário autenticado.
    2.  Histórico do chat mantido em cache Redis por 60 minutos.
*   **Estimativa**: 6 horas.
*   **Prompt Recomendado para Jules**:
    > Crie a rota de chat em `app/backend/src/routes/copilot.ts` e registre-a no `index.ts`. A rota `POST /core/v2/ai/copilot` deve receber a pergunta do usuário e o setor de contexto. Autentique a chamada usando JWT, extraia o `tenant_id`, faça uma busca semântica KNN no Qdrant filtrando apenas pontos daquele Tenant, formate o prompt da LLM inserindo os resultados obtidos como contexto e retorne a resposta estruturada contendo as fontes de citações. Armazene o histórico no Redis usando o ID da sessão de chat.
*   **Saída Esperada**: Chat de IA integrado à base de conhecimentos local operando de forma real por similaridade vetorial.

---

## 6. Módulo: MCP Registry (Integrações MCP)

### `TSK-MCP-01` (Origem: `US-MCP-01`)
*   **Objetivo**: Implementar o cadastro e validação de conexões de servidores MCP.
*   **Arquivos Afetados**:
    *   `[NEW] app/backend/src/routes/mcp.ts`
    *   `[MODIFY] app/backend/src/index.ts`
*   **Dependências**: Nenhuma.
*   **Critérios de Aceite**:
    1.  Gravação criptografada dos dados do host e token na tabela `mcp_servers`.
    2.  Validação de handshake JSON-RPC no cadastro.
*   **Estimativa**: 4 horas.
*   **Prompt Recomendado para Jules**:
    > Crie a rota `app/backend/src/routes/mcp.ts` registrando-a no `index.ts`. Crie o endpoint `POST /api/mcp/servers` para cadastrar servidores MCP. O payload deve conter nome, url, token de segurança e lista de ferramentas expostas. Antes de gravar na tabela `mcp_servers`, execute uma requisição HTTP ping (JSON-RPC) contra o host fornecido enviando token no cabeçalho; se a resposta falhar, aborte a transação e retorne erro de conexão. Criptografe as credenciais na gravação.
*   **Saída Esperada**: CRUD de conexões MCP ativo com handshake de validação de conectividade em tempo real.

### `TSK-MCP-02` (Origem: `US-MCP-02`)
*   **Objetivo**: Desenvolver o cliente JSON-RPC/SSE executor de ferramentas externas solicitadas pela LLM.
*   **Arquivos Afetados**:
    *   `[NEW] app/backend/src/utils/mcpClient.ts`
    *   `[MODIFY] app/backend/src/routes/copilot.ts`
*   **Dependências**: `TSK-MCP-01`, `TSK-COP-02`.
*   **Critérios de Aceite**:
    1.  Roteamento assíncrono de chamadas de tools de IA para o servidor correspondente via JSON-RPC.
    2.  Tempo limite de 5 segundos de espera para conexões externas.
*   **Estimativa**: 6 horas.
*   **Prompt Recomendado para Jules**:
    > Crie o utilitário `app/backend/src/utils/mcpClient.ts` para gerenciar a chamada de ferramentas do LLM. Quando a LLM (em `copilot.ts`) solicitar o acionamento de uma tool que pertença a um servidor MCP cadastrado (tabela `mcp_servers`), o `mcpClient` deve interceptar, abrir uma conexão via HTTP SSE/Post JSON-RPC com o servidor MCP de destino, carregar os parâmetros, estipular timeout de 5000ms e retornar os dados decodificados para o LLM.
*   **Saída Esperada**: Módulo cliente MCP JSON-RPC capaz de ler dados externos e integrá-los de forma dinâmica no contexto do Copiloto.
