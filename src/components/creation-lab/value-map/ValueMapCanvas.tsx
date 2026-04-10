import { useValueMap, BLOCK_CONFIGS } from '@/hooks/useValueMap';
import { ValueMapBlock } from './ValueMapBlock';
import { ValueMapProgress } from './ValueMapProgress';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, GitBranch } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

export const ValueMapCanvas = () => {
  const {
    blocks,
    suggestions,
    loading,
    analyzing,
    progress,
    filledCount,
    unlockedCount,
    getBlockByKey,
    getSuggestionsForBlock,
    unlockBlock,
    updateBlockContent,
    acceptSuggestion,
    discardSuggestion,
    analyzeAndGenerateSuggestions,
    checkDesignThinkingAutoPopulate,
    refresh
  } = useValueMap();

  const [syncing, setSyncing] = useState(false);

  const handleDTSync = async () => {
    setSyncing(true);
    await checkDesignThinkingAutoPopulate();
    setSyncing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const foundationBlocks = BLOCK_CONFIGS.filter(c => c.category === 'foundation');
  const peopleBlocks = BLOCK_CONFIGS.filter(c => c.category === 'people');
  const valueBlocks = BLOCK_CONFIGS.filter(c => c.category === 'value');
  const distributionBlocks = BLOCK_CONFIGS.filter(c => c.category === 'distribution');

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Business Plan</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Build a clear plan for your project or business
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ValueMapProgress 
            progress={progress} 
            filled={filledCount} 
            unlocked={unlockedCount} 
            total={13} 
          />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDTSync}
              disabled={syncing}
              title="Sync suggestions from your Design Thinking phases"
            >
              {syncing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <GitBranch className="w-4 h-4 mr-2" />
              )}
              Sync from Design Thinking
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={analyzeAndGenerateSuggestions}
              disabled={analyzing}
            >
              {analyzing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Generate Suggestions
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas Grid */}
      <div className="space-y-4">
        {/* Foundation Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-violet-500" />
            <h3 className="text-sm font-medium text-violet-500 uppercase tracking-wide">
              Foundation — Meaning
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {foundationBlocks.map(config => (
              <ValueMapBlock
                key={config.key}
                config={config}
                block={getBlockByKey(config.key)}
                suggestions={getSuggestionsForBlock(config.key)}
                onUnlock={() => unlockBlock(config.key, 'manual')}
                onUpdate={(content) => updateBlockContent(config.key, content)}
                onAcceptSuggestion={acceptSuggestion}
                onDiscardSuggestion={discardSuggestion}
              />
            ))}
          </div>
        </motion.div>

        {/* People & Problem Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <h3 className="text-sm font-medium text-blue-500 uppercase tracking-wide">
              People & Problem
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {peopleBlocks.map(config => (
              <ValueMapBlock
                key={config.key}
                config={config}
                block={getBlockByKey(config.key)}
                suggestions={getSuggestionsForBlock(config.key)}
                onUnlock={() => unlockBlock(config.key, 'manual')}
                onUpdate={(content) => updateBlockContent(config.key, content)}
                onAcceptSuggestion={acceptSuggestion}
                onDiscardSuggestion={discardSuggestion}
              />
            ))}
          </div>
        </motion.div>

        {/* Value Creation Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-medium text-emerald-500 uppercase tracking-wide">
              Value Creation
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {valueBlocks.map(config => (
              <ValueMapBlock
                key={config.key}
                config={config}
                block={getBlockByKey(config.key)}
                suggestions={getSuggestionsForBlock(config.key)}
                onUnlock={() => unlockBlock(config.key, 'manual')}
                onUpdate={(content) => updateBlockContent(config.key, content)}
                onAcceptSuggestion={acceptSuggestion}
                onDiscardSuggestion={discardSuggestion}
              />
            ))}
          </div>
        </motion.div>

        {/* Distribution & Money Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <h3 className="text-sm font-medium text-amber-500 uppercase tracking-wide">
              Distribution & Money
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {distributionBlocks.map(config => (
              <ValueMapBlock
                key={config.key}
                config={config}
                block={getBlockByKey(config.key)}
                suggestions={getSuggestionsForBlock(config.key)}
                onUnlock={() => unlockBlock(config.key, 'manual')}
                onUpdate={(content) => updateBlockContent(config.key, content)}
                onAcceptSuggestion={acceptSuggestion}
                onDiscardSuggestion={discardSuggestion}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
