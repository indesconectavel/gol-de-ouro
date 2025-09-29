#!/usr/bin/env node
const fs = require('fs');

function fail(msg){ console.error('❌', msg); process.exit(1); }
function ok(msg){ console.log('✅', msg); }

const dockerfile = 'Dockerfile';
const ignore = '.dockerignore';
const fly = 'fly.toml';
const vercel = 'goldeouro-admin/vercel.json';

if (!fs.existsSync(dockerfile)) fail('Dockerfile do backend não encontrado.');
const df = fs.readFileSync(dockerfile, 'utf8');
if (/\bCOPY\s+\.\s+\.\b/i.test(df)) fail('Dockerfile contém "COPY . ." — proibido. Use COPY explícito.');

if (!fs.existsSync(ignore)) fail('.dockerignore do backend não encontrado.');
const ig = fs.readFileSync(ignore, 'utf8');
if (!ig.includes('**')) fail('.dockerignore não está em modo whitelist ("**").');

if (!fs.existsSync(fly)) fail('fly.toml do backend não encontrado.');
const ft = fs.readFileSync(fly, 'utf8');
if (!/ignorefile\s*=\s*".dockerignore"/.test(ft)) fail('fly.toml sem build.ignorefile=".dockerignore".');

if (!fs.existsSync(vercel)) fail('vercel.json do Admin não encontrado.');
const vz = fs.readFileSync(vercel, 'utf8');
if (!/\"routes\"/.test(vz)) fail('vercel.json sem SPA fallback (rota catch-all).');

ok('Guard pre-commit passou ✅');
