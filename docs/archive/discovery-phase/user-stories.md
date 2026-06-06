# Catálogo de User Stories — QualitiOS Backlog

Este documento desdobra o catálogo de features em **User Stories (Histórias de Usuário)** detalhadas, contendo regras de negócio, critérios de aceite e casos de teste formais para orientar o desenvolvimento ágil.

---

## Módulo 1: BPM (Business Process Management)

### `US-BPM-01` (Origem: `FEAT-BPM-01`)
*   **Declaração**:
    *   **Como** Administrador da Qualidade
    *   **Eu quero** fazer o upload e parse de arquivos XML no padrão BPMN 2.0
    *   **Para** modelar e configurar fluxos e processos operacionais do hospital diretamente no sistema.
*   **Regras de Negócio**:
    1.  O sistema deve validar o arquivo contra a especificação oficial de esquema XML (XSD) do BPMN 2.0.
    2.  Modelos de processos duplicados com o mesmo identificador de processo devem ser rejeitados a menos que uma nova versão seja explicitamente especificada.
*   **Critérios de Aceite**:
    *   O upload do arquivo `.bpmn` retorna status de sucesso se a estrutura for válida.
    *   O parse identifica todos os nós de início (`startEvent`), fim (`endEvent`), tarefas (`userTask`) e rotas/decisões (`gateway`).
*   **Casos de Teste**:
    *   *Caso de Teste 1*: Enviar um arquivo `.bpmn` com tags XML mal-formadas. *Resultado Esperado*: Retorno de erro 400 informando falha de schema do parser.
    *   *Caso de Teste 2*: Enviar um fluxo BPMN contendo um fluxo de processos cíclico sem fim. *Resultado Esperado*: Retorno de aviso informando que o processo precisa de ao menos um nó de término (`endEvent`).

### `US-BPM-02` (Origem: `FEAT-BPM-02`)
*   **Declaração**:
    *   **Como** Colaborador do Hospital (Enfermeiro/Médico)
    *   **Eu quero** inicializar uma nova instância de processo
    *   **Para** registrar e conduzir tarefas assistenciais padronizadas sob a governança da instituição.
*   **Regras de Negócio**:
    1.  O usuário deve ter uma role RBAC compatível com a permissão de início (`pode_criar`) do tipo de documento/fluxo associado.
    2.  A execução deve herdar automaticamente o `tenant_id` e o `departamento` do usuário solicitante.
*   **Critérios de Aceite**:
    *   Requisição à API cria uma entrada na tabela `bpm_execucoes`.
    *   A etapa atual da execução deve ser automaticamente configurada para a primeira tarefa ativa após o startEvent.
*   **Casos de Teste**:
    *   *Caso de Teste 1*: Tentar iniciar um processo restrito de diretoria com perfil de colaborador básico. *Resultado Esperado*: Retorno 403 (Forbidden).
    *   *Caso de Teste 2*: Executar POST em `/api/bpm/execucoes` passando id de fluxo inativo. *Resultado Esperado*: Retorno 400 (Bad Request).

### `US-BPM-03` (Origem: `FEAT-BPM-03`)
*   **Declaração**:
    *   **Como** Responsável Técnico ou Executor da Tarefa
    *   **Eu quero** transicionar a etapa do processo para a próxima fase do fluxo
    *   **Para** dar andamento às rotinas operacionais e documentar a conclusão da minha atividade.
*   **Regras de Negócio**:
    1.  Apenas o usuário atribuído à tarefa atual ou administradores podem forçar a transição de etapa.
    2.  Toda transição deve criar um registro de log de auditoria imutável detalhando data, hora, IP e ID do usuário.
*   **Critérios de Aceite**:
    *   Chamadas para `/api/bpm/execucoes/:id/avancar` atualizam `etapa_atual` no banco.
    *   Caso a transição resulte em um `endEvent`, a execução é encerrada configurando `status = 'Concluído'` e preenchendo a data de término.
*   **Casos de Teste**:
    *   *Caso de Teste 1*: Tentar avançar o processo apontando para uma etapa inexistente no desenho do fluxo. *Resultado Esperado*: Rejeição de transição inválida.
    *   *Caso de Teste 2*: Executar a transição para a etapa final. *Resultado Esperado*: O status do processo altera para "Concluído" e a data atual é salva no campo de encerramento.

---

## Módulo 2: Forms (Motor de Formulários Low-Code)

### `US-FRM-01` (Origem: `FEAT-FRM-01`)
*   **Declaração**:
    *   **Como** Coordenador de Qualidade
    *   **Eu quero** criar e desenhar formulários eletrônicos de forma visual
    *   **Para** estruturar as coletas e checklists que serão respondidos pelas equipes em campo.
*   **Regras de Negócio**:
    1.  Os formulários criados pertencem exclusivamente ao Tenant criador (isolamento de segurança).
    2.  Campos dinâmicos devem possuir nomes de variáveis (keys) únicos dentro do mesmo formulário.
*   **Critérios de Aceite**:
    *   O designer gráfico de formulários salva a lista estruturada de campos em formato JSONB na tabela `document_forms`.
    *   Permite a edição, inclusão e remoção de campos antes que o formulário seja publicado e atrelado a algum workflow ativo.
*   **Casos de Teste**:
    *   *Caso de Teste 1*: Salvar formulário com dois campos contendo a mesma chave interna (`field_key`). *Resultado Esperado*: Validação do frontend impede a gravação reportando a duplicidade.

### `US-FRM-02` (Origem: `FEAT-FRM-02`)
*   **Declaração**:
    *   **Como** Colaborador Assistencial
    *   **Eu quero** preencher e enviar as respostas de um formulário dinâmico
    *   **Para** registrar a conformidade e os dados de uma tarefa executada.
*   **Regras de Negócio**:
    1.  O sistema deve rejeitar o envio de payloads que contenham campos obrigatórios em branco.
    2.  Valores enviados devem corresponder ao tipo primitivo (number, date, string) do campo configurado.
*   **Critérios de Aceite**:
    *   O preenchimento do formulário valida os dados no backend contra o schema JSONB.
    *   Respostas válidas salvam os dados brutos e registram a autoria e a data da coleta.
*   **Casos de Teste**:
    *   *Caso de Teste 1*: Enviar dados com campo obrigatório vazio. *Resultado Esperado*: Retorno de erro informando a obrigatoriedade do campo faltante.
    *   *Caso de Teste 2*: Enviar um texto alfanumérico para um campo configurado estritamente como numérico decimal. *Resultado Esperado*: Retorno de erro informando incompatibilidade de formato.

---

## Módulo 3: Workflow (Orquestração e SLAs)

### `US-WKF-01` (Origem: `FEAT-WKF-01`)
*   **Declaração**:
    *   **Como** Administrador do Workflow
    *   **Eu quero** vincular um formulário a uma etapa do processo BPMN
    *   **Para** exigir que o executor da tarefa preencha os dados necessários antes de avançar para a próxima fase.
*   **Regras de Negócio**:
    1.  Um formulário dinâmico publicado pode ser vinculado a uma ou mais etapas de diferentes fluxos BPMN.
    2.  O formulário preenchido na etapa torna-se somente leitura para etapas subsequentes do workflow, salvaguardando a integridade da auditoria.
*   **Critérios de Aceite**:
    *   O mapeamento do processo BPMN vincula o ID do formulário dinâmico ao ID do nó de tarefa correspondente.
    *   A API rejeita comandos de avanço de etapa se os formulários mapeados não constarem como preenchidos.
*   **Casos de Teste**:
    *   *Caso de Teste 1*: Chamar API de avanço de etapa sem enviar os dados do formulário associado. *Resultado Esperado*: Bloqueio e erro informando formulário pendente.

### `US-WKF-02` (Origem: `FEAT-WKF-02`)
*   **Declaração**:
    *   **Como** Gestor de Qualidade do Hospital
    *   **Eu quero** que o sistema monitore e escale tarefas em atraso de forma automatizada
    *   **Para** garantir que os SLAs de revisão de POPs e análise de incidentes não sejam perdidos.
*   **Regras de Negócio**:
    1.  Cada tarefa possui um tempo de SLA em horas definido no BPMN ou nas configurações de tipos documentais.
    2.  O cálculo do tempo limite desconsidera fins de semana e feriados nacionais se a opção de calendário útil estiver ativa.
*   **Critérios de Aceite**:
    *   O Worker baseado em BullMQ/Redis executa de forma constante monitorando prazos na tabela `document_slas`.
    *   Ao expirar, o Worker atualiza o status para "escalonado" e dispara notificação e-mail e alerta push.
*   **Casos de Teste**:
    *   *Caso de Teste 1*: Criar tarefa com SLA de 1 hora e aguardar expiração. *Resultado Esperado*: Status da tarefa atualiza autonomamente para "escalonado" com envio de log.

---

## Módulo 4: ECM (Enterprise Content Management)

### `US-ECM-01` (Origem: `FEAT-ECM-01`)
*   **Declaração**:
    *   **Como** Colaborador da Qualidade
    *   **Eu quero** fazer o upload de documentos e evidências diretamente para o armazenamento seguro
    *   **Para** manter a rastreabilidade e anexar comprovações exigidas pelas comissões ONA.
*   **Regras de Negócio**:
    1.  O arquivo deve ser criptografado na nuvem (Server-Side Encryption SSE-S3).
    2.  O tamanho máximo do arquivo deve ser restrito a 50MB e as extensões válidas a PDF, PNG, JPG, DOCX, XLSX.
*   **Critérios de Aceite**:
    *   O backend gera uma URL pré-assinada do S3 e o frontend realiza o upload do arquivo diretamente sem passar o binário pela API principal.
    *   O registro é salvo no banco do Tenant com hash MD5 gerado para integridade do arquivo.
*   **Casos de Teste**:
    *   *Caso de Teste 1*: Tentar enviar um arquivo executável `.exe`. *Resultado Esperado*: Rejeição na validação da extensão do arquivo.

### `US-ECM-02` (Origem: `FEAT-ECM-02`)
*   **Declaração**:
    *   **Como** Usuário da Qualidade
    *   **Eu quero** que o sistema extraia automaticamente o texto de documentos digitalizados
    *   **Para** poder buscar o conteúdo semântico do arquivo sem precisar ler o PDF manualmente.
*   **Regras de Negócio**:
    1.  O processo de extração OCR ocorre de forma assíncrona, enfileirado no RabbitMQ, impedindo travamento de conexões HTTP.
    2.  O texto extraído deve ser purificado (remoção de caracteres de controle inválidos) antes de ser persistido.
*   **Critérios de Aceite**:
    *   O Worker de OCR processa o arquivo na fila do RabbitMQ e grava a transcrição completa na coluna `ocr_texto` da tabela.
*   **Casos de Teste**:
    *   *Caso de Teste 1*: Enviar PDF de texto digitalizado. *Resultado Esperado*: O worker extrai as palavras-chave e atualiza o campo de texto OCR associado no banco.

---

## Módulo 5: CRM (Patient Relationship Management)

### `US-CRM-01` (Origem: `FEAT-CRM-01`)
*   **Declaração**:
    *   **Como** Colaborador ou Paciente
    *   **Eu quero** registrar um incidente ou sugestão de melhoria no portal de ouvidoria
    *   **Para** notificar a administração sobre falhas operacionais ou assistência não conforme.
*   **Regras de Negócio**:
    1.  Deve ser fornecida opção de anonimato total (desvinculando dados de IP e perfil do banco de dados na gravação).
    2.  O relato deve gerar automaticamente uma notificação de criticidade inicial para a Gestão de Riscos do hospital.
*   **Critérios de Aceite**:
    *   O relato cria uma ocorrência estruturada na tabela `core_ocorrencias`.
    *   O sistema retorna um código de acompanhamento anônimo criptografado para rastreamento.
*   **Casos de Teste**:
    *   *Caso de Teste 1*: Submeter relato selecionando a opção anônima. *Resultado Esperado*: O registro na tabela é salvo com campo `relator` em branco e nenhuma referência a chaves estrangeiras de usuários.

### `US-CRM-02` (Origem: `FEAT-CRM-02`)
*   **Declaração**:
    *   **Como** Paciente pós-alta hospitalar
    *   **Eu quero** receber um link de avaliação de satisfação (NPS) por e-mail ou SMS
    *   **Para** avaliar as condições e o atendimento da minha internação de forma ágil.
*   **Regras de Negócio**:
    1.  O disparo deve ser temporizado para exatamente 24 horas após o registro de alta do prontuário (evento assistencial externo).
    2.  O link de resposta deve ser único por alta, expirando em até 7 dias para evitar respostas múltiplas ou defasadas.
*   **Critérios de Aceite**:
    *   O recebimento de evento de alta insere tarefa de pesquisa na fila assíncrona.
    *   O envio do link e o preenchimento da avaliação atualizam os scores analíticos agregados de NPS do setor.
*   **Casos de Teste**:
    *   *Caso de Teste 1*: Tentar responder a pesquisa utilizando um link já preenchido ou expirado. *Resultado Esperado*: O sistema exibe mensagem de link inválido/expirado.

---

## Módulo 6: Analytics (BI & Indicadores ONA)

### `US-ANC-01` (Origem: `FEAT-ANC-01`)
*   **Declaração**:
    *   **Como** Administrador do Hospital
    *   **Eu quero** que o sistema calcule de forma contínua e assíncrona as taxas de conformidade dos KPIs
    *   **Para** ter dados estratégicos atualizados sem sobrecarregar a performance do banco durante a operação diária.
*   **Regras de Negócio**:
    1.  O recálculo de scores e tendências deve rodar sob demanda ou em tarefas cron agendadas.
    2.  A agregação histórica deve manter registros isolados por período (mês/ano) para permitir comparações de benchmarking.
*   **Critérios de Aceite**:
    *   Inserções em `indicador_coletas` ativam o recálculo dos valores agregados.
    *   Scores computados são persistidos na tabela consolidada `core_analytics`.
*   **Casos de Teste**:
    *   *Caso de Teste 1*: Inserir nova coleta de valor fora do desvio padrão esperado. *Resultado Esperado*: O sistema atualiza a taxa de tendência do KPI para "Piorando" ou "Melhorando" de forma automática.

### `US-ANC-02` (Origem: `FEAT-ANC-02`)
*   **Declaração**:
    *   **Como** Coordenador da Qualidade do Setor
    *   **Eu quero** visualizar alertas e semáforos de desvio em tempo real no meu painel
    *   **Para** identificar instantaneamente quais metas da acreditação ONA saíram dos limites de conformidade.
*   **Regras de Negócio**:
    1.  As regras de coloração dos semáforos (Crítico, Atenção, Conforme) variam conforme a natureza do indicador (para taxas de erro, menor é melhor; para aderência a protocolos, maior é melhor).
*   **Critérios de Aceite**:
    *   O dashboard renderiza os cartões de semáforo com as cores correspondentes atualizadas de forma reativa.
    *   Um alerta é enviado para a Central de Notificações ao atingir o status "Crítico".
*   **Casos de Teste**:
    *   *Caso de Teste 1*: Alterar valor de KPI para nível crítico. *Resultado Esperado*: O semáforo altera para cor Vermelha e notificação prioritária é gravada no painel de governança.

---

## Módulo 7: AI Copilot (RAG & Agentes)

### `US-COP-01` (Origem: `FEAT-COP-01`)
*   **Declaração**:
    *   **Como** Gestor de Conhecimento do Hospital
    *   **Eu quero** vetorizar e indexar a base de conhecimento institucional no banco de vetores
    *   **Para** disponibilizar o conteúdo atualizado de POPs e manuais clínicos de forma semântica para o assistente de IA.
*   **Regras de Negócio**:
    1.  O particionamento de texto (chunking) deve usar overlap para garantir que a transição de parágrafos não perca o contexto semântico.
    2.  Os vetores de embeddings inseridos na base vetorial (Qdrant) devem obrigatoriamente possuir a tag de `tenant_id` correspondente para isolamento.
*   **Critérios de Aceite**:
    *   A vetorização grava chunks com sucesso no Qdrant, indexados pelo hash do arquivo original.
*   **Casos de Teste**:
    *   *Caso de Teste 1*: Processar o mesmo documento duas vezes. *Resultado Esperado*: O sistema identifica o hash igual, limpa os vetores anteriores e insere os novos (Upsert), evitando duplicidade.

### `US-COP-02` (Origem: `FEAT-COP-02`)
*   **Declaração**:
    *   **Como** Colaborador do Hospital
    *   **Eu quero** interagir em linguagem natural com o Copiloto da Qualidade
    *   **Para** obter respostas e instruções de conformidade hospitalar com base nos documentos vigentes da instituição.
*   **Regras de Negócio**:
    1.  Toda consulta RAG deve extrair o contexto apenas da coleção do Qdrant correspondente ao Tenant do usuário ativo.
    2.  O sistema deve impedir a alucinação de respostas se nenhuma informação contextualizada para a pergunta for encontrada (resposta padrão de desconhecimento).
*   **Critérios de Aceite**:
    *   O Copiloto retorna respostas textuais objetivas citando as fontes (POPs, manuais) recuperadas na busca semântica.
    *   O histórico do chat (memória) é mantido em cache Redis por até 60 minutos de inatividade.
*   **Casos de Teste**:
    *   *Caso de Teste 1*: Fazer pergunta sobre tema não abordado nos documentos carregados no Tenant. *Resultado Esperado*: Retorno informando que a informação não foi localizada na base de conhecimentos local.

### `US-COP-03` (Origem: `FEAT-COP-03`)
*   **Declaração**:
    *   **Como** Gestor de Riscos Assistenciais
    *   **Eu quero** que a IA classifique automaticamente a criticidade e sugira a causa raiz de um relato
    *   **Para** agilizar a elaboração do plano CAPA em eventos adversos graves.
*   **Regras de Negócio**:
    1.  A classificação sugerida pela IA não deve sobrepor-se permanentemente à decisão final do gestor da qualidade (deve atuar como sugestão editável).
    2.  Eventos contendo palavras-chave críticas de óbito ou lesão severa devem ser marcados instantaneamente como Evento Sentinela/Criticidade Crítica.
*   **Critérios de Aceite**:
    *   O relato do incidente preenche automaticamente os campos de Ishikawa preditivo e ações recomendadas da ocorrência.
*   **Casos de Teste**:
    *   *Caso de Teste 1*: Enviar relato contendo *"paciente sofreu parada e foi a óbito"*. *Resultado Esperado*: O sistema classifica a ocorrência como "Crítica (Evento Sentinela)" e sugere bloqueios de risco imediatos.

---

## Módulo 8: MCP Registry (Integrações MCP)

### `US-MCP-01` (Origem: `FEAT-MCP-01`)
*   **Declaração**:
    *   **Como** Administrador de TI do Hospital
    *   **Eu quero** cadastrar e autenticar servidores MCP locais
    *   **Para** autorizar a integração contextualizada da IA aos sistemas satélites da instituição de forma segura.
*   **Regras de Negócio**:
    1.  Os dados de endpoints de servidores MCP locais devem ser criptografados na base para evitar roubo de rotas.
    2.  O barramento de segurança deve mapear apenas as ferramentas (tools) previamente homologadas para o escopo do usuário.
*   **Critérios de Aceite**:
    *   A criação do registro persiste as configurações de conexão na tabela `mcp_servers` após validação de handshake com sucesso.
*   **Casos de Teste**:
    *   *Caso de Teste 1*: Cadastrar host de servidor MCP inválido ou inacessível. *Resultado Esperado*: Handshake falha e o sistema retorna erro de conexão, impedindo a gravação do registro inativo.

### `US-MCP-02` (Origem: `FEAT-MCP-02`)
*   **Declaração**:
    *   **Como** Modelo de Linguagem (LLM / Copiloto)
    *   **Eu quero** acionar e consultar ferramentas externas usando mensagens JSON-RPC sobre SSE
    *   **Para** recuperar informações reais de prontuários de pacientes e estoques necessários para formular respostas e tomar decisões.
*   **Regras de Negócio**:
    1.  A API do cliente MCP deve impor tempo limite de 5 segundos de espera nas chamadas a servidores remotos para evitar gargalos.
    2.  Toda chamada de ferramenta externa deve carregar as credenciais de assinatura digital do solicitante original para fins de auditoria no log do hospital.
*   **Critérios de Aceite**:
    *   O cliente MCP intercepta a solicitação da tool da LLM, formata o protocolo JSON-RPC, realiza o disparo SSE e retorna a resposta formatada como contexto.
*   **Casos de Teste**:
    *   *Caso de Teste 1*: Executar ferramenta MCP em servidor inoperante. *Resultado Esperado*: O cliente de conexão captura o timeout e retorna uma mensagem de erro controlada informando indisponibilidade do sistema integrado.

---

## Módulo 9: Marketplace (Marketplace & Extensions)

### `US-MKT-01` (Origem: `FEAT-MKT-01`)
*   **Declaração**:
    *   **Como** Diretor do Hospital (Tenant Admin)
    *   **Eu quero** acessar o catálogo e instalar extensões funcionais homologadas
    *   **Para** expandir os módulos de conformidade do QualitiOS conforme o crescimento da operação.
*   **Regras de Negócio**:
    1.  A instalação do plugin deve ocorrer apenas sob chave de licença ativa cadastrada pelo marketplace global.
    2.  A remoção do plugin deve limpar as configurações e widgets do Tenant sem afetar os dados do Core do sistema.
*   **Critérios de Aceite**:
    *   A instalação do plugin ativa as visualizações e rotas associadas apenas no escopo do Tenant comprador, registrando o módulo na tabela `instituicao`.
*   **Casos de Teste**:
    *   *Caso de Teste 1*: Instalar extensão informando chave de licença expirada. *Resultado Esperado*: O sistema rejeita a instalação retornando erro de licença inválida.

### `US-MKT-02` (Origem: `FEAT-MKT-02`)
*   **Declaração**:
    *   **Como** Engenheiro de DevOps da Plataforma
    *   **Eu quero** executar os códigos de plugins de terceiros em um ambiente de sandbox isolado
    *   **Para** prevenir que falhas de performance, vazamentos de dados ou ataques maliciosos comprometam o Core do QualitiOS.
*   **Regras de Negócio**:
    1.  Os scripts de extensões não devem possuir acesso direto de escrita/leitura nas tabelas do Core do sistema.
    2.  O consumo de memória e processamento da sandbox de execução deve ser rigidamente limitado na infraestrutura de microsserviços.
*   **Critérios de Aceite**:
    *   A execução de scripts de plugins roda isoladamente com tokens de acesso limitados e restritos ao esquema do banco de dados do Tenant ativo.
*   **Casos de Teste**:
    *   *Caso de Teste 1*: Executar plugin contendo script malicioso de leitura em tabelas do tenant vizinho. *Resultado Esperado*: A sandbox captura o comando de invasão, bloqueia a execução e gera alerta crítico no log de segurança.

---

## Módulo 10: Contracts (Gestão de Contratos)

### `US-CON-01` (Origem: `FEAT-CON-01`)
*   **Declaração**:
    *   **Como** Gestor de Suprimentos
    *   **Eu quero** manter o versionamento de contratos de fornecedores de insumos de saúde e aditivos
    *   **Para** garantir a conformidade jurídica dos termos de responsabilidade técnica de compra.
*   **Regras de Negócio**:
    1.  Aditivos e alterações contratuais devem sempre possuir o ID do contrato pai associado.
    2.  Uma versão de contrato consolidada/aprovada não pode ser reeditada ou sofrer alteração física retroativa (imutabilidade de registros consolidados).
*   **Critérios de Aceite**:
    *   O upload de aditivos gera uma nova versão catalogada na tabela `document_versions` associada ao contrato principal.
*   **Casos de Teste**:
    *   *Caso de Teste 1*: Tentar forçar alteração direta em texto de contrato em status "Assinado/Vigente". *Resultado Esperado*: Bloqueio e erro informando imutabilidade do registro.

### `US-CON-02` (Origem: `FEAT-CON-02`)
*   **Declaração**:
    *   **Como** Diretor Geral / Responsável Técnico
    *   **Eu quero** assinar digitalmente termos e contratos usando chaves ICP-Brasil
    *   **Para** atestar a validade jurídica de termos perante os órgãos reguladores e comissões da ONA.
*   **Regras de Negócio**:
    1.  A validação da assinatura digital de chaves ICP-Brasil deve obrigatoriamente verificar a validade temporal do certificado e a presença na lista de certificados revogados (LCR) nacional.
*   **Critérios de Aceite**:
    *   A assinatura calcula e aplica o hash digital no PDF do contrato, gerando registros de assinatura válidos na tabela `document_reviews`.
*   **Casos de Teste**:
    *   *Caso de Teste 1*: Tentar assinar documento utilizando um certificado digital expirado ou revogado. *Resultado Esperado*: Bloqueio de assinatura informando certificado inválido perante a LCR nacional.
