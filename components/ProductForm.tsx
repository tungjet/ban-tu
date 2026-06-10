"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { FormInput, FormTextarea, FormSelect } from "@/components/form";

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

// Giới hạn độ dài slug: chuẩn SEO là ~75 ký tự, để an toàn đặt 80
const SLUG_MAX_LENGTH = 80;
// Tối đa 5 lần thử khi slug bị trùng (thêm suffix -2, -3, ...)
const SLUG_DUPLICATE_RETRY_LIMIT = 5;

// Tạo slug thân thiện SEO từ tên sản phẩm: bỏ dấu tiếng Việt, ký tự đặc biệt, gọn khoảng trắng
function generateSlug(input: string): string {
  if (!input) return "";

  // Bước 1: thay thế thủ công các ký tự tiếng Việt phổ biến
  // (một số trình duyệt/engine NFD không phân tách đúng "đ", "Đ")
  const vietnameseMap: Record<string, string> = {
    đ: "d",
    Đ: "d",
    ă: "a",
    Ă: "a",
    â: "a",
    Â: "a",
    ê: "e",
    Ê: "e",
    ô: "o",
    Ô: "o",
    ơ: "o",
    Ơ: "o",
    ư: "u",
    Ư: "u",
  };
  let result = input.toString();
  for (const [key, value] of Object.entries(vietnameseMap)) {
    result = result.split(key).join(value);
  }

  // Bước 2: NFD + bỏ combining marks (dấu sắc, huyền, hỏi, ngã, nặng)
  result = result
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // Bước 3: chỉ giữ chữ thường, số, khoảng trắng và dấu gạch ngang
  result = result
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Bước 4: cắt còn tối đa SLUG_MAX_LENGTH ký tự
  // (cắt theo ranh giới dấu - gần nhất để không cắt giữa từ)
  if (result.length > SLUG_MAX_LENGTH) {
    let truncated = result.slice(0, SLUG_MAX_LENGTH);
    const lastDash = truncated.lastIndexOf("-");
    if (lastDash > SLUG_MAX_LENGTH * 0.6) {
      truncated = truncated.slice(0, lastDash);
    }
    result = truncated.replace(/-+$/g, "");
  }

  return result;
}

// Thêm suffix khi slug bị trùng: "abc" -> "abc-2" -> "abc-3"
function appendSlugSuffix(base: string, n: number): string {
  const suffix = `-${n}`;
  // Đảm bảo tổng độ dài vẫn trong giới hạn
  const maxBase = SLUG_MAX_LENGTH - suffix.length;
  return base.slice(0, maxBase).replace(/-+$/g, "") + suffix;
}

// Check xem message lỗi của Supabase có phải unique violation không
function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string };
  return (
    e.code === "23505" || // Postgres unique_violation
    (typeof e.message === "string" && /duplicate key|unique constraint/i.test(e.message))
  );
}

function ImagePreviewModal({
  image,
  onClose,
}: {
  image: { src: string; title?: string } | null;
  onClose: () => void;
}) {
  if (!image) return null;

  return (
    <div className="z-[999] fixed inset-0 flex justify-center items-center bg-slate-950/75 backdrop-blur-sm p-4">
      <div className="flex flex-col bg-white shadow-2xl rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden">
        <div className="flex justify-between items-center gap-3 px-4 py-3 border-slate-100 border-b">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-sm truncate">{image.title || "Xem ảnh"}</h3>
            <p className="text-slate-500 text-xs">Ảnh preview kích thước lớn</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex justify-center items-center hover:bg-slate-100 rounded-full w-9 h-9 text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 bg-slate-100 p-3 sm:p-5 overflow-auto">
          <img
            src={image.src}
            alt={image.title || "Preview"}
            className="bg-white shadow-sm mx-auto rounded-xl max-w-full max-h-[78vh] object-contain"
          />
        </div>
      </div>
    </div>
  );
}

interface Product {
  id: string | number;
  name: string;
  price: number | string | null;
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
  commission_percent?: number | string | null;
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
  const [imagePreviewModal, setImagePreviewModal] = useState<{ src: string; title?: string } | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!colorPickerOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setColorPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [colorPickerOpen]);

  const formatPriceInput = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const [slugTouched, setSlugTouched] = useState(false); // true khi user tự gõ slug -> không auto-generate nữa
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
    commission_percent: "" as string,
  });

  const selectedCategoryExists = categories.some((cat) => String(cat.id) === form.category_id);

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
          commission_percent:
            product.commission_percent != null && product.commission_percent !== ""
              ? String(product.commission_percent)
              : "",
        });
        setSlugTouched(!!product.slug); // chế độ sửa: nếu đã có slug thì coi như user đã set

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
          commission_percent: "",
        });
        setSlugTouched(false); // chế độ thêm: chưa ai đụng slug
        setImagePreviews([]);
        setSelectedFiles([]);
        if (editor) {
          editor.commands.setContent("");
        }
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [product, editor]);

  // Auto-gợi ý slug từ tên khi user gõ tên mà ô slug đang trống (chỉ ở chế độ thêm mới)
  // Xử lý trực tiếp trong onChange của input name để tránh setState-in-effect

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
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập Tên sản phẩm!");
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
      const priceValue = form.price ? Number(form.price.replace(/,/g, "")) : null;
      const originalPriceValue = form.original_price
        ? Number(form.original_price.replace(/,/g, ""))
        : null;
      const commissionPercentValue =
        form.commission_percent && form.commission_percent !== ""
          ? Number(form.commission_percent)
          : null;

      // Sinh slug từ tên nếu ô slug rỗng; đảm bảo đã được cắt theo giới hạn
      const baseSlug = generateSlug(
        form.slug.trim() || form.name.trim()
      );
      const finalSlug = baseSlug || null;

      const basePayload = {
        name: form.name.trim(),
        price: priceValue,
        original_price: originalPriceValue,
        description: form.description,
        image_url: allImages[0] || "",
        images: allImages,
        category_id: form.category_id || null,
        features: cleanFeatures,
        rating: ratingValue,
        sold: soldValue,
        is_published: form.is_published,
        commission_percent: commissionPercentValue,
      };

      // 4. Update or Insert
      if (isEditMode && product) {
        const { error } = await supabase
          .from("products")
          .update({ ...basePayload, slug: finalSlug })
          .eq("id", product.id);

        if (error) throw error;
        toast.success("Đã cập nhật sản phẩm thành công!");
      } else {
        // Thêm mới: nếu slug trùng, tự thêm suffix -2, -3, ... rồi thử lại
        let attempt = 0;
        let lastError: unknown = null;
        let success = false;

        while (attempt <= SLUG_DUPLICATE_RETRY_LIMIT) {
          const slugToTry =
            finalSlug === null
              ? null
              : attempt === 0
                ? finalSlug
                : appendSlugSuffix(finalSlug, attempt + 1);

          const { error } = await supabase
            .from("products")
            .insert([{ ...basePayload, slug: slugToTry }]);

          if (!error) {
            if (attempt > 0) {
              toast.success(
                `Đã thêm sản phẩm (slug "${finalSlug}" bị trùng, dùng "${slugToTry}")`
              );
            } else {
              toast.success("Đã thêm sản phẩm mới thành công!");
            }
            success = true;
            break;
          }

          // Nếu lỗi KHÔNG phải trùng slug -> dừng ngay
          if (!isUniqueViolation(error) || finalSlug === null) {
            lastError = error;
            break;
          }
          lastError = error;
          attempt++;
        }

        if (!success) {
          if (lastError) throw lastError;
          throw new Error("Không thể tạo slug duy nhất sau nhiều lần thử");
        }
      }

      onSaved();
      onCancel();
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      // Lỗi trùng slug cuối cùng -> thông báo dễ hiểu hơn
      if (isUniqueViolation(err)) {
        toast.error(
          "Slug này đã tồn tại và hệ thống không thể tự tạo slug thay thế. Vui lòng đổi slug khác."
        );
      } else {
        toast.error("Lỗi khi lưu sản phẩm: " + errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white shadow-sm border border-slate-100 rounded-2xl overflow-hidden">
      <ImagePreviewModal image={imagePreviewModal} onClose={() => setImagePreviewModal(null)} />
      {/* Header */}
      <div className="flex justify-between items-center bg-linear-to-r from-blue-50/50 to-white p-6 border-slate-100 border-b">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex justify-center items-center hover:bg-slate-100 p-2 rounded-full w-10 h-10 text-slate-500 hover:text-slate-900 transition-colors"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-slate-900 text-xl">
            {isEditMode ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="hover:bg-slate-100 px-5 py-2.5 border border-slate-200 rounded-xl font-semibold text-slate-700 text-sm transition-colors"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 shadow-blue-200/50 shadow-lg px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all"
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
      <form onSubmit={handleSave} className="space-y-6 p-6">
        <div className="gap-6 grid grid-cols-1 lg:grid-cols-3">

          {/* Left Column: Product Information (2/3) */}
          <div className="space-y-4 lg:col-span-2">
            <div>
              <FormInput
                label="Tên sản phẩm"
                type="text"
                required
                value={form.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setForm((prev) => {
                    // Chế độ sửa: không tự động ghi đè slug
                    if (product) return { ...prev, name: newName };
                    // Chế độ thêm + chưa ai tự gõ slug: tự sinh lại từ tên
                    if (!slugTouched) {
                      return { ...prev, name: newName, slug: generateSlug(newName) };
                    }
                    return { ...prev, name: newName };
                  });
                }}
                placeholder="Ví dụ: Tủ nhựa Ecoplast 4 cánh"
              />
            </div>

            <div className="gap-4 grid grid-cols-1 sm:grid-cols-2">
              <FormInput
                label="Giá bán (VNĐ)"
                type="text"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: formatPriceInput(e.target.value) })}
                placeholder="Ví dụ: 3,500,000"
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Giá gốc (Tùy chọn)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.original_price}
                    onChange={(e) => setForm({ ...form, original_price: formatPriceInput(e.target.value) })}
                    placeholder="Ví dụ: 4,000,000"
                    className="px-4 py-2.5 pr-20 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-slate-900 text-sm transition-all"
                  />
                  {form.price && form.original_price && Number(form.original_price.replace(/,/g, "")) > Number(form.price.replace(/,/g, "")) && (
                    <div className="top-1/2 right-3 absolute bg-green-50 px-2 py-0.5 rounded font-bold text-[10px] text-green-600 -translate-y-1/2">
                      Giảm {Math.round((1 - Number(form.price.replace(/,/g, "")) / Number(form.original_price.replace(/,/g, ""))) * 100)}%
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <FormInput
                label="Hoa hồng CTV riêng (%)"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.commission_percent}
                onChange={(e) => setForm({ ...form, commission_percent: e.target.value })}
                placeholder="Để trống = dùng mặc định"
              />
              <p className="mt-1 text-xs text-slate-500">Nếu để trống, hệ thống sẽ dùng hoa hồng mặc định của cửa hàng.</p>
            </div>

            <div className="gap-4 grid grid-cols-1 sm:grid-cols-2">
              <FormSelect
                label="Danh mục"
                required
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              >
                <option value="">-- Chọn danh mục --</option>
                {form.category_id && !selectedCategoryExists && (
                  <option value={form.category_id}>
                    Danh mục hiện tại ({form.category_id})
                  </option>
                )}
                {categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </option>
                ))}
              </FormSelect>

              <div>
                <label className="block mb-1 font-semibold text-slate-700 text-sm">
                  Slug (Đường dẫn tĩnh)
                </label>
                <input
                  type="text"
                  value={form.slug}
                  maxLength={SLUG_MAX_LENGTH}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm({ ...form, slug: e.target.value });
                  }}
                  placeholder="Để trống sẽ tự tạo từ tên sản phẩm (vd: tu-nhua-ecoplast-4-canh)"
                  className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-slate-900 text-sm transition-all"
                />
                <div className="flex items-center justify-between mt-1 gap-2">
                  {form.slug ? (
                    <p className="text-[11px] text-slate-500 break-all">
                      /san-pham/{form.slug}
                    </p>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      Tối đa {SLUG_MAX_LENGTH} ký tự
                    </span>
                  )}
                  <span
                    className={`text-[10px] shrink-0 ${
                      form.slug.length > SLUG_MAX_LENGTH * 0.9
                        ? "text-red-500 font-semibold"
                        : "text-slate-400"
                    }`}
                  >
                    {form.slug.length}/{SLUG_MAX_LENGTH}
                  </span>
                </div>
              </div>
            </div>

            <div className="gap-4 grid grid-cols-1 sm:grid-cols-2">
              <FormInput
                label="Rating mặc định (1–5)"
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                placeholder="Ví dụ: 4.8"
              />
              <FormInput
                label="Đã bán mặc định"
                type="number"
                min="0"
                value={form.sold}
                onChange={(e) => setForm({ ...form, sold: e.target.value })}
                placeholder="Ví dụ: 156"
              />
            </div>

            <div className="flex items-center gap-2 py-1 select-none">
              <input
                type="checkbox"
                id="unified_is_published"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                className="border-slate-300 rounded focus:ring-blue-500 w-4 h-4 text-blue-600 cursor-pointer"
              />
              <label htmlFor="unified_is_published" className="font-semibold text-slate-700 text-sm cursor-pointer">
                Hiển thị sản phẩm công khai (nếu tắt, sản phẩm sẽ bị ẩn khỏi cửa hàng)
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Đặc điểm nổi bật</label>
              <span className="block mb-1.5 text-slate-400 text-xs">Mỗi dòng là 1 đặc điểm nổi bật.</span>
              <FormTextarea
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
                rows={3}
                placeholder="Nhựa Ecoplast nguyên sinh, không mùi, cực bền&#10;Bản lề giảm chấn inox 304&#10;Bảo hành hậu mãi 10 năm"
                className="p-4"
              />
            </div>

            {/* Tiptap Rich Text Description */}
            <div>
              <label className="block mb-1 font-semibold text-slate-700 text-sm">Mô tả sản phẩm chi tiết</label>
              <div className="bg-white shadow-xs border border-slate-200 rounded-2xl overflow-hidden">
                {/* Tiptap Toolbar */}
                <div className="flex flex-wrap items-center gap-0.5 bg-slate-50 px-2 py-1.5 border-slate-200 border-b">
                  <button type="button" title="Hoàn tác" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${!editor?.can().undo() ? 'opacity-30 cursor-not-allowed' : 'text-slate-600'}`}><Undo2 className="w-4 h-4" /></button>
                  <button type="button" title="Làm lại" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${!editor?.can().redo() ? 'opacity-30 cursor-not-allowed' : 'text-slate-600'}`}><Redo2 className="w-4 h-4" /></button>

                  <div className="bg-slate-300 mx-1 w-px h-6" />

                  <button type="button" title="Tiêu đề 1" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><Heading1 className="w-4 h-4" /></button>
                  <button type="button" title="Tiêu đề 2" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><Heading2 className="w-4 h-4" /></button>
                  <button type="button" title="Tiêu đề 3" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('heading', { level: 3 }) ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><Heading3 className="w-4 h-4" /></button>

                  <div className="bg-slate-300 mx-1 w-px h-6" />

                  <button type="button" title="In đậm" onClick={() => editor?.chain().focus().toggleBold().run()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('bold') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><Bold className="w-4 h-4" /></button>
                  <button type="button" title="In nghiêng" onClick={() => editor?.chain().focus().toggleItalic().run()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('italic') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><Italic className="w-4 h-4" /></button>
                  <button type="button" title="Gạch chân" onClick={() => editor?.chain().focus().toggleUnderline().run()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('underline') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><UnderlineIcon className="w-4 h-4" /></button>
                  <button type="button" title="Gạch ngang" onClick={() => editor?.chain().focus().toggleStrike().run()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('strike') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><Strikethrough className="w-4 h-4" /></button>
                  <button type="button" title="Chỉ số trên" onClick={() => editor?.chain().focus().toggleSuperscript().run()} className={`hidden md:inline-flex p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('superscript') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><SuperscriptIcon className="w-4 h-4" /></button>
                  <button type="button" title="Chỉ số dưới" onClick={() => editor?.chain().focus().toggleSubscript().run()} className={`hidden md:inline-flex p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('subscript') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><SubscriptIcon className="w-4 h-4" /></button>

                  <div className="hidden md:block bg-slate-300 mx-1 w-px h-6" />

                  <button type="button" title="Highlight" onClick={() => editor?.chain().focus().toggleHighlight({ color: '#fef08a' }).run()} className={`hidden sm:inline-flex p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('highlight') ? 'bg-yellow-100 text-yellow-700' : 'text-slate-600'}`}><Highlighter className="w-4 h-4" /></button>
                  <div ref={colorPickerRef} className="hidden sm:block relative">
                    <button
                      type="button"
                      title="Màu chữ"
                      onClick={() => setColorPickerOpen((o) => !o)}
                      className={`flex items-center gap-0.5 hover:bg-slate-200 p-1.5 rounded text-slate-600 transition-colors ${colorPickerOpen ? "bg-slate-200" : ""}`}
                    >
                      <Palette className="w-4 h-4" />
                    </button>
                    {colorPickerOpen && (
                      <div className="top-full left-0 z-50 absolute gap-1 grid grid-cols-6 bg-white shadow-xl mt-1 p-2 border border-slate-200 rounded-lg w-[160px]">
                        {['#000000','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#6b7280','#dc2626','#ea580c','#ca8a04','#16a34a','#2563eb','#7c3aed','#db2777','#9ca3af','#991b1b'].map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              editor?.chain().focus().setColor(color).run();
                              setColorPickerOpen(false);
                            }}
                            className="border border-slate-200 rounded w-5 h-5 hover:scale-125 transition-transform"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            editor?.chain().focus().unsetColor().run();
                            setColorPickerOpen(false);
                          }}
                          className="col-span-6 mt-1 text-slate-500 hover:text-slate-700 text-xs"
                        >
                          Xóa màu
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="hidden sm:block bg-slate-300 mx-1 w-px h-6" />

                  <button type="button" title="Căn trái" onClick={() => editor?.chain().focus().setTextAlign('left').run()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><AlignLeft className="w-4 h-4" /></button>
                  <button type="button" title="Căn giữa" onClick={() => editor?.chain().focus().setTextAlign('center').run()} className={`hidden sm:inline-flex p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><AlignCenter className="w-4 h-4" /></button>
                  <button type="button" title="Căn phải" onClick={() => editor?.chain().focus().setTextAlign('right').run()} className={`hidden sm:inline-flex p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><AlignRight className="w-4 h-4" /></button>
                  <button type="button" title="Căn đều" onClick={() => editor?.chain().focus().setTextAlign('justify').run()} className={`hidden sm:inline-flex p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive({ textAlign: 'justify' }) ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><AlignJustify className="w-4 h-4" /></button>

                  <div className="hidden sm:block bg-slate-300 mx-1 w-px h-6" />

                  <button type="button" title="Danh sách" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('bulletList') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><List className="w-4 h-4" /></button>
                  <button type="button" title="Danh sách số" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('orderedList') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><ListOrdered className="w-4 h-4" /></button>

                  <div className="bg-slate-300 mx-1 w-px h-6" />

                  <button type="button" title="Trích dẫn" onClick={() => editor?.chain().focus().toggleBlockquote().run()} className={`hidden md:inline-flex p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('blockquote') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><Quote className="w-4 h-4" /></button>
                  <button type="button" title="Code" onClick={() => editor?.chain().focus().toggleCode().run()} className={`hidden md:inline-flex p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('code') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><Code className="w-4 h-4" /></button>
                  <button type="button" title="Code Block" onClick={() => editor?.chain().focus().toggleCodeBlock().run()} className={`hidden md:inline-flex p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('codeBlock') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><Code2 className="w-4 h-4" /></button>
                  <button type="button" title="Đường kẻ ngang" onClick={() => editor?.chain().focus().setHorizontalRule().run()} className="hidden md:inline-flex hover:bg-slate-200 p-1.5 rounded text-slate-600 transition-colors"><Minus className="w-4 h-4" /></button>

                  <div className="hidden md:block bg-slate-300 mx-1 w-px h-6" />

                  <button type="button" title="Thêm liên kết" onClick={setLink} className={`p-1.5 hover:bg-slate-200 rounded transition-colors ${editor?.isActive('link') ? 'bg-blue-100 text-blue-700' : 'text-slate-600'}`}><LinkIcon className="w-4 h-4" /></button>
                  {editor?.isActive('link') && (
                    <button type="button" title="Bỏ liên kết" onClick={() => editor?.chain().focus().unsetLink().run()} className="hover:bg-slate-200 p-1.5 rounded text-red-500 transition-colors"><Unlink className="w-4 h-4" /></button>
                  )}

                  <div className="bg-slate-300 mx-1 w-px h-6" />

                  <button type="button" title="Xóa định dạng" onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()} className={`hidden md:inline-flex p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-600`}><RemoveFormatting className="w-4 h-4" /></button>
                </div>
                {/* Editor Input Area */}
                <div className="px-4 py-3 focus:outline-none min-h-[260px] text-slate-900">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Image Selection (1/3) */}
          <div className="space-y-4 lg:col-span-1">
            <div>
              <label className="block mb-1 font-semibold text-slate-700 text-sm">Hình ảnh sản phẩm <span className="text-red-500">*</span></label>
              <div className="relative flex flex-col justify-center items-center bg-slate-50 p-6 border-2 border-slate-300 hover:border-blue-500 border-dashed rounded-2xl h-[200px] text-center transition-colors cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  id="inline-product-file-upload"
                />
                <label htmlFor="inline-product-file-upload" className="flex flex-col justify-center items-center w-full h-full pointer-events-none">
                  <svg className="mb-3 w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="font-semibold text-slate-600 text-sm">Click để chọn nhiều ảnh</span>
                  <span className="mt-1 text-slate-400 text-xs">Ảnh định dạng .png, .jpg, .webp</span>
                </label>
              </div>

              {/* Selected Images Grid */}
              {imagePreviews.length > 0 && (
                <div className="space-y-2 mt-4">
                  <label className="block font-bold text-slate-500 text-xs uppercase tracking-wider">Danh sách ảnh ({imagePreviews.length})</label>
                  <div className="gap-2 sm:gap-3 grid grid-cols-3 sm:grid-cols-4">
                    {imagePreviews.map((src, idx) => (
                      <div key={idx} className="group relative bg-slate-50 shadow-xs border border-slate-100 rounded-xl aspect-square overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setImagePreviewModal({ src, title: `Ảnh sản phẩm ${idx + 1}` })}
                          className="w-full h-full cursor-zoom-in"
                        >
                          <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="top-1.5 right-1.5 absolute flex justify-center items-center bg-red-500/90 opacity-0 group-hover:opacity-100 rounded-full w-8 h-8 text-white transition-opacity"
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
      <div className="flex gap-3 bg-slate-50/50 p-6 border-slate-100 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 hover:bg-slate-100 py-3 border border-slate-200 rounded-xl font-semibold text-slate-700 text-sm transition-colors"
        >
          Huỷ
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex flex-1 justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 shadow-blue-200/50 shadow-lg py-3 rounded-xl font-bold text-white text-sm transition-all"
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
