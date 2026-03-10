import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Users, Plus, Trash2, Shield, User as UserIcon, Calendar, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SuperAdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        fullName: '',
        tenantId: ''
    });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await api.getUsers();
            setUsers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.createUser({
                ...newUser,
                tenantId: parseInt(newUser.tenantId) || 0
            });
            setShowAddModal(false);
            setNewUser({ username: '', password: '', fullName: '', tenantId: '' });
            fetchUsers();
        } catch (e) {
            alert('Kullanıcı oluşturulamadı');
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
        try {
            await api.deleteUser(id);
            fetchUsers();
        } catch (e) {
            alert('Kullanıcı silinemedi');
        }
    };

    return (
        <div className="p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <Shield className="w-8 h-8 text-blue-600" />
                        Süper Admin Paneli
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Sistemdeki tüm kullanıcıları ve bayileri yönetin.</p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-200 dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Kullanıcı Ekle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Toplam Kullanıcı</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{users.length}</p>
                        </div>
                    </div>
                </div>
                {/* Diğer istatistikler eklenebilir */}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Kullanıcı</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Rol</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Tenant ID</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Kayıt Tarihi</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Yükleniyor...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Kullanıcı bulunamadı.</td></tr>
                        ) : (
                            users.map(u => (
                                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                                                <UserIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{u.full_name}</p>
                                                <p className="text-xs text-slate-500">@{u.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border ${
                                            u.role === 'super_admin' 
                                            ? 'bg-purple-100 text-purple-700 border-purple-200' 
                                            : 'bg-blue-100 text-blue-700 border-blue-200'
                                        }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-mono font-bold">
                                            <Hash className="w-4 h-4 opacity-50" />
                                            {u.tenant_id}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                                            <Calendar className="w-4 h-4 opacity-50" />
                                            {new Date(u.created_at).toLocaleDateString('tr-TR')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleDeleteUser(u.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add User Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h3 className="font-bold text-slate-900 dark:text-white">Yeni Kullanıcı Oluştur</h3>
                                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                            <form onSubmit={handleCreateUser} className="p-8 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-slate-500 uppercase ml-1">Kullanıcı Adı</label>
                                    <input 
                                        required
                                        type="text"
                                        value={newUser.username}
                                        onChange={e => setNewUser({...newUser, username: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="ör: ahmet_bayi"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-slate-500 uppercase ml-1">Şifre</label>
                                    <input 
                                        required
                                        type="password"
                                        value={newUser.password}
                                        onChange={e => setNewUser({...newUser, password: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-slate-500 uppercase ml-1">Ad Soyad</label>
                                    <input 
                                        required
                                        type="text"
                                        value={newUser.fullName}
                                        onChange={e => setNewUser({...newUser, fullName: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="ör: Ahmet Yılmaz"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-slate-500 uppercase ml-1">Tenant ID (Bayi No)</label>
                                    <input 
                                        required
                                        type="number"
                                        value={newUser.tenantId}
                                        onChange={e => setNewUser({...newUser, tenantId: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="ör: 101"
                                    />
                                </div>
                                <button 
                                    type="submit"
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all mt-4"
                                >
                                    Kullanıcıyı Kaydet
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const X = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

export default SuperAdminDashboard;
