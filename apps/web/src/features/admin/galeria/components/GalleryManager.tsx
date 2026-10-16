'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchGalleryImages,
  uploadGalleryImage,
  renameGalleryImage,
  deleteGalleryImage,
} from '@/services/admin.service';
import { GalleryImage } from '@/types';
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Search,
  Copy,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Hint } from '@/features/admin/components/Hint';
import { PRODUCT_IMAGE, describeLimits, validateImageFile } from '@/utils/image';

// El backend devuelve páginas por cursor: se piden SOLO las imágenes que se
// van a ver. `cursors[i]` es el cursor con el que se llega a la página i+1.
const PAGE_SIZE = 12;

export function GalleryManager() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, msg, showError, showMsg } = useToast();

  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const load = useCallback(
    async (cursor: string | null) => {
      setLoading(true);
      try {
        const page = await fetchGalleryImages({ limit: PAGE_SIZE, cursor: cursor || undefined });
        setImages(page.images || []);
        setNextCursor(page.nextCursor || null);
        setTotalCount(typeof page.totalCount === 'number' ? page.totalCount : null);
      } catch {
        showError('Error al cargar');
      }
      setLoading(false);
    },
    [showError]
  );

  useEffect(() => {
    load(null);
  }, [load]);

  const goToPage = (index: number) => {
    const cursor = cursors[index] ?? null;
    setPageIndex(index);
    load(cursor);
  };

  const goNext = () => {
    if (!nextCursor) return;
    const nextIndex = pageIndex + 1;
    setCursors((prev) => {
      const copy = [...prev];
      copy[nextIndex] = nextCursor;
      return copy;
    });
    setPageIndex(nextIndex);
    load(nextCursor);
  };

  const reset = () => {
    setTitle('');
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const problem = await validateImageFile(file, PRODUCT_IMAGE);
    if (problem) {
      showError(problem);
      reset();
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);

    // El nombre se propone solo a partir del archivo: menos tipeo.
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^.]+$/, '').slice(0, 60));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showError('Seleccioná una imagen');
      return;
    }
    try {
      setUploading(true);
      // Se vuelve a validar por las dudas (el archivo pudo cambiar).
      const problem = await validateImageFile(selectedFile, PRODUCT_IMAGE);
      if (problem) {
        showError(problem);
        setUploading(false);
        return;
      }
      const fd = new FormData();
      fd.append('image', selectedFile);
      fd.append('title', title);
      fd.append('purpose', 'product');
      await uploadGalleryImage(fd);
      showMsg('Imagen subida');
      reset();
      // Vuelve a la primera página: ahí está lo recién subido.
      setCursors([null]);
      setPageIndex(0);
      load(null);
    } catch (err: any) {
      showError(err.response?.data?.error || err.message || 'Error');
    }
    setUploading(false);
  };

  const del = async (id: string | undefined) => {
    if (!id || !confirm('¿Eliminar la imagen?')) return;
    try {
      await deleteGalleryImage(id);
      showMsg('Imagen eliminada');
      load(cursors[pageIndex] ?? null);
    } catch {
      showError('Error al eliminar');
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    showMsg('URL copiada');
  };

  const startRename = (img: GalleryImage) => {
    setEditingId(img.id);
    setEditingName(img.name);
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveName = async (id: string) => {
    const name = editingName.trim();
    if (!name) {
      showError('El nombre no puede estar vacío');
      return;
    }
    try {
      setSavingName(true);
      await renameGalleryImage(id, name);
      cancelRename();
      showMsg('Nombre actualizado');
      load(cursors[pageIndex] ?? null);
    } catch (err: any) {
      showError(err.response?.data?.error || 'No se pudo renombrar');
    }
    setSavingName(false);
  };

  const filtered = search
    ? images.filter((img) => img.name.toLowerCase().includes(search.toLowerCase()))
    : images;

  const hasPrev = pageIndex > 0;
  const hasNext = Boolean(nextCursor);

  return (
    <div className="bg-white rounded-lg p-4 shadow-md">
      <h2 className="text-lg font-bold mb-4 font-[var(--font-montserrat)] text-[#212121] flex items-center gap-2">
        <ImageIcon size={18} /> Galería
      </h2>
      {error && <p className="text-red-600 mb-3 text-sm">{error}</p>}
      {msg && <p className="text-green-600 mb-3 text-sm">{msg}</p>}

      <form onSubmit={submit} className="space-y-3 mb-6 border-b pb-6">
        <h3 className="font-semibold text-[#212121] flex items-center gap-2">
          <Upload size={14} /> Subir nueva imagen
          <Hint>{describeLimits(PRODUCT_IMAGE)}</Hint>
        </h3>
        <input
          type="file"
          ref={fileRef}
          onChange={handleFile}
          accept={PRODUCT_IMAGE.accept}
          disabled={uploading}
          title="Elegir imagen"
          className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-[#D95A2B]"
        />
        {previewUrl && (
          <div className="h-24 bg-gray-100 rounded-lg overflow-hidden">
            <img src={previewUrl} alt="Vista previa" className="h-full w-full object-contain" />
          </div>
        )}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          required
          disabled={uploading}
          title="Nombre para identificar la imagen"
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#D95A2B]"
        />
        <button
          type="submit"
          disabled={uploading || !selectedFile}
          className="px-6 py-2 bg-[#D95A2B] text-white rounded-lg font-semibold hover:bg-[#D94B2B] disabled:bg-gray-400 transition text-sm"
        >
          {uploading ? 'Subiendo...' : 'Subir'}
        </button>
      </form>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757575]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          title="Filtrar las imágenes de esta página"
          placeholder="Buscar en esta página..."
          className="w-full pl-9 pr-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#D95A2B]"
        />
      </div>

      {loading ? (
        <p className="text-[#757575] text-sm">Cargando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-[#757575] text-sm">
          {search ? 'Ninguna imagen de esta página coincide.' : 'No hay imágenes todavía.'}
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {filtered.map((img) => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden border border-gray-100">
              <div className="aspect-[6/5] bg-gray-100">
                <img
                  src={img.url}
                  alt={img.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              {img.format === 'gif' && (
                <span className="absolute bottom-8 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  GIF
                </span>
              )}
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
                <button
                  onClick={() => copyUrl(img.url)}
                  className="p-1.5 bg-blue-600/80 text-white rounded"
                  title="Copiar URL"
                >
                  <Copy size={12} />
                </button>
                <button
                  onClick={() => startRename(img)}
                  className="p-1.5 bg-amber-500/90 text-white rounded"
                  title="Cambiar el nombre"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => del(img.id)}
                  title="Eliminar imagen"
                  className="p-1.5 bg-red-600/80 text-white rounded"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <div className="p-1.5">
                {editingId === img.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveName(img.id);
                        if (e.key === 'Escape') cancelRename();
                      }}
                      maxLength={80}
                      className="min-w-0 flex-1 px-1.5 py-0.5 border border-[#D95A2B] rounded text-xs focus:outline-none"
                    />
                    <button
                      onClick={() => saveName(img.id)}
                      disabled={savingName}
                      title="Guardar"
                      className="p-1 bg-green-600 text-white rounded disabled:bg-gray-400"
                    >
                      <Check size={11} />
                    </button>
                    <button onClick={cancelRename} title="Cancelar" className="p-1 bg-gray-400 text-white rounded">
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs font-semibold truncate" title={img.name}>
                    {img.name}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-3 mt-4">
        <button
          onClick={() => goToPage(pageIndex - 1)}
          disabled={!hasPrev || loading}
          title="Página anterior"
          className="p-1.5 rounded-lg bg-gray-100 text-[#757575] hover:bg-gray-200 disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs text-[#757575]">
          Página {pageIndex + 1}
          {totalCount != null ? ` · ${totalCount} imágenes` : ''}
        </span>
        <button
          onClick={goNext}
          disabled={!hasNext || loading}
          title="Página siguiente"
          className="p-1.5 rounded-lg bg-gray-100 text-[#757575] hover:bg-gray-200 disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
