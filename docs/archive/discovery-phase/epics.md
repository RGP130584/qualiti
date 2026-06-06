# Épicos de Desenvolvimento — QualitiOS Backlog

Este documento traduz o roadmap de produto em **Épicos de Desenvolvimento** técnicos estruturados por módulo, servindo como a especificação de engenharia de software para o backlog do **QualitiOS**.

---

## Detalhamento dos Épicos

### 1. Módulo: BPM (Business Process Management)
*   **Epic ID**: `EPC-BPM-01`
*   **Nome**: Implantação do Motor BPM Real e Integração com BPMN
*   **Objetivo**: Integrar o orquestrador de processos (Temporal.io ou Camunda Node SDK) para substituir a transição estática de etapas no banco de dados por uma máquina de estados real que gerencia execuções baseadas em definições BPMN.
*   **Valor de negócio**: Garante a conformidade normativa e a rastreabilidade rígida exigidas pela ONA (Nível 2 e 3) para processos clínicos e fluxos de auditoria, eliminando a suscetibilidade a falhas e transições simultâneas concorrentes.
*   **Dependências**: `EPC-FND-01` (Fundação Multi-Tenant & IAM).
*   **Critérios de aceite**:
    1.  Instanciar e acompanhar o ciclo de vida completo de um processo a partir de um arquivo BPMN padrão por meio da API `/api/bpm/execucoes`.
    2.  Transições de etapas no frontend são propagadas e coordenadas pela máquina de estados do orquestrador com persistência transacional no PostgreSQL.

---

### 2. Módulo: Forms (Motor de Formulários Low-Code)
*   **Epic ID**: `EPC-FRM-01`
*   **Nome**: Construtor Visual de Formulários Dinâmicos Multi-Tenant
*   **Objetivo**: Implementar um construtor de formulários dinâmicos (drag-and-drop) que salve as definições de campos estruturadas em schemas JSONB e valide os payloads de preenchimento em tempo de execução.
*   **Valor de negócio**: Fornece autonomia total para que hospitais criem checklists, pesquisas e formulários de auditoria adaptados às suas especialidades sem a necessidade de realizar novos deploys de código.
*   **Dependências**: `EPC-FND-01` (Fundação Multi-Tenant & IAM).
*   **Critérios de aceite**:
    1.  O administrador consegue salvar definições de formulários com tipagem de campos (texto, numérico, anexo) e validações básicas (obrigatoriedade, limites de caracteres).
    2.  A API rejeita envios de preenchimento (payloads) que violem o schema JSONB cadastrado para o formulário.

---

### 3. Módulo: Workflow (Orquestrador Dinâmico de Tarefas)
*   **Epic ID**: `EPC-WKF-01`
*   **Nome**: Orquestrador Inteligente de Tarefas e SLA Assíncrono
*   **Objetivo**: Acoplar formulários dinâmicos a etapas específicas de processos BPM e configurar o controle de SLA de tarefas com escalonamento automático de alertas usando filas Redis (BullMQ).
*   **Valor de negócio**: Reduz gargalos de tempo de ciclo em revisões técnicas de POPs e protocolos assistenciais críticos, mitigando riscos jurídicos e sanitários ao alertar as coordenações sobre tarefas vencidas de forma ativa.
*   **Dependências**: `EPC-BPM-01` (BPM Core), `EPC-FRM-01` (Forms Engine).
*   **Critérios de aceite**:
    1.  O avanço de etapa no BPM é impedido caso os formulários obrigatórios atrelados à fase atual não estejam integralmente preenchidos.
    2.  O Worker de SLA processa temporizadores e altera o status da tarefa para "escalonado" ao estourar o prazo, enviando notificações aos gestores.

---

### 4. Módulo: ECM (Enterprise Content Management)
*   **Epic ID**: `EPC-ECM-01`
*   **Nome**: Ingestão de Documentos e Pipeline de Extração OCR
*   **Objetivo**: Implementar uploads seguros diretos de arquivos para a nuvem (Amazon S3 ou MinIO local) e disparar o processamento assíncrono de OCR usando AWS Textract ou Tesseract.js.
*   **Valor de negócio**: Agiliza a análise e indexação de evidências de auditoria e prontuários médicos, transformando documentos digitalizados estáticos em texto totalmente pesquisável na plataforma.
*   **Dependências**: `EPC-FND-01` (Fundação Multi-Tenant & IAM).
*   **Critérios de aceite**:
    1.  Uploads de arquivos grandes geram logs e salvam o texto transcrito em banco de dados em segundo plano, sem bloquear a rota principal.
    2.  O módulo grava metadados consistentes (versão, autor, assinaturas, hash MD5 do arquivo) para fins de rastreabilidade regulatória.

---

### 5. Módulo: CRM (Patient Relationship Management)
*   **Epic ID**: `EPC-CRM-01`
*   **Nome**: Ouvidoria Hospitalar Inteligente e Pesquisa NPS
*   **Objetivo**: Desenvolver o portal de ouvidoria de pacientes integrado aos fluxos de melhoria contínua e automatizar pesquisas pós-alta (NPS) consolidadas em dashboards gerenciais.
*   **Valor de negócio**: Melhora o acolhimento ao paciente e a governança ética do hospital, capturando e correlacionando não conformidades com relatos diretos dos clientes para alimentar o ciclo PDCA.
*   **Dependências**: `EPC-FND-01` (Fundação Multi-Tenant & IAM).
*   **Critérios de aceite**:
    1.  O relato de uma reclamação ou denúncia cria um ticket de ouvidoria com SLA configurável e controle de sigilo do informante.
    2.  Agregação dinâmica de notas NPS gerando gráficos e heatmap de satisfação consolidados por setor e unidade.

---

### 6. Módulo: Analytics (BI & Indicadores ONA)
*   **Epic ID**: `EPC-ANC-01`
*   **Nome**: Painel Executivo e Motor de Cálculo de KPIs ONA
*   **Objetivo**: Centralizar indicadores assistenciais de conformidade ONA Nível 1, 2 e 3, gerenciar o histórico de coletas e prever tendências a partir de metas mensais, trimestrais e anuais parametrizadas.
*   **Valor de negócio**: Fornece visualização imediata da maturidade do hospital para auditorias internas e auditorias de acreditação externa da ONA, otimizando o monitoramento de metas estratégicas.
*   **Dependências**: `EPC-WKF-01` (Workflow Engine), `EPC-ECM-01` (ECM).
*   **Critérios de aceite**:
    1.  Recálculo de fórmulas de KPIs roda em menos de 1 segundo mesmo com grande volume de dados históricos.
    2.  O sistema emite alertas imediatos quando coletas de indicadores violam os limites de conformidade definidos.

---

### 7. Módulo: AI Copilot (RAG & Agentes Assistivos)
*   **Epic ID**: `EPC-COP-01`
*   **Nome**: Copiloto Inteligente de Acreditação ONA e RAG
*   **Objetivo**: Substituir os mocks de strings por LangChain e banco de dados de vetores (Qdrant/pgvector) para disponibilizar o assistente RAG real, indexando os manuais da qualidade e auxiliando a equipe em linguagem natural.
*   **Valor de negócio**: Reduz o tempo gasto por enfermeiros e médicos na consulta a manuais de conformidade, e automatiza o preenchimento de planos de ação (CAPA) para incidentes assistenciais relatados.
*   **Dependências**: `EPC-ECM-01` (ECM).
*   **Critérios de aceite**:
    1.  O Copiloto responde a perguntas baseando-se nos documentos e POPs vetorizados pertencentes ao Tenant do usuário.
    2.  A IA executa análise e classificação de relatos de ocorrências identificando gravidade e causa raiz de forma real por meio do modelo de linguagem.

---

### 8. Módulo: MCP Registry (Integrações com Protocolo MCP)
*   **Epic ID**: `EPC-MCP-01`
*   **Nome**: Registro de Servidores MCP e Execução de Contexto de IA
*   **Objetivo**: Implementar o cliente MCP no orquestrador de IA para registrar, autenticar e consumir APIs de servidores MCP locais (EHR, ERP, Laboratório) via mensagens JSON-RPC.
*   **Valor de negócio**: Permite que o Copiloto de IA tome decisões baseadas em dados atualizados de sistemas externos (ex: verificar estoque de medicamentos de alta criticidade após um incidente assistencial), sem comprometer a segurança das chaves ou credenciais desses sistemas.
*   **Dependências**: `EPC-COP-01` (AI Copilot).
*   **Critérios de aceite**:
    1.  O Copiloto da IA executa consultas em tempo real no banco do laboratório acionando tools via protocolo MCP.
    2.  Administradores cadastram, ativam e revogam o acesso de servidores MCP individualmente via interface administrativa.

---

### 9. Módulo: Marketplace (Marketplace & Extensions)
*   **Epic ID**: `EPC-MKT-01`
*   **Nome**: Marketplace de Plugins e Extensões Dinâmicas
*   **Objetivo**: Desenvolver a infraestrutura de marketplace para permitir o download, instalação e controle de licenças de extensões funcionais homologadas de forma isolada por Tenant.
*   **Valor de negócio**: Permite que o QualitiOS cresça de maneira modular, dando a integradores locais a capacidade de empacotar plugins customizados (ex: integrações de hardware de UTI) sem inchar o código-fonte principal da plataforma.
*   **Dependências**: `EPC-FND-01` (Foundation - Multi-Tenant).
*   **Critérios de aceite**:
    1.  A instalação de um plugin estende a interface com widgets ou rotas customizadas apenas para o Tenant que adquiriu a extensão.
    2.  Plugins externos executam em sandbox isolada, impedindo o acesso ou a alteração de dados de outros Tenants.

---

### 10. Módulo: Contracts (Gestão e Versionamento de Contratos)
*   **Epic ID**: `EPC-CON-01`
*   **Nome**: Gestão de Contratos de Prestadores e SLA de Renovação
*   **Objetivo**: Criar o repositório inteligente de contratos, permitindo versionamento, controle de aditivos, assinaturas ICP-Brasil e alertas automáticos de vencimento e renovação.
*   **Valor de negócio**: Mitiga o risco de descontinuidade de serviços críticos hospitalares (ex: lavanderia, gases medicinais) por perda de prazos de renovação contratual.
*   **Dependências**: `EPC-ECM-01` (ECM), `EPC-WKF-01` (Workflow Engine).
*   **Critérios de aceite**:
    1.  O cadastro de um contrato agenda notificações automáticas de aviso de expiração configuráveis (ex: 30, 60, 90 dias antes do término).
    2.  Contratos assinados geram um histórico imutável com registro de autor, aprovador e hashes das chaves públicas associadas.
