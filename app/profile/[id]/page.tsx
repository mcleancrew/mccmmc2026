import ProfilePage from "@/components/profile-page"

export default function UserProfile({ params }: { params: { id: string } }) {
  return <ProfilePage userId={params.id} />
}
