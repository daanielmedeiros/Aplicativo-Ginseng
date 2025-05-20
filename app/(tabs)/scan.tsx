import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Camera, Flashlight, RotateCcw } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { CommonStyles } from '@/constants/Styles';
import { InventoryItem } from '@/components/InventoryItem';
import { mockInventoryData } from '@/data/mockData';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  
  // Animation values
  const bottomSheetPosition = useSharedValue(Platform.OS === 'web' ? 0 : 500);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      requestPermission();
    }
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    
    // Find product with this barcode
    const product = mockInventoryData.find(item => item.barcode === data);
    
    if (product) {
      setScannedProduct(product);
      // Animate the bottom sheet up
      bottomSheetPosition.value = withSpring(0, {
        damping: 15,
        stiffness: 100,
      });
    } else {
      Alert.alert(
        "Produto não encontrado",
        `O código de barras ${data} não está cadastrado no sistema.`,
        [
          { 
            text: "OK", 
            onPress: () => setScanned(false) 
          }
        ]
      );
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setScannedProduct(null);
    // Animate the bottom sheet down
    bottomSheetPosition.value = withSpring(Platform.OS === 'web' ? 0 : 500);
  };

  const animatedBottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: bottomSheetPosition.value }],
    };
  });

  if (Platform.OS !== 'web' && !permission?.granted) {
    return (
      <SafeAreaView style={[CommonStyles.centeredContainer, { backgroundColor: Colors.neutral[900] }]}>
        <Text style={styles.permissionText}>Sem acesso à câmera</Text>
        <TouchableOpacity 
          style={[CommonStyles.buttonPrimary, { marginTop: 16 }]}
          onPress={requestPermission}
        >
          <Text style={CommonStyles.buttonText}>Permitir acesso</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {Platform.OS !== 'web' ? (
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'qr'],
          }}
          facing="back"
          flashMode={flashEnabled ? 'on' : 'off'}
        >
          <SafeAreaView style={styles.overlay}>
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={resetScanner}
              >
                <X size={24} color={Colors.white} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.flashButton}
                onPress={() => setFlashEnabled(!flashEnabled)}
              >
                <Flashlight size={24} color={flashEnabled ? Colors.primary[300] : Colors.white} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.scannerTargetContainer}>
              <View style={styles.scannerTarget} />
            </View>
            
            <Text style={styles.instructionText}>
              Posicione o código de barras dentro da área
            </Text>
            
            {scanned && (
              <TouchableOpacity 
                style={styles.rescanButton}
                onPress={resetScanner}
              >
                <RotateCcw size={20} color={Colors.white} />
                <Text style={styles.rescanButtonText}>Escanear novamente</Text>
              </TouchableOpacity>
            )}
          </SafeAreaView>
        </CameraView>
      ) : (
        // Placeholder for web
        <View style={styles.webPlaceholder}>
          <Camera size={64} color={Colors.neutral[400]} />
          <Text style={styles.webPlaceholderText}>
            A funcionalidade de scanner não está disponível na versão web.
          </Text>
          <TouchableOpacity 
            style={[CommonStyles.buttonPrimary, { marginTop: 24 }]}
            onPress={() => {
              // Simulate a scan for demo purposes
              handleBarCodeScanned({
                type: 'ean13',
                data: mockInventoryData[0].barcode
              });
            }}
          >
            <Text style={CommonStyles.buttonText}>Simular escaneamento</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Product details bottom sheet */}
      <Animated.View style={[styles.bottomSheet, animatedBottomSheetStyle]}>
        <View style={styles.bottomSheetHandle} />
        
        <Text style={styles.bottomSheetTitle}>Detalhes do produto</Text>
        
        <ScrollView style={styles.productDetailsContainer}>
          {scannedProduct && (
            <>
              <InventoryItem item={scannedProduct} expanded={true} />
              
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Atualizar estoque</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.actionButtonSecondary]}
                  onPress={resetScanner}
                >
                  <Text style={styles.actionButtonTextSecondary}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[900],
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTargetContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTarget: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: Colors.white,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  instructionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 32,
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignSelf: 'center',
    marginBottom: 16,
  },
  rescanButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.white,
    marginLeft: 8,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 40,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
    minHeight: '50%',
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.neutral[300],
    alignSelf: 'center',
    marginBottom: 16,
  },
  bottomSheetTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.neutral[900],
    marginBottom: 16,
  },
  productDetailsContainer: {
    maxHeight: 400,
  },
  actionButtonsContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonSecondary: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
  },
  actionButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.white,
  },
  actionButtonTextSecondary: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.neutral[700],
  },
  permissionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
  },
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    padding: 24,
  },
  webPlaceholderText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.neutral[700],
    textAlign: 'center',
    marginTop: 16,
    maxWidth: 300,
  },
});