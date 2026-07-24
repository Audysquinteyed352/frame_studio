import React from "react";
import { Composition } from "remotion";
import { Scene1 } from "./Scene1";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={Scene1}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
