import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tất cả sản phẩm | Tủ Nhựa Giá Rẻ",
  description: "Khám phá tất cả các sản phẩm tủ quần áo, giường ngủ, tủ bếp nhựa Đài Loan, Ecoplast và nhôm kính cao cấp với giá tốt nhất.",
  openGraph: {
    title: "Tất cả sản phẩm | Tủ Nhựa Giá Rẻ",
    description: "Khám phá tất cả các sản phẩm tủ quần áo, giường ngủ, tủ bếp nhựa Đài Loan, Ecoplast và nhôm kính cao cấp với giá tốt nhất.",
    url: "https://noithatgiare.shop/san-pham",
    type: "website",
  },
};

export default function SanPhamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
