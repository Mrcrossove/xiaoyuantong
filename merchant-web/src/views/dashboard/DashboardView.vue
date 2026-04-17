<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { getDashboardApi } from "../../api/modules/merchant";

const loading = ref(false);
const data = ref<any>({
  summary: {},
  recentOrders: []
});

const cards = [
  { key: "todayOrderCount", label: "今日订单" },
  { key: "todayAmount", label: "今日成交额" },
  { key: "pendingOrderCount", label: "待处理订单" },
  { key: "refundPendingCount", label: "待处理退款" },
  { key: "balance", label: "钱包余额" },
  { key: "messageCount", label: "消息数量" }
];

async function loadData() {
  loading.value = true;
  try {
    data.value = await getDashboardApi();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "工作台加载失败");
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="page" v-loading="loading">
    <el-row :gutter="16">
      <el-col v-for="item in cards" :key="item.key" :xs="24" :sm="12" :lg="8">
        <el-card shadow="hover">
          <div class="metric-label">{{ item.label }}</div>
          <div class="metric-value">{{ data.summary[item.key] ?? 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <div class="section-title">最近订单</div>
      </template>
      <el-table :data="data.recentOrders || []" empty-text="暂无订单">
        <el-table-column prop="orderNo" label="订单号" min-width="180" />
        <el-table-column prop="productName" label="商品" min-width="180" />
        <el-table-column prop="amount" label="金额" width="120" />
        <el-table-column prop="quantity" label="数量" width="90" />
        <el-table-column prop="status" label="订单状态" width="120" />
        <el-table-column prop="payStatus" label="支付状态" width="120" />
        <el-table-column prop="createdAt" label="下单时间" min-width="170" />
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.section-title {
  font-size: 16px;
  font-weight: 700;
}
</style>
