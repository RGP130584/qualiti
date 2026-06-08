# PAL 10 — Canonical Data Model — PAL

Este documento especifica os Schemas Canônicos de dados administrativos e faturamento SaaS do módulo **Platform Administration & Licensing (PAL)**.

---

## 1. ESPECIFICAÇÃO DOS SCHEMAS CANÔNICOS

### 1.1. CanonicalTenant (Cadastro de Tenant SaaS)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CanonicalTenant",
  "type": "OBJECT",
  "properties": {
    "tenant_id": { "type": "STRING", "format": "uuid", "description": "UUID de identificação no QualitiOS" },
    "subdominio": { "type": "STRING", "description": "Prefixo de subdomínio exclusivo (ex: santacasa)" },
    "razao_social": { "type": "STRING", "description": "Nome da empresa" },
    "cnpj": { "type": "STRING", "description": "CNPJ com 14 dígitos" },
    "status": { "type": "STRING", "enum": ["ATIVO", "SUSPENSO", "CANCELADO"], "description": "Status operacional do tenant" }
  },
  "required": ["tenant_id", "subdominio", "razao_social", "cnpj", "status"]
}
```

### 1.2. CanonicalSubscription (Ciclo de Cobrança da Assinatura)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CanonicalSubscription",
  "type": "OBJECT",
  "properties": {
    "subscription_id": { "type": "STRING", "format": "uuid" },
    "tenant_id": { "type": "STRING", "format": "uuid" },
    "plan_name": { "type": "STRING", "description": "Nome do plano contratado" },
    "billing_status": { "type": "STRING", "enum": ["TRIAL", "ACTIVE", "OVERDUE", "SUSPENDED", "CANCELLED"] },
    "preco_mensal": { "type": "NUMBER", "description": "Preço da mensalidade em decimal" },
    "data_renovacao": { "type": "STRING", "format": "date", "description": "Data da próxima cobrança (YYYY-MM-DD)" }
  },
  "required": ["subscription_id", "tenant_id", "plan_name", "billing_status", "preco_mensal", "data_renovacao"]
}
```

### 1.3. CanonicalLicense (Ativação de Módulos)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CanonicalLicense",
  "type": "OBJECT",
  "properties": {
    "license_id": { "type": "STRING", "format": "uuid" },
    "tenant_id": { "type": "STRING", "format": "uuid" },
    "modulo_codigo": { "type": "STRING", "description": "Código do produto/módulo ativo (ex: mod:lms, mod:bpm)" },
    "is_active": { "type": "BOOLEAN" },
    "validade_expiracao": { "type": "STRING", "format": "date" }
  },
  "required": ["license_id", "tenant_id", "modulo_codigo", "is_active", "validade_expiracao"]
}
```

### 1.4. CanonicalUsageMetric (Rastreabilidade de Consumo)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CanonicalUsageMetric",
  "type": "OBJECT",
  "properties": {
    "tenant_id": { "type": "STRING", "format": "uuid" },
    "metric_code": { "type": "STRING", "enum": ["active_users", "ecm_documents", "bpm_instances", "lms_enrollments", "ate_assessments", "uih_requests"] },
    "current_value": { "type": "INTEGER", "description": "Valor numérico computado de uso" },
    "limit_value": { "type": "INTEGER", "description": "Limite máximo do plano contratado (null se ilimitado)" },
    "last_computed": { "type": "STRING", "format": "date-time" }
  },
  "required": ["tenant_id", "metric_code", "current_value", "last_computed"]
}
```

### 1.5. CanonicalInvoice (Faturas de Cobrança)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CanonicalInvoice",
  "type": "OBJECT",
  "properties": {
    "invoice_id": { "type": "STRING", "format": "uuid" },
    "tenant_id": { "type": "STRING", "format": "uuid" },
    "valor_faturado": { "type": "NUMBER" },
    "status_pagamento": { "type": "STRING", "enum": ["PENDENTE", "PAGO", "ATRASADO", "REJEITADO"] },
    "data_vencimento": { "type": "STRING", "format": "date" },
    "data_pagamento": { "type": "STRING", "format": "date", "description": "Data de liquidação (null se em aberto)" }
  },
  "required": ["invoice_id", "tenant_id", "valor_faturado", "status_pagamento", "data_vencimento"]
}
```
