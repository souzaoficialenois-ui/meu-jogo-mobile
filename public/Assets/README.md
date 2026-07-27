# Repositório de Recursos Locais (Assets) do Jogo

Este diretório contém os recursos (Gifs, Imagens, Áudios) que o jogo carrega localmente. Ao colocar seus arquivos aqui, o jogo funcionará **100% offline**, com carregamento **ultra-rápido** e sem custos de nuvem ou limitações do GitHub!

---

## Como fazer o Upload dos Recursos:

Você pode fazer upload de suas pastas de recursos diretamente pelo painel do editor do AI Studio (arrastando e soltando na pasta correspondente) ou importando-os pelo chat.

Mantenha a seguinte estrutura para que a tradução automática de links funcione corretamente:

### 1. Pasta Geral de Recursos (`/public/Assets/`)
Seus arquivos que antes estavam em `souzaoficialenois-ui/assetes_projeto` devem ser colocados diretamente dentro de `/public/Assets/`.
Exemplos:
* **Antes**: `https://raw.githubusercontent.com/souzaoficialenois-ui/assetes_projeto/b53ba3b4a6bbc2ba2c573f08820a5d07e43c19f3/AURA/1.gif`
* **Agora (Local)**: `/public/Assets/aura/1.gif` (o jogo resolverá como `/Assets/aura/1.gif` automaticamente)

Pastas esperadas aqui dentro:
* `/public/Assets/PERSONAGENS/` (todas as animações e GIFs dos personagens)
* `/public/Assets/aura/` (as auras dos lutadores)
* `/public/Assets/efeitos/` (explosões, beams, faíscas de golpes)
* `/public/Assets/SONS/` (músicas de batalha e trilhas sonoras)

### 2. Pasta de Arquivos Secundários (`/public/Assets/Arquivos/`)
Seus arquivos que antes estavam no repositório `souzaoficialenois-ui/Arquivos-` devem ser colocados em `/public/Assets/Arquivos/`.
Exemplos:
* **Antes**: `https://raw.githubusercontent.com/souzaoficialenois-ui/Arquivos-/refs/heads/main/Idle.png`
* **Agora (Local)**: `/public/Assets/Arquivos/Idle.png`

---

## Benefícios desta Migração:
1. **Performance Absoluta**: Sem atraso de rede (lag) para carregar os frames dos GIFs durante as batalhas intensas.
2. **Estabilidade de FPS**: Carregamento instantâneo via cache local, eliminando micro-travamentos na primeira aparição de um golpe.
3. **PWA Completo**: O jogo agora pode ser instalado no celular (Android/iOS) e jogado sem internet, pois o Service Worker irá cachear os arquivos estáticos locais automaticamente!
4. **Custo Zero**: Não há necessidade de pagar pelo Firebase Storage ou se preocupar com limites de tráfego de rede!
