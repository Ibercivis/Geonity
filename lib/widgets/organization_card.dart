import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../models/organization.dart';
import '../screens/organization_detail_screen.dart';

class OrganizationCard extends StatelessWidget {
  final Organization organization;
  final String? userRole;
  final VoidCallback? onDeleted;

  const OrganizationCard({
    super.key,
    required this.organization,
    this.userRole,
    this.onDeleted,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        final result = await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => OrganizationDetailScreen(
              organizationId: organization.id,
            ),
          ),
        );
        
        // Si se eliminó la organización, llamar al callback
        if (result == true && onDeleted != null) {
          onDeleted!();
        }
      },
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.15),
              spreadRadius: 1,
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Logo circular
            Stack(
              children: [
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Theme.of(context).colorScheme.surfaceContainerLow,
                    image: organization.logo != null
                        ? DecorationImage(
                            image: CachedNetworkImageProvider(organization.logo!),
                            fit: BoxFit.cover,
                          )
                        : null,
                  ),
                  child: organization.logo == null
                      ? Icon(Icons.business, size: 40, color: Theme.of(context).colorScheme.onSurfaceVariant)
                      : null,
                ),
                // Badge de rol si existe
                if (userRole != null)
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: userRole == 'creator'
                            ? Colors.purple
                            : userRole == 'administrator'
                                ? Colors.blue
                                : Colors.green,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: Icon(
                        userRole == 'creator'
                            ? Icons.star
                            : userRole == 'administrator'
                                ? Icons.admin_panel_settings
                                : Icons.person,
                        size: 14,
                        color: Colors.white,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            // Nombre de la organización
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                organization.name,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
