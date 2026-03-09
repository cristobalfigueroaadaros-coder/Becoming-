import { ValueMapCanvas } from './value-map/ValueMapCanvas';
import { MicroGuide } from "@/components/MicroGuide";

interface PurposeToValueMapProps {
  userPurpose: string | null;
}

export const PurposeToValueMap = ({ userPurpose }: PurposeToValueMapProps) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <MicroGuide
          guideKey="value_map"
          title="Business Plan"
          description={"This space helps transform your idea into a real business plan.\n\nHere your idea gains structure, substance, and direction to create value and operate as a sustainable project."}
        />
      </div>
      <ValueMapCanvas />
    </div>
  );
};
