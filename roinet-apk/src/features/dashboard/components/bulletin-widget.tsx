import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/core/providers/AuthProvider';
import { useCrm } from '@/core/providers/CrmProvider';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import type { BulletinPost } from '@/shared/types/crm.types';
import { fmtDate } from '@/shared/utils/formatters';
import { Colors } from '@/theme/colors';
import { Spacing } from '@/theme/spacing';

interface BulletinWidgetProps {
  posts: BulletinPost[];
}

export function BulletinWidget({ posts }: BulletinWidgetProps) {
  const { isAdmin } = useAuth();
  const { postBulletin, removeBulletin } = useCrm();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const list = [...posts]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 5);

  async function handlePost() {
    const text = draft.trim();
    if (!text) {
      return;
    }
    setBusy(true);
    try {
      await postBulletin(text, 'Leadership');
      setDraft('');
    } finally {
      setBusy(false);
    }
  }

  function handleRemove(id: string) {
    Alert.alert('Remove update', 'Remove this bulletin post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => void removeBulletin(id),
      },
    ]);
  }

  return (
    <View style={styles.wrap}>
      {isAdmin ? (
        <View style={styles.compose}>
          <Input
            label="Post leadership update"
            value={draft}
            onChangeText={setDraft}
            placeholder="Share an announcement with the team…"
            multiline
          />
          <Button title={busy ? 'Posting…' : 'Post Update'} onPress={() => void handlePost()} disabled={busy} />
        </View>
      ) : null}

      {list.length === 0 ? (
        <Text style={styles.empty}>No updates posted.</Text>
      ) : (
        list.map((post) => (
          <View key={post.id} style={styles.item}>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>
                {fmtDate(post.date)} · {post.author || 'Leadership'}
              </Text>
              {isAdmin ? (
                <Text style={styles.remove} onPress={() => handleRemove(post.id)}>
                  Remove
                </Text>
              ) : null}
            </View>
            <Text style={styles.text}>{post.text}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.md,
  },
  compose: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  empty: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  item: {
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  meta: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  remove: {
    fontSize: 11,
    color: Colors.error,
    fontWeight: '600',
  },
  text: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
});
