import React, { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('teste@mpto.mp.br');
  const [password, setPassword] = useState('Sentinela2026!');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 overflow-hidden select-none">

      {/* Imagem de Fundo com Desfoque do Patrimônio */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-500 scale-105"
        style={{
          backgroundImage: "url('/catedral_Porto.webp')",
          filter: "blur(6px) brightness(0.4)"
        }}
      />

      {/* Overlay verde para manter a identidade visual do MPTO/CAOMA */}
      <div className="absolute inset-0 bg-[#003527]/30 mix-blend-multiply" />

      {/* Card de Login */}
      <div className="w-full max-w-[420px] bg-[#f8f9ff]/98 border border-border-subtle shadow-2xl rounded-2xl p-8 space-y-6 relative z-10 transition-all duration-300">

        {/* Logo Superior do Balão de Login */}
        <div className="flex flex-col items-center justify-center">
          <img
            src="/logo_sentinela_Tocantins_fundo.png"
            alt="Sentinela do Patrimônio do Tocantins"
            className="w-full max-w-[280px] object-contain"
          />
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
              Endereço de E-mail
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-outline text-[18px]">
                mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@mpto.mp.br"
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-border-subtle rounded-xl text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 focus:ring-heritage-green-deep transition-all outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                Senha de Acesso
              </label>
              <a href="#recuperar" className="text-[10px] font-label-bold text-heritage-green-leaf uppercase tracking-wider hover:underline">
                Esqueceu?
              </a>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-outline text-[18px]">
                lock
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-border-subtle rounded-xl text-body-sm text-on-surface focus:border-heritage-green-deep focus:ring-1 focus:ring-heritage-green-deep transition-all outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#064E3B] hover:bg-[#166534] text-white font-label-bold text-label-bold uppercase rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
          >
            <span>Acessar o Sistema</span>
            <span className="material-symbols-outlined text-[18px]">login</span>
          </button>
        </form>

        {/* Footer do Card */}
        <div className="text-center pt-2 border-t border-border-subtle/50 text-[10px] text-on-surface-variant leading-relaxed">
          <p className="font-semibold text-primary mt-1">Ministério Público do Estado do Tocantins</p>
        </div>
      </div>
    </div>
  );
};
