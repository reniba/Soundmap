import "package:flutter/material.dart";
import "../services/auth_service.dart";

class ProfileButton extends StatefulWidget {
  const ProfileButton({super.key});

  @override
  State<ProfileButton> createState() => _ProfileButtonState();
}

class _ProfileButtonState extends State<ProfileButton> {
  final OverlayPortalController _overlayPortalController =
      OverlayPortalController();
  final _key = GlobalKey();
  bool _isHandlingTap = false;
  String _usernameInitial = "";

  (double, double) _getPosition() {
    final renderBox = _key.currentContext?.findRenderObject() as RenderBox?;
    if (renderBox == null) return (0, 0);
    final position = renderBox.localToGlobal(Offset.zero);
    final size = renderBox.size;
    return (position.dx, position.dy + size.height + 4);
  }

  void _handleTap() {
    if (_isHandlingTap) return;
    _isHandlingTap = true;
    _overlayPortalController.toggle();
    Future.delayed(Duration(milliseconds: 300), () {
      _isHandlingTap = false;
    });
  }

  @override
  void initState() {
    super.initState();
    _loadUsernameInitial();
  }

  Future<void> _loadUsernameInitial() async {
    final usernameInitial = await AuthService().getUsernameInitial();

    setState(() {
      _usernameInitial = usernameInitial.toUpperCase();
    });
  }

  @override
  Widget build(BuildContext context) {
    return OverlayPortal(
      controller: _overlayPortalController,
      overlayChildBuilder: (context) {
        final (left, top) = _getPosition();
        return Positioned(
          left: left - 10,
          top: top + 5,
          child: Container(
            decoration: BoxDecoration(
              color: const Color.fromARGB(255, 56, 71, 78),
              borderRadius: BorderRadius.circular(7),
            ),
            width: 60,
            height: 30,
            child: GestureDetector(
              onTap: () => Navigator.pushNamed(context, '/'),
              child: Center(
                child: Text(
                  "Sair",
                  style: TextStyle(
                    color: const Color.fromARGB(255, 199, 196, 196),
                  ),
                ),
              ),
            ),
          ),
        );
      },
      child: GestureDetector(
        key: _key,
        onTap: _handleTap,
        child: CircleAvatar(
          backgroundColor: Colors.orange,
          radius: 25,
          child: Text(_usernameInitial, style: TextStyle(fontSize: 20)),
        ),
      ),
    );
  }
}
