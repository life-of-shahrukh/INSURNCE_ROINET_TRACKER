"use client";

import { Modal } from "@/components/ui/Modal";
import { UserProfileView } from "@/components/profile/UserProfileView";
import { SkeletonBlock } from "@/components/skeletons";
import { useUserProfile } from "@/hooks/useUserProfile";

interface UserProfileModalProps {
  open: boolean;
  userCode: string | null;
  onClose: () => void;
}

export function UserProfileModal({
  open,
  userCode,
  onClose,
}: UserProfileModalProps): React.ReactElement {
  const { data, isLoading, isError, error } = useUserProfile(userCode, open);

  const title = data
    ? (data.salesTeam?.name ?? data.posp?.name ?? data.userCode ?? "User Profile")
    : (userCode ?? "User Profile");

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      wide
      footer={null}
    >
      {isLoading && (
        <div style={{ display: "grid", gap: "1rem" }}>
          <SkeletonBlock height="5rem" borderRadius="12px" />
          <SkeletonBlock height="14rem" borderRadius="8px" />
          <SkeletonBlock height="10rem" borderRadius="8px" />
        </div>
      )}
      {isError && (
        <div className="empty" style={{ color: "#ef4444" }}>
          {error instanceof Error ? error.message : "Failed to load profile"}
        </div>
      )}
      {!isLoading && !isError && data && <UserProfileView data={data} />}
    </Modal>
  );
}
