import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Search, Info, Users, Workflow, Lightbulb,
  Clock, Map, Headphones, Activity, Code2, ChevronDown,
  Mail, Building2, Zap, Package, Eye, Key, CheckCircle2,
  Lock, User, ArrowRight, FileText, Upload, BarChart3,
  CheckCheck, Shield, AlertCircle, Star, PlayCircle, MessageCircle,
} from "lucide-react";

export const Route = createFileRoute("/documentacao")({
  component: DocumentacaoPage,
});

const APP_VERSION = "2.1.0";
const APP_BUILD_DATE = "2025-05-21";
const APP_ENV = import.meta.env.MODE;

const NAV_SECTIONS = [
  { id: "sobre", label: "Sobre o Sistema", icon: Info },
  { id: "como-usar", label: "Como Utilizar", icon: PlayCircle },
  { id: "perfis", label: "Perfis e Permissões", icon: Shield },
  { id: "fluxo", label: "Fluxo Operacional", icon: Workflow },
  { id: "faq", label: "FAQ", icon: MessageCircle },
  { id: "boas-praticas", label: "Boas Práticas", icon: Lightbulb },
  { id: "changelog", label: "Changelog", icon: Clock },
  { id: "roadmap", label: "Roadmap", icon: Map },
  { id: "suporte", label: "Suporte", icon: Headphones },
  { id: "sobre-projeto", label: "Sobre o Projeto", icon: Code2 },
  { id: "status", label: "Status do Sistema", icon: Activity },
] as const;

const C = {
  primary: "oklch(0.50 0.225 255)",
  success: "oklch(0.36 0.14 150)",
  warning: "oklch(0.40 0.12 70)",
  danger: "oklch(0.50 0.235 27)",
  muted: "oklch(0.46 0.028 252)",
  purple: "oklch(0.50 0.18 290)",
  amber: "oklch(0.72 0.165 70)",
};

// ─── HELPER COMPONENTS ────────────────────────────────────────────────────────

function SectionCard({
  id, title, icon: Icon, iconColor = C.primary, children,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  iconColor?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section id={id} className="scroll-mt-4">
      <div
        className="bg-card border border-border/60 rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 1px 4px oklch(0.115 0.028 252 / 0.07)" }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/20 transition-colors"
          aria-expanded={open}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${iconColor}18` }}
            >
              <Icon className="h-4 w-4" style={{ color: iconColor }} />
            </div>
            <h2 className="text-base font-semibold text-left">{title}</h2>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0",
              !open && "-rotate-90",
            )}
          />
        </button>
        {open && (
          <div className="px-6 pb-6 space-y-4 border-t border-border/40 pt-4">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}

function Step({ number, title, description, isLast = false }: {
  number: number;
  title: string;
  description?: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
          style={{ background: C.primary }}
        >
          {number}
        </div>
        {!isLast && <div className="w-px flex-1 min-h-3 mt-1 bg-border/50" />}
      </div>
      <div className={cn("min-w-0", !isLast && "pb-3")}>
        <p className="text-sm font-medium leading-snug">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

function Tutorial({ title, steps }: {
  title: string;
  steps: Array<{ title: string; description?: string }>;
}) {
  return (
    <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <ArrowRight className="h-3.5 w-3.5 shrink-0" style={{ color: C.primary }} />
        {title}
      </h3>
      <div>
        {steps.map((step, i) => (
          <Step
            key={i}
            number={i + 1}
            title={step.title}
            description={step.description}
            isLast={i === steps.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: {
  question: string;
  answer: string | string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/20 transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm font-medium">{question}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform shrink-0 ml-2",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="px-4 pb-3 border-t border-border/40 pt-3">
          {Array.isArray(answer) ? (
            <ul className="space-y-1.5">
              {answer.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0 mt-1.5 inline-block"
                    style={{ background: C.primary }}
                  />
                  {a}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{answer}</p>
          )}
        </div>
      )}
    </div>
  );
}

function FlowStep({ label, description, color = C.primary, isLast = false }: {
  label: string;
  description: string;
  color?: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `${color}20`, border: `2px solid ${color}60` }}
        >
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        </div>
        {!isLast && (
          <div className="w-px flex-1 min-h-5 mt-1" style={{ background: `${color}30` }} />
        )}
      </div>
      <div className={cn("min-w-0", !isLast && "pb-4")}>
        <p className="text-sm font-semibold leading-snug">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function PracticeItem({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl border border-border/30">
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${C.success}18` }}
      >
        <Icon className="h-4 w-4" style={{ color: C.success }} />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function ChangelogEntry({ version, date, changes, type }: {
  version: string;
  date: string;
  changes: string[];
  type: "major" | "minor" | "patch";
}) {
  const colors = { major: C.primary, minor: C.success, patch: C.muted };
  const labels = { major: "Major", minor: "Minor", patch: "Patch" };
  const color = colors[type];
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="h-3 w-3 rounded-full mt-1 shrink-0" style={{ background: color }} />
        <div className="w-px flex-1 bg-border/40 mt-1" />
      </div>
      <div className="pb-5 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-sm font-bold" style={{ color }}>v{version}</span>
          <span className="text-xs text-muted-foreground">{date}</span>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0"
            style={{ borderColor: `${color}50`, color }}
          >
            {labels[type]}
          </Badge>
        </div>
        <ul className="space-y-1">
          {changes.map((c, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
              <CheckCheck className="h-3 w-3 mt-0.5 shrink-0" style={{ color: C.success }} />
              {c}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RoadmapItem({ title, status }: {
  title: string;
  status: "done" | "progress" | "planned";
}) {
  const config = {
    done: { color: C.success, Icon: CheckCircle2 },
    progress: { color: C.amber, Icon: Zap },
    planned: { color: C.muted, Icon: null },
  };
  const { color, Icon } = config[status];
  return (
    <div className="flex items-center gap-2 py-1">
      {Icon ? (
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
      ) : (
        <span
          className="h-3 w-3 rounded-full border shrink-0 inline-block"
          style={{ borderColor: color }}
        />
      )}
      <span className="text-sm text-muted-foreground">{title}</span>
    </div>
  );
}

function InfoCard({ label, value, icon: Icon, color }: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl border border-border/30">
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

// ─── DOC NAV SIDEBAR ──────────────────────────────────────────────────────────

function DocNavSidebar({ activeSection, onSelect, search, onSearch }: {
  activeSection: string;
  onSelect: (id: string) => void;
  search: string;
  onSearch: (v: string) => void;
}) {
  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0">
      <div
        className="sticky top-6 bg-card border border-border/60 rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 1px 4px oklch(0.115 0.028 252 / 0.07)" }}
      >
        <div className="px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2 mb-2.5">
            <BookOpen className="h-4 w-4 shrink-0" style={{ color: C.primary }} />
            <span className="text-sm font-semibold">Manual Operacional</span>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>
        <nav className="py-2 px-2" aria-label="Seções da documentação">
          {NAV_SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all text-left",
                activeSection === id
                  ? "font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
              )}
              style={
                activeSection === id
                  ? { background: `${C.primary}15`, color: C.primary }
                  : undefined
              }
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>
        <div className="px-4 py-2.5 border-t border-border/40 bg-muted/20">
          <p className="text-[10px] text-muted-foreground text-center">
            GRUPO TTC · v{APP_VERSION}
          </p>
        </div>
      </div>
    </aside>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

function DocumentacaoPage() {
  usePageTitle("Documentação");
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("sobre");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isAdmin) navigate({ to: "/dashboard" });
  }, [isAdmin, navigate]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    NAV_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: "-10% 0px -70% 0px", threshold: 0 },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };

  if (!isAdmin) return null;

  const envLabel =
    APP_ENV === "production"
      ? "Produção"
      : APP_ENV === "development"
        ? "Desenvolvimento"
        : "Homologação";

  const envColor = APP_ENV === "production" ? C.success : C.amber;

  return (
    <AppLayout>
      <div className="flex-1 min-h-0 p-4 md:p-6">

        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Administração</span>
            <span>/</span>
            <span className="font-medium text-foreground">Documentação</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Manual Operacional</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Central de documentação interna · Uso exclusivo administrativo
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-xs shrink-0 hidden sm:flex"
              style={{ borderColor: `${C.success}50`, color: C.success }}
            >
              v{APP_VERSION}
            </Badge>
          </div>

          {/* Mobile search */}
          <div className="relative mt-4 lg:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar na documentação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Mobile nav tabs */}
          <div className="mt-3 lg:hidden overflow-x-auto pb-1">
            <div className="flex gap-2 min-w-max">
              {NAV_SECTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all border",
                    activeSection === id
                      ? "font-medium border-transparent"
                      : "text-muted-foreground border-border/50 hover:border-border",
                  )}
                  style={
                    activeSection === id
                      ? {
                        background: `${C.primary}15`,
                        color: C.primary,
                        borderColor: `${C.primary}30`,
                      }
                      : undefined
                  }
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6">
          <DocNavSidebar
            activeSection={activeSection}
            onSelect={scrollTo}
            search={search}
            onSearch={setSearch}
          />

          <div className="flex-1 min-w-0 space-y-4">

            {/* ── 1. SOBRE O SISTEMA ─────────────────────────────────── */}
            <SectionCard id="sobre" title="Sobre o Sistema" icon={Info}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <InfoCard label="Sistema" value="Grupo TTC — Gestão de Preventivas" icon={Building2} color={C.primary} />
                <InfoCard label="Objetivo" value="Gestão de manutenções preventivas em telecom" icon={Zap} color={C.success} />
                <InfoCard label="Público" value="Gestores e equipes de campo" icon={Users} color={C.purple} />
                <InfoCard label="Versão atual" value={`v${APP_VERSION} — ${APP_BUILD_DATE}`} icon={Star} color={C.amber} />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                O sistema Grupo TTC centraliza e otimiza a gestão de ocorrências de manutenção preventiva em infraestrutura de telecomunicações. Equipes de campo registram, acompanham e finalizam serviços com controle completo de auditoria, materiais utilizados e relatórios em PDF.
              </p>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {([
                  { icon: FileText, label: "Gestão de Ocorrências", desc: "Criação, acompanhamento e finalização" },
                  { icon: Users, label: "Gestão de Usuários", desc: "Cadastro e controle de acesso" },
                  { icon: Building2, label: "Gestão de Equipes", desc: "Times e atribuições de campo" },
                  { icon: Package, label: "Materiais", desc: "Controle de insumos por ocorrência" },
                  { icon: BarChart3, label: "Dashboard", desc: "Métricas e indicadores operacionais" },
                  { icon: Upload, label: "Relatórios PDF", desc: "Exportação com fotos e serviços" },
                ] as const).map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-center gap-2.5 p-2.5 bg-muted/30 rounded-lg border border-border/30">
                    <Icon className="h-4 w-4 shrink-0" style={{ color: C.primary }} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{label}</p>
                      <p className="text-[10px] text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* ── 2. COMO UTILIZAR ───────────────────────────────────── */}
            <SectionCard id="como-usar" title="Como Utilizar o Sistema" icon={PlayCircle} iconColor={C.purple}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Tutorial
                  title="Criar uma Ocorrência"
                  steps={[
                    { title: 'Acesse "Ocorrências" no menu lateral', description: "Disponível para todos os perfis" },
                    { title: 'Clique em "Nova Ocorrência"', description: "Botão no canto superior direito" },
                    { title: "Preencha os dados obrigatórios", description: "Título, tipo de serviço, equipe e data" },
                    { title: "Salve o registro", description: "Status inicial será PENDENTE" },
                  ]}
                />
                <Tutorial
                  title="Finalizar uma Ocorrência"
                  steps={[
                    { title: "Abra a ocorrência desejada" },
                    { title: "Adicione os serviços realizados", description: "Com materiais e fotos de cada etapa" },
                    { title: "Adicione fotos finais da obra", description: "Evidências do trabalho concluído" },
                    { title: 'Clique em "Finalizar"', description: "Status muda para FINALIZADA" },
                  ]}
                />
                <Tutorial
                  title="Criar um Usuário"
                  steps={[
                    { title: 'Acesse "Usuários" no menu', description: "Disponível apenas para Administradores" },
                    { title: 'Clique em "Novo Usuário"' },
                    { title: "Preencha nome, e-mail e perfil", description: "Perfis: Admin, Supervisor ou Operador" },
                    { title: "Copie a senha temporária gerada", description: "Compartilhe com o usuário com segurança" },
                    { title: "O usuário trocará a senha no primeiro acesso" },
                  ]}
                />
                <Tutorial
                  title="Resetar Senha de Usuário"
                  steps={[
                    { title: 'Acesse "Usuários" e localize o usuário' },
                    { title: "Clique no ícone de chave (reset)" },
                    { title: "Confirme a operação" },
                    { title: "Copie a nova senha temporária", description: "Usuário será obrigado a trocar no próximo login" },
                  ]}
                />
                <Tutorial
                  title="Upload de Fotos"
                  steps={[
                    { title: "Dentro de uma ocorrência, acesse a aba de serviços" },
                    { title: 'Em cada serviço, clique em "Adicionar Foto"' },
                    { title: "Selecione o arquivo", description: "Formatos: JPG, PNG, HEIC · Máx: 10 MB" },
                    { title: "Para fotos finais, use a seção específica na parte inferior" },
                  ]}
                />
                <Tutorial
                  title="Gerar Relatório PDF"
                  steps={[
                    { title: "Abra a ocorrência desejada" },
                    { title: 'Clique em "Gerar Relatório"', description: "Disponível em qualquer status" },
                    { title: "Aguarde a geração", description: "Pode levar alguns segundos conforme número de fotos" },
                    { title: "O PDF será baixado automaticamente" },
                  ]}
                />
                <Tutorial
                  title="Importar via CSV"
                  steps={[
                    { title: 'Acesse "Importar CSV" no menu' },
                    { title: "Baixe o modelo de arquivo para referência" },
                    { title: "Preencha os dados conforme o modelo" },
                    { title: "Faça o upload do arquivo preenchido" },
                    { title: "Revise e confirme a importação" },
                  ]}
                />
                <Tutorial
                  title="Reabrir uma Ocorrência"
                  steps={[
                    { title: "Abra a ocorrência finalizada" },
                    { title: 'Clique em "Reabrir"', description: "Disponível para Admin, Supervisor e Operador" },
                    { title: "Status volta para EM ANDAMENTO", description: "Reabertura registrada nos logs de auditoria" },
                  ]}
                />
              </div>
            </SectionCard>

            {/* ── 3. PERFIS E PERMISSÕES ─────────────────────────────── */}
            <SectionCard id="perfis" title="Perfis e Permissões" icon={Shield} iconColor={C.danger}>
              <div className="overflow-x-auto rounded-xl border border-border/50">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: `${C.primary}10` }}>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Permissão</th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold" style={{ color: C.danger }}>Admin</th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold" style={{ color: C.amber }}>Supervisor</th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold" style={{ color: C.muted }}>Operador</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        { perm: "Criar ocorrências", admin: true, sup: true, op: true },
                        { perm: "Editar ocorrências", admin: true, sup: true, op: true },
                        { perm: "Finalizar ocorrências", admin: true, sup: true, op: true },
                        { perm: "Reabrir ocorrências", admin: true, sup: true, op: true },
                        { perm: "Excluir ocorrências", admin: true, sup: true, op: false },
                        { perm: "Upload de fotos", admin: true, sup: true, op: true },
                        { perm: "Gerar relatórios PDF", admin: true, sup: true, op: true },
                        { perm: "Gerenciar equipes", admin: true, sup: true, op: false },
                        { perm: "Gerenciar tipos de serviço", admin: true, sup: true, op: false },
                        { perm: "Gerenciar materiais", admin: true, sup: true, op: false },
                        { perm: "Ver logs de auditoria", admin: true, sup: true, op: false },
                        { perm: "Importar via CSV", admin: true, sup: true, op: false },
                        { perm: "Gerenciar usuários", admin: true, sup: false, op: false },
                        { perm: "Criar / resetar senhas", admin: true, sup: false, op: false },
                        { perm: "Documentação interna", admin: true, sup: false, op: false },
                      ] as const
                    ).map(({ perm, admin, sup, op }, i) => (
                      <tr key={perm} className={cn("border-t border-border/30", i % 2 !== 0 && "bg-muted/10")}>
                        <td className="px-4 py-2 text-sm">{perm}</td>
                        {[admin, sup, op].map((has, j) => (
                          <td key={j} className="px-4 py-2 text-center">
                            {has ? (
                              <CheckCircle2 className="h-4 w-4 mx-auto" style={{ color: C.success }} />
                            ) : (
                              <span className="text-muted-foreground/30 text-xs">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { role: "Administrador", color: C.danger, desc: "Acesso total ao sistema. Responsável pela configuração, usuários e integridade operacional." },
                  { role: "Supervisor", color: C.amber, desc: "Acesso operacional completo. Gerencia ocorrências e equipes, sem acesso à gestão de usuários." },
                  { role: "Operador", color: C.muted, desc: "Acesso restrito à própria equipe. Foco no registro e execução dos serviços de campo." },
                ].map(({ role, color, desc }) => (
                  <div key={role} className="p-3 rounded-xl border border-border/40" style={{ background: `${color}08` }}>
                    <p className="text-sm font-semibold mb-1" style={{ color }}>{role}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* ── 4. FLUXO OPERACIONAL ───────────────────────────────── */}
            <SectionCard id="fluxo" title="Fluxo Operacional" icon={Workflow} iconColor={C.purple}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3">
                    Ciclo de vida da ocorrência
                  </p>
                  <FlowStep label="Criação" description="Admin ou Supervisor registra a ocorrência com dados básicos. Status: PENDENTE." color={C.muted} />
                  <FlowStep label="Atribuição de Equipe" description="Uma equipe é vinculada à ocorrência para execução dos serviços." color={C.primary} />
                  <FlowStep label="Execução" description="Operadores registram os serviços com fotos e materiais. Status: EM ANDAMENTO." color={C.amber} />
                  <FlowStep label="Validação" description="Supervisor ou Admin revisa os registros antes da finalização." color={C.purple} />
                  <FlowStep label="Finalização" description="Ocorrência concluída com fotos finais registradas. Status: FINALIZADA." color={C.success} />
                  <FlowStep label="Auditoria" description="Todas as ações ficam registradas nos logs do sistema." color={C.muted} isLast />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3">
                    Status possíveis
                  </p>
                  {[
                    { status: "PENDENTE", desc: "Ocorrência criada, sem serviços iniciados.", color: C.muted },
                    { status: "EM ANDAMENTO", desc: "Serviços em execução pela equipe responsável.", color: C.amber },
                    { status: "FINALIZADA", desc: "Todos os serviços concluídos e fotos finais registradas.", color: C.success },
                  ].map(({ status, desc, color }) => (
                    <div key={status} className="flex items-start gap-3 p-3 rounded-xl border border-border/30 mb-2">
                      <div className="h-6 w-6 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${color}20` }}>
                        <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                      </div>
                      <div>
                        <Badge variant="outline" className="text-[10px] font-bold mb-1" style={{ borderColor: `${color}50`, color }}>
                          {status}
                        </Badge>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                  <div className="mt-2 p-3 rounded-xl border border-border/30 bg-muted/20">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Reabertura:</span>{" "}
                      Ocorrência FINALIZADA pode ser reaberta por qualquer perfil, voltando para EM ANDAMENTO. Toda reabertura é registrada nos logs.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ── 5. FAQ ─────────────────────────────────────────────── */}
            <SectionCard id="faq" title="Perguntas Frequentes (FAQ)" icon={MessageCircle} iconColor={C.amber}>
              <div className="space-y-2">
                <FAQItem
                  question="Não consigo fazer login. O que pode ser?"
                  answer={[
                    "Verifique se e-mail e senha estão corretos.",
                    "Sua conta pode estar inativa — contate o administrador.",
                    "Se o sistema exigir troca de senha, você será redirecionado automaticamente.",
                    "A sessão expira após 24 horas. Faça login novamente.",
                  ]}
                />
                <FAQItem
                  question="Uma ocorrência não aparece na minha lista. Por quê?"
                  answer={[
                    "Verifique os filtros aplicados no topo da lista.",
                    "Operadores visualizam apenas ocorrências da própria equipe.",
                    "A ocorrência pode não ter sido atribuída à sua equipe.",
                    "Verifique se o filtro de status inclui todos os status.",
                  ]}
                />
                <FAQItem
                  question="O arquivo de foto não sobe. O que fazer?"
                  answer={[
                    "Formatos aceitos: JPG, JPEG, PNG e HEIC.",
                    "Tamanho máximo: 10 MB por arquivo.",
                    "Verifique sua conexão com a internet.",
                    "Tente reduzir o tamanho da imagem antes de enviar.",
                  ]}
                />
                <FAQItem
                  question="Não consigo editar uma ocorrência finalizada."
                  answer="Ocorrências finalizadas são bloqueadas para edição direta. Use a opção 'Reabrir' para volá-la ao status EM ANDAMENTO e então realize as edições necessárias."
                />
                <FAQItem
                  question="Como faço para mudar a senha de um usuário?"
                  answer="Somente Administradores podem resetar senhas. Acesse Usuários → localize o usuário → clique no ícone de chave. Uma nova senha temporária será gerada e o usuário precisará trocá-la no próximo login."
                />
                <FAQItem
                  question="O relatório PDF está demorando para gerar."
                  answer="O tempo de geração depende da quantidade de fotos. Ocorrências com muitas fotos podem levar entre 10 e 30 segundos. Aguarde sem fechar a aba."
                />
                <FAQItem
                  question="Esqueci minha senha. Como recupero?"
                  answer="Entre em contato com o Administrador do sistema. Ele irá resetar sua senha e fornecer uma senha temporária que deverá ser trocada no primeiro acesso."
                />
                <FAQItem
                  question="Por que o Dashboard mostra números diferentes dependendo do filtro de data?"
                  answer='O Dashboard possui opção de "base de data" que permite filtrar por data da ocorrência ou por data dos serviços. Verifique qual base está selecionada para obter os dados corretos para o período desejado.'
                />
              </div>
            </SectionCard>

            {/* ── 6. BOAS PRÁTICAS ───────────────────────────────────── */}
            <SectionCard id="boas-praticas" title="Boas Práticas de Utilização" icon={Lightbulb} iconColor={C.success}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <PracticeItem icon={Lock} title="Não compartilhe seu acesso" description="Cada usuário deve ter credenciais próprias. O sistema registra quem realizou cada ação." />
                <PracticeItem icon={Eye} title="Revise antes de confirmar" description="Verifique todos os dados antes de finalizar. A reversão gera histórico adicional no log." />
                <PracticeItem icon={User} title="Um acesso por pessoa" description="Não utilize a mesma conta entre múltiplos usuários. Crie um acesso individual para cada membro." />
                <PracticeItem icon={Key} title="Troque a senha regularmente" description="Use senhas fortes e únicas. Nunca anote senhas em locais visíveis ou compartilhados." />
                <PracticeItem icon={Upload} title="Qualidade nas fotos" description="Envie fotos nítidas e bem iluminadas. Elas compõem o relatório oficial da ocorrência." />
                <PracticeItem icon={FileText} title="Descreva com precisão" description="Registros detalhados facilitam auditoria e reabertura futura de ocorrências." />
                <PracticeItem icon={CheckCheck} title="Registre todos os serviços" description="Cada serviço deve ser registrado individualmente com materiais e fotos correspondentes." />
                <PracticeItem icon={AlertCircle} title="Reporte inconsistências" description="Se encontrar dados incorretos ou comportamentos inesperados, notifique o Administrador." />
              </div>
            </SectionCard>

            {/* ── 7. CHANGELOG ───────────────────────────────────────── */}
            <SectionCard id="changelog" title="Histórico de Atualizações" icon={Clock} iconColor={C.primary}>
              <div className="max-w-2xl">
                <ChangelogEntry
                  version="2.1.0"
                  date="Maio 2025"
                  type="minor"
                  changes={[
                    "Filtro por base de data no Dashboard (ocorrência vs. serviço)",
                    "Refatoração do modal de troca de senha obrigatória",
                    "Campo equipe_atribuida_at para rastrear vínculo de equipe",
                    "Melhorias de performance no carregamento de dados",
                    "Correções visuais e de UX em múltiplas telas",
                  ]}
                />
                <ChangelogEntry
                  version="2.0.0"
                  date="Abril 2025"
                  type="major"
                  changes={[
                    "Arquitetura enterprise refatorada (services/, hooks/, DataContext)",
                    "Autenticação real via Supabase (remoção do auth de desenvolvimento)",
                    "Sistema completo de logs de auditoria com filtros avançados",
                    "Gestão de materiais por ocorrência",
                    "Importação em massa via CSV",
                    "Deploy na Vercel com CSP headers configurados",
                    "Títulos dinâmicos por página e chunks de build otimizados",
                  ]}
                />
                <ChangelogEntry
                  version="1.1.0"
                  date="Março 2025"
                  type="minor"
                  changes={[
                    "Exportação de relatórios em PDF com fotos incorporadas",
                    "Suporte a upload de fotos HEIC (iPhone)",
                    "Dashboard com métricas e gráficos de barras e pizza",
                    "Paginação em todas as tabelas do sistema",
                  ]}
                />
                <ChangelogEntry
                  version="1.0.0"
                  date="Janeiro 2025"
                  type="major"
                  changes={[
                    "Sistema base de gestão de ocorrências (PENDENTE / EM ANDAMENTO / FINALIZADA)",
                    "Perfis e permissões: Admin, Supervisor e Operador",
                    "Gestão de equipes e atribuições de campo",
                    "Gestão de tipos de serviço",
                    "Troca obrigatória de senha no primeiro acesso",
                  ]}
                />
              </div>
            </SectionCard>

            {/* ── 8. ROADMAP ─────────────────────────────────────────── */}
            <SectionCard id="roadmap" title="Roadmap" icon={Map} iconColor={C.purple}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-muted/30 rounded-xl border border-border/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4" style={{ color: C.success }} />
                    <h3 className="text-sm font-semibold" style={{ color: C.success }}>Concluído</h3>
                  </div>
                  {[
                    "Gestão de ocorrências",
                    "Autenticação com Supabase",
                    "Controle de acesso RBAC",
                    "Upload de fotos (JPG, PNG, HEIC)",
                    "Relatórios PDF",
                    "Logs de auditoria",
                    "Gestão de materiais",
                    "Importação CSV",
                    "Deploy Vercel",
                    "Dashboard com métricas",
                  ].map((item) => <RoadmapItem key={item} title={item} status="done" />)}
                </div>
                <div className="bg-muted/30 rounded-xl border border-border/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-4 w-4" style={{ color: C.amber }} />
                    <h3 className="text-sm font-semibold" style={{ color: C.amber }}>Em Desenvolvimento</h3>
                  </div>
                  {[
                    "Notificações por e-mail",
                    "Exportação avançada de relatórios",
                    "Filtros avançados no dashboard",
                    "Compressão automática de imagens",
                  ].map((item) => <RoadmapItem key={item} title={item} status="progress" />)}
                </div>
                <div className="bg-muted/30 rounded-xl border border-border/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="h-4 w-4 rounded-full border shrink-0 inline-block" style={{ borderColor: C.muted }} />
                    <h3 className="text-sm font-semibold text-muted-foreground">Planejado</h3>
                  </div>
                  {[
                    "App mobile (iOS / Android)",
                    "Integração com sistemas externos",
                    "Assinatura digital de relatórios",
                    "Modo offline para campo",
                    "Exportação em Excel",
                  ].map((item) => <RoadmapItem key={item} title={item} status="planned" />)}
                </div>
              </div>
            </SectionCard>

            {/* ── 9. SUPORTE ─────────────────────────────────────────── */}
            <SectionCard id="suporte" title="Suporte" icon={Headphones} iconColor={C.primary}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-border/50 bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4" style={{ color: C.primary }} />
                    <span className="text-sm font-semibold">Empresa Responsável</span>
                  </div>
                  <p className="text-sm font-medium">Koraflow</p>
                  <p className="text-xs text-muted-foreground">Desenvolvimento e suporte de software</p>
                </div>
                <div className="p-4 rounded-xl border border-border/50 bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4" style={{ color: C.primary }} />
                    <span className="text-sm font-semibold">E-mail de Suporte</span>
                  </div>
                  <p className="text-sm font-medium">contato@Koraflow.com.br</p>
                  <p className="text-xs text-muted-foreground">Canal principal de atendimento</p>
                </div>
                <div className="p-4 rounded-xl border border-border/50 bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4" style={{ color: C.primary }} />
                    <span className="text-sm font-semibold">Horário de Atendimento</span>
                  </div>
                  <p className="text-sm font-medium">Segunda a Sexta</p>
                  <p className="text-xs text-muted-foreground">09:00 às 18:00 (horário de Brasília)</p>
                </div>
                <div className="p-4 rounded-xl border border-border/50 bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4" style={{ color: C.success }} />
                    <span className="text-sm font-semibold">Tempo de Resposta</span>
                  </div>
                  <p className="text-sm font-medium">Até 24 horas úteis</p>
                  <p className="text-xs text-muted-foreground">Para solicitações enviadas por e-mail</p>
                </div>
              </div>
              <div className="mt-2 p-3 bg-muted/30 rounded-xl border border-border/30">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Como reportar um problema:</span>{" "}
                  Descreva o que aconteceu, em qual tela e inclua prints quando possível. Quanto mais detalhado o relato, mais rápida será a resolução.
                </p>
              </div>
            </SectionCard>

            {/* ── 10. SOBRE O PROJETO ────────────────────────────────── */}
            <SectionCard id="sobre-projeto" title="Sobre o Projeto" icon={Code2} iconColor={C.purple}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <InfoCard label="Criado por" value="Koraflow" icon={Building2} color={C.primary} />
                <InfoCard label="Desenvolvido para" value="Grupo TTC" icon={Users} color={C.purple} />
                <InfoCard label="Ano de início" value="2025" icon={Star} color={C.amber} />
                <InfoCard label="Versão atual" value={`v${APP_VERSION}`} icon={Zap} color={C.success} />
              </div>
              <div className="mt-3 p-4 rounded-xl border border-border/40 bg-muted/20">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sistema desenvolvido sob medida pela Koraflow para atender às necessidades operacionais do Grupo TTC no gerenciamento de manutenções preventivas. A plataforma é mantida e evoluída continuamente com base no feedback dos usuários e nas demandas operacionais da empresa.
                </p>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border/30 bg-muted/20">
                  <p className="text-xs font-semibold mb-2">Tecnologias utilizadas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["React 19", "TypeScript", "Supabase", "Tailwind CSS", "Vite", "Vercel"].map((tech) => (
                      <Badge key={tech} variant="outline" className="text-[10px]">{tech}</Badge>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-border/30 bg-muted/20">
                  <p className="text-xs font-semibold mb-2">Informações de build</p>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Versão:</span> v{APP_VERSION}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Última atualização:</span> {APP_BUILD_DATE}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Ambiente:</span> {envLabel}
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ── 11. STATUS DO SISTEMA ──────────────────────────────── */}
            <SectionCard id="status" title="Status do Sistema" icon={Activity} iconColor={C.success}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-border/40 bg-muted/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Versão</span>
                    <Badge variant="outline" className="text-[10px]" style={{ borderColor: `${C.success}50`, color: C.success }}>
                      ATIVO
                    </Badge>
                  </div>
                  <p className="text-sm font-bold">v{APP_VERSION}</p>
                </div>
                <div className="p-3 rounded-xl border border-border/40 bg-muted/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Ambiente</span>
                    <Badge
                      variant="outline"
                      className="text-[10px]"
                      style={{ borderColor: `${envColor}50`, color: envColor }}
                    >
                      {envLabel.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm font-bold">{envLabel}</p>
                </div>
                <div className="p-3 rounded-xl border border-border/40 bg-muted/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Banco de Dados</span>
                    <Badge variant="outline" className="text-[10px]" style={{ borderColor: `${C.success}50`, color: C.success }}>
                      ONLINE
                    </Badge>
                  </div>
                  <p className="text-sm font-bold">Supabase</p>
                </div>
                <div className="p-3 rounded-xl border border-border/40 bg-muted/20">
                  <span className="text-xs text-muted-foreground block mb-1">Última atualização</span>
                  <p className="text-sm font-bold">{APP_BUILD_DATE}</p>
                </div>
                <div className="p-3 rounded-xl border border-border/40 bg-muted/20">
                  <span className="text-xs text-muted-foreground block mb-1">Hosting</span>
                  <p className="text-sm font-bold">Vercel (Edge)</p>
                </div>
                <div className="p-3 rounded-xl border border-border/40 bg-muted/20">
                  <span className="text-xs text-muted-foreground block mb-1">Usuário logado</span>
                  <p className="text-sm font-bold truncate">{user?.nome ?? "—"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email ?? ""}</p>
                </div>
              </div>
              <div
                className="mt-3 flex items-center gap-2 p-3 rounded-xl"
                style={{ background: `${C.success}10`, border: `1px solid ${C.success}30` }}
              >
                <Activity className="h-4 w-4 shrink-0" style={{ color: C.success }} />
                <p className="text-xs" style={{ color: C.success }}>
                  Todos os sistemas operacionais. Nenhum incidente reportado.
                </p>
              </div>
            </SectionCard>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
