# Fase 11 — Mecanismo de Scoring (Scoring Engine) — ATE

Este documento especifica o modelo matemático, as equações lógicas e as regras de negócio utilizadas pelo **Mecanismo de Scoring (Scoring Engine)** do ATE para quantificar a maturidade, lacunas (gaps), priorização e prontidão de transformação de um tenant.

---

## 1. MODELO MATEMÁTICO DE MATURIDADE (MATURITY SCORE)

O nível de maturidade básica de uma capability no contexto de uma avaliação ($M_q$) é obtido a partir da resposta fornecida à pergunta $q$. Ela assume valores discretos e inteiros na escala conceitual:

$$M_q \in \{0, 1, 2, 3, 4, 5\}$$

---

## 2. EQUAÇÃO DA CAPABILITY SCORE (CS)

A pontuação de uma capability específica ($CS_c$) não se baseia apenas no preenchimento do questionário. O motor do ATE aplica um fator de validação empírica e operacional baseado nas evidências anexadas, processos integrados e indicadores em tempo real.

A equação oficial do score de uma capability $c$ que possui $N_c$ perguntas é:

$$CS_c = \frac{\sum_{q=1}^{N_c} (M_q \times \text{Validity}_q \times CW_q)}{\sum_{q=1}^{N_c} CW_q}$$

Onde:
*   **$CW_q$ (Compliance Weight)**: Peso de conformidade regulatória da pergunta $q$.
    *   $CW_q = 3$ para requisitos obrigatórios de segurança do paciente ou normas legais.
    *   $CW_q = 2$ para requisitos de gestão e processos.
    *   $CW_q = 1$ para requisitos de melhoria contínua ou governança corporativa geral.
*   **$\text{Validity}_q$ (Fator de Validação Operacional)**: Coeficiente de veracidade e acurácia da resposta.
    $$\text{Validity}_q = \text{EvidenceStatus}_q \times \text{ProcessStatus}_q \times \text{IndicatorStatus}_q$$
    Com os seguintes parâmetros:
    1.  **$\text{EvidenceStatus}_q$**:
        *   $1.0$ ➔ Evidência documental anexada e validada com sucesso (por IA ou Humano).
        *   $0.5$ ➔ Evidência pendente de auditoria ou em análise preliminar.
        *   $0.0$ ➔ Evidência inexistente, vencida (fora do prazo de vigência do POP) ou rejeitada.
    2.  **$\text{ProcessStatus}_q$**:
        *   $1.0$ ➔ Processo operacional mapeado em BPM e em execução ativa com histórico de transições.
        *   $0.8$ ➔ Processo existe na prática assistencial, mas está sem workflow BPM modelado.
    3.  **$\text{IndicatorStatus}_q$**:
        *   $1.0$ ➔ Indicador associado dinamicamente via integração de banco de dados ou FHIR.
        *   $0.8$ ➔ Progresso inserido manualmente por colaboradores, suscetível a erros.

---

## 3. EQUAÇÃO DO GAP SCORE (GS)

O Gap de uma capabilidade representa a distância entre o patamar operacional atual e a meta de conformidade corporativa:

$$GS_c = \max(0, \text{Target}_c - CS_c)$$

Onde:
*   **$\text{Target}_c$**: Maturidade alvo definida no Playbook para a capability $c$.
*   **$CS_c$**: Pontuação real computada para a capability $c$.

---

## 4. EQUAÇÃO DO PRIORITY SCORE (PS)

Para ordenar as tarefas no roadmap, cada gap de capabilidade detectado recebe um Score de Prioridade ($PS_g$) normalizado de 0 a 100:

$$PS_g = \min\left(100, \frac{GS_c \times \text{Impact}_g \times \text{Risk}_g \times \text{RegulatoryWeight}_g \times \text{StrategicWeight}_g}{50} \times 100\right)$$

Onde:
*   **$GS_c$**: Gap da capability (de $0.0$ a $5.0$).
*   **$\text{Impact}_g$**: Impacto operacional do gap caso persista (de $1$ a $5$).
*   **$\text{Risk}_g$**: Risco assistencial ou jurídico de conformidade (de $1$ a $5$).
*   **$\text{RegulatoryWeight}_g$**: Peso regulatório associado (de $1$ a $5$).
*   **$\text{StrategicWeight}_g$**: Multiplicador de alinhamento executivo do tenant (de $1.0$ a $2.0$).

---

## 5. TRANSFORMATION READINESS SCORE (TRS)

O **Transformation Readiness Score (TRS)** é o índice global (de 0% a 100%) que quantifica o nível geral de conformidade e a capacidade de execução do plano de transformação da organização.

O cálculo é composto pela média ponderada das capabilities ativas ajustada pelo índice de eficiência de execução de tarefas:

$$TRS = \left( \frac{\sum_{c=1}^{8} CS_c}{\sum_{c=1}^{8} \text{Target}_c} \times 100 \right) \times \text{ExecutionEfficiency}$$

Onde:
*   **$\text{ExecutionEfficiency}$**: Coeficiente de execução das tarefas do roadmap.
    $$\text{ExecutionEfficiency} = 1.0 - \left( 0.2 \times \frac{\text{Tarefas Atrasadas}}{\text{Total de Tarefas Ativas}} \right)$$
    *   Este fator pune o score global de prontidão caso a organização demonstre ineficiência ou lentidão na mitigação operacional dos gaps sugeridos, garantindo que a pontuação reflita a realidade física e não apenas os relatórios documentais.
