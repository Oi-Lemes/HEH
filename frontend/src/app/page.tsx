"use client";

import { useState, useEffect } from "react";

// --- COMPONENTE PWA ATUALIZADO ---

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const PwaInstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showIOSInstruction, setShowIOSInstruction] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false); // Novo estado para a mensagem de sucesso

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('Service Worker registado.'))
            .catch(err => console.error("Falha no registo do Service Worker:", err));
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const timer = setTimeout(() => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOSDevice && !installPrompt) {
        setShowIOSInstruction(true);
      }
    }, 1500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, [installPrompt]);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('Utilizador instalou a app');
      setIsInstalled(true); // Mostra a mensagem de sucesso
    }
    setInstallPrompt(null);
  };

  // 1. Mostra a mensagem de sucesso se a instalação foi aceite
  if (isInstalled) {
    return (
      <div className="flex items-center justify-center text-center text-sm text-green-400 bg-gray-900/50 p-3 rounded-md border border-gray-700">
        <p>✅ Aplicação instalada! Procure o ícone no seu ecrã principal.</p>
      </div>
    );
  }

  // 2. Se for instalável, mostra o botão a pulsar
  if (installPrompt) {
    return (
      <button
        onClick={handleInstallClick}
        className="w-full flex items-center justify-center px-4 py-3 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors animate-pulse"
      >
        <PhoneIcon />
        <span>Instalar App no seu Celular</span>
      </button>
    );
  }

  // 3. Se for iOS, mostra a instrução a pulsar
  if (showIOSInstruction) {
    return (
      <div className="flex items-center justify-center text-center text-sm text-gray-400 bg-gray-900/50 p-3 rounded-md border border-gray-700 animate-pulse">
        <PhoneIcon />
        <p>Para instalar no iPhone, toque em Partilha e "Adicionar ao Ecrã Principal".</p>
      </div>
    );
  }
  
  return null;
};


// --- PÁGINA DE LOGIN (sem outras alterações) ---

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    setIsSuccess(false);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setIsSuccess(true);
        setMessage(data.message);
      } else {
        setMessage(`Erro: ${data.message || 'Ocorreu um erro.'}`);
      }
    } catch (error) {
      setMessage("Erro de conexão: Não foi possível comunicar com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-md">
        {isSuccess ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-green-400">Verifique o seu Email!</h1>
            <p className="mt-4 text-gray-300">{message}</p>
            <p className="mt-2 text-sm text-gray-400">Enviámos um link mágico para a sua caixa de entrada. Clique nele para aceder à sua conta.</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <PwaInstallPrompt />
            </div>
            <h1 className="text-3xl font-bold text-center">Acessar área de Membros</h1>
            <p className="text-center text-gray-400">Insira o email que usou na compra para receber o seu link de acesso.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="seu@email.com" disabled={isLoading} />
              </div>
              <div>
                <button type="submit" disabled={isLoading} className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-wait">
                  {isLoading ? 'A enviar...' : 'Enviar Link de Acesso'}
                </button>
              </div>
            </form>
            {message && <p className="mt-4 text-center text-sm text-red-400">{message}</p>}
          </>
        )}
      </div>
    </main>
  );
}