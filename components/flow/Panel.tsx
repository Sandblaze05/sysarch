import React, { useEffect, useRef, useState, useMemo } from 'react';
import gsap from 'gsap';
import { nodeRegistry } from '@/registry';
import { NodeCategory, NodeDefinition } from '@/types/node';
import { useFlowStore } from '@/store/flowStore';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  GripVertical,
  MonitorSmartphone,
  Network,
  Shield,
  Server,
  Cpu,
  Zap,
  Database as DatabaseIcon,
  Layers,
  HardDrive,
  Activity,
  Bot,
  ExternalLink,
  Boxes,
  X,
} from 'lucide-react';

const POSITIONS = {
  open: 0,
  closed: -310,  // Tucks the panel away leaving ~50px edge peek visible
  hover: -285,   // Smooth 25px preview slide on hover when closed
};

// Category Metadata: Labels, Icons, and Accent Colors
const CATEGORY_META: Record<
  NodeCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }
> = {
  [NodeCategory.CLIENT]: {
    label: 'Clients',
    icon: MonitorSmartphone,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
  },
  [NodeCategory.NETWORK]: {
    label: 'Network & Routing',
    icon: Network,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  },
  [NodeCategory.SECURITY]: {
    label: 'Security',
    icon: Shield,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
  },
  [NodeCategory.SERVICE]: {
    label: 'Services & APIs',
    icon: Server,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  },
  [NodeCategory.COMPUTE]: {
    label: 'Compute & Workers',
    icon: Cpu,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  },
  [NodeCategory.CACHE]: {
    label: 'Caching',
    icon: Zap,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  },
  [NodeCategory.DATABASE]: {
    label: 'Databases',
    icon: DatabaseIcon,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
  },
  [NodeCategory.MESSAGE_QUEUE]: {
    label: 'Messaging & Queues',
    icon: Layers,
    color: 'text-fuchsia-400',
    bg: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400',
  },
  [NodeCategory.STORAGE]: {
    label: 'Object Storage',
    icon: HardDrive,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
  },
  [NodeCategory.MONITORING]: {
    label: 'Monitoring & Logs',
    icon: Activity,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  },
  [NodeCategory.AI]: {
    label: 'AI & Intelligence',
    icon: Bot,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  },
  [NodeCategory.EXTERNAL]: {
    label: 'External Services',
    icon: ExternalLink,
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400',
  },
};

const Panel = () => {
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const addNode = useFlowStore((state) => state.addNode);

  const panelRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<SVGSVGElement>(null);

  // Retrieve all nodes from registry
  const allNodes = useMemo(() => nodeRegistry.getAll(), []);

  // Filter nodes based on search query
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return allNodes;
    const query = searchQuery.toLowerCase().trim();
    return allNodes.filter(
      (node) =>
        node.label.toLowerCase().includes(query) ||
        node.type.toLowerCase().includes(query) ||
        node.category.toLowerCase().includes(query) ||
        (node.description && node.description.toLowerCase().includes(query))
    );
  }, [allNodes, searchQuery]);

  // Group filtered nodes by category
  const nodesByCategory = useMemo(() => {
    const grouped: Partial<Record<NodeCategory, NodeDefinition[]>> = {};

    filteredNodes.forEach((node) => {
      if (!grouped[node.category]) {
        grouped[node.category] = [];
      }
      grouped[node.category]!.push(node);
    });

    return grouped;
  }, [filteredNodes]);

  // Toggle category collapse
  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Drag start handler for ReactFlow drag & drop
  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Main slide animation on state change
  useEffect(() => {
    if (!panelRef.current) return;

    gsap.to(panelRef.current, {
      x: isPanelOpen ? POSITIONS.open : POSITIONS.closed,
      duration: 0.45,
      ease: 'power3.out',
      overwrite: 'auto',
    });

    if (iconRef.current) {
      gsap.to(iconRef.current, {
        rotate: isPanelOpen ? 0 : 225,
        duration: 0.35,
        delay: 0.2,
        ease: 'back.out(1.5)',
      });
    }
  }, [isPanelOpen]);

  // Hover peek when panel is closed
  const handleMouseEnter = () => {
    if (!isPanelOpen && panelRef.current) {
      gsap.to(panelRef.current, {
        x: POSITIONS.hover,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
  };

  // Return to full close on mouse leave
  const handleMouseLeave = () => {
    if (!isPanelOpen && panelRef.current) {
      gsap.to(panelRef.current, {
        x: POSITIONS.closed,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
  };

  // Allow users to click anywhere on the peek area to open the panel
  const handlePanelClick = () => {
    if (!isPanelOpen) {
      setIsPanelOpen(true);
    }
  };

  return (
    <div
      ref={panelRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handlePanelClick}
      className={`fixed flex flex-col p-5 z-50 top-1/2 -translate-y-1/2 left-6 h-130 w-90 bg-black/80 backdrop-blur-md border border-white/15 rounded-2xl shadow-2xl transition-shadow duration-300 select-none ${
        !isPanelOpen ? 'cursor-pointer hover:border-white/30' : ''
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center w-full border-b border-white/10 pb-4 mb-4 shrink-0">
        <h1 className="text-xl font-semibold font-mono text-white tracking-widest">Panel</h1>
        <button
          type="button"
          aria-label={isPanelOpen ? 'Close panel' : 'Open panel'}
          onClick={(e) => {
            e.stopPropagation();
            setIsPanelOpen((prev) => !prev);
          }}
          className="p-1.5 rounded-lg hover:text-white/10 transition-colors focus:outline-none"
        >
          <svg
            ref={iconRef}
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#a3a3a3"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="hover:stroke-white transition-colors"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-3 shrink-0">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-8 py-1.5 bg-neutral-900/90 border border-white/10 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 transition-all font-sans"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
        {Object.keys(nodesByCategory).length === 0 ? (
          <div className="text-center py-6 text-neutral-500 text-xs font-mono">
            No components match "{searchQuery}"
          </div>
        ) : (
          (Object.entries(nodesByCategory) as [NodeCategory, NodeDefinition[]][]).map(
            ([category, categoryNodes]) => {
              const meta = CATEGORY_META[category] || {
                label: category,
                icon: Boxes,
                color: 'text-neutral-400',
                bg: 'bg-neutral-800 text-neutral-400 border-neutral-700',
              };
              const CategoryIcon = meta.icon;
              const isCollapsed = collapsedCategories[category];

              return (
                <div key={category} className="space-y-1.5">
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-white/5 text-neutral-300 hover:text-white transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CategoryIcon className={`w-3.5 h-3.5 shrink-0 ${meta.color}`} />
                      <span className="text-xs font-semibold font-mono tracking-wide truncate">
                        {meta.label}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500 group-hover:text-neutral-400">
                        ({categoryNodes.length})
                      </span>
                    </div>
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                    )}
                  </button>

                  {/* Category Nodes */}
                  {!isCollapsed && (
                    <div className="space-y-1.5 pl-1">
                      {categoryNodes.map((node) => {
                        const IconComponent = node.icon;
                        return (
                          <div
                            key={node.type}
                            draggable
                            onDragStart={(e) => handleDragStart(e, node.type)}
                            onClick={() => addNode(node.type)}
                            className="group flex items-center justify-between p-2 rounded-xl bg-neutral-900/60 border border-white/5 hover:border-white/20 hover:bg-neutral-800/80 transition-all cursor-grab active:cursor-grabbing shadow-sm"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <GripVertical className="w-3 h-3 text-neutral-600 group-hover:text-neutral-400 shrink-0" />
                              {IconComponent && (
                                <div
                                  className={`p-1 rounded-lg border shrink-0 ${meta.bg}`}
                                >
                                  <IconComponent className="w-3.5 h-3.5" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="text-xs font-medium text-neutral-200 group-hover:text-white truncate">
                                  {node.label}
                                </h4>
                                {node.description && (
                                  <p className="text-[10px] text-neutral-500 truncate max-w-[170px]">
                                    {node.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              aria-label={`Add ${node.label}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                addNode(node.type);
                              }}
                              className="p-1 rounded-md text-neutral-500 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
          )
        )}
      </div>
    </div>
  );
};

export default Panel;