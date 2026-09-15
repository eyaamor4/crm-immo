# Rive — CRM immobilier augmenté

CRM de vente immobilière pour conseiller : pipeline, fiche prospect 360°, catalogue de lots, agenda de visites et matching assisté par IA. L'IA extrait les critères depuis une note libre, mais le conseiller garde toujours le contrôle : rien n'est validé sans son accord.

**Application déployée :** https://crm-immo-six.vercel.app
**Compte de démonstration :** `eya.amor@enis.tn` / `password123`

Auteur : Eya Amor — eyaamor519@gmail.com

---

## 1. Installation

### Prérequis

- Node.js 20+
- Docker (pour PostgreSQL en local) ou une base PostgreSQL accessible
- Un compte [Groq](https://console.groq.com) (extraction IA, gratuit)
- Un compte [Resend](https://resend.com) (envoi d'e-mails, gratuit)
- Un compte [n8n](https://n8n.io) (automatisations)

### Mise en route

```bash
git clone <url-du-repo>
cd crm-immo
npm install
```

Copiez `.env.example` vers `.env` et renseignez les variables :

```bash
cp .env.example .env
```

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Chaîne de connexion PostgreSQL |
| `AUTH_SECRET` | Secret NextAuth (`npx auth secret`) |
| `AUTH_TRUST_HOST` | `true` |
| `GROQ_API_KEY` | Clé API Groq pour l'extraction des critères |
| `RESEND_API_KEY` | Clé API Resend pour les e-mails n8n |
| `N8N_SECRET` | Secret partagé protégeant les routes appelées par n8n |

Base de données locale via Docker :

```bash
docker run --name crm-postgres \
  -e POSTGRES_USER=crm \
  -e POSTGRES_PASSWORD=crm_dev_password \
  -e POSTGRES_DB=crm_immo \
  -p 5432:5432 -d postgres:16
```

Migrations et jeu de démonstration :

```bash
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

L'application est disponible sur `http://localhost:3000`.

### Jeu de données de démonstration

Le seed est **idempotent** : il peut être relancé autant de fois que nécessaire sans créer de doublons. Il crée :

- un conseiller (identifiants ci-dessus)
- trois lots, dont un en statut `RESERVE` pour démontrer l'exigence de disponibilité
- deux prospects, dont un avec un budget en **euros** pour démontrer la conversion de devises
- les taux de change (TND pivot, EUR, USD)
- les cinq colonnes configurables du pipeline

---

## 2. Architecture

### Stack

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Base de données | PostgreSQL (Neon en production) |
| ORM | Prisma 6 |
| Authentification | NextAuth v5 (Credentials, stratégie JWT) |
| Styles | Tailwind CSS 4 |
| IA | Groq (`openai/gpt-oss-20b`) |
| Automatisations | n8n Cloud |
| E-mails | Resend (SMTP) |
| Hébergement | Vercel |

### Organisation du code

```
app/
  (app)/              Pages protégées, layout commun avec navigation
    dashboard/        Pipeline (page d'accueil)
    prospects/        Liste et fiche 360°
    biens/            Catalogue et comparaison
    agenda/           Planification des visites
  api/
    auth/             NextAuth
    webhooks/lead/    W1 — réception d'un nouveau lead
    relances/         W3 — prospects inactifs et enregistrement des brouillons
    visites/          W2 — préparation J-1 et checklist
    prospects/[id]/export/  Export RGPD
components/           Composants clients (interactivité)
lib/
  prisma.ts           Client Prisma (singleton)
  matching.ts         Algorithme de scoring et conversion de devises
  extraction.ts       Extraction IA des critères + garde-fous
  api-auth.ts         Vérification du secret n8n + masquage des logs
  telephone.ts        Normalisation pour la déduplication
prisma/
  schema.prisma       Modèle de données
  migrations/         Historique, dont une migration SQL manuelle
n8n/                  Exports JSON des trois workflows
```

### Modèle de données

Les entités principales sont `Conseiller`, `Prospect`, `Bien`, `RendezVous`, auxquelles s'ajoutent `Echange`, `Document`, `Tache`, `HistoriqueDisponibilite`, `TauxChange` et `ColonnePipeline`.

Trois décisions méritent d'être signalées :

**Le statut d'un bien est un enum, pas un booléen.** `DISPONIBLE`, `RESERVE`, `VENDU`, `RETIRE`. Un booléen ne distinguerait pas un lot réservé d'un lot vendu, alors que le sujet exige qu'un lot réservé ne soit jamais proposé comme disponible et qu'on trace l'historique des changements. `HistoriqueDisponibilite` enregistre l'ancien et le nouveau statut.

**Les colonnes du pipeline sont en base.** `ColonnePipeline` porte un libellé et un ordre, ce qui rend les colonnes réellement configurables plutôt que figées dans le code.

**Les devises passent par une table de taux.** `TauxChange` définit le TND comme devise pivot. Le matching convertit systématiquement avant toute comparaison ; l'affichage conserve la devise d'origine.

---

## 3. Choix techniques

### L'anti-conflit de rendez-vous est garanti par PostgreSQL

Une vérification applicative (`findFirst` puis `create`) laisse passer deux réservations simultanées : entre la lecture et l'écriture, une autre requête peut s'insérer. La garantie a donc été placée dans la base, via une contrainte d'exclusion :

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "RendezVous"
  ADD CONSTRAINT rdv_conseiller_no_overlap
  EXCLUDE USING gist (
    "conseillerId" WITH =,
    tsrange("debut", "fin") WITH &&
  ) WHERE (statut <> 'annule');
```

Une contrainte équivalente porte sur `bienId`. PostgreSQL évalue le chevauchement au moment de l'écriture : aucune course n'est possible. L'application intercepte l'erreur et affiche un message clair au conseiller. Cette migration est écrite en SQL manuel, Prisma ne générant pas ce type de contrainte.

### L'IA propose, le conseiller dispose

L'extraction des critères écrit dans `criteresIA`, un brouillon **non validé**. Le conseiller voit les champs, peut les corriger ou en supprimer, puis valide : les valeurs passent alors dans `criteresValide`, seul champ utilisé par le matching.

La sortie du modèle est filtrée par une fonction de nettoyage qui ne conserve que les clés attendues avec le bon type. Un modèle qui hallucinerait une clé ou renverrait une chaîne à la place d'un nombre ne pollue pas la base.

Le même principe gouverne le workflow de relance : le texte généré devient une tâche « Relance à valider », jamais un e-mail envoyé automatiquement.

### Le matching explique ses pénalités

Le score part de 100 et descend. Chaque écart entre le bien et les critères validés produit une pénalité chiffrée avec sa raison : dépassement de budget (proportionnel à l'écart), ville hors zone, type de bien, nombre de pièces, surface. Le conseiller voit le détail, pas seulement un chiffre.

Les lots dont le statut n'est pas `DISPONIBLE` sont écartés en amont de la requête : un bien réservé ne peut pas apparaître, même avec un score parfait.

### Confidentialité

Les journaux applicatifs ne contiennent jamais d'adresse e-mail ni de téléphone en clair : `lib/api-auth.ts` expose une fonction de masquage appliquée avant chaque `console.log` des routes publiques.

Les relations `Echange`, `Document` et `Tache` sont en `onDelete: Cascade` : supprimer un prospect efface tout son historique. `RendezVous` échappe volontairement à la cascade, un rendez-vous engageant aussi un conseiller et un bien ; la suppression RGPD les retire explicitement dans une transaction.

### Routes protégées par un secret partagé

Les routes appelées par n8n vérifient un en-tête `x-n8n-secret`. Sans lui, elles répondent 401. Les routes de l'interface utilisent la session NextAuth et vérifient systématiquement que le prospect appartient bien au conseiller connecté.

---

## 4. Automatisations n8n

Les exports JSON se trouvent dans `n8n/`. Les trois workflows sont actifs et appellent l'application déployée.

### W1 — Nouveau lead

`Webhook → POST /api/webhooks/lead → IF → e-mail au conseiller`

URL de production : `https://eyaamor.app.n8n.cloud/webhook/nouveau-lead`

La route effectue les quatre étapes du sujet :

1. réception du formulaire de campagne
2. **déduplication** sur l'e-mail normalisé et sur le téléphone normalisé (les huit derniers chiffres, ce qui fait correspondre `+216 20 000 000` et `20000000`)
3. **extraction des critères** par l'IA, en brouillon
4. **affectation** au conseiller ayant le moins de prospects

Si un doublon est détecté, aucun prospect n'est créé : un échange est ajouté au dossier existant et la réponse indique `statut: "doublon"`.

Test :

```bash
curl -X POST https://eyaamor.app.n8n.cloud/webhook/nouveau-lead \
  -H "Content-Type: application/json" \
  -d '{"nom":"Client Test","email":"test@example.com","note":"Villa Gammarth 5 pieces budget 900k"}'
```

### W2 — Préparation de visite

`Schedule (quotidien 18h) → GET /api/visites/preparation → Split → IA → POST /api/visites/checklist → e-mail`

La veille au soir, pour chaque visite du lendemain : génération d'une checklist de préparation (4 à 6 points concrets) enregistrée en tâches sur la fiche du prospect, puis rappel J-1 par e-mail au conseiller avec les coordonnées, le budget et le bien concerné.

La route signale deux situations : un prospect ayant retiré son consentement est exclu, et un bien passé en `RESERVE` depuis la planification déclenche une alerte dans les données envoyées.

### W3 — Relance intelligente

`Schedule (horaire) → GET /api/relances → Split → IA → POST /api/relances/brouillon`

Sélectionne les prospects sans activité depuis cinq jours, génère une relance personnalisée à partir du budget, de l'étape et des derniers échanges, puis l'enregistre comme tâche à valider.

Trois filtres protègent la sélection : consentement actif, étape du pipeline non terminale, et absence de relance déjà en attente — sans ce dernier point, une exécution horaire produirait un brouillon par heure pour le même prospect.

---

## 5. Cas limites traités

| Cas | Traitement |
|---|---|
| Prospect déjà existant | Déduplication sur e-mail et téléphone normalisés ; un échange est ajouté au dossier existant |
| Budget en devise différente | Conversion vers le TND via `TauxChange` avant toute comparaison ; affichage dans la devise d'origine |
| Bien réservé pendant le matching | Le matching ne lit que les lots `DISPONIBLE` ; la planification revérifie le statut et refuse avec un message nommant le bien |
| Rendez-vous en conflit | Contrainte d'exclusion PostgreSQL sur le conseiller et sur le bien ; erreur traduite en message lisible |
| Consentement retiré | Exclusion des relances automatiques, refus de planifier une visite, badge visible sur la fiche et dans la liste |
| Note libre vide ou trop courte | L'extraction refuse et explique, sans écrire en base |
| Clé IA absente ou modèle indisponible | Le message d'erreur remonte à l'interface ; la création du prospect aboutit malgré tout, sans critères |
| Date de visite passée | Refus avant tout accès à la base |

---

## 6. Limites connues

**Un seul conseiller dans le jeu de démonstration.** L'affectation automatique (le moins chargé) fonctionne avec plusieurs conseillers, mais le seed n'en crée qu'un. L'isolation des données est en revanche bien vérifiée à chaque requête.

**Resend sans domaine vérifié.** Les e-mails ne peuvent partir que vers l'adresse du compte Resend. C'est une limite du plan gratuit, pas du code : la configuration d'un domaine lèverait la restriction sans modification applicative.

**Pas de glisser-déposer dans le pipeline.** Le déplacement d'une carte passe par un menu. Le choix a été fait pour garantir le fonctionnement sur mobile, l'exigence de responsive primant sur l'effet visuel.

**Les taux de change sont figés.** `TauxChange` est alimenté par le seed. Un branchement sur une API de taux serait le prolongement naturel ; l'architecture est déjà en place (la conversion passe par une seule fonction).

**Pas d'envoi effectif des relances.** Par conception : le brouillon devient une tâche à valider. L'envoi après validation est la suite logique, mais il sortait du périmètre de l'exigence « l'IA produit un brouillon que le conseiller valide ».

**Pas de téléversement de documents.** Le modèle `Document` existe et la fiche affiche les documents liés, mais l'ajout de fichiers n'est pas implémenté.

**Le brouillon d'extraction reste affiché après validation.** Les critères validés apparaissent bien, mais le brouillon n'est pas effacé. Sans conséquence fonctionnelle, à nettoyer.

---

## 7. Commandes utiles

```bash
npm run dev            # Développement
npm run build          # Build de production (prisma generate + next build)
npx prisma studio      # Exploration de la base
npx prisma db seed     # Jeu de démonstration (idempotent)
npx prisma migrate dev # Nouvelle migration
```
