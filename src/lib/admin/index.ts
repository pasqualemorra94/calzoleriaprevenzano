export { getDashboardStats } from "./admin-dashboard.server";
export {
  getAdminProducts,
  getAdminProduct,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminRestoreProduct,
} from "./admin-products.server";
export {
  getAdminOrders,
  getAdminOrder,
  adminUpdateOrderStatus,
} from "./admin-orders.server";
export {
  getAdminCategories,
  adminGetCategory,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from "./admin-categories.server";

export type {
  DashboardStats,
  AdminProductListItem,
  AdminProductDetail,
  AdminOrderListItem,
  AdminOrderDetail,
  AdminCategoryItem,
  PaginatedData,
  VariantPayload,
  ImagePayload,
  ProductWithRelationsInput,
} from "./types";
