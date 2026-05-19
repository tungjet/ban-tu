"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Save, Loader2, Trash2, Bold, Italic,
  Underline as UnderlineIcon, Strikethrough, Heading1, Heading2,
  Heading3, List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, Quote, Code, Code2, Minus, Link as LinkIcon, Unlink, Undo2, Redo2, Highlighter, Palette,
  Subscript as SubscriptIcon, Superscript as SuperscriptIcon, RemoveFormatting,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

// Tiptap imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TiptapLink from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';

interface Product {
  id: string | number;
  name: string;
  price: number | string;
  original_price?: number | string | null;
  description?: string | null;
  image_url?: string | null;
  images?: string[] | null;
  category_id?: string | number | null;
  features?: string[] | null;
  rating?: number | null;
  sold?: number | null;
  slug?: string | null;
  is_published?: boolean;
}

interface Category {
  id: string | number;
  name: string;
}

interface ProductFormProps {
  product?: Product | null; // null/undefined for Add Mode, object for Edit Mode
  categories: Category[];
  onCancel: () => void;
  onSaved: () => void;
}

export function ProductForm({ product, categories, onCancel, onSaved }: ProductFormProps) {
  const isEditMode = !!product;
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const formatPriceInput = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const [form, setForm] = useState({
    name: "",
    price: "",
    original_price: "",
    description: "",
    image_url: "",
    images: [] as string[],
    category_id: "",
    features: "",
    rating: "",
    sold: "0",
    slug: "",
    is_published: true,
  });

  // Setup TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Subscript,
      Superscript,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder: 'Nhập mô tả sản phẩm chi tiết...',
      }),
    ],
    content: "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setForm(prev => ({ ...prev, description: editor.getHTML() }));
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none max-w-none text-slate-900 min-h-[260px]',
      },
    },
  });

  // Load and pre-populate states based on mode
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (product) {
        setForm({
          name: product.name || "",
          price: formatPriceInput(String(product.price || "")),
          original_price: product.original_price ? formatPriceInput(String(product.original_price)) : "",
          description: product.description || "",
          image_url: product.image_url || "",
          images: product.images || [],
          category_id: String(product.category_id || ""),
          features: (product.features || []).join("\n"),
          rating: product.rating ? String(product.rating) : "",
          sold: String(product.sold || "0"),
          slug: product.slug || "",
          is_published: product.is_published !== false,
        });

        const existing = product.images && product.images.length > 0
          ? product.images
          : product.image_url
          ? [product.image_url]
          : [];
        setImagePreviews(existing);

        if (editor) {
          editor.commands.setContent(product.description || "");
        }
      } else {
        setForm({
          name: "",
          price: "",
          original_price: "",
          description: "",
          image_url: "",
          images: [],
          category_id: "",
          features: "",
          rating: "",
          sold: "0",
          slug: "",
          is_published: true,
        });
        setImagePreviews([]);
        setSelectedFiles([]);
        if (editor) {
          editor.commands.setContent("");
        }
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [product, editor]);

  // Handle TipTap hyperlink adding
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Nhập URL:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  // Handle local image file uploads previewing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setSelectedFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove image preview (handles existing images and new files correctly)
  const removeImage = useCallback((index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    const existingCount = isEditMode
      ? ((product?.images?.length || 0) || (product?.image_url ? 1 : 0))
      : 0;
    if (index >= existingCount) {
      const fileIndex = index - existingCount;
      setSelectedFiles((prev) => prev.filter((_, i) => i !== fileIndex));
    }
  }, [product, isEditMode]);

  // Handle Form Submission (Add or Edit)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      toast.error("Vui lòng nhập đầy đủ Tên sản phẩm và Giá bán!");
      return;
    }
    setIsSaving(true);

    try {
      // 1. Upload new image files to Supabase Storage if any
      const uploadedUrls: string[] = [];
      for (const file of selectedFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Lỗi upload ảnh:", uploadError);
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      // 2. Combine kept existing images + newly uploaded images
      const existingCount = isEditMode
        ? ((product?.images?.length || 0) || (product?.image_url ? 1 : 0))
        : 0;
      const keptExisting = isEditMode
        ? imagePreviews.slice(0, existingCount).filter(Boolean)
        : [];
      const allImages = [...keptExisting, ...uploadedUrls];

      // 3. Clean up input variables
      const cleanFeatures = form.features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);

      const ratingValue = form.rating ? Number(form.rating) : null;
      const soldValue = Number(form.sold) || 0;
      const priceValue = Number(form.price.replace(/,/g, ""));
      const originalPriceValue = form.original_price
        ? Number(form.original_price.replace(/,/g, ""))
        : null;

      const payload = {
        name: form.name.trim(),
        price: priceValue,
        original_price: originalPriceValue,
        description: form.description,
        image_url: allImages[0] || "",
        images: allImages,
        category_id: form.category_id ? Number(form.category_id) : null,
        features: cleanFeatures,
        rating: ratingValue,
        sold: soldValue,
        slug: form.slug.trim() || null,
        is_published: form.is_published,
      };

      // 4. Update or Insert
      if (isEditMode && product) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", product.id);

        if (error) throw error;
        toast.success("Đã cập nhật sản phẩm thành công!");
      } else {
        const { error } = await supabase
          .from("products")
          .insert([payload]);

        if (error) throw error;
        toast.success("Đã thêm sản phẩm mới thành công!");
      }

      onSaved();
      onCancel();
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error("Lỗi khi lưu sản phẩm: " + errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-linear-to-r from-blue-50/50 to-white">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors w-10 h-10 flex items-center justify-center"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-slate-900">
            {isEditMode ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition-colors text-sm"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200/50 flex items-center justify-center gap-2 text-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> {isEditMode ? "Lưu thay đổi" : "Thêm sản phẩm"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Body Form */}
      <form onSubmit={handleSave} className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Product Information (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tên sản phẩm *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ví dụ: Tủ nhựa Ecoplast 4 cánh"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Giá bán (VNĐ) *</label>
                <input
                  type="text"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: formatPriceInput(e.target.value) })}
                  placeholder="Ví dụ: 3,500,000"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Giá gốc (Tùy chọn)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.original_price}
                    onChange={(e) => setForm({ ...form, original_price: formatPriceInput(e.target.value) })}
                    placeholder="Ví dụ: 4,000,000"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 text-sm pr-20"
                  />
                  {form.price && form.original_price && Number(form.original_price.replace(/,/g, "")) > Number(form.price.replace(/,/g, "")) && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      Giảm {Math.round((1 - Number(form.price.replace(/,/g, "")) / Number(form.original_price.replace(/,/g, ""))) * 100)}%
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Danh mục *</label>
                <select
                  required
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 text-sm bg-white"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Slug (Đường dẫn tĩnh)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="vd: tu-nhua-ecoplast-4-canh"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Rating mặc định (1–5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  placeholder="Ví dụ: 4.8"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Đã bán mặc định</label>
                <input
                  type="number"
                  min="0"
                  value={form.sold}
                  onChange={(e) => setForm({ ...form, sold: e.target.value })}
                  placeholder="Ví dụ: 156"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 py-1 select-none">
              <input
                type="checkbox"
                id="unified_is_published"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="unified_is_published" className="text-sm font-semibold text-slate-700 cursor-pointer">
                Hiển thị sản phẩm công khai (nếu tắt, sản phẩm sẽ bị ẩn khỏi cửa hàng)
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Đặc điểm nổi bật</label>
              <span className="block text-xs text-slate-400 mb-1.5">Mỗi dòng là 1 đặc điểm nổi bật.</span>
              <textarea
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
                rows={3}
                placeholder="Nhựa Ecoplast nguyên sinh, không mùi, cực bền&#10;Bản lề giảm chấn inox 304&#10;Bảo hành hậu mãi 10 năm"
                className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 text-sm resize-none"
              />
            </div>

            {/* Tiptap Rich Text Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả sản phẩm chi tiết</label>
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                {/* Tiptap Toolbar */}
                <div className="bg-slate-50 px-2 py-1.5 border-b border-slate-200 flex flex-wrap gap-0.5 items-center">
                  <button type="button" title="Hoàn tác" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${!editor?.can().undo() ? 'opacity-30 cursor-not-allowed' : 'text-slate-600'}`}><Undo2 className="w-4 h-4" /></button>
                  <button type="button" title="Làm lại" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${!editor?.can().redo() ? 'opacity-30 cursor-not-allowed' : 'text-slate-600'}`}><Redo2 className="w-4 h-4" /></button>

                  <div className="w-px h-6 bg-slate-300 mx-1" />

                  <button type="button" title="Tiêu đề 1" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><Heading1 className="w-4 h-4" /></button>
                  <button type="button" title="Tiêu đề 2" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><Heading2 className="w-4 h-4" /></button>
                  <button type="button" title="Tiêu đề 3" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('heading', { level: 3 }) ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><Heading3 className="w-4 h-4" /></button>

                  <div className="w-px h-6 bg-slate-300 mx-1" />

                  <button type="button" title="In đậm" onClick={() => editor?.chain().focus().toggleBold().run()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('bold') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><Bold className="w-4 h-4" /></button>
                  <button type="button" title="In nghiêng" onClick={() => editor?.chain().focus().toggleItalic().run()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('italic') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><Italic className="w-4 h-4" /></button>
                  <button type="button" title="Gạch chân" onClick={() => editor?.chain().focus().toggleUnderline().run()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('underline') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><UnderlineIcon className="w-4 h-4" /></button>
                  <button type="button" title="Gạch ngang" onClick={() => editor?.chain().focus().toggleStrike().run()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('strike') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><Strikethrough className="w-4 h-4" /></button>
                  <button type="button" title="Chỉ số trên" onClick={() => editor?.chain().focus().toggleSuperscript().run()} className={`hidden md:inline-flex p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('superscript') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><SuperscriptIcon className="w-4 h-4" /></button>
                  <button type="button" title="Chỉ số dưới" onClick={() => editor?.chain().focus().toggleSubscript().run()} className={`hidden md:inline-flex p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('subscript') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><SubscriptIcon className="w-4 h-4" /></button>

                  <div className="hidden md:block w-px h-6 bg-slate-300 mx-1" />

                  <button type="button" title="Highlight" onClick={() => editor?.chain().focus().toggleHighlight({ color: '#fef08a' }).run()} className={`hidden sm:inline-flex p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('highlight') ? 'bg-yellow-100 text-yellow-700' : 'text-slate-600'}`}><Highlighter className="w-4 h-4" /></button>
                  <div className="hidden sm:block relative group">
                    <button type="button" title="Màu chữ" className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-600 flex items-center gap-0.5"><Palette className="w-4 h-4" /></button>
                    <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl p-2 hidden group-hover:grid grid-cols-6 gap-1 z-50 w-[160px]">
                      {['#000000','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#6b7280','#dc2626','#ea580c','#ca8a04','#16a34a','#2563eb','#7c3aed','#db2777','#9ca3af','#991b1b'].map(color => (
                        <button key={color} type="button" onClick={() => editor?.chain().focus().setColor(color).run()} className="w-5 h-5 rounded border border-slate-200 hover:scale-125 transition-transform" style={{ backgroundColor: color }} />
                      ))}
                      <button type="button" onClick={() => editor?.chain().focus().unsetColor().run()} className="col-span-6 text-xs text-slate-500 hover:text-slate-700 mt-1">Xóa màu</button>
                    </div>
                  </div>

                  <div className="hidden sm:block w-px h-6 bg-slate-300 mx-1" />

                  <button type="button" title="Căn trái" onClick={() => editor?.chain().focus().setTextAlign('left').run()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><AlignLeft className="w-4 h-4" /></button>
                  <button type="button" title="Căn giữa" onClick={() => editor?.chain().focus().setTextAlign('center').run()} className={`hidden sm:inline-flex p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><AlignCenter className="w-4 h-4" /></button>
                  <button type="button" title="Căn phải" onClick={() => editor?.chain().focus().setTextAlign('right').run()} className={`hidden sm:inline-flex p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><AlignRight className="w-4 h-4" /></button>
                  <button type="button" title="Căn đều" onClick={() => editor?.chain().focus().setTextAlign('justify').run()} className={`hidden sm:inline-flex p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive({ textAlign: 'justify' }) ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><AlignJustify className="w-4 h-4" /></button>

                  <div className="hidden sm:block w-px h-6 bg-slate-300 mx-1" />

                  <button type="button" title="Danh sách" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('bulletList') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><List className="w-4 h-4" /></button>
                  <button type="button" title="Danh sách số" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('orderedList') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><ListOrdered className="w-4 h-4" /></button>

                  <div className="w-px h-6 bg-slate-300 mx-1" />

                  <button type="button" title="Trích dẫn" onClick={() => editor?.chain().focus().toggleBlockquote().run()} className={`hidden md:inline-flex p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('blockquote') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><Quote className="w-4 h-4" /></button>
                  <button type="button" title="Code" onClick={() => editor?.chain().focus().toggleCode().run()} className={`hidden md:inline-flex p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('code') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><Code className="w-4 h-4" /></button>
                  <button type="button" title="Code Block" onClick={() => editor?.chain().focus().toggleCodeBlock().run()} className={`hidden md:inline-flex p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('codeBlock') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><Code2 className="w-4 h-4" /></button>
                  <button type="button" title="Đường kẻ ngang" onClick={() => editor?.chain().focus().setHorizontalRule().run()} className="hidden md:inline-flex p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-600"><Minus className="w-4 h-4" /></button>

                  <div className="hidden md:block w-px h-6 bg-slate-300 mx-1" />

                  <button type="button" title="Thêm liên kết" onClick={setLink} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('link') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><LinkIcon className="w-4 h-4" /></button>
                  {editor?.isActive('link') && (
                    <button type="button" title="Bỏ liên kết" onClick={() => editor?.chain().focus().unsetLink().run()} className="p-1.5 hover:bg-slate-200 rounded transition-colors text-red-500"><Unlink className="w-4 h-4" /></button>
                  )}

                  <div className="w-px h-6 bg-slate-300 mx-1" />

                  <button type="button" title="Xóa định dạng" onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()} className={`hidden md:inline-flex p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-600`}><RemoveFormatting className="w-4 h-4" /></button>
                </div>
                {/* Editor Input Area */}
                <div className="px-4 py-3 min-h-[260px] focus:outline-none text-slate-900">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Image Selection (1/3) */}
          <div className="lg:col-span-1 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Hình ảnh sản phẩm *</label>
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center transition-colors cursor-pointer bg-slate-50 h-[200px] flex flex-col items-center justify-center relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  id="inline-product-file-upload"
                />
                <label htmlFor="inline-product-file-upload" className="w-full h-full flex flex-col items-center justify-center pointer-events-none">
                  <svg className="w-10 h-10 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-sm text-slate-600 font-semibold">Click để chọn nhiều ảnh</span>
                  <span className="text-xs text-slate-400 mt-1">Ảnh định dạng .png, .jpg, .webp</span>
                </label>
              </div>

              {/* Selected Images Grid */}
              {imagePreviews.length > 0 && (
                <div className="space-y-2 mt-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Danh sách ảnh ({imagePreviews.length})</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                    {imagePreviews.map((src, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 shadow-xs group bg-slate-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute inset-0 bg-red-500/70 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </form>

      {/* Footer actions */}
      <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50/50">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition-colors text-sm"
        >
          Huỷ
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200/50 flex items-center justify-center gap-2 text-sm"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> {isEditMode ? "Lưu thay đổi" : "Thêm sản phẩm"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
