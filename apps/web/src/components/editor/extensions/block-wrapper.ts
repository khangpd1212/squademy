import { type Node } from "@tiptap/pm/model";
import { type EditorView } from "@tiptap/pm/view";

type BlockWrapperOptions = {
  onAddBlock?: (pos: number, node: Node) => void;
};

const TAG_MAP: Record<string, (node: Node) => string> = {
  paragraph: () => "div",
  heading: (node) => `h${node.attrs.level}`,
  blockquote: () => "blockquote",
  codeBlock: () => "pre",
  bulletList: () => "ul",
  orderedList: () => "ol",
  table: () => "table",
};

const BLOCK_TYPES = new Set(Object.keys(TAG_MAP));
const NESTED_PARENT_TYPES = ["listItem", "tableRow", "doc", "bulletList", "orderedList"];

function isNestedChildPosition(pos: number, doc: Node): boolean {
  const $pos = doc.resolve(pos);
  if ($pos.depth < 1) return false;
  console.log("🚀 ~ isNestedChildPosition ~ $pos.node($pos.depth - 1).type.name:", $pos.node($pos.depth - 1).type.name)
  return NESTED_PARENT_TYPES.includes($pos.node($pos.depth - 1).type.name);
}

function createBlockHandle(
  node: Node,
  getPos: () => number | undefined,
  options: BlockWrapperOptions,
): HTMLDivElement {
  const handle = document.createElement("div");
  handle.className = "block-handle";
  handle.contentEditable = "false";
  handle.setAttribute("aria-hidden", "true");
  handle.draggable = true;

  const addBtn = document.createElement("button");
  addBtn.className = "block-handle-btn block-handle-add";
  addBtn.type = "button";
  addBtn.tabIndex = -1;
  addBtn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  addBtn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getPos();
    if (pos !== undefined) {
      options.onAddBlock?.(pos, node);
    }
  });

  const dragBtn = document.createElement("button"); 
  dragBtn.className = "block-handle-btn block-handle-drag";
  dragBtn.type = "button";
  dragBtn.tabIndex = -1;
  dragBtn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/><circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/></svg>';
  dragBtn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  handle.appendChild(addBtn);
  handle.appendChild(dragBtn);

  return handle;
}

function buildContentDOM(type: string, node: Node): HTMLElement {
  const tag = TAG_MAP[type](node);
  const contentDOM = document.createElement(tag);
  if (type === "paragraph") {
    contentDOM.className = "content-editable-leaf-rtl";
    contentDOM.setAttribute("placeholder", "Press ‘space’ for AI or ‘/’ for commands");
  }
  if (type === "heading") {
    contentDOM.className = "content-editable-leaf-rtl";
    const level = node.attrs.level as number;
    const labels: Record<number, string> = {
      1: "Heading 1",
      2: "Heading 2",
      3: "Heading 3",
    };
    contentDOM.setAttribute("placeholder", labels[level] ?? "Heading");
  }
  return contentDOM;
}

export function createBlockNodeViews(options: BlockWrapperOptions) {
  const nodeViews: Record<string, (...args: unknown[]) => { dom: HTMLElement; contentDOM: HTMLElement }> = {};

  for (const type of BLOCK_TYPES) {
    nodeViews[type] = (_node: unknown, _view: unknown, getPos: unknown) => {
      const node = _node as Node;
      const getPosition = getPos as () => number | undefined;
      const view = _view as EditorView;
      const pos = getPosition();
      const skipWrapper = pos !== undefined && isNestedChildPosition(pos, view.state.doc);

      if (skipWrapper) {
        const contentDOM = buildContentDOM(type, node);
        return { dom: contentDOM, contentDOM };
      }

      const contentDOM = buildContentDOM(type, node);
      const container = document.createElement("div");
      container.className = "block-wrapper";

      const handle = createBlockHandle(node, getPosition, options);
      container.appendChild(handle);
      container.appendChild(contentDOM);

      return {
        dom: container,
        contentDOM,
      };
    };
  }

  return nodeViews;
}
