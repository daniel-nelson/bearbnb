## How to contribute to Dream ORM and Psychic

### Install dependencies

This project is a Psychic application using `pnpm`. There is no root `package.json`; install dependencies in each package directory:

```bash
pnpm --dir api install
pnpm --dir client install
pnpm --dir admin install
pnpm --dir internal install
```

### Add ENV files

Create `api/.env` and `api/.env.test` with local database settings.

```
DB_USER=YOUR_PG_USERNAME
DB_NAME=bearbnb_dev
DB_PORT=5432
DB_HOST=localhost
APP_ENCRYPTION_KEY="RpCuTrH6fz+yKpxLJPUjsKoIlz+aHO79N5hI3o1oVSU="
TZ=UTC
```

```
DB_USER=YOUR_PG_USERNAME
DB_NAME=bearbnb_test
DB_PORT=5432
DB_HOST=localhost
APP_ENCRYPTION_KEY="RpCuTrH6fz+yKpxLJPUjsKoIlz+aHO79N5hI3o1oVSU="
TZ=UTC
```

### Build db and sync schema

Run Psychic commands from `api/`.

```bash
cd api
NODE_ENV=development pnpm psy db:create
NODE_ENV=development pnpm psy db:migrate
pnpm psy db:create
pnpm psy db:migrate
pnpm uspec
```

## Global CLI

The global CLI is used to build a new Psychic app:

```bash
npx @rvoh/create-psychic new myapp --package-manager pnpm --primary-key-type uuid7 --workers --websockets --client react --admin-client react --internal-client react --claude-psychic-skill --codex-psychic-skill
```

For more information on Dream and Psychic, see [psychicframework.com](https://psychicframework.com/).

#### Did you find a bug?

- Do not open a public GitHub issue for a security vulnerability. Follow the relevant security policy instead.
- Search for an existing issue in the Dream or Psychic repositories before opening a new one.
- If you open a new issue, include the package version, Node version, Postgres version, TypeScript version, a description of the problem, and a reproducible example.

#### Patching a bug?

- Open a pull request on GitHub with the patch.
- Ensure the PR description describes both the problem and solution, with an issue number attached if relevant.

Thanks so much!

The Dream and Psychic team
