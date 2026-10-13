'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchGalleryImages, uploadGalleryImage, deleteGalleryImage } from '@/services/admin.service';
import { GalleryImage } from '@/types';
import { Image, Upload, Trash2, Search, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const PAGE_SIZE = 10;

export function GalleryManager() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, msg, showError, showMsg } = useToast();

  const [title, setTitle] = useState('');
  const [order, setOrder] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setImages(await fetchGalleryImages()); } catch { showError('Error al cargar'); }
    setLoading(false);
  };

  const reset = () => { setTitle(''); setOrder(0); setSelectedFile(null); setPreviewUrl(null); if (fileRef.current) fileRef.current.value = ''; };
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setSelectedFile(f); const r = new FileReader(); r.onload = () => setPreviewUrl(r.result as string); r.readAsDataURL(f); }
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) { showError('Selecciona una imagen'); return; }
    try { setUploading(true); const fd = new FormData(); fd.append('image', selectedFile); fd.append('title', title); fd.append('order', String(order)); await uploadGalleryImage(fd); showMsg('Imagen subida'); reset(); load(); }
    catch (err: any) { showError(err.message || 'Error'); }
    setUploading(false);
  };
  const del = async (id: string | undefined) => {
    if (!id || !confirm('Eliminar imagen?')) return;
    try { await deleteGalleryImage(id); load(); showMsg('Imagen eliminada'); } catch { showError('Error'); }
  };
  const copyUrl = (url: string) => { navigator.clipboard.writeText(url); showMsg('URL copiada'); };

  const filtered = search ? images.filter((img) => {
    const name = (img as any).name || img.title || '';
    return name.toLowerCase().includes(search.toLowerCase());
  }) : images;

  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (loading) return <div className="bg-white rounded-lg p-4 shadow-md"><p className="text-[#757575] text-sm">Cargando...</p></div>;

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <h2 className="text-lg font-bold mb-4 font-[var(--font-montserrat)] text-[#212121] flex items-center gap-2"><Image size={18} /> Galeria</h2>
      {error && <p className="text-red-600 mb-3 text-sm">{error}</p>}
      {msg && <p className="text-green-600 mb-3 text-sm">{msg}</p>}

      <form onSubmit={submit} className="space-y-3 mb-6 border-b pb-6">
        <h3 className="font-semibold text-[#212121] flex items-center gap-2"><Upload size={14} /> Subir nueva imagen</h3>
        <input type="file" ref={fileRef} onChange={handleFile} accept="image/jpeg,image/png,image/webp,image/gif" required disabled={uploading}
          className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-[#D9383A]" />
        {previewUrl && <div className="h-24 bg-gray-100 rounded-lg overflow-hidden"><img src={previewUrl} alt="Preview" className="h-full w-full object-cover" loading="lazy" /></div>}
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titulo" required disabled={uploading}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#D9383A]" />
        <button type="submit" disabled={uploading || !selectedFile}
          className="px-6 py-2 bg-[#D9383A] text-white rounded-lg font-semibold hover:bg-[#b52d2f] disabled:bg-gray-400 transition text-sm">
          {uploading ? 'Subiendo...' : 'Subir'}
        </button>
      </form>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757575]" />
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Buscar por nombre..." className="w-full pl-9 pr-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#D9383A]" />
      </div>

      {paged.length === 0 ? <p className="text-[#757575] text-sm">No hay imagenes</p> : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {paged.map((img) => (
            <div key={(img as any).id || (img as any)._id} className="relative group rounded-lg overflow-hidden">
              <div className="h-24 bg-gray-100">
                <img src={(img as any).url || img.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => copyUrl((img as any).url || img.imageUrl)} className="p-1.5 bg-blue-600/80 text-white rounded" title="Copiar URL">
                  <Copy size={12} />
                </button>
                <button onClick={() => del((img as any).id || img._id)} className="p-1.5 bg-red-600/80 text-white rounded">
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="p-1.5"><p className="text-xs font-semibold truncate">{(img as any).name || img.title}</p></div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
            className="p-1.5 rounded-lg bg-gray-100 text-[#757575] hover:bg-gray-200 disabled:opacity-30"><ChevronLeft size={16} /></button>
          <span className="text-xs text-[#757575]">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
            className="p-1.5 rounded-lg bg-gray-100 text-[#757575] hover:bg-gray-200 disabled:opacity-30"><ChevronRight size={16} /></button>
        </div>
      )}
    </div>
  );
}
