# GoLedger Challenge — Catálogo de Séries de TV

Aplicação web de catálogo de séries construída sobre uma API Hyperledger Fabric. Permite criar, editar e excluir séries, temporadas, episódios e watchlists, com histórico imutável de cada alteração registrado na blockchain.

## Stack

- **Framework:** Vite + TanStack Router (roteamento por arquivo, tipagem completa)
- **UI:** shadcn/ui + Tailwind CSS (paleta customizada)
- **Data fetching:** TanStack Query + Axios (interceptor de Basic Auth)
- **Formulários:** React Hook Form + Zod
- **Estado global:** Zustand (cache de imagens com persistência)
- **Imagens:** TMDB API
- **Testes:** Vitest + React Testing Library
- **CI/CD:** GitHub Actions → AWS Elastic Beanstalk

## Como rodar

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```
VITE_API_BASE_URL=<url da api>
VITE_TMDB_API_KEY=<sua chave tmdb>
```

A chave do TMDB é gratuita e pode ser obtida em [themoviedb.org](https://www.themoviedb.org/settings/api). Sem ela a aplicação funciona normalmente, com gradientes determinísticos no lugar dos posters.

Há uma versão publicada disponível em [goledger-tv.us-east-1.elasticbeanstalk.com](http://goledger-tv.us-east-1.elasticbeanstalk.com) com todas as variáveis configuradas, para facilitar a avaliação sem precisar rodar localmente.

```bash
pnpm install
pnpm dev
```

## Estratégia de Git

Desenvolvimento trunk-based com branches curtas `feat/` e `chore/` a partir do `master`, integradas via PR. O `master` é sempre deployável.

## Decisões de arquitetura

### Paleta de cores

A API expõe um endpoint `getHeader` com três valores de cor da marca: primário (`#4267B2`), secundário (`#34495E`) e fundo (`#ECF0F1`). Considerei buscar essas cores em runtime no login e aplicá-las dinamicamente, mas isso criaria um dilema: a página de login precisaria das cores antes de qualquer autenticação existir.

Decidi expandir as três cores offline com o [Radix UI Color Generator](https://www.radix-ui.com/colors/custom), gerando escalas completas de azul e cinza. A seguir, mapeei cada passo da escala para as variáveis semânticas do shadcn/ui com base em luminância e papel funcional: `gray-1` como fundo, `gray-2` como superfície de card, `blue-9` como cor primária, `blue-3` como fundo de accent no modo escuro, e assim por diante. As cores de gráfico (`--chart-1` a `--chart-5`) foram distribuídas ao longo do eixo de luminância do azul para maximizar a diferenciação visual. Usei o espaço de cor OKLCH por ser o formato nativo do Tailwind v4.

A aplicação foi desenvolvida e refinada com foco no modo escuro. O modo claro funciona corretamente, mas o resultado visual mais trabalhado está no tema escuro.

### Por que Vite + TanStack Router em vez de Next.js

A aplicação é um SPA puro. Next.js é um framework de servidor completo, com SSR, server components, API routes e uma camada de build considerável. Nada disso era necessário aqui. Usar Next.js seria carregar infraestrutura que ficaria ociosa, em troca de uma curva de configuração maior e um dev server mais lento.

Com Vite, o tempo de inicialização e o HMR são ordens de grandeza mais rápidos. O TanStack Router complementa bem porque oferece tipagem de ponta a ponta para parâmetros de rota e search params, com guards de `beforeLoad` que rodam antes da renderização. Para um projeto onde o estado da navegação é central, essa combinação foi a mais produtiva.

### Estratégia de autenticação

A API usa HTTP Basic Auth. Armazenei as credenciais em cookie via `js-cookie` em vez de `localStorage` porque cookies sobrevivem ao refresh da página e podem ser tornados `HttpOnly` em produção sem nenhuma mudança no cliente.

Criei duas camadas de acesso às credenciais. A primeira é `lib/auth.ts`, com funções puras que leem e limpam o cookie fora do contexto React, usadas nos guards de `beforeLoad` do TanStack Router. A segunda é o hook `useAuth`, que encapsula logout com invalidação de cache e redirecionamento.

O interceptor do Axios lê o cookie em cada requisição e injeta o header `Authorization`. Na resposta, um segundo interceptor captura status `401`, limpa o cookie e redireciona para `/login`. Erros de rede disparam um toast genérico.

Para validar as credenciais antes de armazená-las, o formulário de login usa o endpoint `GET /query/getHeader` como probe de autenticação. A chamada é feita com raw Axios fora do cliente configurado, para que os interceptors globais não interfiram no fluxo de login. Se a resposta for bem-sucedida, as credenciais são gravadas no cookie e o usuário é redirecionado. Se der 401, o hook expõe `isError` e o formulário exibe a mensagem de erro sem disparar toasts globais.

Em produção, a solução seria diferente: um BFF configuraria o cookie como `HttpOnly` para eliminar a exposição ao JavaScript, e o fluxo de autenticação incluiria refresh tokens para evitar que o usuário precise fazer login novamente a cada expiração de sessão.

### Sem geração de código (Orval)

Considerei usar Orval para gerar tipos e hooks a partir do schema da API. Decidi contra por dois motivos. O schema usa discriminadores `@assetType` e chaves compostas que não mapeiam diretamente para OpenAPI convencional, então a geração produziria tipos que precisariam de ajuste manual de qualquer forma. Além disso, o número de assets é pequeno e os tipos são estáveis. Escrever os tipos à mão me deu controle preciso sobre campos opcionais, referências entre assets e os formatos de chave composta que o backend espera.

### Modais CRUD responsivos (Credenza)

Usei o componente [Credenza](https://github.com/redpangilinan/credenza) como wrapper responsivo: `Dialog` no desktop e `Sheet` no mobile, a partir do mesmo componente e trigger. Isso evita duplicar lógica de formulário para cada breakpoint e mantém a UX de mobile nativa, onde sheets deslizando de baixo é o padrão esperado em dispositivos touch.

### Sem Zustand para estado de autenticação

A API não tem perfil de usuário. As credenciais vivem no cookie, que já é a fonte da verdade. Um store Zustand espelharia o cookie sem nenhum benefício real e criaria risco de divergência entre o estado em memória e o que o Axios envia. Zustand está presente apenas no cache de imagens do TMDB, onde a persistência entre sessões tem valor concreto.

### Cache de imagens via Zustand persist

O Zustand armazena três tipos de dado do TMDB, cada um com estratégia diferente.

Para posters de séries, a busca é direta: pesquiso o título no TMDB, obtenho o `poster_path` e armazeno pelo título normalizado. Em todos os casos, `null` significa "já consultei, não há resultado", o que evita requisições repetidas para séries sem imagem.

Para thumbnails de episódios, o processo tem duas etapas. Primeiro busco o ID numérico da série no TMDB e armazeno separadamente em `seriesIds`. Com esse ID, consulto o endpoint de episódio específico para obter o `still_path`. A separação existe porque o ID da série é compartilhado entre todos os episódios dela, e armazená-lo em cache evita uma nova busca a cada episódio carregado. A chave de cache do thumbnail é composta: `showTitle::sNeMM`, incluindo temporada e número do episódio.

Todo o cache é persistido no `localStorage` via middleware do Zustand, então as imagens já buscadas sobrevivem entre sessões.

### Painel de histórico blockchain

Cada episódio tem uma página de detalhe com um painel colapsável que exibe o histórico completo de transações via `POST /query/readAssetHistory`. Cada entrada mostra o timestamp, o tipo de operação e um snapshot dos dados naquele momento. É o diferencial mais direto de uma aplicação construída sobre blockchain em vez de um banco de dados convencional.

### Paginação por cursor (CouchDB bookmark)

A API usa paginação estilo CouchDB com `bookmark`. Implementei com `useInfiniteQuery` do TanStack Query, onde `getNextPageParam` extrai o bookmark da última página recebida e o passa como `pageParam` para a próxima requisição. Paginação por offset não faria sentido aqui porque não há contagem estável de registros: a blockchain só avança.

### Padrão create-delete para mudanças de chave

O título de uma série é sua chave de identidade na blockchain. Renomear não é um `updateAsset` simples. É necessário criar o novo asset, migrar todas as temporadas e episódios filhos para referenciar a nova chave, atualizar as watchlists que continham a série e então deletar os assets antigos em ordem reversa.

Encapsulei essa lógica em `lib/showCascade.ts`, separado do hook `useShows`. O módulo exporta tanto a função de execução quanto a de planejamento (`buildShowCascadePlan` e `buildShowRenamePlan`), para que a UI possa exibir o progresso de cada tarefa antes e durante a execução. O mesmo padrão se aplica a mudanças de número de episódio, que também fazem parte da chave composta.

## Ferramentas de IA

Este projeto foi desenvolvido usando IA de forma deliberada em cada fase, não como autocomplete, mas como ferramenta de planejamento e revisão. O custo total em créditos foi de aproximadamente 40 dólares.

**Planejamento:** Usei o skill [grill-me](https://github.com/mattpocock/skills/tree/main/grill-me), que conduz dezenas de perguntas estruturadas sobre o projeto para tornar explícitas decisões que normalmente ficam implícitas. Respondi perguntas sobre interface, arquitetura, autenticação, estratégia de estado, testes e deploy.

**PRD:** Com esse contexto, usei [write-a-prd](https://github.com/mattpocock/skills/tree/main/write-a-prd) para gerar um documento de requisitos completo, publicado como [issue #1](https://github.com/gabeknob/goledger-challenge-web/issues/1) para servir de referência durante a implementação.

**Issues:** Usei [prd-to-issues](https://github.com/mattpocock/skills/tree/main/prd-to-issues) para converter o PRD em slices verticais com critérios de aceitação concretos. Cada issue virou uma unidade de trabalho com escopo claro.

**Implementação:** Usei o Codex da OpenAI para implementar as features com base nos requisitos bem definidos que havia desenvolvido. A qualidade do output foi diretamente proporcional à qualidade do planejamento anterior.

**Revisão arquitetural:** Finalizei com Claude Code usando o skill [improve-codebase-architecture](https://github.com/mattpocock/skills/tree/main/improve-codebase-architecture), que explorou o código como colaborador externo, identificou pontos de atrito e propôs melhorias de modularização, incluindo a extração da lógica de cascade para `lib/showCascade.ts` e a separação entre arquivos de rota e componentes de página.

## Compromissos e notas de produção

Credenciais armazenadas em cookie client-side. Em produção isso seria um `HttpOnly` cookie configurado por um BFF, nunca exposto ao JavaScript.

A chave do TMDB está em `VITE_TMDB_API_KEY`, acessível no bundle client-side. Em produção as consultas ao TMDB seriam feitas via proxy server-side para não expor a chave.

## Deploy

A aplicação roda em um contêiner Docker servido pelo nginx numa instância EC2 single-instance no AWS Elastic Beanstalk (`us-east-1`). O processo é totalmente automatizado via GitHub Actions.

### Pipeline CI/CD

Todo push para `master` dispara o workflow `.github/workflows/deploy.yml`, que executa três etapas em sequência:

1. **Build e push da imagem** — o runner ARM64 (`ubuntu-24.04-arm`) constrói a imagem Docker e faz push para `ghcr.io/gabeknob/goledger-tv:latest` usando o `GITHUB_TOKEN` do próprio repositório. Nenhuma credencial extra é necessária para o registry.

2. **Empacotamento** — o workflow gera um `Dockerrun.aws.json` apontando para a imagem recém-publicada e faz upload do arquivo zipado para o bucket S3 que o Elastic Beanstalk mantém automaticamente na conta.

3. **Deploy** — o workflow cria uma nova application version no EB com o SHA do commit como label e atualiza o ambiente. As variáveis de ambiente (`VITE_API_BASE_URL` e `VITE_TMDB_API_KEY`) são injetadas no ambiente do EB via `--option-settings` a cada deploy, lidas dos GitHub Secrets.

### Injeção de variáveis em runtime

A imagem Docker não carrega as variáveis de ambiente em tempo de build. Em vez disso, o `docker_entrypoint.sh` usa `sed` para substituir os placeholders `__VITE_*__` no arquivo `public/env-config.js` pelos valores reais das variáveis do contêiner antes de iniciar o nginx. Isso permite usar a mesma imagem em qualquer ambiente sem rebuild.
