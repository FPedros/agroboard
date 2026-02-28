import { usePowerBiLink } from "@/hooks/usePowerBiLink";

const ComercialPage = () => {
  const { data, loading, error } = usePowerBiLink({ sectorSlug: "consultoria", panel: "comercial" });

  if (loading) return <p>Carregando painel...</p>;
  if (error) return <p style={{ color: "red" }}>Erro: {error}</p>;
  if (!data) return <p>Nenhum link configurado.</p>;

  return (
    <iframe
      src={data.url}
      style={{ width: "100%", height: "calc(100vh - 120px)" }}
      allowFullScreen
    />
  );
};

export default ComercialPage;
