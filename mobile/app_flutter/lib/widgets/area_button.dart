import 'package:flutter/material.dart';
import 'dart:convert';

Widget buildAreaImage(String image) {
  print("INICIO DA STRING:");
  print(image.substring(0, 50));

  print("TAMANHO:");
  print(image.length);

  if (image.startsWith('data:image')) {
    final bytes = base64Decode(image.split(',')[1]);

    print("BYTES:");
    print(bytes.length);

    return Image.memory(
      bytes,
      width: 70,
      height: 40,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) {
        print("ERRO MEMORY:");
        print(error);

        return const Icon(Icons.error);
      },
    );
  }

  return Image.network(
    image,
    width: 70,
    height: 40,
    fit: BoxFit.cover,
    errorBuilder: (context, error, stackTrace) {
      print("ERRO NETWORK:");
      print(error);

      return const Icon(Icons.error);
    },
  );
}

class AreaButton extends StatelessWidget {
  final bool selected;
  final Area area;
  final int areasNumber;

  const AreaButton({
    super.key,
    required this.selected,
    required this.area,
    required this.areasNumber,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(top: 3, bottom: 3, left: 10, right: 10),
      decoration: BoxDecoration(
        color: selected
            ? Color(0xFF2B2C2F)
            : const Color.fromARGB(255, 75, 73, 68),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: Colors.white, width: 1),
      ),
      child: Row(
        children: [
          Container(
            width: 70,
            height: 40,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(4),
              border: Border.all(
                color: const Color.fromARGB(255, 192, 192, 192),
                width: 1,
              ),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8.0),
              child: buildAreaImage(area.url),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              area.name,
              style: TextStyle(color: Colors.white, fontSize: 20),
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
            ),
          ),

          if (selected && areasNumber > 1) ...[
            Icon(Icons.arrow_drop_down, color: Colors.white, size: 20),
          ],
        ],
      ),
    );
  }
}

class Area {
  final String name;
  final int id;
  final String url;

  const Area({required this.name, required this.id, required this.url});

  factory Area.fromJson(Map<String, dynamic> json) {
    return Area(
      id: json['id'] as int,
      name: json['name'] as String,
      url: json['url'] as String,
    );
  }
}

class AreaButtonAndMenu extends StatefulWidget {
  final bool isRecording;
  final void Function(bool) setIsRecording;
  final List<Area> areaList;
  final Function setSelectedArea;
  final Area? currentArea;

  const AreaButtonAndMenu({
    super.key,
    required this.isRecording,
    required this.setIsRecording,
    required this.areaList,
    required this.setSelectedArea,
    required this.currentArea,
  });

  @override
  State<AreaButtonAndMenu> createState() => _AreaButtonAndMenuState();
}

class _AreaButtonAndMenuState extends State<AreaButtonAndMenu> {
  final GlobalKey _buttonKey = GlobalKey();

  double _buttonWidth = 0;

  final OverlayPortalController _overlayPortalController =
      OverlayPortalController();
  final LayerLink _layerLink = LayerLink();

  @override
  void initState() {
    super.initState();
    if (widget.areaList.isNotEmpty && widget.currentArea == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        widget.setSelectedArea(widget.areaList[0]);
      });
    }
  }

  @override
  void didUpdateWidget(AreaButtonAndMenu oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.areaList.isNotEmpty && widget.currentArea == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        widget.setSelectedArea(widget.areaList[0]);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Caso não haja nenhuma área cadastrada, avisa o usuário
    if (widget.currentArea == null && widget.areaList.isEmpty) {
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
        decoration: BoxDecoration(
          color: const Color(0xFF2B2C2F), // Tom grafite que combina com o app
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: Colors.amber.withOpacity(0.8),
            width: 1,
          ), // Borda sutil de aviso
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize
              .min, // Faz o container se ajustar ao tamanho do texto
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.amber, size: 22),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                "Nenhuma área cadastrada",
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                ),
                overflow: TextOverflow.ellipsis,
                maxLines: 1,
              ),
            ),
          ],
        ),
      );
    }

    if (widget.currentArea == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return CompositedTransformTarget(
      link: _layerLink,
      child: OverlayPortal(
        controller: _overlayPortalController,
        overlayChildBuilder: (context) {
          return CompositedTransformFollower(
            link: _layerLink,
            targetAnchor: Alignment.bottomLeft,
            followerAnchor: Alignment.topLeft,
            child: Align(
              alignment: AlignmentGeometry.topLeft,
              child: _buildAreaOptions(),
            ),
          );
        },
        child: GestureDetector(
          key: _buttonKey,
          onTap: () {
            _updateWidth();
            _overlayPortalController.toggle();
          },
          child: AreaButton(
            selected: true,
            area: widget.currentArea!,
            areasNumber: widget.areaList.length,
          ),
        ),
      ),
    );
  }

  void _updateWidth() {
    final context = _buttonKey.currentContext;
    if (context != null) {
      final box = context.findRenderObject() as RenderBox;
      _buttonWidth = box.size.width;
    }
  }

  void _switchArea(int areaId) {
    widget.setSelectedArea(widget.areaList.firstWhere((a) => a.id == areaId));
    widget.setIsRecording(false);
  }

  Widget _buildAreaOptions() {
    return Container(
      width: _buttonWidth,
      height: widget.areaList.length > 3
          ? 144
          : (46 * (widget.areaList.length - 1)).toDouble(),
      margin: EdgeInsets.only(top: 3),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(7),
      ),
      child: SingleChildScrollView(
        child: Column(
          children: widget.areaList
              .where((a) => a.id != widget.currentArea!.id)
              .map(
                (a) => GestureDetector(
                  onTap: () {
                    _switchArea(a.id);
                    _overlayPortalController.hide();
                  },
                  child: AreaButton(
                    selected: false,
                    area: a,
                    areasNumber: widget.areaList.length,
                  ),
                ),
              )
              .toList(),
        ),
      ),
    );
  }
}
