# Relatório de Gap Analysis — QualitiOS (AS-IS vs. TO-BE)

Este documento identifica os desvios (gaps) existentes entre a arquitetura atual do QualitiOS (caracterizada por simulações e estrutura acoplada) e a arquitetura alvo de nível empresarial e AI-Native (TO-BE). Os gaps foram classificados sob quatro níveis de prioridade/impacto: **Critical** (Crítico), **High** (Alto), **Medium** (Médio) e **Low** (Baixo).

---

## 1. Gaps de Funcionalidades (Funcionalidades Inexistentes)

| Funcionalidade Inexistente | Descrição | Classificação |
| :--- | :--- | :--- |
| **Pipeline Real de Extração OCR** | Substituição da string mockada por processamento assíncrono real de PDFs e imagens para extração de texto bruto (OCR). | **Critical** |
| **Busca Semântica e Indexação Vetorial** | Conversão de blocos de texto em vetores numéricos de alta dimensão e armazenamento em banco vetorial para busca conceitual, encerrando o uso de gerador randômico. | **Critical** |
| **Orquestração de Agentes e LLM Real (RAG)** | Implementação do motor cognitivo conversacional conectando perguntas de usuários a prompts dinâmicos com inserção de contexto (RAG) em LLMs reais (Llama 3/GPT-4). | **Critical** |
| **Execução de Tools via Model Context Protocol** | Habilidade de conectar o Copiloto a sistemas satélites (EHR MV/Tasy, almoxarifado) em tempo real, usando o protocolo padrão MCP JSON-RPC. | **Critical** |
| **Escalonamento Automático de SLA BPM** | Alerta ativo e reatribuição de tarefas baseados em filas de cron/tempo real que monitoram prazos de revisão vencidos sem requerer interação manual na API. | **High** |
| **Assinatura Digital de Documentos** | Integração real com chaves de certificação padrão ICP-Brasil para validação jurídica de contratos e manuais, atualmente apenas simulada no frontend. | **High** |
| **Pesquisa Ativa NPS e Satisfação (CRM)** | Coleta automatizada de dados NPS pós-alta hospitalar e consolidação em painéis dinâmicos. | **Medium** |
| **Habilitação de Extensões no Marketplace** | Mecanismo de download, ativação e verificação de licenças de plugins de terceiros. | **Medium** |

---

## 2. Gaps de Componentes (Componentes Inexistentes)

| Componente Inexistente | Descrição | Classificação |
| :--- | :--- | :--- |
| **MCP Client / Executor** | Módulo de execução e mensageria JSON-RPC (SSE/Websockets) encarregado de enviar dados e disparar comandos para os servidores MCP locais. | **Critical** |
| **Async OCR Worker** | Processo worker rodando isoladamente (fora da API principal) dedicado a decodificar os uploads pesados de documentos e imagens. | **Critical** |
| **Tenant Database Router** | Interceptador de conexões na API (middleware) que interpreta o domínio ou JWT e aponta dinamicamente as operações para o esquema (`search_path`) do respectivo Tenant. | **Critical** |
| **Vector Embedding Pipeline Manager** | Componente encarregado de quebrar os textos em chunks estruturados, chamar a API de embedding (OpenAI/Ollama) e gerenciar a fila de gravação de vetores. | **Critical** |
| **HL7 v2 Message Listener & Parser** | Motor de recebimento de transações hospitalares (MLLP) e conversor de mensagens brutas ADT para objetos compreendidos pela API da Core Platform. | **High** |
| **OAuth2 Unified Authenticator** | Conector unificado para autenticação federada baseada em Keycloak, desacoplando a geração interna de tokens da API Fastify. | **High** |
| **ICP-Brasil Digital Signer Module** | Wrapper de código responsável por computar os hashes de assinatura digital de arquivos PDF usando certificados digitais A1/A3. | **High** |

---

## 3. Gaps de APIs (APIs Inexistentes)

| Método | Endpoint Alvo | Input Esperado | Classificação | Descrição do Gap |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/mcp/servers` | `{ nome, url, token, tools_manifest }` | **Critical** | Registro e autenticação de novos nós/servidores MCP de integração. |
| **GET** | `/api/mcp/servers` | - | **Critical** | Listagem de servidores MCP ativos com status de ping/health. |
| **POST** | `/api/vector/search` | `{ query, limit, threshold }` | **Critical** | Realização de busca semântica em lote no banco vetorial. |
| **POST** | `/api/webhooks/subscribe`| `{ target_url, events_json, secret }` | **High** | Inscrição de sistemas terceiros em eventos de conformidade. |
| **POST** | `/api/auth/sso/callback` | OAuth2 callback parameters | **High** | Endpoint para logon único institucional (Active Directory). |
| **POST** | `/api/marketplace/install`| `{ extension_id, license_key }` | **Medium** | Download e instalação física de plugins cadastrados. |

---

## 4. Gaps de Banco de Dados (Tabelas Inexistentes)

| Tabela Inexistente | Módulo / Contexto | Relação / Descrição | Classificação |
| :--- | :--- | :--- | :--- |
| **`tenant_metadata`** | Tenant Context | Registro centralizador de tenants (id, subdomínio, status da subscrição, chaves criptográficas KMS). | **Critical** |
| **`mcp_servers`** | MCP Context | Metadados dos servidores MCP (id, url, token, tools_schema, status_conexao). | **Critical** |
| **`document_chunks`** | ECM Context | Mapeamento de chunks de documentos (id, documento_id, text_content, vector_id no Qdrant). | **Critical** |
| **`webhook_subscriptions`** | Integrations | Cadastro de assinaturas de webhooks externos (id, tenant_id, endpoint_url, active_events). | **High** |
| **`marketplace_plugins`** | Marketplace | Catálogo de extensões homologadas (id, nome, categoria, dependências, versão). | **Medium** |

---

## 5. Gaps de Serviços de Código (Serviços Inexistentes)

| Serviço Inexistente | Descrição | Classificação |
| :--- | :--- | :--- |
| **Vector Database Client** | Serviço utilitário encapsulando chamadas para o Qdrant/pgvector (indexação, busca semântica e remoção). | **Critical** |
| **Event Bus Interface Service** | Camada de abstração que publica e assina eventos no RabbitMQ de forma assíncrona, desacoplando o monolito modular. | **Critical** |
| **OCR Processor Service** | Abstração que gerencia o fluxo de fila de OCR (envio, progresso, erro, finalização). | **High** |
| **SSO Integration Driver** | Serviço que intermedia credenciamento no AD/Azure AD/Keycloak e mapeia as claims de retorno para RBAC interno. | **High** |
| **HL7 Processing Engine** | Serviço responsável por escutar e interpretar streams binários de eventos de pacientes no hospital. | **High** |

---

## 6. Gaps de Infraestrutura e Ferramental (Infraestrutura Inexistente)

| Infraestrutura Inexistente | Tecnologia Alvo | Motivo da Necessidade | Classificação |
| :--- | :--- | :--- | :--- |
| **Banco de Dados Vetorial** | *Qdrant* ou *pgvector* no Postgres | Armazenamento real dos vetores numéricos de embeddings para busca RAG. | **Critical** |
| **Barramento de Mensageria (Queue)** | *RabbitMQ* ou *BullMQ* no Redis | Orquestração assíncrona de OCR, indexação vetorial e envio de e-mails/alertas de SLA. | **Critical** |
| **Servidor de Identidades (IAM)** | *Keycloak* rodando em contêiner | Centralização de acessos, logon único corporativo (SSO), MFA e gestão RBAC robusta. | **High** |
| **API Gateway Corporativo** | *Kong* ou *Tyk API Gateway* | Gestão centralizada de CORS, Rate Limiting, Logs de Acesso e segurança de borda. | **High** |
| **Orquestrador de Processos BPM** | *Temporal.io Cluster* ou *Camunda* | Execução e monitoramento real da máquina de estados BPMN (BPM) e SLAs críticos. | **High** |
