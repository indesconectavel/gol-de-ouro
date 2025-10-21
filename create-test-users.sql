-- Script para criar usuário de teste
INSERT INTO usuarios (email, nome, senha_hash, saldo, tipo, ativo) VALUES
('test@goldeouro.lol', 'Usuário Teste', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', 100.00, 'jogador', true),
('admin@goldeouro.lol', 'Admin Teste', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', 1000.00, 'admin', true)
ON CONFLICT (email) DO NOTHING;
