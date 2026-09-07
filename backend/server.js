const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');

// ============================================
// DATABASE HELPERS
// ============================================
function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (e) {
    return { users: [], draws: [], tickets: [], transactions: [], wallets: [], winners: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ============================================
// MOTEUR EBALE
// ============================================
const CONSTANTS = { Tx: 0.20, Ms: 0.20, Tmoy: 2, Eoz: 10, Pmin: 50 };
const MATRIX = {
  1: { Cr: 0.05, gamma: 1.0, alpha: 5, label: 'Journalier' },
  2: { Cr: 0.10, gamma: 1.5, alpha: 3, label: 'Weekend' },
  3: { Cr: 0.20, gamma: 2.0, alpha: 2, label: 'Mensuel' },
  4: { Cr: 0.40, gamma: 3.0, alpha: 1, label: 'Annuel' }
};

function ebaleEngine(P, I, Utotal, Wmax) {
  const { Cr, gamma, alpha } = MATRIX[I] || MATRIX[3];
  const CAmin = P / (1 - CONSTANTS.Ms - CONSTANTS.Tx);
  const participants = Math.ceil(Utotal * Cr);
  const Tcibles = participants * CONSTANTS.Tmoy;
  const Ct_brut = (CAmin / Tcibles) * gamma;
  const Ct_XAF = Math.max(CONSTANTS.Pmin, Math.ceil(Ct_brut / 50) * 50);
  const Ct_Oziki = Ct_XAF * CONSTANTS.Eoz;
  const Tpalier = Math.ceil(CAmin / Ct_XAF);
  const Wmax_sugg = Math.max(1, Math.floor(Tcibles / (Tpalier * Math.sqrt(I))));
  const Tmax = Wmax * Tpalier * gamma;
  const P_artmin = Math.ceil(Tpalier / CONSTANTS.Tmoy);
  const Tmax_joueur = Math.ceil((P * alpha) / (Ct_XAF * P_artmin));

  return {
    CAmin: Math.round(CAmin), Ct_XAF, Ct_Oziki,
    Tpalier: Math.round(Tpalier), Tmax: Math.round(Tmax),
    Wmax_sugg: Math.round(Wmax_sugg), Tmax_joueur: Math.round(Tmax_joueur),
    participants, gamma, alpha, label: MATRIX[I]?.label || 'Inconnu'
  };
}

// ============================================
// HTTP HELPERS
// ============================================
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

// ============================================
// ROUTES
// ============================================
async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    return sendJSON(res, 200, {});
  }

  const db = readDB();

  try {
    // --- STATS ---
    if (pathname === '/api/stats' && method === 'GET') {
      const totalCA = db.draws.reduce((s, d) => s + (d.CA || 0), 0);
      const totalTickets = db.tickets.reduce((s, t) => s + t.count, 0);
      const totalOziki = db.users.reduce((s, u) => s + u.oziki_balance, 0);
      return sendJSON(res, 200, {
        users: { total: db.users.length, verified: db.users.filter(u => u.verified).length },
        draws: {
          total: db.draws.length,
          open: db.draws.filter(d => d.status === 'open').length,
          locked: db.draws.filter(d => d.status === 'locked').length,
          drawn: db.draws.filter(d => d.status === 'drawn').length
        },
        tickets: { total: totalTickets, revenue_XAF: totalCA },
        oziki: { total_circulating: totalOziki, exchange_rate: '1 XAF = 10 Oziki' }
      });
    }

    // --- CALCULATE ---
    if (pathname === '/api/calculate' && method === 'POST') {
      const { P, I, Utotal, Wmax } = await readBody(req);
      if (!P || !I || !Utotal) return sendJSON(res, 400, { error: 'Champs requis: P, I, Utotal' });
      return sendJSON(res, 200, ebaleEngine(Number(P), Number(I), Number(Utotal), Number(Wmax) || 1));
    }

    // --- BUY OZIKI ---
    if (pathname === '/api/buy-oziki' && method === 'POST') {
      const { user_id, amount } = await readBody(req);
      if (!user_id || !amount) return sendJSON(res, 400, { error: 'Champs requis: user_id, amount' });

      const user = db.users.find(u => u.id === Number(user_id));
      if (!user) return sendJSON(res, 404, { error: 'Utilisateur non trouvé' });

      const ozikiAmount = Number(amount) * CONSTANTS.Eoz;
      user.oziki_balance += ozikiAmount;

      const wallet = db.wallets.find(w => w.user_id === Number(user_id));
      if (wallet) wallet.balance += ozikiAmount;

      db.transactions.push({
        id: db.transactions.length + 1, user_id: Number(user_id),
        type: 'buy_oziki', amount: ozikiAmount,
        momoTx: `MM${Date.now()}`, status: 'completed', createdAt: new Date().toISOString()
      });

      writeDB(db);
      return sendJSON(res, 200, {
        success: true, user_id: Number(user_id),
        amount_XAF: Number(amount), amount_Oziki: ozikiAmount, new_balance: user.oziki_balance
      });
    }

    // --- BUY TICKET ---
    if (pathname === '/api/buy-ticket' && method === 'POST') {
      const { user_id, draw_id, count } = await readBody(req);
      if (!user_id || !draw_id || !count) return sendJSON(res, 400, { error: 'Champs requis: user_id, draw_id, count' });

      const draw = db.draws.find(d => d.id === Number(draw_id));
      if (!draw) return sendJSON(res, 404, { error: 'Tirage non trouvé' });
      if (draw.status !== 'open') return sendJSON(res, 400, { error: 'Tirage fermé' });

      const user = db.users.find(u => u.id === Number(user_id));
      if (!user) return sendJSON(res, 404, { error: 'Utilisateur non trouvé' });

      const totalOziki = draw.Ct_Oziki * Number(count);
      const totalXAF = draw.Ct_XAF * Number(count);

      const userTickets = db.tickets
        .filter(t => t.draw_id === Number(draw_id) && t.user_id === Number(user_id))
        .reduce((sum, t) => sum + t.count, 0);

      if (userTickets + Number(count) > draw.Tmax_joueur) {
        return sendJSON(res, 400, { error: 'Quota anti-baleine dépassé', max: draw.Tmax_joueur, already_bought: userTickets });
      }
      if (draw.Tvendus + Number(count) > draw.Tmax) {
        return sendJSON(res, 400, { error: 'Tirage complet (Tmax atteint)' });
      }
      if (user.oziki_balance < totalOziki) {
        return sendJSON(res, 400, { error: 'Solde Oziki insuffisant', required: totalOziki, balance: user.oziki_balance });
      }

      user.oziki_balance -= totalOziki;

      const hexCode = '0x' + Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 16).toString(16).toUpperCase()
      ).join('');

      db.tickets.push({
        id: db.tickets.length + 1, draw_id: Number(draw_id), user_id: Number(user_id),
        count: Number(count), amount_XAF: totalXAF, amount_Oziki: totalOziki,
        hex_code: hexCode, momoTx: `MM${Date.now()}`, createdAt: new Date().toISOString()
      });

      draw.Tvendus += Number(count);
      draw.CA = draw.Tvendus * draw.Ct_XAF;
      if (draw.Tvendus >= draw.Tmax) draw.status = 'locked';

      db.transactions.push({
        id: db.transactions.length + 1, user_id: Number(user_id),
        type: 'buy_ticket', amount: totalOziki,
        momoTx: `MM${Date.now()}`, status: 'completed', createdAt: new Date().toISOString()
      });

      writeDB(db);
      return sendJSON(res, 200, {
        success: true, ticket_id: db.tickets.length, draw_id: Number(draw_id),
        user_id: Number(user_id), count: Number(count), total_XAF: totalXAF,
        total_Oziki: totalOziki, hex_code: hexCode,
        remaining: draw.Tmax - draw.Tvendus, status: draw.status
      });
    }

    // --- EXECUTE DRAW (Nzadi) ---
    if (pathname.match(/^\/api\/draw\/\d+$/) && method === 'POST') {
      const drawId = Number(pathname.split('/').pop());
      const draw = db.draws.find(d => d.id === drawId);
      if (!draw) return sendJSON(res, 404, { error: 'Tirage non trouvé' });
      if (draw.status === 'drawn') return sendJSON(res, 400, { error: 'Tirage déjà effectué' });

      const tickets = db.tickets.filter(t => t.draw_id === drawId);
      if (tickets.length === 0) return sendJSON(res, 400, { error: 'Aucun ticket vendu' });

      const seedServeur = `serveur_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const allHex = tickets.flatMap(t => Array.from({ length: t.count }, () => t.hex_code));
      const winnerHex = allHex[Math.floor(Math.random() * allHex.length)];
      const winnerTicket = tickets.find(t => t.hex_code === winnerHex) || tickets[0];
      const winnerUser = db.users.find(u => u.id === winnerTicket.user_id);

      draw.status = 'drawn';
      draw.seed_serveur = seedServeur;
      draw.hash_nzadi = crypto.createHash('sha256').update(seedServeur + draw.seed_client).digest('hex');
      draw.winner_id = winnerUser.id;
      draw.drawAt = new Date().toISOString();

      db.winners.push({
        draw_id: drawId, user_id: winnerUser.id, lot: draw.title, paidAt: new Date().toISOString()
      });

      writeDB(db);
      return sendJSON(res, 200, {
        success: true, draw_id: drawId, seed_serveur: seedServeur,
        hash_nzadi: draw.hash_nzadi,
        winner: { user_id: winnerUser.id, name: winnerUser.name, hex_code: winnerHex },
        total_tickets: allHex.length, message: 'Nzadi Provably Fair — Vérifiable!'
      });
    }

    // --- CREATE DRAW (Admin) ---
    if (pathname === '/api/draws' && method === 'POST') {
      const { title, description, P, I, Wmax, lot_type, seed_client } = await readBody(req);
      if (!title || !P || !I) return sendJSON(res, 400, { error: 'Champs requis: title, P, I' });

      const Utotal = db.users.length;
      const engine = ebaleEngine(Number(P), Number(I), Utotal, Number(Wmax) || 1);

      const newDraw = {
        id: db.draws.length + 1, title, description: description || '',
        P: Number(P), I: Number(I), Wmax: Number(Wmax) || 1, Utotal,
        Ct_XAF: engine.Ct_XAF, Ct_Oziki: engine.Ct_Oziki,
        Tpalier: engine.Tpalier, Tmax: engine.Tmax,
        Wmax_sugg: engine.Wmax_sugg, Tmax_joueur: engine.Tmax_joueur,
        Tvendus: 0, CA: 0, status: 'open', lot_type: lot_type || 'physical',
        hash_nzadi: null, seed_serveur: null,
        seed_client: seed_client || `block_btc_${850000 + Math.floor(Math.random() * 1000)}`,
        createdAt: new Date().toISOString(), drawAt: null
      };

      db.draws.push(newDraw);
      writeDB(db);
      return sendJSON(res, 201, newDraw);
    }

    // --- CRUD: GET ALL DRAWS ---
    if (pathname === '/api/draws' && method === 'GET') {
      return sendJSON(res, 200, db.draws);
    }

    // --- CRUD: GET ALL USERS ---
    if (pathname === '/api/users' && method === 'GET') {
      return sendJSON(res, 200, db.users);
    }

    // --- CRUD: GET SINGLE DRAW ---
    const drawMatch = pathname.match(/^\/api\/draws\/(\d+)$/);
    if (drawMatch && method === 'GET') {
      const draw = db.draws.find(d => d.id === Number(drawMatch[1]));
      if (!draw) return sendJSON(res, 404, { error: 'Tirage non trouvé' });
      return sendJSON(res, 200, draw);
    }

    // --- DELETE DRAW ---
    if (drawMatch && method === 'DELETE') {
      const idx = db.draws.findIndex(d => d.id === Number(drawMatch[1]));
      if (idx === -1) return sendJSON(res, 404, { error: 'Tirage non trouvé' });
      db.draws.splice(idx, 1);
      writeDB(db);
      return sendJSON(res, 200, { success: true });
    }

    // --- GET TICKETS ---
    if (pathname === '/api/tickets' && method === 'GET') {
      return sendJSON(res, 200, db.tickets);
    }

    // --- GET WINNERS ---
    if (pathname === '/api/winners' && method === 'GET') {
      return sendJSON(res, 200, db.winners);
    }

    // --- HEALTH ---
    if (pathname === '/api/health' && method === 'GET') {
      return sendJSON(res, 200, { status: 'ok', service: 'winu', version: '1.0.0' });
    }

    // --- DEFAULT: 404 ---
    return sendJSON(res, 404, { error: 'Route non trouvée', pathname, method });

  } catch (e) {
    console.error('Erreur:', e);
    return sendJSON(res, 500, { error: 'Erreur serveur', message: e.message });
  }
}

// ============================================
// SERVEUR
// ============================================
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║                                                  ║
  ║   🎰 WINU — Loterie Solidaire Congo             ║
  ║   Backend Simulé (Node.js natif — 0 deps)        ║
  ║                                                  ║
  ║   Port:  ${PORT}                                   
  ║   API:   http://localhost:${PORT}/api            
  ║   Stats: http://localhost:${PORT}/api/stats      
  ║                                                  ║
  ╚══════════════════════════════════════════════════╝
  `);
});
