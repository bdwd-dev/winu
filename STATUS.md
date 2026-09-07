# État d'avancement — Winu Demo

## ✅ Backend (Node.js natif — 0 deps)
**Fichier :** `backend/server.js`
**Port :** 3000
**Statut :** ✅ OPÉRATIONNEL

### Fonctionnalités implémentées :
- [x] API REST complète (CRUD draws, users, tickets, transactions)
- [x] Moteur EBALE (7 étapes) — calcul organique des prix
- [x] Algorithme Nzadi (Provably Fair) — hash SHA-256
- [x] Achat Oziki (1 XAF = 10 Oziki)
- [x] Achat tickets avec quota anti-baleine
- [x] Tirage Nzadi avec seed + hash vérifiable
- [x] Dashboard stats en temps réel
- [x] Base de données JSON simulée (db.json)

### Endpoints testés :
```
GET  /api/stats          → Statistiques globales
GET  /api/draws          → Liste des tirages
POST /api/draws          → Créer un tirage (Admin)
POST /api/calculate      → Calculer prix ticket (Moteur EBALE)
POST /api/buy-oziki      → Acheter des Oziki
POST /api/buy-ticket     → Acheter des tickets
POST /api/draw/:id       → Lancer le tirage Nzadi
GET  /api/tickets        → Liste des tickets
GET  /api/winners        → Liste des gagnants
```

---

## ✅ Frontend Web (Vue 3 + Vuetify 3)
**Dossier :** `web/`
**Port :** 5173
**Statut :** ✅ OPÉRATIONNEL

### Pages créées :
- [x] **HomeView** — Hero, stats, tirages en cours, achat Oziki
- [x] **DrawsView** — Liste des tirages avec filtres, achat ticket
- [x] **AdminView** — Création tirage (moteur EBALE), tirage Nzadi, gestion

### Composants :
- [x] DrawCard — Carte de tirage avec progression
- [x] Navigation responsive (bottom nav mobile)
- [x] Store Pinia (user store)
- [x] Router Vue Router
- [x] Service API (proxy vers backend)

---

## ⚠️ Mobile (Flutter)
**Dossier :** `mobile/`
**Statut :** ⚠️ CODE PRÊT — Build web bloqué (téléchargement Web SDK)

### Code implémenté :
- [x] Interface Material Design 3
- [x] Bottom navigation (Accueil, Tirages, Profil)
- [x] Grille de statistiques
- [x] Liste des tirages
- [x] Achat de tickets (dialog)
- [x] Service API (http package)
- [x] Modèles de données

### Pour builder :
```bash
cd mobile
flutter pub get
flutter run -d chrome   # ou -d android
```

> ⚠️ Le build web Flutter nécessite le téléchargement du Web SDK (~500Mo) qui a été interrompu. Relance `flutter build web` quand la connexion est stable.

---

## 🚀 Pour démarrer

### Terminal 1 — Backend :
```bash
cd /home/bdwd/Documents/CodeS/demo/projects/winu/backend
node server.js
```

### Terminal 2 — Web :
```bash
cd /home/bdwd/Documents/CodeS/demo/projects/winu/web
npm run dev
```

### Terminal 3 — Mobile :
```bash
cd /home/bdwd/Documents/CodeS/demo/projects/winu/mobile
flutter run -d chrome
```

---

## 📊 Données de démo

| Entité | Nombre | Détail |
|--------|--------|--------|
| Users | 5 | 4 vérifiés |
| Draws | 4 | 2 ouverts, 1 locked, 1 drawn |
| Tickets | 23 | CA total : 608 550 XAF |
| Oziki | 264 000 | En circulation |

---

## 📁 Structure finale

```
/home/bdwd/Documents/CodeS/demo/projects/winu/
├── backend/
│   ├── server.js      # API Node.js natif
│   └── db.json        # Données simulées
├── web/
│   ├── src/
│   │   ├── views/     # Home, Draws, Admin
│   │   ├── components/# DrawCard
│   │   ├── stores/    # Pinia
│   │   ├── services/  # API client
│   │   └── router/    # Vue Router
│   └── vite.config.js
├── mobile/
│   └── lib/main.dart  # App Flutter
└── README.md
```

---

**Prochaines étapes possibles :**
1. Relancer `flutter build web` pour le mobile
2. Ajouter d'autres projets (Coffrets Cadeaux, Agence Data, etc.)
3. Intégrer de vrais paiements Mobile Money (MTN/Airtel)
4. Déployer sur VPS (Dokploy)
