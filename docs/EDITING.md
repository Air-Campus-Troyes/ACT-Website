# Modifier le contenu du site

Ce guide s’adresse aux membres du bureau qui veulent mettre à jour le site (textes, photos, tarifs,
FAQ…) **sans toucher au code**.

## Le principe

1. Vous faites vos modifications dans l’interface d’administration.
2. Chaque enregistrement crée une **proposition de modification** (une « Pull Request » GitHub),
   vérifiée automatiquement (fautes de format, photos sans texte alternatif, référencement…).
3. Une fois la proposition acceptée (fusionnée), la modification apparaît en quelques minutes sur
   le **site de test** : vérifiez-la sur ordinateur et sur mobile.
4. Le webmaster valide ensuite la mise en ligne sur le vrai site.

Rien n’est publié par erreur : le vrai site ne change qu’après cette dernière validation.

## Se connecter

1. Rendez-vous sur **https://www.aircampustroyes.fr/admin/**
2. Cliquez sur **Se connecter avec GitHub** (il faut un compte GitHub ayant accès au dépôt du club —
   demandez-le au webmaster).

## Modifier une page

1. Menu **Pages** → choisissez la page.
2. Une page est composée de **sections** :
   - **Deux colonnes** : une colonne gauche et une colonne droite, chacune contenant des cartes de
     texte, des photos, la météo, etc.
   - **Pleine largeur** : des éléments sur toute la largeur.
   - Des sections spéciales : grille tarifaire, liste des avions, FAQ…
3. Dans une **carte de texte**, le texte se met en forme avec la barre d’outils (gras, liens, listes).
4. Ajoutez des **boutons** en bas d’une carte (texte + lien, par exemple `/contact/`).
5. Cliquez sur **Enregistrer**. La proposition apparaît dans l’onglet **Flux éditorial**.

### Les photos

- Utilisez des photos d’au moins **1600 pixels de large** ; le site les optimise automatiquement.
- Le **texte alternatif** est obligatoire : décrivez ce qu’on voit (« Le Piper F-HELM sur le parking
  de l’aéroport de Troyes »). C’est important pour les personnes malvoyantes et pour Google.

### Le référencement Google (important !)

Chaque page a un bloc **Référencement (Google)** :

- **Titre Google** (60 caractères max) : ce qui s’affiche en bleu dans les résultats Google.
  Mettez les mots que les gens recherchent : « baptême de l’air », « Troyes », « école de pilotage »…
- **Description Google** (50 à 170 caractères) : le petit texte sous le titre. Donnez envie de cliquer !
- ⚠️ Ne changez **jamais l’adresse (URL)** d’une page déjà publiée : Google perdrait son classement.

## Modifier les tarifs

Menu **Réglages → Tarifs**. Pensez à mettre à jour aussi la liste **Offres (données Google)** en bas,
qui reprend les prix des vols découverte.

## Ajouter une question à la FAQ

Menu **FAQ → Nouvelle question**. Le champ **Ordre d’affichage** détermine la position (10, 20, 30…).

## Publier

Dans **Flux éditorial**, votre modification passe par trois colonnes : _Brouillon_, _En révision_,
_Prêt_.

- Si les vérifications automatiques sont vertes ✅, la proposition peut être fusionnée.
- Si elles sont rouges ❌, un message indique le problème (souvent : description Google trop longue,
  photo sans texte alternatif). Corrigez dans l’administration et enregistrez à nouveau.

Une fois fusionnée, la modification part sur le **site de test** (adresse communiquée par le
webmaster). Vérifiez-la, puis prévenez le webmaster, qui valide la mise en ligne définitive
(quelques minutes).

## Alternative : modifier directement sur GitHub

Pour une petite correction de texte, vous pouvez aussi ouvrir le fichier dans
`src/content/pages/` sur GitHub, cliquer sur le crayon ✏️, modifier, puis
**Propose changes**. Les mêmes vérifications et la même publication s’appliquent.

## Besoin d’aide ?

Contactez le webmaster. Pour tout changement de mise en page (nouveau type de bloc, couleurs,
menu…), demandez-lui : ces éléments sont dans le code.
