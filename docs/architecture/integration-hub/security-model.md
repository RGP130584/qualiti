# Item 09 — Security Model — Universal Integration Hub (UIH)

Este documento especifica o modelo de segurança, autenticação, criptografia de credenciais e conformidade com a LGPD do **Universal Integration Hub (UIH)**.

---

## 1. CRIPTOGRAFIA DE DADOS E SECRETS (CREDENTIAL VAULT)

O UIH interage com diversos sistemas externos, necessitando armazenar senhas de banco de dados, chaves de API, certificados de segurança e tokens OAuth2.

```text
Credential Vault (Isolamento de Secrets)
├── Criptografia em Repouso (AES-256-GCM)
├── Rotação Automática de Chaves
└── Integração com Vaults Externos (HashiCorp Vault / AWS KMS)
```

*   **AES-256-GCM**: Todas as credenciais de conexões externas cadastradas em pipelines são criptografadas antes de serem gravadas nas tabelas do PostgreSQL. A chave de criptografia principal do tenant é mantida separada do banco de dados (injetada como variável de ambiente no runtime).
*   **Segregação por Tenant**: Cada tenant possui uma chave exclusiva de derivação (salt) no banco de dados para garantir que a quebra acidental das chaves de um tenant não exponha os segredos dos demais.

---

## 2. PROTOCOLOS DE AUTENTICAÇÃO E CONEXÃO (AUTHENTICATION & PROTOCOLS)

O UIH impõe as seguintes políticas de segurança para tráfego e acesso externo:

### 2.1. Criptografia em Trânsito (TLS)
*   Toda comunicação inbound e outbound é realizada obrigatoriamente sob protocolos seguros de transporte **HTTPS (TLS 1.2 ou TLS 1.3)**. Conexões sem criptografia (HTTP) são bloqueadas na borda do sistema (gateway).

### 2.2. Autenticação Inbound (Entrada)
Sistemas externos tentando gravar dados ou disparar webhooks no UIH devem autenticar-se por:
*   **OAuth2 (Client Credentials Flow)**: Geração de JWT temporário com escopos restritos de leitura/escrita para a integração.
*   **API Key (HMAC-SHA256)**: Payload acompanhado de cabeçalhos contendo chave e assinatura digital, validada pelo Webhook Listener.
*   **mTLS (Mutual TLS)**: Validação mútua de certificados digitais de cliente e servidor, recomendada para conexões diretas entre o HIS hospitalar e o QualitiOS.

---

## 3. MASCARAMENTO DE DADOS E PRIVACIDADE (LGPD / GDPR COMPLIANCE)

Para manter a conformidade com as exigências de privacidade da LGPD para dados pessoais (PII) e de saúde:
*   **Data Masking Dinâmico**: O motor de mapeamento e logs oculta informações sensíveis (ex: CPF, RG, nomes de pacientes) antes de salvá-los nas tabelas de logs de execução e depuração (`event_logs` ou `event_dlq`).
    *   *Exemplo*: O log de erro exibe apenas `***.489.***-00` em vez de CPF completo.
*   **Trilha LGPD de Acesso**: Toda leitura de dados de integração (especialmente no processamento de evidências ou auditoria de erros) gera um log imutável atestando o usuário, IP, pipeline afetada e data/hora.
