
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, UserRole } from '../types';
import { UserPlus, Users, Shield, Key, Trash2, AlertCircle, CheckCircle2, Eye, X } from 'lucide-react';

interface Props {
  onViewTenant?: (tenantId: number, fullName: string) => void;
}

const AdminUzman: React.FC<Props> = ({ onViewTenant }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newTenantId, setNewTenantId] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError('Kullanıcılar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newUsername || !newPassword || !newFullName || !newTenantId) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      await api.createUser({
        username: newUsername,
        password: newPassword,
        fullName: newFullName,
        tenantId: parseInt(newTenantId)
      });
      setSuccess('Kullanıcı başarıyla oluşturuldu.');
      setNewUsername('');
      setNewPassword('');
      setNewFullName('');
      setNewTenantId('');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Kullanıcı oluşturulamadı.');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    try {
      await api.deleteUser(id);
      fetchUsers();
      setSuccess('Kullanıcı silindi.');
    } catch (err) {
      setError('Kullanıcı silinemedi.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Kullanıcı Yönetimi</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Sistem kullanıcılarını yönetin ve yeni hesaplar oluşturun.</p>
        </div>
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
          <Shield className="w-6 h-6" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Yeni Kullanıcı Formu */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Yeni Kullanıcı</h2>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">AD SOYAD</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                  placeholder="Örn: Ahmet Yılmaz"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">KULLANICI ADI (E-POSTA)</label>
                <input
                  type="email"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">GEÇİCİ ŞİFRE</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">TENANT ID (BAYİ NO)</label>
                <input
                  type="number"
                  value={newTenantId}
                  onChange={(e) => setNewTenantId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                  placeholder="Örn: 101"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {success}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Kullanıcıyı Oluştur
              </button>
            </form>
          </div>
        </div>

        {/* Kullanıcı Listesi */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Aktif Kullanıcılar</h2>
              </div>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black rounded-full uppercase tracking-widest">
                {users.length} TOPLAM
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Kullanıcı</th>
                    <th className="px-6 py-4">Tenant ID</th>
                    <th className="px-6 py-4">Rol</th>
                    <th className="px-6 py-4">Durum</th>
                    <th className="px-6 py-4">Kayıt Tarihi</th>
                    <th className="px-6 py-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Yükleniyor...</p>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                        Henüz kullanıcı bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 font-bold">
                              {user.full_name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 dark:text-white">{user.full_name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{user.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[9px] font-black rounded-md uppercase tracking-tighter border border-blue-100 dark:border-blue-900/30">
                            {user.role === 'admin' ? 'YÖNETİCİ' : user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
                            #{user.tenant_id}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.must_change_password ? (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              <Key className="w-3 h-3" />
                              ŞİFRE DEĞİŞİMİ BEKLİYOR
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" />
                              AKTİF
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-[10px] text-slate-400 font-bold">
                          {new Date(user.created_at).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {user.role !== 'super_admin' && onViewTenant && (
                              <button 
                                onClick={() => onViewTenant(user.tenant_id, user.full_name)}
                                className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                                title="Bayi Verilerini Görüntüle"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                            )}
                            {user.role !== 'super_admin' && (
                              <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                title="Kullanıcıyı Sil"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-6 p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-[2rem] flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-800 dark:text-amber-200">Güvenlik Notu</h4>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-medium leading-relaxed">
                Yeni oluşturulan kullanıcılar ilk girişlerinde şifrelerini değiştirmek zorundadır. 
                Her kullanıcı sadece kendi oluşturduğu verileri görebilir ve yönetebilir. 
                Süper admin olarak tüm sistemi denetleme yetkisine sahipsiniz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUzman;
