import { useEffect, useState } from 'react';

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true); // afficher ton bouton
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={async () => {
        if (!deferred) return;
        deferred.prompt();
        const { outcome } = await deferred.userChoice;
        console.log('PWA install result:', outcome);
        setDeferred(null);
        setVisible(false);
      }}
      className="btn btn-primary"
    >
      📲 Installer l’application
    </button>
  );
}
