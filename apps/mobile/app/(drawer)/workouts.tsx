import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import { BodyText, Screen, ScreenTitle, ScrollCard } from '@/components/frankie-ui';
import { colors } from '@/constants/frankie-theme';

export default function WorkoutsScreen() {
  return (
    <Screen>
      <ScreenTitle
        title="Workouts"
        subtitle="Program browsing, scheduling, and enrollment are coming to mobile."
      />

      <ScrollCard>
        <View style={{ alignItems: 'center', gap: 12, paddingVertical: 12 }}>
          <Ionicons color={colors.accentStrong} name="barbell-outline" size={32} />
          <BodyText>
            For now, browse and enroll in P90X-style programs from Frankie Fit on the web. Logging
            individual workouts still works through chat here on mobile.
          </BodyText>
        </View>
      </ScrollCard>
    </Screen>
  );
}
