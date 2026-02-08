/* eslint-disable @typescript-eslint/no-explicit-any */
// components/Vault.tsx
"use client";
import { ArtifactBadge } from "./ArtifactBadge";

interface VaultProps {
  artifacts: any[];
  stamps: any[]; // Add this line
}

export default function Vault({ artifacts }: VaultProps) {
  return (
    <div className="space-y-8">
      {/* 2. THE GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {artifacts.map((art) => (
          <ArtifactBadge
            key={art.id}
            svg={art.svg}
            title={art.title}
            date={art.timestamp}
          />
        ))}
      </div>
    </div>
  );
}
