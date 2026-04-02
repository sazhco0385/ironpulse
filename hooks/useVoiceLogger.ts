import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

export type VoiceLogResult = {
  reps?: number;
  weight?: number;
  raw: string;
};

function parseTranscription(text: string): VoiceLogResult {
  const t = text.toLowerCase().replace(",", ".").trim();

  const repPatterns = [
    /(\d+)\s*(?:wiederholungen?|wdh|rep(?:s)?|mal)/i,
    /^(\d+)$/,
    /(\d+)\s*reps?/i,
  ];
  const weightPatterns = [
    /(\d+(?:\.\d+)?)\s*(?:kilo(?:gramm)?|kg)/i,
    /(\d+(?:\.\d+)?)\s*k\b/i,
  ];

  let reps: number | undefined;
  let weight: number | undefined;

  for (const p of repPatterns) {
    const m = t.match(p);
    if (m) { reps = parseInt(m[1], 10); break; }
  }
  for (const p of weightPatterns) {
    const m = t.match(p);
    if (m) { weight = parseFloat(m[1]); break; }
  }

  return { reps, weight, raw: text };
}

export function useVoiceLogger() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = useCallback(async () => {
    if (Platform.OS === "web") {
      setError("Spracheingabe auf Web nicht verfügbar");
      return;
    }
    try {
      setError(null);
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        setError("Mikrofon-Zugriff verweigert");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (e) {
      setError("Aufnahme konnte nicht gestartet werden");
    }
  }, []);

  const stopAndTranscribe = useCallback(async (): Promise<VoiceLogResult | null> => {
    if (!recordingRef.current) return null;
    try {
      setIsRecording(false);
      setIsProcessing(true);

      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error("Keine Aufnahme-URI");

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const res = await fetch(`${BASE_URL}/api/whisper/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64, filename: "recording.m4a" }),
      });

      if (!res.ok) throw new Error("Transkription fehlgeschlagen");
      const data = await res.json() as { text: string };
      const result = parseTranscription(data.text);
      return result;
    } catch (e) {
      setError("Spracherkennung fehlgeschlagen");
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const cancelRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.stopAndUnloadAsync();
    } catch {}
    recordingRef.current = null;
    setIsRecording(false);
    setIsProcessing(false);
  }, []);

  return { isRecording, isProcessing, error, startRecording, stopAndTranscribe, cancelRecording };
}
