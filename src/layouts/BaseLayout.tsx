import React from "react";
import DragWindowRegion from "@/components/DragWindowRegion";
import Navbar from "@/components/Navbar";
import { useTranslation } from "react-i18next";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Window drag region (title bar) */}
      <div className="flex-shrink-0">
        <DragWindowRegion title={t("appName")} />
      </div>

      {/* Navigation bar */}
      <div className="flex-shrink-0">
        <Navbar />
      </div>

      {/* Main content area */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
