# Fase 03 — Modelo de Maturidade (Maturity Model) — ATE

Este documento estabelece o **Modelo de Maturidade** oficial para o módulo **Assessment & Transformation Engine (ATE)** do QualitiOS. O modelo serve de base lógica para o motor de scoring quantificar o nível operacional da organização em cada uma das 8 capacidades.

---

## 1. NÍVEIS DE MATURIDADE (MATURITY LEVELS)

Os níveis de maturidade da plataforma são classificados de **0 a 5** conforme os seguintes critérios conceituais:

| Nível | Classificação | Descrição Conceitual |
| :--- | :--- | :--- |
| **0** | **Inexistente** | Ausência completa de processos ou estruturas organizadas. Ações são ad-hoc e caóticas. |
| **1** | **Informal** | As atividades existem de forma informal e intuitiva na rotina, mas dependem de indivíduos. Não há padronização ou registro. |
| **2** | **Documentado** | Os processos são mapeados e formalizados (ex: POPs descritos), mas não há monitoramento sistemático ou automação. |
| **3** | **Gerenciado** | Os processos são monitorados por métricas de desempenho (KPIs), possuem responsáveis claros e metas de prazos (SLAs). |
| **4** | **Otimizado** | Integração automática de fluxos (BPM, LMS, ECM), auditorias internas sistemáticas e retroalimentação baseada em dados de conformidade. |
| **5** | **Excelência** | Uso de Inteligência Artificial para análise preditiva, auditoria de evidências autônoma e otimização em tempo real. |

---

## 2. MATRIZ DE CRITÉRIOS OBJETIVOS POR CAPABILIDADE

Para classificar um tenant, o ATE analisa critérios específicos para cada nível e capacidade:

### 2.1. Governança & IAM
*   **Nível 0 (Inexistente)**: Sem controle de acessos ou definição de papéis. Todos usam credenciais compartilhadas.
*   **Nível 1 (Informal)**: Acessos concedidos verbalmente. Organograma informal, sem correspondência com perfis de sistema.
*   **Nível 2 (Documentado)**: Perfis e papéis formalizados em manuais de qualidade. Usuários individuais cadastrados no sistema.
*   **Nível 3 (Gerenciado)**: RBAC dinâmico ativo no sistema. Painel executivo de governança ativado e atualizado.
*   **Nível 4 (Otimizado)**: Auditoria sistemática de perfis de acesso (SoD ativa). Integração nativa de logs de auditoria de sistema.
*   **Nível 5 (Excelência)**: Análise de acessos assistida por IA, identificando desvios de perfil anômalos. Score de governança computado em tempo real.

### 2.2. Estratégia
*   **Nível 0 (Inexistente)**: Organização opera sem metas formais. Planejamento estratégico inexistente.
*   **Nível 1 (Informal)**: Metas financeiras ou operacionais gerais definidas verbalmente pela diretoria, sem acompanhamento.
*   **Nível 2 (Documentado)**: Planejamento estratégico escrito em PDF e divulgado anualmente. OKRs definidos no papel.
*   **Nível 3 (Gerenciado)**: Módulo de OKRs ativo no sistema. Progresso de metas e KPIs inseridos manualmente de forma periódica.
*   **Nível 4 (Otimizado)**: OKRs dinâmicos vinculados diretamente a indicadores operacionais ativos no banco de dados, recalculados automaticamente.
*   **Nível 5 (Excelência)**: Inteligência Artificial prevê tendências de KRs com base em séries temporais de indicadores e recomenda ajustes estratégicos proativos.

### 2.3. Compliance & Acreditação
*   **Nível 0 (Inexistente)**: Desconhecimento de normas reguladoras e de acreditação aplicáveis ao negócio.
*   **Nível 1 (Informal)**: Tentativa de seguir normas apenas em vésperas de fiscalizações, de forma improvisada.
*   **Nível 2 (Documentado)**: Requisitos ONA/ISO mapeados em planilhas internas. Checklists preenchidos manualmente em papel.
*   **Nível 3 (Gerenciado)**: Checklists digitais periódicos executados na plataforma. Evidências associadas manualmente a cada item da norma.
*   **Nível 4 (Otimizado)**: Alinhamento automático de evidências sistêmicas (ex: POPs vigentes, treinamentos LMS) aos requisitos de acreditação.
*   **Nível 5 (Excelência)**: Auditoria de evidências automatizada (IA realiza leitura de PDFs anexos para certificar conformidade dos requisitos).

### 2.4. Educação & LMS
*   **Nível 0 (Inexistente)**: Sem treinamentos corporativos estruturados ou integração de colaboradores.
*   **Nível 1 (Informal)**: Novos colaboradores aprendem "observando" colegas mais antigos na rotina.
*   **Nível 2 (Documentado)**: Manuais e POPs entregues em formato impresso ou PDF para leitura individual no onboarding.
*   **Nível 3 (Gerenciado)**: LMS ativo no sistema com trilhas configuradas por cargo. Quizzes periódicos com notas mínimas de aprovação.
*   **Nível 4 (Otimizado)**: Integração ativa com ECM: revisões de POPs geram automaticamente microtreinamentos e quizzes no LMS. SLAs de integração monitorados.
*   **Nível 5 (Excelência)**: IA analisa lacunas de competência de colaboradores com base em erros de processos (CAPA) e recomenda trilhas LMS personalizadas de forma autônoma.

### 2.5. Conhecimento
*   **Nível 0 (Inexistente)**: Documentos e manuais espalhados em computadores locais de colaboradores, sem repositório central.
*   **Nível 1 (Informal)**: Pasta compartilhada na rede (ex: Google Drive, Dropbox) sem regras de taxonomia ou segurança.
*   **Nível 2 (Documentado)**: Biblioteca digital estruturada com separação de pastas por setor e nomenclatura de arquivos.
*   **Nível 3 (Gerenciado)**: Documentos catalogados com metadados estruturados, controle de validade de vigência e permissões de acesso por perfil.
*   **Nível 4 (Otimizado)**: Indexação automática de conteúdos. Busca semântica ativa por IA procurando trechos em arquivos e imagens da biblioteca.
*   **Nível 5 (Excelência)**: IA atua como assistente RAG corporativo conversando com a biblioteca de manuais para tirar dúvidas operacionais imediatas.

### 2.6. Processos & BPM
*   **Nível 0 (Inexistente)**: Processos não são mapeados. Cada colaborador realiza as atividades da sua maneira.
*   **Nível 1 (Informal)**: Fluxo de processos é mantido de forma tácita pela equipe de trabalho.
*   **Nível 2 (Documentado)**: Fluxogramas desenhados em ferramentas externas (ex: Visio, Miro) e salvos como imagens na biblioteca.
*   **Nível 3 (Gerenciado)**: Workflows modelados em BPMN integrados na plataforma. Controle e auditoria de transições de status ativos.
*   **Nível 4 (Otimizado)**: SLAs ativos por etapa de processo. Escalonamento automático de incidentes de atraso e notificações automáticas.
*   **Nível 5 (Excelência)**: Mineração de processos (Process Mining) automática baseada em eventos sistêmicos para sugerir otimizações e gargalos de fluxos.

### 2.7. Documentos & ECM
*   **Nível 0 (Inexistente)**: Documentos e POPs sem versionamento ou assinaturas de aprovação.
*   **Nível 1 (Informal)**: Uso de sufixos manuais nos nomes de arquivos (ex: `POP_enfermagem_v2_final_revisado.docx`) para simular controle.
*   **Nível 2 (Documentado)**: Versionamento formalizado na biblioteca de arquivos com preenchimento manual de autor e revisor.
*   **Nível 3 (Gerenciado)**: Ciclo de vida documental automatizado (Rascunho ➔ Revisão ➔ Aprovação ➔ Vigência) com assinaturas digitais.
*   **Nível 4 (Otimizado)**: Notificação automática de vencimento de vigência. Rastreabilidade de leitura de novos POPs por colaboradores afetados.
*   **Nível 5 (Excelência)**: IA analisa POPs novos ou alterados para garantir alinhamento com a linguagem ubíqua e sugerir melhorias de clareza textual.

### 2.8. Riscos & CAPA
*   **Nível 0 (Inexistente)**: Ocorrências e incidentes não são registrados ou reportados.
*   **Nível 1 (Informal)**: Incidentes comunicados verbalmente ao gestor de setor, resolvidos de forma paliativa e informal.
*   **Nível 2 (Documentado)**: Registro de ocorrências realizado em planilhas ou formulários impressos.
*   **Nível 3 (Gerenciado)**: Canal digital de denúncia/reporte ativo. Diagrama de Ishikawa de causa-raiz integrado ao sistema de investigação.
*   **Nível 4 (Otimizado)**: Planos de ação CAPA integrados a workflows com atribuição automática de tarefas, prazos e SLAs de tratamento.
*   **Nível 5 (Excelência)**: IA analisa a descrição livre do incidente, enquadra-o na taxonomia ONA/riscos, constrói uma versão preliminar do Ishikawa e sugere ações CAPA baseada em playbooks históricos.
