# Item 04 — Canonical Data Model — Universal Integration Hub (UIH)

Este documento especifica os Schemas Canônicos de dados unificados utilizados pelo UIH para tráfego e tradução de informações entre sistemas externos e o QualitiOS.

---

## 1. PROPÓSITO DO MODELO CANÔNICO

O **Modelo Canônico** é um contrato de dados abstrato e imutável. Ele isola as tabelas relacionais do banco de dados do QualitiOS (como `core_ocorrencias`, `pops` ou `indicadores`) de variações nos sistemas externos. 
Qualquer sistema legado (ex: HIS Soul MV, ERP SAP) deve ter suas saídas mapeadas e transformadas pelo UIH para se ajustarem a este formato canônico.

---

## 2. ESPECIFICAÇÃO DOS SCHEMAS CANÔNICOS

### 2.1. CanonicalColaborador (Cadastro de Funcionários / IAM)
Representa a sincronização de dados de pessoal e acessos vindos do sistema de RH.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CanonicalColaborador",
  "type": "OBJECT",
  "properties": {
    "codigo": { "type": "STRING", "description": "ID exclusivo de negócio do colaborador no sistema de origem (ex: matrícula de RH)" },
    "nome": { "type": "STRING", "description": "Nome completo do colaborador" },
    "email": { "type": "STRING", "format": "email", "description": "E-mail institucional exclusivo" },
    "role": { "type": "STRING", "enum": ["Admin", "Gestor", "Colaborador", "Auditor"], "description": "Papel de acesso atribuído no QualitiOS" },
    "setor": { "type": "STRING", "description": "Nome do setor dinâmico de lotação" },
    "unidade": { "type": "STRING", "description": "Nome da unidade física de lotação" },
    "status": { "type": "STRING", "enum": ["Ativo", "Inativo"], "description": "Status operacional do colaborador" },
    "data_admissao": { "type": "STRING", "format": "date", "description": "Data de admissão no formato YYYY-MM-DD" }
  },
  "required": ["codigo", "nome", "email", "role", "setor", "status"]
}
```

### 2.2. CanonicalOcorrencia (Registro de Incidentes / Riscos)
Representa a ingestão de incidentes e ocorrências registradas em sistemas assistenciais externos.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CanonicalOcorrencia",
  "type": "OBJECT",
  "properties": {
    "titulo": { "type": "STRING", "maxLength": 255, "description": "Título resumido do incidente" },
    "descricao": { "type": "STRING", "description": "Detalhamento livre da ocorrência" },
    "setor": { "type": "STRING", "description": "Setor de ocorrência" },
    "relator": { "type": "STRING", "description": "Identificação ou nome do relator (pode ser Anônimo)" },
    "tipo": { "type": "STRING", "enum": ["Evento Adverso", "Quase Falha (Near Miss)", "Inconformidade"], "description": "Classificação da ocorrência" },
    "severidade": { "type": "STRING", "enum": ["Leve", "Moderada", "Grave", "Sentinela"], "description": "Grau de severidade do incidente" },
    "data_registro": { "type": "STRING", "format": "date-time", "description": "Data e hora do registro original no formato ISO 8601 (YYYY-MM-DDTHH:MM:SSZ)" }
  },
  "required": ["titulo", "descricao", "setor", "tipo", "severidade"]
}
```

### 2.3. CanonicalIndicador (Sincronismo de KPIs / Desempenho)
Representa a ingestão automatizada de coletas de KPIs vindas de bancos de dados ou relatórios.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CanonicalIndicador",
  "type": "OBJECT",
  "properties": {
    "codigo": { "type": "STRING", "description": "Código identificador do KPI (ex: KPI-FIN-01)" },
    "nome": { "type": "STRING", "description": "Nome descritivo do indicador" },
    "setor": { "type": "STRING", "description": "Setor responsável pela métrica" },
    "periodicidade": { "type": "STRING", "enum": ["Mensal", "Trimestral", "Anual"], "description": "Frequência de atualização de coletas" },
    "meta": { "type": "NUMBER", "description": "Valor numérico da meta estabelecida" },
    "valor_atual": { "type": "NUMBER", "description": "Valor numérico medido no período correspondente" },
    "tendencia": { "type": "STRING", "enum": ["Melhorando", "Estável", "Piorando"], "description": "Vetor de tendência do KPI" }
  },
  "required": ["codigo", "nome", "setor", "meta", "valor_atual"]
}
```

### 2.4. CanonicalDocumento (Sincronismo de POPs / ECM)
Representa a importação de políticas, manuais ou POPs criados em repositórios de documentos externos.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CanonicalDocumento",
  "type": "OBJECT",
  "properties": {
    "codigo": { "type": "STRING", "description": "Código alfanumérico exclusivo (ex: POP-ENF-01)" },
    "titulo": { "type": "STRING", "description": "Título oficial da diretriz/POP" },
    "categoria": { "type": "STRING", "description": "Categoria do documento (ex: Assistencial, Administrativo)" },
    "setor": { "type": "STRING", "description": "Setor de aplicação do documento" },
    "versao": { "type": "STRING", "description": "Versão linear atualizada (ex: 1.0, 2.1)" },
    "conteudo": { "type": "STRING", "description": "Conteúdo textual bruto ou HTML do POP" },
    "autor": { "type": "STRING", "description": "Nome ou matrícula do autor criador" },
    "status_aprovacao": { "type": "STRING", "enum": ["Rascunho", "Em Revisão", "Aprovado", "Vigente"], "description": "Status no ciclo de vida" }
  },
  "required": ["codigo", "titulo", "categoria", "setor", "versao", "conteudo", "status_aprovacao"]
}
```
