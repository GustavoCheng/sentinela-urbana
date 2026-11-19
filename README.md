# Sentinela Urbana

Protótipo funcional da **Urban Risk Intelligence Platform**, entrega de Engenharia de Software da Global Solution 2026.2 (FIAP).

A plataforma reúne dados de sensores, bases públicas e relatos de moradores para priorizar alertas de alagamento, calor extremo e interrupção de energia, água e transporte. Cada alerta mostra a origem do dado e o nível de confiança.

> Todos os dados são fictícios. Nenhum valor vem de sensor ou órgão real.

**Protótipo publicado:** https://gustavocheng.github.io/sentinela-urbana/

**Vídeo de demonstração:** https://youtu.be/VZkJ3DwFP4k

## Integrantes

Turma: 3ECA

| Nome completo | RM |
| --- | --- |
| Agatha Cassari Benedicto | 556251 |
| Gustavo Shinn Shyong Cheng | 559084 |
| Sara Barbosa da Silva | 559042 |

## Como executar

Pré-requisito: Node.js 22 ou superior (testado com a versão 24).

```bash
npm install
npm run dev
```

Abra `http://localhost:5173` no navegador. O mapa usa o OpenStreetMap e precisa de internet.

Para gerar a versão de publicação:

```bash
npm run build
```

O resultado fica na pasta `dist` e pode ser hospedado em qualquer serviço de arquivos estáticos (Vercel, Netlify ou GitHub Pages). Na Vercel, importe o repositório, mantenha o comando `npm run build` e a pasta de saída `dist`.

## Perfis de demonstração

O acesso não pede senha. Escolha um perfil na tela inicial.

| Perfil | Persona | O que faz |
| --- | --- | --- |
| Morador | Marina Souza | Acompanha alertas, recebe notificações e registra ocorrências |
| Agente da Defesa Civil | Carlos Mendes | Valida ocorrências, acompanha fontes e indicadores |
| Operador de serviço público | Renata Lima | Valida e encerra interrupções de energia, água e transporte |

O botão **Reiniciar dados**, na tela de acesso, devolve a demonstração ao estado inicial. Use antes de gravar o vídeo.

## Telas e requisitos

| Nº | Tela | Rota | Requisitos |
| --- | --- | --- | --- |
| 1 | Acesso | `/` | RF18 |
| 2 | Painel | `/painel` | RF07 |
| 3 | Alertas | `/alertas` | RF06, RF08 |
| 4 | Detalhe do alerta | `/alertas/:id` | RF06, RF09 |
| 5 | Origem e confiança | `/alertas/:id/origem` | RF04, RF05, RF10 |
| 6 | Notificações | `/notificacoes` | RF11, RF12 |
| 7 | Registrar ocorrência | `/registrar` | RF03 |
| 8 | Minhas ocorrências | `/ocorrencias` | RF13 |
| 9 | Fila de validação | `/validacao` | RF14 |
| 10 | Fontes de dados | `/fontes` | RF01, RF02, RF15 |
| 11 | Análises | `/analises` | RF16 |
| 12 | Preferências | `/preferencias` | RF17 |
| 13 | Privacidade | `/privacidade` | RF19 |

As telas 7 e 8 são do morador. As telas 9, 10 e 11 são do agente e do operador.

## Fluxos de ponta a ponta

1. **Consulta de alerta (morador).** Acesso, Painel, Alertas, Detalhe do alerta, Origem e confiança.
2. **Registro comunitário.** Como Marina, registre uma ocorrência e veja o estado em Minhas ocorrências. Saia, entre como Carlos, confirme o evento na Fila de validação. Volte como Marina e veja o aviso em Notificações.
3. **Leitura de sensor (agente).** Em Fontes de dados, envie uma leitura simulada. A tela mostra cada etapa: ingestão, validação, classificação de risco e notificação.

## Regras de negócio no código

| Arquivo | Conteúdo |
| --- | --- |
| `src/domain/regras.js` | Confiança do dado (RN01), severidade (RN02), exposição e nível de risco (RN03 e RN04), prioridade (RN05), canais (RN07) e destinatários (RN08) |
| `src/domain/pipeline.js` | Fluxo do Diagrama de Sequência e transições do Diagrama de Estados: receber dado, agrupar, validar, confirmar, classificar, notificar, encerrar e descartar |
| `src/domain/fontes.js` | Atualização simulada das fontes, conforme o intervalo esperado |
| `src/data/seed.js` | Bairros, fontes, usuários e eventos fictícios |
| `src/store.jsx` | Estado do protótipo, guardado no navegador |

## Estrutura

```
src/
  domain/      regras de negócio e fluxo de eventos
  data/        dados fictícios
  components/  layout, mapa e componentes visuais
  pages/       as 13 telas
  store.jsx    estado e ações
  styles.css   sistema visual
```

## Limites do protótipo

- Não há servidor. As camadas de aplicação e de dados da arquitetura são simuladas no navegador.
- O estado fica no `localStorage` e volta ao início depois de 6 horas ou pelo botão Reiniciar dados.
- Push e SMS são simulados: o aviso aparece na central de notificações com o canal que seria usado.
- A foto do registro comunitário não é enviada a lugar algum, só o nome do arquivo é exibido.

## Tecnologias

React 19, Vite 8, React Router 7, Leaflet com React Leaflet e ícones Lucide.
