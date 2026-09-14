import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NavLinks } from "@/components/nav-links";
import { BoutonDeconnexion } from "@/components/bouton-deconnexion";

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const initiales = (session.user.name ?? "?")
        .split(" ")
        .map((m) => m[0])
        .slice(0, 2)
        .join("");

    return (
        <div className="flex min-h-screen">
            {/* Sidebar desktop */}
            <aside className="hidden w-60 shrink-0 flex-col border-r border-sable-200 bg-white px-4 py-6 md:flex">
                <div className="mb-8 px-3">
                    <span className="font-display text-xl text-foret-700">Rive</span>
                    <p className="mt-0.5 text-[11px] uppercase tracking-widest text-encre-400">
                        CRM immobilier
                    </p>
                </div>

                <nav className="flex flex-1 flex-col gap-1">
                    <NavLinks />
                </nav>

                <div className="mt-6 space-y-3 border-t border-sable-200 pt-4">
                    <div className="flex items-center gap-3 px-1">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foret-500 text-xs font-medium text-white">
                            {initiales}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{session.user.name}</p>
                            <p className="truncate text-xs text-encre-400">
                                {session.user.email}
                            </p>
                        </div>
                    </div>
                    <BoutonDeconnexion />
                </div>
            </aside>

            {/* Contenu */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Header mobile */}
                <header className="flex items-center justify-between border-b border-sable-200 bg-white px-4 py-3 md:hidden">
                    <span className="font-display text-lg text-foret-700">Rive</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foret-500 text-[11px] font-medium text-white">
                        {initiales}
                    </div>
                </header>

                <main className="flex-1 px-5 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
                    {children}
                </main>

                {/* Nav mobile */}
                <nav className="fixed inset-x-0 bottom-0 flex border-t border-sable-200 bg-white md:hidden">
                    <NavLinks mobile />
                </nav>
            </div>
        </div>
    );
}