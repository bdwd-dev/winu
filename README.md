# 🎰 WINU — Loterie Solidaire Congo

> **Fusion EBALE + Zua Chance** — Micro-tickets Mobile Money, moteur algorithmique organique, tirage Nzadi Provably Fair

## 📁 Structure du Projet (Monorepo)

```
winu/
├── backend/          # API Node.js natif (0 dépendances)
│   ├── server.js     # Serveur HTTP + Moteur EBALE + Algorithme Nzadi
│   └── db.json       # Base de données simulée
├── web/              # Frontend Vue 3 + Vuetify 3
│   ├── src/
│   │   ├── views/    # HomeView, DrawsView, AdminView
│   │   ├── components/ # DrawCard, etc.
│   │   ├── stores/   # Pinia (user store)
│   │   ├── services/ # API client
│   │   └── router/   # Vue Router
│   └── vite.config.js
└── mobile/           # App Flutter (Android + Web)
    └── lib/
        └── main.dart # Interface mobile complète
```

## 🚀 Démarrage Rapide

### 1. Backend (Port 3000)

```bash
cd backend
node server.js
# → http://localhost:3000/api/stats
```

### 2. Web (Port 5173)

```bash
cd web
npm install
npm run dev
# → http://localhost:5173
```

### 3. Mobile (Flutter)

```bash
cd mobile
flutter pub get
flutter run -d chrome   # ou -d android
```

## 🎯 Fonctionnalités

### Côté Utilisateur
- ✅ Achat de tickets avec wallet Oziki (1 XAF = 10 Oz)
- ✅ Liste des tirages (ouverts, complets, terminés)
- ✅ Historique des transactions
- ✅ Quota anti-baleine automatique

### Côté Admin
- ✅ Création de tirages avec le **Moteur EBALE** (calcul organique)
- ✅ Calcul automatique : prix ticket, Tpalier, Tmax, quota
- ✅ Lancement du **Tirage Nzadi** (Provably Fair)
- ✅ Visualisation des preuves de tirage (hash SHA-256)

### Côté Mobile (Flutter)
- ✅ Interface Material Design 3
- ✅ Navigation bottom bar
- ✅ Achat de tickets en 2 taps
- ✅ Vue tirages en cours

## 📊 API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/stats` | Statistiques globales |
| GET | `/api/draws` | Liste des tirages |
| POST | `/api/draws` | Créer un tirage (Admin) |
| POST | `/api/calculate` | Calculer prix ticket (Moteur EBALE) |
| POST | `/api/buy-oziki` | Acheter des Oziki |
| POST | `/api/buy-ticket` | Acheter des tickets |
| POST | `/api/draw/:id` | Lancer le tirage Nzadi |
| GET | `/api/tickets` | Liste des tickets |
| GET | `/api/winners` | Liste des gagnants |

## 🧮 Moteur EBALE — Formules

```
CAmin = P / (1 - Ms - Tx)        # Coût minimum pour couvrir lot + taxes + marge
Tcibles = ceil(Utotal × Cr) × Tmoy  # Tickets cibles selon fréquence
Ct_XAF = max(50, ceil(CAmin/Tcibles × γ / 50) × 50)  # Prix ticket arrondi
Tpalier = ceil(CAmin / Ct_XAF)    # Tickets pour financer 1 lot
Tmax = Wmax × Tpalier × γ         # Plafond ventes (lock)
Tmax_joueur = ceil(P × α / (Ct_XAF × ceil(Tpalier/Tmoy)))  # Anti-baleine
```

**Paramètres :** Tx=20%, Ms=20%, Tmoy=2, Eoz=10, Pmin=50 XAF

## 🔐 Algorithme Nzadi (Provably Fair)

1. Avant tirage : publier `hash(seed_serveur)` + `seed_client`
2. Vente tickets : chaque ticket = code hexadécimal unique
3. Tirage : révéler `seed_serveur` → hash SHA-256 → tirage déterministe
4. Vérification : n'importe qui peut vérifier que le hash n'a pas changé

## 📱 Captures d'Écran

### Web - Accueil
- Hero section avec stats en temps réel
- Cartes de tirages avec progression
- Achat Oziki intégré

### Web - Admin
- Formulaire de création avec calcul moteur
- Liste des tirages avec actions
- Résultat tirage Nzadi avec preuve hash

### Mobile (Flutter)
- Bottom navigation (Accueil, Tirages, Profil)
- Grille de statistiques
- Achat ticket en 2 taps

## ⚠️ Notes Importantes

- **COGELO** : Licence obligatoire pour exploitation réelle au Congo
- **Mobile Money** : Simulation (pas de vrai paiement)
- **Trésorerie** : Prévoir 1 lot de trésorerie minimum avant lancement

---

**Développé pour le contexte Congo-Brazzaville** 🇨🇬
