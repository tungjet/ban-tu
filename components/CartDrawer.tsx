"use client";

import { useCartStore } from "@/store/useCartStore";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export function CartDrawer() {
  const { isOpen, toggleCart, items, updateQuantity, removeItem } = useCartStore();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration errors
  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  const totalAmount = items.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-100 transition-opacity"
          onClick={() => toggleCart(false)}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-110 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-900">Giỏ hàng</h2>
              <p className="text-xs text-slate-500">{items.length} sản phẩm</p>
            </div>
          </div>
          <button 
            onClick={() => toggleCart(false)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-4">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                <ShoppingBag className="w-10 h-10 text-slate-300" />
              </div>
              <p className="font-medium text-slate-700">Giỏ hàng của bạn đang trống</p>
              <p className="text-sm">Hãy thêm vài sản phẩm nhé!</p>
              <Link 
                href="/san-pham"
                onClick={() => toggleCart(false)}
                className="mt-4 px-6 py-2.5 bg-white border border-slate-200 text-blue-600 font-medium rounded-full shadow-sm hover:bg-slate-50 transition-colors inline-block"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white p-3 rounded-2xl flex gap-3 sm:gap-4 shadow-sm border border-slate-100 relative group">
                  {/* Image */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-xl overflow-hidden relative shrink-0">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <h3 className="text-sm font-medium text-slate-900 line-clamp-2 pr-6">{item.name}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-blue-600 font-bold text-sm">{item.price.toLocaleString('vi-VN')}đ</span>
                      {item.oldPrice && (
                        <span className="text-slate-400 text-xs line-through">{item.oldPrice.toLocaleString('vi-VN')}đ</span>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="mt-auto pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-100">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-white rounded shadow-sm transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium text-slate-700 w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-white rounded shadow-sm transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 sm:p-6 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500">Tổng cộng:</span>
              <span className="text-xl font-bold text-slate-900">{totalAmount.toLocaleString('vi-VN')}đ</span>
            </div>
            <Link 
              href="/thanh-toan"
              onClick={() => toggleCart(false)}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              Tiến hành thanh toán
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
