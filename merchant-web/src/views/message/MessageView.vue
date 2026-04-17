<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { getMessageListApi, readAllMessagesApi, readMessageApi } from "../../api/modules/merchant";

const router = useRouter();
const loading = ref(false);
const readingId = ref<number | null>(null);
const list = ref<any[]>([]);
const unreadCount = ref(0);
const summary = ref({
  systemUnread: 0,
  interactiveUnread: 0
});

const query = reactive({
  keyword: "",
  type: ""
});

async function loadData() {
  loading.value = true;
  try {
    const result = await getMessageListApi(query);
    list.value = result.list || [];
    unreadCount.value = result.unreadCount || 0;
    summary.value = result.summary || { systemUnread: 0, interactiveUnread: 0 };
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "消息列表加载失败");
  } finally {
    loading.value = false;
  }
}

async function handleRead(row: any) {
  if (row.read) return;
  readingId.value = row.id;
  try {
    await readMessageApi(row.id);
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "消息标记失败");
  } finally {
    readingId.value = null;
  }
}

async function handleReadAll() {
  try {
    await readAllMessagesApi(query.type ? { type: query.type as "system" | "interactive" } : {});
    ElMessage.success("消息已全部设为已读");
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "批量已读失败");
  }
}

function handleReset() {
  query.keyword = "";
  query.type = "";
  loadData();
}

function goTarget(row: any) {
  if (row.targetType === "order" && row.targetId) {
    router.push({ name: "merchant-order-detail", params: { id: row.targetId } });
    return;
  }
  if (row.targetType === "refund" && row.targetId) {
    router.push({ name: "merchant-refund-detail", params: { id: row.targetId } });
  }
}

onMounted(loadData);
</script>

<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="metric-label">未读总数</div>
          <div class="metric-value">{{ unreadCount }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="metric-label">系统未读</div>
          <div class="metric-value">{{ summary.systemUnread }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card shadow="hover">
          <div class="metric-label">互动未读</div>
          <div class="metric-value">{{ summary.interactiveUnread }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <div class="toolbar">
        <el-input v-model.trim="query.keyword" class="input" placeholder="搜索消息分类或内容" clearable />
        <el-select v-model="query.type" class="select" placeholder="消息类型" clearable>
          <el-option label="系统消息" value="system" />
          <el-option label="互动消息" value="interactive" />
        </el-select>
        <el-button type="primary" @click="loadData">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="success" plain @click="handleReadAll">全部设为已读</el-button>
      </div>
    </el-card>

    <el-card v-loading="loading">
      <template #header>
        <div class="section-title">消息通知</div>
      </template>
      <el-table :data="list" empty-text="暂无消息">
        <el-table-column prop="typeLabel" label="类型" width="120" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="content" label="消息内容" min-width="360" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.read ? 'info' : 'danger'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="时间" min-width="170" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.targetType === 'order' || row.targetType === 'refund'"
              link
              type="primary"
              @click="goTarget(row)"
            >
              查看详情
            </el-button>
            <el-button link type="success" :disabled="row.read" :loading="readingId === row.id" @click="handleRead(row)">
              设为已读
            </el-button>
          </template>
        </el-table-column>
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
