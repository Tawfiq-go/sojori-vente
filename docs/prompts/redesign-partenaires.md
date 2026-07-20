# PROMPT — Redesign de la section « Partenaires sélectionnés » (sojori.com)

Tu es designer/développeur front sur **sojori.com**, marketplace premium de séjours
au Maroc (Next.js App Router + CSS vanilla). Je ne suis **pas satisfait du contenu
ni de la hiérarchie** de la section « Partenaires sélectionnés » de la page
d'accueil : elle est plate, répétitive, et ne donne ni envie ni confiance.
Redessine-la entièrement.

## Fichiers concernés
- `app/page.tsx` — bloc `.brands-grid` (~lignes 735-800) : 5 cartes
  `<Link className="brand-card">` vers `/pm/<slug>`
- `app/homepage.css` — styles `.brands-grid`, `.brand-card` et enfants
  (`.bg`, `.overlay`, `.badge`, `.logo`, `.content`, `.nm`, `.tag`, `.meta`)

## Données disponibles par PM (API, ne pas modifier le modèle)
`name`, `slug`, `tagline`, `description`, `logoText`, `vitrineLogoUrl` (logo
image), `brandColor {from,to}`, `verified` (bool), `listingCount`,
`responseTime` (ex. « < 2h »), `rating` (souvent 0 → masquer si 0).

## État actuel (à améliorer)
Grille `1.8fr 1fr 1fr` sur 2 rangées, 1 carte « featured » + 4 petites ;
fonds = 5 visuels Sojori fixes (`/pm-cards/sojori-card-1..5.png`, motifs or sur
encre — à CONSERVER) ; badge « ✓ VÉRIFIÉ » haut-gauche ; logo 34px bas-droit ;
contenu bas-gauche = nom (serif) + tagline + « X biens · < 2h ».
Problèmes : tout se ressemble, la tagline fait doublon avec le nom, les
métriques sont froides, aucune incitation à cliquer, la carte featured
n'exploite pas sa taille.

## Identité à respecter scrupuleusement
Palette `--paper` (papier crème), `--ink` (encre chaude), `--gold #c89b3c`,
`--goldS #e8c87a` ; titres serif italiques élégants (`var(--serif)`), labels
mono uppercase (`var(--mono)`) ; ton éditorial haut de gamme,
marocain-contemporain, jamais criard. Cohérence totale avec le reste de la
home (sections Destinations, Sélection Sojori).

## Objectifs du redesign
1. **Hiérarchie éditoriale** : la carte featured doit raconter quelque chose
   (citation du PM, spécialité, quartiers, mini-preuves) — pas juste un plus
   grand logo.
2. **Contenu plus vivant** : remplacer « X biens · < 2h » par des preuves plus
   humaines (ex. « 6 adresses à Guéliz & Hivernage », « répond en moins
   d'1h », étoile + note si `rating > 0`), badges de spécialité dérivés de la
   tagline.
3. **Différenciation visuelle** entre cartes SANS casser l'homogénéité
   (utiliser `brandColor` en accent subtil : filet, tag, hover).
4. **Incitation au clic** : affordance claire (flèche, « Découvrir », hover
   raffiné, micro-animation ≤ 200 ms).
5. **Responsive impeccable** (≥ 3 breakpoints) et accessible (contrastes AA,
   focus visible, alt/aria).

## Contraintes dures
- Ne toucher à rien d'autre que cette section.
- Pas de nouvelle dépendance, pas d'appel API supplémentaire.
- Les 5 fonds Sojori restent.
- Badge « VÉRIFIÉ » uniquement si `verified === true`.
- La section est masquée en mode tenant (`!tenantActive`) — ne pas changer
  cette condition.
- `pnpm build` doit passer.

## Livrable
Le nouveau JSX + CSS complets, plus un court paragraphe expliquant tes choix.
Propose d'abord 2 directions (wireframe textuel), choisis la meilleure,
implémente-la.
