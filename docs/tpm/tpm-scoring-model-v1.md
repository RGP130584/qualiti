# TPM Scoring Model v1 — Trusted Governance Scoring

Este documento estabelece o Modelo Oficial de Avaliação de Confiança do **TPM (Trusted Cognitive Platform)**. O modelo define como a plataforma de governança externa analisa estaticamente os repositórios, calcula as pontuações técnicas de arquitetura, domínio, segurança, higiene e conformidade de engenharia, e emite o parecer de integridade técnica para o ecossistema.

---

## 1. PRINCÍPIOS DO MODELO DE PONTUAÇÃO

O cálculo de integridade técnica do TPM orienta-se por cinco princípios fundamentais:

*   **Governança antes de Tecnologia**: A conformidade regulatória e a aderência a políticas de governança de TI guiam e determinam as escolhas técnicas e infraestruturais, e não o oposto.
*   **Arquitetura antes de Framework**: A estrutura lógica da aplicação (divisão de camadas e acoplamentos) deve permanecer independente de detalhes de entrega, servidores web ou bibliotecas específicas.
*   **Segurança por Padrão**: Toda funcionalidade ou integração de código deve ser concebida e operada de forma protegida contra desvios, com verificação contínua e passiva.
*   **Domínio antes de Implementação**: A integridade das regras centrais do negócio (Bounded Contexts) tem prioridade absoluta sobre conveniências de codificação ou atalhos na persistência.
*   **Evidência antes de Opinião**: Pareceres de conformidade e relatórios de confiança gerados pelo TPM baseiam-se estritamente em varreduras de fatos e asserções estáticas do código, e nunca em avaliações subjetivas de engenharia.

---

## 2. SCORE DOMAINS (Domínios de Pontuação)

O score geral do projeto é composto pela avaliação contínua de cinco domínios técnicos:

### 2.1. Architecture Score (Arquitetura)
Mede a conformidade estrutural do repositório em relação às divisões físicas e de design de software:
*   *Clean Architecture*: Avalia se o código respeita o desacoplamento e a separação lógica de camadas conceituais.
*   *Layer Violations*: Identifica o vazamento de detalhes físicos de infraestrutura para camadas lógicas internas (ex: instâncias de SQL Raw ou chamadas diretas de rede dentro dos casos de uso).
*   *Dependency Direction*: Garante que a direção das dependências de código seja sempre de fora para dentro (as camadas externas dependem das camadas internas de negócio).
*   *Domain Isolation*: Valida se o domínio principal de governança está preservado contra contaminações de regras assistenciais ou especializações verticais de suporte.

### 2.2. Domain Score (Domínio)
Mede a integridade dos limites de negócio desenhados para a aplicação:
*   *Bounded Context Integrity*: Analisa se o código de um módulo está fisicamente isolado e não realiza chamadas síncronas a componentes internos de outro contexto (sem passar pelo barramento de eventos ou pela camada de aplicação).
*   *Ownership Rules*: Fiscaliza se um contexto realiza escritas diretas em tabelas de banco de dados associadas a outro domínio sem autorização.
*   *Context Map Compliance*: Valida se a árvore de imports de código e as dependências respeitam as relações formais de Context Map (Upstream, Downstream, Customer, Supplier).
*   *Ubiquitous Language*: Checa se a base de código e os esquemas de dados utilizam termos obsoletos ou fora da linguagem ubíqua corporativa consolidada.

### 2.3. Security Score (Segurança)
Mede o nível de exposição de riscos de segurança e proteção de credenciais:
*   *Secrets Exposure*: Varre chaves privadas, senhas de banco ou tokens expostos em arquivos de texto no Git.
*   *Authentication*: Audita a integridade lógica e ausência de desvios nas rotas de verificação de identidade.
*   *Session Handling*: Verifica se tokens de sessão JWT são trafegados exclusivamente sob cabeçalhos protegidos contra XSS e CSRF.
*   *Dependency Vulnerabilities*: Monitora o uso de bibliotecas de terceiros do ecossistema de pacotes que possuam falhas de segurança conhecidas (CVEs).
*   *Security Policies*: Avalia se arquivos de configuração de infraestrutura seguem políticas de isolamento de rede e privilégios mínimos.

### 2.4. Hygiene Score (Higiene de Código)
Mede a qualidade e a limpeza do desenvolvimento diário no repositório:
*   *Dead Code*: Localiza arquivos, funções ou trechos de código TypeScript que estão inativos ou sem referências.
*   *Empty Files*: Identifica arquivos órfãos de 0 bytes acumulados no repositório.
*   *TODO/FIXME Críticos*: Sinaliza anotações de débitos técnicos críticos pendentes ou comentários marcados com prazos vencidos.
*   *Repository Cleanliness*: Verifica a organização física de arquivos nas pastas corretas do projeto.

### 2.5. Compliance Score (Conformidade de Processo)
Mede a maturidade documental e a governança das escolhas de engenharia:
*   *ADR Coverage*: Garante que as mudanças estruturais significativas no código possuem registros de decisões arquiteturais na pasta apropriada.
*   *Documentation Coverage*: Verifica se novos componentes, APIs e domínios possuem manuais e especificações técnicas atualizadas.
*   *TPM Policy Compliance*: Mede a aderência do repositório às asserções configuradas no arquivo `tpm.yaml`.
*   *Audit Readiness*: Sinaliza se a versão do build possui relatórios e rastros suficientes para passar por auditorias de acreditação externa sem intervenção manual.

---

## 3. WEIGHTS (Pesos dos Domínios)

O Score Final do TPM é a soma ponderada dos Scores parciais de cada domínio técnico:

| Domínio Técnico | Peso | Racional de Governança e Engenharia |
| :--- | :---: | :--- |
| **Architecture Score** | **30%** | Pilar mais crítico para assegurar a sustentabilidade e modularidade de longo prazo do monólito modular, impedindo acoplamento descontrolado e degradação estrutural. |
| **Domain Score** | **25%** | Garante o isolamento físico dos dados e a integridade de Bounded Contexts em DDD, assegurando que o sistema seja facilmente migrável e escalável. |
| **Security Score** | **25%** | Protege as credenciais e os dados sensíveis de auditoria e de pacientes contra vazamentos corporativos, com impacto regulatório imediato. |
| **Hygiene Score** | **10%** | Garante a manutenção e a limpeza diária do repositório, evitando o acúmulo de complexidade acidental e arquivos mortos. |
| **Compliance Score** | **10%** | Assegura a documentação e a rastreabilidade das decisões de engenharia, garantindo a transparência corporativa. |

---

## 4. SEVERITY MODEL (Modelo de Severidades)

Para cada desvio técnico ou inconformidade encontrada pelo scanner estático do TPM, é atribuída uma classificação de severidade contendo impacto de score e penalidades:

### 4.1. INFO
*   **Impacto**: Sugestões de melhoria estética de código ou pequenas anotações de refatoração simples. Não compromete a qualidade estrutural.
*   **Penalidade**: 0 pontos.
*   **Comportamento**: Apenas notifica no relatório de violações.

### 4.2. WARNING
*   **Impacto**: Pequenos desvios de linguagem ubíqua, arquivos vazios, TODOs simples ou pacotes com vulnerabilidades conhecidas de nível baixo.
*   **Penalidade**: 2 pontos por ocorrência (descontados do score do domínio correspondente).
*   **Comportamento**: Notifica o desenvolvedor no build e gera alerta no relatório, sem quebrar o pipeline de CI.

### 4.3. ERROR
*   **Impacto**: Quebras graves de Clean Architecture (ex: SQL Raw no controller), violações de imports entre contextos ou vulnerabilidades de pacotes de nível médio/alto.
*   **Penalidade**: 10 pontos por ocorrência.
*   **Comportamento**: Bloqueia automaticamente o merge de pull requests na CI, exigindo correção obrigatória ou aprovação de exceção temporária.

### 4.4. CRITICAL
*   **Impacto**: Segredos ou senhas hardcoded expostos em texto puro no Git, escrita direta em banco fora do domínio (banco cruzado), vulnerabilidades de dependências do ecossistema de nível crítico ou falha na tag HttpOnly de cookies.
*   **Penalidade**: 25 pontos por ocorrência (ou zeramento imediato do score do domínio correspondente se houver mais de duas).
*   **Comportamento**: Falha imediatamente o pipeline de CI do build, bloqueando qualquer merge ou deploy e enviando notificações urgentes de governança.

---

## 5. TRUST SCORE CALCULATION (Cálculo de Pontuação de Confiança)

O cálculo do score final de confiança técnica é normalizado na escala de 0 a 100 pontos.

1.  **Cálculo da Nota Individual de cada Domínio**:
    Cada domínio inicia com a pontuação máxima de 100 pontos. As penalidades das violações pertencentes a esse domínio são subtraídas cumulativamente, limitando a nota ao mínimo de 0.
    $$Score_{Domínio} = \max\left(0,\ 100 - \sum Penalidades_{Domínio}\right)$$

2.  **Cálculo do Trust Score Geral**:
    O score final de confiança é a soma ponderada das notas de cada domínio técnico:
    $$Trust\ Score = \left(Score_{Arch} \times 0.30\right) + \left(Score_{Domain} \times 0.25\right) + \left(Score_{Security} \times 0.25\right) + \left(Score_{Hygiene} \times 0.10\right) + \left(Score_{Compliance} \times 0.10\right)$$

---

## 6. TRUST LEVELS (Níveis de Confiança)

Com base no Trust Score Geral obtido, o build do projeto recebe uma classificação operacional de governança:

### 6.1. 0 - 49: UNTRUSTED
*   **Significado Operacional**: Nível de integridade inaceitável. O repositório apresenta graves desvios arquiteturais, vulnerabilidades críticas de segurança ou segredos expostos. O build está completamente bloqueado e nenhuma pull request pode ser integrada na branch principal.

### 6.2. 50 - 69: AT RISK
*   **Significado Operacional**: Presença de erros arquiteturais ou vulnerabilidades não corrigidas. O projeto está impedido de realizar deploys em produção. O time de engenharia deve focar exclusivamente em sanar as inconformidades técnicas para elevar a nota.

### 6.3. 70 - 84: ACCEPTABLE
*   **Significado Operacional**: Aderência básica aos princípios arquiteturais e limites de Bounded Contexts. Não existem violações de severidade `CRITICAL` ou `ERROR` pendentes de correção. Deploys são autorizados para ambientes de desenvolvimento e homologação (staging).

### 6.4. 85 - 94: TRUSTED
*   **Significado Operacional**: Código em conformidade com as diretrizes de Clean Architecture, segurança por padrão em Cookies/CORS atestada e baixo índice de débitos técnicos. O build está autorizado para receber merge e ser implantado em ambiente de produção corporativa.

### 6.5. 95 - 100: CERTIFIED
*   **Significado Operacional**: Estado de excelência de engenharia de software. 100% de conformidade técnica com as regras do TPM, sem nenhum erro ou aviso de warning pendente, com ADRs e documentação totalmente atualizadas. O build recebe o atestado assinado eletronicamente pelo TPM de integridade de versão.

---

## 7. BUILD GATE RULES (Regras do Portão de Build da CI)

O Build Gate integrado no Pipeline de CI opera sob as seguintes regras automáticas com base nas avaliações do TPM:

*   **Permite Merge**: O merge na branch principal é liberado somente se o Trust Score Geral for igual ou superior a **85** e não houver nenhuma violação ativa classificada como `ERROR` ou `CRITICAL`.
*   **Gera Warning**: O pipeline conclui o build com sucesso técnico básico se apresentar violações de severidade `INFO` ou `WARNING`, mas o score final permanecer acima de 70. O merge é permitido em staging, com alertas gravados nos logs da CI.
*   **Bloqueia Merge**: Se o Trust Score cair abaixo de **85** ou se houver qualquer infração de severidade `ERROR` pendente. O pipeline conclui o build com sucesso técnico básico, mas impede a integração (merge) na branch principal.
*   **Falha Pipeline**: Se for detectada qualquer violação do nível `CRITICAL` (como segredos no Git ou vulnerabilidade CVE crítica de pacotes). O pipeline é interrompido imediatamente com status de falha técnica, invalidando o build.

---

## 8. REPORT MODEL (Estrutura do Trust Report)

A esteira de validação do TPM gera, a cada execução, o **Trust Report** estruturado (JSON/Markdown) contendo as seguintes seções obrigatórias:

1.  **Identificação do Build**:
    *   Hash do Commit, Branch de origem, Autor, Data/Hora da execução e Status do Build Gate (PASSED, WARNING, BLOCKED, FAILED).
2.  **Resumo de Confiança (Executive Summary)**:
    *   Trust Score Geral (0 a 100).
    *   Classificação do Nível de Confiança (Trust Level).
    *   Tabela comparativa dos scores individuais obtidos por domínio técnico.
3.  **Logs de Violações (Violations Log)**:
    *   Lista das inconformidades encontradas contendo: ID do desvio, arquivo afetado, número da linha, severidade correspondente, regra violada e mensagem detalhada instruindo a correção.
4.  **Ações Recomendadas (Actionable Recommendations)**:
    *   Lista de tarefas recomendadas ordenadas por impacto técnico para correção de erros e elevação do score.
5.  **Atestado de Confiança Assinado (Trust Certificate)**:
    *   Hash digital de assinatura criptográfica emitido pelo TPM validando a integridade da versão analisada (gerado apenas nas faixas `TRUSTED` e `CERTIFIED`).

---

## 9. FUTURE EVOLUTION (Extensibilidade do Modelo)

O modelo V1 foi concebido para ser extensível sem sofrer quebras de retrocompatibilidade física em seu motor de regras ou fórmula base de cálculo:

*   **AI Governance Score**: Domínio futuro focado em avaliar a acurácia de RAG, versionamento de prompts contra injeções e manifestos de Model Context Protocol (MCP) aprovados.
*   **Data Governance Score**: Domínio futuro focado em rastreabilidade de linhagem de dados, conformidade e mascaramento de campos de identificação pessoal.
*   **Privacy Score**: Domínio focado em regras de exclusão permanente de logs de dados assistenciais e conformidade explícita com as leis gerais de proteção de dados.
*   **Reliability Score**: Domínio focado em cobertura de testes unitários reais de cobertura de caminhos críticos de código.
*   *Estratégia de Integração*: Para integrar um novo domínio, basta acrescentar sua nota de 100 pontos e recalibrar a distribuição percentual dos pesos de ponderação no arquivo `tpm.yaml`, de modo que a soma dos pesos de todos os domínios ativos permaneça resultando em 100%. A fórmula base do Trust Score e as faixas de Níveis de Confiança permanecem inalteradas.
