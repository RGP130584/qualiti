# OMOC 01 — Domain Discovery — Organization Management & Org Chart

Este documento estabelece o escopo de negócios, o alinhamento estratégico, as personas e a Linguagem Ubíqua do módulo **Organization Management & Org Chart (OMOC)** do QualitiOS.

---

## 1. PROBLEMA DE NEGÓCIO (BUSINESS PROBLEM)

A representação da estrutura organizacional em empresas reguladas (especialmente hospitais de alta complexidade) é volátil e multifacetada. A falta de um domínio organizacional unificado no QualitiOS causa as seguintes dores:

1.  **Inconsistência de Permissões (RBAC)**: Sem uma fonte centralizada de estrutura hierárquica, as permissões de acesso e fluxos de aprovação de documentos (POPs) e incidentes (CAPA) dependem de mapeamentos manuais e suscetíveis a erros.
2.  **Duplicação e Desconexão de Dados**: Setores, cargos e colaboradores são cadastrados separadamente em múltiplos módulos (LMS, BPM, ECM), criando incompatibilidades e órfãos quando há demissão, transferência ou promoção.
3.  **Complexidade Assistencial Real**: Hospitais operam sob matrizes funcionais complexas, onde enfermeiros respondem a um coordenador administrativo de setor e a um diretor assistencial simultaneamente. Estruturas tradicionais rígidas de TI falham em modelar interinidades, substituições de férias e contratação de prestadores terceirizados.
4.  **Atraso Operacional**: Mudanças em organogramas de RH demoram semanas para serem propagadas nas engines de BPM, atrasando transições de tarefas críticas e estouros de SLAs organizacionais.

---

## 2. ATORES E PERSONAS (ACTORS & PERSONAS)

*   **Administrador de RH / TI**:
    *   *Objetivo*: Gerenciar o cadastro inicial de empresas, unidades, departamentos e cargos, além de orquestrar a carga de colaboradores via integração.
*   **Diretor Geral / Sponsor Executivo**:
    *   *Objetivo*: Acompanhar o organograma visual corporativo e certificar que a estrutura atende aos critérios regulatórios de governança clínica.
*   **Gestor de Setor (Coordenador / Supervisor)**:
    *   *Objetivo*: Visualizar sua linha direta de subordinados, aprovar POPs de seu setor e monitorar as trilhas do LMS de sua equipe.
*   **Colaborador Assistencial**:
    *   *Objetivo*: Visualizar seu posicionamento, consultar quem são seus superiores imediatos e responder por tarefas operacionais delegadas ao seu cargo.

---

## 3. OBJETIVOS E RESULTADOS ESPERADOS (OBJECTIVES & KEY RESULTS)

### Objetivos:
*   **Fonte Única de Verdade (SSoT)**: Estabelecer o domínio de estrutura organizacional como o motor de autoridade para BPM, ECM, LMS, Compliance, Risks, ATE, UIH e IAM/RBAC.
*   **Flexibilidade Hierárquica**: Suportar organogramas matriciais, substituições temporárias, interinidades e terceirizações.
*   **Visualização Dinâmica**: Fornecer a base de dados estruturada para renderização em tempo real de organogramas corporativos interativos.

### Resultados Esperados:
*   **Tempo zero** de latência na propagação de alterações de organograma para o controle de rotas, permissões e aprovações do BPM.
*   **Eliminação total** de cadastros duplicados de colaboradores na plataforma.
*   **100% de rastreabilidade** em histórico de movimentações, transferências e promoções para fins de auditorias de compliance (ONA/ISO).

---

## 4. LINGUAGEM UBÍQUA (UBIQUITOUS LANGUAGE)

*   **Organization (Organização)**: A entidade jurídica corporativa master (tenant principal).
*   **BusinessUnit (Unidade de Negócio)**: Uma filial física ou unidade descentralizada da corporação (ex: Hospital Central, Unidade de Pronto Atendimento).
*   **Department (Departamento/Setor)**: Divisão lógica operacional dentro de uma BusinessUnit (ex: UTI Pediátrica, Farmácia Central).
*   **Position (Cargo/Posto de Trabalho)**: A definição do papel e requisitos funcionais associados a um departamento (ex: Enfermeiro Assistencial da UTI). É o cargo que recebe permissões, não o colaborador diretamente.
*   **Employee (Colaborador)**: A pessoa física vinculada ao cargo. Pode ser CLT, prestador de serviço ou terceirizado.
*   **ReportingLine (Linha de Subordinação)**: Relação hierárquica que define quem reporta a quem no organograma (hierarquia direta e matricial).
*   **Interim (Interinidade)**: Atribuição temporária de um colaborador a um cargo superior acumulando responsabilidade sem vacância definitiva (ex: assumir chefia de setor durante licença do titular).
*   **Substitute (Substituto)**: Colaborador designado para responder por fluxos e aprovações de outro durante ausências programadas (férias, congressos).
