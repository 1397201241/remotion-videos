import { Composition, Folder } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { Logo } from "./HelloWorld/Logo";
import { Title } from "./HelloWorld/Title";
import { BrakeEmergency } from "./compositions/BrakeEmergency/BrakeEmergency";
import { TaskSeparation } from "./compositions/TaskSeparation/TaskSeparation";
import { TaskSeparationCover } from "./compositions/TaskSeparation/Cover";
import { DUR_OUT as TS_DUR, FPS as TS_FPS } from "./compositions/TaskSeparation/lib";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Elements">
        <Composition
          id="Logo"
          component={Logo}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            logoColor1: "#91EAE4",
            logoColor2: "#86A8E7",
          }}
        />
        <Composition
          id="Title"
          component={Title}
          durationInFrames={115}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{
            titleText: "Welcome to Remotion",
            titleColor: "#000000",
          }}
        />
      </Folder>
      <Composition
        // You can take the "id" to render a video:
        // bunx remotion render HelloWorld
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        // You can override these props for each render:
        // https://www.remotion.dev/docs/parametrized-rendering
        defaultProps={{
          titleText: "Welcome to Remotion",
          titleColor: "#000000",
        }}
      />

      <Composition
        id="BrakeEmergency"
        component={BrakeEmergency}
        durationInFrames={750}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          primaryColor: "#FF4444",
        }}
      />

      <Folder name="TaskSeparation">
        <Composition
          id="TaskSeparation"
          component={TaskSeparation}
          durationInFrames={Math.round(TS_DUR * TS_FPS)}
          fps={TS_FPS}
          width={1280}
          height={720}
        />
        <Composition
          id="TaskSeparationCover34"
          component={TaskSeparationCover}
          durationInFrames={1}
          fps={30}
          width={1080}
          height={1440}
          defaultProps={{ layout: "34" as const }}
        />
        <Composition
          id="TaskSeparationCover43"
          component={TaskSeparationCover}
          durationInFrames={1}
          fps={30}
          width={1440}
          height={1080}
          defaultProps={{ layout: "43" as const }}
        />
      </Folder>
    </>
  );
};
