import { Shield, Lock, ArrowLeft, FileText, Eye, Scale, Database, Mail, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";

const sections = [
  {
    icon: Shield,
    title: "1. Anonimato Total",
    content: "A plataforma Escola Segura Report não coleta, armazena ou solicita nenhum dado pessoal identificável do denunciante. Não pedimos nome, CPF, e-mail, telefone ou qualquer informação que possa identificar quem realiza a denúncia. Seu anonimato é garantido por design — a arquitetura da plataforma foi projetada para tornar impossível a identificação do denunciante."
  },
  {
    icon: Lock,
    title: "2. Confidencialidade",
    content: "Todas as denúncias são tratadas com confidencialidade total. O acesso às informações é restrito exclusivamente à gestão escolar autorizada e aos administradores da plataforma. Nenhum dado é compartilhado com terceiros, empresas, órgãos governamentais ou qualquer entidade externa sem ordem judicial expressa. Os gestores que acessam as denúncias assinam termos de confidencialidade e são responsabilizados pelo sigilo das informações."
  },
  {
    icon: FileText,
    title: "3. Finalidade dos Dados",
    content: "Os dados coletados nas denúncias (descrição do ocorrido, escola envolvida, nível de urgência e eventuais evidências) são utilizados exclusivamente para: investigação interna pela gestão da escola; melhoria contínua do ambiente escolar; geração de estatísticas anônimas e agregadas sobre segurança escolar; cumprimento de obrigações legais quando aplicável. Em nenhuma hipótese os dados serão utilizados para fins comerciais, publicitários ou de marketing."
  },
  {
    icon: Scale,
    title: "4. Responsabilidade do Denunciante",
    content: "Ao enviar uma denúncia, o usuário declara que as informações fornecidas são verdadeiras e baseadas em fatos reais. Denúncias comprovadamente falsas, caluniosas ou de má-fé podem configurar crime previsto no Código Penal Brasileiro (Art. 138 — Calúnia, Art. 339 — Denunciação caluniosa) e o responsável poderá ser identificado por meios legais e responder judicialmente. A plataforma incentiva o uso responsável e ético do canal de denúncias."
  },
  {
    icon: Database,
    title: "5. Conformidade com a LGPD",
    content: "A plataforma Escola Segura Report está em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Embora não coletemos dados pessoais identificáveis, adotamos as melhores práticas de segurança da informação, incluindo: criptografia de dados em trânsito (HTTPS/TLS) e em repouso; controle de acesso baseado em papéis (RBAC); logs de auditoria para rastreabilidade de ações administrativas; armazenamento seguro em servidores com certificação internacional."
  },
  {
    icon: Eye,
    title: "6. Metadados Técnicos",
    content: "Para fins de segurança e prevenção de abuso, a plataforma pode coletar metadados técnicos não identificáveis, como: endereço IP aproximado (para geolocalização genérica); tipo de dispositivo e navegador (para otimização da experiência); data e hora do envio. Esses metadados são utilizados exclusivamente para fins de segurança, não sendo possível utilizá-los para identificar o denunciante."
  },
  {
    icon: Lock,
    title: "7. Armazenamento e Retenção",
    content: "As denúncias e seus dados associados são armazenados em servidores seguros com backup automático. O período de retenção dos dados segue as necessidades de investigação e resolução de cada caso. Denúncias resolvidas podem ser anonimizadas após o período legal de retenção. Evidências (fotos, documentos) são armazenadas em buckets seguros com acesso restrito."
  },
  {
    icon: Mail,
    title: "8. Contato e Dúvidas",
    content: "Para dúvidas sobre esta Política de Privacidade ou sobre o tratamento de dados na plataforma, entre em contato através do e-mail:"
  },
];

const PoliticaPrivacidade = () => (
  <PageTransition>
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 md:py-16">
        <div className="container max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/30 flex items-center justify-center shadow-lg shadow-primary/5 group transition-all duration-300 hover:scale-105">
                <Shield className="h-10 w-10 text-primary transition-transform group-hover:rotate-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Política de Privacidade</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Compromisso absoluto com sua segurança e anonimato na plataforma Escola Segura Report.
            </p>
            <div className="inline-flex items-center gap-2 mt-6 px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> Última atualização: 27 de março de 2026
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-8 animate-fade-in-up-delay-1">
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              A plataforma <strong className="text-foreground">Escola Segura Report</strong> tem compromisso absoluto com a privacidade e segurança dos seus usuários. 
              Esta política descreve como tratamos as informações recebidas, garantindo transparência, anonimato e conformidade com a legislação brasileira.
            </p>

            <div className="space-y-8">
              {sections.map((section, i) => (
                <div key={i} className="group">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <section.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-display font-semibold">{section.title}</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                        {section.content}
                        {section.title.includes("8.") && (
                          <>
                            {" "}
                            <a href="mailto:contato@escolasegura.com" className="text-primary hover:underline font-medium">
                              contato@escolasegura.com
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center animate-fade-in-up-delay-1">
            <Lock className="h-8 w-8 text-primary mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">Sua segurança é nossa prioridade</p>
            <p className="text-xs text-muted-foreground mb-4">
              Ao utilizar a plataforma Escola Segura Report, você concorda com os termos descritos nesta política.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/">
                <Button variant="outline" className="gap-2 rounded-xl">
                  <ArrowLeft className="h-4 w-4" /> Voltar ao Início
                </Button>
              </Link>
              <Link to="/denunciar">
                <Button className="gap-2 rounded-xl">
                  <Shield className="h-4 w-4" /> Fazer Denúncia
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  </PageTransition>
);

export default PoliticaPrivacidade;
