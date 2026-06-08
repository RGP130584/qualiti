-- Script de Migração DDL: Criação da Tabela de Logs de Auditoria (auditoria_logs)
-- Contexto: IAM / Auditoria (LGPD e Event Sourcing)

CREATE TABLE IF NOT EXISTS auditoria_logs (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(255) NOT NULL,
    acao VARCHAR(255) NOT NULL,
    entidade VARCHAR(100) NOT NULL,
    entidade_id VARCHAR(50),
    ip VARCHAR(50) DEFAULT '127.0.0.1',
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices recomendados para otimização de consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_auditoria_logs_usuario ON auditoria_logs(usuario);
CREATE INDEX IF NOT EXISTS idx_auditoria_logs_data_hora ON auditoria_logs(data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_logs_entidade ON auditoria_logs(entidade);
