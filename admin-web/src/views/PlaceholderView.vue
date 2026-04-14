<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
}>();
</script>

<template>
  <div class="page">
    <div class="hero">
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>待开发内容</template>
          <ul class="list">
            <li>查询筛选区域</li>
            <li>表格或详情内容区</li>
            <li>弹窗与表单交互</li>
            <li>接口接入与权限控制</li>
          </ul>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>当前说明</template>
          <div class="empty">该页面骨架已建立，后续按《管理后台开发需求文档》逐页实现真实业务能力。</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.page { display: grid; gap: 16px; }
.hero { padding: 24px; border-radius: 20px; background: linear-gradient(135deg, #eef5ff, #f4fbf6); }
.hero h2 { margin: 0; font-size: 24px; }
.hero p { margin: 12px 0 0; color: #667085; line-height: 1.7; }
.list, .empty { margin: 0; padding-left: 18px; color: #667085; line-height: 1.9; }
</style>
