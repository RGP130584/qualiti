# PAL 05 — Orquestração de Acessos e Menus Dinâmicos (Menu Orchestration Model) — PAL

Este documento especifica a arquitetura de renderização dinâmica de menus, rotas e atalhos de navegação na barra lateral (sidebar) do QualitiOS com base nas licenças ativas do tenant.

---

## 1. PIPELINE DE CONTEXTO DE MENUS (MENU RENDERING PIPELINE)

A exibição de itens na interface do QualitiOS segue a hierarquia lógica de contratação do cliente:

```text
Tenant (Assinante)
 ➔ Verifica a Subscription ativa
 ➔ Carrega o mapa de Licenças e Feature Flags autorizadas
 ➔ Filtra o array de menuGroups (Removendo itens não contratados)
 ➔ Renderiza a sidebar dinâmica e segura
```

---

## 2. CONFIGURAÇÃO DE MENUS BASEADA EM METADADOS (METADATA-DRIVEN SIDEBAR)

Para integrar a dinâmica SaaS sem reescrever o layout do frontend, cada grupo e subitem do array `menuGroups` em [layout.tsx](file:///e:/documentos/projetos/qualiti/app/frontend/src/app/layout.tsx) recebe uma propriedade de metadados contendo a Feature Flag requerida para exibição:

```json
{
  "key": "compliance",
  "name": "Compliance & Acreditação",
  "icon": "Hospital",
  "required_feature": "feature:compliance:core",
  "items": [
    { "name": "Módulo ONA", "path": "/ona", "icon": "Hospital", "required_feature": "feature:compliance:core" },
    { "name": "ISO 9001 / ESG", "path": "/ona?tab=indicadores", "icon": "Award", "required_feature": "feature:compliance:iso" }
  ]
}
```

---

## 3. MECANISMO DE CONSTRUÇÃO DO MENU NO FRONTEND

1.  **Carga do Contexto Inicial (User Context Ingestion)**:
    *   Durante a inicialização da aplicação (`RootLayout` no Next.js), a chamada à rota `/api/auth/me` retorna os dados do usuário e do seu tenant ativo, incluindo a lista de strings das Feature Flags autorizadas:
        ```json
        {
          "nome": "Dr. Carlos Mendes",
          "role": "Admin",
          "tenant_id": "8c5b597c-9b16-43f1-b956-f51390d65b16",
          "features_ativas": ["feature:governanca:core", "feature:documentos:core", "feature:riscos:core", "feature:riscos:ishikawa"]
        }
        ```
2.  **Filtragem de Componentes (Sidebar Filtering)**:
    *   O componente JSX do sidebar varre o array `menuGroups`. 
    *   Se o `required_feature` do grupo de accordion **não** estiver contido no array `features_ativas` do usuário logado, o accordion inteiro é omitido da renderização.
    *   Se o grupo estiver ativo, o filtro é aplicado individualmente em sua lista de subitens (`group.items.filter(...)`), garantindo que apenas os recursos contratados fiquem visíveis para interação.
3.  **Bloqueio de Acesso por URL Direta**:
    *   Ocultar o menu no frontend previne o acesso visual, mas não protege as rotas fisicamente. 
    *   O middleware do Next.js e os validadores de rotas do Fastify Backend interceptam requisições a páginas (ex: `/fhir` ou `/ona`) e validam o token de sessão do usuário contra as Feature Flags contratadas do tenant, retornando página de bloqueio ou erro de API caso haja acesso direto não autorizado.
