import { useNavigate } from "react-router-dom";
import { BcomingSystemVideo } from "@/components/onboarding/BcomingSystemVideo";

const BcomingSystemVideoPreview = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-cosmic pb-24 pt-3">
      <BcomingSystemVideo onNext={() => navigate("/atlas/quest")} />
    </main>
  );
};

export default BcomingSystemVideoPreview;
