import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Tableau de bord</h1>
      <p>Connecté : {session?.user?.email}</p>
      <p className="text-xs text-gray-500">ID : {session?.user?.id}</p>
    </div>
  );
}