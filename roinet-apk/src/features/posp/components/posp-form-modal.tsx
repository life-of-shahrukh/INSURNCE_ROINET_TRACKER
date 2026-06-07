import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useCrm } from '@/core/providers/CrmProvider';
import { AppModal } from '@/shared/components/app-modal';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { SelectField } from '@/shared/components/select-field';
import type { Posp } from '@/shared/types/crm.types';
import { Spacing } from '@/theme/spacing';

interface PospFormModalProps {
  visible: boolean;
  pospItem: Posp | null;
  onClose: () => void;
}

interface PospFormState {
  name: string;
  code: string;
  mobile: string;
  email: string;
  joined: string;
  active: string;
  region: string;
  area: string;
  asm: string;
  rm: string;
}

const emptyForm: PospFormState = {
  name: '',
  code: '',
  mobile: '',
  email: '',
  joined: '',
  active: 'true',
  region: '',
  area: '',
  asm: '',
  rm: '',
};

export function PospFormModal({ visible, pospItem, onClose }: PospFormModalProps) {
  const { savePosp } = useCrm();
  const [form, setForm] = useState<PospFormState>(emptyForm);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (pospItem) {
      setForm({
        name: pospItem.name,
        code: pospItem.code,
        mobile: pospItem.mobile ?? '',
        email: pospItem.email ?? '',
        joined: pospItem.joined ?? '',
        active: pospItem.active ? 'true' : 'false',
        region: pospItem.region ?? '',
        area: pospItem.area ?? '',
        asm: pospItem.asm ?? '',
        rm: pospItem.rm ?? '',
      });
    } else {
      setForm({ ...emptyForm, joined: new Date().toISOString().slice(0, 10) });
    }
  }, [visible, pospItem]);

  async function handleSave() {
    if (!form.name.trim() || !form.code.trim()) {
      return;
    }
    setBusy(true);
    try {
      await savePosp({
        id: pospItem?.id,
        name: form.name.trim(),
        code: form.code.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        joined: form.joined,
        active: form.active === 'true',
        region: form.region.trim(),
        area: form.area.trim(),
        asm: form.asm.trim(),
        rm: form.rm.trim(),
      });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppModal
      visible={visible}
      title={pospItem ? 'Edit POSP' : 'New POSP'}
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <Button title="Cancel" variant="secondary" onPress={onClose} disabled={busy} />
          <Button title={busy ? 'Saving…' : 'Save POSP'} onPress={() => void handleSave()} disabled={busy} />
        </View>
      }>
      <Input label="Full Name" value={form.name} onChangeText={(name) => setForm((f) => ({ ...f, name }))} />
      <Input label="POSP Code" value={form.code} onChangeText={(code) => setForm((f) => ({ ...f, code }))} autoCapitalize="characters" />
      <Input label="Mobile" value={form.mobile} onChangeText={(mobile) => setForm((f) => ({ ...f, mobile }))} keyboardType="phone-pad" />
      <Input
        label="Email"
        value={form.email}
        onChangeText={(email) => setForm((f) => ({ ...f, email }))}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Input
        label="Joined Date (YYYY-MM-DD)"
        value={form.joined}
        onChangeText={(joined) => setForm((f) => ({ ...f, joined }))}
        placeholder="2026-01-01"
      />
      <SelectField
        label="Status"
        value={form.active}
        options={[
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ]}
        onChange={(active) => setForm((f) => ({ ...f, active }))}
      />
      <Input label="Region" value={form.region} onChangeText={(region) => setForm((f) => ({ ...f, region }))} placeholder="North" />
      <Input label="Area" value={form.area} onChangeText={(area) => setForm((f) => ({ ...f, area }))} placeholder="Gurugram" />
      <Input label="ASM" value={form.asm} onChangeText={(asm) => setForm((f) => ({ ...f, asm }))} placeholder="Area Sales Manager" />
      <Input label="RM" value={form.rm} onChangeText={(rm) => setForm((f) => ({ ...f, rm }))} placeholder="Relationship Manager" />
    </AppModal>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
