import { usePowerBiLink } from "@/hooks/usePowerBiLink";

const ConsultoriaFinanceiroPage = () => {
  const { data, loading, error } = usePowerBiLink({ sectorSlug: "consultoria", panel: "financeiro" });

  if (loading) return <p>Carregando painel...</p>;
  if (error) return <p style={{ color: "red" }}>Erro: {error}</p>;
  if (!data) return <p>Nenhum link configurado.</p>;

  return (
    <iframe
      title="Processos_Consultoria_novo"
      src={data.url}
      style={{ width: "100%", height: "calc(100vh - 120px)" }}
      allowFullScreen
    />
  );
};

export default ConsultoriaFinanceiroPage;
