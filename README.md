# My App

Application Next.js avec authentification et base de données PostgreSQL.

## Prérequis

- Node.js (v18+)
- Docker & Docker Compose

## Installation

```bash
npm install
```

## Lancer le projet

### 1. Démarrer la base de données

```bash
docker compose up -d
```

- **PostgreSQL** : `localhost:5432`
- **Adminer** (interface BDD) : [http://localhost:8080](http://localhost:8080)

### 2. Appliquer le schéma Prisma

```bash
npx prisma db push
```

### 3. Générer le client Prisma

```bash
npx prisma generate
```

### 4. Lancer le serveur de développement

```bash
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

## Commandes utiles

| Commande                                                       | Description                        |
| -------------------------------------------------------------- | ---------------------------------- |
| `docker compose up -d`                                         | Démarrer PostgreSQL + Adminer      |
| `docker compose down`                                          | Arrêter les conteneurs             |
| `npx prisma db push`                                           | Synchroniser le schéma avec la BDD |
| `npx prisma generate`                                          | Régénérer le client Prisma         |
| `npx prisma studio`                                            | Interface visuelle Prisma          |
| `npm run dev`                                                  | Serveur de développement           |
| `npm run build`                                                | Build de production                |
| `stripe listen --forward-to localhost:3000/api/stripe/webhook` |                                    |
