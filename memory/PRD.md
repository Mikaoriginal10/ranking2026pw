# PRD — Ranking de Vendas

## Original Problem
Ranking de vendedores (pt-BR), título tipo "Ranking de Outubro", espaço para logo grande, botão discreto no canto inferior direito só para o admin, foco em posição (1º, 2º, 3º...), números visíveis só ao admin. 49+ representantes, sem limite. Top 3 com foto grande vertical (quadro), luzes piscando atrás: 1º dourado, 2º azul, 3º branco. Depois os demais em sequência.

## User Choices
Senha simples de admin; upload de fotos/logo (Emergent Object Storage); posição manual (arrastar/setas/digitar); rankings por mês com escolha de qual exibir; link público multi-dispositivo com banco de dados (atualiza a cada 5s).

## Architecture
FastAPI + MongoDB (rankings, sellers, settings, files) + object storage; React + framer-motion + shadcn. JWT Bearer token admin (ADMIN_PASSWORD env).

## Implemented (2026-06)
- Página pública: logo, título com brilho, "ao vivo", pódio com molduras 3:5, lâmpadas tipo letreiro piscando, luz de fundo pulsante, lista 4º+ com animação de reordenação, seletor de meses
- Painel admin: adicionar/adicionar em massa/editar/excluir, reordenar, upload de foto, mostrar números (somente admin), criar/renomear/publicar/excluir rankings (copiar vendedores), upload de logo
- Testado: backend 100%, frontend 100%

## Backlog
- P1: Modo TV (tela cheia, rolagem automática da lista)
- P1: Efeito de celebração quando alguém sobe para o top 3
- P2: Trocar senha pelo painel; exportar ranking em imagem
