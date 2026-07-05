import { toast } from "sonner";

export type IntegrationErrorCode =
  | "AUTH_INVALID"
  | "AUTH_EXPIRED"
  | "AUTH_MISSING"
  | "RATE_LIMITED"
  | "CREDITS"
  | "BAD_REQUEST"
  | "UPSTREAM"
  | "NETWORK"
  | "UNAUTHORIZED"
  | "UNKNOWN";

export interface ParsedIntegrationError {
  code: IntegrationErrorCode;
  title: string;
  description: string;
  actionable: boolean;
  raw: string;
}

const TAG_RE = /\[([A-Z_]+)\]\s*(.*)$/s;

export function parseIntegrationError(err: unknown): ParsedIntegrationError {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const tagged = raw.match(TAG_RE);
  const code = (tagged?.[1] as IntegrationErrorCode) ?? inferCode(raw);
  const rest = tagged?.[2]?.trim() || raw;

  switch (code) {
    case "AUTH_EXPIRED":
      return {
        code,
        title: "Sessão da IA expirada",
        description:
          "A chave de acesso à IA expirou. Renove a integração em Configurações → Saúde da integração e tente novamente.",
        actionable: true,
        raw,
      };
    case "AUTH_INVALID":
      return {
        code,
        title: "Autenticação da IA inválida",
        description:
          "A chave de acesso à IA foi rejeitada. Renove a integração em Configurações → Saúde da integração e teste novamente.",
        actionable: true,
        raw,
      };
    case "AUTH_MISSING":
      return {
        code,
        title: "Integração de IA não configurada",
        description:
          "Nenhuma chave de acesso está ativa. Ative o Lovable Cloud e verifique em Configurações → Saúde da integração.",
        actionable: true,
        raw,
      };
    case "UNAUTHORIZED":
      return {
        code,
        title: "Sessão do usuário expirada",
        description: "Faça login novamente para continuar.",
        actionable: true,
        raw,
      };
    case "RATE_LIMITED":
      return {
        code,
        title: "Muitas requisições",
        description: "Aguarde alguns segundos e tente novamente.",
        actionable: false,
        raw,
      };
    case "CREDITS":
      return {
        code,
        title: "Créditos de IA esgotados",
        description: "Adicione créditos ao workspace para continuar usando a identificação por foto.",
        actionable: true,
        raw,
      };
    case "NETWORK":
      return {
        code,
        title: "Sem conexão com a IA",
        description: "Verifique sua internet e tente novamente.",
        actionable: false,
        raw,
      };
    case "BAD_REQUEST":
      return {
        code,
        title: "Requisição rejeitada pela IA",
        description: rest || "A imagem ou os dados enviados não foram aceitos. Tente novamente com outra foto.",
        actionable: false,
        raw,
      };
    case "UPSTREAM":
      return {
        code,
        title: "IA indisponível",
        description: "Falha temporária no serviço de IA. Tente novamente em instantes.",
        actionable: false,
        raw,
      };
    default:
      return {
        code: "UNKNOWN",
        title: "Erro ao processar",
        description: rest || "Ocorreu um erro inesperado.",
        actionable: false,
        raw,
      };
  }
}

function inferCode(msg: string): IntegrationErrorCode {
  const m = msg.toLowerCase();
  if (m.includes("unauthorized") || m.includes("no authorization header")) return "UNAUTHORIZED";
  if (m.includes("network") || m.includes("failed to fetch")) return "NETWORK";
  return "UNKNOWN";
}

export function toastIntegrationError(err: unknown) {
  const p = parseIntegrationError(err);
  toast.error(p.title, { description: p.description });
  return p;
}
