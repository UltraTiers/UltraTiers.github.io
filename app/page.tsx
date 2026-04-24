import { SiteShell } from "@/components/site-shell";
import { fetchPlayers } from "@/lib/api";

export default async function Home() {
  const players = await fetchPlayers();

  return <SiteShell initialPlayers={players} />;
}
