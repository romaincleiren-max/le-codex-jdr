# Correctifs de préparation Halloween — 9 octobre 2026

## État

**Déployé en production le 10 octobre 2026** sur https://le-codex-jdr.vercel.app (déploiement `dpl_52EQ1DqyGjVLRJrHNwCFKjcbSNX5`). Les migrations sont désormais visibles dans Supabase : éditions PDF présentes et accès anonymes aux tables sensibles refusés. Aucun scénario, achat ou PDF existant n’a été supprimé ou modifié pendant le déploiement. Un compte joueur temporaire a été créé pour contrôler les accès réels, puis supprimé. Aucun paiement ni e-mail réel n’a été déclenché.

Contrôles en production : téléchargement complet du PDF français du chapitre I dans Chrome à 390 et 1440 px, aucune erreur JavaScript sur ces parcours, administration inaccessible sans connexion, écrans de récupération accessibles, API PDF fonctionnelle et chapitre sans fichier refusé. La connexion d’un joueur réel temporaire et son absence d’accès aux personnages existants, achats et administrateurs ont été vérifiées. La clé serveur a été ajoutée aux variables privées Vercel avec accord explicite ; elle est absente du bundle navigateur. `PAYMENTS_ENABLED=false` a été vérifié par un appel réel à l’API.

Limites restantes : le login avec le compte administrateur habituel et l’édition des traductions ont été testés localement avec services simulés, pas avec ce compte en production. Aucun mot de passe de l’utilisateur n’a été demandé ni changé. La réception effective d’un e-mail de récupération et son lien final restent à vérifier par le titulaire du compte. Les ventes Stripe restent désactivées jusqu’à la recette des étapes 5 et 6.

Le catalogue actif a été vérifié en lecture seule : seul le scénario 10, « Chapitre I : La Maîtresse des Doigts », dispose d’un PDF et il est gratuit. Les chapitres II et III ainsi que les campagnes complètes n’ont pas de fichier. Cette absence est normale : le nouveau parcours les affiche « PDF à venir » et refuse leur vente côté serveur.

## Téléchargements et traductions

- Administration → Scénarios → Modifier → **PDF disponibles par langue** : choisir un fichier pour Français, English ou une langue ajoutée avec son code (`es`, `de`, `it`, `pt-BR`…). Enregistrer après la fin de l’import.
- Chaque langue possède son fichier indépendant. Une langue sans fichier n’apparaît pas dans la liste proposée au visiteur. Retirer une traduction ne supprime pas le fichier du stockage, afin de préserver les données.
- La langue proposée par défaut suit la langue de l’interface si sa traduction existe ; sinon, elle utilise la première édition disponible. Le visiteur peut toujours changer ce choix.
- Le fichier français existant est conservé lors de la migration. Les anciennes URL signées sont débarrassées de leur jeton dans les métadonnées publiques.
- Un achat donne accès aux traductions disponibles et futures de **l’article acheté**, sans payer chaque langue séparément. Le reçu privé reste utilisable ; chaque URL de fichier générée expire après cinq minutes. La limite historique de trois clics/48 heures n’est plus appliquée aux nouvelles commandes : elle empêchait notamment de récupérer les traductions ultérieures.
- Les campagnes complètes ne sont proposées que si elles possèdent leur propre PDF. Un PDF de chapitre ne rend pas automatiquement la campagne complète disponible.

## Sécurité et parcours corrigés

- Prix et nom des articles relus depuis Supabase côté serveur ; les prix envoyés par le navigateur sont ignorés. Contrôles des fichiers, panier vide, doublons, chevauchement campagne/chapitre et origine de la requête.
- Paiement hébergé Stripe : retrait complet des champs carte, date et CVV du formulaire local. Le panier conserve uniquement les identifiants d’articles en stockage de session ; les données commerciales sont reconstruites depuis le catalogue.
- Stripe sert de registre des nouveaux achats. Le téléchargement vérifie la session payée et terminée, ses articles, ainsi que les remboursements/litiges. Les anciennes tables d’achat sont conservées et protégées ; le nouveau circuit ne dépend plus de leurs colonnes incompatibles. Les statistiques historiques fondées uniquement sur `purchases` ne comptabiliseront donc pas ces nouveaux achats : utiliser le tableau de bord Stripe pour les ventes.
- Webhook : signature vérifiée sur les octets bruts, pas sur un objet JSON reconstruit. Un échec d’envoi du reçu retourne une erreur pour permettre la reprise par Stripe. Les livraisons Resend utilisent une clé d’idempotence. Cette déduplication dépend de la fenêtre de conservation du fournisseur ; un rejeu très tardif peut renvoyer un reçu, sans créer de nouveau droit ni débiter le client.
- Reçu multiarticles avec un sélecteur de langue par PDF ; aucun écran « paiement confirmé » pour une session impayée ; vérifications répétées brièvement puis bouton de reprise. Aucun faux message affirmant qu’un e-mail a été envoyé.
- Les routes de paiement et PDF renvoient des erreurs JSON contrôlées, sans détails de secrets, et `Cache-Control: no-store`. Les anciens liens `/api/download/:token` renvoient une erreur explicite et non la page d’accueil. Les anciens achats nécessitent une reprise manuelle avec leur référence Stripe.
- Forge : échappement des données insérées dans les vues HTML, encodage des chaînes des événements, validation des URL de portrait, création DOM du portrait. Vérification de l’origine et de la fenêtre source pour les messages de l’iframe. Désactivation de l’évaluation JavaScript du lecteur PDF existant ; version du SDK Supabase CDN figée.
- Récupération du mot de passe via Supabase et retrait du faux changement de mot de passe `localStorage/admin123`. Page de diagnostic Supabase réservée à l’administration.
- Accès à `/admin` corrigé : après connexion, l’interface ouvre bien l’administration au lieu de revenir sur l’accueil.
- Liens de catalogue partageables, par exemple `/?campaign=13&chapter=10`. Ils rouvrent le chapitre, utiles pour les campagnes publicitaires.
- Dépendances corrigées et versions verrouillées dans `package-lock.json` ; configuration Vite en `.mjs`.

## Mise en ligne : ordre des opérations

1. Préparer les variables Vercel décrites dans [.env.example](../.env.example). Conserver `PAYMENTS_ENABLED=false`. Les téléchargements gratuits ont seulement besoin des clés Supabase côté serveur ; les clés Stripe/Resend sont nécessaires pour activer les ventes.
2. Dans Supabase → Authentication → URL Configuration, ajouter `https://le-codex-jdr.vercel.app/reset-password` aux URL de redirection autorisées. Vérifier l’adresse d’origine du site et l’envoi des e-mails d’authentification.
3. Au moment du déploiement, exécuter dans le SQL Editor Supabase, dans cet ordre :
   - [20261009_pdf_editions_security.sql](../supabase/migrations/20261009_pdf_editions_security.sql)
   - [20261009_character_access.sql](../supabase/migrations/20261009_character_access.sql)
   Chaque fichier est transactionnel et peut être rejoué. Ne pas réappliquer ensuite les anciens scripts de permissions permissives. La première migration rend les buckets PDF privés ; coordonner son exécution avec le déploiement pour ne pas laisser l’ancien téléchargement anonyme actif côté navigateur avec les nouvelles restrictions.
4. Déployer les fichiers du dépôt sur Vercel. Vérifier `/api/pdf`, le PDF français du chapitre I, le login admin, l’édition des traductions et la récupération de mot de passe. Vérifier les restrictions RLS avec un compte joueur réel avant publicité.
5. Pour les ventes futures : configurer un domaine/expéditeur vérifié Resend, puis un endpoint Stripe `/api/webhook` pour `checkout.session.completed` et `checkout.session.async_payment_succeeded`. Copier son secret dans `STRIPE_WEBHOOK_SECRET`. Rester en mode **Stripe test**, sur un environnement de test avec `APP_URL` correspondant, pour la recette complète : achat simple/multiple, annulation, paiement refusé, reçu réellement reçu, téléchargement des deux langues, remboursement, webhook rejoué.
6. Compléter les informations commerciales du Codex (identité du vendeur, contact support, conditions et confidentialité adaptées à cette boutique). Ces informations ne sont pas inventées ni reprises automatiquement des pages Mythomancer. N’activer `PAYMENTS_ENABLED=true` en production et les clés Stripe réelles qu’après cette recette et ces informations prêtes.

État au 10 octobre : connexion Vercel réalisée et déploiement effectué. Aucun identifiant SQL/Management Supabase n’est disponible ; les migrations ont été constatées via REST et les politiques testées avec un joueur temporaire. Le réglage des URL de récupération Supabase doit encore être confirmé dans le tableau de bord ou par un test de récupération du titulaire du compte.

## Validation effectuée

- `npm run build` : compilation réussie. Un avertissement subsiste sur la taille du bundle principal (~655 ko avant compression), à optimiser séparément si les mesures de trafic le justifient.
- `node --test --test-isolation=none scripts/admin-session.test.mjs scripts/commerce.test.cjs scripts/security-migrations.test.mjs` : 9 tests réussis. Le test PostgreSQL vérifie notamment la conservation du PDF français, le rejeu des migrations, l’absence d’accès aux achats pour un visiteur/joueur, les écritures publiques interdites, les permissions admin et l’impossibilité d’auto-valider un personnage.
- `node scripts/halloween-browser.test.mjs` : tests Chrome locaux avec réponses de services simulées, sur 390 px et 1440 px ; données d’injection rendues comme texte, langues, chapitre à venir, reprise après erreur, récupération de compte et absence de faux succès de paiement. Le parcours administrateur vérifie aussi la connexion, l’import d’un PDF anglais et son enregistrement en conservant l’édition française.
- `npm audit` : aucune vulnérabilité npm connue après mise à jour (ce résultat ne couvre pas à lui seul toutes les bibliothèques chargées par CDN).
- `git diff --check` : aucun défaut d’espacement signalé.

Ces contrôles valident les chemins testés, pas une absence absolue de vulnérabilité. L’audit authentifié de la base réellement déployée, les réglages de limitation des abus/inscriptions, la disponibilité et les sauvegardes Supabase, la recette Stripe réelle en mode test et le suivi Vercel restent nécessaires avant de déclarer le site prêt pour la publicité avec paiements. La Forge reste un gros fichier historique utilisant des événements inline ; les tests couvrent les injections identifiées, pas toutes les combinaisons de personnages/imports.

Références : [corps brut Vercel](https://vercel.com/kb/guide/how-do-i-get-the-raw-body-of-a-serverless-function), [livraison Stripe](https://docs.stripe.com/checkout/fulfillment), [récupération Supabase](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [idempotence Resend](https://resend.com/changelog/idempotency-keys).
