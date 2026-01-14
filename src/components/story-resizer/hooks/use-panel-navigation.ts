import { useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

export type PanelType = "blur" | "ambient" | "color" | "resize";

export function usePanelNavigation() {
  const navigate = useNavigate();
  const { panel: activeSheet } = useSearch({ from: "/" });

  const openPanel = useCallback(
    (panel: PanelType) => {
      navigate({
        to: "/",
        search: { panel },
        resetScroll: false,
      });
    },
    [navigate],
  );

  const closePanel = useCallback(() => {
    navigate({
      to: "/",
      search: {},
      resetScroll: false,
    });
  }, [navigate]);

  return { activeSheet, openPanel, closePanel };
}
