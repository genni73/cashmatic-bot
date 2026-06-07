import { Composition } from "remotion";
import { CashmaticTikTok } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CashmaticTikTok"
      component={CashmaticTikTok}
      durationInFrames={1230}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
