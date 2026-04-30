import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen, ScreenTitle, ScrollCard } from '@/components/frankie-ui';
import { colors } from '@/constants/frankie-theme';
import { frankieApiFetch } from '@/lib/api';
import type { Database } from '../../../../types/database';

type ChatMessageRow = Database['public']['Tables']['conversation_messages']['Row'];

type ChatBubble = {
  content: string;
  id: string;
  pending?: boolean;
  role: ChatMessageRow['role'];
};

type MobileChatResponse = {
  error: string | null;
  messages: ChatMessageRow[];
  schemaReady: boolean;
  userMessageId?: string;
};

const chatInputAccessoryId = 'frankie-chat-input-accessory';

function toBubbles(messages: ChatMessageRow[]): ChatBubble[] {
  return messages.map((message) => ({
    content: message.content,
    id: message.id,
    role: message.role,
  }));
}

function AnimatedStatusText({
  inverted,
  label,
}: {
  inverted?: boolean;
  label: string;
}) {
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
  const scrollRef = useRef<ScrollView>(null);
  const [draft, setDraft] = useState('');
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

  async function handleSend() {
    const content = draft.trim();

    if (!content || isSending || isThinking) {
      return;
    }

    const pendingMessageId = `pending-user-${Date.now()}`;
    const optimisticUserMessage: ChatBubble = {
      content,
      id: pendingMessageId,
      pending: true,
      role: 'user',
    };

    setDraft('');
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
      setMessages(toBubbles(replyResponse.messages));
      setError(replyResponse.error);
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
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        style={styles.keyboard}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          <ScreenTitle title="Chat" subtitle="Log movement, meals, recovery, or ask Frankie for the next step." />

          <ScrollCard style={styles.contextCard}>
            <Text style={styles.contextLabel}>Live chat</Text>
            <Text style={styles.contextTitle}>Thread memory active</Text>
            <Text style={styles.contextBody}>
              Frankie reads the same profile context and saves structured logs for the dashboard.
            </Text>
          </ScrollCard>

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
              <ActivityIndicator color={colors.accentStrong} />
            </View>
          ) : null}

          <View style={styles.messages}>
            {messages.map((message) => {
              const isUser = message.role === 'user';

              return (
                <View
                  key={message.id}
                  style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
                  <Text style={isUser ? styles.userText : styles.assistantText}>{message.content}</Text>
                  {message.pending ? <AnimatedStatusText inverted label="Sending" /> : null}
                </View>
              );
            })}

            {isThinking ? (
              <View style={[styles.bubble, styles.assistantBubble]}>
                <AnimatedStatusText label="Frankie is thinking" />
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.composerWrap}>
          <TextInput
            inputAccessoryViewID={Platform.OS === 'ios' ? chatInputAccessoryId : undefined}
            multiline
            onChangeText={setDraft}
            onSubmitEditing={Keyboard.dismiss}
            placeholder="Message Frankie..."
            placeholderTextColor={colors.subtle}
            returnKeyType="default"
            style={styles.composer}
            value={draft}
          />
          <Pressable
            disabled={isSending || isThinking || !draft.trim()}
            onPress={handleSend}
            style={[
              styles.sendButton,
              (isSending || isThinking || !draft.trim()) && styles.sendButtonDisabled,
            ]}>
            {isSending || isThinking ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.sendText}>Send</Text>
            )}
          </Pressable>
        </View>

        {Platform.OS === 'ios' ? (
          <InputAccessoryView nativeID={chatInputAccessoryId}>
            <View style={styles.keyboardToolbar}>
              <Pressable onPress={Keyboard.dismiss} style={styles.keyboardDoneButton}>
                <Text style={styles.keyboardDoneText}>Close</Text>
              </Pressable>
            </View>
          </InputAccessoryView>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  content: {
    gap: 18,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  contextCard: {
    backgroundColor: colors.panelStrong,
  },
  contextLabel: {
    color: colors.accentStrong,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  contextTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  contextBody: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  errorCard: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    backgroundColor: colors.accentStrong,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: colors.background,
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
  bubble: {
    maxWidth: '86%',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.panel,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accentStrong,
  },
  assistantText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  pendingText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.76,
    paddingTop: 4,
  },
  thinkingText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
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
    backgroundColor: colors.backgroundSoft,
    color: colors.text,
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
    backgroundColor: colors.accentStrong,
    paddingHorizontal: 16,
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
  sendText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '800',
  },
  keyboardToolbar: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundSoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  keyboardDoneButton: {
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.accentStrong,
    minWidth: 120,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  keyboardDoneText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '800',
  },
});
