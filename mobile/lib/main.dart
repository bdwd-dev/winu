import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(const WinuApp());
}

class WinuApp extends StatelessWidget {
  const WinuApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Winu',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFFF6B35),
          brightness: Brightness.light,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFFFF6B35),
          foregroundColor: Colors.white,
          centerTitle: true,
        ),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFFF6B35),
          brightness: Brightness.dark,
        ),
      ),
      themeMode: ThemeMode.dark,
      home: const HomeScreen(),
    );
  }
}

// ============================================
// API SERVICE
// ============================================
class ApiService {
  static const String baseUrl = 'http://localhost:3000/api';

  static Future<dynamic> get(String endpoint) async {
    final response = await http.get(Uri.parse('$baseUrl$endpoint'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Erreur GET $endpoint');
  }

  static Future<dynamic> post(String endpoint, Map<String, dynamic> body) async {
    final response = await http.post(
      Uri.parse('$baseUrl$endpoint'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(body),
    );
    if (response.statusCode == 200 || response.statusCode == 201) {
      return json.decode(response.body);
    }
    throw Exception('Erreur POST $endpoint');
  }
}

// ============================================
// HOME SCREEN
// ============================================
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  Map<String, dynamic>? stats;
  List<dynamic> draws = [];
  int userId = 1;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final statsData = await ApiService.get('/stats');
      final drawsData = await ApiService.get('/draws');
      setState(() {
        stats = statsData;
        draws = drawsData;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.diamond, color: Colors.amber),
            const SizedBox(width: 8),
            const Text('WINU', style: TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            margin: const EdgeInsets.only(right: 16),
            decoration: BoxDecoration(
              color: Colors.green,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              '${stats?['oziki']?['total_circulating'] ?? 0} Oz',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
      body: _currentIndex == 0
          ? _buildHomeTab()
          : _currentIndex == 1
              ? _buildDrawsTab()
              : _buildProfileTab(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        selectedItemColor: const Color(0xFFFF6B35),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Accueil'),
          BottomNavigationBarItem(icon: Icon(Icons.card_giftcard), label: 'Tirages'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profil'),
        ],
      ),
    );
  }

  Widget _buildHomeTab() {
    if (stats == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Tente ta chance !',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            'Loterie solidaire congolaise — Tirage Nzadi vérifiable',
            style: TextStyle(color: Colors.grey[400]),
          ),
          const SizedBox(height: 24),

          // Stats Grid
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            children: [
              _StatCard(
                icon: Icons.people,
                color: Colors.orange,
                value: '${stats!['users']['total']}',
                label: 'Joueurs',
              ),
              _StatCard(
                icon: Icons.card_giftcard,
                color: Colors.green,
                value: '${stats!['draws']['open']}',
                label: 'Tirages ouverts',
              ),
              _StatCard(
                icon: Icons.confirmation_number,
                color: Colors.blue,
                value: '${stats!['tickets']['total']}',
                label: 'Tickets vendus',
              ),
              _StatCard(
                icon: Icons.attach_money,
                color: Colors.purple,
                value: '${(stats!['tickets']['revenue_XAF'] / 1000).toStringAsFixed(0)}k',
                label: 'CA (XAF)',
              ),
            ],
          ),

          const SizedBox(height: 24),
          const Text(
            'Tirages en cours',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),

          ...draws.where((d) => d['status'] == 'open').take(2).map((draw) {
            return _DrawListTile(draw: draw, onTap: () => _showBuyDialog(draw));
          }),
        ],
      ),
    );
  }

  Widget _buildDrawsTab() {
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: draws.length,
        itemBuilder: (context, index) {
          final draw = draws[index];
          return _DrawListTile(
            draw: draw,
            onTap: () => _showBuyDialog(draw),
          );
        },
      ),
    );
  }

  Widget _buildProfileTab() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircleAvatar(
            radius: 50,
            backgroundColor: Color(0xFFFF6B35),
            child: Icon(Icons.person, size: 50, color: Colors.white),
          ),
          const SizedBox(height: 16),
          const Text('Jean M.', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text('+242 06 123 4567', style: TextStyle(color: Colors.grey[400])),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.diamond),
            label: const Text('Acheter Oziki'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
          ),
        ],
      ),
    );
  }

  void _showBuyDialog(Map<String, dynamic> draw) {
    int count = 1;
    final ctOziki = draw['Ct_Oziki'] as int;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Text(draw['title']),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(draw['description'] ?? ''),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      IconButton(
                        onPressed: () {
                          if (count > 1) setDialogState(() => count--);
                        },
                        icon: const Icon(Icons.remove_circle_outline),
                      ),
                      Text('$count', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                      IconButton(
                        onPressed: () {
                          setDialogState(() => count++);
                        },
                        icon: const Icon(Icons.add_circle_outline),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('Total: ${ctOziki * count} Oziki'),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Annuler'),
                ),
                ElevatedButton(
                  onPressed: () async {
                    try {
                      await ApiService.post('/buy-ticket', {
                        'user_id': userId,
                        'draw_id': draw['id'],
                        'count': count,
                      });
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Ticket acheté !')),
                      );
                      _loadData();
                    } catch (e) {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Erreur: $e')),
                      );
                    }
                  },
                  child: const Text('Acheter'),
                ),
              ],
            );
          },
        );
      },
    );
  }
}

// ============================================
// WIDGETS
// ============================================
class _StatCard extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String value;
  final String label;

  const _StatCard({
    required this.icon,
    required this.color,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            Text(label, style: TextStyle(color: Colors.grey[400], fontSize: 12)),
          ],
        ),
      ),
    );
  }
}

class _DrawListTile extends StatelessWidget {
  final Map<String, dynamic> draw;
  final VoidCallback onTap;

  const _DrawListTile({required this.draw, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final status = draw['status'];
    final statusColor = status == 'open' ? Colors.green : status == 'locked' ? Colors.orange : Colors.grey;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: statusColor.withOpacity(0.2),
          child: Icon(Icons.card_giftcard, color: statusColor),
        ),
        title: Text(draw['title'], style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text('${draw['Ct_XAF']} XAF • ${draw['Tvendus']}/${draw['Tmax']} tickets'),
        trailing: Text(
          status == 'open' ? 'Ouvert' : status == 'locked' ? 'Complet' : 'Terminé',
          style: TextStyle(color: statusColor, fontWeight: FontWeight.bold),
        ),
        onTap: status == 'open' ? onTap : null,
      ),
    );
  }
}
