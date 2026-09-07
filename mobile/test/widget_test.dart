import 'package:flutter_test/flutter_test.dart';
import 'package:winu_mobile/main.dart';

void main() {
  testWidgets('Winu app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const WinuApp());
    expect(find.text('WINU'), findsOneWidget);
  });
}
