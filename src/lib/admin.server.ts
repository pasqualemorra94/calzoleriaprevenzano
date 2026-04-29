/**
 * Admin Service — backward-compatible barrel re-export
 *
 * The actual implementation lives in `src/lib/admin/`.
 * This file re-exports everything for backward compatibility.
 */

export { getDashboardStats } from "./admin/admin-dashboard.server";
export {
  getAdminProducts,
  getAdminProduct,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminRestoreProduct,
  adminDuplicateProduct,
} from "./admin/admin-products.server";
export {
  getAdminOrders,
  getAdminOrder,
  adminUpdateOrderStatus,
  softDeleteOrders,
  restoreOrders,
  hardDeleteOrders,
} from "./admin/admin-orders.server";
export {
  getAdminCategories,
  adminGetCategory,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
} from "./admin/admin-categories.server";

export type {
  DashboardStats,
  AdminProductListItem,
  AdminProductDetail,
  AdminOrderListItem,
  AdminOrderDetail,
  AdminCategoryItem,
} from "./admin/types";
