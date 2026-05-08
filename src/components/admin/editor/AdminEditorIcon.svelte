<script lang="ts">
import Bold from '@lucide/svelte/icons/bold';
import Braces from '@lucide/svelte/icons/braces';
import CodeXml from '@lucide/svelte/icons/code-xml';
import Heading2 from '@lucide/svelte/icons/heading-2';
import Image from '@lucide/svelte/icons/image';
import ImagePlus from '@lucide/svelte/icons/image-plus';
import Italic from '@lucide/svelte/icons/italic';
import Link from '@lucide/svelte/icons/link';
import List from '@lucide/svelte/icons/list';
import ListCheck from '@lucide/svelte/icons/list-check';
import ListOrdered from '@lucide/svelte/icons/list-ordered';
import Quote from '@lucide/svelte/icons/quote';
import Table2 from '@lucide/svelte/icons/table-2';
import Upload from '@lucide/svelte/icons/upload';
import X from '@lucide/svelte/icons/x';

const icons = {
  bold: Bold,
  close: X,
  code: CodeXml,
  'code-block': Braces,
  heading: Heading2,
  image: Image,
  'image-plus': ImagePlus,
  italic: Italic,
  link: Link,
  list: List,
  'ordered-list': ListOrdered,
  quote: Quote,
  table: Table2,
  'task-list': ListCheck,
  upload: Upload
} as const;

type AdminEditorIconName = keyof typeof icons;

type Props = {
  name: AdminEditorIconName;
  size?: number;
  strokeWidth?: number;
  class?: string;
  ariaHidden?: boolean;
};

let {
  name,
  size = 16,
  strokeWidth = 2,
  class: className = '',
  ariaHidden = true
}: Props = $props();

const IconComponent = $derived(icons[name]);
</script>

<IconComponent
  {size}
  {strokeWidth}
  class={className}
  aria-hidden={ariaHidden ? 'true' : undefined}
/>
