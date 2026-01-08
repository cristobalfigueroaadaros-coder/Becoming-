import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CreativeSpaceTile {
  id: string;
  user_id: string;
  project_id: string | null;
  tile_type: 'insight' | 'note';
  title: string;
  content: string | null;
  source_type: string | null;
  source_id: string | null;
  source_label: string | null;
  position_x: number;
  position_y: number;
  color: string;
  page_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreativeSpaceConnection {
  id: string;
  user_id: string;
  project_id: string;
  from_tile_id: string;
  to_tile_id: string;
  connection_color: string;
  page_id: string | null;
  created_at: string;
}

export interface CreativeSpacePage {
  id: string;
  user_id: string;
  project_id: string;
  page_name: string;
  page_order: number;
  created_at: string;
}

export interface CreativeSpacePattern {
  id: string;
  user_id: string;
  project_id: string;
  pattern_description: string;
  related_tile_ids: string[];
  dismissed: boolean;
  engaged_at: string | null;
  created_at: string;
}

interface UseCreativeSpaceReturn {
  tiles: CreativeSpaceTile[];
  connections: CreativeSpaceConnection[];
  pages: CreativeSpacePage[];
  patterns: CreativeSpacePattern[];
  currentPage: CreativeSpacePage | null;
  loading: boolean;
  unassignedTiles: CreativeSpaceTile[];
  
  // Tile operations
  addInsightTile: (title: string, content: string, sourceType: string, sourceLabel: string, position?: {x: number, y: number}) => Promise<void>;
  addNoteTile: (content?: string, position?: {x: number, y: number}) => Promise<void>;
  updateTilePosition: (tileId: string, x: number, y: number) => Promise<void>;
  updateTileContent: (tileId: string, title: string, content?: string) => Promise<void>;
  updateTileColor: (tileId: string, color: string) => Promise<void>;
  deleteTile: (tileId: string) => Promise<void>;
  assignTileToProject: (tileId: string) => Promise<void>;
  
  // Connection operations
  addConnection: (fromTileId: string, toTileId: string, color?: string) => Promise<void>;
  deleteConnection: (connectionId: string) => Promise<void>;
  
  // Page operations
  addPage: () => Promise<void>;
  renamePage: (pageId: string, name: string) => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;
  setCurrentPage: (pageId: string) => void;
  
  // Pattern operations
  dismissPattern: (patternId: string) => Promise<void>;
  engagePattern: (patternId: string) => Promise<void>;
  
  refetch: () => Promise<void>;
}

export function useCreativeSpace(projectId: string | null): UseCreativeSpaceReturn {
  const [tiles, setTiles] = useState<CreativeSpaceTile[]>([]);
  const [connections, setConnections] = useState<CreativeSpaceConnection[]>([]);
  const [pages, setPages] = useState<CreativeSpacePage[]>([]);
  const [patterns, setPatterns] = useState<CreativeSpacePattern[]>([]);
  const [currentPage, setCurrentPageState] = useState<CreativeSpacePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [unassignedTiles, setUnassignedTiles] = useState<CreativeSpaceTile[]>([]);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch pages
      const { data: pagesData } = await supabase
        .from('creative_space_pages')
        .select('*')
        .eq('project_id', projectId)
        .order('page_order', { ascending: true });

      let activePage: CreativeSpacePage | null = null;

      if (!pagesData || pagesData.length === 0) {
        // Create default page
        const { data: newPage } = await supabase
          .from('creative_space_pages')
          .insert({
            user_id: user.id,
            project_id: projectId,
            page_name: 'Ideas',
            page_order: 0
          })
          .select()
          .single();
        
        if (newPage) {
          setPages([newPage as CreativeSpacePage]);
          activePage = newPage as CreativeSpacePage;
        }
      } else {
        setPages(pagesData as CreativeSpacePage[]);
        activePage = pagesData[0] as CreativeSpacePage;
      }

      if (activePage && !currentPage) {
        setCurrentPageState(activePage);
      }

      // Fetch tiles for current page
      const { data: tilesData } = await supabase
        .from('creative_space_tiles')
        .select('*')
        .eq('project_id', projectId);

      setTiles((tilesData || []) as CreativeSpaceTile[]);

      // Fetch connections
      const { data: connectionsData } = await supabase
        .from('creative_space_connections')
        .select('*')
        .eq('project_id', projectId);

      setConnections((connectionsData || []) as CreativeSpaceConnection[]);

      // Fetch patterns
      const { data: patternsData } = await supabase
        .from('creative_space_patterns')
        .select('*')
        .eq('project_id', projectId)
        .eq('dismissed', false);

      setPatterns((patternsData || []) as CreativeSpacePattern[]);

      // Fetch unassigned tiles (inbox) - tiles with no project
      const { data: unassignedData } = await supabase
        .from('creative_space_tiles')
        .select('*')
        .eq('user_id', user.id)
        .is('project_id', null);

      setUnassignedTiles((unassignedData || []) as CreativeSpaceTile[]);

    } catch (error) {
      console.error('Error fetching creative space data:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addInsightTile = async (
    title: string, 
    content: string, 
    sourceType: string, 
    sourceLabel: string,
    position?: {x: number, y: number}
  ) => {
    if (!projectId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newPosition = position || { 
      x: 100 + Math.random() * 200, 
      y: 100 + Math.random() * 200 
    };

    const { data, error } = await supabase
      .from('creative_space_tiles')
      .insert({
        user_id: user.id,
        project_id: projectId,
        tile_type: 'insight',
        title,
        content,
        source_type: sourceType,
        source_label: sourceLabel,
        position_x: newPosition.x,
        position_y: newPosition.y,
        page_id: currentPage?.id,
        color: '#60a5fa'
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to add insight');
      return;
    }

    setTiles(prev => [...prev, data as CreativeSpaceTile]);
  };

  const addNoteTile = async (initialTitle?: string, position?: {x: number, y: number}) => {
    if (!projectId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newPosition = position || { 
      x: 150 + Math.random() * 200, 
      y: 150 + Math.random() * 200 
    };

    const { data, error } = await supabase
      .from('creative_space_tiles')
      .insert({
        user_id: user.id,
        project_id: projectId,
        tile_type: 'note',
        title: initialTitle || 'New Note',
        content: '',
        position_x: newPosition.x,
        position_y: newPosition.y,
        page_id: currentPage?.id,
        color: '#fbbf24'
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to add note');
      return;
    }

    setTiles(prev => [...prev, data as CreativeSpaceTile]);
  };

  const updateTilePosition = async (tileId: string, x: number, y: number) => {
    const { error } = await supabase
      .from('creative_space_tiles')
      .update({ position_x: x, position_y: y })
      .eq('id', tileId);

    if (!error) {
      setTiles(prev => prev.map(t => 
        t.id === tileId ? { ...t, position_x: x, position_y: y } : t
      ));
    }
  };

  const updateTileContent = async (tileId: string, title: string, content?: string) => {
    const { error } = await supabase
      .from('creative_space_tiles')
      .update({ title, content })
      .eq('id', tileId);

    if (!error) {
      setTiles(prev => prev.map(t => 
        t.id === tileId ? { ...t, title, content: content ?? t.content } : t
      ));
    }
  };

  const updateTileColor = async (tileId: string, color: string) => {
    const { error } = await supabase
      .from('creative_space_tiles')
      .update({ color })
      .eq('id', tileId);

    if (!error) {
      setTiles(prev => prev.map(t => 
        t.id === tileId ? { ...t, color } : t
      ));
    }
  };

  const deleteTile = async (tileId: string) => {
    const { error } = await supabase
      .from('creative_space_tiles')
      .delete()
      .eq('id', tileId);

    if (!error) {
      setTiles(prev => prev.filter(t => t.id !== tileId));
      setUnassignedTiles(prev => prev.filter(t => t.id !== tileId));
      setConnections(prev => prev.filter(c => 
        c.from_tile_id !== tileId && c.to_tile_id !== tileId
      ));
    }
  };

  const assignTileToProject = async (tileId: string) => {
    if (!projectId) {
      toast.error('No project selected');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('creative_space_tiles')
      .update({ 
        project_id: projectId,
        page_id: currentPage?.id || null
      })
      .eq('id', tileId);

    if (error) {
      toast.error('Failed to assign tile');
      return;
    }

    // Move tile from unassigned to tiles
    const tile = unassignedTiles.find(t => t.id === tileId);
    if (tile) {
      const updatedTile = { ...tile, project_id: projectId, page_id: currentPage?.id || null };
      setUnassignedTiles(prev => prev.filter(t => t.id !== tileId));
      setTiles(prev => [...prev, updatedTile]);
      toast.success('Tile added to this project');
    }
  };

  const addConnection = async (fromTileId: string, toTileId: string, color?: string) => {
    if (!projectId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if connection already exists
    const exists = connections.some(c => 
      (c.from_tile_id === fromTileId && c.to_tile_id === toTileId) ||
      (c.from_tile_id === toTileId && c.to_tile_id === fromTileId)
    );

    if (exists) return;

    const { data, error } = await supabase
      .from('creative_space_connections')
      .insert({
        user_id: user.id,
        project_id: projectId,
        from_tile_id: fromTileId,
        to_tile_id: toTileId,
        connection_color: color || '#a78bfa',
        page_id: currentPage?.id
      })
      .select()
      .single();

    if (!error && data) {
      setConnections(prev => [...prev, data as CreativeSpaceConnection]);
    }
  };

  const deleteConnection = async (connectionId: string) => {
    const { error } = await supabase
      .from('creative_space_connections')
      .delete()
      .eq('id', connectionId);

    if (!error) {
      setConnections(prev => prev.filter(c => c.id !== connectionId));
    }
  };

  const addPage = async () => {
    if (!projectId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newOrder = pages.length;
    const { data, error } = await supabase
      .from('creative_space_pages')
      .insert({
        user_id: user.id,
        project_id: projectId,
        page_name: `Page ${newOrder + 1}`,
        page_order: newOrder
      })
      .select()
      .single();

    if (!error && data) {
      setPages(prev => [...prev, data as CreativeSpacePage]);
      setCurrentPageState(data as CreativeSpacePage);
    }
  };

  const renamePage = async (pageId: string, name: string) => {
    const { error } = await supabase
      .from('creative_space_pages')
      .update({ page_name: name })
      .eq('id', pageId);

    if (!error) {
      setPages(prev => prev.map(p => 
        p.id === pageId ? { ...p, page_name: name } : p
      ));
    }
  };

  const deletePage = async (pageId: string) => {
    if (pages.length <= 1) {
      toast.error('Cannot delete the only page');
      return;
    }

    const { error } = await supabase
      .from('creative_space_pages')
      .delete()
      .eq('id', pageId);

    if (!error) {
      setPages(prev => prev.filter(p => p.id !== pageId));
      if (currentPage?.id === pageId) {
        setCurrentPageState(pages.find(p => p.id !== pageId) || null);
      }
    }
  };

  const setCurrentPage = (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (page) {
      setCurrentPageState(page);
    }
  };

  const dismissPattern = async (patternId: string) => {
    const { error } = await supabase
      .from('creative_space_patterns')
      .update({ dismissed: true })
      .eq('id', patternId);

    if (!error) {
      setPatterns(prev => prev.filter(p => p.id !== patternId));
    }
  };

  const engagePattern = async (patternId: string) => {
    const { error } = await supabase
      .from('creative_space_patterns')
      .update({ engaged_at: new Date().toISOString() })
      .eq('id', patternId);

    if (!error) {
      setPatterns(prev => prev.map(p => 
        p.id === patternId ? { ...p, engaged_at: new Date().toISOString() } : p
      ));
    }
  };

  return {
    tiles,
    connections,
    pages,
    patterns,
    currentPage,
    loading,
    unassignedTiles,
    addInsightTile,
    addNoteTile,
    updateTilePosition,
    updateTileContent,
    updateTileColor,
    deleteTile,
    assignTileToProject,
    addConnection,
    deleteConnection,
    addPage,
    renamePage,
    deletePage,
    setCurrentPage,
    dismissPattern,
    engagePattern,
    refetch: fetchData
  };
}
