'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Power, PowerOff, ImageIcon, Upload } from 'lucide-react';
import { fetchAdminBanners, createBanner, updateBanner, toggleBannerActive, deleteBanner, uploadGalleryImage } from '@/services/admin.service';
import { Banner } from '@/types';
import { useToast } from '@/hooks/useToast';
import { Hint } from '@/features/admin/components/Hint';
import { BANNER_IMAGE, describeLimits, validateImageFile } from '@/utils/image';

export function BannersManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, msg, showError, showMsg } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [order, setOrder] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setBanners(await fetchAdminBanners()); } catch { showError('Error al cargar banners'); }
    setLoading(false);
  };

  const reset = () => { setTitle(''); setDescription(''); setImage(''); setOrder(0); setEditingId(null); if (fileRef.current) fileRef.current.value = ''; };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setUploading(true);
      const problem = await validateImageFile(f, BANNER_IMAGE);
      if (problem) {
        showError(problem);
        if (fileRef.current) fileRef.current.value = '';
        setUploading(false);
        return;
      }
      const fd = new FormData();
      fd.append('image', f);
      fd.append('title', title || f.name);
      fd.append('purpose', 'banner');
      const uploaded = await uploadGalleryImage(fd);
      setImage(uploaded.url);
      showMsg(f.type === 'image/gif' ? 'GIF subido (se reproduce animado en el banner)' : 'Imagen subida');
    } catch (err: any) {
      showError(err.response?.data?.error || err.message || 'Error al subir');
    }
    setUploading(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) { await updateBanner(editingId, { title, description, image, order }); showMsg('Banner actualizado'); }
      else { await createBanner({ title, description, image, order, active: true }); showMsg('Banner creado'); }
      reset(); load();
    } catch (err: any) { showError(err.message || 'Error'); }
  };

  const edit = (b: any) => { setTitle(b.title); setDescription(b.description || ''); setImage(b.image); setOrder(b.order || 0); setEditingId(b._id); };

  const toggle = async (id: string | undefined) => { if (!id) return; try { await toggleBannerActive(id); load(); } catch { showError('Error'); } };
  const del = async (id: string | undefined) => { if (!id || !confirm('Eliminar banner?')) return; try { await deleteBanner(id); load(); showMsg('Banner eliminado'); } catch { showError('Error'); } };

  if (loading) return <div className="bg-white rounded-lg p-4 shadow-md"><p className="text-[#757575] text-sm">Cargando banners...</p></div>;

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <h2 className="text-lg font-bold mb-4 font-[var(--font-montserrat)] text-[#212121] flex items-center gap-2"><ImageIcon size={18} /> Banner Hero</h2>
      {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
      {msg && <p className="text-green-600 mb-4 text-sm">{msg}</p>}

      <form onSubmit={submit} className="space-y-3 mb-6 border-b pb-6">
        <h3 className="font-semibold text-[#212121] flex items-center gap-2">{editingId ? <Pencil size={14} /> : <Plus size={14} />} {editingId ? 'Editar banner' : 'Nuevo banner'}</h3>
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#212121]">
            Título <Hint>Texto grande que aparece sobre la imagen del banner.</Hint>
          </label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titulo" required
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#D95A2B]" />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#212121]">
            Descripción <Hint>Texto corto que acompaña al título.</Hint>
          </label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripcion" required
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#D95A2B]" />
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#212121]">
            Imagen <Hint>Subí una imagen o GIF desde tu equipo, o pegá el link (URL). Los GIF se reproducen animados en el banner. {describeLimits(BANNER_IMAGE)}</Hint>
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input type="file" ref={fileRef} onChange={handleFile} accept={BANNER_IMAGE.accept} disabled={uploading} title="Subir imagen o GIF"
              className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-[#D95A2B]" />
            {uploading && <span className="text-xs text-[#757575] whitespace-nowrap">Subiendo...</span>}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Upload size={14} className="shrink-0 text-[#757575]" />
            <input type="url" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." required
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#D95A2B]" />
          </div>
        </div>
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#212121]">
            Orden <Hint>Posición del banner (menor = se muestra primero).</Hint>
          </label>
          <input type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 0)} placeholder="Orden"
            className="w-24 px-4 py-2 border-2 border-gray-300 rounded-lg" />
        </div>
        {image && <div className="h-32 bg-gray-100 rounded-lg overflow-hidden"><img src={image} alt="Preview" className="h-full w-full object-cover" loading="lazy" /></div>}
        <div className="flex gap-2">
          <button type="submit" className="px-6 py-2 bg-[#D95A2B] text-white rounded-lg font-semibold hover:bg-[#D94B2B]">{editingId ? 'Actualizar' : 'Crear'}</button>
          {editingId && <button type="button" onClick={reset} className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400">Cancelar</button>}
        </div>
      </form>

      {banners.length === 0 ? <p className="text-[#757575] text-sm">No hay banners</p> : (
        <div className="space-y-2">
          {banners.map((b) => (
            <div key={b._id} className={`flex items-center gap-4 p-3 border-2 rounded-lg ${b.active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="relative w-24 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                {b.image && <img src={b.image} alt={b.title} className="h-full w-full object-cover" loading="lazy" />}
                {b.image?.toLowerCase().endsWith('.gif') && <span className="absolute bottom-0 left-0 rounded-tr bg-black/70 px-1 py-0.5 text-[9px] font-bold text-white">GIF</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#212121] truncate">{b.title}</p>
                <p className="text-sm text-[#757575] truncate">{b.description}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => toggle(b._id)} title={b.active ? 'Ocultar banner' : 'Mostrar banner'} className={`p-2 rounded text-white ${b.active ? 'bg-green-600' : 'bg-gray-400'}`}>{b.active ? <Power size={14} /> : <PowerOff size={14} />}</button>
                <button onClick={() => edit(b)} title="Editar banner" className="p-2 bg-blue-600 text-white rounded"><Pencil size={14} /></button>
                <button onClick={() => del(b._id)} title="Eliminar banner" className="p-2 bg-red-600 text-white rounded"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
