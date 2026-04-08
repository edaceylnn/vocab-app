import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

function supported() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export function hapticLight() {
  if (!supported()) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function hapticMedium() {
  if (!supported()) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function hapticSuccess() {
  if (!supported()) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
