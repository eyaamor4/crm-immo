"use client";

import { signOut } from "next-auth/react";

export function BoutonDeconnexion() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full rounded-lg border border-sable-200 px-3 py-2 text-left text-sm text-encre-600 transition hover:bg-sable-100"
        >
            Déconnexion
        </button>
    );
}