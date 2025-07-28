'use client';

import { ReactNode } from "react";

interface SidePanelProps {
  children: ReactNode;
}

export default function SidePanel({ children }: SidePanelProps) {
  return (
    <div className="p-4 space-y-4">
        {children}
    </div>
  );
}
