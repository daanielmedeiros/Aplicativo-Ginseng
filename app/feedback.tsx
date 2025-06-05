import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

export default function FeedbackScreen() {
  const { user } = useAuth();
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);

  const handleSendFeedback = async () => {
    if (!feedbackTitle.trim() || !feedbackDescription.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    try {
      setSendingFeedback(true);
      
      const response = await fetch('https://api.grupoginseng.com.br/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario: user?.name || 'Usuário Anônimo',
          titulo: feedbackTitle.trim(),
          descricao: feedbackDescription.trim(),
        }),
      });

      if (response.ok) {
        Alert.alert(
          'Sucesso', 
          'Seu feedback foi enviado com sucesso! Obrigado pela contribuição.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)')
            }
          ]
        );
        setFeedbackTitle('');
        setFeedbackDescription('');
      } else {
        throw new Error('Erro ao enviar feedback');
      }
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      Alert.alert('Erro', 'Não foi possível enviar seu feedback. Tente novamente mais tarde.');
    } finally {
      setSendingFeedback(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Enviar Feedback</Text>
        <View style={styles.headerSpacer} />
      </View>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Seu feedback é importante!</Text>
            <Text style={styles.welcomeDescription}>
              Compartilhe suas sugestões, reclamações ou elogios conosco. 
              Sua opinião nos ajuda a melhorar constantemente.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Título *</Text>
              <TextInput
                style={styles.textInput}
                value={feedbackTitle}
                onChangeText={setFeedbackTitle}
                placeholder="Digite o título do seu feedback"
                placeholderTextColor={Colors.neutral[400]}
                maxLength={100}
              />
              <Text style={styles.inputHelper}>
                {feedbackTitle.length}/100 caracteres
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Descrição *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={feedbackDescription}
                onChangeText={setFeedbackDescription}
                placeholder="Descreva detalhadamente seu feedback, sugestão ou reclamação..."
                placeholderTextColor={Colors.neutral[400]}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.inputHelper}>
                {feedbackDescription.length}/500 caracteres
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleGoBack}
                disabled={sendingFeedback}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.sendButton,
                  (!feedbackTitle.trim() || !feedbackDescription.trim() || sendingFeedback) && styles.sendButtonDisabled
                ]}
                onPress={handleSendFeedback}
                disabled={!feedbackTitle.trim() || !feedbackDescription.trim() || sendingFeedback}
              >
                {sendingFeedback ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Send size={18} color={Colors.white} />
                    <Text style={styles.sendButtonText}>Enviar Feedback</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#04506B',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.white,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeSection: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: Colors.neutral[900],
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.neutral[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.neutral[900],
  },
  textInput: {
    borderWidth: 2,
    borderColor: Colors.neutral[200],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.neutral[900],
    backgroundColor: Colors.white,
  },
  textArea: {
    minHeight: 120,
    maxHeight: 200,
  },
  inputHelper: {
    fontSize: 12,
    color: Colors.neutral[500],
    textAlign: 'right',
    fontFamily: 'Inter-Regular',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.neutral[300],
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.neutral[700],
  },
  sendButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    // Sombra para iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    // Sombra para Android
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.neutral[300],
  },
  sendButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.white,
  },
}); 