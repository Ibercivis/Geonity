import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../models/project.dart';
import '../screens/project_detail_screen.dart';
import '../services/offline_service.dart';

class ProjectCard extends StatefulWidget {
  final Project project;
  final EdgeInsets? margin;
  final VoidCallback? onProjectDeleted;

  const ProjectCard({
    super.key,
    required this.project,
    this.margin,
    this.onProjectDeleted,
  });

  @override
  State<ProjectCard> createState() => _ProjectCardState();
}

class _ProjectCardState extends State<ProjectCard> {
  bool _isOffline = false;

  @override
  void initState() {
    super.initState();
    OfflineService()
        .isProjectOffline(widget.project.id)
        .then((v) { if (mounted) setState(() => _isOffline = v); });
  }

  @override
  Widget build(BuildContext context) {
    final project = widget.project;
    return Card(
      margin: widget.margin ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ProjectDetailScreen(projectId: project.id),
            ),
          );
          if (result == true && widget.onProjectDeleted != null) {
            widget.onProjectDeleted!();
          }
          // Refresh offline badge after returning
          final offline = await OfflineService().isProjectOffline(project.id);
          if (mounted) setState(() => _isOffline = offline);
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              // Imagen del proyecto
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: project.coverImage != null
                        ? CachedNetworkImage(
                            imageUrl: project.coverImage!,
                            width: 100,
                            height: 100,
                            fit: BoxFit.cover,
                            errorWidget: (context, url, error) => Container(
                              width: 100,
                              height: 100,
                              color: Theme.of(context).colorScheme.surfaceContainerHighest,
                              child: const Icon(Icons.image, size: 40),
                            ),
                          )
                        : Container(
                            width: 100,
                            height: 100,
                            color: Theme.of(context).colorScheme.surfaceContainerHighest,
                            child: const Icon(Icons.image, size: 40),
                          ),
                  ),
                  if (_isOffline)
                    Positioned(
                      top: 4,
                      right: 4,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          color: Colors.green,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Icon(Icons.offline_pin, size: 14, color: Colors.white),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 12),
              // Info del proyecto
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      project.name,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    if (project.description != null)
                      Text(
                        project.description!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 13,
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.people, size: 16, color: Theme.of(context).colorScheme.onSurfaceVariant),
                        const SizedBox(width: 4),
                        Text('${project.contributions}',
                            style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                        const SizedBox(width: 16),
                        Icon(Icons.favorite, size: 16, color: Theme.of(context).colorScheme.onSurfaceVariant),
                        const SizedBox(width: 4),
                        Text('${project.totalLikes}',
                            style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                        const Spacer(),
                        TextButton(
                          onPressed: () async {
                            final result = await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) =>
                                    ProjectDetailScreen(projectId: project.id),
                              ),
                            );
                            if (result == true && widget.onProjectDeleted != null) {
                              widget.onProjectDeleted!();
                            }
                          },
                          child: Text(AppLocalizations.of(context)!.more),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
