import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Dimensions, Alert, ScrollView } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Video } from 'expo-av';
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system';
import { StatusBar } from 'expo-status-bar';

// For Android Emulator, localhost is 10.0.2.2. If running on a real device, replace with your local network IP.
const API_BASE_URL = "http://10.0.2.2:5000/api/interviews";
const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB

export default function App() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [candidate, setCandidate] = useState(null);
  const [job, setJob] = useState(null);
  const [questions, setQuestions] = useState([]);

  // App steps: welcome, permissions, instructions, question, uploading, review, success
  const [step, setStep] = useState('welcome');
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasAudioPermission, setHasAudioPermission] = useState(null);

  // Timer & Recording
  const [timerState, setTimerState] = useState('think'); // think, record
  const [timeLeft, setTimeLeft] = useState(30);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');

  const cameraRef = useRef(null);
  const timerRef = useRef(null);

  // 1. Deep Link Listener
  useEffect(() => {
    const handleDeepLink = (event) => {
      const data = Linking.parse(event.url);
      if (data.path && data.path.includes('interview/')) {
        const urlToken = data.path.split('interview/')[1];
        if (urlToken) {
          setToken(urlToken);
          validateToken(urlToken);
        }
      }
    };

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      } else {
        // Fallback token for testing/development
        setLoading(false);
      }
    });

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  const validateToken = async (urlToken) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/${urlToken}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid token");

      setCandidate(data.candidate);
      setJob(data.job);
      setQuestions(data.questions);

      if (data.candidate.interviewStatus === 'Completed') {
        setStep('success');
      } else {
        setStep('welcome');
        determineResumeQuestion(urlToken, data.questions);
      }
    } catch (err) {
      setError("Failed to load interview. Please ensure you are connected to the internet.");
    } finally {
      setLoading(false);
    }
  };

  const determineResumeQuestion = async (urlToken, qList) => {
    try {
      for (let i = 0; i < qList.length; i++) {
        const res = await fetch(`${API_BASE_URL}/${urlToken}/upload-status?questionIndex=${i}`);
        const data = await res.json();
        const uploaded = data.uploadedChunks || [];
        if (uploaded.length === 0) {
          setCurrentQIdx(i);
          break;
        }
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // 2. Request Permissions
  const requestPermissions = async () => {
    const cameraStatus = await Camera.requestCameraPermissionsAsync();
    const audioStatus = await Camera.requestMicrophonePermissionsAsync();
    
    setHasCameraPermission(cameraStatus.status === 'granted');
    setHasAudioPermission(audioStatus.status === 'granted');

    if (cameraStatus.status === 'granted' && audioStatus.status === 'granted') {
      setStep('instructions');
    } else {
      Alert.alert("Permissions Required", "Camera and Microphone access are required to record your interview.");
    }
  };

  // 3. Interview Flow & Timers
  const startInterview = () => {
    setStep('question');
    startThinkTime();
  };

  const startThinkTime = () => {
    setTimerState('think');
    setTimeLeft(30);
    clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;
    
    setTimerState('record');
    setTimeLeft(180); // 3 minutes max
    setIsRecording(true);

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const video = await cameraRef.current.recordAsync({
        codec: 'h264',
        maxDuration: 180,
        quality: '480p'
      });
      
      setIsRecording(false);
      uploadInChunks(video.uri);
    } catch (err) {
      console.error(err);
      Alert.alert("Recording Error", "Could not start video recording: " + err.message);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
    clearInterval(timerRef.current);
  };

  // 4. Chunked Upload in React Native (Resumable)
  const uploadInChunks = async (fileUri) => {
    setStep('uploading');
    setUploadProgress(0);
    setUploadStatusText('Preparing video chunks...');

    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      const fileSize = fileInfo.size;
      const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

      // Fetch upload status to check if any chunks are already uploaded
      let startChunk = 0;
      try {
        const res = await fetch(`${API_BASE_URL}/${token}/upload-status?questionIndex=${currentQIdx}`);
        const data = await res.json();
        const uploaded = data.uploadedChunks || [];
        while (uploaded.includes(startChunk)) {
          startChunk++;
        }
      } catch (e) {
        console.warn(e);
      }

      for (let i = startChunk; i < totalChunks; i++) {
        setUploadStatusText(`Uploading chunk ${i + 1}/${totalChunks}...`);
        const offset = i * CHUNK_SIZE;
        const length = Math.min(CHUNK_SIZE, fileSize - offset);

        // Read chunk as Base64
        const base64Chunk = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
          position: offset,
          length: length
        });

        // Write base64 to a temporary file
        const tempChunkUri = `${FileSystem.cacheDirectory}chunk_${i}.tmp`;
        await FileSystem.writeAsStringAsync(tempChunkUri, base64Chunk, {
          encoding: FileSystem.EncodingType.Base64
        });

        // Upload using Multipart Form
        let success = false;
        let retries = 0;
        const maxRetries = 5;

        while (!success && retries < maxRetries) {
          try {
            const response = await FileSystem.uploadAsync(
              `${API_BASE_URL}/${token}/upload-chunk`,
              tempChunkUri,
              {
                fieldName: 'chunk',
                uploadType: FileSystem.FileSystemUploadType.MULTIPART,
                parameters: {
                  chunkIndex: String(i),
                  totalChunks: String(totalChunks),
                  questionIndex: String(currentQIdx)
                }
              }
            );

            if (response.status !== 200 && response.status !== 201) {
              throw new Error("Server error");
            }

            success = true;
            setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));
          } catch (err) {
            retries++;
            setUploadStatusText(`Upload failed, retrying chunk ${i + 1} (${retries}/${maxRetries})...`);
            await new Promise(r => setTimeout(r, 2000 * retries));
          }
        }

        // Clean up temp chunk file
        await FileSystem.deleteAsync(tempChunkUri, { idempotent: true });

        if (!success) {
          throw new Error("Failed to upload chunk due to connection failure.");
        }
      }

      // Delete the recorded video file to free space
      await FileSystem.deleteAsync(fileUri, { idempotent: true });

      // Move to next question or review
      if (currentQIdx < questions.length - 1) {
        setCurrentQIdx(prev => prev + 1);
        setStep('question');
        startThinkTime();
      } else {
        setStep('review');
      }

    } catch (err) {
      Alert.alert("Upload Error", err.message || "Connection lost. Your progress is saved. Please check your internet and try again.", [
        { text: "Retry", onPress: () => uploadInChunks(fileUri) }
      ]);
    }
  };

  // 5. Submit Interview
  const submitInterview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error("Submission failed");
      setStep('success');
    } catch (err) {
      Alert.alert("Submission Error", "Failed to submit interview: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F7CFF" />
        <Text style={styles.loadingText}>Loading Interview...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={() => validateToken(token)}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Welcome Step */}
      {step === 'welcome' && (
        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>Hi {candidate?.name},</Text>
          <Text style={styles.welcomeSub}>Welcome to your video interview for:</Text>
          <Text style={styles.jobTitle}>{job?.title}</Text>
          <Text style={styles.company}>{job?.company}</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>• Total Questions: {questions.length}</Text>
            <Text style={styles.infoText}>• Think Time: 30 seconds per question</Text>
            <Text style={styles.infoText}>• Max Recording: 3 minutes per question</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={() => setStep('permissions')}>
            <Text style={styles.buttonText}>Start Interview</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Permissions Step */}
      {step === 'permissions' && (
        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>Permissions Required</Text>
          <Text style={styles.welcomeSub}>To complete the video interview, please grant access to your Camera and Microphone.</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermissions}>
            <Text style={styles.buttonText}>Grant Access</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Instructions Step */}
      {step === 'instructions' && (
        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>Instructions</Text>
          <ScrollView style={styles.scrollView}>
            <Text style={styles.instructionText}>1. Each question will be shown on the screen with a 30-second think timer.</Text>
            <Text style={styles.instructionText}>2. Recording starts automatically when the timer reaches 0, or when you click "Start Recording".</Text>
            <Text style={styles.instructionText}>3. You can speak for up to 3 minutes. Press "Submit Answer" when done.</Text>
          </ScrollView>
          <TouchableOpacity style={styles.button} onPress={startInterview}>
            <Text style={styles.buttonText}>I Understand, Start</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Question / Recording Step */}
      {step === 'question' && (
        <View style={styles.recordingContainer}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionNum}>Question {currentQIdx + 1} of {questions.length}</Text>
            <Text style={styles.questionText}>{questions[currentQIdx]?.question}</Text>
          </View>

          {/* Camera Preview */}
          <CameraView style={styles.camera} facing="front" ref={cameraRef}>
            <View style={styles.overlay}>
              {timerState === 'think' ? (
                <View style={styles.timerBadgeThink}>
                  <Text style={styles.timerText}>Think Time: {timeLeft}s</Text>
                </View>
              ) : (
                <View style={styles.timerBadgeRecord}>
                  <Text style={styles.recDot} />
                  <Text style={styles.timerText}>REC: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</Text>
                </View>
              )}
            </View>
          </CameraView>

          {/* Action Button */}
          <View style={styles.actionContainer}>
            {timerState === 'think' ? (
              <TouchableOpacity style={styles.recordButton} onPress={() => stopRecording()}>
                <Text style={styles.recordButtonText}>Start Recording</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.recordButton, { backgroundColor: '#FF4F4F' }]} onPress={() => stopRecording()}>
                <Text style={styles.recordButtonText}>Submit Answer</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Uploading Step */}
      {step === 'uploading' && (
        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>Uploading Answer</Text>
          <ActivityIndicator size="large" color="#4F7CFF" style={{ marginVertical: 20 }} />
          <Text style={styles.welcomeSub}>{uploadStatusText}</Text>
          <Text style={styles.progressText}>{uploadProgress}%</Text>
        </View>
      )}

      {/* Review Step */}
      {step === 'review' && (
        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>Interview Complete!</Text>
          <Text style={styles.welcomeSub}>All your video answers have been recorded and uploaded successfully.</Text>
          <TouchableOpacity style={styles.button} onPress={submitInterview}>
            <Text style={styles.buttonText}>Submit Interview</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Success Step */}
      {step === 'success' && (
        <View style={styles.card}>
          <Text style={styles.welcomeTitle}>Thank You!</Text>
          <Text style={styles.welcomeSub}>Your interview has been submitted successfully to the hiring team. You may now close the app.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSub: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F7CFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  company: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 24,
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    color: '#E2E8F0',
    fontSize: 14,
    marginBottom: 8,
  },
  button: {
    width: '100%',
    backgroundColor: '#4F7CFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: '#FF4F4F',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  scrollView: {
    maxHeight: 200,
    width: '100%',
    marginBottom: 20,
  },
  instructionText: {
    color: '#CBD5E1',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  recordingContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  questionHeader: {
    marginBottom: 20,
  },
  questionNum: {
    color: '#4F7CFF',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  questionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  camera: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 16,
  },
  timerBadgeThink: {
    backgroundColor: 'rgba(79, 124, 255, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerBadgeRecord: {
    backgroundColor: 'rgba(255, 79, 79, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  actionContainer: {
    marginTop: 20,
  },
  recordButton: {
    backgroundColor: '#4F7CFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
});
