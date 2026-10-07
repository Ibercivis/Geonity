class Category {
  final int id;
  final String name;
  final String icon; // SVG asset path
  final int projectCount;

  Category({
    required this.id,
    required this.name,
    required this.icon,
    this.projectCount = 0,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    final id = json['id'] ?? 0;
    return Category(
      id: id,
      name: json['topic'] ?? '',
      icon: _getIconForId(id),
      projectCount: json['project_count'] ?? 0,
    );
  }

  static String _getIconForId(int id) {
    switch (id) {
      case 1:  return 'assets/icons/leaf.svg';             // Ecología y Medio Ambiente
      case 2:  return 'assets/icons/rabbit.svg';           // Biodiversidad
      case 3:  return 'assets/icons/graduation-cap.svg';   // Educación
      case 4:  return 'assets/icons/microscope.svg';       // Biología
      case 5:  return 'assets/icons/book.svg';             // Ciencias Sociales
      case 6:  return 'assets/icons/thermometer.svg';      // Clima y Meteorología
      case 7:  return 'assets/icons/paw-print.svg';        // Animales
      case 8:  return 'assets/icons/scan-heart.svg';       // Salud y Medicina
      case 9:  return 'assets/icons/tractor.svg';          // Agricultura
      case 10: return 'assets/icons/utensils.svg';         // Alimentación
      case 11: return 'assets/icons/shovel.svg';           // Arqueología
      case 12: return 'assets/icons/telescope.svg';        // Astronomía y Espacio
      case 13: return 'assets/icons/bird.svg';             // Aves
      case 14: return 'assets/icons/globe.svg';            // Biogeografía
      case 15: return 'assets/icons/landmark.svg';         // Ciencias Políticas
      case 16: return 'assets/icons/users.svg';            // Culturas Indígenas
      case 17: return 'assets/icons/dna.svg';              // Genética
      case 18: return 'assets/icons/map.svg';              // Geografía
      case 19: return 'assets/icons/mountain.svg';         // Geología y Ciencias de la Tierra
      case 20: return 'assets/icons/sprout.svg';           // Gestión de los Recursos Naturales
      case 21: return 'assets/icons/cpu.svg';              // Información y Ciencias de la Computación
      case 22: return 'assets/icons/bug.svg';              // Insectos y Polinizadores
      case 23: return 'assets/icons/activity.svg';         // Monitorización de Especies a Largo Plazo
      case 24: return 'assets/icons/tree-pine.svg';        // Naturaleza y Aire Libre
      case 25: return 'assets/icons/waves.svg';            // Océano, Agua, Mar y Tierra
      case 26: return 'assets/icons/atom.svg';             // Física
      case 27: return 'assets/icons/flask-conical.svg';    // Química
      case 28: return 'assets/icons/audio-waveform.svg';   // Sonido
      case 29: return 'assets/icons/car.svg';              // Transporte
      default: return 'assets/icons/layers.svg';
    }
  }

  static List<Category> getMockCategories() {
    return [
      Category(id: 1, name: 'Ecología y Medio Ambiente', icon: _getIconForId(1)),
      Category(id: 2, name: 'Biodiversidad', icon: _getIconForId(2)),
      Category(id: 3, name: 'Educación', icon: _getIconForId(3)),
      Category(id: 4, name: 'Biología', icon: _getIconForId(4)),
    ];
  }
}
