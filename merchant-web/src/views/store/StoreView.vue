<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { getStoreApi, updateStoreApi, uploadMerchantImageApi } from "../../api/modules/merchant";
import { readFileAsDataUrl } from "../../utils/file";

const loading = ref(false);
const saving = ref(false);
const coverUploading = ref(false);
const bannerUploading = ref(false);
const coverInputRef = ref<HTMLInputElement | null>(null);
const bannerInputRef = ref<HTMLInputElement | null>(null);

const form = reactive({
  name: "",
  subtitle: "",
  notice: "",
  phone: "",
  address: "",
  cover: "",
  banners: [] as string[]
});

async function loadData() {
  loading.value = true;
  try {
    const result = await getStoreApi();
    form.name = result.name || "";
    form.subtitle = result.subtitle || "";
    form.notice = result.notice || "";
    form.phone = result.phone || "";
    form.address = result.address || "";
    form.cover = result.cover || "";
    form.banners = Array.isArray(result.banners) ? result.banners : [];
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "店铺信息加载失败");
  } finally {
    loading.value = false;
  }
}

async function uploadSingleFile(file: File) {
  const base64 = await readFileAsDataUrl(file);
  return uploadMerchantImageApi({
    fileName: file.name,
    base64,
    scene: "merchant"
  });
}

function triggerCoverUpload() {
  coverInputRef.value?.click();
}

function triggerBannerUpload() {
  if (form.banners.length >= 5) {
    ElMessage.warning("轮播图最多上传 5 张");
    return;
  }
  bannerInputRef.value?.click();
}

async function handleCoverChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  coverUploading.value = true;
  try {
    const result = await uploadSingleFile(file);
    form.cover = result.url;
    await saveStore("封面图已上传并保存");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "封面图上传失败");
  } finally {
    coverUploading.value = false;
  }
}

async function handleBannerChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  input.value = "";
  if (!files.length) return;

  const remain = 5 - form.banners.length;
  const targetFiles = files.slice(0, remain);
  if (!targetFiles.length) {
    ElMessage.warning("轮播图最多上传 5 张");
    return;
  }

  bannerUploading.value = true;
  try {
    const urls: string[] = [];
    for (const file of targetFiles) {
      const result = await uploadSingleFile(file);
      urls.push(result.url);
    }
    form.banners = form.banners.concat(urls);
    await saveStore("轮播图已上传并保存");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "轮播图上传失败");
  } finally {
    bannerUploading.value = false;
  }
}

async function removeBanner(index: number) {
  form.banners.splice(index, 1);
  await saveStore("轮播图已删除并保存");
}

async function saveStore(successMessage = "店铺信息已更新") {
  saving.value = true;
  try {
    await updateStoreApi({
      name: form.name,
      subtitle: form.subtitle,
      notice: form.notice,
      phone: form.phone,
      address: form.address,
      cover: form.cover,
      banners: form.banners
    });
    ElMessage.success(successMessage);
    await loadData();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "店铺信息保存失败");
  } finally {
    saving.value = false;
  }
}

async function handleSave() {
  await saveStore();
}

onMounted(loadData);
</script>

<template>
  <div class="page" v-loading="loading">
    <el-card>
      <template #header>
        <div class="section-title">店铺资料</div>
      </template>

      <el-form label-position="top">
        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item label="店铺名称">
              <el-input v-model.trim="form.name" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="店铺副标题">
              <el-input v-model.trim="form.subtitle" maxlength="40" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="店铺公告">
          <el-input v-model.trim="form.notice" type="textarea" :rows="3" maxlength="120" show-word-limit />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :xs="24" :md="12">
            <el-form-item label="联系电话">
              <el-input v-model.trim="form.phone" maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-form-item label="店铺地址">
              <el-input v-model.trim="form.address" maxlength="100" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="店铺封面">
          <div class="upload-panel">
            <div v-if="form.cover" class="image-card">
              <img :src="form.cover" alt="店铺封面" />
            </div>
            <div v-else class="image-placeholder">暂无封面</div>
            <div class="upload-actions">
              <el-button :loading="coverUploading" @click="triggerCoverUpload">上传封面图</el-button>
              <el-input v-model.trim="form.cover" placeholder="也可直接粘贴图片 URL" />
            </div>
          </div>
        </el-form-item>

        <el-form-item label="轮播图">
          <div class="banner-list">
            <div v-for="(item, index) in form.banners" :key="`${item}-${index}`" class="banner-card">
              <img :src="item" alt="轮播图" />
              <el-button link type="danger" @click="removeBanner(index)">删除</el-button>
            </div>
            <div class="banner-uploader">
              <el-button :loading="bannerUploading" @click="triggerBannerUpload">上传轮播图</el-button>
              <div class="banner-tip">最多 5 张，支持直接上传</div>
            </div>
          </div>
        </el-form-item>

        <el-button type="primary" :loading="saving" @click="handleSave">保存店铺资料</el-button>
      </el-form>

      <input ref="coverInputRef" class="hidden-input" type="file" accept="image/*" @change="handleCoverChange" />
      <input
        ref="bannerInputRef"
        class="hidden-input"
        type="file"
        accept="image/*"
        multiple
        @change="handleBannerChange"
      />
    </el-card>
  </div>
</template>

<style scoped>
.section-title {
  font-size: 16px;
  font-weight: 700;
}

.upload-panel {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 16px;
  align-items: start;
}

.image-card,
.image-placeholder {
  width: 180px;
  height: 120px;
  border-radius: 12px;
  border: 1px solid #dbe4f0;
  overflow: hidden;
  background: #f8fafc;
}

.image-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  display: grid;
  place-items: center;
  color: #98a2b3;
}

.upload-actions {
  display: grid;
  gap: 12px;
}

.banner-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.banner-card {
  padding: 12px;
  border: 1px solid #dbe4f0;
  border-radius: 12px;
  background: #fff;
}

.banner-card img {
  width: 100%;
  height: 110px;
  object-fit: cover;
  border-radius: 8px;
}

.banner-uploader {
  min-height: 110px;
  padding: 12px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  display: grid;
  place-items: center;
  text-align: center;
  background: #f8fafc;
}

.banner-tip {
  margin-top: 8px;
  color: #667085;
  font-size: 12px;
}

.hidden-input {
  display: none;
}

@media (max-width: 768px) {
  .upload-panel {
    grid-template-columns: 1fr;
  }
}
</style>
