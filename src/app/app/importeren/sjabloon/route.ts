import { huidigeOnderneming } from "@/lib/db";
import { maakSjabloon } from "@/lib/import/excel";

export async function GET() {
  await huidigeOnderneming();
  const buffer = await maakSjabloon();
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="boekhoudbot-sjabloon.xlsx"',
    },
  });
}
