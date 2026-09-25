import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { MindMapNode, MindMapLayoutMetadata } from '../types';
import { markdownToMindMap, extractWikiLink } from './markdownToMindMap';
import { mindMapToMarkdown } from './mindMapToMarkdown';
import { computeMindMapLayout, type ComputedNode, type LayoutResult } from './layoutEngine';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Plus,
  Trash2,
  Search,
  Download,
  Share2,
} from 'lucide-react';

export interface MindMapCanvasProps {
  content: string;
  noteTitle?: string;
  frontmatter?: Record<string, unknown>;
  onContentChange?: (newContent: string) => void;
  onLayoutChange?: (layout: MindMapLayoutMetadata) => void;
  onNavigateWikiLink?: (noteTitleOrPath: string) => void;
  className?: string;
}

export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({
  content,
  noteTitle = 'Mind Map',
  frontmatter = {},
  onContentChange,
  onLayoutChange,
  onNavigateWikiLink,
  className = '',
}) => {
  // 1. Initial State parsing from Markdown content
  const [tree, setTree] = useState<MindMapNode>(() =>
    markdownToMindMap(content, noteTitle)
  );

  // Layout metadata from note frontmatter (sidecar positions & collapsed branches)
  const initialLayout = (frontmatter.mindmapLayout as MindMapLayoutMetadata) || {};
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(
    () => initialLayout.positions || {}
  );
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(
    () => new Set(initialLayout.collapsed || [])
  );

  // Viewport navigation
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Interaction states
  const [selectedId, setSelectedId] = useState<string | null>('root');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Refs for dragging and pan
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const draggingNodeRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    hasMoved: boolean;
  } | null>(null);

  const lastCommittedMarkdownRef = useRef<string | null>(null);

  // Sync tree with content changes if content changes externally
  useEffect(() => {
    if (lastCommittedMarkdownRef.current === content) {
      return;
    }
    lastCommittedMarkdownRef.current = null;
    const parsed = markdownToMindMap(content, noteTitle);
    setTree(parsed);
  }, [content, noteTitle]);

  // Apply collapsed states recursively onto the tree
  const applyCollapsedState = useCallback(
    (node: MindMapNode): MindMapNode => {
      const isCollapsed = collapsedIds.has(node.id);
      return {
        ...node,
        isCollapsed,
        children: node.children.map(applyCollapsedState),
      };
    },
    [collapsedIds]
  );

  const activeTreeWithCollapse = useMemo(() => {
    return applyCollapsedState(tree);
  }, [tree, applyCollapsedState]);

  // Compute Layout (Nodes, Connectors, Bounding Box)
  const layout: LayoutResult = useMemo(() => {
    return computeMindMapLayout(activeTreeWithCollapse, {
      manualPositions: positions,
      horizontalSpacing: 90,
      verticalSpacing: 30,
    });
  }, [activeTreeWithCollapse, positions]);

  // Search matches
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase().trim();
    const matched = new Set<string>();

    function searchInNode(node: MindMapNode) {
      if (node.text.toLowerCase().includes(q)) {
        matched.add(node.id);
      }
      for (const child of node.children) {
        searchInNode(child);
      }
    }

    searchInNode(tree);
    return matched;
  }, [tree, searchQuery]);

  // Sync tree updates back to Markdown
  const commitTreeChange = (newTree: MindMapNode) => {
    setTree(newTree);
    if (onContentChange) {
      const markdown = mindMapToMarkdown(newTree);
      lastCommittedMarkdownRef.current = markdown;
      onContentChange(markdown);
    }
  };

  // Sync layout positions or collapsed states to parent/frontmatter
  const persistLayout = (
    newPositions: Record<string, { x: number; y: number }>,
    newCollapsed: Set<string>
  ) => {
    if (onLayoutChange) {
      onLayoutChange({
        positions: newPositions,
        collapsed: Array.from(newCollapsed),
        zoom,
        pan,
      });
    }
  };

  // Viewport centering on initial render
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPan({ x: rect.width / 2, y: rect.height / 2 });
    }
  }, []);

  // -------------------------------------------------------------
  // Pan and Zoom Controls
  // -------------------------------------------------------------
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(3.0, Math.max(0.2, zoom * zoomFactor));

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setPan((prev) => ({
        x: mouseX - (mouseX - prev.x) * (newZoom / zoom),
        y: mouseY - (mouseY - prev.y) * (newZoom / zoom),
      }));
    }
    setZoom(newZoom);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(3.0, z * 1.2));
  const handleZoomOut = () => setZoom((z) => Math.max(0.2, z / 1.2));
  const handleResetZoom = () => {
    setZoom(1);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPan({ x: rect.width / 2, y: rect.height / 2 });
    }
  };

  const handleFitView = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const bounds = layout.bounds;
    const padding = 80;

    const scaleX = (rect.width - padding) / Math.max(bounds.width, 200);
    const scaleY = (rect.height - padding) / Math.max(bounds.height, 200);
    const fitScale = Math.min(2.0, Math.max(0.3, Math.min(scaleX, scaleY)));

    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;

    setZoom(fitScale);
    setPan({
      x: rect.width / 2 - centerX * fitScale,
      y: rect.height / 2 - centerY * fitScale,
    });
  };

  const handleAutoLayout = () => {
    setPositions({});
    persistLayout({}, collapsedIds);
    handleFitView();
  };

  const handleFocusMatchedNode = () => {
    if (searchMatches.size === 0 || !containerRef.current) return;
    const firstMatchedId = Array.from(searchMatches)[0];

    // Helper to find ancestor path
    function findAncestors(current: MindMapNode, targetId: string, path: string[] = []): string[] | null {
      if (current.id === targetId) return path;
      for (const child of current.children) {
        const res = findAncestors(child, targetId, [...path, current.id]);
        if (res) return res;
      }
      return null;
    }

    const ancestors = findAncestors(tree, firstMatchedId);
    let activeCollapsed = collapsedIds;
    if (ancestors && ancestors.length > 0) {
      let changed = false;
      const updated = new Set(collapsedIds);
      for (const ancId of ancestors) {
        if (updated.has(ancId)) {
          updated.delete(ancId);
          changed = true;
        }
      }
      if (changed) {
        activeCollapsed = updated;
        setCollapsedIds(updated);
        persistLayout(positions, updated);
      }
    }

    setSelectedId(firstMatchedId);

    // Center node in viewport (using uncollapsed tree state)
    const activeNodes = computeMindMapLayout(
      (function expand(node: MindMapNode): MindMapNode {
        return {
          ...node,
          isCollapsed: activeCollapsed.has(node.id),
          children: node.children.map(expand),
        };
      })(tree),
      {
        manualPositions: positions,
        horizontalSpacing: 90,
        verticalSpacing: 30,
      }
    ).nodes;

    const target = activeNodes.find((n) => n.id === firstMatchedId);
    if (target && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPan({
        x: rect.width / 2 - target.x * zoom,
        y: rect.height / 2 - target.y * zoom,
      });
    }
  };

  // -------------------------------------------------------------
  // Node Dragging & Canvas Panning
  // -------------------------------------------------------------
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking canvas background (middle click or left click)
    if (e.button === 0 || e.button === 1) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, node: ComputedNode) => {
    e.stopPropagation();
    setSelectedId(node.id);

    draggingNodeRef.current = {
      id: node.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: node.x,
      initialY: node.y,
      hasMoved: false,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeRef.current) {
      const drag = draggingNodeRef.current;
      const dx = (e.clientX - drag.startX) / zoom;
      const dy = (e.clientY - drag.startY) / zoom;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        drag.hasMoved = true;
      }

      const updated = {
        ...positions,
        [drag.id]: {
          x: Math.round(drag.initialX + dx),
          y: Math.round(drag.initialY + dy),
        },
      };
      setPositions(updated);
      return;
    }

    if (isPanningRef.current) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    if (draggingNodeRef.current) {
      if (draggingNodeRef.current.hasMoved) {
        persistLayout(positions, collapsedIds);
      }
      draggingNodeRef.current = null;
    }
    isPanningRef.current = false;
  };

  // -------------------------------------------------------------
  // Node Editing, Adding & Deleting Operations
  // -------------------------------------------------------------
  const startEditing = (node: MindMapNode) => {
    setEditingId(node.id);
    setEditText(node.text);
  };

  const commitEditing = () => {
    if (!editingId) return;
    const trimmed = editText.trim() || 'Untitled';

    function updateTextInTree(n: MindMapNode): MindMapNode {
      if (n.id === editingId) {
        return {
          ...n,
          text: trimmed,
          wikiLink: extractWikiLink(trimmed),
        };
      }
      return {
        ...n,
        children: n.children.map(updateTextInTree),
      };
    }

    const updated = updateTextInTree(tree);
    commitTreeChange(updated);
    setEditingId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleAddChild = () => {
    if (!selectedId) return;

    let newChildId = '';
    function addChildToNode(n: MindMapNode): MindMapNode {
      if (n.id === selectedId) {
        const childIdx = n.children.length;
        newChildId = n.id === 'root' ? `node-${childIdx}` : `${n.id}-${childIdx}`;
        const newChild: MindMapNode = {
          id: newChildId,
          text: 'New Idea',
          level: n.level + 1,
          children: [],
        };
        // Ensure parent is not collapsed when adding child
        if (collapsedIds.has(n.id)) {
          const newCollapsed = new Set(collapsedIds);
          newCollapsed.delete(n.id);
          setCollapsedIds(newCollapsed);
          persistLayout(positions, newCollapsed);
        }
        return {
          ...n,
          children: [...n.children, newChild],
        };
      }
      return {
        ...n,
        children: n.children.map(addChildToNode),
      };
    }

    const updated = addChildToNode(tree);
    commitTreeChange(updated);
    if (newChildId) {
      setSelectedId(newChildId);
      setEditingId(newChildId);
      setEditText('New Idea');
    }
  };

  const handleAddSibling = () => {
    if (!selectedId || selectedId === 'root') {
      handleAddChild();
      return;
    }

    let newSiblingId = '';
    function addSiblingToNode(parent: MindMapNode): MindMapNode {
      const idx = parent.children.findIndex((c) => c.id === selectedId);
      if (idx !== -1) {
        const nextChildren = [...parent.children];
        const newIdx = nextChildren.length;
        newSiblingId = parent.id === 'root' ? `node-${newIdx}` : `${parent.id}-${newIdx}`;
        const newSibling: MindMapNode = {
          id: newSiblingId,
          text: 'New Sibling',
          level: parent.children[idx].level,
          children: [],
        };
        nextChildren.splice(idx + 1, 0, newSibling);
        return {
          ...parent,
          children: nextChildren,
        };
      }
      return {
        ...parent,
        children: parent.children.map(addSiblingToNode),
      };
    }

    const updated = addSiblingToNode(tree);
    commitTreeChange(updated);
    if (newSiblingId) {
      setSelectedId(newSiblingId);
      setEditingId(newSiblingId);
      setEditText('New Sibling');
    }
  };

  const handleDeleteNode = () => {
    if (!selectedId) return;

    if (selectedId === 'root') {
      // Reset root node
      const resetRoot: MindMapNode = {
        id: 'root',
        text: 'Central Idea',
        level: 0,
        children: [],
      };
      commitTreeChange(resetRoot);
      setSelectedId('root');
      return;
    }

    let parentId = 'root';
    function removeNode(parent: MindMapNode): MindMapNode {
      const hasTarget = parent.children.some((c) => c.id === selectedId);
      if (hasTarget) {
        parentId = parent.id;
        return {
          ...parent,
          children: parent.children.filter((c) => c.id !== selectedId),
        };
      }
      return {
        ...parent,
        children: parent.children.map(removeNode),
      };
    }

    const updated = removeNode(tree);
    commitTreeChange(updated);
    setSelectedId(parentId);
  };

  const handleToggleCollapse = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(collapsedIds);
    if (next.has(nodeId)) {
      next.delete(nodeId);
    } else {
      next.add(nodeId);
    }
    setCollapsedIds(next);
    persistLayout(positions, next);
  };

  // Keyboard Navigation & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if (
        editingId ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        handleAddChild();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleAddSibling();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteNode();
      } else if (e.key === 'F2') {
        e.preventDefault();
        const selected = layout.nodes.find((n) => n.id === selectedId);
        if (selected) startEditing(selected);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedId(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('mindmap-search-input');
        searchInput?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // -------------------------------------------------------------
  // Export SVG / PNG
  // -------------------------------------------------------------
  const handleExportSvg = () => {
    if (!svgRef.current) return;
    setIsExporting(true);

    try {
      const bounds = layout.bounds;
      const clone = svgRef.current.cloneNode(true) as SVGSVGElement;

      // Reset the viewport transform so exported graphics are not shifted by interactive pan/zoom
      const viewportGroup = clone.querySelector('.mindmap-viewport');
      if (viewportGroup) {
        viewportGroup.setAttribute('transform', 'translate(0, 0) scale(1)');
      }

      // Remove the interactive background grid pattern
      const gridRect = clone.querySelector('rect[fill="url(#mindmap-grid)"]');
      if (gridRect) {
        gridRect.remove();
      }

      // Extract Multiverse active theme tokens from DOM
      const computed = window.getComputedStyle(containerRef.current || document.body);
      const accentPrimary = computed.getPropertyValue('--accent-primary').trim() || '#6366f1';
      const accentSecondary = computed.getPropertyValue('--accent-secondary').trim() || '#ec4899';
      const textPrimary = computed.getPropertyValue('--text-primary').trim() || '#ffffff';
      const glassBg = computed.getPropertyValue('--glass-bg').trim() || '#0f172a';
      const glassBorder = computed.getPropertyValue('--glass-border').trim() || 'rgba(255, 255, 255, 0.16)';
      const fontFamily = computed.getPropertyValue('--font-family').trim() || 'sans-serif';

      // Inject resolved theme styles into defs so external viewers render theme tokens accurately
      const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      styleEl.textContent = `
        :root, svg {
          --accent-primary: ${accentPrimary};
          --accent-secondary: ${accentSecondary};
          --text-primary: ${textPrimary};
          --glass-bg: ${glassBg};
          --glass-border: ${glassBorder};
          --font-family: ${fontFamily};
        }
      `;
      clone.querySelector('defs')?.appendChild(styleEl);

      // Add a background solid rect spanning the layout bounds
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('x', `${bounds.minX}`);
      bgRect.setAttribute('y', `${bounds.minY}`);
      bgRect.setAttribute('width', `${bounds.width}`);
      bgRect.setAttribute('height', `${bounds.height}`);
      bgRect.setAttribute('fill', '#0f172a');
      clone.insertBefore(bgRect, viewportGroup || clone.firstChild);

      // Set fixed viewBox matching tree bounds
      clone.setAttribute(
        'viewBox',
        `${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`
      );
      clone.setAttribute('width', `${bounds.width}`);
      clone.setAttribute('height', `${bounds.height}`);

      const xml = new XMLSerializer().serializeToString(clone);
      const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${noteTitle.replace(/\s+/g, '_')}_mindmap.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPng = () => {
    if (!svgRef.current) return;
    setIsExporting(true);

    try {
      const bounds = layout.bounds;
      const clone = svgRef.current.cloneNode(true) as SVGSVGElement;

      const viewportGroup = clone.querySelector('.mindmap-viewport');
      if (viewportGroup) {
        viewportGroup.setAttribute('transform', 'translate(0, 0) scale(1)');
      }

      const gridRect = clone.querySelector('rect[fill="url(#mindmap-grid)"]');
      if (gridRect) {
        gridRect.remove();
      }

      const computed = window.getComputedStyle(containerRef.current || document.body);
      const accentPrimary = computed.getPropertyValue('--accent-primary').trim() || '#6366f1';
      const accentSecondary = computed.getPropertyValue('--accent-secondary').trim() || '#ec4899';
      const textPrimary = computed.getPropertyValue('--text-primary').trim() || '#ffffff';
      const glassBg = computed.getPropertyValue('--glass-bg').trim() || '#0f172a';
      const glassBorder = computed.getPropertyValue('--glass-border').trim() || 'rgba(255, 255, 255, 0.16)';
      const fontFamily = computed.getPropertyValue('--font-family').trim() || 'sans-serif';

      const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      styleEl.textContent = `
        :root, svg {
          --accent-primary: ${accentPrimary};
          --accent-secondary: ${accentSecondary};
          --text-primary: ${textPrimary};
          --glass-bg: ${glassBg};
          --glass-border: ${glassBorder};
          --font-family: ${fontFamily};
        }
      `;
      clone.querySelector('defs')?.appendChild(styleEl);

      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('x', `${bounds.minX}`);
      bgRect.setAttribute('y', `${bounds.minY}`);
      bgRect.setAttribute('width', `${bounds.width}`);
      bgRect.setAttribute('height', `${bounds.height}`);
      bgRect.setAttribute('fill', '#0f172a');
      clone.insertBefore(bgRect, viewportGroup || clone.firstChild);

      clone.setAttribute(
        'viewBox',
        `${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`
      );
      clone.setAttribute('width', `${bounds.width}`);
      clone.setAttribute('height', `${bounds.height}`);

      const xml = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = bounds.width * 2; // 2x retina export
        canvas.height = bounds.height * 2;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const pngUrl = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = `${noteTitle.replace(/\s+/g, '_')}_mindmap.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);
        setIsExporting(false);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        setIsExporting(false);
      };
      img.src = url;
    } catch {
      setIsExporting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`mindmap-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        background: 'var(--glass-bg, rgba(15, 23, 42, 0.72))',
        borderRadius: 'var(--shape-radius-sm, 8px)',
        border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.12))',
        userSelect: 'none',
      }}
      onWheel={handleWheel}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Mind Map Canvas Toolbar */}
      <div
        className="mindmap-toolbar"
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        {/* Left Action Buttons: Add Child, Add Sibling, Delete */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--glass-bg, rgba(30, 41, 59, 0.85))',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.12))',
            borderRadius: 'var(--shape-radius-sm, 8px)',
            padding: '4px',
            pointerEvents: 'auto',
            boxShadow: 'var(--glass-shadow, 0 4px 16px rgba(0,0,0,0.3))',
          }}
        >
          <button
            className="glass-button"
            style={{ padding: '6px 10px', fontSize: '0.8rem', border: 'none' }}
            onClick={handleAddChild}
            title="Add Child Node (Tab)"
          >
            <Plus size={14} style={{ marginRight: '4px' }} /> Child
          </button>
          <button
            className="glass-button"
            style={{ padding: '6px 10px', fontSize: '0.8rem', border: 'none' }}
            onClick={handleAddSibling}
            title="Add Sibling Node (Enter)"
          >
            <Plus size={14} style={{ marginRight: '4px' }} /> Sibling
          </button>
          <button
            className="glass-button"
            style={{
              padding: '6px 10px',
              fontSize: '0.8rem',
              border: 'none',
              color: 'var(--danger, #ef4444)',
            }}
            onClick={handleDeleteNode}
            title="Delete Selected Node (Del)"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Center: Search / Filter Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--glass-bg, rgba(30, 41, 59, 0.85))',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.12))',
            borderRadius: 'var(--shape-radius-sm, 8px)',
            padding: '4px 8px',
            pointerEvents: 'auto',
            boxShadow: 'var(--glass-shadow, 0 4px 16px rgba(0,0,0,0.3))',
          }}
        >
          <Search size={14} style={{ color: 'var(--text-secondary)' }} />
          <input
            id="mindmap-search-input"
            type="text"
            className="glass-input"
            placeholder="Search nodes..."
            style={{
              border: 'none',
              background: 'transparent',
              padding: '4px 6px',
              fontSize: '0.82rem',
              width: '130px',
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFocusMatchedNode();
            }}
          />
          {searchMatches.size > 0 && (
            <button
              className="glass-button primary"
              style={{ padding: '3px 8px', fontSize: '0.75rem', borderRadius: '4px' }}
              onClick={handleFocusMatchedNode}
              title="Focus on first search match"
            >
              Focus ({searchMatches.size})
            </button>
          )}
        </div>

        {/* Right: Export & View Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--glass-bg, rgba(30, 41, 59, 0.85))',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.12))',
            borderRadius: 'var(--shape-radius-sm, 8px)',
            padding: '4px',
            pointerEvents: 'auto',
            boxShadow: 'var(--glass-shadow, 0 4px 16px rgba(0,0,0,0.3))',
          }}
        >
          <button
            className="glass-button"
            style={{ padding: '6px', border: 'none' }}
            onClick={handleZoomIn}
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
          <button
            className="glass-button"
            style={{ padding: '6px', border: 'none' }}
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <button
            className="glass-button"
            style={{ padding: '6px', border: 'none' }}
            onClick={handleResetZoom}
            title="Reset Zoom (100%)"
          >
            <RotateCcw size={15} />
          </button>
          <button
            className="glass-button"
            style={{ padding: '6px', border: 'none' }}
            onClick={handleFitView}
            title="Fit to Canvas"
          >
            <Maximize2 size={15} />
          </button>
          <button
            className="glass-button"
            style={{ padding: '6px', border: 'none' }}
            onClick={handleAutoLayout}
            title="Reset Auto Layout"
          >
            <Share2 size={15} />
          </button>
          <div style={{ width: '1px', height: '18px', background: 'var(--glass-border)', margin: '0 2px' }} />
          <button
            className="glass-button"
            style={{ padding: '6px 8px', fontSize: '0.78rem', border: 'none' }}
            onClick={handleExportSvg}
            disabled={isExporting}
            title="Export as Vector SVG"
          >
            <Download size={14} style={{ marginRight: '4px' }} /> SVG
          </button>
          <button
            className="glass-button"
            style={{ padding: '6px 8px', fontSize: '0.78rem', border: 'none' }}
            onClick={handleExportPng}
            disabled={isExporting}
            title="Export as PNG Image"
          >
            <Download size={14} style={{ marginRight: '4px' }} /> PNG
          </button>
        </div>
      </div>

      {/* SVG Canvas Workspace */}
      <svg
        ref={svgRef}
        className="mindmap-svg"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          cursor: isPanningRef.current ? 'grabbing' : 'grab',
        }}
      >
        <defs>
          {/* Subtle grid pattern background */}
          <pattern id="mindmap-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1.2" fill="var(--glass-border, rgba(255,255,255,0.12))" opacity="0.6" />
          </pattern>
          {/* Glow filter for selected/searched nodes */}
          <filter id="node-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="var(--accent-primary, #6366f1)" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Background Grid */}
        <rect width="100%" height="100%" fill="url(#mindmap-grid)" />

        {/* Transformed Pan & Zoom Group */}
        <g className="mindmap-viewport" transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* 1. Connecting Bezier Lines */}
          <g className="mindmap-connectors">
            {layout.connectors.map((conn) => (
              <path
                key={conn.id}
                d={conn.path}
                fill="none"
                stroke="var(--accent-primary, #6366f1)"
                strokeWidth={2}
                strokeOpacity={0.65}
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* 2. Mind Map Nodes */}
          <g className="mindmap-nodes">
            {layout.nodes.map((node) => {
              const isSelected = selectedId === node.id;
              const isMatched = searchMatches.has(node.id);
              const isRoot = node.level === 0;
              const isBranch = node.level === 1;
              const hasChildren = node.children.length > 0 || collapsedIds.has(node.id);
              const isCollapsed = collapsedIds.has(node.id);
              const isEditing = editingId === node.id;

              // Multiverse dynamic theme node colors
              const nodeBg = isRoot
                ? 'var(--accent-primary, #6366f1)'
                : 'var(--glass-bg, rgba(30, 41, 59, 0.92))';
              const nodeBorder = isSelected
                ? 'var(--accent-primary, #6366f1)'
                : isMatched
                ? '#f59e0b'
                : isBranch
                ? 'var(--accent-secondary, #ec4899)'
                : 'var(--glass-border, rgba(255, 255, 255, 0.16))';
              const textColor = isRoot
                ? '#ffffff'
                : 'var(--text-primary, #f8fafc)';
              const borderWidth = isSelected ? 3 : isMatched ? 2.5 : isBranch ? 2 : 1;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  style={{ cursor: 'pointer' }}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startEditing(node);
                  }}
                >
                  {/* Node Background Rectangle */}
                  <rect
                    x={-node.width / 2}
                    y={-node.height / 2}
                    width={node.width}
                    height={node.height}
                    rx={isRoot ? 12 : 8}
                    ry={isRoot ? 12 : 8}
                    fill={nodeBg}
                    stroke={nodeBorder}
                    strokeWidth={borderWidth}
                    filter={isSelected ? 'url(#node-glow)' : undefined}
                    style={{
                      transition: draggingNodeRef.current?.id === node.id ? 'none' : 'all 0.15s ease',
                      boxShadow: 'var(--glass-shadow)',
                    }}
                  />

                  {/* Node Text or Inline Editor */}
                  {isEditing ? (
                    <foreignObject
                      x={-node.width / 2 + 6}
                      y={-node.height / 2 + 4}
                      width={node.width - 12}
                      height={node.height - 8}
                    >
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={commitEditing}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === 'Enter') commitEditing();
                          if (e.key === 'Escape') cancelEditing();
                        }}
                        autoFocus
                        style={{
                          width: '100%',
                          height: '100%',
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          color: textColor,
                          fontFamily: 'inherit',
                          fontSize: isRoot ? '1rem' : '0.88rem',
                          fontWeight: isRoot ? 'bold' : 'normal',
                          textAlign: 'center',
                          padding: 0,
                        }}
                      />
                    </foreignObject>
                  ) : (
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={textColor}
                      fontSize={isRoot ? 15 : isBranch ? 13 : 12}
                      fontWeight={isRoot ? 700 : isBranch ? 600 : 400}
                      fontFamily="var(--font-display, var(--font-body, sans-serif))"
                      style={{ pointerEvents: 'none' }}
                    >
                      {node.text.length > 28 ? `${node.text.slice(0, 26)}...` : node.text}
                    </text>
                  )}

                  {/* [[Wiki-link]] Pill / Indicator */}
                  {node.wikiLink && !isEditing && (
                    <g
                      transform={`translate(${node.width / 2 - 14}, ${-node.height / 2 + 10})`}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onNavigateWikiLink && node.wikiLink) {
                          onNavigateWikiLink(node.wikiLink);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <title>{`Open linked note: ${node.wikiLink}`}</title>
                      <circle cx="0" cy="0" r="8" fill="var(--accent-secondary, #ec4899)" />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        🔗
                      </text>
                    </g>
                  )}

                  {/* Collapse / Expand Toggle Button for parent branches */}
                  {hasChildren && !isRoot && (
                    <g
                      transform={`translate(${node.side === 'right' ? node.width / 2 + 12 : -node.width / 2 - 12}, 0)`}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => handleToggleCollapse(node.id, e)}
                      style={{ cursor: 'pointer' }}
                    >
                      <title>{isCollapsed ? 'Expand branch' : 'Collapse branch'}</title>
                      <circle
                        cx="0"
                        cy="0"
                        r="9"
                        fill="var(--glass-bg, rgba(30, 41, 59, 0.9))"
                        stroke="var(--glass-border, rgba(255, 255, 255, 0.3))"
                        strokeWidth="1.5"
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="var(--text-primary, #ffffff)"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        {isCollapsed ? '+' : '−'}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Quick Help Overlay Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '12px',
          fontSize: '0.72rem',
          color: 'var(--text-secondary)',
          background: 'rgba(0, 0, 0, 0.45)',
          padding: '4px 10px',
          borderRadius: '6px',
          backdropFilter: 'blur(8px)',
          pointerEvents: 'none',
        }}
      >
        <span>
          <strong>Tab:</strong> Add Child | <strong>Enter:</strong> Add Sibling | <strong>Del:</strong> Delete |{' '}
          <strong>Double-click:</strong> Edit | <strong>Drag:</strong> Pan / Move Node
        </span>
      </div>
    </div>
  );
};
