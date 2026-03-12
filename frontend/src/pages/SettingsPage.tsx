import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/services/api';
import { User, Lock, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [username, setUsername] = useState(user?.username || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const { data } = await authApi.updateMe({ username });
      updateUser(data.user);
      toast.success('Profil mis à jour');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || 'Erreur');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setIsSavingPassword(true);
    try {
      await authApi.changePassword(passwords.current, passwords.new);
      toast.success('Mot de passe modifié');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || 'Erreur');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-xl font-semibold text-white">Paramètres</h1>

        {/* Profile */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-poke-400" />
            <h2 className="font-medium text-white">Profil</h2>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Nom d'utilisateur</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                minLength={3}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input-field opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
            </div>
            <button type="submit" disabled={isSavingProfile} className="btn-primary">
              {isSavingProfile ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Lock size={16} className="text-poke-400" />
            <h2 className="font-medium text-white">Mot de passe</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {(['current', 'new', 'confirm'] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm text-gray-400 mb-1.5">
                  {field === 'current' ? 'Mot de passe actuel' : field === 'new' ? 'Nouveau mot de passe' : 'Confirmer'}
                </label>
                <input
                  type="password"
                  value={passwords[field]}
                  onChange={(e) => setPasswords(p => ({ ...p, [field]: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
            ))}
            <button type="submit" disabled={isSavingPassword} className="btn-primary">
              {isSavingPassword ? 'Modification...' : 'Modifier le mot de passe'}
            </button>
          </form>
        </div>

        {/* About */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-poke-400" />
            <h2 className="font-medium text-white">À propos</h2>
          </div>
          <div className="space-y-1 text-sm text-gray-400">
            <p>Version: <span className="text-white">1.0.0</span></p>
            <p>Stack: <span className="text-white">React 18 + Vite + TypeScript + Tailwind CSS</span></p>
            <p>Backend: <span className="text-white">Node.js + Express + Socket.io + PostgreSQL + Redis</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
