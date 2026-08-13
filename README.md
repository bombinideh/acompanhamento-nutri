# Acompanhamento Nutri

Web app para a paciente registrar hábitos alimentares e de rotina, e a nutricionista acompanhar isso **ao vivo**, no próprio sistema.

Substitui a planilha Excel. Não há exportação para Excel: a fonte da verdade é o sistema.

## Propósito

A paciente preenchia uma planilha semanal (5 refeições, sono, água, academia, álcool e 3 perguntas sobre a semana) e enviava o arquivo. Isso era trabalhoso e a nutri só via os dados depois.

Este projeto existe para:

1. A **paciente** marcar o dia pelo celular ou computador, com botões grandes (Fiz / Não, sono, água, etc.).
2. A **nutricionista** entrar com a conta dela e ver a tabela da semana atualizar sozinha.
3. Cada uma gerenciar o próprio nome, e-mail e senha.
4. A nutri escolher **qual paciente** está vendo, se tiver mais de uma.

Cadastro de usuários **não** aparece na tela. É feito via API (Postman). A tela inicial é só login (e-mail + senha).

## Papéis

| Papel | Rota principal | O que faz |
| --- | --- | --- |
| `paciente` | `/` | Preenche hábitos da semana. Autosave. |
| `nutri` | `/nutri` | Vê o quadro ao vivo, lista as pacientes e escolhe quem está acompanhando. |

As duas acessam `/conta` para alterar nome, e-mail e senha, e `/login` para entrar.

Redirecionamento: paciente não entra em `/nutri`; nutri que acessa `/` cai em `/nutri`. Isso está em `middleware.ts`.

## Stack

- **Front:** Next.js 16 (App Router) + React + CSS próprio
- **Back:** rotas Node em `app/api`
- **Banco:** PostgreSQL (Docker local; Neon ou outro Postgres na Cloudflare)
- **ORM:** Prisma (adapter `pg`, para rodar nos Workers)
- **Auth:** cookie JWT (`jose`), senha com `bcryptjs`
- **Deploy:** Cloudflare Workers (OpenNext)

## Modelo de dados

`prisma/schema.prisma`

- **User:** `name`, `email` (único), `passwordHash`, `role` (`paciente` \| `nutri`), `nutriId` (paciente ligada à nutricionista).
- **Week:** hábitos de **uma paciente** em **uma semana** (`patientId` + `weekStart` segunda-feira `YYYY-MM-DD`). O conteúdo fica em `payload` JSON (dias, refeições, sono, H2O, academia, álcool, perguntas da semana e recado da nutri).

## Telas e arquivos importantes

| Caminho | Função |
| --- | --- |
| `app/login/page.tsx` | Login split: foto `public/login.png` à esquerda, formulário à direita. Sem Google e sem recuperar senha. Olhinho na senha. |
| `components/HabitosForm.tsx` | Formulário diário da paciente. |
| `components/NutriDashboard.tsx` | Tabela ao vivo da nutri (polling ~2,5s). Lista de pacientes + “vendo agora”. |
| `components/ContaForm.tsx` | Edição de nome, e-mail e senha. |
| `components/PasswordField.tsx` | Campo de senha com mostrar/ocultar. |
| `lib/week.ts` | Estrutura da semana, dias e refeições. |
| `lib/auth.ts` | Cookie de sessão e papéis. |
| `middleware.ts` | Protege rotas e redireciona por papel. |
| `app/globals.css` | Estilo geral + login (tela sem scroll, imagem em `object-fit: contain`). |

Hábitos registrados (por dia):

- Refeições 1–5: Café, lanche da manhã, almoço, lanche da tarde, jantar (`Fiz` / `Não` + observação opcional)
- Sono (horas), água (litros), academia, álcool
- Perguntas da semana: eventos, ansiedade, acontecimentos

## APIs

| Método | Rota | Quem | Função |
| --- | --- | --- | --- |
| POST | `/api/login` | público | Login (e-mail + senha). |
| POST | `/api/logout` | logada | Sai. |
| POST | `/api/users` | `x-api-key` = `AUTH_SECRET` | Cria usuário (Postman). |
| GET/PATCH | `/api/me` | logada | Lê / atualiza a própria conta. |
| GET | `/api/pacientes` | nutri | Lista as pacientes dela. |
| GET/POST | `/api/semana` | logada | Paciente lê/salva a própria semana. Nutri lê com `?pacienteId=`. |
| PATCH | `/api/semana` | nutri | Salva o recado da semana (`comentarioNutri`). |

### Cadastrar no Postman

Cadastre a **nutri primeiro**, depois a paciente.

`POST http://localhost:3000/api/users`

Headers: `Content-Type: application/json` e `x-api-key` = valor de `AUTH_SECRET` no `.env`.

Nutri:

```json
{
  "name": "Nutricionista",
  "email": "nutri@email.com",
  "password": "troque-esta-senha",
  "role": "nutri"
}
```

Paciente:

```json
{
  "name": "Paciente",
  "email": "paciente@email.com",
  "password": "troque-esta-senha",
  "role": "paciente",
  "nutriEmail": "nutri@email.com"
}
```

## Rodar localmente

```bash
copy .env.example .env
docker compose up -d
npm install
npx prisma db push
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

`.env` precisa de:

- `DATABASE_URL` — Postgres
- `AUTH_SECRET` — assina o cookie e autentica o Postman (`x-api-key`). **Não** é senha de usuário.

## Subir na Cloudflare

O app vai para **Cloudflare Workers** via OpenNext (`@opennextjs/cloudflare`).

1. Crie um Postgres na nuvem (Neon gratuito serve) e rode o schema uma vez:

```bash
npx prisma db push
```

Use o `DATABASE_URL` desse banco no comando (pode colar no `.env` antes).

2. Faça login na Cloudflare e grave os segredos no Worker. `AUTH_SECRET` precisa ser uma string longa aleatória (por exemplo `openssl rand -base64 48`) — **não** use o valor do `.env.example` e **não** é senha de usuário.

```bash
npx wrangler login
npx wrangler secret put DATABASE_URL
npx wrangler secret put AUTH_SECRET
```

Opcional, mas recomendado: crie um **Hyperdrive** apontando para o Neon e use a connection string do Hyperdrive como `DATABASE_URL`. Isso evita o Worker abrir conexões Postgres diretas.

3. Publique:

```bash
npm run deploy
```

4. Crie as contas pelo Postman apontando para a URL do Worker (nutri primeiro, depois paciente).

Para testar o Worker na sua máquina (runtime da Cloudflare, não o `next dev`):

```bash
copy .dev.vars.example .dev.vars
npm run preview
```

O dia a dia de desenvolvimento continua `npm run dev` + Docker.

## Decisões já tomadas (não desfazer sem pedir)

- Sem Excel / botão de baixar planilha.
- Sem tela de cadastro no site; só login.
- Sem Google e sem “esqueci a senha”.
- Nutri acompanha em tempo real (polling), não por e-mail de planilha.
- Login visual: split com `public/login.png`, formulário “Controle de Hábitos”, verde floresta, sem scroll, imagem **inteira** (`object-fit: contain`), não recortada.
- Paciente não edita o nome no formulário da semana; o nome vem da conta (`/conta`).
