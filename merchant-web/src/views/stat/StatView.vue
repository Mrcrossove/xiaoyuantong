<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { getStatApi } from "../../api/modules/merchant";

const loading = ref(false);
const data = ref<any>({
  cards: {},
  hotProducts: []
});

const cards = [
  { key: "orderCount", label: "订单总数" },
  { key: "paidOrderCount", label: "已支付订单" },
  { key: "totalAmount", label: "成交总额" },
  { key: "refundCount", label: "退款笔数" },
  { key: "refundAmount", label: "退款总额" }
];

async function loadData() {
  loading.value = true;
  try {
    data.value = await getStatApi();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "统计数据加载失败");
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
          <div class="metric-value">{{ data.cards[item.key] ?? 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <div class="section-title">热销商品</div>
      </template>
      <el-table :data="data.hotProducts || []" empty-text="暂无统计数据">
        <el-table-column prop="productName" label="商品" min-width="200" />
        <el-table-column prop="quantity" label="销量" width="120" />
        <el-table-column prop="amount" label="成交额" width="140" />
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
