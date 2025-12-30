// Setup para testes - Carregar variáveis de ambiente
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env do diretório raiz
dotenv.config({ path: resolve(__dirname, '../../.env') });

