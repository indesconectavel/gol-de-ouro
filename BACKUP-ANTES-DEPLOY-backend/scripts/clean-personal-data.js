#!/usr/bin/env node

/**
 * Script para limpar dados pessoais do desenvolvedor
 * Remove todas as referências a informações sensíveis
 */

const fs = require('fs')
const path = require('path')

const personalData = [
  'Frederico Santos e Silva',
  'frederico.santos',
  'Frederico Santos',
  'Santos e Silva'
]

const sensitivePatterns = [
  /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, // CPF
  /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g, // CNPJ
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g // Email
]

function cleanFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    
    // Remover dados pessoais
    personalData.forEach(data => {
      const regex = new RegExp(data, 'gi')
      if (content.match(regex)) {
        content = content.replace(regex, '[DEVELOPER]')
        modified = true
      }
    })
    
    // Mascarar padrões sensíveis
    sensitivePatterns.forEach(pattern => {
      if (content.match(pattern)) {
        content = content.replace(pattern, '[MASKED]')
        modified = true
      }
    })
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Limpo: ${filePath}`)
    }
  } catch (error) {
    console.log(`❌ Erro ao processar ${filePath}:`, error.message)
  }
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      scanDirectory(filePath)
    } else if (stat.isFile() && /\.(js|json|md|txt|env)$/.test(file)) {
      cleanFile(filePath)
    }
  })
}

console.log('🔒 Iniciando limpeza de dados pessoais...')
scanDirectory(process.cwd())
console.log('✅ Limpeza concluída!')
