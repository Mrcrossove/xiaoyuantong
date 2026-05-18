<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { createTravelProviderApi, getTravelProviderListApi, updateTravelProviderApi } from "../../api/modules/travel";

const loading = ref(false);
const list = ref<any[]>([]);
const dialogVisible = ref(false);
const editingId = ref(0);
const form = reactive({
  name: "",
  contactName: "",
  contactPhone: "",
  licenseNo: "",
  status: "enabled",
  remark: ""
});

async function loadData() {
  loading.value = true;
  try {
    const result = await getTravelProviderListApi();
    list.value = result.list || [];
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "供应方加载失败");
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = 0;
  Object.assign(form, { name: "", contactName: "", contactPhone: "", licenseNo: "", status: "enabled", remark: "" });
  dialogVisible.value = true;
}

function openEdit(row: any) {
  editingId.value = row.id;
  Object.assign(form, {
    name: row.name,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    licenseNo: row.licenseNo,
    status: row.status,
    remark: row.remark
  });
  dialogVisible.value = true;
}

async function submit() {
  try {
    if (editingId.value) {
      await updateTravelProviderApi(editingId.value, form);
    } else {
      await createTravelProviderApi(form);
    }
    ElMessage.success("保存成功");
    dialogVisible.value = false;
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存失败");
  }
}

onMounted(loadData);
</script>

<template>
  <div class="page">
    <el-card shadow="never">
      <template #header>
        <div class="card-head">
          <span>旅游供应方</span>
          <el-button v-permission="'travel:provider:edit'" type="primary" @click="openCreate">新增供应方</el-button>
        </div>
      </template>
      <el-table :data="list" stripe v-loading="loading">
        <el-table-column prop="name" label="供应方名称" min-width="180" />
        <el-table-column prop="contactName" label="联系人" width="120" />
        <el-table-column prop="contactPhone" label="联系电话" width="140" />
        <el-table-column prop="licenseNo" label="旅行社许可证号" min-width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enabled' ? 'success' : 'info'">{{ row.status === "enabled" ? "启用" : "停用" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="'travel:provider:edit'" link type="primary" @click="openEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="供应方信息" width="560px">
      <el-form label-width="120px">
        <el-form-item label="供应方名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="联系人"><el-input v-model="form.contactName" /></el-form-item>
        <el-form-item label="联系电话"><el-input v-model="form.contactPhone" /></el-form-item>
        <el-form-item label="许可证号"><el-input v-model="form.licenseNo" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status">
            <el-option label="启用" value="enabled" />
            <el-option label="停用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { display: grid; gap: 16px; }
.card-head { display: flex; justify-content: space-between; align-items: center; }
</style>
