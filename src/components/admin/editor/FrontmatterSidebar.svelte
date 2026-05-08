<script lang="ts">
import type { AdminEssayEditorValues } from '../../../lib/admin-console/content-shared';

type AdminContentIssue = {
  path: string;
  message: string;
};

type Props = {
  value: AdminEssayEditorValues;
  issues?: readonly AdminContentIssue[];
  disabled?: boolean;
  slugPlaceholder?: string;
};

let {
  value = $bindable(),
  issues = [],
  disabled = false,
  slugPlaceholder = ''
}: Props = $props();

const getIssue = (path: string): string =>
  issues.find((issue) => issue.path === path)?.message ?? '';
</script>

<aside class="admin-editor-frontmatter" aria-label="随笔字段">
  <div class="admin-editor-frontmatter__fields">
    <label class="admin-field admin-content-editor__field" class:is-invalid={Boolean(getIssue('title'))}>
      <span class="admin-field__label">标题</span>
      <input class="admin-field__control" name="title" type="text" bind:value={value.title} {disabled} />
      <p class="admin-content-editor__error" hidden={!getIssue('title')}>{getIssue('title')}</p>
    </label>

    <label class="admin-field admin-content-editor__field" class:is-invalid={Boolean(getIssue('date'))}>
      <span class="admin-field__label">日期</span>
      <input class="admin-field__control" name="date" type="date" bind:value={value.date} {disabled} />
      <p class="admin-content-editor__error" hidden={!getIssue('date')}>{getIssue('date')}</p>
    </label>

    <label class="admin-field admin-content-editor__field" class:is-invalid={Boolean(getIssue('publishedAt'))}>
      <span class="admin-field__label">发布时间</span>
      <input class="admin-field__control" name="publishedAt" type="text" bind:value={value.publishedAt} placeholder="2024-11-23T18:00:00+08:00" {disabled} />
      <p class="admin-content-editor__error" hidden={!getIssue('publishedAt')}>{getIssue('publishedAt')}</p>
    </label>

    <label class="admin-field admin-content-editor__field" class:is-invalid={Boolean(getIssue('badge'))}>
      <span class="admin-field__label">badge</span>
      <input class="admin-field__control" name="badge" type="text" bind:value={value.badge} {disabled} />
      <p class="admin-content-editor__error" hidden={!getIssue('badge')}>{getIssue('badge')}</p>
    </label>

    <label class="admin-field admin-content-editor__field" class:is-invalid={Boolean(getIssue('description'))}>
      <span class="admin-field__label">摘要</span>
      <textarea class="admin-field__control" name="description" bind:value={value.description} rows="3" {disabled}></textarea>
      <p class="admin-content-editor__error" hidden={!getIssue('description')}>{getIssue('description')}</p>
    </label>

    <label class="admin-field admin-content-editor__field" class:is-invalid={Boolean(getIssue('slug'))}>
      <span class="admin-field__label">自定义路径</span>
      <input class="admin-field__control" name="slug" type="text" bind:value={value.slug} placeholder={slugPlaceholder} spellcheck="false" {disabled} />
      <p class="admin-content-editor__error" hidden={!getIssue('slug')}>{getIssue('slug')}</p>
    </label>

    <label class="admin-field admin-content-editor__field" class:is-invalid={Boolean(getIssue('cover'))}>
      <span class="admin-field__label">封面图</span>
      <input class="admin-field__control" name="cover" type="text" bind:value={value.cover} spellcheck="false" {disabled} />
      <p class="admin-content-editor__error" hidden={!getIssue('cover')}>{getIssue('cover')}</p>
    </label>

    <label class="admin-field admin-content-editor__field" class:is-invalid={Boolean(getIssue('tags'))}>
      <span class="admin-field__label">标签（每行一个）</span>
      <textarea class="admin-field__control" name="tags" bind:value={value.tagsText} rows="3" spellcheck="false" {disabled}></textarea>
      <p class="admin-content-editor__error" hidden={!getIssue('tags')}>{getIssue('tags')}</p>
    </label>
  </div>
</aside>
