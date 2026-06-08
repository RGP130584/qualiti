# OMOC 04 — Canonical Data Model — OMOC

Este documento especifica os Schemas Canônicos de dados organizacionais utilizados pelo UIH para ingestão e exportação de estruturas corporativas no QualitiOS.

---

## 1. ESPECIFICAÇÃO DOS SCHEMAS CANÔNICOS

### 1.1. CanonicalOrganization (Cadastro da Empresa Master)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CanonicalOrganization",
  "type": "OBJECT",
  "properties": {
    "cnpj": { "type": "STRING", "description": "CNPJ corporativo único de 14 dígitos" },
    "razao_social": { "type": "STRING", "description": "Nome empresarial oficial registrado" },
    "nome_fantasia": { "type": "STRING", "description": "Nome comercial da organização" },
    "tenant_id": { "type": "STRING", "format": "uuid", "description": "UUID do tenant correspondente no QualitiOS" }
  },
  "required": ["cnpj", "razao_social", "tenant_id"]
}
```

### 1.2. CanonicalUnit (Unidade de Negócio / Filiais)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CanonicalUnit",
  "type": "OBJECT",
  "properties": {
    "codigo_unidade": { "type": "STRING", "description": "Código identificador da unidade no ERP/HIS" },
    "cnpj_filial": { "type": "STRING", "description": "CNPJ específico da filial" },
    "nome": { "type": "STRING", "description": "Nome fantasia da filial (ex: Hospital Zona Sul)" },
    "status": { "type": "STRING", "enum": ["ATIVA", "INATIVA"], "description": "Status operacional da unidade" }
  },
  "required": ["codigo_unidade", "nome", "status"]
}
```

### 1.3. CanonicalDepartment (Setores e Divisões)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CanonicalDepartment",
  "type": "OBJECT",
  "properties": {
    "codigo_unidade": { "type": "STRING", "description": "Código da unidade à qual o setor pertence" },
    "codigo_setor": { "type": "STRING", "description": "Código exclusivo do setor no sistema de origem (ex: SET-UTI-01)" },
    "nome": { "type": "STRING", "description": "Nome amigável do departamento" },
    "centro_custo": { "type": "STRING", "description": "Código contábil do Centro de Custo associado" }
  },
  "required": ["codigo_unidade", "codigo_setor", "nome", "centro_custo"]
}
```

### 1.4. CanonicalPosition (Cargos e Postos)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CanonicalPosition",
  "type": "OBJECT",
  "properties": {
    "codigo_setor": { "type": "STRING", "description": "Código do setor onde a vaga está alocada" },
    "codigo_cargo": { "type": "STRING", "description": "ID do cargo no sistema de origem (ex: CARG-ENF-UTI)" },
    "titulo": { "type": "STRING", "description": "Título oficial do cargo (ex: Enfermeiro Assistencial)" },
    "cbo": { "type": "STRING", "description": "Código de Classificação Brasileira de Ocupações" },
    "superior_cargo_codigo": { "type": "STRING", "description": "Código do cargo do superior imediato (Reporting Line)" }
  },
  "required": ["codigo_setor", "codigo_cargo", "titulo", "superior_cargo_codigo"]
}
```

### 1.5. CanonicalEmployee (Colaboradores e Vínculos)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CanonicalEmployee",
  "type": "OBJECT",
  "properties": {
    "codigo_cargo": { "type": "STRING", "description": "Código do cargo ocupado" },
    "matricula": { "type": "STRING", "description": "Matrícula funcional (ex: MAT-15024)" },
    "nome": { "type": "STRING", "description": "Nome completo" },
    "cpf": { "type": "STRING", "description": "CPF sem pontuação" },
    "email": { "type": "STRING", "format": "email", "description": "E-mail funcional" },
    "tipo_vinculo": { "type": "STRING", "enum": ["CLT", "PRESTADOR", "TERCEIRIZADO"], "description": "Vínculo de trabalho" },
    "data_admissao": { "type": "STRING", "format": "date", "description": "Data de início do vínculo (YYYY-MM-DD)" },
    "data_demissao": { "type": "STRING", "format": "date", "description": "Data de término do vínculo, se aplicável (YYYY-MM-DD)" }
  },
  "required": ["codigo_cargo", "matricula", "nome", "cpf", "email", "tipo_vinculo", "data_admissao"]
}
```
