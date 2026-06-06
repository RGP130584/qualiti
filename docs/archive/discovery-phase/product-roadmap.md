# Roadmap Executivo de Produto — QualitiOS

Este documento apresenta o roadmap executivo e técnico para a evolução programada da plataforma **QualitiOS**, dividida em 10 releases estratégicas. O objetivo é transicionar o sistema de um estado majoritariamente simulado (AS-IS) para uma plataforma corporativa AI-Native e multi-tenant de alto desempenho (TO-BE).

---

## Detalhamento das Releases

### Release 1: Foundation (Fundação da Plataforma)
*   **Objetivo**: Estruturar a fundação multi-tenant e o isolamento de segurança. Migrar a base de código do backend para o padrão Clean Architecture v2, integrar o Keycloak para autenticação federada (SSO), configurar o Kong API Gateway para controle de borda e parametrizar a persistência isolada (esquemas separados) no PostgreSQL.
*   **Dependências**: Nenhuma.
*   **Complexidade**: **Alta** (Reorganização de DDLs e controle de conexões dinâmicas).
*   **Riscos**: Indisponibilidade de ambiente durante a migração dos dados legados; latência adicional na resolução de esquemas em tempo de execução.
*   **Critérios de Aceite**:
    1.  Autenticação unificada via Keycloak funcionando de ponta a ponta com suporte a MFA.
    2.  O sistema identifica o subdomínio ou token JWT do usuário e seleciona o esquema PostgreSQL correto (`SET search_path TO tenant_x`).
    3.  Chamadas externas são filtradas pelo Kong API Gateway com aplicação de Rate Limiting e CORS restrito.

---

### Release 2: BPM Core (Núcleo de Processos)
*   **Objetivo**: Implantar o motor de processos real de mercado integrado à aplicação para substituir o controle manual de etapas baseando-se em especificações BPMN estáticas.
*   **Dependências**: Release 1 (Foundation).
*   **Complexidade**: **Média** (Integração de SDK de workflows).
*   **Riscos**: Incompatibilidade temporária com as máquinas de estados legadas; curva de aprendizado da equipe no SDK do orquestrador.
*   **Critérios de Aceite**:
    1.  A API `/bpm/execucoes` inicia instâncias reais que são registradas e acompanhadas visualmente no painel do orquestrador (*Temporal.io* ou *Camunda*).
    2.  A transição de etapas atualiza e persiste o log de execução de forma consistente no banco.

---

### Release 3: Forms Engine (Motor de Formulários Low-Code)
*   **Objetivo**: Desenvolver o construtor visual de formulários para permitir que administradores de qualidade criem campos customizados sem alteração de código.
*   **Dependências**: Release 1 (Foundation).
*   **Complexidade**: **Média** (Lógica de schemas JSON no frontend e validações dinâmicas).
*   **Riscos**: Instabilidade de renderização dinâmica no frontend Next.js; armazenamento ineficiente de payloads grandes em colunas JSONB.
*   **Critérios de Aceite**:
    1.  O administrador consegue arrastar e soltar novos campos (texto, numérico, data, anexo), definindo obrigatoriedade.
    2.  O sistema persiste a definição do formulário em formato JSONB estruturado e valida os tipos de dados preenchidos no envio.

---

### Release 4: Workflow Engine (Orquestrador Dinâmico de Workflows)
*   **Objetivo**: Integrar o motor BPM Core (Release 2) ao Forms Engine (Release 3), permitindo acoplar formulários dinâmicos a etapas específicas de processos e acionar automações e escalonamentos de SLA assíncronos.
*   **Dependências**: Release 2 (BPM Core), Release 3 (Forms Engine).
*   **Complexidade**: **Alta** (Orquestração de eventos distribuídos e controle de temporizadores).
*   **Riscos**: Perda de eventos de tempo por falha na fila de agendamento (Redis/BullMQ); travamento de processos devido a inconsistências nos dados de formulários acoplados.
*   **Critérios de Aceite**:
    1.  Ao transicionar de etapa no BPM, o sistema valida obrigatoriamente os dados do formulário dinâmico atrelado àquela fase.
    2.  O escalonador assíncrono identifica tarefas atrasadas e altera o status de SLA no banco, disparando alertas sem intervenção do usuário.

---

### Release 5: ECM & Contract Management (Gestão Documental Real)
*   **Objetivo**: Substituir as simulações de OCR e de assinaturas digitais por pipelines reais. Configurar uploads diretamente no AWS S3, extração de texto via AWS Textract/Tesseract e autenticação ICP-Brasil de documentos e contratos.
*   **Dependências**: Release 1 (Foundation).
*   **Complexidade**: **Alta** (Processamento paralelo e criptografia de chaves públicas).
*   **Riscos**: Alto consumo de processamento/CPU durante execução do OCR em grandes lotes de PDFs; complexidade na validação de cadeias de certificação digital A1/A3.
*   **Critérios de Aceite**:
    1.  Uploads de arquivos em PDF geram logs de texto OCR reais em segundo plano, salvando o conteúdo no banco de dados.
    2.  A validação de assinaturas digitais em contratos confirma a integridade e a validade perante as chaves da Infraestrutura de Chaves Públicas Brasileira (ICP-Brasil).

---

### Release 6: Analytics & OKRs (Agrupamento e BI)
*   **Objetivo**: Unificar os dados de KRs, OKRs estratégicos e coletas de indicadores assistenciais em painéis gerenciais e dashboards rápidos.
*   **Dependências**: Release 4 (Workflow Engine), Release 5 (ECM).
*   **Complexidade**: **Média** (Otimização de consultas aggregadas SQL).
*   **Riscos**: Lentidão no carregamento de dashboards executivos sob grandes volumes de dados de coletas diárias.
*   **Critérios de Aceite**:
    1.  Dashboards gerenciais realizam o cálculo de aderência de OKRs e KRs em menos de 1.5 segundos.
    2.  O sistema dispara alertas automáticos e altera os semáforos visuais no módulo de KPIs caso a tolerância parametrizada seja violada.

---

### Release 7: AI Copilot (Agentes & RAG Real)
*   **Objetivo**: Conectar o assistente conversacional a LLMs reais usando busca semântica em banco de dados de vetores (pgvector/Qdrant) para contextualização baseada na base de conhecimento do hospital.
*   **Dependências**: Release 5 (ECM).
*   **Complexidade**: **Alta** (Pipeline de RAG, embeddings e custos de token).
*   **Riscos**: Alucinação de termos assistenciais ou clínicos pelo modelo de linguagem; estouro de custos de API em nuvem; latência nas respostas da IA.
*   **Critérios de Aceite**:
    1.  O Copiloto ONA responde a perguntas utilizando estritamente os manuais e POPs indexados no banco de vetores do Tenant.
    2.  O módulo de incidentes executa a classificação preditiva de gravidade e causa raiz através de chamadas a modelos reais, eliminando o mapeamento de strings estáticas.

---

### Release 8: MCP Registry (Integrações Inteligentes via Protocolo MCP)
*   **Objetivo**: Criar o ecossistema MCP para habilitar conexões seguras e ler dados em tempo real de prontuários eletrônicos (EHR), ERPs e laboratórios diretamente nos prompts da IA.
*   **Dependências**: Release 7 (AI Copilot).
*   **Complexidade**: **Alta** (Segurança de conexões e protocolo JSON-RPC sobre SSE).
*   **Riscos**: Exposição indevida de dados de pacientes (LGPD) a modelos externos de IA; quebra de comunicação com servidores MCP locais por instabilidade de VPN.
*   **Critérios de Aceite**:
    1.  O Copiloto da IA executa consultas em tempo real no banco do laboratório acionando tools via protocolo MCP.
    2.  Administradores cadastram, ativam e revogam o acesso de servidores MCP individualmente via interface administrativa.

---

### Release 9: Process Mining (Mineração de Processos e Auditoria Preditiva)
*   **Objetivo**: Implementar inteligência analítica que analisa os logs históricos de BPM (BPMN executions) e de auditoria para identificar gargalos operacionais e desvios de protocolo clínico de forma preditiva.
*   **Dependências**: Release 2 (BPM Core), Release 6 (Analytics).
*   **Complexidade**: **Alta** (Algoritmos de grafos e descoberta de processos).
*   **Riscos**: Processamento excessivo de logs inviabilizando execução contínua; dificuldade de visualização e interpretação de spaghettis de processos complexos pelas lideranças.
*   **Critérios de Aceite**:
    1.  O sistema exibe o mapa do fluxo executado real comparando-o ao desenho do processo idealizado.
    2.  Alertas preditivos informam gargalos de tempo de ciclo antes de estourarem a meta de SLA.

---

### Release 10: Marketplace & Extensions (Marketplace & Service Portal)
*   **Objetivo**: Lançar o portal de autoatendimento integrado a um marketplace de plugins funcionais, permitindo a instalação isolada de extensões por Tenant sem alterar o núcleo do QualitiOS.
*   **Dependências**: Todas as releases anteriores.
*   **Complexidade**: **Alta** (Modularização dinâmica em tempo de execução e sandbox de segurança).
*   **Riscos**: Extensões maliciosas afetando a performance ou segurança da plataforma central; quebras de retrocompatibilidade de plugins após atualizações da API.
*   **Critérios de Aceite**:
    1.  Tenants instalam e configuram plugins individualmente através do portal.
    2.  Os plugins instalados adicionam e exibem widgets e rotas dinâmicas de forma isolada e segura.
