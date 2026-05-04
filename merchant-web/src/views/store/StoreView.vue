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
const serviceSchoolLabel = "\u53ef\u670d\u52a1\u9ad8\u6821";
const serviceSchoolPlaceholder = "\u8f93\u5165\u9ad8\u6821\u540d\u79f0\u540e\u56de\u8f66\u6dfb\u52a0";
const serviceSchoolTip = "\u5e97\u94fa\u5f52\u5c5e\u9ad8\u6821\u4f1a\u81ea\u52a8\u4fdd\u7559\uff1b\u6dfb\u52a0\u540e\uff0c\u7528\u6237\u5728\u8fd9\u4e9b\u9ad8\u6821\u4e5f\u80fd\u770b\u5230\u8be5\u5e97\u94fa\u5e76\u4e0b\u5355\u3002";

const form = reactive({
  name: "",
  subtitle: "",
  notice: "",
  phone: "",
  address: "",
  latitude: null as number | null,
  longitude: null as number | null,
  locationName: "",
  locationAddress: "",
  cover: "",
  tags: [] as string[],
  serviceSchools: [] as string[],
  banners: [] as string[]
});

function normalizeStoreTags(tags: string[]) {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const rawTag of tags) {
    const tag = String(rawTag || "").trim();
    if (!tag) continue;
    if (tag.length > 8) {
      ElMessage.warning("店铺标签最多 8 个字");
      continue;
    }
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(tag);
    if (result.length >= 6) break;
  }
  return result;
}

function normalizeServiceSchools(schools: string[]) {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const rawSchool of schools) {
    const school = String(rawSchool || "").trim();
    if (!school) continue;
    if (school.length > 40) {
      ElMessage.warning("\u670d\u52a1\u9ad8\u6821\u540d\u79f0\u6700\u591a 40 \u4e2a\u5b57");
      continue;
    }
    const key = school.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(school);
    if (result.length >= 10) break;
  }
  return result;
}

async function loadData() {
  loading.value = true;
  try {
    const result = await getStoreApi();
    form.name = result.name || "";
    form.subtitle = result.subtitle || "";
    form.notice = result.notice || "";
    form.phone = result.phone || "";
    form.address = result.address || "";
    form.latitude = typeof result.latitude === "number" ? result.latitude : null;
    form.longitude = typeof result.longitude === "number" ? result.longitude : null;
    form.locationName = result.locationName || "";
    form.locationAddress = result.locationAddress || "";
    form.cover = result.cover || "";
    form.tags = Array.isArray(result.tags) ? normalizeStoreTags(result.tags) : [];
    form.serviceSchools = Array.isArray(result.serviceSchools) ? normalizeServiceSchools(result.serviceSchools) : [];
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
  const hasLatitude = form.latitude !== null && form.latitude !== undefined;
  const hasLongitude = form.longitude !== null && form.longitude !== undefined;
  if (hasLatitude !== hasLongitude) {
    ElMessage.warning("请同时填写导航纬度和经度");
    return;
  }

  saving.value = true;
  try {
    await updateStoreApi({
      name: form.name,
      subtitle: form.subtitle,
      notice: form.notice,
      phone: form.phone,
      address: form.address,
      latitude: hasLatitude ? Number(form.latitude) : null,
      longitude: hasLongitude ? Number(form.longitude) : null,
      locationName: form.locationName,
      locationAddress: form.locationAddress,
      cover: form.cover,
      tags: normalizeStoreTags(form.tags),
      serviceSchools: normalizeServiceSchools(form.serviceSchools),
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

function openTencentLocationPicker() {
  const query = encodeURIComponent(form.address || form.name || "");
  window.open(`https://apis.map.qq.com/tools/locpicker?search=1&type=1&keyword=${query}`, "_blank");
}

function clearLocation() {
  form.latitude = null;
  form.longitude = null;
  form.locationName = "";
  form.locationAddress = "";
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

        <el-form-item label="店铺标签">
          <el-select
            v-model="form.tags"
            multiple
            filterable
            allow-create
            default-first-option
            :multiple-limit="6"
            placeholder="输入后回车添加，例如 当日现做"
            style="width: 100%"
          >
            <el-option v-for="tag in form.tags" :key="tag" :label="tag" :value="tag" />
          </el-select>
          <div class="form-tip">最多 6 个，每个最多 8 个字；不能填写联系方式、平台背书或引流内容。</div>
        </el-form-item>

        <el-form-item :label="serviceSchoolLabel">
          <el-select
            v-model="form.serviceSchools"
            multiple
            filterable
            allow-create
            default-first-option
            :multiple-limit="10"
            :placeholder="serviceSchoolPlaceholder"
            style="width: 100%"
          >
            <el-option v-for="school in form.serviceSchools" :key="school" :label="school" :value="school" />
          </el-select>
          <div class="form-tip">{{ serviceSchoolTip }}</div>
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

        <el-form-item label="导航定位">
          <div class="location-panel">
            <el-row :gutter="12">
              <el-col :xs="24" :md="12">
                <el-input v-model.trim="form.locationName" maxlength="60" placeholder="定位名称，例如 贵州大学西区商业街" />
              </el-col>
              <el-col :xs="24" :md="12">
                <el-input v-model.trim="form.locationAddress" maxlength="120" placeholder="地图定位地址，可与店铺地址不同" />
              </el-col>
            </el-row>
            <el-row :gutter="12">
              <el-col :xs="24" :md="12">
                <el-input-number
                  v-model="form.latitude"
                  :precision="6"
                  :min="-90"
                  :max="90"
                  controls-position="right"
                  placeholder="纬度"
                  style="width: 100%"
                />
              </el-col>
              <el-col :xs="24" :md="12">
                <el-input-number
                  v-model="form.longitude"
                  :precision="6"
                  :min="-180"
                  :max="180"
                  controls-position="right"
                  placeholder="经度"
                  style="width: 100%"
                />
              </el-col>
            </el-row>
            <div class="location-actions">
              <el-button @click="openTencentLocationPicker">打开腾讯地图取点</el-button>
              <el-button @click="clearLocation">清空定位</el-button>
            </div>
            <div class="form-tip">小程序导航必须有经纬度。打开腾讯地图取点后，将页面里显示的纬度、经度填回这里。</div>
          </div>
        </el-form-item>

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
      <input ref="bannerInputRef" class="hidden-input" type="file" accept="image/*" multiple @change="handleBannerChange" />
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

.location-panel {
  display: grid;
  gap: 12px;
}

.location-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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

.banner-tip,
.form-tip {
  margin-top: 8px;
  color: #667085;
  font-size: 12px;
  line-height: 1.5;
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
