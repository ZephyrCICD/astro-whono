import type {
  AdminBitsEditorValues,
  AdminContentWorkspaceEditorValues,
  AdminEssayEditorValues,
  AdminMemoEditorValues
} from '../../../lib/admin-console/content-editor-payload';
import type { AdminContentWriteCollectionKey } from '../../../lib/admin-console/content-collections';
import type { AdminAboutEditorValues } from '../../../lib/admin-console/content-about-contract';
import { getAdminContentCollectionCapability } from '../../../lib/admin-console/content-collections';
import {
  getAdminAboutWriteFieldLabel,
  isAdminAboutFrontmatterIssuePath
} from '../../../lib/admin-console/content-about-contract';
import { getWriteFieldLabel } from './editor-shell-helpers';

type ContentEditorCapabilities = {
  body: boolean;
  preview: boolean;
  bodyImageInsert: boolean;
  bodyGalleryInsert: boolean;
  imageArray: boolean;
  essayOutline: boolean;
  delete: boolean;
};

export type ContentEditorAdapter = {
  collection: AdminContentWriteCollectionKey;
  capabilities: ContentEditorCapabilities;
  frontmatterIssuePaths: ReadonlySet<string>;
  isFrontmatterIssuePath: (path: string) => boolean;
  cloneValues: (value: AdminContentWorkspaceEditorValues) => AdminContentWorkspaceEditorValues;
  isEqualValues: (left: AdminContentWorkspaceEditorValues | null, right: AdminContentWorkspaceEditorValues | null) => boolean;
  getWriteFieldLabel: (field: string) => string;
  getDeleteTitle: (value: AdminContentWorkspaceEditorValues, entryId: string) => string;
};

const cloneEssayValues = (value: AdminEssayEditorValues): AdminEssayEditorValues => ({
  title: value.title,
  description: value.description,
  date: value.date,
  publishedAt: value.publishedAt,
  tagsText: value.tagsText,
  draft: value.draft,
  archive: value.archive,
  slug: value.slug,
  cover: value.cover,
  badge: value.badge
});

const cloneBitsValues = (value: AdminBitsEditorValues): AdminBitsEditorValues => ({
  title: value.title,
  description: value.description,
  date: value.date,
  tagsText: value.tagsText,
  draft: value.draft,
  authorName: value.authorName,
  authorAvatar: value.authorAvatar,
  imagesText: value.imagesText
});

const cloneMemoValues = (value: AdminMemoEditorValues): AdminMemoEditorValues => ({
  title: value.title,
  subtitle: value.subtitle,
  date: value.date,
  draft: value.draft,
  slug: value.slug
});

const cloneAboutValues = (): AdminAboutEditorValues => ({});

export const isEssayEditorValues = (value: AdminContentWorkspaceEditorValues | null): value is AdminEssayEditorValues =>
  Boolean(value && 'publishedAt' in value && 'archive' in value && 'cover' in value && 'badge' in value);

export const isBitsEditorValues = (value: AdminContentWorkspaceEditorValues | null): value is AdminBitsEditorValues =>
  Boolean(value && 'authorName' in value && 'authorAvatar' in value && 'imagesText' in value);

export const isMemoEditorValues = (value: AdminContentWorkspaceEditorValues | null): value is AdminMemoEditorValues =>
  Boolean(value && 'subtitle' in value && !('description' in value));

export const isAboutEditorValues = (value: AdminContentWorkspaceEditorValues | null): value is AdminAboutEditorValues =>
  Boolean(value && Object.keys(value).length === 0);

const cloneContentEditorValues = (value: AdminContentWorkspaceEditorValues): AdminContentWorkspaceEditorValues => {
  if (isEssayEditorValues(value)) return cloneEssayValues(value);
  if (isBitsEditorValues(value)) return cloneBitsValues(value);
  if (isAboutEditorValues(value)) return cloneAboutValues();
  return cloneMemoValues(value);
};

const isEqualContentEditorValues = (
  left: AdminContentWorkspaceEditorValues | null,
  right: AdminContentWorkspaceEditorValues | null
): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

const getContentWriteFieldLabel = (
  field: string,
  labels: Readonly<Record<string, string>>
): string =>
  labels[field] ?? getWriteFieldLabel(field);

const hasExactFrontmatterIssuePath = (paths: ReadonlySet<string>, path: string): boolean =>
  paths.has(path);

const ESSAY_FRONTMATTER_ISSUE_PATHS = new Set([
  'title',
  'date',
  'publishedAt',
  'description',
  'tags',
  'slug',
  'badge',
  'cover'
]);

const BITS_FRONTMATTER_ISSUE_PATHS = new Set([
  'title',
  'date',
  'description',
  'tags',
  'draft',
  'authorName',
  'authorAvatar',
  'imagesText'
]);

const MEMO_FRONTMATTER_ISSUE_PATHS = new Set<string>();

const isBitsFrontmatterIssuePath = (path: string): boolean =>
  BITS_FRONTMATTER_ISSUE_PATHS.has(path) || path.startsWith('images[');

const ESSAY_FIELD_LABELS: Readonly<Record<string, string>> = {
  title: '标题',
  description: '摘要',
  date: '日期',
  publishedAt: '发布时间',
  tags: '标签',
  draft: '草稿状态',
  archive: '归档状态',
  slug: '链接别名',
  cover: '封面图',
  badge: '徽标',
  body: '正文'
};

const BITS_FIELD_LABELS: Readonly<Record<string, string>> = {
  title: '标题',
  description: '摘要',
  date: '时间',
  tags: '标签',
  draft: '草稿状态',
  authorName: '作者名称',
  authorAvatar: '作者头像',
  author: '作者',
  images: '图片',
  imagesText: '图片',
  body: '正文'
};

const MEMO_FIELD_LABELS: Readonly<Record<string, string>> = {
  title: '标题',
  subtitle: '副标题',
  date: '日期',
  draft: '生产阻断状态',
  slug: '元信息别名',
  body: '正文'
};

const buildContentEditorCapabilities = (
  collection: AdminContentWriteCollectionKey,
  editorCapabilities: Pick<
    ContentEditorCapabilities,
    'body' | 'preview' | 'bodyImageInsert' | 'bodyGalleryInsert' | 'imageArray' | 'essayOutline'
  >
): ContentEditorCapabilities => {
  const collectionCapability = getAdminContentCollectionCapability(collection);
  return {
    ...editorCapabilities,
    delete: collectionCapability.deletable
  };
};

const ESSAY_ADAPTER: ContentEditorAdapter = {
  collection: 'essay',
  capabilities: buildContentEditorCapabilities('essay', {
    body: true,
    preview: true,
    bodyImageInsert: true,
    bodyGalleryInsert: true,
    imageArray: false,
    essayOutline: true
  }),
  frontmatterIssuePaths: ESSAY_FRONTMATTER_ISSUE_PATHS,
  isFrontmatterIssuePath: (path) => hasExactFrontmatterIssuePath(ESSAY_FRONTMATTER_ISSUE_PATHS, path),
  cloneValues: cloneContentEditorValues,
  isEqualValues: isEqualContentEditorValues,
  getWriteFieldLabel: (field) => getContentWriteFieldLabel(field, ESSAY_FIELD_LABELS),
  getDeleteTitle: (value, entryId) => isEssayEditorValues(value) ? value.title || entryId : entryId
};

const BITS_ADAPTER: ContentEditorAdapter = {
  collection: 'bits',
  capabilities: buildContentEditorCapabilities('bits', {
    body: true,
    preview: true,
    bodyImageInsert: false,
    bodyGalleryInsert: false,
    imageArray: true,
    essayOutline: false
  }),
  frontmatterIssuePaths: BITS_FRONTMATTER_ISSUE_PATHS,
  isFrontmatterIssuePath: isBitsFrontmatterIssuePath,
  cloneValues: cloneContentEditorValues,
  isEqualValues: isEqualContentEditorValues,
  getWriteFieldLabel: (field) => getContentWriteFieldLabel(field, BITS_FIELD_LABELS),
  getDeleteTitle: (value, entryId) => isBitsEditorValues(value) ? value.title || entryId : entryId
};

const MEMO_ADAPTER: ContentEditorAdapter = {
  collection: 'memo',
  capabilities: buildContentEditorCapabilities('memo', {
    body: true,
    preview: true,
    bodyImageInsert: true,
    bodyGalleryInsert: false,
    imageArray: false,
    essayOutline: false
  }),
  frontmatterIssuePaths: MEMO_FRONTMATTER_ISSUE_PATHS,
  isFrontmatterIssuePath: (path) => hasExactFrontmatterIssuePath(MEMO_FRONTMATTER_ISSUE_PATHS, path),
  cloneValues: cloneContentEditorValues,
  isEqualValues: isEqualContentEditorValues,
  getWriteFieldLabel: (field) => getContentWriteFieldLabel(field, MEMO_FIELD_LABELS),
  getDeleteTitle: (value, entryId) => isMemoEditorValues(value) ? value.title || entryId : entryId
};

const ABOUT_ADAPTER: ContentEditorAdapter = {
  collection: 'about',
  capabilities: buildContentEditorCapabilities('about', {
    body: true,
    preview: true,
    bodyImageInsert: false,
    bodyGalleryInsert: false,
    imageArray: false,
    essayOutline: false
  }),
  frontmatterIssuePaths: new Set<string>(),
  isFrontmatterIssuePath: isAdminAboutFrontmatterIssuePath,
  cloneValues: cloneContentEditorValues,
  isEqualValues: isEqualContentEditorValues,
  getWriteFieldLabel: getAdminAboutWriteFieldLabel,
  getDeleteTitle: () => '关于'
};

const CONTENT_EDITOR_ADAPTERS = {
  essay: ESSAY_ADAPTER,
  bits: BITS_ADAPTER,
  memo: MEMO_ADAPTER,
  about: ABOUT_ADAPTER
} as const satisfies Record<AdminContentWriteCollectionKey, ContentEditorAdapter>;

export const getContentEditorAdapter = (collection: AdminContentWriteCollectionKey): ContentEditorAdapter =>
  CONTENT_EDITOR_ADAPTERS[collection];
