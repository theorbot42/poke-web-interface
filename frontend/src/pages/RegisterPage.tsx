import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Bot, Eye, EyeOff, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuthStore();

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setIsLoading(true);
    try {
      await register(form.username, form.email, form.password);
      toast.success('Compte créé avec succès !');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { details?: { message: string }[]; error?: string } } };
      const details = err?.response?.data?.details;
      if (details) {
        details.forEach((d: { message: string }) => toast.error(d.message));
      } else {
        toast.error(err?.response?.data?.error || "Erreur lors de l'inscription");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-poke-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bot size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Créer un compte</h1>
          <p className="text-gray-400 mt-1 text-sm">Rejoignez Poke Web Interface</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Nom d'utilisateur</label>
              <input
                type="text"
                value={form.username}
                onChange={handleChange('username')}
                placeholder="jdupont"
                required
                minLength={3}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="vous@exemple.com"
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange('password')}
                  placeholder="Min. 8 caractères"
                  required
                  minLength={8}
                  className="input-field pr-10"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Majuscule, minuscule et chiffre requis</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirmer le mot de passe</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={form.confirm}
                onChange={handleChange('confirm')}
                placeholder="••••••••"
                required
                className="input-field"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus size={16} />}
              {isLoading ? 'Création...' : 'Créer le compte'}
            </button>
          </form>
        </div>

        <p className="text-center mt-4 text-gray-500 text-sm">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-poke-400 hover:text-poke-300 font-medium">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
