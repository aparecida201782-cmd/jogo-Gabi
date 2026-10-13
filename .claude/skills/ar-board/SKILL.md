---
name: ar-board
description: ar-board, Approval Rejection Board. Quadro de aprovação e rejeição: para um sistema, tela, mecânica ou decisão, a IA propõe opções numeradas, o usuário clica A (aprovar) ou R (reprovar) em cada uma (com motivo), e cada veredito é gravado num registro de aprendizado que a IA relê antes de propor de novo, para entender o que está fazendo e dominar o campo de atuação do projeto. Use quando o usuário chamar /ar-board, pedir "opções para aprovar ou rejeitar", "quadro de aprovação", ou quiser treinar a IA nas preferências do projeto.
argument-hint: "[sistema ou assunto] | revisar | resumo"
---

# /ar-board: Approval Rejection Board (quadro de aprovação e rejeição)

Você conduz um quadro em que propõe opções, o usuário decide (A = aprovar, R = reprovar) e você aprende com cada decisão. O objetivo não é só escolher uma opção agora: é acumular, rodada após rodada, um entendimento cada vez melhor do domínio e do gosto do usuário, para que as próximas propostas acertem mais.

Fale sempre no idioma do usuário (português, por padrão neste projeto).

## Arquivos

- **Registro de aprendizado:** `.claude/ar-board/aprendizado.md`. É a memória do quadro: regras aprendidas e histórico de vereditos. Crie o arquivo se não existir, usando o modelo no fim desta skill.

## Modos (pelo argumento)

- `/ar-board <assunto>`: abre uma rodada sobre esse sistema ou assunto (por exemplo, "fase 2 do Mystic Falls", "tela inicial", "sistema de pontos da corrida").
- `/ar-board` sem argumento: pergunte sobre qual sistema o usuário quer decidir, sugerindo 3 ou 4 candidatos a partir do código do projeto.
- `/ar-board revisar`: mostre as regras aprendidas e pergunte quais manter, corrigir ou apagar.
- `/ar-board resumo`: resuma em poucas linhas o que você já sabe do domínio e do gosto do usuário, citando as regras.

## Rodada

### 1. Estudar antes de propor
1. Leia `.claude/ar-board/aprendizado.md` inteiro. As **regras aprendidas** são restrições: nenhuma opção pode contrariá-las, a menos que você diga explicitamente que está testando uma exceção e por quê.
2. Leia o código e os arquivos do sistema em questão (HTML, JS, assets, README) até entender como ele funciona hoje. Não proponha nada sobre o que você não leu.
3. Escreva em 2 ou 3 frases o seu entendimento do sistema e do objetivo da rodada. Se faltar algo essencial, faça uma única pergunta antes de seguir.

### 2. Propor opções
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
Para cada opção respondida, acrescente uma linha no **Histórico** do registro:

```
- AAAA-MM-DD · <assunto> · [A|R] <título da opção> · motivo: <motivo do usuário ou "não informado">
```

### 4. Aprender
Depois de registrar, olhe o histórico em busca de padrões e atualize as **Regras aprendidas**:
- Uma reprovação com motivo claro já vira regra (ex.: "R: muito difícil para criança" → "Desafios devem ser fáceis o bastante para uma criança").
- Duas ou mais aprovações ou reprovações com o mesmo traço viram regra, mesmo sem motivo explícito.
- Se um veredito novo contradiz uma regra, não apague em silêncio: pergunte ao usuário se a regra mudou ou se foi uma exceção, e registre a resposta.

Cada regra cita os vereditos que a sustentam (datas). Mostre ao usuário, em poucas linhas, as regras novas ou alteradas nesta rodada.

### 5. Agir (só com aprovação)
- Implemente **apenas** as opções aprovadas, e só se o usuário pedir para aplicar. Sugestões reprovadas nunca são implementadas.
- Se várias aprovadas conflitam entre si, pergunte qual priorizar.
- Ao final, pergunte se quer outra rodada (sobre o mesmo sistema, refinando as aprovadas, ou sobre outro).

## Princípios
- É um treinamento simples de um agente simples, inteligente e eficiente: 10 sugestões por rodada, cada uma em uma linha, texto enxuto.
- O registro é a fonte da verdade sobre o gosto do usuário; a sua opinião vem depois dele.
- As 10 sugestões devem ser úteis de verdade: nada de encher a lista com sugestões rasas ou repetidas.
- Cada rodada deve mostrar que você aprendeu: cite as regras que moldaram as opções.
- Nunca invente vereditos nem motivos.

## Modelo do registro (`.claude/ar-board/aprendizado.md`)

```markdown
# Aprendizado do /ar-board

## Domínio
<o que é o projeto, para quem é, o que importa. Atualize conforme aprende.>

## Regras aprendidas
<!-- - Regra. (apoiada em: AAAA-MM-DD, AAAA-MM-DD) -->

## Histórico
<!-- - AAAA-MM-DD · assunto · [A|R] opção · motivo: ... -->
```
