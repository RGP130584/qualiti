# Reality Gap Report — QualitiOS & TPM

Este documento apresenta a análise de conformidade física do código-fonte na branch `master` em relação aos artefatos oficiais de estratégia, arquitetura e planejamento (**Architecture Baseline V1**, **Product Charter**, **Capability Map** e **Business Architecture**). O objetivo é identificar as discrepâncias entre a especificação teórica ideal e o estado prático da implementação.

---

## 1. EXECUTIVE ASSESSMENT (Avaliação Geral de Prontidão)

A auditoria confirma que o repositório na branch `master` apresenta um estado de **Maturidade Funcional Elevada**, com módulos de negócio essenciais como **Universidade LMS**, **OKRs** e **ECM de POPs** totalmente funcionais e persistindo dados reais em banco. 

No entanto, há um **Gap Crítico de Engenharia e Segurança** entre as especificações aprovadas na Baseline e a realidade do código:
1.  **Segurança de Sessão e Rede**: O tráfego de JWT em localStorage e o CORS totalmente aberto expõem a aplicação a riscos sérios.
2.  **Mocks de IA e FHIR**: Todas as inteligências artificiais declaradas (RAG, pgvector, OCR de evidências, triagem de incidentes) e interoperabilidade clínica são baseadas em condicionais estáticas (`if/else`) e arquivos mockados, sem qualquer integração de inferência real.
3.  **Monolito Acoplado e Síncrono**: Next.js e Fastify dividem o mesmo contêiner físico, e as comunicações de background (SLAs, notificações) ocorrem na mesma thread síncrona das requisições HTTP, sem barramento de eventos ou pooling de banco de dados.
4.  **Ausência do TPM**: Não há esteira de CI/CD configurada com os portões de validação do TPM.

A transição planejada através das **Waves 1, 2 e 3** do roadmap atacará exatamente estas lacunas.

---

## 2. DETALHAMENTO DE COBERTURAS

### 2.1. Capability Coverage (Cobertura de Capacidades)

| Capacidade de Negócio | Status na Master | Racional Técnico da Master |
| :--- | :---: | :--- |
| **Governança (Score Global/Setores)** | **PARCIAL** | Setores e cargos são dinâmicos e salvam em banco, mas a consolidação de scores de acreditação baseia-se em mocks. |
| **Estratégia (OKRs e KPIs)** | **IMPLEMENTADO** | Modelos, tabelas de progresso e regras de metas rodam de forma ativa em banco de dados relacional. |
| **Compliance (Checklists ONA)** | **PARCIAL** | Checklists manuais de setores salvam dados, mas a validação de evidências via IA e OCR é mockada por palavras-chave. |
| **Educação (Universidade LMS)** | **IMPLEMENTADO** | Módulo de cursos, progresso, quizzes, trilhas de conhecimento e controle de SLA de 72 horas operam sem simulações. |
| **Conhecimento (Biblioteca)** | **PARCIAL** | Busca estática de arquivos de biblioteca funcional, porém a busca semântica por inteligência vetorial está ausente. |
| **Processos (Workflows BPM)** | **PARCIAL** | A engine visual de diagramas JSON e a criação de instâncias funcionam, mas sem monitoramento de SLA assíncrono. |
| **Documentos (ECM POPs)** | **IMPLEMENTADO** | Ciclo de vida linear de POPs, rascunhos, revisões e controle de vigência operam ativamente no PostgreSQL. |
| **Riscos (Ocorrências e CAPA)** | **PARCIAL** | Cadastro de incidentes e diagrama visual de Ishikawa funcionam, mas a classificação por criticidade e causa raiz é mockada. |

---

### 2.2. Domain Coverage (Cobertura de Domínios DDD)

| Tipo de Domínio | Bounded Context / Módulo | Status na Master | Racional Técnico da Master |
| :--- | :--- | :---: | :--- |
| **Core Domain** | **Governança** | **PARCIAL** | Módulos dinâmicos de setores e cargos (RBAC) existem, mas auditorias e scores corporativos consolidados são simulados. |
| **Supporting** | **Estratégia (OKRs & KPIs)** | **IMPLEMENTADO** | Persistência de dados ativa e regras de cálculo funcionam. |
| **Supporting** | **Educação (Universidade LMS)** | **IMPLEMENTADO** | LMS totalmente operacional com persistência real em banco. |
| **Supporting** | **Documentos (ECM POPs)** | **IMPLEMENTADO** | Ciclo linear e versionamento funcional de documentos. |
| **Supporting** | **Compliance (ONA / ISO)** | **PARCIAL** | Checklists funcionais, mas o validador cognitivo de evidências é mockado. |
| **Supporting** | **Riscos (Ocorrências & CAPA)** | **PARCIAL** | Diagrama de Ishikawa visual ativo, mas a inteligência do plano CAPA é simulada. |
| **Supporting** | **Processos (BPM / SLAs)** | **PARCIAL** | Editor BPM visual ativo, mas a orquestração e monitoramento não são assíncronos. |
| **Supporting** | **Conhecimento (Biblioteca)** | **PARCIAL** | Busca estática funcional, mas busca semântica ausente. |
| **Generic** | **IAM / Autenticação** | **IMPLEMENTADO** | Geração e decodificação de sessões JWT funcionando com senhas criptografadas em PBKDF2/SHA-512. |
| **Generic** | **Notificações & Mensageria** | **IMPLEMENTADO** | Disparo interno de e-mails de notificação síncrono funcional. |
| **Generic** | **Auditoria (Logs de Acesso)** | **IMPLEMENTADO** | Tabela `auditoria_logs` persistindo logs de logins do sistema. |

---

### 2.3. Security Coverage (Cobertura de Segurança)

*   **Autenticação JWT**: **IMPLEMENTADO**. Lógica de geração de tokens na rota de login e decodificação no middleware ativa.
*   **Tráfego Seguro de Sessão (HttpOnly/Secure Cookies)**: **AUSENTE**. O JWT de login é persistido diretamente no `localStorage` do navegador do usuário, suscetível a roubo via XSS.
*   **CORS Restrito**: **AUSENTE**. A API Fastify está exposta para a internet com a diretiva de wildcard `origin: '*'` liberada.
*   **Rate Limiting**: **AUSENTE**. Rotas sensíveis (login) desprovidas de limites por IP contra ataques de força bruta ou DoS.
*   **Logs de Acessos Auditáveis**: **IMPLEMENTADO**. Logs de login gerados na tabela do PostgreSQL, embora a imutabilidade dependa de restrições na camada de banco de dados.

---

### 2.4. TPM Coverage (Cobertura de Governança do TPM)

*   **Rules Engine Core**: **AUSENTE**. Não há motor em TypeScript implementado para ler políticas de qualidade.
*   **Architecture Validation (Clean Arch Scanner)**: **AUSENTE**. Não há validador estático rodando no projeto.
*   **Domain Validation (Context/Database Guard)**: **AUSENTE**. A escrita e leitura de banco de dados cruzada não é validada.
*   **Security Validation (Secrets Scanner)**: **AUSENTE**. O repositório não é verificado contra senhas expostas no Git.
*   **Hygiene Validation**: **AUSENTE**. Não há remoção de arquivos mortos ou varreduras automáticas de código inativo.
*   **Audit Validation (Trust Report & Certificado)**: **AUSENTE**. Não há atestado criptográfico ou score técnico de integridade sendo gerados nas compilações.

---

### 2.5. BPM Coverage (Cobertura de Processos BPM)

*   **Editor Visual e Diagramas BPMN**: **IMPLEMENTADO**. O frontend renderiza o modelador de workflows e salva o grafo JSON.
*   **Instanciação e Acompanhamento de Processos**: **IMPLEMENTADO**. O banco de dados registra instâncias ativas e o avanço linear de etapas.
*   **Orquestração Transacional e Travamento de Status**: **AUSENTE**. O banco não impede a alteração manual de status de POPs e incidentes por fora da engine de processos do BPM.
*   **Background SLA Scheduler**: **AUSENTE**. Não há serviços de background monitorando prazos continuamente de forma assíncrona; os disparos dependem de rotas síncronas HTTP.

---

### 2.6. ECM Coverage (Cobertura de Documentos ECM)

*   **Ciclo de Vida de POPs (Rascunho, Revisão, Vigência)**: **IMPLEMENTADO**. O banco e as rotas controlam as transições lineares de documentos e a ativação de rascunhos.
*   **Versionamento Linear**: **IMPLEMENTADO**. Histórico e edições pendentes são arquivados e controlados por IDs de revisão.
*   **Assinaturas Eletrônicas Criptográficas**: **AUSENTE**. O banco de dados salva apenas o nome em texto puro do aprovador, sem validação criptográfica de chave privada.
*   **Notificações de SLA de Revisão**: **IMPLEMENTADO**. Agendamento de alertas internos funcional durante a criação do POP.

---

### 2.7. LMS Coverage (Cobertura de Educação LMS)

*   **Universidade Corporativa (Cursos, Módulos, Aulas)**: **IMPLEMENTADO**. Lógicas de cadastro de conteúdo e consumo estão 100% funcionais.
*   **Quizzes, Respostas e Progresso**: **IMPLEMENTADO**. A submissão de respostas, cálculo de notas e alteração de progresso salvam ativamente no banco.
*   **Trilhas de Aprendizado & Badges de Competências**: **IMPLEMENTADO**. Matriz de competências, agrupamento de cursos em trilhas e conquista de medalhas salvando em banco.
*   **Emissão de Certificados com SLA 72h**: **IMPLEMENTADO**. Geração de registro de conclusão em banco com rastreabilidade de tempo limite.

---

## 3. O QUE EXISTE NA DOCUMENTAÇÃO MAS NÃO EXISTE NA MASTER?

A lista abaixo resume as lacunas físicas que precisam ser desenvolvidas para alinhar a branch `master` com os artefatos arquiteturais congelados:

1.  **Mecanismos de Segurança de Runtime**:
    *   Substituição do `localStorage` do cliente por cookies HTTP com atributos `HttpOnly`, `Secure` e `SameSite=Strict` para o tráfego do token JWT de login.
    *   Fechamento do CORS wildcard (`*`) e bloqueio de chamadas cross-origin vindas de origens não parametrizadas no `.env`.
    *   Middleware de Rate Limiting por IP para as rotas de login no backend Fastify.
2.  **Esteira de Validação do TPM**:
    *   O motor utilitário do TPM (`/tpm/...`) contendo os scanners estáticos de Clean Architecture, imports de Bounded Contexts, propriedade de banco de dados, senhas hardcoded, dependências NPM vulneráveis e gerador de relatórios e atestados eletrônicos assinados.
    *   Script de configuração de Build Gate para bloquear merges na CI/CD se o score técnico de confiança for inferior a 85 ou houver erros graves.
3.  **Saneamento e Unificação do Banco de Dados**:
    *   Migração de dados e remoção física (drop) das tabelas legadas do PostgreSQL (`pops` e `incidentes`) para unificação sob os modelos modulares V2 (`core_documentos` e `core_ocorrencias`), eliminando a redundância estrutural.
    *   Inserção de restrições de integridade referencial física (FKs) seguras nas tabelas unificadas.
4.  **Inteligência Artificial Real (IA)**:
    *   Integração real de processamento de LLM local (Ollama) ou em nuvem para classificação automática de incidentes de saúde e diagramas de Ishikawa, substituindo os mocks baseados em condicionais de palavras-chave.
    *   Configuração da extensão vetorial `pgvector` na Persistence Layer do PostgreSQL para armazenamento real de embeddings gerados no upload de evidências e resumos de documentos (RAG sem dependências externas).
    *   Biblioteca de extração de texto (OCR) de PDFs de laudos sanitários e evidências integrada no backend.
    *   Tabela de auditoria de prompts e consumo de tokens de IA.
5.  **Arquitetura Orientada a Eventos**:
    *   Implementação do barramento interno de eventos assíncronos (`Internal Event Bus`) em background para tirar a execução de tarefas secundárias da thread principal das requisições HTTP da API.
    *   Fila de processamento de erros de eventos de background (`DLQ Handling`) e ferramenta de redisparo administrativo (`Event Replay`).
6.  **Orquestração BPM de Longo Prazo**:
    *   Travamento transacional no banco de dados impedindo que status de POPs ou incidentes sejam alterados manualmente sem passar pela orquestração de transições do BPM.
    *   Background task agendada monitorando prazos de vencimento de processos e SLAs (SLA Engine).
7.  **FHIR Dinâmico**:
    *   Conexão ativa dos endpoints de interoperabilidade clínica FHIR com as tabelas de pacientes ativos do banco de dados relacional (substituindo os JSONs mockados estáticos).
