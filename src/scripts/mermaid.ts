const MERMAID_BLOCK_SELECTOR = '.code-block[data-lang="mermaid"], pre[data-lang="mermaid"]';
const DIAGRAM_SELECTOR = '.mermaid-diagram';

let renderSeq = 0;
let themeObserverStarted = false;
let renderQueued = false;

const getMermaidTheme = () => (
  document.documentElement.dataset.theme === 'dark' ? 'dark' : 'default'
);

const getCodeText = (block: HTMLElement) => {
  const code = block.querySelector('code');
  return (code?.textContent ?? block.textContent ?? '').trim();
};

const convertCodeBlocks = (container: ParentNode) => {
  const blocks = Array.from(container.querySelectorAll<HTMLElement>(MERMAID_BLOCK_SELECTOR));

  for (const block of blocks) {
    if (block.closest(DIAGRAM_SELECTOR)) continue;

    const source = getCodeText(block);
    if (!source) continue;

    const figure = document.createElement('figure');
    figure.className = 'mermaid-diagram';
    figure.dataset.mermaidSource = source;

    const canvas = document.createElement('div');
    canvas.className = 'mermaid-diagram__canvas';
    figure.appendChild(canvas);

    block.replaceWith(figure);
  }
};

const renderDiagrams = async () => {
  const diagrams = Array.from(document.querySelectorAll<HTMLElement>(DIAGRAM_SELECTOR));
  if (!diagrams.length) return;

  const { default: mermaid } = await import('mermaid');
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: getMermaidTheme(),
    flowchart: {
      htmlLabels: false,
      useMaxWidth: true
    },
    sequence: {
      useMaxWidth: true
    }
  });

  for (const diagram of diagrams) {
    const source = diagram.dataset.mermaidSource;
    const canvas = diagram.querySelector<HTMLElement>('.mermaid-diagram__canvas');
    if (!source || !canvas) continue;

    try {
      const id = `mermaid-${Date.now()}-${++renderSeq}`;
      const { svg } = await mermaid.render(id, source);
      canvas.innerHTML = svg;
      diagram.classList.remove('is-error');
      diagram.removeAttribute('data-error');
    } catch (error) {
      canvas.textContent = source;
      diagram.classList.add('is-error');
      diagram.dataset.error = error instanceof Error ? error.message : 'Mermaid render failed';
    }
  }
};

const queueRender = () => {
  if (renderQueued) return;
  renderQueued = true;
  window.requestAnimationFrame(() => {
    renderQueued = false;
    void renderDiagrams();
  });
};

const observeThemeChanges = () => {
  if (themeObserverStarted) return;
  themeObserverStarted = true;

  const observer = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.attributeName === 'data-theme')) {
      queueRender();
    }
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
};

export const initMermaidDiagrams = (container: ParentNode = document) => {
  convertCodeBlocks(container);

  if (!document.querySelector(DIAGRAM_SELECTOR)) return;

  observeThemeChanges();
  queueRender();
};
