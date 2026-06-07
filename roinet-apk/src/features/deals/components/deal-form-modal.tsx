import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { useAuth } from '@/core/providers/AuthProvider';
import { useCrm } from '@/core/providers/CrmProvider';
import { POLICY_TYPES } from '@/core/constants';
import { INSURERS } from '@/core/constants/crm-config';
import { AppModal } from '@/shared/components/app-modal';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { SelectField } from '@/shared/components/select-field';
import type { Deal, DealStage, DealStatus } from '@/shared/types/crm.types';
import { Spacing } from '@/theme/spacing';

interface DealFormModalProps {
  visible: boolean;
  deal: Deal | null;
  onClose: () => void;
}

interface DealFormState {
  pospId: string;
  customer: string;
  policy: string;
  sum: string;
  premium: string;
  coa: string;
  margin: string;
  brokerage: string;
  status: DealStatus;
  stage: DealStage;
  expected: string;
  proposal: string;
  policyNo: string;
  issued: string;
  insurer: string;
  remarks: string;
}

const emptyForm: DealFormState = {
  pospId: '',
  customer: '',
  policy: 'Life',
  sum: '',
  premium: '',
  coa: '0',
  margin: '0',
  brokerage: '0',
  status: 'W',
  stage: 'open',
  expected: '',
  proposal: '',
  policyNo: '',
  issued: '',
  insurer: '',
  remarks: '',
};

export function DealFormModal({ visible, deal, onClose }: DealFormModalProps) {
  const { user, isAdmin } = useAuth();
  const { posp, saveDeal, deleteDealById } = useCrm();
  const [form, setForm] = useState<DealFormState>(emptyForm);
  const [busy, setBusy] = useState(false);

  const activePosp = posp.filter((p) => p.active || p.id === deal?.pospId);
  const pospOptions = activePosp.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }));

  useEffect(() => {
    if (!visible) {
      return;
    }
    const active = posp.filter((p) => p.active || p.id === deal?.pospId);
    if (deal) {
      setForm({
        pospId: deal.pospId,
        customer: deal.customer,
        policy: deal.policy,
        sum: String(deal.sum ?? ''),
        premium: String(deal.premium ?? ''),
        coa: String(deal.coa ?? 0),
        margin: String(deal.margin ?? 0),
        brokerage: String(deal.brokerage ?? 0),
        status: deal.status,
        stage: deal.stage ?? (deal.policyNo ? 'issued' : 'open'),
        expected: deal.expected ? deal.expected.slice(0, 10) : '',
        proposal: deal.proposal ?? '',
        policyNo: deal.policyNo ?? '',
        issued: deal.issued ? deal.issued.slice(0, 10) : '',
        insurer: deal.insurer ?? '',
        remarks: deal.remarks ?? '',
      });
    } else {
      const defaultPospId = isAdmin ? (active[0]?.id ?? '') : (user?.pospId ?? '');
      setForm({ ...emptyForm, pospId: defaultPospId });
    }
  }, [visible, deal, isAdmin, user?.pospId, posp]);

  async function handleSave() {
    if (!form.customer.trim() || !form.pospId) {
      return;
    }
    setBusy(true);
    try {
      await saveDeal({
        id: deal?.id,
        leadNo: deal?.leadNo ?? '',
        pospId: form.pospId,
        customer: form.customer.trim(),
        policy: form.policy,
        sum: +form.sum || 0,
        premium: +form.premium || 0,
        coa: +form.coa || 0,
        margin: +form.margin || 0,
        brokerage: +form.brokerage || 0,
        status: form.status,
        stage: form.stage,
        lastUpdated: new Date().toISOString().slice(0, 10),
        expected: form.expected,
        proposal: form.proposal.trim(),
        policyNo: form.policyNo.trim(),
        issued: form.issued || null,
        insurer: form.insurer.trim(),
        remarks: form.remarks.trim(),
      });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  function handleDelete() {
    if (!deal) {
      return;
    }
    Alert.alert('Delete deal', `Remove ${deal.customer}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true);
            try {
              await deleteDealById(deal.id);
              onClose();
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  }

  return (
    <AppModal
      visible={visible}
      title={deal ? 'Edit Deal' : 'New Deal'}
      onClose={onClose}
      footer={
        <View style={styles.footerRow}>
          {deal ? (
            <Button title="Delete" variant="danger" onPress={handleDelete} disabled={busy} style={styles.deleteBtn} />
          ) : null}
          <View style={styles.footerActions}>
            <Button title="Cancel" variant="secondary" onPress={onClose} disabled={busy} />
            <Button title={busy ? 'Saving…' : 'Save Deal'} onPress={() => void handleSave()} disabled={busy} />
          </View>
        </View>
      }>
      {isAdmin ? (
        <SelectField
          label="POSP"
          value={form.pospId}
          options={pospOptions}
          onChange={(pospId) => setForm((f) => ({ ...f, pospId }))}
        />
      ) : null}

      <Input
        label="Customer Name"
        value={form.customer}
        onChangeText={(customer) => setForm((f) => ({ ...f, customer }))}
        placeholder="Customer name"
      />

      <SelectField
        label="Policy Type"
        value={form.policy}
        options={POLICY_TYPES.map((t) => ({ value: t, label: t }))}
        onChange={(policy) => setForm((f) => ({ ...f, policy }))}
      />

      <Input
        label="Sum Assured (₹)"
        value={form.sum}
        onChangeText={(sum) => setForm((f) => ({ ...f, sum }))}
        keyboardType="numeric"
        placeholder="0"
      />
      <Input
        label="Premium (₹)"
        value={form.premium}
        onChangeText={(premium) => setForm((f) => ({ ...f, premium }))}
        keyboardType="numeric"
        placeholder="0"
      />
      <Input
        label="COA (₹)"
        value={form.coa}
        onChangeText={(coa) => setForm((f) => ({ ...f, coa }))}
        keyboardType="numeric"
        placeholder="0"
      />
      <Input
        label="Retained Margin (₹)"
        value={form.margin}
        onChangeText={(margin) => setForm((f) => ({ ...f, margin }))}
        keyboardType="numeric"
        placeholder="0"
      />
      <Input
        label="Brokerage (₹)"
        value={form.brokerage}
        onChangeText={(brokerage) => setForm((f) => ({ ...f, brokerage }))}
        keyboardType="numeric"
        placeholder="0"
      />

      <SelectField
        label="Deal Status"
        value={form.status}
        options={[
          { value: 'H', label: 'Hot' },
          { value: 'W', label: 'Warm' },
          { value: 'C', label: 'Cold' },
        ]}
        onChange={(status) => setForm((f) => ({ ...f, status: status as DealStatus }))}
      />

      <SelectField
        label="Stage"
        value={form.stage}
        options={[
          { value: 'open', label: 'Open' },
          { value: 'issued', label: 'Issued' },
          { value: 'lost', label: 'Lost' },
        ]}
        onChange={(stage) => setForm((f) => ({ ...f, stage: stage as DealStage }))}
      />

      <Input
        label="Expected Closure (YYYY-MM-DD)"
        value={form.expected}
        onChangeText={(expected) => setForm((f) => ({ ...f, expected }))}
        placeholder="2026-06-15"
      />
      <Input
        label="Proposal Number"
        value={form.proposal}
        onChangeText={(proposal) => setForm((f) => ({ ...f, proposal }))}
        placeholder="PRP-22301"
      />
      <Input
        label="Policy Number"
        value={form.policyNo}
        onChangeText={(policyNo) => setForm((f) => ({ ...f, policyNo }))}
        placeholder="POL-99812"
      />
      <Input
        label="Issuance Date (YYYY-MM-DD)"
        value={form.issued}
        onChangeText={(issued) => setForm((f) => ({ ...f, issued }))}
        placeholder="2026-05-15"
      />
      <SelectField
        label="Insurer"
        value={form.insurer}
        options={[{ value: '', label: '— Select —' }, ...INSURERS.map((i) => ({ value: i, label: i }))]}
        onChange={(insurer) => setForm((f) => ({ ...f, insurer }))}
      />
      <Input
        label="Remarks"
        value={form.remarks}
        onChangeText={(remarks) => setForm((f) => ({ ...f, remarks }))}
        placeholder="Notes"
        multiline
      />
    </AppModal>
  );
}

const styles = StyleSheet.create({
  footerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  footerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginLeft: 'auto',
  },
  deleteBtn: {
    marginRight: 'auto',
  },
});
