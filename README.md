# QualitiOS — Enterprise Governance, Strategy & Compliance Platform

```text
======================================================================================
  ██████  ██    ██  █████  ██      ██ ████████ ██  ██████  ███████ 
 ██    ██ ██    ██ ██   ██ ██      ██    ██    ██ ██    ██ ██      
 ██    ██ ██    ██ ███████ ██      ██    ██    ██ ██    ██ ███████ 
 ██ ▄▄ ██ ██    ██ ██   ██ ██      ██    ██    ██ ██    ██      ██ 
  ██████   ██████  ██   ██ ███████ ██    ██    ██  ██████  ███████ 
     ▀▀                                                            
 Plataforma Corporativa Multi-Tenant Dinâmica de Governança, OKRs e Educação Continuada
======================================================================================
```

O **QualitiOS** é uma plataforma corporativa de governança, gestão de qualidade, execução estratégica por OKRs e inteligência operacional projetada para instituições de internação de alta complexidade. Substituindo a rigidez de sistemas legados, o QualitiOS introduz uma arquitetura **100% Dinâmica, Multi-Tenant e Orientada por Dados**, permitindo que administradores reestruturem setores, metas estratégicas, trilhas de capacitação e visões de dashboards diretamente pela interface.

---

## 🌟 Principais Pilares & Diferenciais

### 1. Gestão Estratégica por OKRs (`/okrs`) — *Foco Total nos Resultados*
Implementada com base nas melhores práticas da literatura de ponta (*OKR: Foco Total nos Resultados, 2023*), a plataforma orquestra a execução estratégica em todos os níveis organizacionais:
- **Hierarquia Estratégica de 3 Níveis:**
  - **Empresa:** OKRs Estratégicos de 3 anos (Ex: *“Ser referência em excelência operacional e governança institucional”*).
  - **Áreas / Setores:** OKRs Táticos e Key Results (KRs) trimestrais e mensais por departamento (*Enfermagem, Farmácia, Administração, etc.*).
  - **Colaboradores:** Metas operacionais individuais e alinhamento de tarefas.
- **Ciclos Customizáveis:** Configuração administrativa de ciclos de gestão (*Trimestral, Mensal, Semestral, Anual ou Personalizado*).
- **Cálculo de Score Ponderado:** Média ponderada automática dos KRs operacionais para apuração do score geral do OKR pai.
- **Alinhamento com Indicadores (KPIs):** Vínculo direto entre Key Results e o motor de analytics institucional (Ex: *Vincular KR de redução de não conformidades com KPIs de reincidência e SLA de resolução*).

### 2. Educação Corporativa & LMS Enterprise (`/education`)
Um ambiente de aprendizagem corporativa moderno, gamificado e IA-first, focado na capacitação contínua e no cumprimento das exigências da acreditação ONA:
- **Trilha de Integração Institucional (SLA 72 Horas):** Todos os novos colaboradores são matriculados automaticamente na trilha de acolhimento (Cultura, Políticas Internas, Segurança do Paciente, LGPD e Workflows). O sistema controla o SLA de 72 horas para conclusão, emitindo alertas automáticos em caso de pendência.
- **Treinamentos Setoriais Específicos:** Trilhas curriculares dedicadas por especialidade (Ex: *Enfermagem foca em protocolos assistenciais e prevenção de LPP; Administração foca em fluxos de faturamento e governança de contratos*).
- **Multimídia & Quizzes de Verificação:** Suporte a vídeo aulas de alta definição, visualização de manuais em PDF e baterias de quizzes com validação imediata de nota.
- **Certificação Digital Automatizada:** Geração instantânea de diplomas com código de autenticidade criptografado e registro indelével no histórico do colaborador.

### 3. Gestão de Documentos Corporativa (Ex-POPs)
O módulo documental engloba toda a taxonomia institucional da qualidade:
- **Organização Granular:** Classificação por Setor, Departamento, Categoria, Tipo Documental, Nível de Acesso, Instituição, Unidade, Versão e Status de Vigência.
- **Setores Iniciais Configuráveis:** *Administrativo, Enfermagem, Monitoria, Psicologia, Medicina Clínica, Medicina Psiquiatria, Gestão e Farmácia*.
- **Workflow de Revisão e SLA 24h:** Ciclo de vida completo com controle de rascunhos, edições pendentes e aprovação automatizada via notificação por e-mail e painel de vigência.

### 4. Dinamismo Organizacional & Painel Administrativo (`/admin/estrutura`)
Toda a fundação da plataforma é gerenciada dinamicamente pelo painel administrativo:
- **Setores e Subdepartamentos:** Criação de hierarquias organizacionais e categorias customizadas em tempo real.
- **RBAC Avançado & Cargos:** Permissões hierárquicas e controle de acesso granular configurado via matrizes JSON.
- **Tipos Documentais:** Definição de níveis de acesso padrão por categoria e especialidade.
- **Menus Dinâmicos:** Customização dos atalhos e itens da barra lateral com base na especialidade do usuário logado.

### 5. Segregação Contextual e Dashboards Customizados
A plataforma garante que cada usuário tenha acesso estritamente aos dados pertinentes à sua operação:
- **Visão por Setor:** Profissionais de Enfermagem visualizam apenas indicadores, protocolos, OKRs e treinamentos assistenciais; profissionais da Farmácia acessam exclusivamente dados farmacêuticos e controle de psicotrópicos/LASA.
- **Dashboards Contextuais:** Configuração de visões específicas e reorganização de widgets por perfil (Ex: *Dashboard Estratégico*, *Dashboard Tático de Enfermagem*, *Dashboard Executivo de Gestão*).
- **Visão Global do Administrador:** Acesso irrestrito a todos os módulos, relatórios de glosas de internação, auditorias e logs de event sourcing (LGPD).

### 6. Padronização Corporativa de Internação
Em conformidade com as diretrizes internacionais de governança corporativa em saúde, toda a terminologia legada baseada no jargão "Hospitalar" foi substituída pelo conceito amplo e padronizado de **Internação** (ex: *Acreditação de Internação*, *Glosas de Internação*).

---

## 🏗️ Arquitetura do Sistema & Stack Tecnológico

O projeto segue os princípios de **Clean Architecture** e **Modularidade Desacoplada**, organizado em um monorepo corporativo:

```text
qualiti/
 ├── app/
 │    ├── backend/               # Fastify REST API + TypeScript + PostgreSQL
 │    │    ├── src/
 │    │    │    ├── db.ts        # Schema DDL, automação de ingestão e seeds dinâmicos (OKRs, LMS, ONA)
 │    │    │    ├── index.ts     # Gateway Fastify, JWT, Swagger OpenAPI 3.0 e Rotas
 │    │    │    ├── modules/     # Domínios isolados (Core Platform, ONA Acreditação)
 │    │    │    └── routes/      # Controladores REST (/okrs, /education, /pops, /bpm, /admin)
 │    │    └── package.json
 │    │
 │    ├── frontend/              # Next.js 14 (App Router) + React + Tailwind + Lucide Icons
 │    │    ├── src/app/
 │    │    │    ├── okrs/        # Módulo de Gestão Estratégica por OKRs e KRs Operacionais
 │    │    │    ├── education/   # Módulo de Educação Corporativa (LMS Enterprise com SLA 72h)
 │    │    │    ├── admin/       # Painel de Estrutura Organizacional Dinâmica
 │    │    │    ├── pops/        # Módulo de Gestão de Documentos (PWA + QR Code)
 │    │    │    ├── ona/         # Módulo ONA Refatorado em Clean Architecture
 │    │    │    ├── incidents/   # Central de Ocorrências, Ishikawa e Plano CAPA
 │    │    │    ├── indicators/  # Analytics, Metas ONA e Tendências de KPIs
 │    │    │    ├── bpm/         # Workflow BPMN Engine
 │    │    │    ├── fhir/        # Interoperabilidade e Mensageria em Saúde
 │    │    │    └── layout.tsx   # Barra lateral dinâmica com atalhos corporativos
 │    │    └── package.json
 │    │
 │    ├── Dockerfile             # Multi-stage build otimizado (Node 20 Alpine)
 │    └── package.json           # Orquestrador Monorepo
 │
 ├── Caddyfile                   # Reverse Proxy Automático (HTTPS, Caching e Load Balancing)
 └── docker-compose.yml          # Orquestração de Containers (App, Caddy, Postgres 16)
```

---

## 🚀 Guia de Implantação e Execução via Docker

A plataforma foi projetada para inicialização imediata e autossuficiente através do Docker Compose, incluindo a criação automática de tabelas e a ingestão automatizada de dados estratégicos, educacionais e de governança.

### 1. Pré-requisitos
- Docker Engine (v24.0+)
- Docker Compose (v2.20+)
- Git

### 2. Subindo a Plataforma em Produção / Desenvolvimento
Para compilar as imagens do monorepo e subir os serviços em background com recriação limpa:

```bash
# 1. Faça o clone do repositório
git clone https://github.com/RGP130584/qualiti.git
cd qualiti

# 2. Compile e inicie os containers
docker compose up -d --build --force-recreate
```

### 3. Acessando os Serviços
Assim que os containers estiverem Up, o Caddy Gateway irá rotear o tráfego automaticamente:
- **Aplicação Web (Frontend Next.js):** [http://localhost](http://localhost) ou `http://localhost:3000`
- **Gestão Estratégica & OKRs:** [http://localhost/okrs](http://localhost/okrs)
- **Educação Corporativa (LMS):** [http://localhost/education](http://localhost/education)
- **Painel de Estrutura Dinâmica:** [http://localhost/admin/estrutura](http://localhost/admin/estrutura)
- **Módulo ONA Refatorado:** [http://localhost/ona](http://localhost/ona)
- **API Backend Direta:** [http://localhost/api](http://localhost/api) ou `http://localhost:3001/api`
- **Documentação OpenAPI / Swagger:** [http://localhost/api/docs](http://localhost/api/docs)

---

## 🔐 Contas de Acesso Padrão (RBAC Seed)

Para fins de auditoria e validação de segregação de acesso, o banco de dados é inicializado com as seguintes credenciais de teste (Senha padrão para todos: `hashed_secure_password_123`):

| Usuário / Perfil | E-mail de Acesso | Cargo / Role RBAC | Setor / Departamento | Visibilidade |
| :--- | :--- | :--- | :--- | :--- |
| **Administrador Geral** | `admin@qualitaos.com` | `Admin` | Diretoria Geral | Global / Acesso Total |
| **Enfermeira Assistencial** | `maria.souza@qualitaos.com` | `Enfermeiro` | Enfermagem | Restrita à Enfermagem |
| **Médico Clínico** | `carlos.mendes@qualitaos.com` | `Médico` | Psiquiatria | Restrita à Área Médica |
| **Farmacêutico RT** | `roberto.rt@qualitaos.com` | `Farmacêutico RT` | Farmácia | Restrita à Farmácia |
| **Auditora ONA** | `ana.lima@qualitaos.com` | `Auditor ONA` | Qualidade e ONA | Global (Modo Auditoria) |

---

## 📊 Estrutura de Dados Dinâmica (DDL Principal)

As entidades de configuração corporativa e execução estratégica residem no PostgreSQL e são modeladas para máxima flexibilidade:

```sql
-- Tabelas de Gestão Estratégica (OKRs e KRs)
CREATE TABLE okrs (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  visao_estrategica VARCHAR(255) DEFAULT '3 Anos',
  periodo VARCHAR(100) DEFAULT '2026-2028',
  prioridade VARCHAR(50) DEFAULT 'Alta',
  responsavel VARCHAR(255) NOT NULL,
  setor VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'Em Andamento',
  progresso NUMERIC(5,2) DEFAULT 0.00,
  score NUMERIC(3,2) DEFAULT 0.00,
  indicadores_vinculados JSONB DEFAULT '[]'::jsonb,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE key_results (
  id SERIAL PRIMARY KEY,
  okr_id INTEGER REFERENCES okrs(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  meta VARCHAR(255) NOT NULL,
  valor_atual NUMERIC(10,2) DEFAULT 0.00,
  valor_alvo NUMERIC(10,2) NOT NULL,
  unidade VARCHAR(50) DEFAULT '%',
  progresso NUMERIC(5,2) DEFAULT 0.00,
  responsavel VARCHAR(255) NOT NULL,
  setor VARCHAR(100) NOT NULL,
  prazo DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'Em Andamento',
  peso INTEGER DEFAULT 1,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabelas de Educação Corporativa (LMS Enterprise)
CREATE TABLE education_courses (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  setor VARCHAR(100) NOT NULL,
  trilha VARCHAR(255) DEFAULT 'Geral',
  obrigatorio BOOLEAN DEFAULT FALSE,
  sla_horas INTEGER DEFAULT 72,
  carga_horaria INTEGER DEFAULT 4,
  capa_url TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE education_progress (
  id SERIAL PRIMARY KEY,
  usuario_email VARCHAR(255) NOT NULL,
  licao_id INTEGER REFERENCES education_lessons(id) ON DELETE CASCADE,
  concluido BOOLEAN DEFAULT FALSE,
  data_conclusao TIMESTAMP,
  UNIQUE(usuario_email, licao_id)
);

CREATE TABLE education_certificates (
  id SERIAL PRIMARY KEY,
  usuario_email VARCHAR(255) NOT NULL,
  curso_id INTEGER REFERENCES education_courses(id) ON DELETE CASCADE,
  codigo_certificado VARCHAR(100) UNIQUE NOT NULL,
  data_emissao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE education_tracks (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  setor VARCHAR(100) NOT NULL,
  cursos_ids JSONB DEFAULT '[]'::jsonb,
  carga_horaria_total INTEGER DEFAULT 10,
  icone VARCHAR(50) DEFAULT 'Compass',
  ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE education_competencies (
  id SERIAL PRIMARY KEY,
  cargo VARCHAR(255) NOT NULL,
  setor VARCHAR(100) NOT NULL,
  competencias_obrigatorias JSONB DEFAULT '[]'::jsonb,
  treinamentos_vinculados JSONB DEFAULT '[]'::jsonb,
  nivel_exigido VARCHAR(50) DEFAULT 'Avançado'
);

CREATE TABLE education_badges (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  icone VARCHAR(50) DEFAULT 'Award',
  pontos INTEGER DEFAULT 100,
  criterio VARCHAR(255) NOT NULL
);

CREATE TABLE education_library (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  setor VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) DEFAULT 'PDF',
  url TEXT NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE education_notifications (
  id SERIAL PRIMARY KEY,
  usuario_email VARCHAR(255) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  tipo VARCHAR(50) DEFAULT 'SLA_ALERTA',
  lida BOOLEAN DEFAULT FALSE,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabelas de Gestão de Documentos Dinâmica (BPM & Low-Code)
CREATE TABLE document_workflows (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  etapas_json JSONB DEFAULT '["rascunho", "revisão", "aprovação", "publicado", "revisão periódica"]'::jsonb,
  sla_horas_padrao INTEGER DEFAULT 48,
  ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE document_templates (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  tipo_documental VARCHAR(100) NOT NULL,
  conteudo_rich_text TEXT NOT NULL,
  placeholders_json JSONB DEFAULT '["nome", "setor", "responsavel", "data"]'::jsonb,
  ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE document_categories (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) UNIQUE NOT NULL,
  setor_alvo VARCHAR(100) DEFAULT 'Geral',
  subcategorias_json JSONB DEFAULT '[]'::jsonb,
  ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE document_types (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) UNIQUE NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  descricao TEXT,
  workflow_id INTEGER REFERENCES document_workflows(id) ON DELETE SET NULL,
  template_id INTEGER REFERENCES document_templates(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE document_forms (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  tipo_documental VARCHAR(100) NOT NULL,
  setor VARCHAR(100) DEFAULT 'Geral',
  ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE document_fields (
  id SERIAL PRIMARY KEY,
  form_id INTEGER REFERENCES document_forms(id) ON DELETE CASCADE,
  nome_campo VARCHAR(255) NOT NULL,
  tipo_campo VARCHAR(50) DEFAULT 'texto',
  opcoes_json JSONB DEFAULT '[]'::jsonb,
  obrigatorio BOOLEAN DEFAULT FALSE
);

CREATE TABLE document_slas (
  id SERIAL PRIMARY KEY,
  documento_id INTEGER REFERENCES pops(id) ON DELETE CASCADE,
  tipo_sla VARCHAR(50) DEFAULT 'revisão',
  prazo_horas INTEGER DEFAULT 24,
  data_limite TIMESTAMP NOT NULL,
  status_worker VARCHAR(50) DEFAULT 'pendente'
);
```

---

## 🏢 Gestão de Documentos Dinâmica & Workflows BPM

O módulo de **Gestão de Documentos** evoluiu de um repositório estático para uma arquitetura totalmente dinâmica, low-code e modular, inspirada no *Qualiex Fluxos*, *Notion*, *Monday* e *Pipefy*.

### Principais Funcionalidades
1. **Low-Code Administrativo:** Administradores possuem controle total para criar e editar novos Tipos Documentais (POPs, Protocolos, Contratos, Manuais, Formulários), Categorias e Setores sem alterar código.
2. **Workflows BPM Configuráveis:** Cada tipo documental possui um fluxo de aprovação customizado (ex: Contrato: Rascunho -> Assinatura -> Upload -> Validação -> Ativo) com SLAs padrão.
3. **Templates & Placeholders Dinâmicos:** Criação de modelos com rich text e placeholders automáticos (`{{nome}}`, `{{setor}}`, `{{responsavel}}`, `{{data}}`) que reduzem falhas de preenchimento.
4. **Formulários Dinâmicos:** Construtor de formulários com campos customizáveis (texto, select, upload de anexos, datas e assinaturas digitais).
5. **Versionamento e Histórico de Revisão:** Controle estrito de alterações com comparação de versões, histórico de autoria e aprovação de edições pendentes com justificativa.
6. **SLA Assíncrono e Filas:** O monitoramento de prazos de revisão e aprovação ocorre de forma assíncrona via filas e workers, disparando notificações automáticas e escalonamento para gestores.
7. **Dashboards Contextuais por Setor:** Cada departamento visualiza apenas seus documentos e métricas de SLA (ex: Enfermagem foca em protocolos assistenciais; Administração foca em contratos a vencer).
8. **IA Documental Avançada:** Motor inteligente para busca semântica, recomendação de documentos correlatos, análise de impacto de mudanças operacionais e identificação automática de gaps na acreditação ONA.

---

## 🎓 Universidade Corporativa Inteligente & IA-First

O módulo de Educação Corporativa evoluiu para uma plataforma de streaming educacional e gestão do conhecimento, inspirada na experiência de navegação do Qualiex LMS, Netflix e Coursera.

### Principais Pilares
1. **Onboarding & SLA Obrigatório (72 Horas):** Trilha institucional de acolhimento focada em cultura, LGPD, compliance e rotinas hospitalares. O não cumprimento do prazo de 72h gera alertas e pendências no painel de governança ONA.
2. **Trilhas Inteligentes por Área:** Capacitações, protocolos e fluxos operacionais segregados dinamicamente por setor (Enfermagem, Farmácia, Administrativo, Medicina Clínica, etc.).
3. **Matriz de Competências & Gaps:** Mapeamento contínuo de habilidades exigidas por cargo com recomendação de treinamentos para cobrir deficiências operacionais.
4. **Gamificação & Badges:** Sistema de pontuação (XP) e conquistas digitais (ex: *Mestre da Qualidade*, *Guardião da Segurança*).
5. **Biblioteca Corporativa Institucional:** Central de busca semântica para POPs, manuais, diretrizes e tutoriais em vídeo.
6. **IA Educacional Contextual:** Algoritmo que analisa o histórico de conformidade do colaborador para sugerir jornadas de reciclagem exatas e mitigar riscos de auditoria.

---



## 🛠️ Comandos Úteis de Manutenção

### Acompanhar Logs em Tempo Real
```bash
docker compose logs -f app
```

### Reiniciar o Banco de Dados (Reset de Seeds)
```bash
docker compose down -v
docker compose up -d --build
```

### Verificar Status dos Containers
```bash
docker compose ps
```

---

## 📄 Licença e Governança

Este software é propriedade exclusiva da **QualitaOS Enterprise**. Desenvolvido sob rígidos padrões de conformidade sanitária, gestão de riscos (ISO 31000), segurança do paciente e acreditação em saúde (ONA Níveis 1, 2 e 3).

```text
© 2026 QualitaOS — Todos os direitos reservados.
```
