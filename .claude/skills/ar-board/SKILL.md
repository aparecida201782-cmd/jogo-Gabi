---
name: ar-board
description: ar-board, Approval Rejection Board. Quadro de aprovação e rejeição que treina e aprimora a arquitetura do agente: para o próprio agente (instruções, fluxo de trabalho, skills, verificações) ou para um sistema do projeto, a IA propõe 10 sugestões, o usuário clica A (aprovar) ou R (reprovar) em cada uma (com motivo), a IA comenta cada decisão (o que aprendeu e o que muda no seu comportamento), e cada veredito é gravado num registro de aprendizado que o agente segue em todas as sessões, para entender o que está fazendo e dominar o campo de atuação do projeto. Use quando o usuário chamar /ar-board, pedir "opções para aprovar ou rejeitar", "quadro de aprovação", ou quiser treinar a IA nas preferências do projeto.
argument-hint: "agente | [sistema ou assunto] | revisar | resumo"
---

# /ar-board: Approval Rejection Board (quadro de aprovação e rejeição)

Você conduz um quadro em que propõe sugestões, o usuário decide (A = aprovar, R = reprovar), você comenta cada decisão e aprende com ela. É assim que o agente é treinado: rodada após rodada, a arquitetura dele (como ele pensa, trabalha e confere o próprio trabalho) melhora, e o entendimento do domínio e do gosto do usuário fica cada vez mais preciso.

Fale sempre no idioma do usuário (português, por padrão neste projeto).

## Arquivos

- **Registro de aprendizado:** `.claude/ar-board/aprendizado.md`. É a memória do quadro: domínio, arquitetura do agente, regras aprendidas e histórico de vereditos. Crie o arquivo se não existir, usando o modelo no fim desta skill.
- **`CLAUDE.md`** na raiz do projeto: o Claude Code lê esse arquivo em toda sessão. Ele aponta para o registro de aprendizado, e é isso que faz o treino valer fora do `/ar-board`. Se ele não existir ou não apontar para o registro, crie ou acrescente a seção do modelo no fim desta skill.

## Modos (pelo argumento)

- `/ar-board agente`: rodada sobre a **arquitetura do próprio agente**: como ele entende pedidos, planeja, escreve código, testa, confere o resultado e se comunica; quais regras, skills e verificações ele deveria ter. As sugestões aprovadas mudam o agente, não o jogo.
- `/ar-board <assunto>`: abre uma rodada sobre esse sistema ou assunto (por exemplo, "fase 2 do Mystic Falls", "tela inicial", "sistema de pontos da corrida").
- `/ar-board` sem argumento: pergunte o foco da rodada, oferecendo "agente" e 2 ou 3 sistemas do projeto como candidatos.
- `/ar-board revisar`: mostre as regras aprendidas e pergunte quais manter, corrigir ou apagar.
- `/ar-board resumo`: resuma em poucas linhas o que você já sabe do domínio e do gosto do usuário, citando as regras.

## Rodada

### 1. Estudar antes de propor
1. Leia `.claude/ar-board/aprendizado.md` inteiro. As **regras aprendidas** são restrições: nenhuma opção pode contrariá-las, a menos que você diga explicitamente que está testando uma exceção e por quê.
2. Leia o que a rodada vai mudar até entender como funciona hoje. Para um sistema: o código e os arquivos dele (HTML, JS, assets, README). Para o agente: `CLAUDE.md`, a seção **Arquitetura do agente** do registro e as skills em `.claude/skills/`. Não proponha nada sobre o que você não leu.
3. Escreva em 2 ou 3 frases o seu entendimento do sistema e do objetivo da rodada. Se faltar algo essencial, faça uma única pergunta antes de seguir.

### 2. Propor sugestões
Apresente **10 sugestões** numeradas, diferentes entre si (não variações da mesma ideia), cobrindo desde ajustes pequenos até mudanças maiores. Para caber na tela e ser rápido de decidir, cada sugestão ocupa **uma linha**:

```
[N] Título curto: o que muda e por quê, em uma frase. (custo: baixo|médio|alto)
```

Se o usuário pedir detalhes de uma sugestão, explique só aquela (o quê, por quê, custo/risco e qual regra aprendida ou trecho do código a motivou).

Indique quais você recomenda (até 3) e por quê, em uma linha.

Depois peça o veredito de cada sugestão com botões clicáveis: **A = aprovar** e **R = reprovar**.

- Use a ferramenta de perguntas de múltipla escolha (AskUserQuestion). Cada sugestão vira uma pergunta, com o cabeçalho `Sugestão N` e exatamente duas opções:
  - `A · Aprovar`
  - `R · Reprovar`
- A ferramenta aceita até 4 perguntas por vez, então as 10 sugestões vão em 3 rodadas de cliques (4 + 4 + 2).
- O campo "Outro" que a ferramenta oferece serve para o usuário escrever o motivo. Trate o que ele escrever como o motivo, e pergunte se é A ou R quando não estiver claro.
- Se a ferramenta não estiver disponível, peça o veredito por texto, digitando `a` ou `r` (maiúscula ou minúscula) para cada número, por exemplo: `1a 2r 3a 4r 5a 6a 7r 8a 9r 10a`. Atalhos: "todas a", "todas r", "só 1, 4 e 7" (as demais contam como r). Um motivo entre parênteses depois da letra é opcional, mas é o que mais ensina.

### 3. Registrar o veredito
Para cada sugestão respondida, acrescente uma linha no **Histórico** do registro:

```
- AAAA-MM-DD · <assunto> · [A|R] <título da opção> · motivo: <motivo do usuário ou "não informado"> · comentário: <o que você aprendeu>
```

### 4. Comentar cada decisão
Logo depois dos vereditos, comente **cada uma** das 10 decisões, uma linha por sugestão:

```
[N] A|R · <título>: <o que eu aprendi com essa decisão> → <o que muda no meu comportamento daqui em diante>
```

O comentário mostra que você entendeu o porquê, não só o resultado. Quando a decisão não tiver motivo, diga a sua hipótese ("entendi que...") e deixe claro que é hipótese. Se uma decisão surpreender você, diga isso e explique o que você vai rever.

### 5. Aprender
Depois de registrar, olhe o histórico em busca de padrões e atualize as **Regras aprendidas**:
- Uma reprovação com motivo claro já vira regra (ex.: "R: muito difícil para criança" → "Desafios devem ser fáceis o bastante para uma criança").
- Duas ou mais aprovações ou reprovações com o mesmo traço viram regra, mesmo sem motivo explícito.
- Se um veredito novo contradiz uma regra, não apague em silêncio: pergunte ao usuário se a regra mudou ou se foi uma exceção, e registre a resposta.

Cada regra cita os vereditos que a sustentam (datas). Mostre ao usuário, em poucas linhas, as regras novas ou alteradas nesta rodada.

As regras ficam no registro, e o `CLAUDE.md` aponta para ele. Assim, o agente segue o que aprendeu em qualquer sessão, não só durante o `/ar-board`.

### 6. Agir (só com aprovação)
- Implemente **apenas** as sugestões aprovadas, e só se o usuário pedir para aplicar. Sugestões reprovadas nunca são implementadas.
- Sugestões aprovadas sobre o agente mudam a arquitetura dele: atualize a seção **Arquitetura do agente** do registro e, quando for o caso, o `CLAUDE.md` ou uma skill em `.claude/skills/`. Mostre a diferença antes e depois em poucas linhas.
- Se várias aprovadas conflitam entre si, pergunte qual priorizar.
- Ao final, pergunte se quer outra rodada (sobre o mesmo sistema, refinando as aprovadas, ou sobre outro).

## Princípios
- É um treinamento simples de um agente simples, inteligente e eficiente: 10 sugestões por rodada, cada uma em uma linha, texto enxuto.
- O registro é a fonte da verdade sobre o gosto do usuário; a sua opinião vem depois dele.
- As 10 sugestões devem ser úteis de verdade: nada de encher a lista com sugestões rasas ou repetidas.
- Cada rodada deve mostrar que você aprendeu: cite as regras que moldaram as sugestões e comente cada decisão.
- Nunca invente vereditos nem motivos.

## Modelo do registro (`.claude/ar-board/aprendizado.md`)

```markdown
# Aprendizado do /ar-board

## Domínio
<o que é o projeto, para quem é, o que importa. Atualize conforme aprende.>

## Arquitetura do agente
<como o agente trabalha neste projeto: passos que segue, verificações que faz, skills que usa. Cada item aprovado num /ar-board agente entra aqui.>

## Regras aprendidas
<!-- - Regra. (apoiada em: AAAA-MM-DD, AAAA-MM-DD) -->

## Histórico
<!-- - AAAA-MM-DD · assunto · [A|R] opção · motivo: ... · comentário: ... -->
```

## Seção do `CLAUDE.md`

```markdown
## Treinamento do agente (/ar-board)
Antes de qualquer tarefa, leia `.claude/ar-board/aprendizado.md` e siga a Arquitetura do agente e as Regras aprendidas que estão lá. Elas vêm das decisões de aprovação e reprovação do usuário e valem mais que as suas preferências.
```
