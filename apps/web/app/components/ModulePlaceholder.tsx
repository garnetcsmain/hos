"use client";

import { useState } from "react";
import { AppShell } from "@/app/components/HosDashboard";

export function ModulePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const [trustLayer, setTrustLayer] = useState(true);

  return (
    <AppShell
      title={title}
      subtitle={description}
      trustLayer={trustLayer}
      onToggleTrustLayer={() => setTrustLayer((value) => !value)}
      onOpenFamily={() => undefined}
      modalKind={null}
      onCloseModal={() => undefined}
    >
      <div className="flex flex-1 px-[28px] py-[28px] max-[900px]:px-[18px] max-[900px]:py-[18px]">
        <section className="flex min-h-[420px] w-full flex-col justify-center rounded-[8px] border border-[var(--hos-border)] bg-white p-[28px]">
          <div className="max-w-[680px]">
            <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--hos-muted)]">Module workspace</div>
            <h2 className="mt-[12px] text-[28px] font-extrabold leading-none text-[var(--hos-text)]">{title}</h2>
            <p className="mt-[14px] text-[15px] font-bold leading-[22px] text-[var(--hos-muted)]">{description}</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
