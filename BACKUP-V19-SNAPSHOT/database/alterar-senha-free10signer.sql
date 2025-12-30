-- Alterar senha do usuário: free10signer@gmail.com
-- Execute este SQL no Supabase SQL Editor
-- Nova senha: Free10signer

UPDATE usuarios
SET senha_hash = '$2b$10$WFyA2yQB8NRw0MqUmirG2.qqqh.Ykw70l9McGRPYvDVN16gpleQRa',
    updated_at = NOW()
WHERE email = 'free10signer@gmail.com';

-- Verificar se foi atualizado
SELECT id, email, username, updated_at
FROM usuarios
WHERE email = 'free10signer@gmail.com';

