interface DotConnection {
  id: string;
  dot_id_1: string;
  dot_id_2: string;
  connection_type: string;
  connection_insight: string;
  ai_generated: boolean;
}

interface InsightDot {
  id: string;
  core_theme: string;
  insight_text: string;
  [key: string]: any;
}

export interface Cluster {
  id: string;
  nodeIds: string[];
  size: number;
  density: number;
  dominantTheme: string;
  themes: Record<string, number>;
  strength: 'high' | 'medium' | 'low';
  color: string;
}

const clusterColors = [
  'hsl(280 90% 65%)', // purple
  'hsl(200 80% 60%)', // blue
  'hsl(140 75% 55%)', // green
  'hsl(45 90% 60%)',  // yellow
  'hsl(330 80% 65%)', // pink
  'hsl(160 80% 55%)', // teal
  'hsl(30 85% 60%)',  // orange
  'hsl(270 75% 65%)', // violet
];

// Union-Find data structure for clustering
class UnionFind {
  private parent: Map<string, string>;
  private rank: Map<string, number>;

  constructor(nodes: string[]) {
    this.parent = new Map();
    this.rank = new Map();
    
    nodes.forEach(node => {
      this.parent.set(node, node);
      this.rank.set(node, 0);
    });
  }

  find(node: string): string {
    if (this.parent.get(node) !== node) {
      this.parent.set(node, this.find(this.parent.get(node)!));
    }
    return this.parent.get(node)!;
  }

  union(node1: string, node2: string): void {
    const root1 = this.find(node1);
    const root2 = this.find(node2);

    if (root1 === root2) return;

    const rank1 = this.rank.get(root1)!;
    const rank2 = this.rank.get(root2)!;

    if (rank1 < rank2) {
      this.parent.set(root1, root2);
    } else if (rank1 > rank2) {
      this.parent.set(root2, root1);
    } else {
      this.parent.set(root2, root1);
      this.rank.set(root1, rank1 + 1);
    }
  }

  getClusters(): Map<string, string[]> {
    const clusters = new Map<string, string[]>();
    
    this.parent.forEach((_, node) => {
      const root = this.find(node);
      if (!clusters.has(root)) {
        clusters.set(root, []);
      }
      clusters.get(root)!.push(node);
    });

    return clusters;
  }
}

export function detectClusters(
  dots: InsightDot[],
  connections: DotConnection[],
  minClusterSize: number = 3
): Cluster[] {
  if (dots.length === 0 || connections.length === 0) {
    return [];
  }

  // Build adjacency list to count connections per node
  const adjacencyList = new Map<string, Set<string>>();
  const nodeIds = dots.map(d => d.id);
  
  nodeIds.forEach(id => {
    adjacencyList.set(id, new Set());
  });

  connections.forEach(conn => {
    if (adjacencyList.has(conn.dot_id_1) && adjacencyList.has(conn.dot_id_2)) {
      adjacencyList.get(conn.dot_id_1)!.add(conn.dot_id_2);
      adjacencyList.get(conn.dot_id_2)!.add(conn.dot_id_1);
    }
  });

  // Use Union-Find to detect connected components
  const uf = new UnionFind(nodeIds);
  connections.forEach(conn => {
    uf.union(conn.dot_id_1, conn.dot_id_2);
  });

  const rawClusters = uf.getClusters();
  const clusters: Cluster[] = [];

  let colorIndex = 0;
  rawClusters.forEach((nodeIds, root) => {
    // Filter out small clusters
    if (nodeIds.length < minClusterSize) {
      return;
    }

    // Calculate cluster metrics
    const clusterDots = dots.filter(d => nodeIds.includes(d.id));
    
    // Count themes in cluster
    const themeCount: Record<string, number> = {};
    clusterDots.forEach(dot => {
      const theme = dot.core_theme || 'General';
      themeCount[theme] = (themeCount[theme] || 0) + 1;
    });

    // Find dominant theme
    let dominantTheme = 'Mixed';
    let maxCount = 0;
    Object.entries(themeCount).forEach(([theme, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantTheme = theme;
      }
    });

    // Calculate cluster density (connections / possible connections)
    let internalConnections = 0;
    connections.forEach(conn => {
      if (nodeIds.includes(conn.dot_id_1) && nodeIds.includes(conn.dot_id_2)) {
        internalConnections++;
      }
    });

    const possibleConnections = (nodeIds.length * (nodeIds.length - 1)) / 2;
    const density = possibleConnections > 0 ? internalConnections / possibleConnections : 0;

    // Determine cluster strength based on size and density
    let strength: 'high' | 'medium' | 'low';
    if (nodeIds.length >= 5 && density > 0.5) {
      strength = 'high';
    } else if (nodeIds.length >= 4 || density > 0.3) {
      strength = 'medium';
    } else {
      strength = 'low';
    }

    clusters.push({
      id: root,
      nodeIds,
      size: nodeIds.length,
      density: Math.round(density * 100) / 100,
      dominantTheme,
      themes: themeCount,
      strength,
      color: clusterColors[colorIndex % clusterColors.length],
    });

    colorIndex++;
  });

  // Sort clusters by strength and size
  return clusters.sort((a, b) => {
    const strengthOrder = { high: 3, medium: 2, low: 1 };
    if (strengthOrder[a.strength] !== strengthOrder[b.strength]) {
      return strengthOrder[b.strength] - strengthOrder[a.strength];
    }
    return b.size - a.size;
  });
}

export function getClusterForNode(nodeId: string, clusters: Cluster[]): Cluster | null {
  return clusters.find(cluster => cluster.nodeIds.includes(nodeId)) || null;
}
