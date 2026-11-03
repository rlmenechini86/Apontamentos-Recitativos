import React from 'react';
import { X, Shield, Lock, FileText, UserCheck, AlertTriangle, CheckCircle } from 'lucide-react';

interface LgpdTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  showAcceptButton?: boolean;
}

export const LgpdTermsModal: React.FC<LgpdTermsModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  showAcceptButton = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">
                Termos de Uso e Política de Privacidade
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Conformidade com a LGPD (Lei nº 13.709/2018)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-start space-x-3">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-800 dark:text-emerald-200 text-[11px]">
              Este sistema foi desenvolvido exclusivamente para a organização, apontamento e gestão eclesiástica interna da Congregação Cristã no Brasil. Seus dados são protegidos por rigorosos padrões de segurança da informação.
            </p>
          </div>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>1. Base Legal e Finalidade do Tratamento</span>
            </h3>
            <p>
              Os dados pessoais e dados pessoais sensíveis (relacionados à fé, participação em cultos, recitativos, reuniões da mocidade e cargos eclesiásticos) são tratados com base no <strong>Artigo 11, II, alínea &ldquo;f&rdquo;</strong> da LGPD (atividades regulares realizadas por entidades religiosas sem fins lucrativos) e mediante <strong>consentimento expresso</strong> do titular (Art. 7º, I e Art. 11, I).
            </p>
            <p>
              <strong>Finalidade estrita:</strong> Registro de presenças, organização de escalas ministeriais, controle de recitativos e emissão de relatórios internos da igreja. Em nenhuma hipótese os dados serão comercializados, cedidos ou compartilhados com terceiros alheios à administração da igreja.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center space-x-2">
              <Lock className="w-4 h-4 text-slate-500" />
              <span>2. Medidas de Segurança da Informação</span>
            </h3>
            <p>
              Em conformidade com o <strong>Art. 46 da LGPD</strong>, adotamos medidas técnicas de segurança para proteger seus dados contra acessos não autorizados:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Senhas Criptografadas:</strong> Armazenadas exclusivamente sob hash irreversível com algoritmo <em>bcrypt</em> e fator de custo (salt) individual.</li>
              <li><strong>Autenticação Criptográfica:</strong> Sessões autenticadas via tokens seguros JWT (JSON Web Tokens) assinados com expiração automática.</li>
              <li><strong>Controle de Acesso Rígido (RBAC):</strong> Cada usuário acessa apenas os dados estritamente necessários para sua atribuição eclesiástica.</li>
              <li><strong>Proteção de Rede:</strong> Comunicação criptografada via HTTPS/TLS, headers de segurança HTTP (Helmet) e proteção contra requisições excessivas (Rate Limiting).</li>
              <li><strong>Trilha de Auditoria (Logs):</strong> Ações críticas sobre dados sensíveis são registradas em logs de auditoria para prestação de contas.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-slate-500" />
              <span>3. Tratamento de Dados de Menores de Idade</span>
            </h3>
            <p>
              Conforme o <strong>Art. 14 da LGPD</strong> e o Estatuto da Criança e do Adolescente (ECA), o cadastro de jovens menores de 18 anos exige o consentimento prévio e expresso de ao menos um dos pais ou responsável legal, devidamente informado nos cadastros do sistema.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-slate-500" />
              <span>4. Direitos do Titular (Artigo 18 da LGPD)</span>
            </h3>
            <p>
              Você, como titular dos dados, tem o direito de solicitar a qualquer momento:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Confirmação da existência de tratamento e acesso aos seus dados pessoais.</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade.</li>
              <li>Revogação do consentimento, mediante solicitação expressa à administração responsável.</li>
            </ul>
          </section>

          <section className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
            <p><strong>Versão da Política:</strong> 1.0 — Novembro/2026</p>
            <p><strong>Controlador:</strong> Administração Setorial / Regional da CCB</p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Fechar
          </button>
          {showAcceptButton && onAccept && (
            <button
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Li e Concordo com os Termos</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
