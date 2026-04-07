import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../services/organization_service.dart';
import '../models/organization.dart';
import '../widgets/organization_card.dart';
import 'organization_detail_screen.dart';
import 'create_organization_screen.dart';

class OrganizationsPage extends StatefulWidget {
  const OrganizationsPage({super.key});

  @override
  State<OrganizationsPage> createState() => _OrganizationsPageState();
}

class _OrganizationsPageState extends State<OrganizationsPage> {
  final _organizationService = OrganizationService();
  List<Organization> _organizations = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadOrganizations();
  }

  Future<void> _loadOrganizations() async {
    try {
      final organizations = await _organizationService.getOrganizations();
      setState(() {
        _organizations = organizations;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error loading organizations: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadOrganizations,
              child: CustomScrollView(
                slivers: [
                  // Header
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(24, 60, 24, 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  AppLocalizations.of(context)!.organizationsTitle,
                                  style: TextStyle(
                                    fontSize: 32,
                                    fontWeight: FontWeight.bold,
                                    color: Theme.of(context).colorScheme.onSurface,
                                  ),
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.add_circle_outline, size: 32),
                                onPressed: () async {
                                  await Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => const CreateOrganizationScreen(),
                                    ),
                                  );
                                  _loadOrganizations();
                                },
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '${_organizations.length} organizaciones colaboradoras',
                            style: TextStyle(
                              fontSize: 16,
                              color: Theme.of(context).colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Grid de organizaciones
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    sliver: SliverGrid(
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        mainAxisSpacing: 20,
                        crossAxisSpacing: 20,
                        childAspectRatio: 0.85,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final org = _organizations[index];
                          return OrganizationCard(
                            organization: org,
                            userRole: org.userRole,
                            onDeleted: () {
                              // Recargar la lista cuando se elimina una organización
                              _loadOrganizations();
                            },
                          );
                        },
                        childCount: _organizations.length,
                      ),
                    ),
                  ),

                  // Espaciado final
                  const SliverToBoxAdapter(
                    child: SizedBox(height: 32),
                  ),
                ],
              ),
            ),
    );
  }
}
