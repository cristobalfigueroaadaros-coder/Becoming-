import { ValueMapCanvas } from './value-map/ValueMapCanvas';

interface PurposeToValueMapProps {
  userPurpose: string | null;
}

export const PurposeToValueMap = ({ userPurpose }: PurposeToValueMapProps) => {
  return <ValueMapCanvas />;
};
