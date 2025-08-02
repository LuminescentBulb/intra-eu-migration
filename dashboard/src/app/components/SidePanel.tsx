'use client';

import { ReactNode } from "react";

interface SidePanelProps {
  children: ReactNode;
}

export default function SidePanel({ children }: SidePanelProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
