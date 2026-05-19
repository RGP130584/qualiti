# QualitiOS — Enterprise Governance & Compliance Platform

```text
======================================================================================
  ██████  ██    ██  █████  ██      ██ ████████ ██  ██████  ███████ 
 ██    ██ ██    ██ ██   ██ ██      ██    ██    ██ ██    ██ ██      
 ██    ██ ██    ██ ███████ ██      ██    ██    ██ ██    ██ ███████ 
 ██ ▄▄ ██ ██    ██ ██   ██ ██      ██    ██    ██ ██    ██      ██ 
  ██████   ██████  ██   ██ ███████ ██    ██    ██  ██████  ███████ 
     ▀▀                                                            
 Plataforma Corporativa Multi-Tenant Dinâmica de Governança e Inteligência Operacional
======================================================================================
```

O **QualitiOS** é uma plataforma corporativa de governança, gestão de qualidade e inteligência operacional projetada para instituições de internação de alta complexidade. Substituindo a rigidez de sistemas legados, o QualitiOS introduz uma arquitetura **100% Dinâmica, Multi-Tenant e Orientada por Dados**, permitindo que administradores reestruturem setores, cargos, fluxos de trabalho e visões de dashboards diretamente pela interface, sem necessidade de intervenção no código-fonte.

---

## 🌟 Principais Pilares & Diferenciais

### 1. Gestão de Documentos Corporativa (Ex-POPs)
O módulo documental evoluiu para englobar toda a taxonomia institucional da qualidade:
- **Organização Granular:** Classificação por Setor, Departamento, Categoria, Tipo Documental, Nível de Acesso, Instituição, Unidade, Versão e Status de Vigência.
- **Setores Iniciais Configuráveis:** *Administrativo, Enfermagem, Monitoria, Psicologia, Medicina Clínica, Medicina Psiquiatria, Gestão e Farmácia*.
- **Workflow de Revisão e SLA 24h:** Ciclo de vida completo com controle de rascunhos, edições pendentes e aprovação automatizada via notificação por e-mail e painel de vigência.

### 2. Dinamismo Organizacional & Painel Administrativo (`/admin/estrutura`)
Toda a fundação da plataforma é gerenciada dinamicamente pelo painel administrativo:
- **Setores e Subdepartamentos:** Criação de hierarquias organizacionais e categorias customizadas em tempo real.
- **RBAC Avançado & Cargos:** Permissões hierárquicas e controle de acesso granular configurado via matrizes JSON.
- **Tipos Documentais:** Definição de níveis de acesso padrão por categoria e especialidade.
- **Menus Dinâmicos:** Customização dos atalhos e itens da barra lateral com base na especialidade do usuário logado.

### 3. Segregação Contextual e Dashboards Customizados
A plataforma garante que cada usuário tenha acesso estritamente aos dados pertinentes à sua operação:
- **Visão por Setor:** Profissionais de Enfermagem visualizam apenas indicadores, protocolos e ocorrências assistenciais; profissionais da Farmácia acessam exclusivamente dados farmacêuticos e controle de psicotrópicos/LASA.
- **Dashboards Contextuais:** Configuração de visões específicas e reorganização de widgets por perfil (Ex: *Dashboard Administrativo*, *Dashboard Enfermagem*, *Dashboard Executivo de Gestão*).
- **Visão Global do Administrador:** Acesso irrestrito a todos os módulos, relatórios de glosas de internação, auditorias e logs de event sourcing (LGPD).

### 4. Padronização Corporativa de Internação
Em conformidade com as diretrizes internacionais de governança corporativa em saúde, toda a terminologia legada baseada no jargão "Hospitalar" foi substituída pelo conceito amplo e padronizado de **Internação** (ex: *Acreditação de Internação*, *Glosas de Internação*).

---

## 🏗️ Arquitetura do Sistema & Stack Tecnológico

O projeto segue os princípios de **Clean Architecture** e **Modularidade Desacoplada**, organizado em um monorepo corporativo:

```text
qualiti/
 ├── app/
 │    ├── backend/               # Fastify REST API + TypeScript + PostgreSQL
 │    │    ├── src/
 │    │    │    ├── db.ts        # Schema DDL, automação de ingestão e seeds dinâmicos
 │    │    │    ├── index.ts     # Gateway Fastify, JWT, Swagger OpenAPI 3.0 e Rotas
 │    │    │    ├── modules/     # Domínios isolados (Core Platform, ONA Acreditação)
 │    │    │    └── routes/      # Controladores REST (/api/admin, /api/pops, /api/bpm)
 │    │    └── package.json
 │    │
 │    ├── frontend/              # Next.js 14 (App Router) + React + Tailwind + Lucide Icons
 │    │    ├── src/app/
 │    │    │    ├── admin/       # Painel de Estrutura Organizacional Dinâmica
 │    │    │    ├── pops/        # Módulo de Gestão de Documentos (PWA + QR Code)
 │    │    │    ├── ona/         # Módulo de Acreditação de Internação ONA
 │    │    │    ├── incidents/   # Central de Ocorrências, Ishikawa e Plano CAPA
 │    │    │    ├── indicators/  # Analytics, Metas ONA e Tendências de KPIs
 │    │    │    ├── bpm/         # Workflow BPMN Engine
 │    │    │    ├── fhir/        # Interoperabilidade e Mensageria em Saúde
 │    │    │    └── layout.tsx   # Barra lateral dinâmica com suporte a Menus Config
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

A plataforma foi projetada para inicialização imediata e autossuficiente através do Docker Compose, incluindo a criação automática de tabelas e a ingestão automatizada de 69 documentos de governança da Rede Verse.

### 1. Pré-requisitos
- Docker Engine (v24.0+)
- Docker Compose (v2.20+)
- Git

### 2. Subindo a Plataforma em Produção / Desenvolvimento
Para compilar as imagens do monorepo e subir os serviços em background com recriação limpa:

```bash
# 1. Faça o clone do repositório
git clone https://github.com/qualitaos/qualiti.git
cd qualiti

# 2. Compile e inicie os containers
docker compose up -d --build --force-recreate
```

### 3. Acessando os Serviços
Assim que os containers estiverem Up, o Caddy Gateway irá rotear o tráfego automaticamente:
- **Aplicação Web (Frontend Next.js):** [http://localhost](http://localhost) ou `http://localhost:3000`
- **Painel de Estrutura Dinâmica:** [http://localhost/admin/estrutura](http://localhost/admin/estrutura)
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

As entidades de configuração corporativa residem no PostgreSQL e são modeladas para máxima flexibilidade:

```sql
-- Tabela de Configuração de Setores Dinâmicos
CREATE TABLE setores_config (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) UNIQUE NOT NULL,
  departamento_pai VARCHAR(255),
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  permissoes_json JSONB DEFAULT '{}'::jsonb,
  categorias_customizadas JSONB DEFAULT '[]'::jsonb,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Configuração de Dashboards Contextuais
CREATE TABLE dashboards_config (
  id SERIAL PRIMARY KEY,
  perfil_ou_setor VARCHAR(255) NOT NULL,
  nome_visao VARCHAR(255) NOT NULL,
  widgets_json JSONB DEFAULT '[]'::jsonb,
  layout_json JSONB DEFAULT '{}'::jsonb,
  is_global BOOLEAN DEFAULT FALSE,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Configuração de Menus da Barra Lateral
CREATE TABLE menus_config (
  id SERIAL PRIMARY KEY,
  perfil_ou_setor VARCHAR(255) UNIQUE NOT NULL,
  itens_json JSONB DEFAULT '[]'::jsonb,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

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
