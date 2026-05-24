import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Easing } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZE } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../i18n';
import { getProductByBarcode } from '../services/openfoodfacts';
import CustomAlert, { type AlertButton } from '../components/CustomAlert';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MIN_LOADING_MS = 700;
const REJECT_COOLDOWN_MS = 4000;

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  icon: 'alert-circle' | 'information-circle';
  buttons: AlertButton[];
}

export default function BarcodeScannerScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { t } = useI18n();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState>({
    visible: false, title: '', message: '', icon: 'information-circle', buttons: [],
  });

  // Refs guard against camera firing the same callback multiple times before React state updates.
  const busyRef = useRef(false);
  const lastRejectedRef = useRef<{ code: string; at: number } | null>(null);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (busyRef.current) return;

    // Cooldown: skip the same barcode if we just told the user it isn't found.
    const recent = lastRejectedRef.current;
    if (recent && recent.code === data && Date.now() - recent.at < REJECT_COOLDOWN_MS) {
      return;
    }

    busyRef.current = true;
    setScanned(true);
    setLoading(true);

    const start = Date.now();
    try {
      const food = await getProductByBarcode(data);
      const elapsed = Date.now() - start;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
      }

      if (food) {
        setLoading(false);
        navigation.replace('ConfirmMeal', { food });
        return;
      }

      lastRejectedRef.current = { code: data, at: Date.now() };
      setLoading(false);
      setAlert({
        visible: true,
        title: t('scanner_not_found'),
        message: t('scanner_not_found_msg'),
        icon: 'information-circle',
        buttons: [
          { text: t('cancel'), style: 'cancel', onPress: () => {
            busyRef.current = false;
            setScanned(false);
          } },
          { text: t('add'), onPress: () => {
            busyRef.current = false;
            navigation.replace('AddCustomFood', { barcode: data });
          } },
        ],
      });
    } catch {
      const elapsed = Date.now() - start;
      if (elapsed < MIN_LOADING_MS) {
        await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
      }
      setLoading(false);
      setAlert({
        visible: true,
        title: t('error'),
        message: t('scanner_error'),
        icon: 'alert-circle',
        buttons: [
          { text: 'OK', onPress: () => {
            busyRef.current = false;
            setScanned(false);
          } },
        ],
      });
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.permText, { color: colors.textSecondary }]}>{t('scanner_permission')}</Text>
        <TouchableOpacity style={[styles.permBtn, { backgroundColor: colors.primary }]} onPress={requestPermission}>
          <Text style={styles.permBtnText}>{t('scanner_allow')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={styles.topOverlay} />
          <View style={styles.middleRow}>
            <View style={styles.sideOverlay} />
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
              <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />
            </View>
            <View style={styles.sideOverlay} />
          </View>
          <View style={styles.bottomOverlay}>
            {loading ? (
              <View style={styles.loadingRow}>
                <Text style={styles.hint}>{t('scanner_searching')}</Text>
                <PulsingDots color={colors.primary} />
              </View>
            ) : (
              <Text style={styles.hint}>{t('scanner_hint')}</Text>
            )}
            {scanned && !loading && !alert.visible && (
              <TouchableOpacity
                style={[styles.rescanBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  busyRef.current = false;
                  setScanned(false);
                }}
              >
                <Text style={styles.rescanText}>{t('scanner_rescan')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </CameraView>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        icon={alert.icon}
        buttons={alert.buttons}
        onDismiss={() => setAlert((a) => ({ ...a, visible: false }))}
      />
    </View>
  );
}

function PulsingDots({ color }: { color: string }) {
  const d1 = useRef(new Animated.Value(0.3)).current;
  const d2 = useRef(new Animated.Value(0.3)).current;
  const d3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1, duration: 400,
            easing: Easing.inOut(Easing.ease), useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3, duration: 400,
            easing: Easing.inOut(Easing.ease), useNativeDriver: true,
          }),
        ]),
      );
    const a1 = pulse(d1, 0);
    const a2 = pulse(d2, 150);
    const a3 = pulse(d3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={styles.dotsRow}>
      {[d1, d2, d3].map((d, i) => (
        <Animated.View
          key={i}
          style={[styles.dot, { backgroundColor: color, opacity: d }]}
        />
      ))}
    </View>
  );
}

const FRAME_SIZE = 250;
const CORNER_SIZE = 30;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl,
  },
  permText: { fontSize: FONT_SIZE.md, textAlign: 'center', marginTop: SPACING.md, marginBottom: SPACING.lg },
  permBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: 14 },
  permBtnText: { color: '#fff', fontWeight: '600', fontSize: FONT_SIZE.md },
  overlay: { flex: 1 },
  topOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  middleRow: { flexDirection: 'row', height: FRAME_SIZE },
  sideOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scanFrame: { width: FRAME_SIZE, height: FRAME_SIZE },
  bottomOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', paddingTop: SPACING.lg,
  },
  hint: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '500' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  rescanBtn: { marginTop: SPACING.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: 12 },
  rescanText: { color: '#fff', fontWeight: '600', fontSize: FONT_SIZE.sm },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
  topLeft: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  topRight: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },
});
