import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as crypto from 'crypto';
import { parse } from 'yaml';

// Interface do tpm.yaml
interface TpmConfig {
  project: {
    name: string;
    classification: string;
    criticality: string;
    environment: string;
    multi_tenant: boolean;
  };
  severities: {
    [key: string]: {
      weight: number;
      fail_build: boolean;
    };
  };
  policies: {
    [key: string]: {
      enabled: boolean;
      severity: string;
      description: string;
      rules: string[];
    };
  };
}

interface Violation {
  file: string;
  line: number;
  policy: string;
  rule: string;
  severity: string;
  message: string;
}

class TpmEngine {
  private config!: TpmConfig;
  private projectRoot: string;
  private violations: Violation[] = [];
  private baseDir: string;

  constructor() {
    this.projectRoot = path.resolve(__dirname, '../../');
    this.baseDir = path.resolve(__dirname, '../../app');
    this.loadConfig();
  }

  private loadConfig() {
    const yamlPath = path.join(this.projectRoot, 'tpm.yaml');
    if (!fs.existsSync(yamlPath)) {
      console.warn('tpm.yaml não encontrado na raiz. Usando configuração padrão.');
      this.config = this.getDefaultConfig();
      return;
    }
    try {
      const content = fs.readFileSync(yamlPath, 'utf8');
      this.config = parse(content) as TpmConfig;
    } catch (err) {
      console.error('Erro ao fazer parse do tpm.yaml:', err);
      this.config = this.getDefaultConfig();
    }
  }

  private getDefaultConfig(): TpmConfig {
    return {
      project: { name: 'qualiti', classification: 'confidential', criticality: 'high', environment: 'enterprise', multi_tenant: true },
      severities: {
        critical: { weight: 100, fail_build: true },
        high: { weight: 70, fail_build: true },
        medium: { weight: 40, fail_build: false },
        low: { weight: 10, fail_build: false }
      },
      policies: {}
    };
  }

  // Identifica arquivos modificados via git, ou escaneia todos se falhar
  private getFilesToScan(): string[] {
    try {
      const gitOutput = execSync('git diff --name-only HEAD', { cwd: this.projectRoot }).toString();
      const files = gitOutput.split('\n')
        .map(f => f.trim())
        .filter(f => f && (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx')))
        .map(f => path.join(this.projectRoot, f))
        .filter(f => fs.existsSync(f));
      
      if (files.length > 0) {
        console.log(`[TPM] Detectados ${files.length} arquivos modificados via Git Diff.`);
        return files;
      }
    } catch (err) {
      // Ignora erro e cai no escaneamento completo
    }

    console.log('[TPM] Escaneando todos os arquivos TypeScript/JavaScript no diretório app/.');
    return this.getAllFiles(this.baseDir);
  }

  private getAllFiles(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const name = path.join(dir, file);
      if (fs.statSync(name).isDirectory()) {
        if (!name.includes('node_modules') && !name.includes('.next') && !name.includes('dist')) {
          this.getAllFiles(name, fileList);
        }
      } else if (name.endsWith('.ts') || name.endsWith('.tsx') || name.endsWith('.js') || name.endsWith('.jsx')) {
        fileList.push(name);
      }
    }
    return fileList;
  }

  // Executa os scanners
  public run() {
    console.log('[TPM] Iniciando varredura de governança e segurança...');
    const files = this.getFilesToScan();

    for (const file of files) {
      const relativePath = path.relative(this.projectRoot, file);
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      // 1. Regras de Clean Architecture e SQL Raw em Controllers
      if (this.isPolicyEnabled('clean_architecture')) {
        this.scanCleanArchitecture(relativePath, lines);
      }

      // 2. Regras de Propriedade de Banco de Dados (Database Ownership)
      if (this.isPolicyEnabled('database_ownership')) {
        this.scanDatabaseOwnership(relativePath, lines);
      }

      // 3. Regras de Acoplamento do Context Map (Domain Dependency)
      if (this.isPolicyEnabled('domain_dependency')) {
        this.scanDomainDependency(relativePath, lines);
      }

      // 4. Regras de Segurança (Secrets Scanner & CORS)
      if (this.isPolicyEnabled('security_validation')) {
        this.scanSecurity(relativePath, lines, content);
      }

      // 5. Regras de Higiene (Empty Files, Ubiquitous Language, Event Immutability)
      if (this.isPolicyEnabled('code_hygiene')) {
        this.scanHygiene(relativePath, lines, content);
      }
    }

    // 6. Análise de Vulnerabilidades NPM (Package Vulnerabilities)
    if (this.isPolicyEnabled('package_vulnerability')) {
      this.scanPackageVulnerability();
    }

    this.processResults();
  }

  private isPolicyEnabled(policyKey: string): boolean {
    return this.config.policies[policyKey]?.enabled ?? false;
  }

  private getPolicySeverity(policyKey: string): string {
    return this.config.policies[policyKey]?.severity || 'medium';
  }

  private addViolation(file: string, line: number, policy: string, rule: string, message: string) {
    const severity = this.getPolicySeverity(policy);
    this.violations.push({ file, line, policy, rule, severity, message });
  }

  // ==========================================
  // SCANNERS INDIVIDUAIS
  // ==========================================

  // 1. Clean Architecture: Proibir SQL Raw em Controllers/Routes
  private scanCleanArchitecture(file: string, lines: string[]) {
    const isControllerOrRoute = file.includes('controllers') || file.includes('routes');
    if (!isControllerOrRoute) return;

    const sqlRawRegex = /\b(SELECT|INSERT|UPDATE|DELETE)\b.*\b(FROM|INTO|SET)\b/i;
    const dbClientRegex = /\b(pool|client|db)\.query\(/i;

    lines.forEach((lineText, index) => {
      if (dbClientRegex.test(lineText) || sqlRawRegex.test(lineText)) {
        this.addViolation(
          file,
          index + 1,
          'clean_architecture',
          'no_raw_sql_in_controllers',
          `Uso ilegal de query de banco de dados ou SQL Raw dentro de Controllers/Routes. Mova para a persistência/repositório.`
        );
      }
    });
  }

  // 2. Database Ownership: Proibir escrita em tabelas de outros Bounded Contexts
  private scanDatabaseOwnership(file: string, lines: string[]) {
    // Mapeamento de tabelas físicas para os contextos proprietários
    const tableOwners: { [table: string]: string } = {
      instituicao: 'core',
      usuarios: 'core',
      funcoes_cadastradas: 'core',
      setores_config: 'core',
      cargos_config: 'core',
      okrs: 'okrs',
      key_results: 'okrs',
      okr_cycles: 'okrs',
      okr_progress: 'okrs',
      indicadores: 'indicators',
      indicador_coletas: 'indicators',
      ona_requisitos: 'ona',
      education_courses: 'education',
      education_modules: 'education',
      education_lessons: 'education',
      education_quizzes: 'education',
      education_progress: 'education',
      education_certificates: 'education',
      education_tracks: 'education',
      education_competencies: 'education',
      education_badges: 'education',
      education_library: 'education',
      education_notifications: 'education',
      document_templates: 'Knowledge',
      document_categories: 'Knowledge',
      document_forms: 'Knowledge',
      document_fields: 'Knowledge',
      bpm_fluxos: 'bpm',
      bpm_execucoes: 'bpm',
      document_workflows: 'bpm',
      pops: 'pops',
      pop_versoes: 'pops',
      document_versions: 'pops',
      document_permissions: 'pops',
      document_status: 'pops',
      document_slas: 'pops',
      document_reviews: 'pops',
      incidentes: 'incidents',
      auditoria_logs: 'audit',
      notificacoes: 'notifications'
    };

    // Identificar contexto atual com base no diretório
    let currentModule = '';
    const match = file.match(/modules[\\/]([^\\/]+)/);
    if (match) {
      currentModule = match[1].toLowerCase();
    } else {
      // Fora dos módulos, ex: rotas globais
      const routeMatch = file.match(/routes[\\/]([^\\/\.]+)/);
      if (routeMatch) {
        currentModule = routeMatch[1].toLowerCase();
      }
    }

    if (!currentModule) return;

    // Ajusta nomes de contexto para correspondência
    if (currentModule === 'auth' || currentModule === 'users') currentModule = 'core';
    if (currentModule === 'okrs') currentModule = 'okrs';
    if (currentModule === 'indicators') currentModule = 'indicators';
    if (currentModule === 'ona') currentModule = 'ona';
    if (currentModule === 'education') currentModule = 'education';
    if (currentModule === 'bpm') currentModule = 'bpm';
    if (currentModule === 'pops') currentModule = 'pops';
    if (currentModule === 'incidents') currentModule = 'incidents';

    const writeRegex = /\b(INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+([a-zA-Z0-9_]+)/i;

    lines.forEach((lineText, index) => {
      const writeMatch = lineText.match(writeRegex);
      if (writeMatch) {
        const tableName = writeMatch[2].toLowerCase();
        const ownerModule = tableOwners[tableName];
        if (ownerModule && ownerModule !== currentModule) {
          this.addViolation(
            file,
            index + 1,
            'database_ownership',
            'check_cross_context_write',
            `Escrita cruzada direta ilegal na tabela '${tableName}' (propriedade do módulo '${ownerModule}') a partir do módulo '${currentModule}'. Utilize eventos assíncronos.`
          );
        }
      }
    });
  }

  // 3. Domain Dependency: Validar acoplamento síncrono ilegal do Context Map
  private scanDomainDependency(file: string, lines: string[]) {
    let currentModule = '';
    const match = file.match(/modules[\\/]([^\\/]+)/);
    if (match) {
      currentModule = match[1].toLowerCase();
    }

    if (!currentModule) return;

    lines.forEach((lineText, index) => {
      // Detecta imports diretos de outros módulos
      if (lineText.includes('import ') && lineText.includes('/modules/')) {
        const importMatch = lineText.match(/modules\/([^/]+)/);
        if (importMatch) {
          const importedModule = importMatch[1].toLowerCase();
          if (importedModule !== currentModule) {
            // Regra simples do Context Map: Permitir apenas dependências para core, bloquear acoplamento circular ou com módulos paralelos
            const allowedImports: { [key: string]: string[] } = {
              'ona': ['core'],
              'education': ['core'],
              'bpm': ['core', 'pops'],
              'pops': ['core'],
              'incidents': ['core'],
              'okrs': ['core', 'indicators'],
              'indicators': ['core']
            };

            const allowed = allowedImports[currentModule] || ['core'];
            if (!allowed.includes(importedModule)) {
              this.addViolation(
                file,
                index + 1,
                'domain_dependency',
                'check_context_map_coupling',
                `Acoplamento síncrono ilegal: Módulo '${currentModule}' importando diretamente de '${importedModule}'. Dependência não permitida no Context Map.`
              );
            }
          }
        }
      }
    });
  }

  // 4. Security Validation: Secrets Scanner & CORS checks
  private scanSecurity(file: string, lines: string[], content: string) {
    // Scanner de Secrets Hardcoded
    const secretRegexes = [
      { name: 'JWT Secret', regex: /JWT_SECRET\s*=\s*['"]([A-Za-z0-9_-]{12,})['"]/i },
      { name: 'Generic Password', regex: /(senha|password|passwd)\s*:\s*['"]([A-Za-z0-9_-]{6,})['"]/i },
      { name: 'Private Key', regex: /-----BEGIN\s+PRIVATE\s+KEY-----/i }
    ];

    lines.forEach((lineText, index) => {
      for (const rule of secretRegexes) {
        if (rule.regex.test(lineText)) {
          // Ignorar variáveis de ambiente de arquivos .env ou .env.example
          if (!file.endsWith('.env') && !file.endsWith('.env.example')) {
            this.addViolation(
              file,
              index + 1,
              'security_validation',
              'check_hardcoded_secrets',
              `Segredo exposto hardcoded detectado (${rule.name}). Remova e configure via variáveis de ambiente.`
            );
          }
        }
      }
    });

    // Verificação de CORS aberto (wildcard)
    if (file.includes('index.ts') && file.includes('backend')) {
      lines.forEach((lineText, index) => {
        if (lineText.includes('origin:') && lineText.includes('*')) {
          this.addViolation(
            file,
            index + 1,
            'security_validation',
            'check_cors_wildcard',
            `Wildcard de CORS aberto ('*') detectado. Configure domínios estritos.`
          );
        }
      });
    }
  }

  // 5. Hygiene Check: Empty Files, Ubiquitous Terms, Event Immutability
  private scanHygiene(file: string, lines: string[], content: string) {
    // Arquivo vazio
    if (content.trim().length === 0) {
      this.addViolation(
        file,
        1,
        'code_hygiene',
        'check_empty_files',
        `Arquivo está vazio ou contém apenas espaços em branco.`
      );
    }

    // Eventos de domínio imutáveis (devem conter apenas campos readonly)
    if (file.includes('events.ts') || file.includes('event.ts')) {
      lines.forEach((lineText, index) => {
        if (lineText.includes('class ') || lineText.includes('interface ')) {
          // Início de definição de evento
        }
        if (lineText.trim() && !lineText.includes('readonly') && !lineText.includes('class ') && !lineText.includes('interface ') && !lineText.includes('import ') && !lineText.includes('}') && !lineText.includes('constructor') && !lineText.includes('export ')) {
          this.addViolation(
            file,
            index + 1,
            'code_hygiene',
            'check_event_immutability',
            `Campo não imutável detectado em evento de domínio. Utilize a flag 'readonly'.`
          );
        }
      });
    }

    // Linguagem ubíqua obsoleta
    const forbiddenTerms = ['usuario_obsoleto', 'pop_v1_old', 'ona_tabela_backup'];
    lines.forEach((lineText, index) => {
      forbiddenTerms.forEach(term => {
        if (lineText.includes(term)) {
          this.addViolation(
            file,
            index + 1,
            'code_hygiene',
            'check_obsolete_language',
            `Termo obsoleto de linguagem ubíqua detectado: '${term}'.`
          );
        }
      });
    });
  }

  // 6. Package Vulnerability: wrapper sobre npm audit
  private scanPackageVulnerability() {
    try {
      console.log('[TPM] Executando análise de vulnerabilidades NPM...');
      // Executa npm audit no backend
      const backendDir = path.join(this.projectRoot, 'app/backend');
      if (fs.existsSync(path.join(backendDir, 'package.json'))) {
        try {
          const auditJson = execSync('npm audit --json', { cwd: backendDir }).toString();
          const auditData = JSON.parse(auditJson);
          const criticalVulns = auditData.metadata?.vulnerabilities?.critical || 0;
          const highVulns = auditData.metadata?.vulnerabilities?.high || 0;
          if (criticalVulns > 0 || highVulns > 0) {
            this.violations.push({
              file: 'app/backend/package.json',
              line: 1,
              policy: 'package_vulnerability',
              rule: 'check_npm_audit',
              severity: 'critical',
              message: `NPM Audit detectou ${criticalVulns} vulnerabilidades críticas e ${highVulns} de alta severidade.`
            });
          }
        } catch (auditErr) {
          // npm audit retorna código de saída diferente de 0 se encontrar vulnerabilidades
          try {
            const stderrStr = (auditErr as any).stdout?.toString();
            if (stderrStr) {
              const auditData = JSON.parse(stderrStr);
              const criticalVulns = auditData.metadata?.vulnerabilities?.critical || 0;
              const highVulns = auditData.metadata?.vulnerabilities?.high || 0;
              if (criticalVulns > 0 || highVulns > 0) {
                this.violations.push({
                  file: 'app/backend/package.json',
                  line: 1,
                  policy: 'package_vulnerability',
                  rule: 'check_npm_audit',
                  severity: 'critical',
                  message: `NPM Audit detectou ${criticalVulns} vulnerabilidades críticas e ${highVulns} de alta severidade.`
                });
              }
            }
          } catch (parseErr) {
            // Ignora erro
          }
        }
      }
    } catch (err) {
      console.warn('[TPM] Não foi possível executar o npm audit. Pulando checagem.');
    }
  }

  // ==========================================
  // PROCESSAMENTO E EMISSÃO DE CERTIFICADOS
  // ==========================================

  private processResults() {
    console.log(`[TPM] Varredura finalizada. Encontrados ${this.violations.length} desvios.`);

    // Calcular o Trust Score
    let score = 100;
    this.violations.forEach(v => {
      const severityConfig = this.config.severities[v.severity];
      const weight = severityConfig ? severityConfig.weight : 40;
      score -= weight;
    });
    score = Math.max(0, score);

    console.log(`[TPM] Score Técnico de Confiança Geral: ${score}/100`);

    // Emitir Relatórios
    const reportMd = this.generateMarkdownReport(score);
    const reportJson = JSON.stringify({
      score,
      timestamp: new Date().toISOString(),
      project: this.config.project,
      violations: this.violations
    }, null, 2);

    fs.writeFileSync(path.join(this.projectRoot, 'tpm-report.md'), reportMd);
    fs.writeFileSync(path.join(this.projectRoot, 'tpm-report.json'), reportJson);

    // Determinar se falha o Build Gate
    let failBuild = false;
    this.violations.forEach(v => {
      const severityConfig = this.config.severities[v.severity];
      if (severityConfig && severityConfig.fail_build) {
        failBuild = true;
      }
    });

    if (score < 50) {
      failBuild = true;
    }

    if (!failBuild) {
      // Emitir Certificado de Confiança Assinado
      const certificate = this.generateSignedCertificate(score);
      fs.writeFileSync(path.join(this.projectRoot, 'tpm-certificate.json'), JSON.stringify(certificate, null, 2));
      console.log('[TPM] Certificado de Confiança Técnica gerado e assinado com sucesso!');
    }

    if (failBuild) {
      console.error('\x1b[31m[TPM] PORTÃO DE BUILD FALHOU: O código-fonte viola regras severas de segurança/arquitetura.\x1b[0m');
      process.exit(1);
    } else {
      console.log('\x1b[32m[TPM] PORTÃO DE BUILD APROVADO: Código em conformidade com as políticas do TPM.\x1b[0m');
      process.exit(0);
    }
  }

  private generateMarkdownReport(score: number): string {
    let md = `# Relatório de Conformidade Técnica — TPM (Trusted Cognitive Platform)\n\n`;
    md += `**Data/Hora**: ${new Date().toLocaleString()}\n`;
    md += `**Projeto**: ${this.config.project.name} (${this.config.project.classification})\n`;
    md += `**Score de Confiança Técnica**: **${score}/100**\n\n`;
    md += `## Resumo das Políticas Analisadas\n\n`;
    md += `| Política | Status | Descrição |\n`;
    md += `| :--- | :--- | :--- |\n`;

    Object.keys(this.config.policies).forEach(k => {
      const p = this.config.policies[k];
      const hasViol = this.violations.some(v => v.policy === k);
      md += `| ${k} | ${hasViol ? '❌ Desvio' : '✅ Conforme'} | ${p.description} |\n`;
    });

    md += `\n## Detalhamento de Violações e Desvios (${this.violations.length})\n\n`;
    if (this.violations.length === 0) {
      md += `*Nenhuma violação encontrada. Excelente qualidade de código!*\n`;
    } else {
      md += `| Arquivo | Linha | Severidade | Política | Regra | Descrição |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
      this.violations.forEach(v => {
        md += `| \`${v.file}\` | ${v.line} | **${v.severity.toUpperCase()}** | ${v.policy} | ${v.rule} | ${v.message} |\n`;
      });
    }

    return md;
  }

  private generateSignedCertificate(score: number) {
    const secret = process.env.JWT_SECRET || 'fallback_tpm_signature_key';
    const metadata = {
      project: this.config.project.name,
      criticality: this.config.project.criticality,
      score,
      timestamp: new Date().toISOString(),
      compliance: true
    };

    const serialized = JSON.stringify(metadata);
    const signature = crypto.createHmac('sha256', secret)
      .update(serialized)
      .digest('hex');

    return {
      metadata,
      signature,
      signature_algorithm: 'HMAC-SHA256'
    };
  }
}

const engine = new TpmEngine();
engine.run();
