<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { acceptOrderApi, finishOrderApi, getOrderListApi } from "../../api/modules/merchant";

const router = useRouter();
const loading = ref(false);
const actingId = ref<number | null>(null);
const list = ref<any[]>([]);
const total = ref(0);
const query = reactive({
  keyword: "",
  status: "",
  payStatus: ""
});

async function loadData() {
  loading.value = true;
  try {
    const result = await getOrderListApi(query);
    list.value = result.list || [];
    total.value = result.total || 0;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "订单列表加载失败");
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  query.keyword = "";
  query.status = "";
  query.payStatus = "";
  loadData();
}

function goDetail(row: any) {
  router.push({ name: "merchant-order-detail", params: { id: row.id } });
}

async function handleAccept(row: any) {
  try {
    await ElMessageBox.confirm(`确认接单订单 ${row.orderNo} 吗？`, "接单确认", { type: "warning" });
    actingId.value = row.id;
    await acceptOrderApi(row.id);
    ElMessage.success("订单已接单");
    await loadData();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error(error instanceof Error ? error.message : "接单失败");
    }
  } finally {
    actingId.value = null;
  }
}

async function handleFinish(row: any) {
  try {
    await ElMessageBox.confirm(`确认将订单 ${row.orderNo} 标记为已完成吗？`, "完成订单", { type: "warning" });
    actingId.value = row.id;
    await finishOrderApi(row.id);
    ElMessage.success("订单已完成");
    await loadData();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error(error instanceof Error ? error.message : "完成订单失败");
    }
  } finally {
    actingId.value = null;
  }
}

function getOrderTagType(status: string) {
  if (status === "已完成") return "success";
  if (status === "已取消") return "info";
  if (status === "待支付") return "danger";
  return "warning";
}

function getPayTagType(status: string) {
  if (status === "已支付") return "success";
  if (status === "已退款") return "warning";
  return "info";
}

onMounted(loadData);
</script>

<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-input v-model.trim="query.keyword" class="input" placeholder="搜索订单号、商品、收货人、手机号" clearable />
        <el-select v-model="query.status" class="select" placeholder="处理状态" clearable>
          <el-option label="待支付" value="待支付" />
          <el-option label="待接单" value="待接单" />
          <el-option label="处理中" value="处理中" />
          <el-option label="已完成" value="已完成" />
          <el-option label="已取消" value="已取消" />
        </el-select>
        <el-select v-model="query.payStatus" class="select" placeholder="支付状态" clearable>
          <el-option label="待支付" value="待支付" />
          <el-option label="已支付" value="已支付" />
          <el-option label="已退款" value="已退款" />
        </el-select>
        <el-button type="primary" @click="loadData">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </div>
    </el-card>

    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
          <span class="sub-text">共 {{ total }} 条</span>
        </div>
      </template>

      <el-table :data="list" empty-text="暂无订单">
        <el-table-column label="订单号" min-width="180">
          <template #default="{ row }">
            <el-button link type="primary" @click="goDetail(row)">{{ row.orderNo }}</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="商品" min-width="160" />
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="90" />
        <el-table-column prop="receiverName" label="收货人" width="110" />
        <el-table-column prop="receiverPhone" label="手机号" width="140" />
        <el-table-column prop="receiverAddress" label="收货地址" min-width="220" show-overflow-tooltip />
        <el-table-column label="处理状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getOrderTagType(row.merchantStatusText)">{{ row.merchantStatusText }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="支付状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getPayTagType(row.payStatus)">{{ row.payStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="下单时间" min-width="170" />
        <el-table-column label="操作" min-width="230" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="goDetail(row)">查看详情</el-button>
            <el-button
              link
              type="warning"
              :loading="actingId === row.id"
              :disabled="!row.canAccept"
              @click="handleAccept(row)"
            >
              接单
            </el-button>
            <el-button
              link
              type="success"
              :loading="actingId === row.id"
              :disabled="!row.canFinish"
              @click="handleFinish(row)"
            >
              完成订单
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sub-text {
  color: #667085;
  font-size: 13px;
}
</style>
