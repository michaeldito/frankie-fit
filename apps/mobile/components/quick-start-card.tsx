import { pillarColor, type Pillar } from '@frankie-fit/brand-core';
import { getPacificHour } from '@frankie-fit/dashboard-core';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { createThemedStyles, useTheme } from '@/lib/theme';
// TODO(Phase 3 / shared-types extraction): reaches into apps/web by relative path — see
// apps/mobile/app/(tabs)/chat.tsx for the same known IOU.
import {
  composeQuickStart,
  defaultQuickStartValues,
  parseQuickStartTemplate,
  toRatingRows,
  type QuickStartOption,
  type QuickStartSegment,
} from '../../../apps/web/components/chat/quick-start';

type QuickStartCardProps = {
  option: QuickStartOption;
  disabled: boolean;
  onCancel: () => void;
  onEditAsText: (text: string) => void;
  onSend: (message: string) => void;
};

// Touch-friendly stand-in for the web's Tab-between-blanks template: free-text blanks are inline
// fields, choice blanks (light/moderate/hard, 1-5) are tap-to-pick pills.
export function QuickStartCard({ option, disabled, onCancel, onEditAsText, onSend }: QuickStartCardProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const segments = useMemo(() => parseQuickStartTemplate(option.template), [option.template]);
  const ratingRows = useMemo(() => toRatingRows(segments), [segments]);
  const [values, setValues] = useState<Record<number, string>>(() =>
    defaultQuickStartValues(segments, getPacificHour())
  );
  const [showMissing, setShowMissing] = useState(false);
  const inputRefs = useRef<Record<number, TextInput | null>>({});
  const message = composeQuickStart(segments, values);
  const accent = pillarColor(colors, option.label.toLowerCase() as Pillar) ?? colors.brand;

  const blankIds = segments.flatMap((segment) => (segment.kind === 'text' ? [] : [segment.id]));
  const filledCount = blankIds.filter((id) => values[id]?.trim()).length;
  const remaining = blankIds.length - filledCount;
  const isMissing = (id: number) => showMissing && !values[id]?.trim();

  // A tap on the not-ready button shows what's left instead of silently doing nothing.
  function handleSendPress() {
    if (message) {
      onSend(message);
      return;
    }
    setShowMissing(true);
    const firstEmptyInput = segments.find(
      (segment): segment is Extract<QuickStartSegment, { kind: 'input' }> =>
        segment.kind === 'input' && !values[segment.id]?.trim()
    );
    if (firstEmptyInput) inputRefs.current[firstEmptyInput.id]?.focus();
  }

  function setValue(id: number, value: string) {
    setValues((current) => ({ ...current, [id]: value }));
  }

  function focusNextInput(afterId: number) {
    const next = segments.find(
      (segment): segment is Extract<QuickStartSegment, { kind: 'input' }> =>
        segment.kind === 'input' && segment.id > afterId
    );
    if (next) inputRefs.current[next.id]?.focus();
  }

  function renderSegment(segment: QuickStartSegment, index: number) {
    if (segment.kind === 'text') {
      // Split on spaces so the sentence wraps naturally around the inline fields.
      return segment.text
        .split(/(\s+)/)
        .filter((word) => word.trim())
        .map((word, wordIndex) => (
          <Text key={`${index}-${wordIndex}`} style={styles.word}>
            {word}
          </Text>
        ));
    }

    if (segment.kind === 'input') {
      return (
        <TextInput
          autoFocus={segment.id === blankIds[0]}
          blurOnSubmit={false}
          key={index}
          keyboardType={segment.numeric ? 'number-pad' : 'default'}
          onChangeText={(text) => setValue(segment.id, text)}
          onSubmitEditing={() => focusNextInput(segment.id)}
          placeholder={segment.placeholder}
          placeholderTextColor={colors.muted}
          ref={(ref) => {
            inputRefs.current[segment.id] = ref;
          }}
          returnKeyType="next"
          style={[
            styles.input,
            segment.numeric && styles.inputNumeric,
            { borderBottomColor: isMissing(segment.id) ? colors.danger : accent },
          ]}
          value={values[segment.id] ?? ''}
        />
      );
    }

    return (
      <View key={index} style={[styles.choiceRow, isMissing(segment.id) && styles.choiceRowMissing]}>
        {segment.options.map((choice) => {
          const selected = values[segment.id] === choice;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={choice}
              onPress={() => setValue(segment.id, selected ? '' : choice)}
              style={[styles.choice, selected && { backgroundColor: accent, borderColor: accent }]}>
              <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{choice}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={styles.title}>{option.label}</Text>
        <Text style={styles.progress}>
          {filledCount}/{blankIds.length}
        </Text>
        <Pressable accessibilityLabel="Close template" hitSlop={10} onPress={onCancel}>
          <Ionicons color={colors.muted} name="close" size={20} />
        </Pressable>
      </View>

      {ratingRows ? (
        <View style={styles.ratings}>
          {ratingRows.rows.map((row) => (
            <View key={row.id} style={[styles.ratingRow, isMissing(row.id) && styles.ratingRowMissing]}>
              <Text style={styles.ratingLabel}>{row.label}</Text>
              <View style={styles.ratingPills}>
                {row.options.map((choice) => {
                  const selected = values[row.id] === choice;
                  return (
                    <Pressable
                      accessibilityLabel={`${row.label} ${choice}`}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      hitSlop={4}
                      key={choice}
                      onPress={() => setValue(row.id, selected ? '' : choice)}
                      style={[styles.ratingPill, selected && { backgroundColor: accent, borderColor: accent }]}>
                      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{choice}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
          <Text style={styles.ratingScale}>1 = low · 5 = high</Text>
        </View>
      ) : (
        <View style={styles.sentence}>{segments.map(renderSegment)}</View>
      )}

      <View style={styles.footer}>
        <Pressable
          onPress={() => onEditAsText(message ?? composeWithGaps(segments, values))}
          style={styles.secondary}>
          <Text style={styles.secondaryText}>Edit as text</Text>
        </Pressable>
        <Pressable
          disabled={disabled}
          onPress={handleSendPress}
          style={[styles.primary, (!message || disabled) && styles.primaryDisabled]}>
          <Text style={styles.primaryText}>
            {message ? 'Send to Frankie' : `${remaining} more to fill`}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function composeWithGaps(segments: QuickStartSegment[], values: Record<number, string>) {
  return segments
    .map((segment) => (segment.kind === 'text' ? segment.text : values[segment.id]?.trim() || '___'))
    .join('');
}

const useStyles = createThemedStyles((colors) => ({
  card: {
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    flex: 1,
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '800',
  },
  progress: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  ratings: {
    gap: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingRowMissing: {
    borderStyle: 'dashed',
    borderColor: colors.danger,
  },
  ratingLabel: {
    flex: 1,
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '700',
  },
  ratingPills: {
    flexDirection: 'row',
    gap: 6,
  },
  ratingPill: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceStrong,
  },
  ratingScale: {
    alignSelf: 'flex-end',
    color: colors.muted,
    fontSize: 12,
    paddingRight: 6,
  },
  sentence: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 6,
    rowGap: 10,
  },
  word: {
    color: colors.foreground,
    fontSize: 17,
    lineHeight: 24,
  },
  input: {
    minWidth: 120,
    borderBottomWidth: 2,
    color: colors.foreground,
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  inputNumeric: {
    minWidth: 48,
    textAlign: 'center',
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  choiceRowMissing: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.danger,
    padding: 3,
  },
  choice: {
    minWidth: 36,
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  choiceText: {
    color: colors.mutedStrong,
    fontSize: 15,
    fontWeight: '700',
  },
  choiceTextSelected: {
    color: colors.background,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
  },
  secondary: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryText: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '700',
  },
  primary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.brand,
    paddingVertical: 12,
  },
  primaryDisabled: {
    opacity: 0.45,
  },
  primaryText: {
    color: colors.brandForeground,
    fontSize: 15,
    fontWeight: '800',
  },
}));
