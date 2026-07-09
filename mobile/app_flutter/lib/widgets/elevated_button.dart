import 'package:flutter/material.dart';
import '../services/login_service.dart';

class LoginElevatedButton extends StatelessWidget {
  final TextEditingController emailController;
  final TextEditingController passwordController;

  const LoginElevatedButton({
    super.key,
    required this.emailController,
    required this.passwordController,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: () async {
        final emailOrUsername = emailController.text.trim();
        final password = passwordController.text;

        final auth = await LoginService().login(emailOrUsername, password);

        if (!context.mounted) return;

        if (auth) {
          Navigator.pushNamed(context, '/mainPage');
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text("E-mail ou senha incorretos!"),
              backgroundColor: Colors.redAccent,
            ),
          );
        }
      },
      style: ElevatedButton.styleFrom(
        fixedSize: const Size(300, 50),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        backgroundColor: const Color(0xFF42A5F5),
      ),
      child: const Text("Entrar", style: TextStyle(color: Colors.black)),
    );
  }
}
