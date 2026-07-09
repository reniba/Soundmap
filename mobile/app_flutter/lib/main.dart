import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:soundmap/services/area_service.dart';
import 'widgets/custom_text_field.dart';
import 'widgets/elevated_button.dart';
import 'widgets/area_button.dart';
import 'widgets/start_button.dart';
import "widgets/profile_button.dart";

void main() {
  runApp(const SoundMapApp());
}

class SoundMapApp extends StatelessWidget {
  const SoundMapApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "SoundMapApp",
      initialRoute: '/',
      routes: <String, WidgetBuilder>{
        '/': (context) => const Scaffold(
          backgroundColor: Color(0xFF1E1E1E),
          body: Center(child: Login()),
        ),
        '/mainPage': (context) => MainPage(),
      },
    );
  }
}

class Login extends StatefulWidget {
  const Login({super.key});

  @override
  State<Login> createState() => _LoginState();
}

class _LoginState extends State<Login> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SvgPicture.asset(
              'assets/logo.svg',
              width: 36,
              height: 36,
              colorFilter: const ColorFilter.mode(
                Colors.white,
                BlendMode.srcIn,
              ),
            ),
            const SizedBox(width: 10),
            const Text(
              "SoundMap",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const Text(
              " IoT",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w100,
                color: Colors.white,
              ),
            ),
          ],
        ),
        const SizedBox(height: 40),
        CustomTextField(
          placeholder: 'E-mail',
          obscure: false,
          textController: _emailController,
        ),
        const SizedBox(height: 10),
        CustomTextField(
          placeholder: 'Senha',
          obscure: true,
          textController: _passwordController,
        ),
        const SizedBox(height: 70),
        LoginElevatedButton(
          emailController: _emailController,
          passwordController: _passwordController,
        ),
      ],
    );
  }
}

class MainPage extends StatefulWidget {
  const MainPage({super.key});

  @override
  State<MainPage> createState() => _MainPageState();
}

class _MainPageState extends State<MainPage> {
  bool isRecording = false;
  List<Area> areaList = [];
  Area? selectedArea;

  void _setSelectedArea(Area area) {
    setState(() {
      selectedArea = area;
    });
  }

  void _setIsRecording(bool newState) {
    setState(() {
      isRecording = newState;
    });
  }

  @override
  void initState() {
    super.initState();
    _fetchAreas();
  }

  Future<void> _fetchAreas() async {
    try {
      final list = await fetchAreas();

      setState(() {
        areaList = list;
      });
    } catch (error) {
      throw Exception("Erro ao carregar as áreas");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFF1E1E1E),
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Padding(
            padding: EdgeInsets.only(top: 40, bottom: 10, left: 20, right: 20),
            child: Row(
              children: [
                Expanded(
                  child: AreaButtonAndMenu(
                    isRecording: isRecording,
                    setIsRecording: _setIsRecording,
                    areaList: areaList,
                    setSelectedArea: _setSelectedArea,
                    currentArea: selectedArea,
                  ),
                ),
                SizedBox(width: 20),
                ProfileButton(),
              ],
            ),
          ),
          const Spacer(flex: 1),
          DynamicSoundButton(
            isRecording: isRecording,
            setIsRecording: _setIsRecording,
            currentArea: selectedArea,
          ),
          const Spacer(flex: 1),
        ],
      ),
    );
  }
}
