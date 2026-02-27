import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";

const IntakeNotification = () => {
  const navigate = useNavigate();

  return (
    <motion.button
      onClick={() => navigate("/council?view=intake")}
      className="w-full flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors text-left"
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <MessageCircle className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground text-sm">Console — Phase 2 Intake</p>
        <p className="text-xs text-muted-foreground truncate">Tap to continue your setup</p>
      </div>
      <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shrink-0" />
    </motion.button>
  );
};

export default IntakeNotification;
