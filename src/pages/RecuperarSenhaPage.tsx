import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Leaf } from "lucide-react";

const RecuperarSenhaPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar recuperação de senha com API.
    console.log("Recuperar senha para:", email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full rounded-xl shadow-2xl bg-card/50 backdrop-blur-sm border border-border p-8 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Leaf className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Recuperar senha</h1>
            <p className="text-muted-foreground text-sm">
              Digite seu e-mail para receber instruções de recuperação.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary border-border focus:ring-primary"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg mt-2"
          >
            Enviar instruções
          </Button>

          <Button type="button" variant="ghost" onClick={() => navigate("/")} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao login
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground mt-2">* Funcionalidade em desenvolvimento.</p>
      </div>
    </div>
  );
};

export default RecuperarSenhaPage;
