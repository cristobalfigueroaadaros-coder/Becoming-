import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const LifeDomainsCard = () => {
  const [domains, setDomains] = useState<any[]>([]);

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("life_domains")
      .select("*")
      .eq("user_id", user.id)
      .limit(4);

    if (data) setDomains(data);
  };

  const maxScore = Math.max(...domains.map(d => d.current_score), 1);

  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <svg viewBox="0 0 200 200" className="w-full max-w-[200px]">
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((scale, i) => (
          <polygon
            key={i}
            points="100,30 170,100 100,170 30,100"
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            opacity="0.3"
            transform={`translate(100, 100) scale(${scale}) translate(-100, -100)`}
          />
        ))}

        {/* Data polygon */}
        {domains.length >= 3 && (
          <polygon
            points={domains
              .slice(0, 4)
              .map((d, i) => {
                const angle = (i * Math.PI) / 2 - Math.PI / 2;
                const radius = 70 * (d.current_score / maxScore);
                const x = 100 + radius * Math.cos(angle);
                const y = 100 + radius * Math.sin(angle);
                return `${x},${y}`;
              })
              .join(" ")}
            fill="hsl(var(--primary) / 0.3)"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
          />
        )}

        {/* Labels */}
        {domains.slice(0, 4).map((d, i) => {
          const angle = (i * Math.PI) / 2 - Math.PI / 2;
          const x = 100 + 85 * Math.cos(angle);
          const y = 100 + 85 * Math.sin(angle);
          return (
            <text
              key={d.id}
              x={x}
              y={y}
              fill="hsl(var(--foreground))"
              fontSize="12"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {d.domain_name.toUpperCase()}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default LifeDomainsCard;
