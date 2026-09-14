"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const links = [
    { href: "/dashboard", label: "Pipeline", icon: "▦" },
    { href: "/prospects", label: "Prospects", icon: "◈" },
    { href: "/biens", label: "Catalogue", icon: "⌂" },
    { href: "/agenda", label: "Agenda", icon: "◷" },
];

export function NavLinks({ mobile = false }: { mobile?: boolean }) {
    const pathname = usePathname();

    return (
        <>
            {links.map((l) => {
                const actif = pathname.startsWith(l.href);
                return (
                    <Link
                        key={l.href}
                        href={l.href}
                        className={
                            mobile
                                ? `flex flex-1 flex-col items-center gap-1 py-2 text-[11px] ${actif ? "text-foret-600" : "text-encre-400"
                                }`
                                : `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${actif
                                    ? "bg-foret-50 font-medium text-foret-700"
                                    : "text-encre-600 hover:bg-sable-100"
                                }`
                        }
                    >
                        <span className={mobile ? "text-base" : "text-sm opacity-70"}>
                            {l.icon}
                        </span>
                        {l.label}
                    </Link>
                );
            })}
        </>
    );
}