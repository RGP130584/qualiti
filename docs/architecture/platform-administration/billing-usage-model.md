# PAL 06 — Modelo de Tarifação e Consumo (Billing & Usage Model) — PAL

Este documento especifica as métricas de consumo rastreadas, os modelos de precificação SaaS e os mecanismos de coleta e auditoria de faturamento do QualitiOS.

---

## 1. MÉTRICAS DE CONSUMO RASTREADAS (USAGE METRICS)

O QualitiOS possui coletores em segundo plano (Usage Workers) que computam periodicamente a volumetria e o uso de recursos por tenant nas seguintes dimensões:

*   **Usuários Ativos (Active Seats)**: Contagem de registros na tabela de colaboradores com status `Ativo` e credenciais de login associadas.
*   **Armazenamento de Documentos (ECM Volume)**: Total de megabytes consumidos e contagem física de documentos controlados vigentes na tabela `pops`.
*   **Instâncias de Processos (BPM Runs)**: Quantidade total de execuções de fluxos de processos iniciadas na tabela de execuções do BPM.
*   **Treinamentos Concluídos (LMS Enrolls)**: Contagem de matrículas e emissões de certificados ocorridas no módulo LMS.
*   **Auditorias Concluídas (Assessments)**: Total de diagnósticos de maturidade finalizados e processados no ATE.
*   **Transações de Ingestão (API/Sync volume)**: Contagem de registros importados com sucesso pelo UIH.

---

## 2. MODELOS DE COMERCIALIZAÇÃO SAAS (BILLING MODELS)

A plataforma comercializa seus serviços sob quatro modalidades combináveis (planos híbridos):

### 2.1. Cobrança por Assento / Usuário (Seat-Based Billing)
*   **Regra**: O valor mensal base é proporcional ao número de usuários ativos cadastrados. O plano básico dá direito a $X$ assentos (ex: até 50 usuários), cobrando uma taxa adicional por assento excedente contratado.

### 2.2. Cobrança por Assinatura de Módulos (Flat Module Billing)
*   **Regra**: O cliente paga um valor fixo mensal para manter determinados módulos ativados (ex: Core + ECM + Riscos). Módulos avançados opcionais (como ATE e UIH) atuam como incrementos de cobrança recorrente.

### 2.3. Cobrança por Consumo (Pay-as-you-go)
*   **Regra**: Faturamento variável baseado no volume físico de transações processadas no mês de competência.
    *   *Exemplos de tarifas de consumo*:
        *   Custo por página de documento processada em OCR de IA.
        *   Custo por requisição externa processada via Webhooks do UIH.
        *   Custo por auditoria automatizada de ATE executada por IA.

---

## 3. MECANISMO DE CORES DA COTA (QUOTA ENFORCEMENT)

Para evitar abuso de recursos físicos sem causar falhas em processos críticos, o PAL impõe restrições baseadas em semáforos de uso de cota:

```mermaid
flowchart TD
    Request[Nova Ação: Criar Documento] --> CheckQuota[Validador de Cota]
    CheckQuota -->|Uso < 90%| Allow[1. Liberar e Persistir]
    CheckQuota -->|90% <= Uso < 100%| Warning[2. Liberar & Exibir Alerta de Cota]
    CheckQuota -->|Uso >= 100%| Deny{Tipo de Ação?}
    
    Deny -->|Assistencial/Crítica (Ocorrência)| AllowCritical[3. Permitir com Log Excedente]
    Deny -->|Administrativa (Novo POP/Usuário)| Block[4. Bloquear e Exigir Upgrade]
```

*   **Ação Crítica (Riscos/Ocorrências)**: Nunca é bloqueada mesmo se a cota do tenant estiver estourada, garantindo a conformidade regulatória assistencial (um enfermeiro deve sempre conseguir relatar um incidente adverso). O consumo excedente é registrado e cobrado como excedente na fatura subsequente.
*   **Ação Administrativa (Criar POP, Criar Usuário, Iniciar Treinamento)**: É bloqueada se a cota for atingida, exigindo que o Customer Admin realize upgrade do plano base na tela de faturamento self-service.
