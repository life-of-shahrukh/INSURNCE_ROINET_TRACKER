"use client";

import { useProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProfilePageSkeleton } from "@/components/skeletons";
import { UserProfileView, getProfileDisplayMeta } from "@/components/profile/UserProfileView";

export default function ProfilePage(): React.ReactElement {
  const { data, isLoading, isError } = useProfile();

  if (isLoading) {
    return <ProfilePageSkeleton />;
  }

  if (isError || !data) {
    return (
      <div style={{ padding: "2rem" }}>
        <PageHeader title="My Profile" subtitle="Unable to load profile" />
        <Card>
          <div style={{ padding: "2rem", textAlign: "center", color: "#ef4444" }}>
            Failed to load profile. Please refresh the page.
          </div>
        </Card>
      </div>
    );
  }

  const { roleLabel } = getProfileDisplayMeta(data);

  return (
    <div style={{ padding: "2rem" }}>
      <PageHeader
        title="My Profile"
        subtitle={`${roleLabel} — ${data.user.email}`}
      />
      <div style={{ maxWidth: "900px" }}>
        <UserProfileView data={data} />
      </div>
    </div>
  );
}
