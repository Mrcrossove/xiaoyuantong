<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import {
  createSupplyRequestApi,
  getSupplyDefaultsApi,
  getSupplyRequestListApi
} from "../../api/modules/merchant";

const loading = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
const list = ref<any[]>([]);
const total = ref(0);
const query = reactive({
  page: 1,
  pageSize: 10
});

const form = reactive({
  storeName: "",
  ownerName: "",
  phone: "",
  school: "",
  address: "",
  productName: "",
  quantity: 1,
  remark: ""
});

const rules: FormRules = {
  storeName: [{ required: true, message: "请填写店铺名称", trigger: "blur" }],
  ownerName: [{ required: true, message: "请填写店主", trigger: "blur" }],
  phone: [{ required: true, message: "请填写联系电话", trigger: "blur" }],
  school: [{ required: true, message: "请填写高校", trigger: "blur" }],
  address: [{ required: true, message: "请填写店铺详细地址", trigger: "blur" }],
  productName: [{ required: true, message: "请填写具体商品名称", trigger: "blur" }],
  quantity: [{ required: true, message: "请填写申请补货数量", trigger: "change" }]
};

function statusText(status: string) {
  const map: Record<string, string> = {
    pending: "待处理",
    delivering: "配送中",
    completed: "已完成",
    rejected: "已驳回"
  };
  return map[status] || status || "-";
}

function statusType(status: string) {
  if (status === "completed") return "success";
  if (status === "delivering") return "warning";
  if (status === "rejected") return "danger";
  return "info";
}

async function loadDefaults() {
  const defaults = await getSupplyDefaultsApi();
  form.storeName = defaults.storeName || "";
  form.ownerName = defaults.ownerName || "";
  form.phone = defaults.phone || "";
  form.school = defaults.school || "";
  form.address = defaults.address || "";
}

async function loadList() {
  const result = await getSupplyRequestListApi(query);
  list.value = result.list || [];
  total.value = result.total || 0;
}

async function loadData() {
  loading.value = true;
  try {
    await Promise.all([loadDefaults(), loadList()]);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "补给申请数据加载失败");
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    await createSupplyRequestApi({
      ...form,
      quantity: Number(form.quantity || 1)
    });
    ElMessage.success("补给申请已提交");
    form.productName = "";
    form.quantity = 1;
    form.remark = "";
    query.page = 1;
    await loadList();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "补给申请提交失败");
  } finally {
    submitting.value = false;
  }
}

function handlePageChange(page: number) {
  query.page = page;
  loadList();
}

onMounted(loadData);
</script>

<template>
  <div class="page supply-page" v-loading="loading">
    <el-card shadow="never">
      <template #header>
        <div class="section-title">商品补给申请</div>
      </template>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="supply-form">
        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item label="店铺名称" prop="storeName">
              <el-input v-model="form.storeName" maxlength="60" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="店主" prop="ownerName">
              <el-input v-model="form.ownerName" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="高校" prop="school">
              <el-input v-model="form.school" maxlength="40" />
            </el-form-item>
          </el-col>
          <el-col :xs="24">
            <el-form-item label="店铺详细地址" prop="address">
              <el-input v-model="form.address" maxlength="120" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="16">
            <el-form-item label="具体商品名称" prop="productName">
              <el-input v-model="form.productName" maxlength="80" placeholder="如：矿泉水、泡面、纸巾" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-form-item label="申请补货数量" prop="quantity">
              <el-input-number v-model="form.quantity" :min="1" :max="999999" controls-position="right" class="full-input" />
            </el-form-item>
          </el-col>
          <el-col :xs="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="200" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">提交申请</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="section-title">历史申请</div>
      </template>
      <el-table :data="list" stripe>
        <el-table-column prop="requestNo" label="申请编号" min-width="170" />
        <el-table-column prop="productName" label="商品名称" min-width="160" />
        <el-table-column prop="quantity" label="数量" width="100" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="申请时间" width="170" />
        <el-table-column prop="adminNote" label="处理备注" min-width="180" show-overflow-tooltip />
      </el-table>
      <div class="pagination">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="total"
          :page-size="query.pageSize"
          :current-page="query.page"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.supply-page {
  display: grid;
  gap: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
}

.supply-form {
  max-width: 980px;
}

.full-input {
  width: 100%;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
