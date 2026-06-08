# OMOC 08 — Integração ATE (ATE Integration) — OMOC

Este documento especifica os mecanismos de integração entre o módulo **Assessment & Transformation Engine (ATE)** e o domínio **OMOC**, demonstrando como a estrutura de organogramas e cargos serve de base para diagnósticos e escalonamento de gaps.

---

## 1. MAPEAMENTO DE RESPONSABILIDADES DE DIAGNÓSTICO (ASSESSMENT SCOPING)

O ATE utiliza as entidades do OMOC para definir quem responde por cada requisito de qualidade e onde as inconformidades estão localizadas:

*   **Escopo por Setor (Department Scoping)**: As perguntas de um `Assessment` (ex: ONA Nível 1) são vinculadas a um `Department` do OMOC (ex: UTI, Farmácia). Isso permite a filtragem de diagnósticos isolados por setor e a emissão de relatórios comparativos de maturidade entre diferentes áreas do hospital.
*   **Atribuição por Cargo (Position Assignment)**: Em vez de atribuir a resposta de um requisito a uma pessoa física específica (que pode se desligar ou mudar de setor), o ATE vincula a obrigatoriedade de responder ao cargo (`Position`).
    *   *Exemplo*: O requisito ONA 1.3 (Segurança na Identificação do Paciente) é atribuído ao cargo de *Coordenador de Enfermagem da UTI*. Qualquer colaborador que esteja ocupando esta vaga no momento da auditoria receberá a tarefa em sua fila de trabalho.

---

## 2. ESCALONAMENTO DE COMPLIANCE BASEADO EM REPORTING LINES

Para evitar atrasos na coleta de evidências e respostas a auditorias internas:
*   **Escalonamento Automático por Alerta**: Se uma tarefa de auditoria do ATE (ex: "Anexar evidência de calibração do ventilador pulmonar na UTI") ultrapassar o prazo de SLA configurado sem resposta do ocupante da vaga, o motor de concorrência do ATE busca a `ReportingLine` do OMOC.
*   **Encaminhamento para Superior**: A tarefa é automaticamente redirecionada com tag de urgência para a fila de trabalho do ocupante do cargo superior direto (`parent_position_id`).

```text
SLA de Auditoria Estourado (Fila do Enfermeiro de UTI)
 ➔ Busca ReportingLine correspondente
 ➔ Encaminha tarefa para a fila do Coordenador de UTI (Superior Direto)
 ➔ Registra penalidade de atraso na Eficiência de Execução do tenant
```

---

## 3. CONSOLIDAÇÃO DE SCORES DE MATURIDADE (SCORE ROLL-UP)

O ATE calcula o score global de maturidade corporativa consolidando as notas de forma ascendente através da hierarquia organizacional do OMOC:

$$\text{Maturidade de Setor (Department Score)} \rightarrow \text{Maturidade de Unidade (BusinessUnit Score)} \rightarrow \text{Maturidade Global (Organization Score)}$$

Isso permite que a diretoria geral identifique imediatamente qual unidade física ou setor está atuando como gargalo no score de acreditação institucional da holding, gerando recomendações de transformação focadas nas áreas de baixa maturidade.
