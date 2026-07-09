import 'package:flutter/material.dart';

class CustomTextField extends StatelessWidget {
  final String placeholder;
  final bool obscure;
  final TextEditingController textController;

  const CustomTextField({
    super.key,
    required this.placeholder,
    this.obscure = false,
    required this.textController,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 300,
      height: 50,
      child: TextField(
        controller: textController,
        style: const TextStyle(color: Colors.white),
        obscureText: obscure,
        cursorColor: Colors.white,
        decoration: InputDecoration(
          enabledBorder: OutlineInputBorder(
            borderSide: BorderSide(color: Colors.white),
          ),
          focusedBorder: OutlineInputBorder(
            borderSide: BorderSide(color: Colors.white),
          ),
          border: OutlineInputBorder(
            borderSide: BorderSide(color: Colors.white),
          ),
          labelText: placeholder,
          labelStyle: TextStyle(color: Colors.white),
        ),
      ),
    );
  }
}
