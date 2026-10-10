import { connection, NextRequest, NextResponse } from "next/server";
import {
  isSavedRunInput,
  listSavedRuns,
  saveRun,
} from "@/lib/saved-runs";

export async function GET() {
  try {
    await connection();
    return NextResponse.json({ runs: listSavedRuns() });
  } catch (error) {
    console.error("Could not load shared PulseCity runs.", error);
    return NextResponse.json(
      { error: "Could not load shared runs." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 8_192) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 8_192) {
      return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!isSavedRunInput(body)) {
    return NextResponse.json({ error: "Run data is invalid." }, { status: 400 });
  }

  try {
    const run = saveRun(body);
    return NextResponse.json({ run }, { status: 201 });
  } catch (error) {
    console.error("Could not save shared PulseCity run.", error);
    return NextResponse.json(
      { error: "Could not save the run." },
      { status: 500 }
    );
  }
}
