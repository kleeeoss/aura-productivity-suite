import type { MindMapNode } from '../types';

export interface LayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  horizontalSpacing?: number;
  verticalSpacing?: number;
  manualPositions?: Record<string, { x: number; y: number }>;
}

export interface ComputedNode extends MindMapNode {
  x: number;
  y: number;
  width: number;
  height: number;
  side: 'left' | 'right';
  children: ComputedNode[];
}

export interface ConnectorLine {
  id: string;
  sourceId: string;
  targetId: string;
  path: string;
  color?: string;
}

export interface LayoutResult {
  root: ComputedNode;
  nodes: ComputedNode[];
  connectors: ConnectorLine[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
}

/**
 * Measures estimated dimensions for a node based on text length and level
 */
export function measureNode(node: MindMapNode): { width: number; height: number } {
  const charLength = Math.max(node.text.length, 6);
  // Root node is slightly larger and bolder
  if (node.level === 0) {
    const width = Math.min(320, Math.max(140, charLength * 11 + 40));
    return { width, height: 48 };
  }
  if (node.level === 1) {
    const width = Math.min(260, Math.max(110, charLength * 9 + 34));
    return { width, height: 40 };
  }
  const width = Math.min(240, Math.max(90, charLength * 8 + 30));
  return { width, height: 36 };
}

/**
 * Calculates auto-layout positions for a MindMap tree in a balanced two-sided horizontal orientation.
 * Supports manual position overrides from frontmatter metadata and handles collapsed branches.
 */
export function computeMindMapLayout(
  rawRoot: MindMapNode,
  options: LayoutOptions = {}
): LayoutResult {
  const {
    horizontalSpacing = 80,
    verticalSpacing = 28,
    manualPositions = {},
  } = options;

  // First pass: deep clone and assign measured sizes
  function cloneTree(node: MindMapNode, side: 'left' | 'right' = 'right'): ComputedNode {
    const { width, height } = measureNode(node);
    const manual = manualPositions[node.id];
    return {
      ...node,
      width,
      height,
      side,
      x: manual ? manual.x : 0,
      y: manual ? manual.y : 0,
      children: (node.isCollapsed ? [] : node.children).map((child) =>
        cloneTree(child, side)
      ),
    };
  }

  const root = cloneTree(rawRoot, 'right');
  const manualRoot = manualPositions[root.id];
  root.x = manualRoot ? manualRoot.x : 0;
  root.y = manualRoot ? manualRoot.y : 0;

  // Partition top-level branches into Right and Left sides
  const rightChildren: ComputedNode[] = [];
  const leftChildren: ComputedNode[] = [];

  root.children.forEach((child, idx) => {
    // If fewer than 2 children, put on right; otherwise alternate
    if (root.children.length === 1 || idx % 2 === 0) {
      child.side = 'right';
      setSubtreeSide(child, 'right');
      rightChildren.push(child);
    } else {
      child.side = 'left';
      setSubtreeSide(child, 'left');
      leftChildren.push(child);
    }
  });

  function setSubtreeSide(node: ComputedNode, side: 'left' | 'right') {
    node.side = side;
    node.children.forEach((c) => setSubtreeSide(c, side));
  }

  // Calculate subtree vertical heights for layout
  function getSubtreeHeight(node: ComputedNode): number {
    if (node.children.length === 0) {
      return node.height;
    }
    const childrenHeight = node.children.reduce(
      (sum, child) => sum + getSubtreeHeight(child),
      0
    );
    const gaps = (node.children.length - 1) * verticalSpacing;
    return Math.max(node.height, childrenHeight + gaps);
  }

  // Position a side's branches recursively
  function positionSubtree(
    node: ComputedNode,
    startX: number,
    startY: number,
    side: 'left' | 'right'
  ) {
    if (!manualPositions[node.id]) {
      node.x = startX;
      node.y = startY;
    }

    if (node.children.length === 0) return;

    const totalHeight = getSubtreeHeight(node);
    let currentY = node.y - totalHeight / 2;

    for (const child of node.children) {
      const childSubtreeHeight = getSubtreeHeight(child);
      const childY = currentY + childSubtreeHeight / 2;
      const childX =
        side === 'right'
          ? node.x + node.width / 2 + horizontalSpacing + child.width / 2
          : node.x - node.width / 2 - horizontalSpacing - child.width / 2;

      positionSubtree(child, childX, childY, side);
      currentY += childSubtreeHeight + verticalSpacing;
    }
  }

  // Position Right Side
  if (rightChildren.length > 0) {
    const totalRightHeight = rightChildren.reduce(
      (sum, c) => sum + getSubtreeHeight(c),
      0
    ) + (rightChildren.length - 1) * verticalSpacing;

    let currentY = root.y - totalRightHeight / 2;
    for (const child of rightChildren) {
      const h = getSubtreeHeight(child);
      const childY = currentY + h / 2;
      const childX = root.x + root.width / 2 + horizontalSpacing + child.width / 2;
      positionSubtree(child, childX, childY, 'right');
      currentY += h + verticalSpacing;
    }
  }

  // Position Left Side
  if (leftChildren.length > 0) {
    const totalLeftHeight = leftChildren.reduce(
      (sum, c) => sum + getSubtreeHeight(c),
      0
    ) + (leftChildren.length - 1) * verticalSpacing;

    let currentY = root.y - totalLeftHeight / 2;
    for (const child of leftChildren) {
      const h = getSubtreeHeight(child);
      const childY = currentY + h / 2;
      const childX = root.x - root.width / 2 - horizontalSpacing - child.width / 2;
      positionSubtree(child, childX, childY, 'left');
      currentY += h + verticalSpacing;
    }
  }

  // Collect all flattened nodes and compute connectors
  const allNodes: ComputedNode[] = [];
  const connectors: ConnectorLine[] = [];

  let minX = root.x - root.width / 2;
  let maxX = root.x + root.width / 2;
  let minY = root.y - root.height / 2;
  let maxY = root.y + root.height / 2;

  function traverse(node: ComputedNode, parent?: ComputedNode) {
    allNodes.push(node);

    const left = node.x - node.width / 2;
    const right = node.x + node.width / 2;
    const top = node.y - node.height / 2;
    const bottom = node.y + node.height / 2;

    if (left < minX) minX = left;
    if (right > maxX) maxX = right;
    if (top < minY) minY = top;
    if (bottom > maxY) maxY = bottom;

    if (parent) {
      // Create smooth cubic bezier connector between parent and child
      const isRight = node.x >= parent.x;
      const startX = isRight ? parent.x + parent.width / 2 : parent.x - parent.width / 2;
      const startY = parent.y;
      const endX = isRight ? node.x - node.width / 2 : node.x + node.width / 2;
      const endY = node.y;

      const deltaX = Math.abs(endX - startX) * 0.55;
      const cp1X = isRight ? startX + deltaX : startX - deltaX;
      const cp2X = isRight ? endX - deltaX : endX + deltaX;

      const path = `M ${startX} ${startY} C ${cp1X} ${startY}, ${cp2X} ${endY}, ${endX} ${endY}`;

      connectors.push({
        id: `conn-${parent.id}-${node.id}`,
        sourceId: parent.id,
        targetId: node.id,
        path,
        color: node.color,
      });
    }

    for (const child of node.children) {
      traverse(child, node);
    }
  }

  traverse(root);

  const padding = 60;
  const bounds = {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };

  return { root, nodes: allNodes, connectors, bounds };
}
