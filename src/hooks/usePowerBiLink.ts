import { useEffect, useState } from "react";
import { fetchPowerBiLinkBySectorAndPanel } from "@/lib/powerBiRepository";
import { PowerBiLink, PowerBiPanel } from "@/lib/types";

export function usePowerBiLink({ sectorSlug, panel }: { sectorSlug: string; panel: PowerBiPanel }) {
  const [data, setData] = useState<PowerBiLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    if (!sectorSlug) {
      setData(null);
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    fetchPowerBiLinkBySectorAndPanel(sectorSlug, panel)
      .then((link) => {
        if (!isMounted) return;
        setData(link);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message ?? "Erro ao buscar link do Power BI");
        setData(null);
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sectorSlug, panel]);

  return { data, loading, error };
}
