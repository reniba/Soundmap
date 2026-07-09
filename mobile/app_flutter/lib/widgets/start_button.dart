import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';
import 'dart:async';
import 'package:geolocator/geolocator.dart';
import '../services/send_data_service.dart';
import './area_button.dart';

class SoundButton extends StatelessWidget {
  final double intensity;
  final double db;
  final VoidCallback onTap;
  final bool isRecording;

  const SoundButton({
    super.key,
    required this.intensity,
    required this.db,
    required this.onTap,
    this.isRecording = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          isRecording
              ? "Clique aqui para finalizar"
              : "Clique aqui para iniciar",
          style: const TextStyle(fontSize: 20, color: Colors.white),
        ),
        const SizedBox(height: 60),

        SizedBox(
          width: 200,
          height: 200,
          child: GestureDetector(
            onTap: onTap,
            child: Stack(
              alignment: Alignment.center,
              clipBehavior: Clip.none,
              children: [
                if (isRecording && db > 0) ...[
                  _buildWave(1.5, 0.4),
                  _buildWave(1.0, 0.6),
                ],

                Container(
                  width: 180,
                  height: 180,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFF4D565C),
                    border: Border.all(
                      color: const Color(0xFF686F74),
                      width: 5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF7A8083),
                        blurRadius: 20,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  child: Center(
                    child: SvgPicture.asset(
                      "assets/logo.svg",
                      colorFilter: const ColorFilter.mode(
                        Colors.white,
                        BlendMode.srcIn,
                      ),
                      width: 110,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        // Área da intensidade (com Opacity para não pular o layout)
        Opacity(
          opacity: isRecording ? 1.0 : 0.0,
          child: Column(
            children: [
              const SizedBox(height: 130),
              Text(
                "${db.toStringAsFixed(1)} dB",
                style: const TextStyle(color: Colors.white, fontSize: 30),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildWave(double multiplier, double baseOpacity) {
    double baseSize = 180;
    double finalSize = baseSize + (intensity * 10 * multiplier);

    return Container(
      width: finalSize,
      height: finalSize,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: const Color(
          0xFF686F74,
        ).withOpacity((baseOpacity * (1 - (intensity / 20))).clamp(0.0, 1.0)),
        border: Border.all(color: Colors.white.withOpacity(0.1), width: 2),
      ),
    );
  }
}

class DynamicSoundButton extends StatefulWidget {
  final bool? isRecording;
  final void Function(bool) setIsRecording;
  final Area? currentArea;

  const DynamicSoundButton({
    super.key,
    required this.setIsRecording,
    this.isRecording = false,
    required this.currentArea,
  });

  @override
  State<DynamicSoundButton> createState() => _DynamicSoundButton();
}

class _DynamicSoundButton extends State<DynamicSoundButton> {
  double _intensity = 0;
  double _db = 55;
  Timer? _timer;
  final AudioRecorder _audioRecorder = AudioRecorder();

  String? _sensorTempId;
  double? _latitude;
  double? _longitude;

  bool _isProcessing = false;

  double _converterAmplitudeParaEscala(double decibeis) {
    double escala = (decibeis + 40).clamp(0, 40) / 4;
    return escala;
  }

  double _converterParaDb(double amplitude) {
    final normalizado = ((amplitude + 60) / 60).clamp(0.0, 1.0);
    return 55 + normalizado * 40;
  }

  String _generateSensorTempId(double lat, double lng) {
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    return "$lat-$lng-$timestamp".hashCode.toString();
  }

  Future<void> _alternarGravacao() async {
    if (_isProcessing) return;

    if (widget.isRecording ?? false) {
      _parar();
    } else {
      _iniciar();
    }
  }

  Future<void> _iniciar() async {
    if (widget.currentArea == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Selecione uma área antes de iniciar a gravação"),
        ),
      );
      return;
    }

    try {
      setState(() {
        _isProcessing = true;
      });

      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() => _isProcessing = false);
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() => _isProcessing = false);
          return;
        }
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.low,
        timeLimit: const Duration(seconds: 5),
      );

      if (await _audioRecorder.hasPermission()) {
        final directory = await getTemporaryDirectory();
        final path = '${directory.path}/audio_temp.m4a';

        _latitude = position.latitude;
        _longitude = position.longitude;
        _sensorTempId = _generateSensorTempId(_latitude!, _longitude!);

        await _audioRecorder.start(const RecordConfig(), path: path);

        // Atualiza o estado global da gravação
        widget.setIsRecording(true);

        _timer = Timer.periodic(const Duration(milliseconds: 50), (
          timer,
        ) async {
          final amplitude = await _audioRecorder.getAmplitude();

          final db = _converterParaDb(amplitude.current);

          if (mounted) {
            setState(() {
              _db = db;
              _intensity = _converterAmplitudeParaEscala(amplitude.current);
            });
          }

          await SendDataService().sendDataToAPI(
            _sensorTempId!,
            _latitude!,
            _longitude!,
            widget.currentArea!.id,
            _db,
          );
        });
      }
    } catch (e) {
      debugPrint("Erro ao iniciar gravação: $e");
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing =
              false; // Desbloqueia o botão após finalizar todo o fluxo
        });
      }
    }
  }

  Future<void> _parar() async {
    try {
      setState(() {
        _isProcessing = true;
      });

      _timer?.cancel();
      await _audioRecorder.stop();

      widget.setIsRecording(false);
      if (mounted) {
        setState(() {
          _intensity = 0;
          _db = 55;
        });
      }
    } catch (e) {
      debugPrint("Erro ao parar gravação: $e");
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _audioRecorder.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SoundButton(
      intensity: _intensity,
      db: _db,
      onTap: _alternarGravacao,
      isRecording: widget.isRecording ?? false,
    );
  }
}
