# PAL 08 — Governança Multi-Tenant (Multi-Tenant Governance) — PAL

Este documento especifica as políticas de isolamento de dados, controle de cotas de infraestrutura física, auditoria administrativa de assinaturas e conformidade com a LGPD no QualitiOS SaaS.

---

## 1. ISOLAMENTO E MISTURA DE DADOS (DATA LEAKAGE PREVENTION)

O QualitiOS opera sob a arquitetura de **Banco de Dados Compartilhado (Shared Database, Shared Schema)**. Para assegurar que nenhum dado de um tenant vaze para outro:

*   **Validação por Middleware**: Toda requisição HTTP que chega ao API Gateway deve conter um cabeçalho de autorização com um token JWT válido. O gateway extrai o `tenant_id` do payload do token e o anexa de forma imutável ao contexto do request.
*   **Filtros SQL Implícitos (Row Level Security - RLS)**: O ORM/Persistence Layer intercepta todas as consultas SQL geradas para o banco de dados. Cláusulas `WHERE tenant_id = current_tenant_id` são anexadas automaticamente em tempo de compilação/execução, impedindo que desenvolvedores esqueçam de incluir o filtro de isolamento no código.
*   **Armazenamento Isolado**: Buckets de arquivos digitais (ex: S3, MinIO) são organizados sob chaves com prefixos exclusivos do tenant (`/buckets/tenants/{tenant_id}/docs/*`). O driver de upload valida se a permissão de leitura/gravação da chave coincide com o tenant ativo na sessão.

---

## 2. GERENCIAMENTO DE COTAS E LIMITES DE INFRAESTRUTURA (QUOTAS & LIMITS)

Para garantir a saúde financeira do SaaS e evitar a degradação de performance por consumo excessivo de hardware:

*   **Cota de Armazenamento de Banco**: Limitação do tamanho físico do banco de dados por tenant no PostgreSQL (ex: limite de 10GB de dados relacionais para planos básicos).
*   **Cota de Armazenamento de Arquivos (Storage Limit)**: Limite de armazenamento de mídias e PDFs controlados no bucket S3 (ex: Plano Standard = 50GB, Plano Premium = 500GB).
*   **Cota de Requisições (API Rate Limiting)**: O gateway bloqueia requisições de API que excedam o limite contratado de tráfego (ex: máximo de 600 requisições/minuto por tenant).
*   **Controle de Concorrência de Processamento Pesado**: Tarefas assíncronas que exigem processamento pesado de CPU/GPU (ex: OCR de documentos longos, buscas vetoriais no pgvector, análise de causa-raiz Ishikawa por IA) são inseridas em filas de segundo plano com limites de threads ativas por tenant (ex: no máximo 2 execuções simultâneas de OCR por tenant para evitar saturação de CPU compartilhada).

---

## 3. AUDITORIA ADMINISTRATIVA E CONFORMIDADE COM A LGPD

### 3.1. Trilha de Auditoria Recorrente
Toda alteração administrativa relacionada a licenciamento e faturamento gera um log imutável na tabela `auditoria_logs`:
*   Upgrades/Downgrades de planos de assinatura.
*   Ativação ou desativação manual de Feature Flags pelo Platform Owner.
*   Modificações de limites de cotas de usuários.
*   Visualizações de dados de faturamento (LGPD).

### 3.2. Exclusão de Dados Automatizada (Right to be Forgotten)
Em conformidade com o Artigo 16 da LGPD, quando uma assinatura entra no status `CANCELLED`:
*   O sistema agenda uma tarefa em segundo plano para rodar após 90 dias.
*   Durante esse período de carência, os dados permanecem congelados em modo de leitura restrito ao encarregado de dados (DPO) do cliente para fins de exportação de relatórios.
*   No 91º dia, a rotina de purga executa a exclusão em cascata (DELETE) de todos os registros contendo o `tenant_id` correspondente de todas as tabelas operacionais do banco e remove todos os arquivos correspondentes no bucket do S3, gerando um atestado de exclusão digital assinado.
