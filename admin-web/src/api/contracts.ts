export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  traceId?: string;
}

export interface PageQuery {
  page: number;
  pageSize: number;
  keyword?: string;
  school?: string;
  status?: string;
}

export interface PageResult<T> {
  list: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface BatchIdsPayload {
  ids: number[];
}

export interface BatchStatusPayload extends BatchIdsPayload {
  status: string;
}

export interface SchoolContentItem {
  id: number;
  school: string;
  userCount: number;
  postCount: number;
  storeCount: number;
  orderCount: number;
  gmv: number;
  verifyPassRate: string;
  status: string;
}

export interface SchoolContentQuery extends PageQuery {}

export interface SchoolContentPayload {
  school: string;
  userCount: number;
  postCount: number;
  storeCount: number;
  orderCount: number;
  gmv: number;
  verifyPassRate: string;
  status: string;
}

export interface AdminSchoolItem {
  id: number;
  school: string;
  name: string;
  province: string;
  city: string;
  userCount: number;
  postCount: number;
  storeCount: number;
  orderCount: number;
  gmv: number;
  verifyPassRate: string;
  status: string;
  sort: number;
  createdAt: string;
}

export interface AdminSchoolQuery extends PageQuery {}

export interface AdminSchoolSummary {
  total: number;
  enabledCount: number;
  totalUsers: number;
  totalStores: number;
}

export interface AdminSchoolListResult extends PageResult<AdminSchoolItem> {
  summary: AdminSchoolSummary;
}

export interface UserPublishItem {
  id: number;
  school: string;
  user: string;
  type: string;
  title: string;
  status: string;
  createdAt: string;
}

export interface UserPublishQuery extends PageQuery {
  type?: string;
}

export interface UserPublishPayload {
  school: string;
  user: string;
  type: string;
  title: string;
  status: string;
}

export interface AdminUserItem {
  id: number;
  nickname: string;
  phone: string;
  school: string;
  verified: string;
  status: string;
  postCount: number;
  orderCount: number;
  publishCount: number;
  registerTime: string;
  verifiedAt: string;
}

export interface AdminUserQuery extends PageQuery {
  verified?: string;
}

export interface AdminUserSummary {
  total: number;
  verifiedCount: number;
  normalCount: number;
  schoolOptions: string[];
}

export interface AdminUserListResult extends PageResult<AdminUserItem> {
  summary: AdminUserSummary;
}

export interface DashboardCardItem {
  key: string;
  label: string;
  value: string | number;
  remark: string;
}

export interface DashboardTodoItem {
  key: string;
  label: string;
  count: number;
  path: string;
}

export interface DashboardRankingItem {
  school: string;
  userCount: number;
  postCount: number;
  storeCount: number;
  orderCount: number;
  gmv: number;
  verifyPassRate: string;
  status: string;
}

export interface DashboardOverviewResult {
  cards: DashboardCardItem[];
  todos: DashboardTodoItem[];
  rankings: DashboardRankingItem[];
}

export interface AdminManagerItem {
  id: number;
  name: string;
  account: string;
  roleId: number;
  role: string;
  roleCode: string;
  scopeType: "all" | "assigned";
  schools: string[];
  school: string;
  status: string;
  lastLoginTime: string;
}

export interface AdminManagerQuery extends PageQuery {
  role?: string;
}

export interface AdminManagerSummary {
  total: number;
  enabledCount: number;
  roleCount: number;
  roleOptions: string[];
}

export interface AdminManagerListResult extends PageResult<AdminManagerItem> {
  summary: AdminManagerSummary;
}

export interface AdminManagerCreatePayload {
  account: string;
  password: string;
  name: string;
  roleId: number;
  schools: string[];
  status: "启用" | "停用";
}

export interface AdminManagerUpdatePayload {
  account: string;
  password?: string;
  name: string;
  roleId: number;
  schools: string[];
}

export interface AdminRoleItem {
  id: number;
  name: string;
  code: string;
  permissions: string;
  permissionsList: string[];
  userCount: number;
  status: string;
  scopeType: string;
  scopeTypeValue: "all" | "assigned";
  menuCount: number;
  menuPaths: string[];
}

export interface AdminRoleQuery extends PageQuery {}

export interface AdminRoleSummary {
  total: number;
  enabledCount: number;
  userCount: number;
}

export interface AdminRoleListResult extends PageResult<AdminRoleItem> {
  summary: AdminRoleSummary;
}

export interface AdminRolePayload {
  code: string;
  name: string;
  scopeType: "all" | "assigned";
  status: "启用" | "停用";
}

export interface RolePermissionPayload {
  menuPaths: string[];
  permissionsList: string[];
}

export interface RoleOptionItem {
  id: number;
  name: string;
  code: string;
  scopeType: "all" | "assigned";
  status: "启用" | "停用";
}

export interface MenuTreeNode {
  key: string;
  title: string;
  path?: string;
  children?: MenuTreeNode[];
}

export interface PermissionOptionItem {
  code: string;
  title: string;
}

export interface PermissionGroup {
  key: string;
  title: string;
  permissions: PermissionOptionItem[];
}

export interface AuthManageMeta {
  currentRoleId: number;
  currentRoleCode: string;
  currentRoleName: string;
  schoolOptions: string[];
  roleOptions: RoleOptionItem[];
  menuTree: MenuTreeNode[];
  permissionGroups: PermissionGroup[];
}

export interface OperationLogItem {
  id: number;
  school: string;
  module: string;
  action: string;
  operator: string;
  ip: string;
  createdAt: string;
  content: string;
}

export interface OperationLogQuery extends PageQuery {
  module?: string;
}

export interface OperationLogSummary {
  total: number;
  moduleOptions: string[];
}

export interface OperationLogListResult extends PageResult<OperationLogItem> {
  summary: OperationLogSummary;
}

export interface VersionLogItem {
  version: string;
  date: string;
  content: string;
}

export interface VersionInfo {
  currentVersion: string;
  env: string;
  buildTime: string;
  latestRelease: string;
  changelog: VersionLogItem[];
}

export interface AdminSystemMessageItem {
  id: number;
  title: string;
  school: string;
  target: string;
  channel: string;
  updatedAt: string;
  status: string;
}

export interface AdminSystemMessageQuery extends PageQuery {
  channel?: string;
}

export interface AdminSystemMessageSummary {
  total: number;
  enabledCount: number;
  channelOptions: string[];
}

export interface AdminSystemMessageListResult extends PageResult<AdminSystemMessageItem> {
  summary: AdminSystemMessageSummary;
}

export interface AdminSendRecordItem {
  id: number;
  title: string;
  school: string;
  channel: string;
  targetCount: number;
  operator: string;
  sendTime: string;
  status: string;
}

export interface AdminSendRecordQuery extends PageQuery {}

export interface AdminSendRecordSummary {
  total: number;
  successCount: number;
  targetTotal: number;
  schoolOptions: string[];
}

export interface AdminSendRecordListResult extends PageResult<AdminSendRecordItem> {
  summary: AdminSendRecordSummary;
}

export interface AdminInteractiveMessageItem {
  id: number;
  school: string;
  user: string;
  type: string;
  target: string;
  content: string;
  status: string;
  createdAt: string;
}

export interface AdminInteractiveMessageQuery extends PageQuery {
  type?: string;
}

export interface AdminInteractiveMessageSummary {
  total: number;
  unreadCount: number;
  typeOptions: string[];
}

export interface AdminInteractiveMessageListResult extends PageResult<AdminInteractiveMessageItem> {
  summary: AdminInteractiveMessageSummary;
}

export interface MessageTemplateItem {
  id: number;
  code: string;
  name: string;
  school: string;
  channel: string;
  status: string;
  content: string;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageTemplateQuery extends PageQuery {
  status?: string;
  school?: string;
}

export interface MessageTemplatePayload {
  code: string;
  name: string;
  school: string;
  channel: string;
  status: string;
  content: string;
  remark?: string;
}

export interface MessageTemplateSummary {
  total: number;
  enabledCount: number;
  channelOptions: string[];
  schoolOptions: string[];
}

export interface MessageTemplateListResult extends PageResult<MessageTemplateItem> {
  summary: MessageTemplateSummary;
}

export interface SearchWordItem {
  id: number;
  school: string;
  keyword: string;
  searchCount: number;
  sort: number;
  status: string;
  updatedAt: string;
}

export interface SearchWordQuery extends PageQuery {}

export interface SearchWordPayload {
  school: string;
  keyword: string;
  searchCount: number;
  sort: number;
  status: string;
}

export interface SearchWordSummary {
  total: number;
  enabledCount: number;
  schoolOptions: string[];
}

export interface SearchWordListResult extends PageResult<SearchWordItem> {
  summary: SearchWordSummary;
}

export interface HelpCenterItem {
  id: number;
  category: string;
  title: string;
  school: string;
  status: string;
  content: string;
  sort: number;
  updatedAt: string;
}

export interface HelpCenterQuery extends PageQuery {
  category?: string;
}

export interface HelpCenterPayload {
  category: string;
  title: string;
  school: string;
  status: string;
  content: string;
  sort: number;
}

export interface HelpCenterSummary {
  total: number;
  publishedCount: number;
  categoryOptions: string[];
  schoolOptions: string[];
}

export interface HelpCenterListResult extends PageResult<HelpCenterItem> {
  summary: HelpCenterSummary;
}

export interface BannerConfigItem {
  id: number;
  title: string;
  position: string;
  school: string;
  imageUrl: string;
  linkUrl: string;
  sort: number;
  status: string;
  remark: string;
  updatedAt: string;
}

export interface BannerConfigQuery extends PageQuery {
  position?: string;
}

export interface BannerConfigPayload {
  title: string;
  position: string;
  school: string;
  imageUrl?: string;
  linkUrl?: string;
  sort: number;
  status: string;
  remark?: string;
}

export interface BannerConfigListResult extends PageResult<BannerConfigItem> {
  summary: {
    total: number;
    enabledCount: number;
    positionOptions: string[];
    schoolOptions: string[];
  };
}

export interface RecommendConfigItem {
  id: number;
  title: string;
  type: string;
  school: string;
  targetName: string;
  targetId: string;
  sort: number;
  status: string;
  remark: string;
  updatedAt: string;
}

export interface RecommendConfigQuery extends PageQuery {
  type?: string;
}

export interface RecommendConfigPayload {
  title: string;
  type: string;
  school: string;
  targetName?: string;
  targetId?: string;
  sort: number;
  status: string;
  remark?: string;
}

export interface RecommendConfigListResult extends PageResult<RecommendConfigItem> {
  summary: {
    total: number;
    enabledCount: number;
    typeOptions: string[];
    schoolOptions: string[];
  };
}

export interface BasicConfigItem {
  id: number;
  sectionKey: string;
  sectionTitle: string;
  configKey: string;
  label: string;
  value: string | boolean;
  valueType: "text" | "switch";
  suffix?: string;
  sort: number;
  status: string;
  remark: string;
  updatedAt: string;
}

export interface BasicConfigQuery extends PageQuery {
  sectionKey?: string;
}

export interface BasicConfigPayload {
  sectionKey: string;
  sectionTitle: string;
  configKey: string;
  label: string;
  value: string | boolean;
  valueType: "text" | "switch";
  suffix?: string;
  sort: number;
  status: string;
  remark?: string;
}

export interface BasicConfigResult extends PageResult<BasicConfigItem> {
  summary: {
    total: number;
    enabledCount: number;
    sectionOptions: string[];
  };
}

export interface DictTypeItem {
  id: number;
  name: string;
  code: string;
  status: string;
  remark: string;
  sort: number;
  updatedAt: string;
}

export interface DictTypePayload {
  name: string;
  code: string;
  status: string;
  remark?: string;
  sort: number;
}

export interface DictValueItem {
  id: number;
  typeId: number;
  label: string;
  value: string;
  sort: number;
  status: string;
  remark: string;
  updatedAt: string;
}

export interface DictItemPayload {
  typeId: number;
  label: string;
  value: string;
  sort: number;
  status: string;
  remark?: string;
}

export interface DictConfigResult {
  types: DictTypeItem[];
  items: Record<number, DictValueItem[]>;
  summary: {
    typeCount: number;
    itemCount: number;
  };
}

export interface PostReportItem {
  id: number;
  reportNo: string;
  school: string;
  target: string;
  reporter: string;
  reason: string;
  detail: string;
  status: string;
  reviewNote: string;
  reviewerName: string;
  createdAt: string;
  reviewedAt: string;
}

export interface PostReportQuery extends PageQuery {}

export interface PostReportReviewPayload {
  status: string;
  reviewNote?: string;
}

export interface PostReportListResult extends PageResult<PostReportItem> {
  summary: {
    total: number;
    pendingCount: number;
    processedCount: number;
    rejectedCount: number;
    schoolOptions: string[];
  };
}

export interface AdminPostItem {
  id: number;
  title: string;
  author: string;
  school: string;
  category: string;
  status: string;
  favoriteCount: number;
  createdAt: string;
}

export interface AdminPostListResult extends PageResult<AdminPostItem> {
  summary: {
    total: number;
    pendingCount: number;
    publishedCount: number;
    schoolOptions: string[];
  };
}

export interface AdminPostQuery extends PageQuery {}

export interface AdminProductItem {
  id: string;
  storeId: number;
  storeDetailId: string;
  productId: string;
  name: string;
  storeName: string;
  school: string;
  category: string;
  price: number;
  stock: number;
  sales: number;
  status: string;
}

export interface AdminProductListResult extends PageResult<AdminProductItem> {
  summary: {
    total: number;
    onSaleCount: number;
    pendingCount: number;
    totalSales: number;
    schoolOptions: string[];
    categoryOptions: string[];
  };
}

export interface AdminProductQuery extends PageQuery {
  category?: string;
}

export interface WalletAccountItem {
  id: number;
  accountName: string;
  accountType: string;
  school: string;
  balance: number;
  frozenAmount: number;
  withdrawableAmount: number;
  status: string;
}

export interface WalletAccountListResult extends PageResult<WalletAccountItem> {
  summary: {
    total: number;
    balanceTotal: number;
    frozenTotal: number;
    withdrawableTotal: number;
    schoolOptions: string[];
  };
}

export interface WalletAccountQuery extends PageQuery {}

export interface ProductSpecItem {
  id: number;
  school: string;
  storeName: string;
  productName: string;
  specGroup: string;
  specValue: string;
  price: number;
  stock: number;
  status: string;
  updatedAt: string;
}

export interface ProductSpecQuery extends PageQuery {
  storeName?: string;
}

export interface ProductSpecPayload {
  school: string;
  storeName: string;
  productName: string;
  specGroup: string;
  specValue: string;
  price: number;
  stock: number;
  status: string;
}

export interface VerifyItem {
  id: number;
  userId: number;
  realName: string;
  phone: string;
  school: string;
  status: string;
  reviewerName: string;
  reviewNote: string;
  submitSource: string;
  createdAt: string;
  reviewedAt: string;
  userNickname: string;
}

export interface VerifyQuery extends PageQuery {}

export interface VerifyReviewPayload {
  status: string;
  reviewNote?: string;
}

export interface StoreApplyItem {
  id: number;
  userId: number;
  school: string;
  storeName: string;
  category: string;
  contactName: string;
  contactPhone: string;
  description: string;
  status: string;
  statusClass: string;
  reviewNote: string;
  reviewedAt: string;
  createdAt: string;
}

export interface StoreApplyQuery extends PageQuery {}

export interface StoreReviewPayload {
  status: string;
  reviewNote?: string;
}

export interface AdminStoreItem {
  id: number;
  detailId: string;
  storeName: string;
  owner: string;
  ownerPhone: string;
  school: string;
  category: string;
  section: string;
  status: string;
  recommend: string;
  goodsCount: number;
  rating: number;
  createdAt: string;
}

export interface AdminStoreQuery extends PageQuery {
  category?: string;
}

export interface AdminStoreDashboardProductItem {
  id: string;
  name: string;
  desc: string;
  cover: string;
  category: string;
  price: number;
  priceText: string;
  stock: number;
  dailyLimit: number;
  sales: number;
  revenue: number;
  status: string;
  recommended: boolean;
  specMode: string;
  defaultSkuId: string;
  skuCount: number;
  skus: AdminStoreProductSkuPayload[];
}

export interface AdminStoreProductSkuPayload {
  id?: string;
  name: string;
  price: string;
  stock: number;
  dailyLimit: number;
  status: string;
  isDefault: boolean;
}

export interface AdminStoreProductPayload {
  name: string;
  desc: string;
  specMode: "single" | "multi";
  price: string;
  cover: string;
  stock: number;
  dailyLimit: number;
  recommended: boolean;
  status: string;
  skus: AdminStoreProductSkuPayload[];
}

export interface AdminStoreDashboardOrderItem {
  id: number;
  orderNo: string;
  buyer: string;
  receiverName: string;
  receiverPhone: string;
  productName: string;
  skuName: string;
  quantity: number;
  amount: number;
  payStatus: string;
  orderStatus: string;
  settlementStatus: string;
  createdAt: string;
}

export interface AdminStoreOrderRefundItem {
  id: number;
  refundNo: string;
  amount: number;
  reason: string;
  status: string;
  reviewNote: string;
  reviewerName: string;
  applyTime: string;
  reviewedAt: string;
}

export interface AdminStoreOrderDetailResult {
  id: number;
  orderNo: string;
  school: string;
  buyer: string;
  storeName: string;
  productName: string;
  productDesc: string;
  productCover: string;
  skuName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  payStatus: string;
  orderStatus: string;
  rawOrderStatus: string;
  settlementStatus: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  addressTag: string;
  remark: string;
  paymentChannel: string;
  paymentMode: string;
  createdAt: string;
  paidAt: string;
  finishedAt: string;
  canceledAt: string;
  refunds: AdminStoreOrderRefundItem[];
  latestRefund: AdminStoreOrderRefundItem | null;
  actions: {
    canFinish: boolean;
    canCancel: boolean;
    canReviewRefund: boolean;
  };
}

export interface AdminStoreOrderQuery extends PageQuery {
  payStatus?: string;
  orderStatus?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminStoreDashboardChartItem {
  key: string;
  label: string;
  value: number;
  percent: number;
}

export interface AdminStoreDashboardTopProductItem {
  id: string;
  name: string;
  sales: number;
  revenue: number;
}

export interface AdminStoreDashboardTrendItem {
  date: string;
  orders: number;
  revenue: number;
}

export interface AdminStoreDashboardResult {
  store: {
    id: number;
    detailId: string;
    storeName: string;
    school: string;
    category: string;
    section: string;
    status: string;
    rating: number;
    monthlySales: string;
    delivery: string;
    distance: string;
    subtitle: string;
    notice: string;
    phone: string;
    address: string;
    cover: string;
    createdAt: string;
    owner: string;
    ownerPhone: string;
    merchantPhone: string;
    merchantStatus: string;
    merchantActivatedAt: string;
    merchantLastLoginAt: string;
  };
  summary: {
    totalOrders: number;
    paidOrders: number;
    processingOrders: number;
    finishedOrders: number;
    refundedOrders: number;
    refundingOrders: number;
    totalRevenue: number;
    paidRevenue: number;
    settledRevenue: number;
    pendingSettlementRevenue: number;
    avgOrderValue: number;
    productCount: number;
    onSaleProducts: number;
    recommendedProducts: number;
    lowStockProducts: number;
  };
  charts: {
    orderStatus: AdminStoreDashboardChartItem[];
    payStatus: AdminStoreDashboardChartItem[];
    settlement: AdminStoreDashboardChartItem[];
    topProducts: AdminStoreDashboardTopProductItem[];
    recentTrend: AdminStoreDashboardTrendItem[];
  };
  products: AdminStoreDashboardProductItem[];
  orders: AdminStoreDashboardOrderItem[];
}

export interface AdminOrderItem {
  id: number;
  orderNo: string;
  school: string;
  buyer: string;
  storeName: string;
  amount: number;
  payStatus: string;
  orderStatus: string;
  settlementStatus: string;
  createdAt: string;
}

export interface AdminOrderQuery extends PageQuery {
  payStatus?: string;
  orderStatus?: string;
}

export interface RefundItem {
  id: number;
  refundNo: string;
  orderNo: string;
  school: string;
  buyer: string;
  amount: number;
  reason: string;
  status: string;
  reviewNote: string;
  reviewerName: string;
  applyTime: string;
  reviewedAt: string;
}

export interface RefundQuery extends PageQuery {}

export interface RefundReviewPayload {
  status: string;
  reviewNote?: string;
}

export interface RefundListResult extends PageResult<RefundItem> {
  summary: {
    total: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    schoolOptions: string[];
  };
}

export interface WithdrawItem {
  id: number;
  withdrawNo: string;
  school: string;
  accountName: string;
  amount: number;
  bankName: string;
  status: string;
  applyTime: string;
  reviewNote?: string;
}

export interface WithdrawQuery extends PageQuery {}

export interface WithdrawReviewPayload {
  status: string;
  reviewNote?: string;
}
