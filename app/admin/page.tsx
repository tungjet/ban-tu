"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  BarChart3,
  Box,
  ShoppingCart,
  Users,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Globe,
  LogOut,
  Lock,
  User,
  Mail,
  Layers,
  Plus,
  X,
  Menu,
  Truck,
  CreditCard,
  ShoppingBag,
  MessageSquare,
  Search,
  Star,
  Sparkles,
  Trash2,
  Pencil,
  MapPin,
  Camera,
  Save,
  ShieldCheck,
  Loader2,
  Handshake,
  Banknote,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { signIn, signOut, useSession } from "next-auth/react";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { ProductForm } from "@/components/ProductForm";
import CollaboratorsTab from "@/components/admin/CollaboratorsTab";
import { FormInput, FormSelect, FormTextarea, FormCheckbox, SearchInput } from "@/components/form";

import { toast, Toaster } from 'react-hot-toast';

const AVATAR_FOLDER = "avatars";

function getInitial(name: string, email: string) {
  const source = (name || email || "").trim();
  return source.charAt(0).toUpperCase() || "U";
}

const CANCELLED_ORDER_STATUS = "Đã huỷ";

const ORDER_NEXT_STATUS: Record<string, string | null> = {
  "Chờ xử lý": "Đã xác nhận",
  "Đã xác nhận": "Đang giao",
  "Đang giao": "Đã hoàn thành",
  "Đã hoàn thành": null,
  [CANCELLED_ORDER_STATUS]: null,
};

const ORDER_NEXT_ACTION_LABEL: Record<string, string> = {
  "Đã xác nhận": "Xác nhận",
  "Đang giao": "Giao hàng",
  "Đã hoàn thành": "Hoàn thành",
};

function getNextOrderStatus(status: string) {
  return ORDER_NEXT_STATUS[status] ?? null;
}

function canCancelOrder(status: string) {
  return status !== "Đã hoàn thành" && status !== CANCELLED_ORDER_STATUS;
}

function isValidOrderStatusTransition(currentStatus: string, nextStatus: string) {
  return nextStatus === getNextOrderStatus(currentStatus) || (nextStatus === CANCELLED_ORDER_STATUS && canCancelOrder(currentStatus));
}

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [chartFilter, setChartFilter] = useState("month"); // 'day', 'week', 'month'

  // Profile states & functions
  const [user, setUser] = useState<{ id: string; email?: string | null; name?: string | null } | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Password change states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync activeTab with URL tab search parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab) {
        const timer = window.setTimeout(() => setActiveTab(tab), 0);
        return () => window.clearTimeout(timer);
      }
    }
  }, []);

  // ============== PROFILE ==============
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileSaving(true);
    try {
      // TODO: replace with PATCH /api/admin/profile once the endpoint exists
      toast.success("Đã lưu tên hiển thị (chưa ghi vào DB)");
    } finally {
      setProfileSaving(false);
    }
  };

  // ============== AVATAR ==============
  const handlePickAvatar = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh tối đa 5MB");
      return;
    }

    setAvatarUploading(true);
    try {
      const fileExt = (file.name.split(".").pop() || "jpg").toLowerCase();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${AVATAR_FOLDER}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        toast.error("Upload thất bại: " + uploadError.message);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // TODO: replace with PATCH /api/admin/profile to persist avatar_url
      setAvatarUrl(publicUrl);
      toast.success("Đã cập nhật avatar (chưa ghi vào DB)");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !avatarUrl) return;
    setAvatarUploading(true);
    try {
      // TODO: replace with PATCH /api/admin/profile to clear avatar_url
      setAvatarUrl("");
      toast.success("Đã xoá avatar (chưa ghi vào DB)");
    } finally {
      setAvatarUploading(false);
    }
  };

  // ============== PASSWORD ==============
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải từ 6 ký tự trở lên");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setPasswordSaving(true);
    try {
      // TODO: replace with POST /api/admin/change-password once the endpoint exists
      toast.success("Đã đổi mật khẩu (chưa ghi vào DB)");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setPasswordSaving(false);
    }
  };
  const [orders, setOrders] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("Tất cả");
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any | null>(null);
  const [readOrderIds, setReadOrderIds] = useState<Set<string>>(new Set());
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [homepageFeatures, setHomepageFeatures] = useState<any[]>([]);
  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState({ name: "", slug: "", image_url: "" });
  const [categoryFile, setCategoryFile] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState<string>("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer_name: "",
    phone: "",
    address: "",
    payment_method: "COD",
    status: "Chờ xử lý",
    collaborator_id: null as string | null,
    collaborator_code: null as string | null,
  });
  const [selectedOrderProducts, setSelectedOrderProducts] = useState<any[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [collabList, setCollabList] = useState<{ id: string; full_name: string | null; email: string | null; referral_code: string | null; status: string }[]>([]);
  const [adminProductSearch, setAdminProductSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const { settings: storeSettings, loading: settingsLoading, updateSettings } = useStoreSettings();
  const [localSettings, setLocalSettings] = useState({ phone: "", facebook: "", zalo: "", address: "", defaultCommissionPercent: 5 });
  const [settingsSaving, setSettingsSaving] = useState(false);

  
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({ show: false, title: "", message: "", isDanger: false, onConfirm: () => {} });

  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [submittingReplyIds, setSubmittingReplyIds] = useState<Set<string>>(new Set());

  // Form state cho Testimonials
  const [editingTestimonial, setEditingTestimonial] = useState<any | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({
    customer_name: "",
    initial: "",
    product_label: "",
    rating: 5,
    content: "",
    display_order: 0,
    is_published: true,
  });

  // Form state cho Homepage Features
  const [editingFeature, setEditingFeature] = useState<any | null>(null);
  const [featureForm, setFeatureForm] = useState({
    icon: "shield-check",
    title: "",
    description: "",
    color_theme: "blue",
    display_order: 0,
    is_published: true,
  });

  // Form state cho Reviews
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    product_id: "",
    user_name: "",
    rating: 5,
    variant_label: "",
    content: "",
    is_published: true,
  });



  // Kiểm tra session khi reload trang (NextAuth via useSession)
  const { data: nextAuthSession, status: nextAuthStatus } = useSession();
  useEffect(() => {
    if (nextAuthStatus === "loading") {
      setIsLoading(true);
      return;
    }
    const s = nextAuthSession?.user;
    if (s) {
      setIsLoggedIn(true);
      setUser({ id: s.id ?? "", email: s.email ?? null, name: s.name ?? null });
      setDisplayName(s.name || "");
    } else {
      setIsLoggedIn(false);
      setUser(null);
      setDisplayName("");
      setAvatarUrl("");
    }
    setIsLoading(false);
  }, [nextAuthSession, nextAuthStatus]);

  // Load read_order_ids from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("read_order_ids");
        if (stored) {
          const timer = window.setTimeout(() => setReadOrderIds(new Set(JSON.parse(stored))), 0);
          return () => window.clearTimeout(timer);
        }
      } catch (err) {
        console.error("Failed to load read_order_ids from localStorage:", err);
      }
    }
  }, []);

  const markOrderAsRead = (orderId: string) => {
    setReadOrderIds((prev) => {
      const next = new Set(prev);
      next.add(orderId.toString());
      if (typeof window !== "undefined") {
        localStorage.setItem("read_order_ids", JSON.stringify(Array.from(next)));
      }
      return next;
    });
  };

  const markAllOrdersAsRead = () => {
    const allIds = orders.map((o: any) => o.id.toString());
    const next = new Set(allIds);
    setReadOrderIds(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("read_order_ids", JSON.stringify(allIds));
    }
    toast.success("Đã đánh dấu tất cả thông báo là đã đọc!");
  };

  // Xử lý đăng nhập bằng NextAuth credentials provider
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Sử dụng email trực tiếp nếu có ký tự '@', ngược lại tự động thêm @gmail.com
    const trimmedUsername = username.trim();
    const email = trimmedUsername.includes("@") ? trimmedUsername : `${trimmedUsername}@gmail.com`;

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError("Tài khoản hoặc mật khẩu không đúng!");
      console.error(result.error);
    } else {
      setIsLoggedIn(true);
      setError("");
    }
  };

  // Lấy danh sách đơn hàng từ API Mongoose (dùng useCallback để tránh lỗi lint)
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders", { credentials: "include" });
      if (!res.ok) {
        console.error("fetchOrders failed", res.status);
        return;
      }
      const d = await res.json();
      setOrders(d.orders || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchCollabs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/collaborators", { credentials: "include" });
      if (res.ok) {
        const d = await res.json();
        setCollabList(d.collaborators || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);



  // Xoá đơn hàng (có xác nhận)
  const deleteOrder = (order: any) => {
    const code = order.order_code || `BT-${order.id.toString().slice(-5)}`;
    setConfirmDialog({
      show: true,
      title: "Xoá đơn hàng?",
      message: `Bạn có chắc chắn muốn xoá đơn hàng ${code}? Hành động này không thể hoàn tác.`,
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, show: false }));
        try {
          const res = await fetch(`/api/admin/orders/${order.id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            toast.error("Lỗi khi xoá đơn hàng: " + (d.error || res.statusText));
            return;
          }
          toast.success("Đã xoá đơn hàng thành công!");
          setSelectedOrderDetail((prev: any) => (prev?.id === order.id ? null : prev));
          fetchOrders();
        } catch (err: any) {
          toast.error("Lỗi khi xoá đơn hàng: " + err.message);
        }
      },
    });
  };

  // Cập nhật trạng thái đơn hàng có xác nhận bằng dialog
  const handleStatusChangeWithConfirm = (order: any, nextStatus: string, isFromDetail = false) => {
    const currentStatus = order.status;
    if (currentStatus === nextStatus) return;

    if (!isValidOrderStatusTransition(currentStatus, nextStatus)) {
      toast.error("Thao tác đổi trạng thái không hợp lệ.");
      return;
    }

    const code = order.order_code || `BT-${order.id.toString().slice(-5)}`;
    setConfirmDialog({
      show: true,
      title: "Xác nhận đổi trạng thái đơn hàng",
      message: `Bạn có chắc chắn muốn thay đổi trạng thái đơn hàng ${code} từ "${currentStatus}" sang "${nextStatus}"?`,
      isDanger: false,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, show: false }));
        try {
          const res = await fetch(`/api/admin/orders/${order.id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: nextStatus }),
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            toast.error("Lỗi khi cập nhật trạng thái đơn hàng: " + (d.error || res.statusText));
            return;
          }
          toast.success(`Đã chuyển trạng thái đơn hàng ${code} sang "${nextStatus}"`);
          fetchOrders();
          if (isFromDetail) {
            setSelectedOrderDetail((prev: any) => prev && prev.id === order.id ? { ...prev, status: nextStatus } : prev);
          }
        } catch (err: any) {
          toast.error("Lỗi khi cập nhật trạng thái đơn hàng: " + err.message);
        }
      }
    });
  };

  const renderOrderStatusActions = (order: any, isFromDetail = false) => {
    const nextStatus = getNextOrderStatus(order.status);
    const canCancel = canCancelOrder(order.status);

    if (!nextStatus && !canCancel) {
      return (
        <span className="text-xs font-semibold text-slate-400">
          Không có hành động
        </span>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-2">
        {nextStatus && (
          <button
            type="button"
            onClick={() => handleStatusChangeWithConfirm(order, nextStatus, isFromDetail)}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {ORDER_NEXT_ACTION_LABEL[nextStatus] || nextStatus}
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            onClick={() => handleStatusChangeWithConfirm(order, CANCELLED_ORDER_STATUS, isFromDetail)}
            className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            Huỷ
          </button>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (isLoggedIn) {
      const timer = window.setTimeout(() => {
        void fetchOrders();
        void fetchCollabs();
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [isLoggedIn, fetchOrders, fetchCollabs]);

  // TODO: realtime order notifications removed during MongoDB migration.
  // NextAuth has no realtime equivalent; if needed, implement polling or SSE later.

  const derivedCustomers = useMemo(() => {
    const customerMap = new Map();
    orders.forEach((order: any) => {
      const key = order.phone || order.customer_name;
      if (!key) return;
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          name: order.customer_name,
          phone: order.phone,
          address: order.address,
          totalOrders: 1,
          totalSpent: Number(order.total_amount) || 0,
          lastOrderDate: order.created_at
        });
      } else {
        const existing = customerMap.get(key);
        customerMap.set(key, {
          ...existing,
          totalOrders: existing.totalOrders + 1,
          totalSpent: existing.totalSpent + (Number(order.total_amount) || 0),
          lastOrderDate: order.created_at > existing.lastOrderDate ? order.created_at : existing.lastOrderDate
        });
      }
    });
    return Array.from(customerMap.values());
  }, [orders]);

  const chartData = useMemo(() => {
    const now = new Date();
    const data = [];
    
    if (chartFilter === 'day') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        
        const total = orders
          .filter((o: any) => {
            const od = new Date(o.created_at);
            return o.status === 'Đã hoàn thành' && od.getDate() === d.getDate() && od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
          })
          .reduce((acc: number, o: any) => acc + (Number(o.total_amount) || 0), 0);
          
        data.push({ label: dateStr, value: total });
      }
    } else if (chartFilter === 'week') {
      for (let i = 3; i >= 0; i--) {
        const start = new Date();
        start.setDate(now.getDate() - (i * 7 + now.getDay()));
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        
        const label = `Tuần ${4-i}`;
        
        const total = orders
          .filter((o: any) => {
            const od = new Date(o.created_at);
            return o.status === 'Đã hoàn thành' && od >= start && od <= end;
          })
          .reduce((acc: number, o: any) => acc + (Number(o.total_amount) || 0), 0);
          
        data.push({ label, value: total });
      }
    } else if (chartFilter === 'month') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const dateStr = `Th ${d.getMonth() + 1}`;
        
        const total = orders
          .filter((o: any) => {
            const od = new Date(o.created_at);
            return o.status === 'Đã hoàn thành' && od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
          })
          .reduce((acc: number, o: any) => acc + (Number(o.total_amount) || 0), 0);
          
        data.push({ label: dateStr, value: total });
      }
    }
    
    return data;
  }, [orders, chartFilter]);

  // Lấy danh sách sản phẩm từ API Mongoose (dùng useCallback để tránh lỗi lint)
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/products", { credentials: "include" });
      if (!res.ok) {
        console.error("fetchProducts failed", res.status);
        return;
      }
      const d = await res.json();
      setProducts(d.products || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Lấy danh sách bình luận từ API Mongoose
  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/comments", { credentials: "include" });
      if (!res.ok) {
        console.error("fetchComments failed", res.status);
        return;
      }
      const d = await res.json();
      setComments(d.comments || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Testimonials (đánh giá khách hàng trang chủ)
  const fetchTestimonials = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/testimonials", { credentials: "include" });
      if (!res.ok) return;
      const d = await res.json();
      setTestimonials(d.testimonials || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Homepage features (3 ưu điểm trang chủ)
  const fetchHomepageFeatures = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/features", { credentials: "include" });
      if (!res.ok) return;
      const d = await res.json();
      setHomepageFeatures(d.features || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Reviews sản phẩm có sao
  const fetchProductReviews = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/reviews", { credentials: "include" });
      if (!res.ok) return;
      const d = await res.json();
      setProductReviews(d.reviews || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Trả lời bình luận (hỗ trợ nhiều reply dưới dạng JSON array)
  const parseReplies = (reply: string | null): Array<{content: string; created_at: string}> => {
    if (!reply) return [];
    try {
      const parsed = JSON.parse(reply);
      if (Array.isArray(parsed)) return parsed;
      // backward compat: single string reply
      return [{ content: reply, created_at: '' }];
    } catch {
      return [{ content: reply, created_at: '' }];
    }
  };

  const submitReply = async (commentId: string) => {
    const replyText = replyTexts[commentId]?.trim();
    if (!replyText) return;

    setSubmittingReplyIds(prev => new Set(prev).add(commentId));

    const comment = comments.find(c => c.id === commentId);
    const existingReplies = parseReplies(comment?.reply);
    const newReplies = [...existingReplies, { content: replyText, created_at: new Date().toISOString() }];

    try {
      const res = await fetch("/api/admin/comments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: commentId,
          reply: JSON.stringify(newReplies),
          repliedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error("Lỗi khi gửi trả lời: " + (d.error || res.statusText));
        return;
      }
      toast.success("Đã gửi trả lời thành công!");
      setReplyTexts(prev => { const next = {...prev}; delete next[commentId]; return next; });
      fetchComments();
    } catch (err: any) {
      toast.error("Lỗi khi gửi trả lời: " + err.message);
    } finally {
      setSubmittingReplyIds(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  // Xoá sản phẩm
  const deleteProduct = async (id: string) => {
    setConfirmDialog({
      show: true,
      title: "Xác nhận xoá",
      message: "Bạn có chắc chắn muốn xoá sản phẩm này?",
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, show: false }));
        try {
          const res = await fetch(`/api/admin/products/${id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            toast.error("Lỗi khi xoá sản phẩm: " + (d.error || res.statusText));
            return;
          }
          toast.success("Đã xoá sản phẩm thành công!");
          fetchProducts();
        } catch (err: any) {
          toast.error("Lỗi khi xoá sản phẩm: " + err.message);
        }
      }
    });
  };

  // Thay đổi trạng thái hiển thị ẩn/hiện của sản phẩm
  const toggleProductVisibility = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error("Lỗi khi thay đổi trạng thái sản phẩm: " + (d.error || res.statusText));
        return;
      }
      toast.success("Đã cập nhật trạng thái hiển thị sản phẩm!");
      fetchProducts();
    } catch (err: any) {
      toast.error("Lỗi khi thay đổi trạng thái sản phẩm: " + err.message);
    }
  };



  // Thêm danh mục mới
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let uploadedImageUrl = "";

      if (categoryFile) {
        const fileExt = categoryFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, categoryFile);

        if (uploadError) {
          console.error(uploadError);
          toast.error("Lỗi khi upload ảnh danh mục: " + uploadError.message);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        uploadedImageUrl = urlData.publicUrl;
      }

      const res = await fetch("/api/admin/categories", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newCategory, image_url: uploadedImageUrl }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error("Lỗi khi thêm danh mục: " + (d.error || res.statusText));
        return;
      }
      toast.success("Đã thêm danh mục thành công!");
      setNewCategory({ name: "", slug: "", image_url: "" });
      setCategoryFile(null);
      setCategoryImagePreview("");
      fetchCategories();
      setShowCategoryModal(false);
    } catch (error: any) {
      console.error(error);
      toast.error("Lỗi khi thêm danh mục: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Xoá danh mục
  const deleteCategory = async (id: string | number) => {
    setConfirmDialog({
      show: true,
      title: "Xác nhận xoá",
      message: "Bạn có chắc chắn muốn xoá danh mục này?",
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, show: false }));
        try {
          const res = await fetch(`/api/admin/categories/${id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            toast.error("Lỗi khi xoá danh mục: " + (d.error || res.statusText));
            return;
          }
          toast.success("Đã xoá danh mục thành công!");
          fetchCategories();
        } catch (err: any) {
          toast.error("Lỗi khi xoá danh mục: " + err.message);
        }
      }
    });
  };

  useEffect(() => {
    if (isLoggedIn && (activeTab === 'products' || activeTab === 'orders' || activeTab === 'dashboard')) {
      const timer = window.setTimeout(() => {
        void fetchProducts();
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [isLoggedIn, activeTab, fetchProducts]);

  useEffect(() => {
    if (isLoggedIn && activeTab === 'comments') {
      const timer = window.setTimeout(() => {
        void fetchComments();
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [isLoggedIn, activeTab, fetchComments]);

  useEffect(() => {
    if (isLoggedIn && activeTab === 'testimonials') {
      const timer = window.setTimeout(() => {
        void fetchTestimonials();
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [isLoggedIn, activeTab, fetchTestimonials]);

  useEffect(() => {
    if (isLoggedIn && activeTab === 'homepage') {
      const timer = window.setTimeout(() => {
        void fetchHomepageFeatures();
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [isLoggedIn, activeTab, fetchHomepageFeatures]);

  useEffect(() => {
    if (isLoggedIn && activeTab === 'reviews') {
      const timer = window.setTimeout(() => {
        void fetchProductReviews();
        if (products.length === 0) void fetchProducts();
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [isLoggedIn, activeTab, fetchProductReviews, fetchProducts, products.length]);

  // Fetch danh mục
  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories", { credentials: "include" });
      if (!res.ok) {
        console.error("fetchCategories failed", res.status);
        return;
      }
      const d = await res.json();
      setCategories(d.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchCategories();
    }
  }, [isLoggedIn]);

  // Tính toán stats từ dữ liệu thật
  const unreadOrders = useMemo(() => {
    return orders.filter((o: any) => o.status === 'Chờ xử lý' && !readOrderIds.has(o.id.toString()));
  }, [orders, readOrderIds]);

  const unreadCount = unreadOrders.length;

  const totalRevenue = orders
    .filter((o: any) => o.status === 'Đã hoàn thành')
    .reduce((acc: number, o: any) => acc + (Number(o.total_amount) || 0), 0);
    
  const newOrdersCount = orders.filter((o: any) => o.status === 'Chờ xử lý').length;

  const stats = [
    { title: "Tổng doanh thu", value: `${totalRevenue.toLocaleString('vi-VN')}đ`, icon: <BarChart3 className="w-6 h-6" />, trend: "Thực tế", isPositive: true, color: "bg-blue-500" },
    { title: "Đơn hàng mới", value: newOrdersCount.toString(), icon: <ShoppingCart className="w-6 h-6" />, trend: "Thực tế", isPositive: true, color: "bg-green-500" },
    { title: "Sản phẩm", value: products.length.toString(), icon: <Box className="w-6 h-6" />, trend: "Thực tế", isPositive: true, color: "bg-amber-500" },
    { title: "Khách hàng", value: derivedCustomers.length.toString(), icon: <Users className="w-6 h-6" />, trend: "Thực tế", isPositive: true, color: "bg-purple-500" },
  ];

  // ==================== TESTIMONIAL HANDLERS ====================
  const resetTestimonialForm = () => {
    setEditingTestimonial(null);
    setTestimonialForm({
      customer_name: "",
      initial: "",
      product_label: "",
      rating: 5,
      content: "",
      display_order: 0,
      is_published: true,
    });
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...testimonialForm,
      initial: testimonialForm.initial || (testimonialForm.customer_name?.trim().charAt(0).toUpperCase() || ""),
    };
    try {
      let res: Response;
      if (editingTestimonial?.id) {
        res = await fetch("/api/admin/testimonials", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingTestimonial.id, ...payload }),
        });
      } else {
        res = await fetch("/api/admin/testimonials", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error("Lỗi: " + (d.error || res.statusText));
        return;
      }
      toast.success(editingTestimonial ? "Đã cập nhật testimonial" : "Đã thêm testimonial");
      resetTestimonialForm();
      fetchTestimonials();
    } catch (err: any) {
      toast.error("Lỗi: " + err.message);
    }
  };

  const editTestimonial = (t: any) => {
    setEditingTestimonial(t);
    setTestimonialForm({
      customer_name: t.customer_name || "",
      initial: t.initial || "",
      product_label: t.product_label || "",
      rating: t.rating || 5,
      content: t.content || "",
      display_order: t.display_order || 0,
      is_published: t.is_published !== false,
    });
  };

  const deleteTestimonial = (id: string) => {
    setConfirmDialog({
      show: true,
      title: "Xoá testimonial?",
      message: "Hành động này không thể hoàn tác.",
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, show: false }));
        try {
          const res = await fetch(`/api/admin/testimonials?id=${id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            toast.error(d.error || res.statusText);
            return;
          }
          toast.success("Đã xoá");
          fetchTestimonials();
        } catch (err: any) {
          toast.error(err.message);
        }
      },
    });
  };

  // ==================== HOMEPAGE FEATURE HANDLERS ====================
  const resetFeatureForm = () => {
    setEditingFeature(null);
    setFeatureForm({
      icon: "shield-check",
      title: "",
      description: "",
      color_theme: "blue",
      display_order: 0,
      is_published: true,
    });
  };

  const handleSaveFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res: Response;
      if (editingFeature?.id) {
        res = await fetch("/api/admin/features", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingFeature.id, ...featureForm }),
        });
      } else {
        res = await fetch("/api/admin/features", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(featureForm),
        });
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error("Lỗi: " + (d.error || res.statusText));
        return;
      }
      toast.success(editingFeature ? "Đã cập nhật ưu điểm" : "Đã thêm ưu điểm");
      resetFeatureForm();
      fetchHomepageFeatures();
    } catch (err: any) {
      toast.error("Lỗi: " + err.message);
    }
  };

  const editFeature = (f: any) => {
    setEditingFeature(f);
    setFeatureForm({
      icon: f.icon || "shield-check",
      title: f.title || "",
      description: f.description || "",
      color_theme: f.color_theme || "blue",
      display_order: f.display_order || 0,
      is_published: f.is_published !== false,
    });
  };

  const deleteFeature = (id: string) => {
    setConfirmDialog({
      show: true,
      title: "Xoá ưu điểm này?",
      message: "Hành động này không thể hoàn tác.",
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, show: false }));
        try {
          const res = await fetch(`/api/admin/features?id=${id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            toast.error(d.error || res.statusText);
            return;
          }
          toast.success("Đã xoá");
          fetchHomepageFeatures();
        } catch (err: any) {
          toast.error(err.message);
        }
      },
    });
  };

  // ==================== REVIEW HANDLERS ====================
  const resetReviewForm = () => {
    setReviewForm({
      product_id: "",
      user_name: "",
      rating: 5,
      variant_label: "",
      content: "",
      is_published: true,
    });
    setShowReviewForm(false);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.product_id) {
      toast.error("Vui lòng chọn sản phẩm");
      return;
    }
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error("Lỗi: " + (d.error || res.statusText));
        return;
      }
      toast.success("Đã thêm đánh giá");
      resetReviewForm();
      fetchProductReviews();
    } catch (err: any) {
      toast.error("Lỗi: " + err.message);
    }
  };

  const deleteReview = (id: string) => {
    setConfirmDialog({
      show: true,
      title: "Xoá đánh giá này?",
      message: "Hành động này không thể hoàn tác.",
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, show: false }));
        try {
          const res = await fetch(`/api/admin/reviews?id=${id}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            toast.error(d.error || res.statusText);
            return;
          }
          toast.success("Đã xoá");
          fetchProductReviews();
        } catch (err: any) {
          toast.error(err.message);
        }
      },
    });
  };

  // Khung bao phủ toàn màn hình để che Header/Footer của trang chính
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-100 bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 animate-pulse">
          B
        </div>
        <p className="text-sm text-slate-400">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-100 bg-slate-50 overflow-hidden flex flex-col md:flex-row">
      <Toaster />

      {/* Order Detail Modal */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-200 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-all">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-linear-to-r from-blue-50/50 to-white">
              <div>
                <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                  <span>Chi tiết đơn hàng</span>
                  <span className="text-blue-600">#{selectedOrderDetail.order_code || `BT-${selectedOrderDetail.id.toString().slice(-5)}`}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đặt lúc: {new Date(selectedOrderDetail.created_at).toLocaleString('vi-VN')}
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrderDetail(null)}
                className="text-slate-400 hover:text-slate-600 w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 overflow-y-auto flex-1">
              {/* Left Column: Customer details (5/12) */}
              <div className="md:col-span-5 space-y-6">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    Thông tin khách hàng
                  </h4>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Họ và tên:</span>
                      <span className="font-semibold text-slate-900">{selectedOrderDetail.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Số điện thoại:</span>
                      <a href={`tel:${selectedOrderDetail.phone}`} className="font-semibold text-blue-600 hover:underline flex items-center gap-1">
                        {selectedOrderDetail.phone}
                      </a>
                    </div>
                    {selectedOrderDetail.email && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Email:</span>
                        <a href={`mailto:${selectedOrderDetail.email}`} className="font-semibold text-blue-600 hover:underline truncate max-w-[180px]">
                          {selectedOrderDetail.email}
                        </a>
                      </div>
                    )}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-500 block text-xs sm:text-sm">Địa chỉ nhận hàng:</span>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrderDetail.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-2 py-0.5 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Mở địa chỉ trên Google Maps"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>Xem bản đồ</span>
                        </a>
                      </div>
                      <span className="font-medium text-slate-900 block bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed text-xs">
                        {selectedOrderDetail.address}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    Thanh toán & Giao nhận
                  </h4>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phương thức:</span>
                      <span className="font-semibold text-slate-900">{selectedOrderDetail.payment_method}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Trạng thái:</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        selectedOrderDetail.status === 'Chờ xử lý' ? 'bg-amber-100 text-amber-700' :
                        selectedOrderDetail.status === 'Đã xác nhận' ? 'bg-indigo-100 text-indigo-700' :
                        selectedOrderDetail.status === 'Đang giao' ? 'bg-blue-100 text-blue-700' :
                        selectedOrderDetail.status === 'Đã hoàn thành' ? 'bg-green-100 text-green-700' :
                        selectedOrderDetail.status === 'Đã huỷ' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {selectedOrderDetail.status}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedOrderDetail.note && (
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      Ghi chú từ khách hàng
                    </h4>
                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-amber-800 text-xs leading-relaxed italic">
                      &quot;{selectedOrderDetail.note}&quot;
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Order items (7/12) */}
              <div className="md:col-span-7 flex flex-col">
                <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5 shrink-0">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  Sản phẩm đã chọn
                </h4>
                
                {/* List of items */}
                <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1 flex-1">
                  {(Array.isArray(selectedOrderDetail.items) ? selectedOrderDetail.items : []).map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between border border-slate-100 p-3 rounded-2xl shadow-xs bg-slate-50/50 hover:bg-slate-100/80 transition-colors duration-200">
                      <Link 
                        href={`/san-pham/${item.slug || item.id}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-3 group/item flex-1 min-w-0 mr-4 cursor-pointer"
                        title="Click để xem chi tiết sản phẩm ở tab mới"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 group-hover/item:border-blue-300 transition-colors">
                          <img src={item.image || "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=100"} alt={item.name} className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 line-clamp-1 group-hover/item:text-blue-600 transition-colors">{item.name}</p>
                          <p className="text-xs text-slate-500">
                            {Number(item.price).toLocaleString('vi-VN')}đ × {item.quantity}
                          </p>
                        </div>
                      </Link>
                      <span className="text-sm font-bold text-slate-900 whitespace-nowrap shrink-0">
                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  ))}
                  {(!selectedOrderDetail.items || selectedOrderDetail.items.length === 0) && (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      Không có thông tin sản phẩm.
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="bg-blue-50/30 border border-blue-100/50 p-4 rounded-2xl mt-4 shrink-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-slate-500">Phí vận chuyển:</span>
                    <span className="text-sm font-semibold text-green-600">Miễn phí (Freeship)</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="text-sm font-bold text-slate-900">Tổng cộng thanh toán:</span>
                    <span className="text-xl font-bold text-red-600">
                      {Number(selectedOrderDetail.total_amount).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer / Status Changer */}
            <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-slate-50/50">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-700">Hành động:</span>
                {renderOrderStatusActions(selectedOrderDetail, true)}
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => deleteOrder(selectedOrderDetail)}
                  className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Xoá đơn
                </button>
                <button 
                  onClick={() => setSelectedOrderDetail(null)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 w-full sm:w-auto text-center"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {confirmDialog.show && (
        <div className="fixed inset-0 z-200 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-slate-900 text-lg mb-2">{confirmDialog.title}</h3>
            <p className="text-slate-600 text-sm mb-6">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmDialog(prev => ({ ...prev, show: false }))}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Huỷ
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                className={`${
                  confirmDialog.isDanger 
                    ? "bg-red-600 hover:bg-red-700" 
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* TRƯỜNG HỢP CHƯA ĐĂNG NHẬP */}
      {!isLoggedIn ? (
        <div className="w-full h-full flex items-center justify-center bg-slate-900 p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-blue-500/30">
                B
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Tủ Nhựa Giá Rẻ Admin</h1>
              <p className="text-sm text-slate-500 mt-1">Vui lòng đăng nhập để tiếp tục</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <FormInput
                label="Tài khoản"
                required
                leadingIcon={<Mail className="w-4 h-4" />}
                type="text"
                placeholder="Tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <FormInput
                label="Mật khẩu"
                required
                leadingIcon={<Lock className="w-4 h-4" />}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {error && (
                <p className="text-sm text-red-500 font-medium">{error}</p>
              )}

              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-200"
              >
                Đăng nhập
              </button>

              <div className="text-center mt-4">
                <Link href="/" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">
                  ← Quay lại Website
                </Link>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* TRƯỜNG HỢP ĐÃ ĐĂNG NHẬP */
        <>
          {/* SIDEBAR OVERLAY (mobile) */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-slate-900/60 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* SIDEBAR */}
          <div className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-400 flex flex-col
            transition-transform duration-300 ease-in-out
            md:static md:translate-x-0 md:z-auto
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}>
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-white text-lg font-bold">
                <span className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0">B</span>
                Tủ Nhựa Giá Rẻ Admin
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Đóng menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {[
                { id: "dashboard", icon: <BarChart3 className="w-5 h-5" />, label: "Dashboard" },
                { id: "orders", icon: <ShoppingCart className="w-5 h-5" />, label: "Đơn hàng" },
                { id: "products", icon: <Box className="w-5 h-5" />, label: "Sản phẩm" },
                { id: "categories", icon: <Layers className="w-5 h-5" />, label: "Danh mục" },
                { id: "customers", icon: <Users className="w-5 h-5" />, label: "Khách hàng" },
                { id: "comments", icon: <MessageSquare className="w-5 h-5" />, label: "Bình luận" },
                { id: "reviews", icon: <Star className="w-5 h-5" />, label: "Đánh giá sao" },
                { id: "testimonials", icon: <Sparkles className="w-5 h-5" />, label: "Testimonial" },
                { id: "homepage", icon: <Globe className="w-5 h-5" />, label: "Trang chủ" },
                { id: "settings", icon: <Settings className="w-5 h-5" />, label: "Cài đặt" },
                { id: "account", icon: <User className="w-5 h-5" />, label: "Tài khoản" },
                { id: "collaborators", icon: <Handshake className="w-5 h-5" />, label: "Cộng tác viên" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => { 
                    setActiveTab(item.id); 
                    setSidebarOpen(false); 
                    if (typeof window !== "undefined") {
                      window.history.pushState(null, "", `/admin?tab=${item.id}`);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    activeTab === item.id ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-slate-800 space-y-1">
              <Link
                href="/"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Globe className="w-5 h-5" /> Xem Website
              </Link>
              <button
                onClick={async () => {
                  try {
                    await signOut({ redirect: false });
                    setIsLoggedIn(false);
                    setUsername("");
                    setPassword("");
                    setActiveTab("dashboard");
                  } catch (err: any) {
                    toast.error("Lỗi khi đăng xuất: " + err.message);
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-red-900/20 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5" /> Đăng xuất
              </button>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
            {/* HEADER */}
            <header className="bg-white border-b border-slate-200 h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 shrink-0">
              <div className="flex items-center gap-3">
                {/* Hamburger — mobile only */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden p-2 -ml-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="Mở menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-base sm:text-xl font-bold text-slate-900 truncate">
                  {activeTab === 'dashboard' && "Tổng quan"}
                  {activeTab === 'orders' && "Quản lý đơn hàng"}
                  {activeTab === 'products' && "Quản lý sản phẩm"}
                  {activeTab === 'categories' && "Quản lý danh mục"}
                  {activeTab === 'customers' && "Khách hàng"}
                  {activeTab === 'comments' && "Bình luận & Hỏi đáp"}
                  {activeTab === 'reviews' && "Đánh giá có sao"}
                  {activeTab === 'testimonials' && "Testimonial trang chủ"}
                  {activeTab === 'homepage' && "Cấu hình trang chủ"}
                  {activeTab === 'settings' && "Cài đặt hệ thống"}
                  {activeTab === 'account' && "Cài đặt tài khoản"}
                  {activeTab === 'collaborators' && "Quản lý cộng tác viên"}
                </h1>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative">
                  <button 
                    onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                    className={`p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-all relative ${
                      showNotificationDropdown ? 'text-blue-600 bg-slate-100' : ''
                    }`}
                    aria-label="Thông báo"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown thông báo */}
                  {showNotificationDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowNotificationDropdown(false)} />
                      <div className="absolute right-0 mt-2 w-[280px] xs:w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 overflow-hidden py-1 transition-all duration-200">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-blue-50/50 to-white">
                          <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <Bell className="w-4 h-4 text-blue-600" />
                            Thông báo đơn hàng ({unreadCount})
                          </span>
                          {unreadCount > 0 && (
                            <button 
                              onClick={() => {
                                markAllOrdersAsRead();
                                setShowNotificationDropdown(false);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700 font-bold transition-colors"
                            >
                              Đọc tất cả
                            </button>
                          )}
                        </div>

                        {/* List */}
                        <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                          {orders.slice(0, 5).map((order) => {
                            const isUnread = order.status === 'Chờ xử lý' && !readOrderIds.has(order.id.toString());
                            const items = Array.isArray(order.items) ? order.items : [];
                            const productLabel = items.length > 0
                              ? items.map((i: any) => `${i.name} x${i.quantity}`).join(", ")
                              : "Đơn hàng mới";

                            const orderCode = order.order_code || `BT-${order.id.toString().slice(-5)}`;
                            const relativeTime = (() => {
                              const created = new Date(order.created_at);
                              const diffMs = Date.now() - created.getTime();
                              const diffMin = Math.floor(diffMs / 60000);
                              if (diffMin < 1) return "Vừa xong";
                              if (diffMin < 60) return `${diffMin} phút trước`;
                              const diffHrs = Math.floor(diffMin / 60);
                              if (diffHrs < 24) return `${diffHrs} giờ trước`;
                              return created.toLocaleDateString('vi-VN');
                            })();

                            return (
                              <div 
                                key={order.id}
                                onClick={() => {
                                  markOrderAsRead(order.id.toString());
                                  setSelectedOrderDetail(order);
                                  setShowNotificationDropdown(false);
                                }}
                                className={`px-4 py-3 hover:bg-slate-50/80 cursor-pointer flex gap-3 transition-colors ${
                                  isUnread ? 'bg-blue-50/20' : ''
                                }`}
                              >
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                  <ShoppingBag className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <span className="font-bold text-xs text-slate-900 truncate">#{orderCode}</span>
                                    <span className="text-[10px] text-slate-400 font-medium shrink-0">{relativeTime}</span>
                                  </div>
                                  <p className="text-xs font-semibold text-slate-800 truncate mb-0.5">{order.customer_name}</p>
                                  <p className="text-xs text-slate-500 line-clamp-1 mb-1.5">{productLabel}</p>
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-xs text-red-600">
                                      {Number(order.total_amount).toLocaleString('vi-VN')}đ
                                    </span>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                      order.status === 'Chờ xử lý' ? 'bg-amber-100 text-amber-700' :
                                      order.status === 'Đã xác nhận' ? 'bg-indigo-100 text-indigo-700' :
                                      order.status === 'Đang giao' ? 'bg-blue-100 text-blue-700' :
                                      order.status === 'Đã hoàn thành' ? 'bg-green-100 text-green-700' :
                                      order.status === 'Đã huỷ' ? 'bg-rose-100 text-rose-700' :
                                      'bg-slate-100 text-slate-700'
                                    }`}>
                                      {order.status}
                                    </span>
                                  </div>
                                </div>
                                {isUnread && (
                                  <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 self-center animate-pulse" />
                                )}
                              </div>
                            );
                          })}

                          {orders.length === 0 && (
                            <div className="p-8 text-center text-slate-400 text-xs">
                              Chưa có thông báo đơn hàng nào.
                            </div>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 border-t border-slate-100 text-center bg-slate-50">
                          <button 
                            onClick={() => {
                              setActiveTab("orders");
                              setShowNotificationDropdown(false);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-bold transition-colors"
                          >
                            Xem tất cả đơn hàng
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                      {displayName ? displayName.charAt(0).toUpperCase() : "A"}
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-700 hidden sm:block">
                    {displayName || "Admin"}
                  </span>
                </div>
              </div>
            </header>

            {/* CONTENT BODY */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 bg-slate-50">
              {activeTab === 'dashboard' && (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {stats.map((stat, index) => (
                      <div key={index} className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start">
                        <div>
                          <p className="text-xs sm:text-sm text-slate-500 mb-1">{stat.title}</p>
                          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{stat.value}</h3>
                          <div className={`flex items-center gap-1 text-[10px] sm:text-xs mt-2 ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            <span>{stat.trend} so với tháng trước</span>
                          </div>
                        </div>
                        <div className={`${stat.color} text-white p-2.5 sm:p-3 rounded-xl shrink-0`}>
                          {stat.icon}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Revenue Chart */}
                  <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h2 className="font-bold text-slate-900 text-lg">Doanh thu</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Thống kê doanh thu theo thời gian</p>
                      </div>
                      <div className="flex bg-slate-100 p-1 rounded-lg text-[11px] sm:text-xs font-medium w-full sm:w-auto">
                        <button 
                          onClick={() => setChartFilter('day')}
                          className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-md transition-colors ${chartFilter === 'day' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          Ngày
                        </button>
                        <button 
                          onClick={() => setChartFilter('week')}
                          className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-md transition-colors ${chartFilter === 'week' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          Tuần
                        </button>
                        <button 
                          onClick={() => setChartFilter('month')}
                          className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-md transition-colors ${chartFilter === 'month' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          Tháng
                        </button>
                      </div>
                    </div>

                    <div className="h-64 flex items-end justify-between gap-1 sm:gap-2 pt-4">
                      {chartData.map((item, index) => {
                        const maxValue = Math.max(...chartData.map(d => d.value), 1);
                        const heightPercent = (item.value / maxValue) * 100;
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end relative">
                            {/* Tooltip on hover */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] sm:text-xs py-1 px-2 rounded-md mb-1 absolute bottom-full transform -translate-y-2 pointer-events-none whitespace-nowrap z-10">
                              {item.value.toLocaleString('vi-VN')}đ
                            </div>
                            
                            {/* Bar */}
                            <div 
                              className="w-full max-w-[40px] bg-linear-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500 ease-out group-hover:from-blue-700 group-hover:to-blue-500"
                              style={{ height: `${heightPercent}%`, minHeight: item.value > 0 ? '4px' : '0px' }}
                            ></div>
                            
                            {/* Label */}
                            <span className="text-[10px] sm:text-xs text-slate-500 font-medium truncate w-full text-center">
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Charts & Tables Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Đơn hàng gần đây */}
                    <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-slate-900 text-base sm:text-lg">Đơn hàng gần đây</h2>
                        <button onClick={() => setActiveTab("orders")} className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer">Xem tất cả</button>
                      </div>
                      
                      {/* Mobile Card List (block sm:hidden) */}
                      <div className="block sm:hidden space-y-3">
                        {orders.slice(0, 4).map((order) => {
                          const items = Array.isArray(order.items) ? order.items : [];
                          const productLabel = items.length > 0
                            ? items.map((i: any) => `${i.name} x${i.quantity}`).join(", ")
                            : "Đơn hàng";
                          const orderCode = order.order_code ? `#${order.order_code}` : `#BT-${order.id.toString().slice(-5)}`;
                          return (
                            <div 
                              key={order.id}
                              onClick={() => {
                                markOrderAsRead(order.id.toString());
                                setSelectedOrderDetail(order);
                              }}
                              className="p-3 border border-slate-100 rounded-xl hover:shadow-sm transition-shadow cursor-pointer bg-slate-50/50 space-y-2"
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-blue-600 text-xs">{orderCode}</span>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  order.status === 'Chờ xử lý' ? 'bg-amber-100 text-amber-700' :
                                  order.status === 'Đang giao' ? 'bg-blue-100 text-blue-700' :
                                  order.status === 'Đã hoàn thành' ? 'bg-green-100 text-green-700' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                              <div className="text-xs font-semibold text-slate-800">{order.customer_name}</div>
                              <div className="text-[11px] text-slate-500 truncate">{productLabel}</div>
                              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                <span className="text-[10px] text-slate-400">Tổng tiền</span>
                                <span className="text-xs font-bold text-slate-900">
                                  {Number(order.total_amount).toLocaleString('vi-VN')}đ
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop Table (hidden sm:block) */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                          <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-100">
                            <tr>
                              <th className="px-4 py-3 font-medium">Mã đơn</th>
                              <th className="px-4 py-3 font-medium">Khách hàng</th>
                              <th className="px-4 py-3 font-medium">Sản phẩm</th>
                              <th className="px-4 py-3 font-medium">Tổng tiền</th>
                              <th className="px-4 py-3 font-medium">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.slice(0, 4).map((order) => {
                              const items = Array.isArray(order.items) ? order.items : [];
                              const productLabel = items.length > 0
                                ? items.map((i: any) => `${i.name} x${i.quantity}`).join(", ")
                                : "Đơn hàng";
                              const orderCode = order.order_code ? `#${order.order_code}` : `#BT-${order.id.toString().slice(-5)}`;
                              return (
                                <tr 
                                  key={order.id} 
                                  onClick={() => {
                                    markOrderAsRead(order.id.toString());
                                    setSelectedOrderDetail(order);
                                  }}
                                  className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                                >
                                  <td className="px-4 py-4 font-bold text-blue-600 hover:underline">{orderCode}</td>
                                  <td className="px-4 py-4 font-semibold text-slate-800">{order.customer_name}</td>
                                  <td className="px-4 py-4 line-clamp-1 max-w-[150px]">{productLabel}</td>
                                  <td className="px-4 py-4 font-bold text-slate-900">
                                    {Number(order.total_amount).toLocaleString('vi-VN')}đ
                                  </td>
                                  <td className="px-4 py-4">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                      order.status === 'Chờ xử lý' ? 'bg-amber-100 text-amber-700' :
                                      order.status === 'Đã xác nhận' ? 'bg-indigo-100 text-indigo-700' :
                                      order.status === 'Đang giao' ? 'bg-blue-100 text-blue-700' :
                                      order.status === 'Đã hoàn thành' ? 'bg-green-100 text-green-700' :
                                      order.status === 'Đã huỷ' ? 'bg-rose-100 text-rose-700' :
                                      'bg-slate-100 text-slate-700'
                                    }`}>
                                      {order.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Sản phẩm bán chạy */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-slate-900">Top bán chạy</h2>
                        <button onClick={() => setActiveTab("products")} className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer">Chi tiết</button>
                      </div>
                      
                      <div className="space-y-4">
                        {[...products]
                          .map((p: any) => {
                            const realSold = orders
                              .filter((o: any) => o.status === 'Đã hoàn thành')
                              .reduce((acc: number, o: any) => {
                                const items = Array.isArray(o.items) ? o.items : [];
                                const item = items.find((i: any) => i.id === p.id);
                                return acc + (item ? Number(item.quantity) || 0 : 0);
                              }, 0);
                            return { ...p, realSold };
                          })
                          .sort((a: any, b: any) => b.realSold - a.realSold)
                          .slice(0, 4)
                          .map((product: any, index: number) => (
                            <div key={product.id || index} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-900 line-clamp-1 max-w-[180px]">{product.name}</p>
                                  <p className="text-xs text-slate-500">Đã bán: {product.realSold}</p>
                                </div>
                              </div>
                              <span className="text-xs font-medium text-amber-500 flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-current" />
                                {Number(product.rating ?? 5).toFixed(1)}
                              </span>
                            </div>
                          ))}
                        {products.length === 0 && (
                          <div className="text-center py-4 text-slate-500 text-xs">
                            Chưa có sản phẩm nào.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'orders' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
                      <h2 className="font-bold text-slate-900 text-base sm:text-lg">Danh sách đơn hàng</h2>
                      <button 
                        onClick={() => setShowOrderModal(true)}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                        Tạo đơn hàng
                      </button>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none snap-x snap-mandatory whitespace-nowrap shrink-0 w-full sm:w-auto">
                      {["Tất cả", "Chờ xử lý", "Đã xác nhận", "Đang giao", "Đã hoàn thành", "Đã huỷ"].map((status) => (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(status)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors snap-start shrink-0 ${
                            filterStatus === status 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {showOrderModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-linear-to-r from-blue-50 to-white">
                          <div>
                            <h3 className="font-bold text-xl text-slate-900">Tạo đơn hàng mới</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Nhập thông tin khách hàng và chọn sản phẩm</p>
                          </div>
                          <button 
                            onClick={() => {
                              setShowOrderModal(false);
                              setSelectedOrderProducts([]);
                              setProductSearchQuery("");
                            }}
                            className="text-slate-400 hover:text-slate-600 w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        
                        {/* Content */}
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-y-auto flex-1">
                          {/* Left Column: Customer Info (5/12) */}
                          <div className="lg:col-span-5 space-y-6">
                            <div className="flex items-center gap-2 text-blue-600 border-b border-slate-100 pb-2">
                              <Truck className="w-5 h-5" />
                              <h4 className="font-bold text-slate-900">Thông tin giao hàng</h4>
                            </div>
                            
                            <div className="space-y-4">
                              <FormInput
                                label="Tên khách hàng"
                                required
                                type="text"
                                placeholder="Nguyễn Văn A"
                                value={newOrder.customer_name}
                                onChange={(e) => setNewOrder({...newOrder, customer_name: e.target.value})}
                              />
                              <FormInput
                                label="Số điện thoại"
                                required
                                type="text"
                                placeholder="0912345678"
                                value={newOrder.phone}
                                onChange={(e) => {
                                  const phone = e.target.value;
                                  const customer = derivedCustomers.find(c => c.phone === phone);
                                  if (customer) {
                                    setNewOrder({
                                      ...newOrder,
                                      phone,
                                      customer_name: customer.name,
                                      address: customer.address
                                    });
                                    toast.success("Đã tự động điền thông tin khách hàng cũ!");
                                  } else {
                                    setNewOrder({...newOrder, phone});
                                  }
                                }}
                              />
                              <FormInput
                                label="Địa chỉ nhận hàng"
                                required
                                type="text"
                                placeholder="Số nhà, tên đường, phường/xã..."
                                value={newOrder.address}
                                onChange={(e) => setNewOrder({...newOrder, address: e.target.value})}
                              />
                              <div>
                                <FormSelect
                                  label="Cộng tác viên"
                                  value={newOrder.collaborator_id || ""}
                                  onChange={(e) => {
                                    const c = collabList.find((x) => x.id === e.target.value);
                                    setNewOrder({
                                      ...newOrder,
                                      collaborator_id: e.target.value || null,
                                      collaborator_code: c?.referral_code || null,
                                    });
                                  }}
                                >
                                  <option value="">-- Không có --</option>
                                  {collabList.filter((c) => c.status === "active").map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.full_name || c.email} ({c.referral_code})
                                    </option>
                                  ))}
                                </FormSelect>
                                {newOrder.collaborator_code && (
                                  <p className="text-xs text-slate-500 mt-1">Mã giới thiệu: <span className="font-semibold text-blue-600">{newOrder.collaborator_code}</span></p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-blue-600 border-b border-slate-100 pb-2 mt-6">
                              <CreditCard className="w-5 h-5" />
                              <h4 className="font-bold text-slate-900">Phương thức thanh toán</h4>
                            </div>
                            
                            <FormSelect
                              value={newOrder.payment_method}
                              onChange={(e) => setNewOrder({...newOrder, payment_method: e.target.value})}
                            >
                              <option value="COD">Thu tiền khi nhận hàng (COD)</option>
                              <option value="Chuyển khoản">Chuyển khoản ngân hàng</option>
                            </FormSelect>
                          </div>

                          {/* Right Column: Products (7/12) */}
                          <div className="lg:col-span-7 space-y-6">
                            <div className="flex items-center gap-2 text-blue-600 border-b border-slate-100 pb-2">
                              <ShoppingBag className="w-5 h-5" />
                              <h4 className="font-bold text-slate-900">Sản phẩm đã chọn</h4>
                            </div>
                            
                            {/* Search */}
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              </div>
                              <input 
                                type="text" 
                                className="w-full pl-10 pr-4 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow placeholder-slate-400 text-slate-900"
                                placeholder="Tìm kiếm sản phẩm theo tên..."
                                value={productSearchQuery}
                                onChange={(e) => setProductSearchQuery(e.target.value)}
                              />
                              {productSearchQuery && (
                                <div className="absolute z-10 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                  {products
                                    .filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()))
                                    .map(p => (
                                      <div 
                                        key={p.id} 
                                        className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-0"
                                        onClick={() => {
                                          const exists = selectedOrderProducts.find(item => item.id === p.id);
                                          if (!exists) {
                                            setSelectedOrderProducts([...selectedOrderProducts, {...p, quantity: 1}]);
                                          }
                                          setProductSearchQuery("");
                                        }}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100">
                                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-slate-900">{p.name}</p>
                                            <p className="text-xs text-blue-600 font-medium">{Number(p.price).toLocaleString('vi-VN')}đ</p>
                                          </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100">
                                          <Plus className="w-4 h-4" />
                                        </div>
                                      </div>
                                    ))}
                                  {products.filter(p => p.name.toLowerCase().includes(productSearchQuery.toLowerCase())).length === 0 && (
                                    <div className="p-4 text-center text-slate-500 text-sm">Không tìm thấy sản phẩm nào.</div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Selected Products List */}
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                              {selectedOrderProducts.map(item => (
                                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-100 p-3 rounded-xl shadow-xs hover:shadow-sm transition-shadow gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-100 shrink-0">
                                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-slate-900 truncate max-w-[200px] sm:max-w-[250px]">{item.name}</p>
                                      <p className="text-xs text-blue-600 font-medium">{Number(item.price).toLocaleString('vi-VN')}đ</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between sm:justify-end gap-4">
                                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                                      <button 
                                        onClick={() => {
                                          const newQty = Math.max(1, item.quantity - 1);
                                          setSelectedOrderProducts(selectedOrderProducts.map(i => i.id === item.id ? {...i, quantity: newQty} : i));
                                        }}
                                        className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600"
                                      >
                                        -
                                      </button>
                                      <span className="w-10 text-center text-sm font-medium text-slate-900">{item.quantity}</span>
                                      <button 
                                        onClick={() => {
                                          setSelectedOrderProducts(selectedOrderProducts.map(i => i.id === item.id ? {...i, quantity: item.quantity + 1} : i));
                                        }}
                                        className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600"
                                      >
                                        +
                                      </button>
                                    </div>
                                    <button 
                                      onClick={() => setSelectedOrderProducts(selectedOrderProducts.filter(i => i.id !== item.id))}
                                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {selectedOrderProducts.length === 0 && (
                                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                  <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                  <p className="text-sm text-slate-500">Chưa có sản phẩm nào được chọn.</p>
                                </div>
                              )}
                            </div>

                            {/* Total */}
                            <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-100">
                              <div>
                                <span className="text-sm text-slate-500">Tổng cộng:</span>
                                <span className="text-xs text-slate-400 block mt-0.5">Freeship toàn quốc</span>
                              </div>
                              <span className="text-2xl font-bold text-red-600">
                                {selectedOrderProducts.reduce((acc, item) => acc + item.price * item.quantity, 0).toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
                          <button 
                            type="button"
                            onClick={() => {
                              setShowOrderModal(false);
                              setSelectedOrderProducts([]);
                              setProductSearchQuery("");
                            }}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors"
                          >
                            Hủy
                          </button>
                          <button 
                            onClick={async () => {
                              if (!newOrder.customer_name || !newOrder.phone || !newOrder.address) {
                                toast.error("Vui lòng điền đầy đủ thông tin khách hàng!");
                                return;
                              }
                              if (selectedOrderProducts.length === 0) {
                                toast.error("Vui lòng chọn ít nhất 1 sản phẩm!");
                                return;
                              }
                              
                              const total_amount = selectedOrderProducts.reduce((acc, item) => acc + item.price * item.quantity, 0);

                              // Lưu danh sách sản phẩm theo đúng schema items khi xem chi tiết
                              const orderItems = selectedOrderProducts.map((item) => ({
                                id: item.id,
                                name: item.name,
                                price: Number(item.price) || 0,
                                quantity: Number(item.quantity) || 1,
                                image: item.image_url || item.image || (Array.isArray(item.images) ? item.images[0] : "") || "",
                              }));

                              // Sinh order_code dạng BT-<6 số> giống trang /thanh-toan
                              const order_code = `BT-${Math.floor(100000 + Math.random() * 900000)}`;

                              // Save order via API
                              const res = await fetch("/api/admin/orders", {
                                method: "POST",
                                credentials: "include",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  ...newOrder,
                                  totalAmount: total_amount,
                                  items: orderItems,
                                  orderCode: order_code,
                                }),
                              });

                              if (!res.ok) {
                                const d = await res.json().catch(() => ({}));
                                toast.error("Lỗi khi tạo đơn hàng: " + (d.error || res.statusText));
                              } else {
                                toast.success("Tạo đơn hàng thành công!");
                                setShowOrderModal(false);
                                setSelectedOrderProducts([]);
                                fetchOrders();
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors text-sm shadow-lg shadow-blue-200"
                          >
                            Tạo đơn hàng
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mobile Order Cards (block sm:hidden) */}
                  <div className="block sm:hidden space-y-4">
                    {orders
                      .filter(o => filterStatus === "Tất cả" || o.status === filterStatus)
                      .map((order) => {
                        const isUnread = order.status === 'Chờ xử lý' && !readOrderIds.has(order.id.toString());
                        const items = Array.isArray(order.items) ? order.items : [];
                        const productLabel = items.length > 0
                          ? items.map((i: any) => `${i.name} x${i.quantity}`).join(", ")
                          : "Đơn hàng";
                        const orderCode = order.order_code || `BT-${order.id.toString().slice(-5)}`;
                        return (
                          <div
                            key={order.id}
                            onClick={() => {
                              markOrderAsRead(order.id.toString());
                              setSelectedOrderDetail(order);
                            }}
                            className={`p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-shadow cursor-pointer space-y-3 relative ${
                              isUnread ? 'border-blue-200 bg-blue-50/5' : ''
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-blue-600 hover:underline flex items-center gap-1.5 text-sm">
                                {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block shrink-0 animate-pulse" />}
                                {orderCode}
                              </span>
                              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                order.status === 'Chờ xử lý' ? 'bg-amber-100 text-amber-700' :
                                order.status === 'Đã xác nhận' ? 'bg-indigo-100 text-indigo-700' :
                                order.status === 'Đang giao' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'Đã hoàn thành' ? 'bg-green-100 text-green-700' :
                                order.status === 'Đã huỷ' ? 'bg-rose-100 text-rose-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {order.status}
                              </span>
                            </div>

                            <div className="space-y-1 text-xs text-slate-600">
                              <div className="text-sm font-semibold text-slate-900">{order.customer_name} ({order.phone})</div>
                              <div className="text-slate-500 line-clamp-1"><strong className="text-slate-700">Địa chỉ:</strong> {order.address}</div>
                              <div className="text-slate-500 truncate"><strong className="text-slate-700">Sản phẩm:</strong> {productLabel}</div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <div className="text-xs text-slate-400">
                                Thanh toán: <span className="font-medium text-slate-600">{order.payment_method}</span>
                              </div>
                              <div className="text-sm font-bold text-slate-900">
                                {Number(order.total_amount).toLocaleString('vi-VN')}đ
                              </div>
                            </div>

                            {order.collaborator_code && (
                              <div className="text-xs text-slate-500">
                                CTV: <span className="font-medium text-blue-600">{order.collaborator_code}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">Hoa hồng:</span>
                              {order.commission_status === "earned" && (
                                <span className="text-green-600 font-semibold">
                                  +{Number(order.commission_amount || 0).toLocaleString("vi-VN")}đ
                                </span>
                              )}
                              {order.commission_status === "cancelled" && (
                                <span className="text-rose-500 line-through">
                                  {Number(order.commission_amount || 0).toLocaleString("vi-VN")}đ
                                </span>
                              )}
                              {(!order.commission_status || order.commission_status === "none" || order.commission_status === "pending") && (
                                <span className="text-slate-400">—</span>
                              )}
                            </div>

                            {/* Quick order actions & Delete */}
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-50" onClick={(e) => e.stopPropagation()}>
                              <div className="text-[10px] text-slate-400">
                                Hành động:
                              </div>
                              <div className="flex items-center gap-2">
                                {renderOrderStatusActions(order)}
                                <button
                                  type="button"
                                  onClick={() => deleteOrder(order)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Desktop Table (hidden sm:block) */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                      <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 font-medium">Mã đơn</th>
                          <th className="px-4 py-3 font-medium">Khách hàng</th>
                          <th className="px-4 py-3 font-medium">SĐT</th>
                          <th className="px-4 py-3 font-medium">Địa chỉ</th>
                          <th className="px-4 py-3 font-medium">Tổng tiền</th>
                          <th className="px-4 py-3 font-medium">Thanh toán</th>
                          <th className="px-4 py-3 font-medium">Trạng thái</th>
                          <th className="px-4 py-3 font-medium">Hoa hồng</th>
                          <th className="px-4 py-3 font-medium">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders
                          .filter(o => filterStatus === "Tất cả" || o.status === filterStatus)
                          .map((order) => {
                            const isUnread = order.status === 'Chờ xử lý' && !readOrderIds.has(order.id.toString());
                            return (
                              <tr 
                                key={order.id} 
                                onClick={() => {
                                  markOrderAsRead(order.id.toString());
                                  setSelectedOrderDetail(order);
                                }}
                                className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer ${
                                  isUnread ? 'bg-blue-50/10' : ''
                                }`}
                              >
                                <td className="px-4 py-4 font-bold text-blue-600 hover:underline align-middle">
                                  <div className="flex items-center gap-1.5">
                                    {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block shrink-0 animate-pulse" />}
                                    <span>{order.order_code || `BT-${order.id.toString().slice(-5)}`}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 font-semibold text-slate-900 align-middle">{order.customer_name}</td>
                                <td className="px-4 py-4 font-medium align-middle">{order.phone}</td>
                                <td className="px-4 py-4 max-w-[200px] truncate text-slate-500">{order.address}</td>
                                <td className="px-4 py-4 font-bold text-slate-900">
                                  {Number(order.total_amount).toLocaleString('vi-VN')}đ
                                </td>
                                <td className="px-4 py-4 text-xs font-semibold text-slate-600">{order.payment_method}</td>
                                <td className="px-4 py-4">
                                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                    order.status === 'Chờ xử lý' ? 'bg-amber-100 text-amber-700' :
                                    order.status === 'Đã xác nhận' ? 'bg-indigo-100 text-indigo-700' :
                                    order.status === 'Đang giao' ? 'bg-blue-100 text-blue-700' :
                                    order.status === 'Đã hoàn thành' ? 'bg-green-100 text-green-700' :
                                    order.status === 'Đã huỷ' ? 'bg-rose-100 text-rose-700' :
                                    'bg-slate-100 text-slate-700'
                                  }`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td className="px-4 py-4 text-right align-middle">
                                  {order.commission_status === "earned" && (
                                    <span className="text-green-600 font-semibold text-xs">
                                      +{Number(order.commission_amount || 0).toLocaleString("vi-VN")}đ
                                    </span>
                                  )}
                                  {order.commission_status === "cancelled" && (
                                    <span className="text-rose-500 line-through text-xs">
                                      {Number(order.commission_amount || 0).toLocaleString("vi-VN")}đ
                                    </span>
                                  )}
                                  {(!order.commission_status || order.commission_status === "none" || order.commission_status === "pending") && (
                                    <span className="text-slate-400 text-xs">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center gap-2">
                                    {renderOrderStatusActions(order)}
                                    <button
                                      type="button"
                                      onClick={() => deleteOrder(order)}
                                      title="Xoá đơn hàng"
                                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                    {orders.filter(o => filterStatus === "Tất cả" || o.status === filterStatus).length === 0 && (
                      <div className="text-center py-12 text-slate-500 text-sm">
                        Chưa có đơn hàng nào. Hãy bấm nút Tạo đơn hàng để bắt đầu!
                      </div>
                    )}
                  </div>
              )}

              {activeTab === 'products' && (
                (editingProduct || showProductModal) ? (
                  <ProductForm
                    product={editingProduct}
                    categories={categories}
                    onCancel={() => {
                      setEditingProduct(null);
                      setShowProductModal(false);
                    }}
                    onSaved={fetchProducts}
                  />
                ) : (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
                      <h2 className="font-bold text-slate-900 text-lg">Danh sách sản phẩm</h2>
                      <SearchInput
                        containerClassName="w-full sm:w-64"
                        leadingIcon={<Search className="w-4 h-4" />}
                        placeholder="Tìm sản phẩm..."
                        value={adminProductSearch}
                        onChange={(e) => setAdminProductSearch(e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={() => setShowProductModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-lg shadow-blue-200 whitespace-nowrap"
                    >
                      + Thêm sản phẩm
                    </button>
                  </div>


                  {/* Mobile Product Cards (block sm:hidden) */}
                  <div className="block sm:hidden space-y-3">
                    {products
                      .filter(p => p.name.toLowerCase().includes(adminProductSearch.toLowerCase()))
                      .map((product) => (
                        <div
                          key={product.id}
                          className="p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-shadow flex items-start gap-3"
                        >
                          {(product.slug || product.id) ? (
                            <a
                              href={`/san-pham/${product.slug || product.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Mở chi tiết sản phẩm trong tab mới"
                              className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-100 shrink-0 hover:ring-2 hover:ring-blue-500 transition-all"
                            >
                              <img 
                                src={product.image_url || "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=100"} 
                                alt={product.name}
                                className="object-cover w-full h-full"
                              />
                            </a>
                          ) : (
                            <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-100 shrink-0">
                              <img 
                                src={product.image_url || "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=100"} 
                                alt={product.name}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 space-y-1">
                            {(product.slug || product.id) ? (
                              <a
                                href={`/san-pham/${product.slug || product.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block font-semibold text-slate-900 text-xs sm:text-sm truncate hover:text-blue-600 transition-colors"
                                title="Mở chi tiết sản phẩm trong tab mới"
                              >
                                {product.name}
                              </a>
                            ) : (
                              <h4 className="font-semibold text-slate-900 text-xs sm:text-sm truncate">{product.name}</h4>
                            )}
                            <p className="text-xs text-blue-600 font-bold">{Number(product.price).toLocaleString('vi-VN')}đ</p>
                            {product.description && (
                              <p className="text-[10px] text-slate-400 line-clamp-1">
                                {product.description.replace(/<[^>]*>/g, '')}
                              </p>
                            )}
                            <div className="flex items-center justify-between pt-1">
                              <button
                                onClick={() => toggleProductVisibility(product.id, product.is_published !== false)}
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-all ${
                                  product.is_published !== false 
                                    ? 'bg-green-50 text-green-700 border border-green-200' 
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                                title="Thay đổi trạng thái Ẩn/Hiện"
                              >
                                {product.is_published !== false ? 'Hiển thị' : 'Ẩn'}
                              </button>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => setEditingProduct(product)}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                >
                                  <Pencil className="w-3 h-3" /> Sửa
                                </button>
                                <button
                                  onClick={() => deleteProduct(product.id)}
                                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                                >
                                  Xoá
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Desktop Table (hidden sm:block) */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                      <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 font-medium">Ảnh</th>
                          <th className="px-4 py-3 font-medium">Tên sản phẩm</th>
                          <th className="px-4 py-3 font-medium">Giá</th>
                          <th className="px-4 py-3 font-medium">Trạng thái</th>
                          <th className="px-4 py-3 font-medium">Mô tả</th>
                          <th className="px-4 py-3 font-medium">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products
                          .filter(p => p.name.toLowerCase().includes(adminProductSearch.toLowerCase()))
                          .map((product) => (
                          <tr key={product.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-4">
                              {(product.slug || product.id) ? (
                                <a
                                  href={`/san-pham/${product.slug || product.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Mở chi tiết sản phẩm trong tab mới"
                                  className="block relative w-12 h-12 rounded-lg overflow-hidden border border-slate-100 hover:ring-2 hover:ring-blue-500 transition-all"
                                >
                                  <img 
                                    src={product.image_url || "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=100"} 
                                    alt={product.name}
                                    className="object-cover w-full h-full"
                                  />
                                </a>
                              ) : (
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-100">
                                  <img 
                                    src={product.image_url || "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=100"} 
                                    alt={product.name}
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4 font-medium text-slate-900">
                              {(product.slug || product.id) ? (
                                <a
                                  href={`/san-pham/${product.slug || product.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-blue-600 transition-colors"
                                  title="Mở chi tiết sản phẩm trong tab mới"
                                >
                                  {product.name}
                                </a>
                              ) : (
                                product.name
                              )}
                            </td>
                            <td className="px-4 py-4 font-medium text-slate-900">
                              {Number(product.price).toLocaleString('vi-VN')}đ
                            </td>
                            <td className="px-4 py-4">
                              <button
                                onClick={() => toggleProductVisibility(product.id, product.is_published !== false)}
                                className={`text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer hover:opacity-80 transition-all ${
                                  product.is_published !== false 
                                    ? 'bg-green-50 text-green-700 border border-green-200' 
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                                title="Bấm để Thay đổi trạng thái Ẩn/Hiện"
                              >
                                {product.is_published !== false ? 'Hiển thị' : 'Ẩn'}
                              </button>
                            </td>
                            <td className="px-4 py-4 text-slate-500 max-w-[300px] truncate">
                              {product.description ? product.description.replace(/<[^>]*>/g, '') : ""}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setEditingProduct(product)}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                >
                                  <Pencil className="w-3 h-3" /> Sửa
                                </button>
                                <button
                                  onClick={() => deleteProduct(product.id)}
                                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                                >
                                  Xoá
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                    {products.length === 0 && (
                      <div className="text-center py-12 text-slate-500 text-sm">
                        Chưa có sản phẩm nào. Hãy bấm nút Tạo sản phẩm mẫu để test!
                      </div>
                    )}
                  </div>
                )
              )}

              {activeTab === 'categories' && (
                <div className="space-y-6">
                  {/* Header với nút Thêm */}
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900">Quản lý danh mục</h2>
                    <button 
                      onClick={() => setShowCategoryModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm shadow-lg shadow-blue-200 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm danh mục
                    </button>
                  </div>

                  {/* Modal Thêm danh mục */}
                  {showCategoryModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                          <h3 className="font-semibold text-lg text-slate-900">Thêm danh mục mới</h3>
                          <button 
                            onClick={() => setShowCategoryModal(false)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                        <form onSubmit={async (e) => {
                          await handleAddCategory(e);
                          setShowCategoryModal(false);
                        }} className="p-6 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormInput
                              label="Tên danh mục"
                              required
                              type="text"
                              placeholder="Ví dụ: Tủ nhựa Ecoplast"
                              value={newCategory.name}
                              onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                            />
                            <FormInput
                              label="Slug (Link)"
                              required
                              type="text"
                              placeholder="Ví dụ: tu-nhua-ecoplast"
                              value={newCategory.slug}
                              onChange={(e) => setNewCategory({...newCategory, slug: e.target.value})}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Ảnh đại diện</label>
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-50 h-[150px] flex flex-col items-center justify-center relative">
                              <input 
                                type="file" 
                                accept="image/*"
                                className="hidden" 
                                id="category-file-upload-modal"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setCategoryFile(file);
                                    setCategoryImagePreview(URL.createObjectURL(file));
                                  }
                                }}
                              />
                              <label htmlFor="category-file-upload-modal" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                                {categoryImagePreview ? (
                                  <div className="w-full h-full relative">
                                    <img src={categoryImagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                                      <span className="text-sm text-white">Đổi ảnh</span>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <svg className="w-10 h-10 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    <span className="text-sm text-slate-600 font-medium">Click để chọn ảnh</span>
                                  </>
                                )}
                              </label>
                            </div>
                          </div>

                          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button 
                              type="button"
                              onClick={() => setShowCategoryModal(false)}
                              className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors"
                            >
                              Hủy
                            </button>
                            <button 
                              type="submit" 
                              disabled={isSaving}
                              className={`${isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'} text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm shadow-lg shadow-blue-200 flex items-center gap-2`}
                            >
                              {isSaving && (
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              )}
                              {isSaving ? 'Đang lưu...' : 'Thêm danh mục'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Bảng danh sách danh mục */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100">
                      <h3 className="font-semibold text-slate-900">Tất cả danh mục</h3>
                    </div>
                    {/* Mobile Category Cards (block sm:hidden) */}
                    <div className="block sm:hidden p-4 space-y-3">
                      {categories.map((cat) => (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100 rounded-xl hover:shadow-sm transition-shadow gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-100 shrink-0">
                              <img 
                                src={cat.image_url || "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=100"} 
                                alt={cat.name}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 text-xs sm:text-sm">{cat.name}</h4>
                              <p className="text-[10px] text-slate-500">{cat.slug}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteCategory(cat.id)}
                            className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Xoá
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table (hidden sm:block) */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-3 font-medium">Ảnh</th>
                            <th className="px-4 py-3 font-medium">Tên danh mục</th>
                            <th className="px-4 py-3 font-medium">Slug</th>
                            <th className="px-4 py-3 font-medium">Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categories.map((cat) => (
                            <tr key={cat.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-4">
                                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-100">
                                  <img 
                                    src={cat.image_url || "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=100"} 
                                    alt={cat.name}
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-4 font-medium text-slate-900">{cat.name}</td>
                              <td className="px-4 py-4 text-slate-500">{cat.slug}</td>
                              <td className="px-4 py-4">
                                <button
                                  onClick={() => deleteCategory(cat.id)}
                                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                                >
                                  Xoá
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                      {categories.length === 0 && (
                        <div className="text-center py-8 text-slate-500 text-sm">
                          Chưa có danh mục nào.
                        </div>
                      )}
                    </div>
                  </div>
              )}

              {activeTab === 'customers' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <h2 className="font-bold text-slate-900 text-lg">Khách hàng</h2>
                    <div className="text-sm text-slate-500">
                      Tổng số: <span className="font-bold text-slate-900">{derivedCustomers.length}</span> khách hàng
                    </div>
                  </div>

                  {/* Mobile Customer Cards (block sm:hidden) */}
                  <div className="block sm:hidden space-y-4">
                    {derivedCustomers.map((customer, index) => (
                      <div
                        key={index}
                        className="p-4 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-shadow space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-slate-900 text-sm">{customer.name}</h4>
                            <p className="text-xs text-slate-500">{customer.phone}</p>
                          </div>
                          <span className="text-xs font-bold text-slate-955 bg-slate-50 px-2.5 py-1 rounded-lg">
                            {customer.totalOrders} đơn hàng
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 line-clamp-2">
                          <strong className="text-slate-700">Địa chỉ:</strong> {customer.address}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                          <div className="text-xs text-slate-400">
                            Mua lần cuối: <span className="font-medium text-slate-600">{new Date(customer.lastOrderDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <div className="text-sm font-bold text-blue-600">
                            {customer.totalSpent.toLocaleString('vi-VN')}đ
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table (hidden sm:block) */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                      <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 font-medium">Khách hàng</th>
                          <th className="px-4 py-3 font-medium">SĐT</th>
                          <th className="px-4 py-3 font-medium">Địa chỉ</th>
                          <th className="px-4 py-3 font-medium text-center">Số đơn hàng</th>
                          <th className="px-4 py-3 font-medium">Tổng chi tiêu</th>
                          <th className="px-4 py-3 font-medium">Mua lần cuối</th>
                        </tr>
                      </thead>
                      <tbody>
                        {derivedCustomers.map((customer, index) => (
                          <tr key={index} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-4 font-medium text-slate-900">{customer.name}</td>
                            <td className="px-4 py-4">{customer.phone}</td>
                            <td className="px-4 py-4 max-w-[200px] truncate">{customer.address}</td>
                            <td className="px-4 py-4 text-center">{customer.totalOrders}</td>
                            <td className="px-4 py-4 font-medium text-slate-900">
                              {customer.totalSpent.toLocaleString('vi-VN')}đ
                            </td>
                            <td className="px-4 py-4 text-xs text-slate-500">
                              {new Date(customer.lastOrderDate).toLocaleDateString('vi-VN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {derivedCustomers.length === 0 && (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      Chưa có dữ liệu khách hàng.
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'comments' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <h2 className="font-bold text-slate-900 text-lg">Quản lý bình luận</h2>
                    <div className="text-sm text-slate-500">
                      Hiển thị bình luận từ khách hàng và trả lời.
                    </div>
                  </div>

                  <div className="space-y-6">
                    {comments.map((comment, idx) => (
                      <div key={comment.id || idx} className="p-4 border border-slate-100 rounded-xl hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-bold text-slate-900">{comment.user_name || "Người dùng giấu tên"}</span>
                            <span className="text-xs text-slate-500 ml-2">
                              {comment.created_at ? new Date(comment.created_at).toLocaleDateString('vi-VN') : ''}
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${comment.reply ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                            {comment.reply ? 'Đã trả lời' : 'Chưa trả lời'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          Sản phẩm: <span className="font-medium text-blue-600">{comment.products?.name || "Sản phẩm"}</span>
                        </p>
                        <p className="text-sm text-slate-700 mb-4">{comment.content}</p>
                        
                        {/* Thread replies */}
                        {(() => {
                          const replies = parseReplies(comment.reply);
                          return replies.length > 0 ? (
                            <div className="space-y-2 mb-3">
                              {replies.map((r, i) => (
                                <div key={i} className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg text-sm">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-blue-700 text-xs">Tủ Nhựa Giá Rẻ</span>
                                    <span className="text-xs text-slate-400">
                                      {r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : ''}
                                    </span>
                                  </div>
                                  <p className="text-slate-700">{r.content}</p>
                                </div>
                              ))}
                            </div>
                          ) : null;
                        })()}

                        {/* New reply input */}
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Thêm tin nhắn trả lời..."
                            className="flex-1 text-sm text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                            value={replyTexts[comment.id] || ""}
                            onChange={(e) => setReplyTexts(prev => ({...prev, [comment.id]: e.target.value}))}
                            onKeyDown={(e) => { if (e.key === 'Enter') submitReply(comment.id); }}
                            disabled={submittingReplyIds.has(comment.id)}
                          />
                          <button 
                            onClick={() => submitReply(comment.id)}
                            disabled={submittingReplyIds.has(comment.id) || !replyTexts[comment.id]?.trim()}
                            className={`text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                              submittingReplyIds.has(comment.id) ? 'bg-blue-400 cursor-not-allowed' :
                              !replyTexts[comment.id]?.trim() ? 'bg-slate-300 cursor-not-allowed' :
                              'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                            }`}
                          >
                            {submittingReplyIds.has(comment.id) ? 'Đang gửi...' : 'Gửi'}
                          </button>
                        </div>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        Chưa có bình luận nào.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="font-bold text-slate-900 text-lg">Đánh giá sản phẩm (có sao)</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Hiển thị ở trang chi tiết sản phẩm</p>
                    </div>
                    <button
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-lg shadow-blue-200"
                    >
                      {showReviewForm ? "Huỷ" : "+ Thêm đánh giá"}
                    </button>
                  </div>

                  {showReviewForm && (
                    <form onSubmit={handleSaveReview} className="bg-slate-50 p-5 rounded-xl mb-6 border border-slate-200 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormSelect
                          label="Sản phẩm"
                          required
                          value={reviewForm.product_id}
                          onChange={(e) => setReviewForm({ ...reviewForm, product_id: e.target.value })}
                        >
                          <option value="">-- Chọn sản phẩm --</option>
                          {products.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </FormSelect>
                        <FormInput
                          label="Tên khách hàng"
                          type="text"
                          value={reviewForm.user_name}
                          onChange={(e) => setReviewForm({ ...reviewForm, user_name: e.target.value })}
                          placeholder="Để trống = Khách hàng ẩn danh"
                        />
                        <FormInput
                          label="Số sao (1–5)"
                          required
                          type="number"
                          min={1}
                          max={5}
                          value={reviewForm.rating}
                          onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                        />
                        <FormInput
                          label="Phân loại (vd: Vân Gỗ Sồi)"
                          type="text"
                          value={reviewForm.variant_label}
                          onChange={(e) => setReviewForm({ ...reviewForm, variant_label: e.target.value })}
                        />
                      </div>
                      <FormTextarea
                        label="Nội dung đánh giá"
                        required
                        rows={3}
                        value={reviewForm.content}
                        onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                      />
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={resetReviewForm} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100">Huỷ</button>
                        <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Lưu đánh giá</button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-3">
                    {productReviews.map((rv: any) => (
                      <div key={rv.id} className="border border-slate-100 rounded-xl p-4 flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex text-amber-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-3 h-3 fill-current ${i < rv.rating ? "" : "text-slate-200"}`} />
                              ))}
                            </div>
                            <span className="font-semibold text-slate-900 text-sm">{rv.user_name || "Khách ẩn danh"}</span>
                            {rv.products?.name && (
                              <span className="text-xs text-slate-400">· {rv.products.name}</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">{rv.content}</p>
                          <p className="text-xs text-slate-400 mt-1">{new Date(rv.created_at).toLocaleString('vi-VN')}</p>
                        </div>
                        <button onClick={() => deleteReview(rv.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {productReviews.length === 0 && (
                      <div className="text-center py-8 text-slate-500 text-sm">Chưa có đánh giá nào.</div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'testimonials' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="font-bold text-slate-900 text-lg">Testimonial trang chủ</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Hiển thị 3 testimonial đầu tiên ở trang chủ</p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveTestimonial} className="bg-slate-50 p-5 rounded-xl mb-6 border border-slate-200 space-y-4">
                    <h3 className="font-semibold text-slate-800">{editingTestimonial ? "Chỉnh sửa testimonial" : "Thêm testimonial mới"}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="Tên khách hàng"
                        required
                        type="text"
                        value={testimonialForm.customer_name}
                        onChange={(e) => setTestimonialForm({ ...testimonialForm, customer_name: e.target.value })}
                        placeholder="Anh Hoàng"
                      />
                      <FormInput
                        label="Avatar chữ (1 ký tự)"
                        type="text"
                        maxLength={1}
                        value={testimonialForm.initial}
                        onChange={(e) => setTestimonialForm({ ...testimonialForm, initial: e.target.value.toUpperCase() })}
                        placeholder="H (tự lấy chữ đầu nếu để trống)"
                      />
                      <FormInput
                        label="Nhãn sản phẩm"
                        type="text"
                        value={testimonialForm.product_label}
                        onChange={(e) => setTestimonialForm({ ...testimonialForm, product_label: e.target.value })}
                        placeholder="Mua Tủ quần áo Ecoplast"
                      />
                      <FormInput
                        label="Số sao (1–5)"
                        type="number"
                        min={1}
                        max={5}
                        value={testimonialForm.rating}
                        onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: Number(e.target.value) })}
                      />
                      <FormInput
                        label="Thứ tự hiển thị"
                        type="number"
                        value={testimonialForm.display_order}
                        onChange={(e) => setTestimonialForm({ ...testimonialForm, display_order: Number(e.target.value) })}
                      />
                      <div className="flex items-end">
                        <FormCheckbox
                          label="Hiển thị công khai"
                          checked={testimonialForm.is_published}
                          onChange={(e) => setTestimonialForm({ ...testimonialForm, is_published: e.target.checked })}
                        />
                      </div>
                    </div>
                    <FormTextarea
                      label="Nội dung"
                      required
                      rows={3}
                      value={testimonialForm.content}
                      onChange={(e) => setTestimonialForm({ ...testimonialForm, content: e.target.value })}
                    />
                    <div className="flex justify-end gap-2">
                      {editingTestimonial && (
                        <button type="button" onClick={resetTestimonialForm} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100">Huỷ</button>
                      )}
                      <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        {editingTestimonial ? "Cập nhật" : "Thêm mới"}
                      </button>
                    </div>
                  </form>

                  <div className="space-y-3">
                    {testimonials.map((t: any) => (
                      <div key={t.id} className="border border-slate-100 rounded-xl p-4 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700 shrink-0">
                            {t.initial || (t.customer_name?.charAt(0).toUpperCase() || "?")}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-slate-900 text-sm">{t.customer_name}</span>
                              <div className="flex text-amber-400">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 fill-current ${i < t.rating ? "" : "text-slate-200"}`} />
                                ))}
                              </div>
                              {!t.is_published && (
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Ẩn</span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 italic">&ldquo;{t.content}&rdquo;</p>
                            {t.product_label && (
                              <p className="text-xs text-slate-400 mt-1">{t.product_label}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => editTestimonial(t)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteTestimonial(t.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {testimonials.length === 0 && (
                      <div className="text-center py-8 text-slate-500 text-sm">Chưa có testimonial nào.</div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'homepage' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="mb-6">
                    <h2 className="font-bold text-slate-900 text-lg">Cấu hình ưu điểm trang chủ</h2>
                    <p className="text-xs text-slate-500 mt-0.5">3 thẻ &ldquo;Ưu điểm nội thất&rdquo; ở trang chủ</p>
                  </div>

                  <form onSubmit={handleSaveFeature} className="bg-slate-50 p-5 rounded-xl mb-6 border border-slate-200 space-y-4">
                    <h3 className="font-semibold text-slate-800">{editingFeature ? "Chỉnh sửa ưu điểm" : "Thêm ưu điểm mới"}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="Tiêu đề"
                        required
                        type="text"
                        value={featureForm.title}
                        onChange={(e) => setFeatureForm({ ...featureForm, title: e.target.value })}
                        placeholder="Chống nước 100%"
                      />
                      <FormSelect
                        label="Icon"
                        value={featureForm.icon}
                        onChange={(e) => setFeatureForm({ ...featureForm, icon: e.target.value })}
                      >
                        <option value="droplets">droplets - Giọt nước</option>
                        <option value="bug-off">bug-off - Diệt côn trùng</option>
                        <option value="shield-check">shield-check - Khiên</option>
                        <option value="sparkles">sparkles - Lấp lánh</option>
                        <option value="wind">wind - Gió</option>
                        <option value="leaf">leaf - Lá</option>
                        <option value="award">award - Giải thưởng</option>
                        <option value="heart">heart - Tim</option>
                        <option value="truck">truck - Xe tải</option>
                        <option value="hard-hat">hard-hat - Mũ bảo hộ</option>
                      </FormSelect>
                      <FormSelect
                        label="Màu chủ đạo"
                        value={featureForm.color_theme}
                        onChange={(e) => setFeatureForm({ ...featureForm, color_theme: e.target.value })}
                      >
                        <option value="blue">Xanh dương</option>
                        <option value="orange">Cam</option>
                        <option value="green">Xanh lá</option>
                        <option value="red">Đỏ</option>
                        <option value="amber">Vàng</option>
                        <option value="purple">Tím</option>
                      </FormSelect>
                      <FormInput
                        label="Thứ tự hiển thị"
                        type="number"
                        value={featureForm.display_order}
                        onChange={(e) => setFeatureForm({ ...featureForm, display_order: Number(e.target.value) })}
                      />
                      <div className="md:col-span-2 flex items-end">
                        <FormCheckbox
                          label="Hiển thị công khai"
                          checked={featureForm.is_published}
                          onChange={(e) => setFeatureForm({ ...featureForm, is_published: e.target.checked })}
                        />
                      </div>
                    </div>
                    <FormTextarea
                      label="Mô tả"
                      required
                      rows={3}
                      value={featureForm.description}
                      onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
                    />
                    <div className="flex justify-end gap-2">
                      {editingFeature && (
                        <button type="button" onClick={resetFeatureForm} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100">Huỷ</button>
                      )}
                      <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        {editingFeature ? "Cập nhật" : "Thêm mới"}
                      </button>
                    </div>
                  </form>

                  <div className="space-y-3">
                    {homepageFeatures.map((f: any) => (
                      <div key={f.id} className="border border-slate-100 rounded-xl p-4 flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-900 text-sm">{f.title}</span>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{f.icon}</span>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{f.color_theme}</span>
                            {!f.is_published && <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">Ẩn</span>}
                          </div>
                          <p className="text-sm text-slate-600">{f.description}</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => editFeature(f)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteFeature(f.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {homepageFeatures.length === 0 && (
                      <div className="text-center py-8 text-slate-500 text-sm">Chưa có ưu điểm nào.</div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                    <h2 className="font-bold text-slate-900 text-lg">Cài đặt hệ thống</h2>
                    <div className="text-sm text-slate-500">
                      Cấu hình thông tin liên hệ của cửa hàng.
                    </div>
                  </div>

                  {settingsLoading ? (
                    <div className="text-center py-8 text-slate-400">Đang tải cài đặt...</div>
                  ) : (
                    <div className="space-y-6 max-w-2xl">
                      <FormInput
                        label="Số điện thoại"
                        type="text"
                        placeholder="Ví dụ: 0123456789"
                        defaultValue={storeSettings.phone}
                        onChange={(e) => setLocalSettings(prev => ({...prev, phone: e.target.value}))}
                        key={`phone-${storeSettings.phone}`}
                      />

                      <FormInput
                        label="Số Zalo"
                        type="text"
                        placeholder="Ví dụ: 0123456789"
                        defaultValue={storeSettings.zalo}
                        onChange={(e) => setLocalSettings(prev => ({...prev, zalo: e.target.value}))}
                        key={`zalo-${storeSettings.zalo}`}
                      />

                      <FormInput
                        label="Link Facebook"
                        type="text"
                        placeholder="Ví dụ: https://facebook.com/trangcuaban"
                        defaultValue={storeSettings.facebook}
                        onChange={(e) => setLocalSettings(prev => ({...prev, facebook: e.target.value}))}
                        key={`facebook-${storeSettings.facebook}`}
                      />

                      <FormTextarea
                        label="Địa chỉ cửa hàng"
                        rows={3}
                        placeholder="Ví dụ: 123 Đường ABC, Phường XYZ, Quận 1, TP.HCM"
                        defaultValue={storeSettings.address}
                        onChange={(e) => setLocalSettings(prev => ({...prev, address: e.target.value}))}
                        key={`address-${storeSettings.address}`}
                      />

                      <div className="pt-4 border-t border-slate-100">
                        <FormInput
                          label="Hoa hồng CTV mặc định (%)"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          defaultValue={storeSettings.defaultCommissionPercent}
                          onChange={(e) => setLocalSettings(prev => ({...prev, defaultCommissionPercent: Number(e.target.value)}))}
                          key={`commission-${storeSettings.defaultCommissionPercent}`}
                        />
                        <p className="text-xs text-slate-500 mt-1">Áp dụng cho sản phẩm không có hoa hồng riêng.</p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button 
                          disabled={settingsSaving}
                          onClick={async () => {
                            setSettingsSaving(true);
                            const merged = {
                              phone: localSettings.phone || storeSettings.phone,
                              zalo: localSettings.zalo || storeSettings.zalo,
                              facebook: localSettings.facebook || storeSettings.facebook,
                              address: localSettings.address || storeSettings.address,
                              defaultCommissionPercent: localSettings.defaultCommissionPercent ?? storeSettings.defaultCommissionPercent,
                            };
                            await updateSettings(merged);
                            setSettingsSaving(false);
                            toast.success("Đã lưu cài đặt vào database!");
                          }}
                          className={`font-medium px-6 py-2.5 rounded-lg transition-colors text-sm shadow-lg cursor-pointer ${
                            settingsSaving ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                          }`}
                        >
                          {settingsSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'account' && (
                <div className="space-y-6 max-w-3xl">
                  {/* HEADER CARD */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                      <div className="relative shrink-0">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold border-4 border-white shadow-lg">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{user ? getInitial(displayName, user.email || "") : "A"}</span>
                          )}
                        </div>
                        <button
                          onClick={handlePickAvatar}
                          disabled={avatarUploading}
                          className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white flex items-center justify-center shadow-lg transition-colors cursor-pointer"
                          aria-label="Đổi avatar"
                          type="button"
                        >
                          {avatarUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Camera className="w-4 h-4" />
                          )}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                          {displayName || "Administrator"}
                        </h2>
                        <p className="text-sm text-slate-500 truncate">{user?.email || "admin@noithatgiavuong.com"}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handlePickAvatar}
                            disabled={avatarUploading}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" /> Đổi ảnh
                          </button>
                          {avatarUrl && (
                            <button
                              type="button"
                              onClick={handleRemoveAvatar}
                              disabled={avatarUploading}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-600 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Xoá avatar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DISPLAY NAME */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-slate-900 text-base">Thông tin hiển thị</h3>
                    </div>
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div>
                        <FormInput
                          label="Tên hiển thị"
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Nguyễn Văn A"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Tên này hiển thị ở góc trang quản trị và khi phản hồi bình luận.
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={user?.email || ""}
                          disabled
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={profileSaving}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold transition-colors cursor-pointer"
                        >
                          {profileSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Lưu thay đổi
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* CHANGE PASSWORD */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-4">
                      <ShieldCheck className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-slate-900 text-base">Đổi mật khẩu</h3>
                    </div>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <FormInput
                        label="Mật khẩu mới"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        leadingIcon={<Lock className="w-5 h-5" />}
                      />
                      <FormInput
                        label="Xác nhận mật khẩu mới"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu"
                        leadingIcon={<Lock className="w-5 h-5" />}
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={passwordSaving || !newPassword || !confirmPassword}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold transition-colors cursor-pointer"
                        >
                          {passwordSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-4 h-4" />
                          )}
                          Cập nhật mật khẩu
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'collaborators' && (
                <CollaboratorsTab />
              )}

              {activeTab !== 'dashboard' && activeTab !== 'orders' && activeTab !== 'products' && activeTab !== 'categories' && activeTab !== 'customers' && activeTab !== 'comments' && activeTab !== 'settings' && activeTab !== 'reviews' && activeTab !== 'testimonials' && activeTab !== 'homepage' && activeTab !== 'account' && activeTab !== 'collaborators' && (
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Box className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Tính năng đang phát triển</h2>
                  <p className="text-slate-500 text-sm max-w-md mx-auto">
                    Mục <span className="font-bold text-blue-600">{activeTab}</span> đang được hoàn thiện. Vui lòng quay lại sau!
                  </p>
                </div>
              )}
            </main>
          </div>
        </>
      )}
    </div>
  );
}
