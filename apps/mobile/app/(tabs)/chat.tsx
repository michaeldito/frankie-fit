import { moodForMessage, pillarColor, type Pillar } from '@frankie-fit/brand-core';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FrankieAvatar, FrankieThinking } from '@/components/frankie';
import { FrankieDayBar, useFrankieDay } from '@/components/frankie-day';
import { LoggedEntryCard } from '@/components/logged-entry-card';
import { QuickStartCard } from '@/components/quick-start-card';
import { Screen, ScrollCard } from '@/components/frankie-ui';
import { createThemedStyles, useTheme } from '@/lib/theme';
import { frankieApiFetch } from '@/lib/api';
// TODO(Phase 3 / shared-types extraction): reaches into apps/web by relative path — see
// packages/dashboard-core/dashboard.ts for the same known IOU and its rationale.
import type { Database } from '../../../../apps/web/types/database';
// TODO(Phase 3 / shared-types extraction): reaches into apps/web by relative path — see above.
import {
  formatActivityDetail,
  formatActivityTitle,
  formatDietDetail,
  formatDietTitle,
  formatLifestyleDetail,
  formatLifestyleTitle,
  formatWellnessDetail,
  formatWellnessTitle,
  type LoggedActivity,
  type LoggedDietEntry,
  type LoggedLifestyleEntry,
  type LoggedWellnessCheckin,
} from '../../../../apps/web/components/chat/logged-entry-format';
// TODO(Phase 3 / shared-types extraction): reaches into apps/web by relative path — see above.
import { QUICK_START_OPTIONS, type QuickStartOption } from '../../../../apps/web/components/chat/quick-start';

type ChatMessageRow = Database['public']['Tables']['conversation_messages']['Row'];

type LogConfirmationPayload = {
  activitiesLogged?: LoggedActivity[];
  dietLogged?: LoggedDietEntry[];
  lifestyleLogged?: LoggedLifestyleEntry[];
  wellnessLogged?: LoggedWellnessCheckin | null;
};

type ChatBubble = {
  content: string;
  id: string;
  messageType: ChatMessageRow['message_type'];
  pending?: boolean;
  role: ChatMessageRow['role'];
  structuredPayload: ChatMessageRow['structured_payload'];
};

type MobileChatResponse = {
  biscuitAward?: { messageId: string; earned: number; fullBowl: boolean } | null;
  error: string | null;
  messages: ChatMessageRow[];
  schemaReady: boolean;
  userMessageId?: string;
};

function toBubbles(messages: ChatMessageRow[]): ChatBubble[] {
  return messages.map((message) => ({
    content: message.content,
    id: message.id,
    messageType: message.message_type,
    role: message.role,
    structuredPayload: message.structured_payload,
  }));
}

function getLogConfirmationPayload(message: ChatBubble): LogConfirmationPayload | null {
  if (message.messageType !== 'log_confirmation') {
    return null;
  }

  return (message.structuredPayload as LogConfirmationPayload | null) ?? null;
}

function AnimatedStatusText({
  inverted,
  label,
}: {
  inverted?: boolean;
  label: string;
}) {
  const styles = useStyles();
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setDotCount((current) => (current >= 3 ? 1 : current + 1));
    }, 350);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Text style={inverted ? styles.pendingText : styles.thinkingText}>
      {label}
      {'.'.repeat(dotCount)}
    </Text>
  );
}

export default function ChatScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const scrollRef = useRef<ScrollView>(null);
  const frankieDay = useFrankieDay();
  const [biscuitAwards, setBiscuitAwards] = useState<Record<string, { earned: number; fullBowl: boolean }>>({});
  const [draft, setDraft] = useState('');
  const [activeTemplate, setActiveTemplate] = useState<QuickStartOption | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<ChatBubble[]>([]);

  const loadChat = useCallback(async () => {
    setError(null);
    const response = await frankieApiFetch<MobileChatResponse>('/api/mobile/chat');
    setMessages(toBubbles(response.messages));
    setError(response.error);
  }, []);

  async function handleRetry() {
    setIsLoading(true);
    try {
      await loadChat();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Frankie could not load chat.');
    } finally {
      setIsLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function run() {
        setIsLoading(true);
        try {
          await loadChat();
        } catch (loadError) {
          if (mounted) {
            setError(loadError instanceof Error ? loadError.message : 'Frankie could not load chat.');
          }
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      }

      run();

      return () => {
        mounted = false;
      };
    }, [loadChat])
  );

  async function handleSend(contentOverride?: string) {
    const content = (contentOverride ?? draft).trim();

    if (!content || isSending || isThinking) {
      return;
    }

    const pendingMessageId = `pending-user-${Date.now()}`;
    const optimisticUserMessage: ChatBubble = {
      content,
      id: pendingMessageId,
      messageType: 'chat',
      pending: true,
      role: 'user',
      structuredPayload: {},
    };

    setDraft('');
    setActiveTemplate(null);
    setMessages((current) => [...current, optimisticUserMessage]);
    setIsSending(true);
    Keyboard.dismiss();

    try {
      const saveResponse = await frankieApiFetch<MobileChatResponse>('/api/mobile/chat', {
        body: JSON.stringify({ action: 'save_message', message: content }),
        method: 'POST',
      });

      if (!saveResponse.userMessageId) {
        throw new Error('Frankie saved the message but did not return a message id.');
      }

      setMessages(toBubbles(saveResponse.messages));
      setError(saveResponse.error);
      setIsSending(false);
      setIsThinking(true);

      const replyResponse = await frankieApiFetch<MobileChatResponse>('/api/mobile/chat', {
        body: JSON.stringify({
          action: 'generate_reply',
          sourceMessageId: saveResponse.userMessageId,
        }),
        method: 'POST',
      });
      const replyBubbles = toBubbles(replyResponse.messages);
      setMessages(replyBubbles);
      setError(replyResponse.error);

      if (replyBubbles.at(-1)?.messageType === 'log_confirmation') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const award = replyResponse.biscuitAward;
      if (award) {
        setBiscuitAwards((current) => ({ ...current, [award.messageId]: award }));
        frankieDay.refresh();
      }
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : 'Frankie could not send that.';
      setError(message);
      setMessages((current) => current.filter((chatMessage) => chatMessage.id !== pendingMessageId));
      Alert.alert('Could not send message', message);
    } finally {
      setIsSending(false);
      setIsThinking(false);
    }
  }

  return (
    <Screen padded={false}>
      <FrankieDayBar />
      <KeyboardAvoidingView behavior="padding" style={styles.keyboard}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>

          {error ? (
            <ScrollCard style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={handleRetry} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Try again</Text>
              </Pressable>
            </ScrollCard>
          ) : null}

          {isLoading && messages.length === 0 ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.brand} />
            </View>
          ) : null}

          <View style={styles.messages}>
            {messages.map((message) => {
              const isUser = message.role === 'user';
              const logConfirmation = getLogConfirmationPayload(message);

              const bubble = (
                <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
                  <Text style={isUser ? styles.userText : styles.assistantText}>{message.content}</Text>
                  {message.pending ? <AnimatedStatusText inverted label="Sending" /> : null}
                </View>
              );

              return (
                <View key={message.id} style={styles.messageGroup}>
                  {isUser ? (
                    bubble
                  ) : (
                    <View style={styles.assistantRow}>
                      <FrankieAvatar
                        mood={moodForMessage({
                          message_type: message.messageType,
                          structured_payload: message.structuredPayload,
                        })}
                        size={34}
                      />
                      {bubble}
                    </View>
                  )}

                  {logConfirmation ? (
                    <View style={styles.logCards}>
                      <LoggedEntryCard
                        entries={logConfirmation.activitiesLogged ?? []}
                        formatDetail={formatActivityDetail}
                        formatTitle={formatActivityTitle}
                        kicker="Activity"
                        pillar="exercise"
                      />
                      <LoggedEntryCard
                        entries={logConfirmation.dietLogged ?? []}
                        formatDetail={formatDietDetail}
                        formatTitle={formatDietTitle}
                        kicker="Meal"
                        pillar="diet"
                      />
                      <LoggedEntryCard
                        entries={logConfirmation.lifestyleLogged ?? []}
                        formatDetail={formatLifestyleDetail}
                        formatTitle={formatLifestyleTitle}
                        kicker="Lifestyle"
                        pillar="lifestyle"
                      />
                      <LoggedEntryCard
                        entries={logConfirmation.wellnessLogged ? [logConfirmation.wellnessLogged] : []}
                        formatDetail={formatWellnessDetail}
                        formatTitle={formatWellnessTitle}
                        kicker="Wellness check-in"
                        pillar="wellness"
                      />
                    </View>
                  ) : null}
                  {biscuitAwards[message.id] ? (
                    <Text style={styles.biscuitChip}>
                      🦴 +{biscuitAwards[message.id].earned}{' '}
                      {biscuitAwards[message.id].earned === 1 ? 'biscuit' : 'biscuits'}
                      {biscuitAwards[message.id].fullBowl ? ' · Full bowl bonus!' : ''}
                    </Text>
                  ) : null}
                </View>
              );
            })}

            {isThinking ? <FrankieThinking /> : null}
          </View>
        </ScrollView>

        {activeTemplate ? (
          <QuickStartCard
            disabled={isSending || isThinking}
            key={activeTemplate.label}
            onCancel={() => setActiveTemplate(null)}
            onEditAsText={(text) => {
              setActiveTemplate(null);
              setDraft(text);
            }}
            onSend={(message) => handleSend(message)}
            option={activeTemplate}
          />
        ) : null}

        {!draft && !activeTemplate ? (
          <View style={styles.quickStartRow}>
            <ScrollView horizontal contentContainerStyle={styles.quickStartContent} showsHorizontalScrollIndicator={false}>
              {QUICK_START_OPTIONS.map((option) => (
                <Pressable
                  key={option.label}
                  onPress={() => setActiveTemplate(option)}
                  style={styles.quickStartChip}>
                  <View
                    style={[
                      styles.quickStartDot,
                      { backgroundColor: pillarColor(colors, option.label.toLowerCase() as Pillar) },
                    ]}
                  />
                  <Text style={styles.quickStartChipText}>{option.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {!activeTemplate ? (
          <View style={styles.composerWrap}>
            <TextInput
              multiline
              onChangeText={setDraft}
              onSubmitEditing={Keyboard.dismiss}
              placeholder="Message Frankie..."
              placeholderTextColor={colors.muted}
              returnKeyType="default"
              style={styles.composer}
              value={draft}
            />
            <Pressable
              disabled={isSending || isThinking || !draft.trim()}
              onPress={() => handleSend()}
              style={[
                styles.sendButton,
                (isSending || isThinking || !draft.trim()) && styles.sendButtonDisabled,
              ]}>
              {isSending || isThinking ? (
                <ActivityIndicator color={colors.brandForeground} />
              ) : (
                <Text style={styles.sendText}>Send</Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const useStyles = createThemedStyles((colors) => ({
  keyboard: {
    flex: 1,
  },
  content: {
    gap: 18,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  errorCard: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.foreground,
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    backgroundColor: colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: colors.brandForeground,
    fontSize: 14,
    fontWeight: '800',
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  messages: {
    gap: 12,
  },
  messageGroup: {
    gap: 8,
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    flexShrink: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderTopLeftRadius: 6,
    backgroundColor: colors.surface,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 6,
    backgroundColor: colors.accentStrong,
  },
  assistantRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  assistantText: {
    color: colors.foreground,
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: colors.accentForeground,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  pendingText: {
    color: colors.accentForeground,
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.76,
    paddingTop: 4,
  },
  thinkingText: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  quickStartRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  quickStartContent: {
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  quickStartChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  biscuitChip: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.frankieSoft,
    color: colors.foreground,
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 42,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  logCards: {
    gap: 8,
    marginLeft: 42,
  },
  quickStartDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickStartChipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  composerWrap: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    paddingBottom: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  composer: {
    flex: 1,
    maxHeight: 108,
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surfaceStrong,
    color: colors.foreground,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sendButton: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: colors.brand,
    paddingHorizontal: 16,
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
  sendText: {
    color: colors.brandForeground,
    fontSize: 15,
    fontWeight: '800',
  },
}));
