# Manual de Clean Architecture e Modularidade — QualitiOS

Este documento estabelece as diretrizes arquiteturais obrigatórias para o desenvolvimento e evolução do código-fonte do QualitiOS, garantindo a manutenibilidade, testabilidade e isolamento contra acoplamentos tecnológicos.

---

## 1. Divisão Estrutural das Camadas Lógicas

O backend Fastify segue as diretrizes da **Clean Architecture**, dividindo a lógica em quatro camadas concêntricas. O fluxo de dependência é estritamente de fora para dentro (as camadas internas não conhecem nada sobre as externas).

```text
       ┌─────────────────────────────────────────────────────────┐
       │ Presentation Layer (Controllers, HTTP Handlers, Swagger) │
       │     └─────────────────────────────────────────────┐     │
       │     │ Application Layer (Services, Use Cases)     │     │
       │     │     └─────────────────────────────────┐     │     │
       │     │     │ Domain Layer (Entities, Events) │     │     │
       │     │     └─────────────────────────────────┘     │     │
       │     └─────────────────────────────────────────────┘     │
       └─────────────────────────────────────────────────────────┘
                   ▲
       ┌───────────┴─────────────────────────────────────────────┐
       │ Persistence / Infra Layer (Repositories, DB Client, pg) │
       └─────────────────────────────────────────────────────────┘
```

### 1.1. Camada de Domínio (Domain Layer)
*   **Localização**: `src/modules/<contexto>/domain/` (ou arquivos correspondentes no módulo).
*   **Responsabilidades**: Contém as regras de negócio corporativas essenciais: Entidades de Domínio, Value Objects, Eventos de Domínio e as interfaces (contratos) de Repositories.
*   **Regra de Ouro**: **Dependência zero**. Esta camada não deve importar nada de frameworks, bibliotecas ORM ou bibliotecas do Fastify/Postgres.

### 1.2. Camada de Aplicação (Application Layer)
*   **Localização**: `src/modules/<contexto>/application/` ou `src/services/`.
*   **Responsabilidades**: Orquestra o fluxo de dados dos Casos de Uso (Use Cases) e Serviços de Aplicação, validando regras específicas e emitindo eventos de domínio.
*   **Fluxo de Dependência**: Importa apenas a Camada de Domínio. Não possui referências a requisições/respostas HTTP ou drivers de banco de dados.

### 1.3. Camada de Persistência e Infraestrutura (Persistence/Infrastructure Layer)
*   **Localização**: `src/modules/<contexto>/infra/`, `src/db.ts` ou arquivos de repositório.
*   **Responsabilidades**: Implementações físicas de interfaces de banco de dados (Repositories executando queries SQL via `pg`), conectores externos, envio de e-mails, integrações FHIR.
*   **Fluxo de Dependência**: Conhece a Camada de Domínio (para persistir e carregar entidades) e a Camada de Aplicação.

### 1.4. Camada de Apresentação (Presentation Layer)
*   **Localização**: `src/routes/` ou `src/modules/<contexto>/controllers/`.
*   **Responsabilidades**: Controllers HTTP, definição de rotas Fastify, validação de esquemas de entrada (schemas/Swagger), descompressão de payloads e formatação de respostas HTTP.
*   **Fluxo de Dependência**: Conhece a Camada de Aplicação para acionar os serviços e a Camada de Domínio. Nunca se comunica diretamente com a persistência de banco de dados.

---

## 2. Restrições e Regras de Qualidade Estritas

### 2.1. Proibição de SQL Raw em Controllers
*   **A regra**: É terminantemente proibido o acoplamento de strings SQL brutas ou consultas diretas ao banco de dados dentro de arquivos de rotas, middlewares ou controllers.
*   **O Racional**: Controllers devem apenas processar protocolos HTTP. Consultas ao banco pertencem exclusivamente a Repositories de infraestrutura.
*   **O que o TPM audita**: Busca recursivamente o uso de `pool.query`, `client.query` ou strings SQL como `SELECT`, `INSERT`, `UPDATE`, `DELETE` dentro dos diretórios `src/routes` e `src/controllers`.

### 2.2. Fluxo Inverso de Dependências (Injeção de Dependência)
*   Se a Camada de Aplicação precisa interagir com o banco de dados, ela deve fazê-lo através da interface abstrata do Repository definida no Domínio. A instância real do repositório é injetada na inicialização do serviço.

### 2.3. Acoplamento de Domínio (Context Map)
*   Módulos de Bounded Contexts diferentes não devem realizar imports diretos de componentes internos uns dos outros. A comunicação autorizada deve ocorrer via:
    *   **Barramento Interno de Eventos Assíncronos**: Para avisos e reações de escrita.
    *   **Services Compartilhados**: Apenas quando explicitamente acordado em upstream/downstream no mapa de contextos.
