# PAL 02 — Catálogo de Produtos (Product Catalog Model) — PAL

Este documento especifica a modelagem hierárquica de Produtos, Módulos, Features e Add-ons comerciais do QualitiOS.

---

## 1. HIERARQUIA DO CATÁLOGO COMERCIAL

O portfólio comercial do QualitiOS é modelado em uma estrutura de árvore com herança lógica:

```text
Product (Produto)
└── Module (Módulo)
    ├── Feature (Funcionalidade Core)
    └── Add-on (Recurso Avançado Opcional)
```

---

## 2. COMPONENTES DO CATÁLOGO (CATALOG SPECIFICATION)

O QualitiOS é comercializado sob os seguintes eixos de produtos e recursos:

### 2.1. Produto: Core Platform (Governança & IAM)
*   **Status**: Mandatório (incluso em todos os planos base).
*   *Módulo IAM*: Controle de acessos e usuários.
*   *Módulo Admin*: Cadastro de unidades, organogramas e setores.
*   *Módulo Dashboard*: Visões e indicadores gerais de governança.

### 2.2. Produto: ECM (Gestão Documental)
*   **Status**: Opcional / Modular.
*   *Módulo POPs*: Ciclo de vida linear de documentos.
    *   *Feature*: Versionamento linear de arquivos.
    *   *Feature*: Fluxo de aprovação básico.
    *   *Add-on OCR & Embeddings*: Leitura automática de PDFs e assinaturas (requer infraestrutura de IA).

### 2.3. Produto: BPM (Processos & Automação)
*   **Status**: Opcional / Modular.
*   *Módulo Workflows*: Execução ativa de fluxogramas.
    *   *Feature*: BPMN Editor (desenho gráfico low-code).
    *   *Feature*: SLA Engine (monitoramento de tempos limites).
    *   *Add-on Integrations*: Disparo de callbacks HTTP externos em transições de status.

### 2.4. Produto: LMS (Educação Corporativa)
*   **Status**: Opcional / Modular.
*   *Módulo Universidade*: Plataforma de microtreinamentos.
    *   *Feature*: Player de vídeo e material em PDF.
    *   *Feature*: Quiz de retenção e verificação.
    *   *Add-on Certifications*: Emissão de atestados assinados eletronicamente.

### 2.5. Produto: Risk Management (Gestão de Riscos)
*   **Status**: Opcional / Modular.
*   *Módulo Ocorrências*: Reporte de falhas e incidentes.
    *   *Feature*: Canal móvel de notificação.
    *   *Feature*: Tratamento CAPA.
    *   *Add-on Ishikawa Inteligente*: Investigação de causa-raiz auxiliada por IA.

### 2.6. Produto: Compliance & Acreditação
*   **Status**: Opcional / Modular.
*   *Módulo Acreditações*: Gestão de conformidade.
    *   *Feature*: Checklists ONA e ISO.
    *   *Add-on Audit Conciliator*: Verificação sistêmica automatizada de evidências ONA.

### 2.7. Produto: ATE (Assessment & Transformation Engine)
*   **Status**: Opcional / Modular.
*   *Módulo Diagnósticos*: Auditoria de maturidade de capabilities.
    *   *Feature*: Questionário de capabilities.
    *   *Feature*: Gap Analysis.
    *   *Add-on Roadmap Generator*: Geração autônoma de cronograma em Waves.

### 2.8. Produto: UIH (Universal Integration Hub)
*   **Status**: Opcional / Modular.
*   *Módulo Conectores*: Gateway de tráfego de dados.
    *   *Feature*: Conectores REST API e Webhooks.
    *   *Add-on JDBC & Database Polling*: Conexão direta e delta a bancos legados.

---

## 3. RELACIONAMENTOS DE DEPENDÊNCIA COMERCIAL

*   **Pré-requisitos Técnicos**: Determinados módulos exigem a contratação de outros para viabilizar o fluxo de negócios:
    *   *Exemplo*: A contratação do módulo *Compliance & Acreditações* exige o produto *ECM (Gestão de POPs)*, pois as evidências de auditoria baseiam-se em documentos vigentes do repositório.
    *   O motor de vendas no painel administrativo valida esses pré-requisitos lógicos impedindo a ativação de módulos órfãos.
