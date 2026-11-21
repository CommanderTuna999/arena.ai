import StartScreen from "@/components/StartScreen";
import VersionGuard from "@/components/VersionGuard";

export default function HomePage() {
  return (
    <>
      <VersionGuard />
      <StartScreen />
    </>
  );
}
